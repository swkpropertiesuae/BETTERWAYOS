import crypto from 'node:crypto';
import type { SessionUser, StageCode } from '@/lib/domain/types';
import { getCapabilitiesForRole } from '@/lib/auth/rbac';
import { getChecklistForProfile, PIPELINE_STAGES, type BorrowerProfileType } from '@/lib/domain/workflow';
import { calculateCbuaeEligibility } from '@/lib/domain/cbuae-math';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { logAudit } from '@/lib/auth/approvals';

export function assertPipelineScope(user: SessionUser) {
  const caps = getCapabilitiesForRole(user.role);
  if (caps.pipelineScope === 'NONE') {
    throw new Error('FORBIDDEN: Your role does not have access to client CRM, pipeline, or document vaults.');
  }
  return caps.pipelineScope;
}

export async function assertCaseAccess(caseId: string, user: SessionUser) {
  const scope = assertPipelineScope(user);
  const db = await getSupabaseAdmin();
  const { data: existing, error } = await db
    .from('mortgage_cases')
    .select('*')
    .eq('id', caseId)
    .eq('deleted_soft', false)
    .maybeSingle();
  if (error || !existing) {
    throw new Error('NOT_FOUND: Mortgage case not found.');
  }
  if (scope === 'OWN' && existing.advisor_id !== user.id) {
    throw new Error('FORBIDDEN: Advisors may only access their own assigned mortgage cases.');
  }
  return existing;
}

export function todayDubaiIso(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dubai' }).format(new Date());
}

export async function ingestDailyEnquiry(input: {
  contactName: string;
  contactPhone: string;
  contactEmail?: string;
  residency?: string;
  borrowerProfile?: BorrowerProfileType;
  goal?: string;
  propertyPriceAed?: number;
  downPaymentPct?: number;
  monthlyIncomeAed?: number;
  community?: string;
  sourceChannel?: string;
  sourcePage?: string;
  campaignUtm?: string;
  referrerName?: string;
  partnerAgency?: string;
  partnerBrn?: string;
  assignedTo?: string;
  notes?: string;
}) {
  const db = await getSupabaseAdmin();
  const referenceCode = `BW-ENQ-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
  const price = Number(input.propertyPriceAed || 2_500_000);
  const loanEst = Math.round(price * (1 - Number(input.downPaymentPct ?? 20) / 100));

  // Auto-route advisor using Master Log lead_routing_rules if not explicitly assigned
  let assignedTo = input.assignedTo;
  if (!assignedTo) {
    const { data: rules } = await db
      .from('lead_routing_rules')
      .select('*')
      .eq('active', true)
      .order('priority', { ascending: true });
    const match = (rules ?? []).find(
      (r) =>
        (r.source_channel === 'ALL' || r.source_channel === (input.sourceChannel || 'Website')) &&
        loanEst >= Number(r.min_loan_aed || 0),
    );
    assignedTo = match?.target_user_id || (loanEst >= 5_000_000 ? 'USR-03' : 'USR-07');
  }

  const isSwk = String(input.partnerAgency || '').toLowerCase().includes('swk');
  const { data, error } = await db
    .from('leads')
    .insert({
      reference_code: referenceCode,
      received_date_dubai: todayDubaiIso(),
      contact_name: input.contactName.trim(),
      contact_phone: input.contactPhone.trim(),
      contact_email: (input.contactEmail || '').trim(),
      residency: input.residency || 'Expat resident',
      borrower_profile: input.borrowerProfile || 'salaried',
      goal: input.goal || 'Resale Purchase (Secondary)',
      property_price_aed: price,
      down_payment_pct: Number(input.downPaymentPct ?? 20),
      monthly_income_aed: Number(input.monthlyIncomeAed || 45_000),
      community: input.community || '',
      source_channel: input.sourceChannel || 'Website',
      source_page: input.sourcePage || '/contact',
      campaign_utm: input.campaignUtm || '',
      referrer_name: input.referrerName || '',
      partner_agency: input.partnerAgency || '',
      partner_brn: input.partnerBrn || '',
      is_swk_relay: isSwk,
      assigned_to: assignedTo,
      notes: input.notes || '',
    })
    .select('*')
    .single();

  if (error || !data) throw new Error(`Failed to log daily enquiry: ${error?.message}`);

  // Alert assigned advisor for 5-minute SLA
  await db.from('notifications').insert({
    recipient_user_id: assignedTo!,
    severity: 'warning',
    title: `New Enquiry ${referenceCode} (5m SLA)`,
    body: `${input.contactName} via ${input.sourceChannel || 'Website'} · AED ${price.toLocaleString()}`,
    href: '/os/crm',
  });

  return data;
}

export async function createMortgageCaseWithVault(
  input: {
    leadId?: string;
    borrowerName: string;
    borrowerPhone: string;
    borrowerEmail?: string;
    residencyStatus?: 'uae_national' | 'expat_resident' | 'non_resident';
    borrowerProfile?: BorrowerProfileType;
    mortgageType?: string;
    emirate?: string;
    community?: string;
    projectName?: string;
    unitDoor?: string;
    developer?: string;
    propertyPriceAed: number;
    requestedLoanAed: number;
    monthlyIncomeAed: number;
    existingEmisAed?: number;
    cardLimitsAed?: number;
    borrowerAge?: number;
    primaryBankKey?: string;
    advisorId?: string;
    partnerAgency?: string;
    referrerName?: string;
  },
  actor: SessionUser,
) {
  const scope = assertPipelineScope(actor);
  const db = await getSupabaseAdmin();

  let resolvedPhone = String(input.borrowerPhone || '').trim();
  if (input.leadId && (!resolvedPhone || resolvedPhone.includes('•') || resolvedPhone.includes('*'))) {
    const { data: srcLead } = await db
      .from('leads')
      .select('contact_phone,assigned_to')
      .eq('id', input.leadId)
      .maybeSingle();
    if (srcLead) {
      if (scope === 'OWN' && srcLead.assigned_to !== actor.id) {
        throw new Error('FORBIDDEN: Advisors can only convert their own assigned leads.');
      }
      resolvedPhone = srcLead.contact_phone;
    }
  }

  const profile: BorrowerProfileType = input.borrowerProfile || 'salaried';
  const residency = input.residencyStatus || (profile === 'non_resident' ? 'non_resident' : 'expat_resident');
  const math = calculateCbuaeEligibility({
    propertyPriceAed: input.propertyPriceAed,
    monthlyIncomeAed: input.monthlyIncomeAed,
    existingEmisAed: input.existingEmisAed ?? 0,
    creditCardLimitsAed: input.cardLimitsAed ?? 0,
    residency,
    borrowerProfile: profile,
    ageYears: input.borrowerAge ?? 35,
    isFirstHome: true,
    requestedLoanAed: input.requestedLoanAed,
  });

  const caseCode = `BW-${new Date().getFullYear()}-M${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
  const { data: mortgageCase, error } = await db
    .from('mortgage_cases')
    .insert({
      case_code: caseCode,
      lead_id: input.leadId || null,
      borrower_name: input.borrowerName.trim(),
      borrower_phone: resolvedPhone,
      borrower_email: (input.borrowerEmail || '').trim(),
      residency_status: residency,
      borrower_profile: profile,
      mortgage_type: input.mortgageType || 'Resale Purchase (Secondary)',
      stage_code: '01_ENQUIRY',
      emirate: input.emirate || 'Dubai',
      community: input.community || '',
      project_name: input.projectName || '',
      unit_door: input.unitDoor || '',
      developer: input.developer || '',
      property_price_aed: input.propertyPriceAed,
      requested_loan_aed: input.requestedLoanAed,
      monthly_income_aed: input.monthlyIncomeAed,
      existing_emis_aed: input.existingEmisAed ?? 0,
      card_limits_aed: input.cardLimitsAed ?? 0,
      borrower_age: input.borrowerAge ?? 35,
      ltv_pct: math.actualLtvPct,
      dbr_pct: math.stressedDbrPct,
      primary_bank_key: input.primaryBankKey || 'emirates-nbd',
      partner_agency: input.partnerAgency || '',
      referrer_name: input.referrerName || '',
      is_swk_relay: String(input.partnerAgency || '').toLowerCase().includes('swk'),
      advisor_id: input.advisorId || actor.id,
      operations_id: 'USR-04', // Elton Frank — Operations Manager
    })
    .select('*')
    .single();

  if (error || !mortgageCase) throw new Error(`Case creation failed: ${error?.message}`);

  // Auto-spawn complete Per-Client Document Vault checklist (Passport, EID, Visa, Payslips, Salary Cert, 6m Bank, AECB, Form F, Oqood, Title Deed, Developer SOA/NOC, Bank App, Info Sheet)
  const checklist = getChecklistForProfile(profile);
  const { data: docs, error: docErr } = await db
    .from('case_documents')
    .insert(
      checklist.map((item) => ({
        case_id: mortgageCase.id,
        doc_category: item.category,
        doc_name: item.name,
        mandatory: item.mandatory,
        recency_days: item.recencyDays,
        status: 'Pending',
      })),
    )
    .select('*');

  if (docErr) throw new Error(`Vault checklist spawn failed: ${docErr.message}`);

  if (input.leadId) {
    await db.from('leads').update({ status: 'Converted', updated_at: new Date().toISOString() }).eq('id', input.leadId);
  }

  await logAudit(actor, 'mortgage_cases', mortgageCase.id, 'CASE_CREATED', {
    caseCode,
    docsSpawned: (docs ?? []).length,
  });

  return { mortgageCase, documents: docs ?? [] };
}

export async function advanceMortgageStage(
  caseId: string,
  nextStage: StageCode,
  evidenceNote: string,
  actor: SessionUser,
) {
  if (!evidenceNote.trim()) {
    throw new Error('Mandatory stage exit evidence note is required before advancing stage.');
  }
  const stageDef = PIPELINE_STAGES.find((s) => s.code === nextStage);
  if (!stageDef) throw new Error(`Invalid stage code: ${nextStage}`);

  const existing = await assertCaseAccess(caseId, actor);
  const db = await getSupabaseAdmin();

  const prevLog = Array.isArray(existing.stage_evidence_log) ? existing.stage_evidence_log : [];
  const nextLog = [
    ...prevLog,
    {
      from: existing.stage_code,
      to: nextStage,
      evidence: evidenceNote.trim(),
      actorId: actor.id,
      actorName: actor.name,
      at: new Date().toISOString(),
    },
  ];

  const { data: updated, error } = await db
    .from('mortgage_cases')
    .update({
      stage_code: nextStage,
      next_action: stageDef.requiredEvidence,
      stage_evidence_log: nextLog,
      updated_at: new Date().toISOString(),
    })
    .eq('id', caseId)
    .select('*')
    .single();
  if (error || !updated) throw new Error(error?.message || 'Stage update failed');

  await logAudit(actor, 'mortgage_cases', caseId, 'STAGE_ADVANCED', {
    from: existing.stage_code,
    to: nextStage,
    evidence: evidenceNote,
  });

  return updated;
}

export async function createCaseVaultUploadUrl(docId: string, fileName: string, actor: SessionUser) {
  const scope = assertPipelineScope(actor);
  const db = await getSupabaseAdmin();
  const { data: doc, error } = await db
    .from('case_documents')
    .select('id,case_id,doc_name,mortgage_cases(case_code,advisor_id)')
    .eq('id', docId)
    .single();
  if (error || !doc) throw new Error('Vault document slot not found.');

  const mc = (doc.mortgage_cases as unknown as { case_code: string; advisor_id: string } | null);
  if (scope === 'OWN' && mc?.advisor_id !== actor.id) {
    throw new Error('FORBIDDEN: Advisors may only upload documents for their own assigned cases.');
  }

  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120);
  const storagePath = `${mc?.case_code || doc.case_id}/${doc.id}-${Date.now()}-${safeName}`;
  const { data: signed, error: signErr } = await db.storage.from('client-vault').createSignedUploadUrl(storagePath);
  if (signErr || !signed) throw new Error(`Storage signed URL error: ${signErr?.message}`);

  await db
    .from('case_documents')
    .update({
      storage_path: storagePath,
      file_name: safeName,
      status: 'Uploaded',
      uploaded_by: actor.name,
      document_date: todayDubaiIso(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', docId);

  await db.from('master_vault_index').upsert(
    {
      id: `VLT-${doc.id.slice(0, 8).toUpperCase()}`,
      code: `VLT-${doc.id.slice(0, 8).toUpperCase()}`,
      file_name: safeName,
      bucket: 'client-vault',
      storage_path: storagePath,
      entity_type: 'case_document',
      entity_id: doc.case_id,
      uploaded_by: actor.id,
      verified: false,
    },
    { onConflict: 'id' },
  );

  return { signedUrl: signed.signedUrl, token: signed.token, storagePath };
}

export async function bookPropertyValuation(
  input: {
    caseId: string;
    bankKey: string;
    valuationCompany: string;
    accessContact: string;
    bookedDate: string;
    feeAed?: number;
    notes?: string;
  },
  actor: SessionUser,
) {
  await assertCaseAccess(input.caseId, actor);
  const db = await getSupabaseAdmin();
  const { data: val, error } = await db
    .from('case_valuations')
    .insert({
      case_id: input.caseId,
      bank_key: input.bankKey,
      valuation_company: input.valuationCompany,
      access_contact: input.accessContact,
      booked_date: input.bookedDate,
      fee_aed: input.feeAed ?? 3150,
      status: 'Booked',
      notes: input.notes || '',
    })
    .select('*')
    .single();
  if (error || !val) throw new Error(`Valuation booking failed: ${error?.message}`);

  await db.from('calendar_events').insert({
    title: `Valuation: ${input.valuationCompany}`,
    event_type: 'Valuation',
    starts_at: input.bookedDate,
    location: input.accessContact,
    assigned_to: actor.id,
    case_id: input.caseId,
    status: 'Scheduled',
    notes: input.notes || '',
  });

  await logAudit(actor, 'case_valuations', val.id, 'VALUATION_BOOKED', {
    caseId: input.caseId,
    company: input.valuationCompany,
  });

  return val;
}
