import { activeRows } from '@/server/data-hub/import';
import { openStageTask } from '@/server/engines/workflow-engine';
import { randomBytes, randomUUID } from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';
import { resolveDataDir } from '@/server/db/data-dir';
import {
  assertRole,
  ForbiddenError,
  hashPassword,
  writeAuditLog,
  type UserRecord,
  type UserRole,
} from '@/server/auth';
import { readEncryptedVaultFile, writeEncryptedVaultFile } from '@/server/vault/crypto';
import { checkBankSubmissionGate } from '@/server/engines/compliance-aml-engine';
import { evaluateDealAcross24Banks } from '@/server/engines/underwriting-engine';
import { createPintAeTaxInvoice, postJournalEntry } from '@/server/engines/ledger-tax-engine';

const INTERNAL_DEAL_ROLES: UserRole[] = [
  'SUPER_ADMIN',
  'SALES_ADVISOR',
  'CREDIT_UNDERWRITER',
  'PROGRESSION_MANAGER',
  'COMPLIANCE_MLRO',
  'FINANCE_ADMIN',
];

export function registerPartnerAgent(
  db: DatabaseSync,
  input: {
    companyName: string;
    tradeLicenceNo: string;
    reraOrn: string;
    vatTrn15?: string;
    fullNameEn: string;
    fullNameAr?: string;
    email: string;
    phone: string;
    password: string;
    reraBrn: string;
    brnExpiryDate: string;
    isAgencyAdmin?: boolean;
  },
) {
  const ornClean = input.reraOrn.trim().toUpperCase();
  const emailClean = input.email.trim().toLowerCase();

  db.exec('BEGIN IMMEDIATE');
  try {
    let agency = db
      .prepare('SELECT id, verification_status, agreement_status FROM partner_agencies WHERE rera_orn = ?')
      .get(ornClean) as
      | { id: number; verification_status: string; agreement_status: string }
      | undefined;

    let isNewAgency = false;
    if (!agency) {
      isNewAgency = true;
      const agRes = db
        .prepare(
          `INSERT INTO partner_agencies (
            company_name, trade_licence_no, rera_orn, vat_trn_15, verification_status, agreement_status
          ) VALUES (?, ?, ?, ?, 'PENDING_ORN_CHECK', 'DRAFT')`,
        )
        .run(input.companyName.trim(), input.tradeLicenceNo.trim(), ornClean, (input.vatTrn15 ?? '').trim());
      agency = {
        id: Number(agRes.lastInsertRowid),
        verification_status: 'PENDING_ORN_CHECK',
        agreement_status: 'DRAFT',
      };
    }

    // Security invariant: public signup onto an already-existing agency ORN can NEVER grant PARTNER_AGENCY_ADMIN
    const isAdmin = isNewAgency && Boolean(input.isAgencyAdmin);
    const role: UserRole = isAdmin ? 'PARTNER_AGENCY_ADMIN' : 'PARTNER_AGENT';
    const passHash = hashPassword(input.password);

    const uRes = db
      .prepare(
        `INSERT INTO users (email, phone, full_name_en, full_name_ar, password_hash, role, preferred_lang)
         VALUES (?, ?, ?, ?, ?, ?, 'en')`,
      )
      .run(emailClean, input.phone.trim(), input.fullNameEn.trim(), input.fullNameAr?.trim() ?? '', passHash, role);
    const userId = Number(uRes.lastInsertRowid);

    const slugBrn = input.reraBrn.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const referralCode = `${slugBrn}-${randomBytes(2).toString('hex')}`;

    const paRes = db
      .prepare(
        `INSERT INTO partner_agents (user_id, agency_id, rera_brn, brn_expiry_date, referral_code, is_agency_admin)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .run(userId, agency.id, input.reraBrn.trim().toUpperCase(), input.brnExpiryDate, referralCode, isAdmin ? 1 : 0);

    const user = db
      .prepare(
        `SELECT id, email, phone, full_name_en, full_name_ar, role, is_mlro, can_approve_rates, preferred_lang, status
         FROM users WHERE id = ?`,
      )
      .get(userId) as UserRecord;

    writeAuditLog(db, user, 'partner_agents', Number(paRes.lastInsertRowid), 'SELF_REGISTER_PARTNER', null, {
      agencyId: agency.id,
      reraOrn: ornClean,
      reraBrn: input.reraBrn,
    });

    db.exec('COMMIT');
    return {
      user,
      agencyId: agency.id,
      partnerAgentId: Number(paRes.lastInsertRowid),
      referralCode,
      verificationStatus: agency.verification_status,
    };
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

export function submitPartnerLead(
  db: DatabaseSync,
  actor: UserRecord,
  input: {
    contactName: string;
    contactPhone: string;
    contactEmail?: string;
    transactionType?: 'READY_PURCHASE' | 'OFFPLAN_HANDOVER' | 'BUYOUT' | 'EQUITY_RELEASE' | 'COMMERCIAL' | 'CONSTRUCTION';
    targetPropertyFils: number;
    clientConsentConfirmed: boolean;
    notes?: string;
  },
): number {
  assertRole(actor, ['PARTNER_AGENCY_ADMIN', 'PARTNER_AGENT']);
  if (!input.clientConsentConfirmed) {
    throw new Error('UAE PDPL consent confirmation is mandatory before submitting buyer contact data');
  }

  const pa = db
    .prepare('SELECT id FROM partner_agents WHERE user_id = ? AND status = ?')
    .get(actor.id, 'ACTIVE') as { id: number } | undefined;
  if (!pa) throw new ForbiddenError('Active RERA partner agent profile not found');

  const defaultAdvisor = db
    .prepare("SELECT id FROM users WHERE role = 'SALES_ADVISOR' AND status = 'ACTIVE' ORDER BY id ASC LIMIT 1")
    .get() as { id: number } | undefined;

  const dueAt = new Date(Date.now() + 5 * 60_000).toISOString(); // 5-minute GST SLA
  const nowIso = new Date().toISOString();
  const txType = input.transactionType ?? 'READY_PURCHASE';
  const desk = txType === 'COMMERCIAL' ? 'COMMERCIAL_DESK' : 'RESIDENT_DESK';

  const res = db
    .prepare(
      `INSERT INTO leads (
        contact_name, contact_phone, contact_email, source_channel, partner_agent_id,
        assigned_advisor_id, desk, transaction_type, target_property_fils,
        stage, first_response_due_at, client_consent_logged_at
      ) VALUES (?, ?, ?, 'PARTNER_HUB', ?, ?, ?, ?, ?, 'NEW', ?, ?)`,
    )
    .run(
      input.contactName.trim(),
      input.contactPhone.trim(),
      (input.contactEmail ?? '').trim(),
      pa.id,
      defaultAdvisor?.id ?? null,
      desk,
      txType,
      Math.max(0, Math.round(input.targetPropertyFils)),
      dueAt,
      nowIso,
    );

  const leadId = Number(res.lastInsertRowid);
  if (input.notes?.trim()) {
    db.prepare(
      `INSERT INTO comm_messages (lead_id, channel, direction, sender_name, body, internal_only)
       VALUES (?, 'INTERNAL_NOTE', 'INBOUND', ?, ?, 0)`,
    ).run(leadId, actor.full_name_en, input.notes.trim());
  }

  writeAuditLog(db, actor, 'leads', leadId, 'PARTNER_LEAD_DROP', null, {
    contactName: input.contactName,
    partnerAgentId: pa.id,
  });
  return leadId;
}

export function registerPortalBorrower(
  db: DatabaseSync,
  input: {
    fullNameEn: string;
    fullNameAr?: string;
    email: string;
    phone: string;
    password: string;
    residencyType?: 'UAE_NATIONAL' | 'EXPAT_RESIDENT' | 'GCC_NATIONAL' | 'NON_RESIDENT';
    monthlyIncomeFils?: number;
    purchasePriceFils?: number;
    targetLoanFils?: number;
    communityName?: string;
  },
) {
  const emailClean = input.email.trim().toLowerCase();
  const resType = input.residencyType ?? 'EXPAT_RESIDENT';
  const priceFils = input.purchasePriceFils ?? 250_000_000;
  const loanFils = input.targetLoanFils ?? Math.round(priceFils * 0.8);
  const salaryFils = input.monthlyIncomeFils ?? 3_000_000;

  db.exec('BEGIN IMMEDIATE');
  try {
    const passHash = hashPassword(input.password);
    const uRes = db
      .prepare(
        `INSERT INTO users (email, phone, full_name_en, full_name_ar, password_hash, role, preferred_lang)
         VALUES (?, ?, ?, ?, ?, 'CLIENT', 'en')`,
      )
      .run(emailClean, input.phone.trim(), input.fullNameEn.trim(), input.fullNameAr?.trim() ?? '', passHash);
    const userId = Number(uRes.lastInsertRowid);

    const segment =
      resType === 'UAE_NATIONAL' ? 'UAE_NATIONAL' : resType === 'NON_RESIDENT' ? 'NON_RESIDENT' : 'RESIDENT_SALARIED';
    const hhId = Number(
      db.prepare('INSERT INTO households (primary_name, segment) VALUES (?, ?)').run(input.fullNameEn.trim(), segment)
        .lastInsertRowid,
    );

    const appId = Number(
      db
        .prepare(
          `INSERT INTO applicants (
            household_id, user_id, applicant_role, full_name_en, full_name_ar,
            email, phone, residency_type, basic_salary_fils, allowances_fils
          ) VALUES (?, ?, 'PRIMARY', ?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(
          hhId,
          userId,
          input.fullNameEn.trim(),
          input.fullNameAr?.trim() ?? '',
          emailClean,
          input.phone.trim(),
          resType,
          Math.round(salaryFils * 0.7),
          Math.round(salaryFils * 0.3),
        ).lastInsertRowid,
    );

    const defaultAdvisor = db
      .prepare("SELECT id FROM users WHERE role = 'SALES_ADVISOR' AND status = 'ACTIVE' ORDER BY id ASC LIMIT 1")
      .get() as { id: number } | undefined;
    const dueAt = new Date(Date.now() + 5 * 60_000).toISOString();

    const leadId = Number(
      db
        .prepare(
          `INSERT INTO leads (
            household_id, contact_name, contact_phone, contact_email, source_channel,
            assigned_advisor_id, desk, transaction_type, target_property_fils,
            stage, first_response_due_at, client_consent_logged_at
          ) VALUES (?, ?, ?, ?, 'PORTAL_SELF_REG', ?, 'RESIDENT_DESK', 'READY_PURCHASE', ?, 'CONVERTED_TO_DEAL', ?, datetime('now'))`,
        )
        .run(hhId, input.fullNameEn.trim(), input.phone.trim(), emailClean, defaultAdvisor?.id ?? null, priceFils, dueAt)
        .lastInsertRowid,
    );

    const nextDealSeq = (db.prepare('SELECT COUNT(*) as c FROM deals').get() as { c: number }).c + 1;
    const dealRef = `BW-2026-${String(nextDealSeq).padStart(4, '0')}`;
    const defaultBank = db.prepare('SELECT id FROM banks ORDER BY id ASC LIMIT 1').get() as { id: number };
    const defaultCard = db
      .prepare("SELECT id FROM bank_rate_cards WHERE bank_id = ? AND status = 'ACTIVE' LIMIT 1")
      .get(defaultBank.id) as { id: number };

    const dealId = Number(
      db
        .prepare(
          `INSERT INTO deals (
            deal_ref, origin_mode, lead_id, household_id, advisor_id, transaction_type,
            emirate, community_name, property_status, is_first_home,
            purchase_price_fils, estimated_valuation_fils, target_loan_fils, tenure_months,
            stage, cdd_status, selected_bank_id, selected_rate_card_id
          ) VALUES (
            ?, 'LIVE', ?, ?, ?, 'READY_PURCHASE', 'dubai', ?, 'READY', 1,
            ?, ?, ?, 300, 'KFS_PENDING', 'PENDING', ?, ?
          )`,
        )
        .run(
          dealRef,
          leadId,
          hhId,
          defaultAdvisor?.id ?? null,
          input.communityName?.trim() || 'Dubai Hills Estate',
          priceFils,
          priceFils,
          loanFils,
          defaultBank.id,
          defaultCard.id,
        ).lastInsertRowid,
    );

    db.prepare('INSERT INTO conveyancing_cases (deal_id) VALUES (?)').run(dealId);

    const user = db
      .prepare(
        `SELECT id, email, phone, full_name_en, full_name_ar, role, is_mlro, can_approve_rates, preferred_lang, status
         FROM users WHERE id = ?`,
      )
      .get(userId) as UserRecord;

    writeAuditLog(db, user, 'deals', dealId, 'PORTAL_SELF_REGISTER', null, { dealRef, applicantId: appId });
    db.exec('COMMIT');
    return { user, dealId, dealRef, applicantId: appId };
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

/** Lead_Sources_and_Consent (spec 10) routing_rule: ROUND_ROBIN, or a user id / email. */
export function routeLead(db: DatabaseSync, channel: string): number | null {
  const row = activeRows(db, 10).find((r) => r.channel.toUpperCase().replace(/[\s-]+/g, '_') === channel);
  if (!row?.routing_rule) return null;
  if (/round.?robin/i.test(row.routing_rule)) {
    const a = db.prepare(`SELECT u.id FROM users u WHERE u.role = 'SALES_ADVISOR' AND u.status = 'ACTIVE'
      ORDER BY (SELECT COUNT(*) FROM leads l WHERE l.assigned_advisor_id = u.id AND l.stage IN ('NEW','CONTACTED')) ASC, u.id ASC LIMIT 1`).get() as { id: number } | undefined;
    return a?.id ?? null;
  }
  const u = db.prepare("SELECT id FROM users WHERE status = 'ACTIVE' AND (CAST(id AS TEXT) = ? OR lower(email) = lower(?))").get(row.routing_rule, row.routing_rule) as { id: number } | undefined;
  return u?.id ?? null;
}

export function intakeExternalLead(
  db: DatabaseSync,
  actor: UserRecord | null,
  input: {
    contactName: string;
    contactPhone: string;
    contactEmail?: string;
    sourceChannel?:
      | 'WEBSITE_CALC'
      | 'QUALIFIER'
      | 'WHATSAPP'
      | 'PARTNER_HUB'
      | 'PROPERTY_FINDER'
      | 'BAYUT'
      | 'DUBIZZLE'
      | 'META'
      | 'GOOGLE'
      | 'SELF_GEN';
    transactionType?: 'READY_PURCHASE' | 'OFFPLAN_HANDOVER' | 'BUYOUT' | 'EQUITY_RELEASE' | 'COMMERCIAL' | 'CONSTRUCTION';
    targetPropertyFils?: number;
    desk?: string;
    calculatorSnapshot?: unknown;
    initialMessage?: string;
  },
) {
  // One active lead history per inquiry: a repeat enquiry (same phone or email) is added to the existing lead.
  const digits = input.contactPhone.replace(/\D/g, '').slice(-9);
  const email = (input.contactEmail ?? '').trim().toLowerCase();
  const dup = db.prepare("SELECT id, contact_phone, contact_email FROM leads WHERE stage NOT IN ('DISQUALIFIED')").all() as { id: number; contact_phone: string; contact_email: string }[];
  const existing = dup.find((l) => (digits.length >= 7 && l.contact_phone.replace(/\D/g, '').slice(-9) === digits) || (email && l.contact_email.toLowerCase() === email));
  if (existing) {
    db.prepare("INSERT INTO comm_messages (lead_id, channel, direction, sender_name, body, internal_only) VALUES (?, 'INTERNAL_NOTE', 'INTERNAL', ?, ?, 1)")
      .run(existing.id, input.contactName.trim(), `Repeat enquiry via ${input.sourceChannel ?? 'WEBSITE_CALC'}${input.initialMessage ? `: ${input.initialMessage.trim()}` : ''}`);
    writeAuditLog(db, actor, 'leads', existing.id, 'LEAD_REPEAT_ENQUIRY', null, { channel: input.sourceChannel });
    return { leadId: existing.id, duplicateOf: existing.id };
  }

  const defaultAdvisor = db
    .prepare("SELECT id FROM users WHERE role = 'SALES_ADVISOR' AND status = 'ACTIVE' ORDER BY id ASC LIMIT 1")
    .get() as { id: number } | undefined;

  const assignedAdvisorId = actor?.role === 'SALES_ADVISOR' ? actor.id : routeLead(db, input.sourceChannel ?? 'WEBSITE_CALC') ?? defaultAdvisor?.id ?? null;
  const dueAt = new Date(Date.now() + 5 * 60_000).toISOString();
  const txType = input.transactionType ?? 'READY_PURCHASE';
  const desk = input.desk || (txType === 'COMMERCIAL' ? 'COMMERCIAL_DESK' : 'RESIDENT_DESK');
  const channel = input.sourceChannel ?? 'WEBSITE_CALC';

  const res = db
    .prepare(
      `INSERT INTO leads (
        contact_name, contact_phone, contact_email, source_channel, calculator_snapshot_json,
        assigned_advisor_id, desk, transaction_type, target_property_fils,
        stage, first_response_due_at, client_consent_logged_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'NEW', ?, datetime('now'))`,
    )
    .run(
      input.contactName.trim(),
      input.contactPhone.trim(),
      (input.contactEmail ?? '').trim(),
      channel,
      input.calculatorSnapshot ? JSON.stringify(input.calculatorSnapshot) : null,
      assignedAdvisorId,
      desk,
      txType,
      Math.max(0, Math.round(input.targetPropertyFils ?? 0)),
      dueAt,
    );

  const leadId = Number(res.lastInsertRowid);
  if (input.initialMessage?.trim()) {
    db.prepare(
      `INSERT INTO comm_messages (lead_id, channel, direction, sender_name, body, internal_only)
       VALUES (?, 'WHATSAPP', 'INBOUND', ?, ?, 0)`,
    ).run(leadId, input.contactName.trim(), input.initialMessage.trim());
  }

  writeAuditLog(db, actor, 'leads', leadId, 'LEAD_INTAKE', null, { channel, contactName: input.contactName });
  return { leadId, duplicateOf: null as number | null };
}

export function convertLeadToDeal(
  db: DatabaseSync,
  actor: UserRecord,
  input: {
    leadId: number;
    residencyType: 'UAE_NATIONAL' | 'EXPAT_RESIDENT' | 'GCC_NATIONAL' | 'NON_RESIDENT';
    employmentType?: 'SALARIED' | 'SELF_EMPLOYED' | 'INVESTOR';
    basicSalaryFils: number;
    allowancesFils: number;
    purchasePriceFils: number;
    estimatedValuationFils?: number;
    targetLoanFils: number;
    directClientFeeFils?: number;
    tenureMonths: number;
    emirate: string;
    communityName: string;
    projectId?: number | null;
    propertyStatus?: 'READY' | 'OFFPLAN_UNDER_CONSTRUCTION' | 'HANDOVER_COMPLETION';
    isFirstHome?: boolean;
    selectedBankId?: number;
  },
) {
  assertRole(actor, ['SUPER_ADMIN', 'SALES_ADVISOR', 'CREDIT_UNDERWRITER', 'PROGRESSION_MANAGER']);

  const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(input.leadId) as Record<string, unknown> | undefined;
  if (!lead) throw new Error(`Lead ${input.leadId} not found`);

  db.exec('BEGIN IMMEDIATE');
  try {
    const segment =
      input.residencyType === 'UAE_NATIONAL'
        ? 'UAE_NATIONAL'
        : input.residencyType === 'NON_RESIDENT'
          ? 'NON_RESIDENT'
          : input.employmentType === 'SELF_EMPLOYED'
            ? 'SELF_EMPLOYED'
            : 'RESIDENT_SALARIED';

    let householdId = lead.household_id ? Number(lead.household_id) : 0;
    if (!householdId) {
      householdId = Number(
        db.prepare('INSERT INTO households (primary_name, segment) VALUES (?, ?)').run(String(lead.contact_name), segment)
          .lastInsertRowid,
      );
    }

    const existingPrimary = db
      .prepare("SELECT id FROM applicants WHERE household_id = ? AND applicant_role = 'PRIMARY' LIMIT 1")
      .get(householdId) as { id: number } | undefined;

    let primaryApplicantId: number;
    if (existingPrimary) {
      primaryApplicantId = existingPrimary.id;
      db.prepare(
        `UPDATE applicants
         SET residency_type = ?, employment_type = ?, basic_salary_fils = ?, allowances_fils = ?
         WHERE id = ?`,
      ).run(
        input.residencyType,
        input.employmentType ?? 'SALARIED',
        input.basicSalaryFils,
        input.allowancesFils,
        primaryApplicantId,
      );
    } else {
      primaryApplicantId = Number(
        db
          .prepare(
            `INSERT INTO applicants (
              household_id, applicant_role, full_name_en, email, phone,
              nationality_code, residence_country, residency_type, employment_type,
              basic_salary_fils, allowances_fils
            ) VALUES (?, 'PRIMARY', ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          )
          .run(
            householdId,
            String(lead.contact_name),
            String(lead.contact_email || ''),
            String(lead.contact_phone || ''),
            input.residencyType === 'UAE_NATIONAL' ? 'AE' : 'GB',
            input.residencyType === 'NON_RESIDENT' ? 'GB' : 'AE',
            input.residencyType,
            input.employmentType ?? 'SALARIED',
            input.basicSalaryFils,
            input.allowancesFils,
          ).lastInsertRowid,
      );
    }

    const nextSeq = (db.prepare('SELECT COUNT(*) as c FROM deals').get() as { c: number }).c + 1;
    const dealRef = `BW-2026-${String(nextSeq).padStart(4, '0')}`;

    const bankId =
      input.selectedBankId ??
      (db.prepare('SELECT id FROM banks ORDER BY id ASC LIMIT 1').get() as { id: number }).id;
    const rateCard = db
      .prepare("SELECT id FROM bank_rate_cards WHERE bank_id = ? AND status = 'ACTIVE' ORDER BY fixed_years ASC LIMIT 1")
      .get(bankId) as { id: number } | undefined;

    const leadSourceCat = lead.source_channel === 'SELF_GEN' ? 'SELF_GEN' : 'COMPANY_OR_PARTNER';
    const advisorId = lead.assigned_advisor_id ? Number(lead.assigned_advisor_id) : actor.id;

    const dealId = Number(
      db
        .prepare(
          `INSERT INTO deals (
            deal_ref, origin_mode, lead_id, household_id, partner_agent_id, lead_source_category,
            advisor_id, transaction_type, emirate, community_name, project_id, property_status,
            is_first_home, purchase_price_fils, estimated_valuation_fils, target_loan_fils,
            direct_client_fee_fils, tenure_months, stage, cdd_status, selected_bank_id, selected_rate_card_id
          ) VALUES (
            ?, 'LIVE', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'KFS_PENDING', 'PENDING', ?, ?
          )`,
        )
        .run(
          dealRef,
          input.leadId,
          householdId,
          lead.partner_agent_id ? Number(lead.partner_agent_id) : null,
          leadSourceCat,
          advisorId,
          String(lead.transaction_type || 'READY_PURCHASE'),
          input.emirate,
          input.communityName,
          input.projectId ?? null,
          input.propertyStatus ?? 'READY',
          input.isFirstHome === false ? 0 : 1,
          input.purchasePriceFils,
          input.estimatedValuationFils ?? input.purchasePriceFils,
          input.targetLoanFils,
          input.directClientFeeFils ?? 0,
          input.tenureMonths,
          bankId,
          rateCard?.id ?? null,
        ).lastInsertRowid,
    );

    db.prepare('INSERT OR IGNORE INTO conveyancing_cases (deal_id, deposit_cheque_fils) VALUES (?, ?)').run(
      dealId,
      Math.round(input.purchasePriceFils * 0.1),
    );

    db.prepare(
      `UPDATE leads
       SET household_id = ?, stage = 'CONVERTED_TO_DEAL', first_responded_at = COALESCE(first_responded_at, datetime('now'))
       WHERE id = ?`,
    ).run(householdId, input.leadId);

    writeAuditLog(db, actor, 'deals', dealId, 'CONVERT_LEAD_TO_DEAL', { leadId: input.leadId }, { dealRef, householdId });
    db.exec('COMMIT');
    return { dealId, dealRef, householdId, primaryApplicantId };
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

function assertDealVaultAccess(db: DatabaseSync, actor: UserRecord, dealId: number) {
  if (actor.role === 'PARTNER_AGENT' || actor.role === 'PARTNER_AGENCY_ADMIN') {
    throw new ForbiddenError('Chinese-wall restriction: B2B RERA partners cannot access borrower Smart Vault documents');
  }
  const deal = db.prepare('SELECT id, household_id FROM deals WHERE id = ?').get(dealId) as
    | { id: number; household_id: number }
    | undefined;
  if (!deal) throw new Error(`Deal ${dealId} not found`);

  if (actor.role === 'CLIENT') {
    const owns = db
      .prepare('SELECT id FROM applicants WHERE household_id = ? AND user_id = ? LIMIT 1')
      .get(deal.household_id, actor.id);
    if (!owns) {
      throw new ForbiddenError('Borrower Smart Vault isolation: access restricted to your own household');
    }
    return deal;
  }

  assertRole(actor, INTERNAL_DEAL_ROLES);
  return deal;
}

export function uploadDealVaultDocument(
  db: DatabaseSync,
  actor: UserRecord,
  input: {
    dealId: number;
    applicantId?: number | null;
    docCategory:
      | 'PASSPORT'
      | 'EMIRATES_ID'
      | 'VISA'
      | 'SALARY_CERT'
      | 'PAYSLIPS_6M'
      | 'BANK_STATEMENTS_6M'
      | 'AUDIT_FINANCIALS'
      | 'TRADE_LICENCE'
      | 'AECB_REPORT'
      | 'FORM_F'
      | 'KFS_SIGNED'
      | 'FOL_SIGNED'
      | 'TITLE_DEED'
      | 'TAKAFUL_POLICY';
    fileName: string;
    mimeType: string;
    plainBytes: Buffer;
    documentIssueDate?: string | null;
    documentExpiryDate?: string | null;
  },
  dataDir = resolveDataDir(),
): number {
  assertDealVaultAccess(db, actor, input.dealId);

  let ocrStatus: 'PASSED' | 'WARNING_EXPIRY_180D' | 'WARNING_STALE_30D' = 'PASSED';
  let ocrNotes = 'Document integrity & date window verified.';
  const nowMs = Date.now();

  if (['PASSPORT', 'EMIRATES_ID', 'VISA'].includes(input.docCategory) && input.documentExpiryDate) {
    const expMs = Date.parse(input.documentExpiryDate + 'T00:00:00Z');
    const daysLeft = Math.floor((expMs - nowMs) / 86_400_000);
    if (daysLeft < 180) {
      ocrStatus = 'WARNING_EXPIRY_180D';
      ocrNotes = `Identity document has ${daysLeft} days validity remaining (< 180-day UAE bank threshold).`;
    }
  } else if (input.docCategory === 'SALARY_CERT' && input.documentIssueDate) {
    const issMs = Date.parse(input.documentIssueDate + 'T00:00:00Z');
    const ageDays = Math.floor((nowMs - issMs) / 86_400_000);
    if (ageDays > 30) {
      ocrStatus = 'WARNING_STALE_30D';
      ocrNotes = `Salary certificate is ${ageDays} days old (> 30-day UAE bank validity rule).`;
    }
  }

  const docUuid = randomUUID();
  const enc = writeEncryptedVaultFile(input.dealId, docUuid, input.plainBytes, dataDir);

  const res = db
    .prepare(
      `INSERT INTO vault_documents (
        doc_uuid, deal_id, applicant_id, doc_category, file_name, mime_type, byte_size,
        sha256_hash, storage_path, iv_hex, auth_tag_hex,
        document_issue_date, document_expiry_date, ocr_validation_status, ocr_notes, uploaded_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      docUuid,
      input.dealId,
      input.applicantId ?? null,
      input.docCategory,
      input.fileName,
      input.mimeType,
      input.plainBytes.byteLength,
      enc.sha256Hash,
      enc.relativePath,
      enc.ivHex,
      enc.authTagHex,
      input.documentIssueDate ?? null,
      input.documentExpiryDate ?? null,
      ocrStatus,
      ocrNotes,
      actor.id,
    );

  const docId = Number(res.lastInsertRowid);
  writeAuditLog(db, actor, 'vault_documents', docId, 'UPLOAD_ENCRYPTED_DOC', null, {
    dealId: input.dealId,
    docCategory: input.docCategory,
    ocrStatus,
  });
  return docId;
}

export function downloadDealVaultDocument(
  db: DatabaseSync,
  actor: UserRecord,
  docId: number,
  dataDir = resolveDataDir(),
) {
  const doc = db.prepare('SELECT * FROM vault_documents WHERE id = ?').get(docId) as
    | {
        id: number;
        doc_uuid: string;
        deal_id: number;
        doc_category: string;
        file_name: string;
        mime_type: string;
        storage_path: string;
        iv_hex: string;
        auth_tag_hex: string;
      }
    | undefined;
  if (!doc) throw new Error(`Vault document ${docId} not found`);

  assertDealVaultAccess(db, actor, doc.deal_id);
  const plainBytes = readEncryptedVaultFile(doc.storage_path, doc.iv_hex, doc.auth_tag_hex, dataDir);

  writeAuditLog(db, actor, 'vault_documents', doc.id, 'DOWNLOAD_DECRYPTED_DOC', null, {
    dealId: doc.deal_id,
    fileName: doc.file_name,
  });
  return { doc, plainBytes };
}

export function submitDealToBanks(
  db: DatabaseSync,
  actor: UserRecord,
  input: {
    dealId: number;
    primaryBankId: number;
    backupBankId?: number | null;
    underwriterNotes?: string;
  },
) {
  assertRole(actor, ['SUPER_ADMIN', 'SALES_ADVISOR', 'CREDIT_UNDERWRITER']);

  const gate = checkBankSubmissionGate(db, input.dealId);
  if (!gate.allowed) {
    const reasons: string[] = [];
    if (gate.missingKfsApplicants.length > 0) {
      reasons.push(`CBUAE KFS acknowledgement missing for obligated applicant(s): ${gate.missingKfsApplicants.join(', ')}`);
    }
    if (gate.cddBlocker) {
      reasons.push(gate.cddBlocker);
    }
    throw new Error(`Bank submission gate blocked — ${reasons.join(' | ')}`);
  }

  const uw = evaluateDealAcross24Banks(db, input.dealId);
  const deal = db.prepare('SELECT * FROM deals WHERE id = ?').get(input.dealId) as Record<string, unknown>;

  const buildSubmission = (bankId: number, priority: 'PRIMARY' | 'BACKUP') => {
    const matched = uw.eligibleOffers.find((o) => o.bankId === bankId);
    if (!matched) {
      const ko = uw.knockouts.find((k) => k.bankId === bankId);
      throw new Error(
        `Bank #${bankId} is ineligible / knocked out for this deal: ${ko?.reason ?? 'Failed CBUAE DBR/LTV/APL criteria'}`,
      );
    }

    db.prepare(
      `INSERT INTO deal_submissions (
        deal_id, bank_id, rate_card_id, priority, submitted_loan_fils,
        calculated_dbr_bps, calculated_ltv_bps, status, underwriter_notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'SUBMITTED', ?)`,
    ).run(
      input.dealId,
      bankId,
      matched.rateCardId,
      priority,
      Number(deal.target_loan_fils),
      matched.calculatedDbrBps,
      matched.calculatedLtvBps,
      input.underwriterNotes ?? '',
    );
    return matched.rateCardId;
  };

  db.exec('BEGIN IMMEDIATE');
  try {
    let count = 0;
    const primaryCardId = buildSubmission(input.primaryBankId, 'PRIMARY');
    count += 1;
    if (input.backupBankId && input.backupBankId !== input.primaryBankId) {
      buildSubmission(input.backupBankId, 'BACKUP');
      count += 1;
    }

    db.prepare(
      `UPDATE deals
       SET stage = 'IPA_SUBMITTED', selected_bank_id = ?, selected_rate_card_id = ?, underwriter_id = COALESCE(underwriter_id, ?)
       WHERE id = ?`,
    ).run(input.primaryBankId, primaryCardId, actor.id, input.dealId);

    openStageTask(db, input.dealId, 'IPA_SUBMITTED');
    writeAuditLog(db, actor, 'deals', input.dealId, 'SUBMIT_DUAL_BANK_IPA', null, {
      primaryBankId: input.primaryBankId,
      backupBankId: input.backupBankId ?? null,
      submissionsCount: count,
    });
    db.exec('COMMIT');
    return { stage: 'IPA_SUBMITTED' as const, submissionsCount: count };
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

export function verifyAndSignPartnerAgency(
  db: DatabaseSync,
  actor: UserRecord,
  input: {
    agencyId: number;
    bankName: string;
    iban: string;
    vatTrn15?: string;
    defaultSplitBps?: number;
  },
) {
  assertRole(actor, ['SUPER_ADMIN', 'FINANCE_ADMIN', 'COMPLIANCE_MLRO']);

  const agency = db.prepare('SELECT * FROM partner_agencies WHERE id = ?').get(input.agencyId) as
    | Record<string, unknown>
    | undefined;
  if (!agency) throw new Error(`Partner agency ${input.agencyId} not found`);

  const today = new Date().toISOString().slice(0, 10);
  const trn = input.vatTrn15 !== undefined ? input.vatTrn15.trim() : String(agency.vat_trn_15 || '');
  const hasTrn = trn.length === 15;

  db.exec('BEGIN IMMEDIATE');
  try {
    db.prepare(
      `UPDATE partner_agencies
       SET verification_status = 'VERIFIED',
           agreement_status = 'SIGNED',
           agreement_signed_at = datetime('now'),
           bank_name = ?,
           iban = ?,
           vat_trn_15 = ?,
           default_split_bps = COALESCE(?, default_split_bps)
       WHERE id = ?`,
    ).run(input.bankName.trim(), input.iban.trim(), trn, input.defaultSplitBps ?? null, input.agencyId);

    const heldRows = db
      .prepare(
        `SELECT * FROM commission_settlements
         WHERE partner_agency_id = ? AND partner_payout_status = 'ONBOARDING_HOLD'`,
      )
      .all(input.agencyId) as Record<string, unknown>[];

    for (const cs of heldRows) {
      const heldExVat = Number(cs.partner_held_ex_vat_fils || 0);
      const heldVat = Number(cs.partner_held_vat_fils || 0);
      const isExemptDeal = cs.vat_mode === 'EXEMPT';
      const targetVat = hasTrn && heldExVat > 0 ? Math.round(heldExVat * 0.05) : heldVat;
      const incrementalNewVat = Math.max(0, targetVat - heldVat);
      const totalHeldLiability = heldExVat + heldVat;
      const totalReadyPayable = heldExVat + targetVat;

      if (totalReadyPayable > 0) {
        postJournalEntry(db, actor, {
          entryDate: today,
          memo: `Release Partner Commission Hold upon ORN & Agreement Verification (Deal #${cs.deal_id})`,
          sourceModule: 'PARTNER_ONBOARDING_RELEASE',
          sourceId: `AGENCY:${input.agencyId}:DEAL:${cs.deal_id}`,
          lines: [
            ...(totalHeldLiability > 0
              ? [{ accountCode: '2110', debitFils: totalHeldLiability, creditFils: 0, lineMemo: 'Clear Onboarding Hold' }]
              : []),
            ...(incrementalNewVat > 0
              ? [
                  {
                    accountCode: isExemptDeal ? '5100' : '2310',
                    debitFils: incrementalNewVat,
                    creditFils: 0,
                    lineMemo: isExemptDeal ? 'Irrecoverable Partner VAT' : 'Recoverable Partner Input VAT on Hold Release',
                  },
                ]
              : []),
            { accountCode: '2100', debitFils: 0, creditFils: totalReadyPayable, lineMemo: 'Partner Payable Ready' },
          ],
        });
      }

      if (heldExVat > 0) {
        createPintAeTaxInvoice(db, actor, {
          invoiceType: 'SELF_BILLED_PARTNER',
          dealId: Number(cs.deal_id),
          counterpartyName: String(agency.company_name),
          counterpartyTrn15: trn,
          issueDate: today,
          supplyDate: today,
          subtotalFils: heldExVat,
          vatRateBps: hasTrn ? 500 : 0,
          skipGlPosting: true,
          description: `Self-billed RERA Introducer Split released post-ORN verification (Deal #${cs.deal_id})`,
        });
      }

      db.prepare(
        `UPDATE commission_settlements
         SET partner_input_vat_fils = partner_input_vat_fils + ?,
             partner_held_ex_vat_fils = 0,
             partner_held_vat_fils = 0,
             partner_payout_status = 'PAYABLE_READY'
         WHERE id = ?`,
      ).run(incrementalNewVat, Number(cs.id));
    }

    writeAuditLog(db, actor, 'partner_agencies', input.agencyId, 'VERIFY_ORN_AND_SIGN_AGREEMENT', agency, {
      releasedSettlementsCount: heldRows.length,
    });

    db.exec('COMMIT');
    return { agencyId: input.agencyId, releasedSettlementsCount: heldRows.length };
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}
