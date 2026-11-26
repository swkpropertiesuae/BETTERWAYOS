import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/session';
import { processOfficeQrCheckIn } from '@/lib/attendance/hikvision';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { todayDubaiIso } from '@/lib/pipeline/service';

export async function POST(req: Request) {
  const auth = await requireSession();
  if ('error' in auth) return auth.error;

  try {
    const body = await req.json();
    const db = await getSupabaseAdmin();
    const today = todayDubaiIso();

    if (body.action === 'daily_close') {
      const { data: report, error } = await db
        .from('daily_close_reports')
        .upsert(
          {
            user_id: auth.user.id,
            report_date_dubai: today,
            calls_made: Number(body.callsMade || 0),
            enquiries_logged: Number(body.enquiriesLogged || 0),
            cases_progressed: Number(body.casesProgressed || 0),
            summary_today: String(body.summaryToday || ''),
            plan_tomorrow: String(body.planTomorrow || ''),
          },
          { onConflict: 'user_id,report_date_dubai' },
        )
        .select('*')
        .single();
      if (error) throw new Error(error.message);
      return NextResponse.json({ ok: true, report }, { status: 201 });
    }

    if (body.action === 'checkout') {
      const { data: hasReport } = await db
        .from('daily_close_reports')
        .select('id')
        .eq('user_id', auth.user.id)
        .eq('report_date_dubai', today)
        .maybeSingle();
      if (!hasReport && auth.user.role !== 'OWNER') {
        return NextResponse.json({ error: 'Submit Mandatory Daily Close Report before checking out.' }, { status: 400 });
      }
      const dubaiTimeStr = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Dubai',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })
        .format(new Date())
        .toUpperCase();
      const { data: ev, error } = await db
        .from('attendance_events')
        .insert({
          user_id: auth.user.id,
          emp_code: auth.user.empCode,
          attendance_date_dubai: today,
          source: 'OFFICE_QR',
          event_kind: 'CHECK_OUT',
          dubai_time_str: dubaiTimeStr,
          note: 'Shift Checked Out after Daily Close',
        })
        .select('*')
        .single();
      if (error) throw new Error(error.message);
      return NextResponse.json({ ok: true, event: ev, dubaiTimeStr });
    }

    const clientIp =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip')?.trim() ||
      '127.0.0.1';
    const res = await processOfficeQrCheckIn({
      user: auth.user,
      qrToken: String(body.qrToken || ''),
      clientIp,
      latitude: typeof body.latitude === 'number' ? body.latitude : undefined,
      longitude: typeof body.longitude === 'number' ? body.longitude : undefined,
    });
    return NextResponse.json({ ok: true, ...res }, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Attendance error' }, { status: 400 });
  }
}
