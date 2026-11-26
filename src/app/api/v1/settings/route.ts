import { NextResponse } from 'next/server';
import { requireOwner, requireSession } from '@/lib/auth/session';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export async function GET() {
  const auth = await requireSession();
  if ('error' in auth) return auth.error;
  if (auth.user.role !== 'OWNER' && auth.user.role !== 'OFFICE_ADMIN') {
    return NextResponse.json({ error: 'FORBIDDEN: Office security settings are restricted to Owners & Office Admin.' }, { status: 403 });
  }
  const db = await getSupabaseAdmin();
  const [{ data: branch }, { data: settings }] = await Promise.all([
    db.from('office_branches').select('*').eq('id', 'BR-OUDMETHA').maybeSingle(),
    db.from('app_settings').select('*'),
  ]);
  return NextResponse.json({
    branch,
    settings: Object.fromEntries((settings ?? []).map((s) => [s.key, s.value])),
    websiteUrl: process.env.BW_WEBSITE_URL || 'https://betterwaymortgages.com',
    hikvisionWebhookUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://betterwayos.vercel.app'}/api/v1/attendance/hikvision`,
    canEditSecurity: auth.user.role === 'OWNER',
  });
}

export async function PATCH(req: Request) {
  const auth = await requireOwner();
  if ('error' in auth) return auth.error;
  try {
    const body = await req.json();
    const db = await getSupabaseAdmin();
    if (body.branch) {
      const { error } = await db
        .from('office_branches')
        .update({
          wifi_ssid: body.branch.wifi_ssid,
          office_ip_cidr: body.branch.office_ip_cidr,
          geofence_radius_m: Number(body.branch.geofence_radius_m || 150),
          wifi_lock_enabled: Boolean(body.branch.wifi_lock_enabled),
          geofence_lock_enabled: Boolean(body.branch.geofence_lock_enabled),
          hikvision_device_serial: body.branch.hikvision_device_serial,
          hikvision_local_ip: body.branch.hikvision_local_ip,
          hikvision_reader_mode: body.branch.hikvision_reader_mode,
          shift_start_gst: body.branch.shift_start_gst,
          grace_minutes: Number(body.branch.grace_minutes ?? 15),
          updated_at: new Date().toISOString(),
        })
        .eq('id', 'BR-OUDMETHA');
      if (error) throw new Error(error.message);
    }
    if (body.settingKey && body.settingValue !== undefined) {
      await db.from('app_settings').upsert(
        { key: body.settingKey, value: body.settingValue, updated_by: auth.user.id, updated_at: new Date().toISOString() },
        { onConflict: 'key' },
      );
    }
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Settings update failed' }, { status: 400 });
  }
}
