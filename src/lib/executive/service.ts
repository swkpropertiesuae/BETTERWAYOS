import crypto from 'node:crypto';
import type { SessionUser } from '@/lib/domain/types';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { logAudit } from '@/lib/auth/approvals';

function assertOwner(user: SessionUser) {
  if (user.role !== 'OWNER') {
    throw new Error('OWNER_ONLY: Privacy Fast Track and Executive Ledger are strictly locked to Warda Kapadia & Shabib Siraj.');
  }
}

export async function listFastTrackJobs(owner: SessionUser) {
  assertOwner(owner);
  const db = await getSupabaseAdmin();
  const { data, error } = await db
    .from('privacy_fast_track_jobs')
    .select('*')
    .or(`private_to_owner_id.is.null,private_to_owner_id.eq.${owner.id}`)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function listFastTrackInvoices(owner: SessionUser) {
  assertOwner(owner);
  const db = await getSupabaseAdmin();
  const { data, error } = await db
    .from('privacy_fast_track_invoices')
    .select('*')
    .or(`private_to_owner_id.is.null,private_to_owner_id.eq.${owner.id}`)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function listFastTrackDocs(owner: SessionUser) {
  assertOwner(owner);
  const db = await getSupabaseAdmin();
  const { data, error } = await db
    .from('privacy_fast_track_docs')
    .select('*')
    .or(`private_to_owner_id.is.null,private_to_owner_id.eq.${owner.id}`)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createFastTrackJob(
  input: {
    clientName: string;
    clientPhone?: string;
    clientEmail?: string;
    propertySummary?: string;
    communityFreeform?: string;
    developerFreeform?: string;
    propertyPriceAed?: number;
    loanAmountAed?: number;
    expectedFeeAed?: number;
    urgency?: 'IMMEDIATE_CASH' | 'VIP_PRIVATE' | 'CONFIDENTIAL';
    stageCode?: string;
    targetCashDate?: string;
    notes?: string;
    privateToMeOnly?: boolean;
  },
  owner: SessionUser,
) {
  assertOwner(owner);
  const db = await getSupabaseAdmin();
  const code = `FT-${new Date().getFullYear()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
  const { data, error } = await db
    .from('privacy_fast_track_jobs')
    .insert({
      job_code: code,
      created_by_owner_id: owner.id,
      private_to_owner_id: input.privateToMeOnly ? owner.id : null,
      client_name: input.clientName.trim(),
      client_phone: (input.clientPhone || '').trim(),
      client_email: (input.clientEmail || '').trim(),
      property_summary: input.propertySummary || '',
      community_freeform: input.communityFreeform || '',
      developer_freeform: input.developerFreeform || '',
      property_price_aed: Number(input.propertyPriceAed || 0),
      loan_amount_aed: Number(input.loanAmountAed || 0),
      expected_fee_aed: Number(input.expectedFeeAed || 0),
      urgency: input.urgency || 'IMMEDIATE_CASH',
      stage_code: input.stageCode || '01_ENQUIRY',
      target_cash_date: input.targetCashDate || null,
      notes: input.notes || '',
    })
    .select('*')
    .single();

  if (error || !data) throw new Error(`Fast-Track job create failed: ${error?.message}`);
  await logAudit(owner, 'privacy_fast_track_jobs', data.id, 'FAST_TRACK_CREATED', {
    jobCode: code,
    privateToMeOnly: Boolean(input.privateToMeOnly),
  });
  return data;
}

export async function createFastTrackInvoice(
  input: {
    jobId: string;
    billToName: string;
    description: string;
    subtotalAed: number;
    vatRatePct?: number;
    dueDate?: string;
  },
  owner: SessionUser,
) {
  assertOwner(owner);
  const db = await getSupabaseAdmin();
  const { data: job } = await db
    .from('privacy_fast_track_jobs')
    .select('id,private_to_owner_id')
    .eq('id', input.jobId)
    .single();
  if (!job) throw new Error('Fast-Track job not found.');
  if (job.private_to_owner_id && job.private_to_owner_id !== owner.id) {
    throw new Error('OWNER_ONLY: Private single-owner job.');
  }

  const vatRate = input.vatRatePct ?? 5;
  const subtotal = Number(input.subtotalAed);
  const vatAmount = Number(((subtotal * vatRate) / 100).toFixed(2));
  const total = Number((subtotal + vatAmount).toFixed(2));
  const invoiceNo = `FT-INV-${new Date().getFullYear()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

  const { data: ibanSetting } = await db.from('app_settings').select('value').eq('key', 'corporate_ibans').maybeSingle();
  const defaultIban = (ibanSetting?.value as { whitelisted?: string[] } | undefined)?.whitelisted?.[0] || 'AE460260001015889900101';

  const { data, error } = await db
    .from('privacy_fast_track_invoices')
    .insert({
      invoice_no: invoiceNo,
      job_id: job.id,
      created_by_owner_id: owner.id,
      private_to_owner_id: job.private_to_owner_id,
      bill_to_name: input.billToName,
      description: input.description,
      subtotal_aed: subtotal,
      vat_rate_pct: vatRate,
      vat_amount_aed: vatAmount,
      total_aed: total,
      corporate_iban: defaultIban,
      status: 'Issued',
      due_date: input.dueDate || null,
    })
    .select('*')
    .single();

  if (error || !data) throw new Error(`Fast-Track invoice create failed: ${error?.message}`);
  await db.from('privacy_fast_track_jobs').update({ cash_status: 'INVOICED' }).eq('id', job.id);
  await logAudit(owner, 'privacy_fast_track_invoices', data.id, 'FAST_TRACK_INVOICE_ISSUED', { invoiceNo, total });
  return data;
}

export async function createFastTrackDoc(
  input: {
    jobId: string;
    docTitle: string;
    docType: string;
    bodyHtml: string;
    applySeal?: boolean;
  },
  owner: SessionUser,
) {
  assertOwner(owner);
  const db = await getSupabaseAdmin();
  const { data: job } = await db.from('privacy_fast_track_jobs').select('id,private_to_owner_id').eq('id', input.jobId).single();
  if (!job) throw new Error('Fast-Track job not found.');

  const { data, error } = await db
    .from('privacy_fast_track_docs')
    .insert({
      job_id: job.id,
      created_by_owner_id: owner.id,
      private_to_owner_id: job.private_to_owner_id,
      doc_title: input.docTitle,
      doc_type: input.docType,
      body_html: input.bodyHtml,
      sealed_by: input.applySeal ? owner.id : null,
      sealed_at: input.applySeal ? new Date().toISOString() : null,
    })
    .select('*')
    .single();
  if (error || !data) throw new Error(error?.message);
  return data;
}

/**
 * Option A Owner-Only Consolidated P&L & UAE VAT 201 summary:
 * Merges Standard Company Ledger + Segregated Owner Privacy Fast Track Invoices privately for Warda & Shabib.
 */
export async function getOwnerConsolidatedVatSummary(owner: SessionUser) {
  assertOwner(owner);
  const db = await getSupabaseAdmin();

  const [{ data: stdInvoices }, { data: stdExpenses }, { data: ftInvoices }] = await Promise.all([
    db.from('invoices').select('subtotal_aed,vat_amount_aed,total_aed,status'),
    db.from('expenses').select('amount_aed,vat_aed'),
    db
      .from('privacy_fast_track_invoices')
      .select('subtotal_aed,vat_amount_aed,total_aed,status')
      .or(`private_to_owner_id.is.null,private_to_owner_id.eq.${owner.id}`),
  ]);

  const sum = (rows: Array<Record<string, unknown>> | null, key: string) =>
    (rows ?? []).reduce((acc, r) => acc + Number(r[key] || 0), 0);

  const standardRevenueAed = sum(stdInvoices, 'subtotal_aed');
  const standardOutputVatAed = sum(stdInvoices, 'vat_amount_aed');
  const fastTrackRevenueAed = sum(ftInvoices, 'subtotal_aed');
  const fastTrackOutputVatAed = sum(ftInvoices, 'vat_amount_aed');
  const standardExpensesAed = sum(stdExpenses, 'amount_aed');
  const inputVatRecoverableAed = sum(stdExpenses, 'vat_aed');

  const consolidatedRevenueAed = standardRevenueAed + fastTrackRevenueAed;
  const consolidatedOutputVatAed = standardOutputVatAed + fastTrackOutputVatAed;
  const netFtaVatPayableAed = Number((consolidatedOutputVatAed - inputVatRecoverableAed).toFixed(2));
  const consolidatedNetProfitAed = Number((consolidatedRevenueAed - standardExpensesAed).toFixed(2));

  return {
    standardRevenueAed,
    standardOutputVatAed,
    fastTrackRevenueAed,
    fastTrackOutputVatAed,
    standardExpensesAed,
    inputVatRecoverableAed,
    consolidatedRevenueAed,
    consolidatedOutputVatAed,
    netFtaVatPayableAed,
    consolidatedNetProfitAed,
  };
}
