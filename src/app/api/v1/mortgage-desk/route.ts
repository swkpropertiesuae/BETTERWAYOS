import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/session';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { bookPropertyValuation } from '@/lib/pipeline/service';
import { calculateCtoAndAvgBalance, type MonthlyStatementRow } from '@/lib/domain/cbuae-math';

export async function GET() {
  const auth = await requireSession();
  if ('error' in auth) return auth.error;
  const db = await getSupabaseAdmin();

  const [eventsRes, valsRes, banksRes, casesRes] = await Promise.all([
    db.from('calendar_events').select('*').order('starts_at', { ascending: true }).limit(100),
    db.from('case_valuations').select('*, mortgage_cases(case_code,borrower_name,community)').order('created_at', { ascending: false }).limit(100),
    db.from('banks').select('*').order('fixed_3y_pct', { ascending: true }),
    db.from('mortgage_cases').select('id,case_code,borrower_name,stage_code,community,property_price_aed,requested_loan_aed,form_f_expiry,pre_approval_expiry,transfer_date').eq('deleted_soft', false).limit(100),
  ]);

  return NextResponse.json({
    events: eventsRes.data ?? [],
    valuations: valsRes.data ?? [],
    banks: banksRes.data ?? [],
    cases: casesRes.data ?? [],
  });
}

export async function POST(req: Request) {
  const auth = await requireSession();
  if ('error' in auth) return auth.error;
  try {
    const body = await req.json();
    const db = await getSupabaseAdmin();
    if (body.kind === 'valuation') {
      const val = await bookPropertyValuation(body, auth.user);
      return NextResponse.json({ ok: true, valuation: val }, { status: 201 });
    }
    if (body.kind === 'cto_analyze') {
      const res = calculateCtoAndAvgBalance((body.rows ?? []) as MonthlyStatementRow[]);
      return NextResponse.json({ ok: true, analysis: res });
    }
    const { data: ev, error } = await db
      .from('calendar_events')
      .insert({
        title: body.title,
        event_type: body.eventType || 'Bank Follow-up',
        starts_at: body.startsAt,
        location: body.location || '',
        assigned_to: body.assignedTo || auth.user.id,
        case_id: body.caseId || null,
        notes: body.notes || '',
      })
      .select('*')
      .single();
    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true, event: ev }, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Mortgage Desk action failed' }, { status: 400 });
  }
}
