import { NextResponse } from 'next/server';
import QRCode from 'qrcode';
import { requireSession } from '@/lib/auth/session';
import { generateRotatingQrToken } from '@/lib/attendance/hikvision';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { todayDubaiIso } from '@/lib/pipeline/service';

export async function GET() {
  const auth = await requireSession();
  if ('error' in auth) return auth.error;

  const qr = generateRotatingQrToken();
  const qrDataUrl = await QRCode.toDataURL(qr.token, { width: 280, margin: 1 });
  const db = await getSupabaseAdmin();
  const today = todayDubaiIso();

  const [branchRes, eventsRes, reportsRes] = await Promise.all([
    db.from('office_branches').select('*').eq('id', 'BR-OUDMETHA').maybeSingle(),
    db.from('attendance_events').select('*, users(name,designation,avatar_url)').eq('attendance_date_dubai', today).order('created_at', { ascending: false }),
    db.from('daily_close_reports').select('*, users(name,designation)').eq('report_date_dubai', today).order('created_at', { ascending: false }),
  ]);

  return NextResponse.json({
    ...qr,
    qrDataUrl,
    branch: branchRes.data,
    todayDubai: today,
    events: eventsRes.data ?? [],
    dailyReports: reportsRes.data ?? [],
  });
}
