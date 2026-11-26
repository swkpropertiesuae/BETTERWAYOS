import crypto from 'node:crypto';
import type { HikvisionEventPayload, SessionUser } from '@/lib/domain/types';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { todayDubaiIso } from '@/lib/pipeline/service';

function getHikSecret(): string {
  return process.env.BW_HIKVISION_HMAC_SECRET || 'dev-betterway-hikvision-secret';
}

function getQrSecret(): string {
  return process.env.BW_SESSION_SECRET || 'dev-betterway-qr-secret';
}

export function signHikvisionPayload(rawBody: string): string {
  return `sha256=${crypto.createHmac('sha256', getHikSecret()).update(rawBody).digest('hex')}`;
}

export function verifyHikvisionSignature(rawBody: string, headerSig: string | null | undefined): boolean {
  if (!headerSig) return false;
  const expected = signHikvisionPayload(rawBody);
  const a = Buffer.from(headerSig.trim());
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/** 20-second rotating cryptographic HMAC Reception QR token. */
export function generateRotatingQrToken(nowMs = Date.now()) {
  const bucket = Math.floor(nowMs / 20_000);
  const sig = crypto.createHmac('sha256', getQrSecret()).update(`BW-QR:${bucket}`).digest('hex').slice(0, 16);
  const token = `BWQR-${bucket}-${sig}`;
  const secondsRemaining = 20 - Math.floor((nowMs % 20_000) / 1000);
  return { token, bucket, secondsRemaining };
}

export function verifyRotatingQrToken(token: string, nowMs = Date.now()): boolean {
  if (!token || !token.startsWith('BWQR-')) return false;
  const [, bucketStr, sig] = token.split('-');
  const bucket = Number(bucketStr);
  if (!Number.isFinite(bucket) || !sig) return false;
  const currentBucket = Math.floor(nowMs / 20_000);
  // Allow current window or previous 20s window for scan latency
  if (Math.abs(currentBucket - bucket) > 1) return false;
  const expected = crypto.createHmac('sha256', getQrSecret()).update(`BW-QR:${bucket}`).digest('hex').slice(0, 16);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function haversineDistanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6_371_000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function getDubaiTimeAndLateMinutes(shiftStart = '09:00', graceMinutes = 15, date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Dubai',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date);
  const h = Number(parts.find((p) => p.type === 'hour')?.value || 9);
  const m = Number(parts.find((p) => p.type === 'minute')?.value || 0);
  const dubaiTimeStr = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Dubai',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
    .format(date)
    .toUpperCase();

  const [sh, sm] = shiftStart.split(':').map(Number);
  const shiftMins = (sh || 9) * 60 + (sm || 0) + graceMinutes;
  const curMins = h * 60 + m;
  const lateMinutes = Math.max(0, curMins - shiftMins);
  return { dubaiTimeStr, lateMinutes };
}

async function postTeamGroupCheckInCard(params: {
  userId: string;
  userName: string;
  userRole: string;
  avatarUrl: string | null;
  sourceLabel: string;
  dubaiTimeStr: string;
  lateMinutes: number;
  branchName: string;
}) {
  const db = await getSupabaseAdmin();
  const statusTag = params.lateMinutes > 0 ? `Late by ${params.lateMinutes}m` : 'On Time';
  await db.from('chat_messages').insert({
    channel: 'attendance-checkin',
    sender_id: params.userId,
    sender_name: params.userName,
    sender_role: params.userRole,
    sender_avatar: params.avatarUrl || '',
    message_kind: 'CHECKIN_CARD',
    body: `✅ ${params.userName} checked in at ${params.dubaiTimeStr} GST via ${params.sourceLabel} (${params.branchName}) · ${statusTag}`,
    metadata: {
      dubaiTime: params.dubaiTimeStr,
      lateMinutes: params.lateMinutes,
      source: params.sourceLabel,
      branch: params.branchName,
    },
  });
}

/**
 * Processes an Oud Metha Hikvision door fingerprint unlock event:
 * - Single Entry Reader (default): 1st unlock of Dubai GST day = CHECK_IN + auto-post to #attendance-checkin;
 *   subsequent mid-day door unlocks = DOOR_REENTRY (no false check-out, no spam).
 * - Dual Reader: EXIT reader logs CHECK_OUT cleanly.
 */
export async function processHikvisionDoorEvent(payload: HikvisionEventPayload) {
  const db = await getSupabaseAdmin();
  const { data: user } = await db
    .from('users')
    .select('id,emp_code,name,role,avatar_url')
    .eq('emp_code', payload.employeeNoString.trim().toUpperCase())
    .eq('active', true)
    .maybeSingle();

  if (!user) throw new Error(`Unknown Hikvision employee code: ${payload.employeeNoString}`);

  const { data: branch } = await db.from('office_branches').select('*').eq('id', 'BR-OUDMETHA').maybeSingle();
  const readerMode = branch?.hikvision_reader_mode || 'SINGLE_ENTRY_READER';
  const todayDubai = todayDubaiIso();

  const { data: todaysEvents } = await db
    .from('attendance_events')
    .select('id,event_kind')
    .eq('user_id', user.id)
    .eq('attendance_date_dubai', todayDubai);

  const hasCheckedIn = (todaysEvents ?? []).some((e) => e.event_kind === 'CHECK_IN');
  let eventKind: 'CHECK_IN' | 'DOOR_REENTRY' | 'CHECK_OUT' = 'CHECK_IN';
  if (readerMode === 'DUAL_READER' && payload.readerDirection === 'EXIT' && hasCheckedIn) {
    eventKind = 'CHECK_OUT';
  } else if (hasCheckedIn) {
    eventKind = 'DOOR_REENTRY';
  }

  const when = payload.eventTime ? new Date(payload.eventTime) : new Date();
  const { dubaiTimeStr, lateMinutes } = getDubaiTimeAndLateMinutes(
    branch?.shift_start_gst || '09:00',
    branch?.grace_minutes ?? 15,
    when,
  );

  const { data: event, error } = await db
    .from('attendance_events')
    .insert({
      user_id: user.id,
      emp_code: user.emp_code,
      attendance_date_dubai: todayDubai,
      source: 'HIKVISION_DOOR',
      event_kind: eventKind,
      dubai_time_str: dubaiTimeStr,
      late_minutes: eventKind === 'CHECK_IN' ? lateMinutes : 0,
      device_serial: payload.deviceSerial || branch?.hikvision_device_serial || 'HIKVISION-OUDMETHA',
      note: `Hikvision Door (${payload.verifyMode || 'fingerprint'}) · ${readerMode}`,
    })
    .select('*')
    .single();

  if (error || !event) throw new Error(`Hikvision attendance write failed: ${error?.message}`);

  let postedGroupMessage = false;
  if (eventKind === 'CHECK_IN') {
    await postTeamGroupCheckInCard({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      avatarUrl: user.avatar_url,
      sourceLabel: 'Hikvision Door Fingerprint',
      dubaiTimeStr,
      lateMinutes,
      branchName: branch?.name || 'Al Nasr Plaza, Oud Metha',
    });
    postedGroupMessage = true;
  }

  return { event, postedGroupMessage, user };
}

export async function processOfficeQrCheckIn(params: {
  user: SessionUser;
  qrToken: string;
  clientIp?: string;
  latitude?: number;
  longitude?: number;
}) {
  if (!verifyRotatingQrToken(params.qrToken)) {
    throw new Error('Expired or invalid 20-second Reception QR code. Scan the live screen again.');
  }
  const db = await getSupabaseAdmin();
  const { data: branch } = await db.from('office_branches').select('*').eq('id', 'BR-OUDMETHA').maybeSingle();

  let distanceM: number | null = null;
  if (params.latitude !== undefined && params.longitude !== undefined && branch) {
    distanceM = haversineDistanceMeters(branch.latitude, branch.longitude, params.latitude, params.longitude);
    if (branch.geofence_lock_enabled && distanceM > Number(branch.geofence_radius_m || 150)) {
      throw new Error(`Outside Al Nasr Plaza Oud Metha geofence (${distanceM}m away; max ${branch.geofence_radius_m}m).`);
    }
  }

  if (branch?.wifi_lock_enabled && branch.office_ip_cidr && params.clientIp) {
    const allowedPrefix = branch.office_ip_cidr.split('/')[0];
    if (allowedPrefix && !params.clientIp.includes(allowedPrefix)) {
      throw new Error(`Office Wi-Fi IP Lock active: connect to ${branch.wifi_ssid} (${branch.office_ip_cidr}).`);
    }
  }

  const todayDubai = todayDubaiIso();
  const { dubaiTimeStr, lateMinutes } = getDubaiTimeAndLateMinutes(
    branch?.shift_start_gst || '09:00',
    branch?.grace_minutes ?? 15,
  );

  const { data: existing } = await db
    .from('attendance_events')
    .select('id')
    .eq('user_id', params.user.id)
    .eq('attendance_date_dubai', todayDubai)
    .eq('event_kind', 'CHECK_IN')
    .maybeSingle();

  const eventKind = existing ? 'DOOR_REENTRY' : 'CHECK_IN';

  const { data: event, error } = await db
    .from('attendance_events')
    .insert({
      user_id: params.user.id,
      emp_code: params.user.empCode,
      attendance_date_dubai: todayDubai,
      source: 'OFFICE_QR',
      event_kind: eventKind,
      dubai_time_str: dubaiTimeStr,
      late_minutes: eventKind === 'CHECK_IN' ? lateMinutes : 0,
      client_ip: params.clientIp || '',
      latitude: params.latitude ?? null,
      longitude: params.longitude ?? null,
      distance_m: distanceM,
      note: 'Al Nasr Plaza Oud Metha 20s Rotating QR',
    })
    .select('*')
    .single();
  if (error || !event) throw new Error(error?.message || 'QR Check-In failed');

  if (eventKind === 'CHECK_IN') {
    await postTeamGroupCheckInCard({
      userId: params.user.id,
      userName: params.user.name,
      userRole: params.user.role,
      avatarUrl: params.user.avatarUrl,
      sourceLabel: 'Oud Metha Reception QR',
      dubaiTimeStr,
      lateMinutes,
      branchName: branch?.name || 'Al Nasr Plaza, Oud Metha',
    });
  }

  return { event, dubaiTimeStr, lateMinutes, distanceM };
}
