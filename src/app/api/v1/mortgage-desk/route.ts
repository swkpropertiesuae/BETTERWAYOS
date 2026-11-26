import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/session';
import { getCapabilitiesForRole } from '@/lib/auth/rbac';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { bookPropertyValuation } from '@/lib/pipeline/service';
import { calculateCtoAndAvgBalance, type MonthlyStatementRow } from '@/lib/domain/cbuae-math';

export async function GET() {
  const auth = await requireSession();
  if ('error' in auth) return auth.error;
  const caps = getCapabilitiesForRole(auth.user.role);
  if (caps.pipelineScope === 'NONE') {
    return NextResponse.json({ error: 'FORBIDDEN: Mortgage Exclusive Desk is restricted from your role.' }, { status: 403 });
  }
  const db = await getSupabaseAdmin();

  let casesQ = db
    .from('mortgage_cases')
    .select('id,case_code,borrower_name,stage_code,community,property_price_aed,requested_loan_aed,form_f_expiry,pre_approval_expiry,transfer_date,advisor_id')
    .eq('deleted_soft', false);
  let eventsQ = db.from('calendar_events').select('*').order('starts_at', { ascending: true });
  if (caps.pipelineScope === 'OWN') {
    casesQ = casesQ.eq('advisor_id', auth.user.id);
    eventsQ = eventsQ.eq('assigned_to', auth.user.id);
  }

  const [eventsRes, valsRes, banksRes, casesRes] = await Promise.all([
    eventsQ.limit(100),
    db.from('case_valuations').select('*, mortgage_cases(case_code,borrower_name,community,advisor_id)').order('created_at', { ascending: false }).limit(100),
    db.from('banks').select('*').order('fixed_3y_pct', { ascending: true }),
    casesQ.limit(100),
  ]);

  const rawVals = valsRes.data ?? [];
  const valuations =
    caps.pipelineScope === 'OWN'
      ? rawVals.filter((v) => (v.mortgage_cases as { advisor_id?: string } | null)?.advisor_id === auth.user.id)
      : rawVals;

  return NextResponse.json({
    events: eventsRes.data ?? [],
    valuations,
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
