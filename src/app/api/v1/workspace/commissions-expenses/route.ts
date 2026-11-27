import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import { requireOwner } from '@/lib/auth/session';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { logAudit } from '@/lib/auth/approvals';
import { computeAgentSettlementSummary, type CommissionExpenseEntry } from '@/lib/workspace/domain';

export async function GET() {
  const auth = await requireOwner();
  if ('error' in auth) return auth.error;

  const db = await getSupabaseAdmin();
  const [{ data: entries, error }, { data: staff }] = await Promise.all([
    db.from('owner_commission_expenses').select('*').order('entry_date', { ascending: false }).limit(300),
    db.from('users').select('id,emp_code,name,designation,department').eq('active', true).order('emp_code', { ascending: true }),
  ]);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const list = (entries ?? []) as Array<Record<string, unknown>>;
  const summary = computeAgentSettlementSummary(
    list.map((e) => ({
      agent_name: String(e.agent_name || 'Unassigned'),
      agent_user_id: (e.agent_user_id as string) ?? null,
      entry_type: e.entry_type as CommissionExpenseEntry['entry_type'],
      gross_amount_aed: Number(e.gross_amount_aed || 0),
      split_pct: Number(e.split_pct || 100),
      net_amount_aed: Number(e.net_amount_aed || 0),
      status: e.status as CommissionExpenseEntry['status'],
      payment_mode: String(e.payment_mode || 'Bank Transfer (BT)'),
      is_third_party: Boolean(e.is_third_party),
    })),
  );

  return NextResponse.json({
    entries: list,
    summary,
    staff: staff ?? [],
  });
}

export async function POST(req: Request) {
  const auth = await requireOwner();
  if ('error' in auth) return auth.error;

  try {
    const body = await req.json();
    const db = await getSupabaseAdmin();
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dubai' }).format(new Date());

    if (body.action === 'update_status') {
      const id = String(body.id || '');
      const status = ['Pending', 'Received', 'Paid'].includes(body.status) ? body.status : 'Paid';
      const patch: Record<string, unknown> = {
        status,
        settled_date: status === 'Paid' || status === 'Received' ? today : null,
        updated_at: new Date().toISOString(),
      };
      if (body.paymentMode) patch.payment_mode = body.paymentMode;
      if (body.paymentReference !== undefined) patch.payment_reference = String(body.paymentReference);

      const { data, error } = await db
        .from('owner_commission_expenses')
        .update(patch)
        .eq('id', id)
        .select('*')
        .single();
      if (error) throw new Error(error.message);
      await logAudit(auth.user, 'owner_commission_expenses', id, 'COMMISSION_EXPENSE_STATUS', { status });
      return NextResponse.json({ ok: true, entry: data });
    }

    if (body.action === 'delete') {
      const id = String(body.id || '');
      const { error } = await db.from('owner_commission_expenses').delete().eq('id', id);
      if (error) throw new Error(error.message);
      await logAudit(auth.user, 'owner_commission_expenses', id, 'COMMISSION_EXPENSE_DELETED', {});
      return NextResponse.json({ ok: true });
    }

    // Create Commission / Expense / 3rd-Party Split Entry
    const agentName = String(body.agentName || '').trim();
    if (!agentName) return NextResponse.json({ error: 'Agent name is required' }, { status: 400 });

    const gross = Number(body.grossAmountAed || 0);
    const splitPct = Number(body.splitPct ?? 100);
    const computedNet =
      body.netAmountAed !== undefined && Number(body.netAmountAed) > 0
        ? Number(body.netAmountAed)
        : Number(((gross * splitPct) / 100).toFixed(2));

    const entryNo = `CEX-${String(new Date().getFullYear()).slice(-2)}${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
    const status = ['Pending', 'Received', 'Paid'].includes(body.status) ? body.status : 'Pending';

    const { data, error } = await db
      .from('owner_commission_expenses')
      .insert({
        entry_no: entryNo,
        entry_type: body.entryType || 'Commission to Agent',
        agent_user_id: body.agentUserId || null,
        agent_name: agentName,
        deal_ref: String(body.dealRef || '').trim(),
        property_label: String(body.propertyLabel || '').trim(),
        track: body.track || 'Secondary',
        gross_amount_aed: gross,
        split_pct: splitPct,
        net_amount_aed: computedNet,
        status,
        payment_mode: body.paymentMode || 'Bank Transfer (BT)',
        payment_reference: String(body.paymentReference || '').trim(),
        entry_date: body.entryDate || today,
        settled_date: status === 'Paid' || status === 'Received' ? body.settledDate || today : null,
        expense_category: String(body.expenseCategory || '').trim(),
        is_third_party: Boolean(body.isThirdParty),
        third_party_agency: String(body.thirdPartyAgency || '').trim(),
        third_party_agent_name: String(body.thirdPartyAgentName || '').trim(),
        third_party_brn: String(body.thirdPartyBrn || '').trim(),
        third_party_phone: String(body.thirdPartyPhone || '').trim(),
        third_party_email: String(body.thirdPartyEmail || '').trim(),
        third_party_payment_details: String(body.thirdPartyPaymentDetails || '').trim(),
        notes: String(body.notes || '').trim(),
        created_by: auth.user.id,
      })
      .select('*')
      .single();

    if (error || !data) throw new Error(error?.message || 'Commission/Expense create failed');
    await logAudit(auth.user, 'owner_commission_expenses', data.id, 'COMMISSION_EXPENSE_CREATED', {
      entryNo,
      entryType: data.entry_type,
      netAed: data.net_amount_aed,
      paymentMode: data.payment_mode,
    });
    return NextResponse.json({ ok: true, entry: data }, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Commissions API error' }, { status: 400 });
  }
}
