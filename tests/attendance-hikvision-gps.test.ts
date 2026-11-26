import { describe, it, expect } from 'vitest';
import {
  signHikvisionPayload,
  verifyHikvisionSignature,
  processHikvisionDoorEvent,
  haversineDistanceMeters,
  generateRotatingQrToken,
  verifyRotatingQrToken,
} from '@/lib/attendance/hikvision';
import { startFieldVisit, triggerFieldSos } from '@/lib/attendance/field-gps';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { OFFICIAL_ROSTER, toSessionUser } from '@/lib/domain/staff';

function mockSession(email: string) {
  const s = OFFICIAL_ROSTER.find((u) => u.email === email)!;
  return toSessionUser({
    id: s.id,
    emp_code: s.empCode,
    slug: s.slug,
    name: s.name,
    name_ar: s.nameAr,
    email: s.email,
    phone: s.phone,
    role: s.role,
    tier: s.tier,
    designation: s.designation,
    department: s.department,
    avatar_url: s.avatarUrl,
    portrait_url: s.portraitUrl,
    initials: s.initials,
  });
}

describe('Task 9: Hikvision Door Fingerprint + 20s QR + Geofence + Auto Team Group Check-In + Field GPS SOS', () => {
  it('verifies Hikvision HMAC signatures, 20-second rotating QR tokens, and Oud Metha GPS geofence math', () => {
    const raw = JSON.stringify({ employeeNoString: 'BW-003', deviceSerial: 'DS-K1T342MFX', eventTime: new Date().toISOString() });
    const sig = signHikvisionPayload(raw);
    expect(verifyHikvisionSignature(raw, sig)).toBe(true);
    expect(verifyHikvisionSignature(raw, 'sha256=deadbeef')).toBe(false);

    const qr = generateRotatingQrToken();
    expect(verifyRotatingQrToken(qr.token)).toBe(true);
    expect(verifyRotatingQrToken('INVALID-QR-TOKEN')).toBe(false);

    // Al Nasr Plaza Oud Metha: 25.2397, 55.3119
    expect(haversineDistanceMeters(25.2397, 55.3119, 25.2398, 55.312)).toBeLessThan(30);
    expect(haversineDistanceMeters(25.2397, 55.3119, 25.076, 55.132)).toBeGreaterThan(15_000);
  });

  it('handles Single-Reader morning CHECK_IN + auto #attendance-checkin group card, and logs mid-day re-entry as DOOR_REENTRY without false check-out', async () => {
    const db = await getSupabaseAdmin();
    const todayDubai = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dubai' }).format(new Date());

    // Clean today's test events for BW-006 (Nusrik) first
    await db.from('attendance_events').delete().eq('user_id', 'USR-06').eq('attendance_date_dubai', todayDubai);
    await db.from('chat_messages').delete().eq('channel', 'attendance-checkin').eq('sender_id', 'USR-06');

    // 1st punch of the day -> CHECK_IN + automatic post in #attendance-checkin!
    const punch1 = await processHikvisionDoorEvent({
      employeeNoString: 'BW-006',
      deviceSerial: 'DS-K1T342MFX-OUDMETHA',
      eventTime: new Date().toISOString(),
      verifyMode: 'fingerprint',
    });
    expect(punch1.event.event_kind).toBe('CHECK_IN');
    expect(punch1.postedGroupMessage).toBe(true);

    const { data: groupMsgs1 } = await db
      .from('chat_messages')
      .select('*')
      .eq('channel', 'attendance-checkin')
      .eq('sender_id', 'USR-06');
    expect((groupMsgs1 ?? []).length).toBe(1);

    // 2nd punch mid-day in SINGLE_ENTRY_READER mode -> DOOR_REENTRY (NOT false CHECK_OUT, NO duplicate check-in spam!)
    const punch2 = await processHikvisionDoorEvent({
      employeeNoString: 'BW-006',
      deviceSerial: 'DS-K1T342MFX-OUDMETHA',
      eventTime: new Date().toISOString(),
      verifyMode: 'fingerprint',
    });
    expect(punch2.event.event_kind).toBe('DOOR_REENTRY');
    expect(punch2.postedGroupMessage).toBe(false);

    // Cleanup
    await db.from('attendance_events').delete().eq('user_id', 'USR-06').eq('attendance_date_dubai', todayDubai);
    await db.from('chat_messages').delete().eq('channel', 'attendance-checkin').eq('sender_id', 'USR-06');
  });

  it('tracks Field GPS visits and fires critical SOS alerts to BOTH Co-Owners (Warda & Shabib) and #urgent-alerts', async () => {
    const asif = mockSession('asif@betterwaymortgages.com');
    const db = await getSupabaseAdmin();

    const visit = await startFieldVisit(
      {
        purpose: 'Bank Valuation Inspection',
        destinationLabel: 'Dubai Hills Estate Sidra Villa',
        lat: 25.1095,
        lng: 55.2421,
        accuracyM: 12,
      },
      asif,
    );
    expect(visit.status).toBe('ACTIVE');

    const sos = await triggerFieldSos(visit.id, 'Urgent client assistance needed at DLD Trustee', asif);
    expect(sos.status).toBe('SOS');

    const { data: ownerNotifs } = await db
      .from('notifications')
      .select('*')
      .in('recipient_user_id', ['USR-01', 'USR-02'])
      .eq('severity', 'critical')
      .ilike('title', '%SOS%');
    expect((ownerNotifs ?? []).length).toBeGreaterThanOrEqual(2);

    // Cleanup
    await db.from('field_visits').delete().eq('id', visit.id);
    await db.from('notifications').delete().ilike('title', '%SOS%').ilike('body', '%Asif Khan%');
    await db.from('chat_messages').delete().eq('channel', 'urgent-alerts').eq('sender_id', asif.id);
  });
});
