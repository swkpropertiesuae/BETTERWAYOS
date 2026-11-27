import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import { requireOwner } from '@/lib/auth/session';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { logAudit } from '@/lib/auth/approvals';
import {
  buildDefaultStagesForTrack,
  CLOSING_TRACKS,
  summarizeChequeLedger,
  type ClosingTrack,
} from '@/lib/workspace/domain';

export async function GET(req: Request) {
  const auth = await requireOwner();
  if ('error' in auth) return auth.error;

  const url = new URL(req.url);
  const track = url.searchParams.get('track');
  const db = await getSupabaseAdmin();

  let dq = db.from('closing_forensic_dossiers').select('*').order('updated_at', { ascending: false }).limit(120);
  if (track && track !== 'ALL') dq = dq.eq('track', track);

  const [{ data: dossiers, error }, { data: cheques }, { data: activeCases }, { data: staff }] = await Promise.all([
    dq,
    db.from('closing_cheque_ledger').select('*').order('cheque_date', { ascending: true }).limit(500),
    db
      .from('mortgage_cases')
      .select('id,case_code,borrower_name,borrower_phone,borrower_email,community,project_name,unit_door,property_price_aed,requested_loan_aed,stage_code')
      .eq('deleted_soft', false)
      .order('updated_at', { ascending: false })
      .limit(50),
    db.from('users').select('id,name,designation').eq('active', true).order('emp_code', { ascending: true }),
  ]);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const chequesByDossier = new Map<string, Array<Record<string, unknown>>>();
  for (const c of cheques ?? []) {
    const arr = chequesByDossier.get(c.dossier_id) ?? [];
    arr.push(c);
    chequesByDossier.set(c.dossier_id, arr);
  }

  const enriched = (dossiers ?? []).map((d) => {
    const rows = chequesByDossier.get(d.id) ?? [];
    const summary = summarizeChequeLedger(rows.map((r) => ({ amount_aed: Number(r.amount_aed || 0), status: String(r.status || 'Pending') })));
    return { ...d, cheques: rows, chequeSummary: summary };
  });

  return NextResponse.json({
    dossiers: enriched,
    activeCases: activeCases ?? [],
    staff: staff ?? [],
  });
}

export async function POST(req: Request) {
  const auth = await requireOwner();
  if ('error' in auth) return auth.error;

  try {
    const body = await req.json();
    const db = await getSupabaseAdmin();

    // 1. Add Cheque / Payment Row to a Closing Dossier
    if (body.action === 'add_cheque') {
      const dossierId = String(body.dossierId || '');
      if (!dossierId) return NextResponse.json({ error: 'dossierId is required' }, { status: 400 });
      const { data, error } = await db
        .from('closing_cheque_ledger')
        .insert({
          dossier_id: dossierId,
          cheque_no: String(body.chequeNo || '').trim(),
          bank_name: String(body.bankName || '').trim(),
          payee_name: String(body.payeeName || '').trim(),
          payer_name: String(body.payerName || '').trim(),
          purpose: String(body.purpose || 'Down Payment').trim(),
          payment_method: body.paymentMethod || 'Cheque / PDC',
          amount_aed: Number(body.amountAed || 0),
          cheque_date: body.chequeDate || null,
          status: body.status || 'Pending',
          cleared_date: body.clearedDate || null,
          notes: String(body.notes || '').trim(),
        })
        .select('*')
        .single();
      if (error) throw new Error(error.message);
      await logAudit(auth.user, 'closing_cheque_ledger', data.id, 'CLOSING_CHEQUE_ADDED', { dossierId, amountAed: data.amount_aed });
      return NextResponse.json({ ok: true, cheque: data }, { status: 201 });
    }

    // 2. Update Cheque Status (Pending / Received / Deposited / Cleared / Paid / Bounced)
    if (body.action === 'update_cheque') {
      const chequeId = String(body.chequeId || '');
      const status = String(body.status || 'Cleared');
      const { data, error } = await db
        .from('closing_cheque_ledger')
        .update({
          status,
          cleared_date: status === 'Cleared' || status === 'Paid' ? new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dubai' }).format(new Date()) : null,
          notes: body.notes !== undefined ? String(body.notes) : undefined,
        })
        .eq('id', chequeId)
        .select('*')
        .single();
      if (error) throw new Error(error.message);
      return NextResponse.json({ ok: true, cheque: data });
    }

    if (body.action === 'delete_cheque') {
      const chequeId = String(body.chequeId || '');
      const { error } = await db.from('closing_cheque_ledger').delete().eq('id', chequeId);
      if (error) throw new Error(error.message);
      return NextResponse.json({ ok: true });
    }

    // 3. Update Dossier Stages or Metadata
    if (body.action === 'update_dossier') {
      const dossierId = String(body.dossierId || '');
      const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (Array.isArray(body.stages)) patch.stages_json = body.stages;
      if (body.status) patch.status = body.status;
      if (body.ejariOrOqoodOrDeedRef !== undefined) patch.ejari_or_oqood_or_deed_ref = String(body.ejariOrOqoodOrDeedRef);
      if (body.nocRef !== undefined) patch.noc_ref = String(body.nocRef);
      if (body.escrowOrBankRef !== undefined) patch.escrow_or_bank_ref = String(body.escrowOrBankRef);
      if (body.keysAndMetersSummary !== undefined) patch.keys_and_meters_summary = String(body.keysAndMetersSummary);
      if (body.handoverDate !== undefined) patch.handover_date = body.handoverDate || null;
      if (body.notes !== undefined) patch.notes = String(body.notes);

      const { data, error } = await db.from('closing_forensic_dossiers').update(patch).eq('id', dossierId).select('*').single();
      if (error) throw new Error(error.message);
      await logAudit(auth.user, 'closing_forensic_dossiers', dossierId, 'CLOSING_DOSSIER_UPDATED', { status: data.status });
      return NextResponse.json({ ok: true, dossier: data });
    }

    // 4. Create New Pin-to-Pin Closing Forensic Dossier (Off-Plan, Secondary, Handover, Leasing, Property Management)
    const track: ClosingTrack = CLOSING_TRACKS.includes(body.track) ? body.track : 'Secondary';
    const clientName = String(body.clientName || '').trim();
    if (!clientName) return NextResponse.json({ error: 'Client name is required' }, { status: 400 });

    const dossierNo = `CLS-${String(new Date().getFullYear()).slice(-2)}${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
    const defaultStages = buildDefaultStagesForTrack(track);

    const { data, error } = await db
      .from('closing_forensic_dossiers')
      .insert({
        dossier_no: dossierNo,
        track,
        title: String(body.title || `${track} Closing · ${clientName}`).trim(),
        status: body.status || 'In Progress',
        case_id: body.caseId || null,
        agent_user_id: body.agentUserId || auth.user.id,
        agent_name: String(body.agentName || auth.user.name),
        community: String(body.community || '').trim(),
        project_name: String(body.projectName || '').trim(),
        unit_no: String(body.unitNo || '').trim(),
        client_name: clientName,
        client_phone: String(body.clientPhone || '').trim(),
        client_email: String(body.clientEmail || '').trim(),
        client_passport_eid: String(body.clientPassportEid || '').trim(),
        counterparty_name: String(body.counterpartyName || '').trim(),
        counterparty_phone: String(body.counterpartyPhone || '').trim(),
        counterparty_email: String(body.counterpartyEmail || '').trim(),
        is_third_party: Boolean(body.isThirdParty),
        third_party_agency: String(body.thirdPartyAgency || '').trim(),
        third_party_agent: String(body.thirdPartyAgent || '').trim(),
        third_party_brn: String(body.thirdPartyBrn || '').trim(),
        third_party_phone: String(body.thirdPartyPhone || '').trim(),
        third_party_email: String(body.thirdPartyEmail || '').trim(),
        asking_price_aed: Number(body.askingPriceAed || 0),
        agreed_price_aed: Number(body.agreedPriceAed || 0),
        yearly_rent_aed: Number(body.yearlyRentAed || 0),
        deposit_aed: Number(body.depositAed || 0),
        dld_or_adm_fee_aed: Number(body.dldOrAdmFeeAed || 0),
        agency_commission_aed: Number(body.agencyCommissionAed || 0),
        vat_aed: Number(body.vatAed || Number(body.agencyCommissionAed || 0) * 0.05),
        total_cheques_count: Number(body.totalChequesCount || 0),
        payment_mode: String(body.paymentMode || 'Bank Transfer (BT)'),
        escrow_or_bank_ref: String(body.escrowOrBankRef || '').trim(),
        ejari_or_oqood_or_deed_ref: String(body.ejariOrOqoodOrDeedRef || '').trim(),
        noc_ref: String(body.nocRef || '').trim(),
        handover_date: body.handoverDate || null,
        keys_and_meters_summary: String(body.keysAndMetersSummary || '').trim(),
        stages_json: defaultStages,
        notes: String(body.notes || '').trim(),
        created_by: auth.user.id,
      })
      .select('*')
      .single();

    if (error || !data) throw new Error(error?.message || 'Closing dossier create failed');
    await logAudit(auth.user, 'closing_forensic_dossiers', data.id, 'CLOSING_DOSSIER_CREATED', { dossierNo, track });
    return NextResponse.json({ ok: true, dossier: data }, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Closings API error' }, { status: 400 });
  }
}
