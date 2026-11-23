import { NextResponse } from 'next/server';
import { getDb } from '@/server/db';
import { getCurrentUser } from '@/server/auth/request';
import {
  assertMlroAccess,
  assertRole,
  extractClientIp,
  ForbiddenError,
  UnauthorizedError,
  writeAuditLog,
  type UserRole,
} from '@/server/auth';
import {
  convertLeadToDeal,
  intakeExternalLead,
  submitDealToBanks,
  submitPartnerLead,
  verifyAndSignPartnerAgency,
} from '@/server/services/os-service';
import { approveRateCard, submitRateCardForApproval } from '@/server/engines/underwriting-engine';
import {
  createGoAmlReport,
  checkBankSubmissionGate,
  logSanadakComplaint,
  recordKfsAcknowledgement,
  runApplicantAmlScreening,
} from '@/server/engines/compliance-aml-engine';
import {
  recordBankBordereauReceipt,
  recordDealDisbursal,
  triggerBankClawback,
} from '@/server/engines/commission-clawback-engine';
import { createPintAeTaxInvoice, postJournalEntry, recordVendorBill } from '@/server/engines/ledger-tax-engine';
import { importLegacyBackbookCsv } from '@/server/engines/backbook-importer';
import { runMonthlyWpsPayroll } from '@/server/engines/wps-gratuity-engine';
import { assertWithinApprovalLimit } from '@/server/engines/approvals';
import { runBackupAndRestoreTest } from '@/server/ops/backup';
import {
  createDealWithdrawalRequest,
  decideDealWithdrawal,
  decideManagerAdminDecision,
  decideRecycleBinRequest,
  executeOwnerAdminControl,
  generateOwnerBriefing,
  recordReceptionQrCheckIn,
  requestRecordDeletionToBin,
  submitManagerAdminDecision,
  syncDailyDldTransactions,
  updateOfficeWifiLock,
} from '@/server/engines/swk-enterprise-engine';
import { recordPartnerPayout, reversePartnerPayout } from '@/server/engines/payouts';
import { startMfa, confirmMfa, disableMfa, openIncident, closeIncident, purgeRetention } from '@/server/engines/privacy';
import { saveQuote, approveQuote } from '@/server/engines/quotes';
import { reviewBatch } from '@/server/data-hub/import';
import { generateUatCases } from '@/server/data-hub/uat';
import { advanceDeal, applyException, type ExceptionKind, type Stage } from '@/server/engines/workflow-engine';
import {
  evaluateCreditRiskAndDunning,
  generateFixedToFloatingAmortizationSchedule,
  registerAndValueRealEstateAsset,
  registerPdcCheque,
  transitionPdcChequeStatus,
} from '@/server/engines/oca-los-engine';
import {
  decidePendingVendorBill,
  renewEmployeeStatutoryDocument,
  submitVendorBillWithApprovalGate,
  toggleProductionSecurityLock,
  updateSalesProgressionAndBlockingDesk,
} from '@/server/engines/commercial-workflows-engine';

const STAFF_ROLES: UserRole[] = [
  'SUPER_ADMIN',
  'SALES_ADVISOR',
  'CREDIT_UNDERWRITER',
  'PROGRESSION_MANAGER',
  'COMPLIANCE_MLRO',
  'FINANCE_ADMIN',
  'HR_MANAGER',
];

export async function POST(req: Request) {
  const db = getDb();
  const isJson = (req.headers.get('content-type') || '').includes('application/json');
  const body = isJson ? await req.json() : Object.fromEntries((await req.formData()).entries());
  const action = String(body.action || '');
  const rawReturnTo = String(body.returnTo || '/os');
  const returnTo = rawReturnTo.startsWith('/') && !rawReturnTo.startsWith('//') ? rawReturnTo : '/os';

  const respondOk = (notice: string, extra?: Record<string, unknown>) => {
    if (isJson) return NextResponse.json({ ok: true, notice, ...extra });
    const cleanBase = returnTo.split('?')[0];
    const params = new URLSearchParams(returnTo.includes('?') ? returnTo.split('?')[1] : '');
    params.delete('error');
    params.set('notice', notice);
    return NextResponse.redirect(new URL(`${cleanBase}?${params.toString()}`, req.url), 303);
  };

  const respondErr = (err: unknown) => {
    const status = err instanceof UnauthorizedError ? 401 : err instanceof ForbiddenError ? 403 : 400;
    const message = err instanceof Error ? err.message : 'Operation failed';
    if (isJson) return NextResponse.json({ error: message }, { status });
    const cleanBase = returnTo.split('?')[0];
    const params = new URLSearchParams(returnTo.includes('?') ? returnTo.split('?')[1] : '');
    params.delete('notice');
    params.set('error', message);
    return NextResponse.redirect(new URL(`${cleanBase}?${params.toString()}`, req.url), 303);
  };

  try {
    const user = await getCurrentUser();
    if (!user) throw new UnauthorizedError();

    switch (action) {
      case 'create_lead': {
        assertRole(user, ['SUPER_ADMIN', 'SALES_ADVISOR', 'CREDIT_UNDERWRITER', 'PROGRESSION_MANAGER']);
        const made = intakeExternalLead(db, user, {
          contactName: String(body.contactName || ''),
          contactPhone: String(body.contactPhone || ''),
          contactEmail: String(body.contactEmail || ''),
          sourceChannel: (body.sourceChannel as 'WEBSITE_CALC') || 'SELF_GEN',
          transactionType: (body.transactionType as 'READY_PURCHASE') || 'READY_PURCHASE',
          targetPropertyFils: Math.round(Number(body.targetPropertyAed || 0) * 100),
          desk: String(body.desk || 'RESIDENT_DESK'),
          initialMessage: body.notes ? String(body.notes) : undefined,
        });
        return respondOk(made.duplicateOf ? `Already in CRM as lead #${made.duplicateOf}. Your note was added to it, no new lead created.` : 'Omnichannel lead logged with 5-minute GST SLA timer');
      }

      case 'update_lead_stage': {
        assertRole(user, STAFF_ROLES);
        const leadId = Number(body.leadId);
        const stage = String(body.stage || 'CONTACTED');
        const lost = String(body.lostReason || '').trim();
        if (stage === 'DISQUALIFIED' && !lost) throw new Error('A lost reason is required to disqualify a lead');
        db.prepare(
          `UPDATE leads SET stage = ?, lost_reason = CASE WHEN ? != '' THEN ? ELSE lost_reason END, first_responded_at = COALESCE(first_responded_at, datetime('now')) WHERE id = ?`,
        ).run(stage, lost, lost, leadId);
        writeAuditLog(db, user, 'leads', leadId, 'UPDATE_LEAD_STAGE', null, { stage, lostReason: lost || null });
        return respondOk(`Lead #${leadId} updated to ${stage}`);
      }

      case 'add_comm_message': {
        assertRole(user, STAFF_ROLES);
        const leadId = body.leadId ? Number(body.leadId) : null;
        const dealId = body.dealId ? Number(body.dealId) : null;
        const channel = String(body.channel || 'WHATSAPP');
        const msgBody = String(body.body || '').trim();
        if (!msgBody) throw new Error('Message content cannot be empty');

        db.prepare(
          `INSERT INTO comm_messages (lead_id, deal_id, channel, direction, sender_name, body, internal_only)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
        ).run(
          leadId,
          dealId,
          channel,
          channel === 'INTERNAL_NOTE' ? 'INTERNAL' : 'OUTBOUND',
          user.full_name_en,
          msgBody,
          channel === 'INTERNAL_NOTE' ? 1 : 0,
        );
        if (leadId) {
          db.prepare(`UPDATE leads SET first_responded_at = COALESCE(first_responded_at, datetime('now')) WHERE id = ?`).run(leadId);
        }
        return respondOk(`${channel} message logged to timeline`);
      }

      case 'convert_lead': {
        const res = convertLeadToDeal(db, user, {
          leadId: Number(body.leadId),
          residencyType: (body.residencyType as 'EXPAT_RESIDENT') || 'EXPAT_RESIDENT',
          employmentType: (body.employmentType as 'SALARIED') || 'SALARIED',
          basicSalaryFils: Math.round(Number(body.basicSalaryAed || 25_000) * 100),
          allowancesFils: Math.round(Number(body.allowancesAed || 10_000) * 100),
          purchasePriceFils: Math.round(Number(body.purchasePriceAed || 3_000_000) * 100),
          targetLoanFils: Math.round(Number(body.targetLoanAed || 2_400_000) * 100),
          directClientFeeFils: Math.round(Number(body.directClientFeeAed || 0) * 100),
          tenureMonths: Number(body.tenureMonths || 300),
          emirate: String(body.emirate || 'dubai'),
          communityName: String(body.communityName || 'Dubai Hills Estate'),
          propertyStatus: (body.propertyStatus as 'READY') || 'READY',
          isFirstHome: body.isFirstHome !== '0',
          selectedBankId: body.selectedBankId ? Number(body.selectedBankId) : undefined,
        });
        return respondOk(`Lead converted to Deal ${res.dealRef}`, res);
      }

      case 'add_co_borrower': {
        assertRole(user, ['SUPER_ADMIN', 'SALES_ADVISOR', 'CREDIT_UNDERWRITER']);
        const deal = db.prepare('SELECT household_id FROM deals WHERE id = ?').get(Number(body.dealId)) as
          | { household_id: number }
          | undefined;
        if (!deal) throw new Error('Deal not found');

        const roleStr = String(body.applicantRole || 'CO_BORROWER');
        db.prepare(
          `INSERT INTO applicants (
            household_id, applicant_role, full_name_en, email, phone, residency_type,
            employment_type, basic_salary_fils, allowances_fils, aecb_score
          ) VALUES (?, ?, ?, ?, ?, ?, 'SALARIED', ?, ?, ?)`,
        ).run(
          deal.household_id,
          roleStr,
          String(body.fullNameEn || '').trim(),
          String(body.email || '').trim(),
          String(body.phone || '').trim(),
          String(body.residencyType || 'EXPAT_RESIDENT'),
          Math.round(Number(body.basicSalaryAed || 15_000) * 100),
          Math.round(Number(body.allowancesAed || 5_000) * 100),
          Number(body.aecbScore || 750),
        );
        if (['PRIMARY', 'CO_BORROWER', 'GUARANTOR'].includes(roleStr)) {
          db.prepare("UPDATE deals SET cdd_status = 'PENDING' WHERE household_id = ? AND origin_mode = 'LIVE'").run(
            deal.household_id,
          );
        }
        return respondOk('Co-Borrower / Guarantor added to household (Joint KFS & CDD required)');
      }

      case 'update_applicant_income': {
        assertRole(user, ['SUPER_ADMIN', 'SALES_ADVISOR', 'CREDIT_UNDERWRITER']);
        const appId = Number(body.applicantId);
        db.prepare(
          `UPDATE applicants
           SET residency_type = ?, employment_type = ?, basic_salary_fils = ?, allowances_fils = ?,
               bonus_annual_avg_fils = ?, rental_income_annual_fils = ?, net_profit_yr1_fils = ?,
               net_profit_yr2_fils = ?, ownership_bps = ?, aecb_score = ?
           WHERE id = ?`,
        ).run(
          String(body.residencyType || 'EXPAT_RESIDENT'),
          String(body.employmentType || 'SALARIED'),
          Math.round(Number(body.basicSalaryAed || 0) * 100),
          Math.round(Number(body.allowancesAed || 0) * 100),
          Math.round(Number(body.bonusAnnualAed || 0) * 100),
          Math.round(Number(body.rentalAnnualAed || 0) * 100),
          Math.round(Number(body.netProfitYr1Aed || 0) * 100),
          Math.round(Number(body.netProfitYr2Aed || 0) * 100),
          Math.round(Number(body.ownershipPct || 100) * 100),
          Number(body.aecbScore || 750),
          appId,
        );
        writeAuditLog(db, user, 'applicants', appId, 'UPDATE_APPLICANT_FACT_FIND');
        return respondOk('Applicant income & AECB profile recalculated across 24 UAE banks');
      }

      case 'add_liability': {
        assertRole(user, ['SUPER_ADMIN', 'SALES_ADVISOR', 'CREDIT_UNDERWRITER']);
        db.prepare(
          `INSERT INTO applicant_liabilities (
            applicant_id, source, liability_type, lender_name, credit_limit_fils, outstanding_balance_fils, monthly_emi_fils
          ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        ).run(
          Number(body.applicantId),
          String(body.source || 'AECB_VERIFIED'),
          String(body.liabilityType || 'CREDIT_CARD'),
          String(body.lenderName || 'UAE Bank'),
          Math.round(Number(body.creditLimitAed || 0) * 100),
          Math.round(Number(body.balanceAed || 0) * 100),
          Math.round(Number(body.monthlyEmiAed || 0) * 100),
        );
        return respondOk('AECB / Statement liability added to DBR calculation');
      }

      case 'toggle_liability_clearance': {
        assertRole(user, ['SUPER_ADMIN', 'SALES_ADVISOR', 'CREDIT_UNDERWRITER']);
        const liabId = Number(body.liabilityId);
        db.prepare(
          `UPDATE applicant_liabilities
           SET to_be_cleared_before_fol = CASE WHEN to_be_cleared_before_fol = 1 THEN 0 ELSE 1 END
           WHERE id = ?`,
        ).run(liabId);
        return respondOk('Liability pre-FOL clearance condition toggled');
      }

      case 'update_deal_terms': {
        assertRole(user, ['SUPER_ADMIN', 'SALES_ADVISOR', 'CREDIT_UNDERWRITER', 'PROGRESSION_MANAGER']);
        const dealId = Number(body.dealId);
        const requestedStage = body.stage ? String(body.stage) : null;
        const postIpaStages = new Set([
          'IPA_SUBMITTED',
          'IPA_APPROVED',
          'MOU_SIGNED',
          'VALUATION_ORDERED',
          'VALUATION_RECEIVED',
          'FOL_ISSUED',
          'FOL_SIGNED',
          'NOC_AND_CLEARANCE',
          'CHEQUES_READY',
          'TRANSFERRED_DISBURSED',
        ]);
        if (requestedStage && postIpaStages.has(requestedStage)) {
          const gate = checkBankSubmissionGate(db, dealId);
          if (!gate.allowed) {
            throw new Error('Cannot advance deal into or past IPA_SUBMITTED before Joint KFS & CDD clearance');
          }
        }
        db.prepare(
          `UPDATE deals
           SET purchase_price_fils = ?, estimated_valuation_fils = ?, target_loan_fils = ?,
               direct_client_fee_fils = ?, tenure_months = ?, property_status = ?,
               finance_preference = ?, is_first_home = ?, housing_grant_program = ?,
               housing_grant_fils = ?, project_id = ?, pre_qual_cert_enabled = ?, stage = COALESCE(?, stage)
           WHERE id = ?`,
        ).run(
          Math.round(Number(body.purchasePriceAed || 0) * 100),
          Math.round(Number(body.estimatedValuationAed || body.purchasePriceAed || 0) * 100),
          Math.round(Number(body.targetLoanAed || 0) * 100),
          Math.round(Number(body.directClientFeeAed || 0) * 100),
          Number(body.tenureMonths || 300),
          String(body.propertyStatus || 'READY'),
          String(body.financePreference || 'ANY'),
          body.isFirstHome === '0' ? 0 : 1,
          String(body.housingGrantProgram || 'NONE'),
          Math.round(Number(body.housingGrantAed || 0) * 100),
          body.projectId ? Number(body.projectId) : null,
          body.preQualCertEnabled === '1' ? 1 : 0,
          body.stage ? String(body.stage) : null,
          dealId,
        );
        writeAuditLog(db, user, 'deals', dealId, 'UPDATE_DEAL_TERMS');
        return respondOk('Deal structure & 24-bank underwriting parameters updated');
      }

      case 'submit_dual_bank_ipa': {
        const res = submitDealToBanks(db, user, {
          dealId: Number(body.dealId),
          primaryBankId: Number(body.primaryBankId),
          backupBankId: body.backupBankId ? Number(body.backupBankId) : null,
          underwriterNotes: String(body.underwriterNotes || ''),
        });
        return respondOk(`Submitted ${res.submissionsCount} bank IPA package(s) after passing Joint KFS & CDD gates`, res);
      }

      case 'update_submission_fol': {
        assertRole(user, ['SUPER_ADMIN', 'CREDIT_UNDERWRITER', 'PROGRESSION_MANAGER']);
        const subId = Number(body.submissionId);
        const status = String(body.status || 'FOL_ISSUED');
        const folAudited = body.folAuditPassed === '1' ? 1 : 0;
        db.prepare(
          `UPDATE deal_submissions
           SET status = ?, ipa_ref = COALESCE(NULLIF(?, ''), ipa_ref),
               fol_ref = COALESCE(NULLIF(?, ''), fol_ref), fol_audit_passed = ?
           WHERE id = ?`,
        ).run(status, String(body.ipaRef || ''), String(body.folRef || ''), folAudited, subId);

        const sub = db.prepare('SELECT deal_id, bank_id, rate_card_id FROM deal_submissions WHERE id = ?').get(subId) as
          | { deal_id: number; bank_id: number; rate_card_id: number }
          | undefined;
        // Bank decisions only update the submission and chosen bank; the deal stage moves through the guarded workflow (Deal Desk).
        if (sub && (status === 'IPA_APPROVED' || status === 'FOL_ISSUED' || status === 'FOL_SIGNED')) {
          db.prepare('UPDATE deals SET selected_bank_id = ?, selected_rate_card_id = ? WHERE id = ?').run(sub.bank_id, sub.rate_card_id, sub.deal_id);
          writeAuditLog(db, user, 'deals', sub.deal_id, `BANK_${status}`, null, { submissionId: subId });
        }
        return respondOk(`Bank submission updated to ${status}`);
      }

      case 'submit_rate_card': {
        const id = submitRateCardForApproval(db, user, {
          bankId: Number(body.bankId),
          productCode: String(body.productCode || 'NEW-2Y-STL').trim(),
          financeMode: (body.financeMode as 'CONVENTIONAL') || 'CONVENTIONAL',
          residencyScope: (body.residencyScope as 'ALL') || 'ALL',
          stlRequired: body.stlRequired === '0' ? 0 : 1,
          fixedYears: Number(body.fixedYears || 2) as 2,
          introRateBps: Math.round(Number(body.introRatePct || 3.99) * 100),
          eiborTenor: (body.eiborTenor as '3M') || '3M',
          revertMarginBps: Math.round(Number(body.revertMarginPct || 1.5) * 100),
          floorRateBps: Math.round(Number(body.floorRatePct || 2.99) * 100),
          effectiveFrom: String(body.effectiveFrom || new Date().toISOString().slice(0, 10)),
        });
        return respondOk(`Rate card #${id} queued in Maker-Checker PENDING_APPROVAL`);
      }

      case 'approve_rate_card': {
        const res = approveRateCard(db, Number(body.rateCardId), user);
        return respondOk(`Rate card #${res.id} approved by Checker and activated`);
      }

      case 'upsert_project_apl': {
        assertRole(user, ['SUPER_ADMIN', 'CREDIT_UNDERWRITER']);
        db.prepare(
          `INSERT INTO bank_project_apl (bank_id, project_id, tower_name, apl_status, max_ltv_bps, valuation_basis, updated_by, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
           ON CONFLICT(bank_id, project_id, tower_name) DO UPDATE SET
             apl_status = excluded.apl_status,
             max_ltv_bps = excluded.max_ltv_bps,
             valuation_basis = excluded.valuation_basis,
             updated_by = excluded.updated_by,
             updated_at = datetime('now')`,
        ).run(
          Number(body.bankId),
          Number(body.projectId),
          String(body.towerName || 'All Towers'),
          String(body.aplStatus || 'APPROVED'),
          Math.round(Number(body.maxLtvPct || 80) * 100),
          String(body.valuationBasis || 'FRESH_MARKET_VAL'),
          user.id,
        );
        writeAuditLog(db, user, 'bank_project_apl', `${body.bankId}:${body.projectId}`, 'UPSERT_APL');
        return respondOk('Tower Approved Project List (APL) rule updated');
      }

      case 'update_conveyancing': {
        assertRole(user, ['SUPER_ADMIN', 'PROGRESSION_MANAGER', 'SALES_ADVISOR', 'CREDIT_UNDERWRITER']);
        const dealId = Number(body.dealId);
        db.prepare(
          `INSERT INTO conveyancing_cases (
            deal_id, form_f_signed_date, form_f_expiry_date, fol_contingency_date,
            deposit_cheque_no, deposit_cheque_fils, seller_has_mortgage, seller_bank_name,
            liability_letter_payoff_fils, liability_per_diem_fils, liability_letter_expires_at,
            deposit_paid_direct_fils, include_agency_fee, valuation_firm, valuation_amount_fils,
            valuation_shortfall_action, noc_status, trustee_office, transfer_appointment_at, title_deed_no
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(deal_id) DO UPDATE SET
            form_f_signed_date = excluded.form_f_signed_date,
            form_f_expiry_date = excluded.form_f_expiry_date,
            fol_contingency_date = excluded.fol_contingency_date,
            deposit_cheque_no = excluded.deposit_cheque_no,
            deposit_cheque_fils = excluded.deposit_cheque_fils,
            seller_has_mortgage = excluded.seller_has_mortgage,
            seller_bank_name = excluded.seller_bank_name,
            liability_letter_payoff_fils = excluded.liability_letter_payoff_fils,
            liability_per_diem_fils = excluded.liability_per_diem_fils,
            liability_letter_expires_at = excluded.liability_letter_expires_at,
            deposit_paid_direct_fils = excluded.deposit_paid_direct_fils,
            include_agency_fee = excluded.include_agency_fee,
            valuation_firm = excluded.valuation_firm,
            valuation_amount_fils = excluded.valuation_amount_fils,
            valuation_shortfall_action = excluded.valuation_shortfall_action,
            noc_status = excluded.noc_status,
            trustee_office = excluded.trustee_office,
            transfer_appointment_at = excluded.transfer_appointment_at,
            title_deed_no = excluded.title_deed_no`,
        ).run(
          dealId,
          body.formFSignedDate ? String(body.formFSignedDate) : null,
          body.formFExpiryDate ? String(body.formFExpiryDate) : null,
          body.folContingencyDate ? String(body.folContingencyDate) : null,
          String(body.depositChequeNo || ''),
          Math.round(Number(body.depositChequeAed || 0) * 100),
          body.sellerHasMortgage === '1' ? 1 : 0,
          String(body.sellerBankName || ''),
          Math.round(Number(body.liabilityPayoffAed || 0) * 100),
          Math.round(Number(body.liabilityPerDiemAed || 0) * 100),
          body.liabilityExpiresAt ? String(body.liabilityExpiresAt) : null,
          Math.round(Number(body.depositPaidDirectAed || 0) * 100),
          body.includeAgencyFee === '0' ? 0 : 1,
          String(body.valuationFirm || ''),
          Math.round(Number(body.valuationAmountAed || 0) * 100),
          String(body.valuationShortfallAction || 'NONE'),
          String(body.nocStatus || 'NOT_STARTED'),
          String(body.trusteeOffice || ''),
          body.transferAppointmentAt ? String(body.transferAppointmentAt) : null,
          String(body.titleDeedNo || ''),
        );
        writeAuditLog(db, user, 'conveyancing_cases', dealId, 'UPDATE_CONVEYANCING_PACK');
        return respondOk('RERA Conveyancing & 72h DLD Trustee Cheque Splitter updated');
      }

      case 'create_cross_sell': {
        assertRole(user, STAFF_ROLES);
        db.prepare(
          `INSERT INTO cross_sell_referrals (deal_id, service_type, provider_name, quoted_client_saving_fils, expected_referral_fee_fils, status)
           VALUES (?, ?, ?, ?, ?, 'PITCHED')`,
        ).run(
          Number(body.dealId),
          String(body.serviceType || 'EXTERNAL_LIFE_TAKAFUL'),
          String(body.providerName || 'Zurich Middle East'),
          Math.round(Number(body.clientSavingAed || 0) * 100),
          Math.round(Number(body.referralFeeAed || 0) * 100),
        );
        return respondOk('Ancillary 360° cross-sell mandate created');
      }

      case 'update_cross_sell_status': {
        assertRole(user, STAFF_ROLES);
        db.prepare('UPDATE cross_sell_referrals SET status = ? WHERE id = ?').run(
          String(body.status || 'COMPLETED'),
          Number(body.referralId),
        );
        return respondOk('Cross-sell referral status updated');
      }

      case 'record_disbursal': {
        assertRole(user, ['SUPER_ADMIN', 'FINANCE_ADMIN']);
        assertWithinApprovalLimit(db, user, 'DISBURSAL', Math.round(Number(body.disbursedLoanAed || 0) * 100));
        recordDealDisbursal(db, user, {
          dealId: Number(body.dealId),
          disbursedLoanFils: Math.round(Number(body.disbursedLoanAed || 0) * 100),
          disbursedDate: String(body.disbursedDate || new Date().toISOString().slice(0, 10)),
          fixedExpiryDate: String(body.fixedExpiryDate || '2028-11-16'),
        });
        return respondOk('Deal disbursed: Bank receivable, House GL 2200 Clawback Reserve & 90-Day Radar created');
      }

      case 'record_bordereau_cash': {
        assertRole(user, ['SUPER_ADMIN', 'FINANCE_ADMIN']);
        assertWithinApprovalLimit(db, user, 'BORDEREAU', Math.round(Number(body.receivedSubventionExVatAed || 0) * 100));
        const settled = recordBankBordereauReceipt(db, user, {
          dealId: Number(body.dealId),
          receivedSubventionExVatFils: Math.round(Number(body.receivedSubventionExVatAed || 0) * 100),
          receivedClientFeeExVatFils: Math.round(Number(body.receivedClientFeeExVatAed || 0) * 100),
          receivedDate: String(body.receivedDate || new Date().toISOString().slice(0, 10)),
          batchRef: String(body.batchRef || `BORD-${Date.now()}`),
        });
        return respondOk(
          `Bordereau cash reconciled (${settled.reconciliation_status}); Partner status: ${settled.partner_payout_status}`,
        );
      }

      case 'trigger_clawback': {
        assertRole(user, ['SUPER_ADMIN', 'FINANCE_ADMIN']);
        const cb = triggerBankClawback(db, user, {
          dealId: Number(body.dealId),
          clawbackClaimExVatFils: Math.round(Number(body.clawbackClaimExVatAed || 0) * 100),
          triggeredDate: String(body.triggeredDate || new Date().toISOString().slice(0, 10)),
        });
        return respondOk(
          `Clawback processed: Partner debit AED ${(cb.partner_debit_booked_fils / 100).toFixed(2)} & Advisor debit AED ${(cb.advisor_debit_booked_fils / 100).toFixed(2)} queued for next-deal offset`,
        );
      }

      case 'verify_partner_agency': {
        const res = verifyAndSignPartnerAgency(db, user, {
          agencyId: Number(body.agencyId),
          bankName: String(body.bankName || 'Emirates NBD'),
          iban: String(body.iban || ''),
          vatTrn15: body.vatTrn15 !== undefined ? String(body.vatTrn15) : undefined,
          defaultSplitBps: body.defaultSplitPct ? Math.round(Number(body.defaultSplitPct) * 100) : undefined,
        });
        return respondOk(
          `RERA ORN verified & agreement signed; ${res.releasedSettlementsCount} held commission settlement(s) released to PAYABLE_READY`,
        );
      }

      case 'update_partner_banking': {
        assertRole(user, ['PARTNER_AGENCY_ADMIN']);
        const pa = db
          .prepare('SELECT agency_id FROM partner_agents WHERE user_id = ? AND is_agency_admin = 1')
          .get(user.id) as { agency_id: number } | undefined;
        if (!pa) throw new ForbiddenError('Only verified Agency Owners can modify corporate banking & ORN agreement');

        db.prepare(
          `UPDATE partner_agencies
           SET vat_trn_15 = ?, bank_name = ?, iban = ?,
               agreement_status = CASE WHEN ? = '1' THEN 'SIGNED' ELSE agreement_status END,
               agreement_signed_at = CASE WHEN ? = '1' THEN COALESCE(agreement_signed_at, datetime('now')) ELSE agreement_signed_at END
           WHERE id = ?`,
        ).run(
          String(body.vatTrn15 || '').trim(),
          String(body.bankName || '').trim(),
          String(body.iban || '').trim(),
          String(body.signAgreement || '0'),
          String(body.signAgreement || '0'),
          pa.agency_id,
        );
        writeAuditLog(db, user, 'partner_agencies', pa.agency_id, 'PARTNER_OWNER_UPDATE_BANKING');
        return respondOk('Corporate TRN, UAE IBAN & Referral Agreement updated');
      }

      case 'drop_partner_lead': {
        const leadId = submitPartnerLead(db, user, {
          contactName: String(body.contactName || ''),
          contactPhone: String(body.contactPhone || ''),
          contactEmail: String(body.contactEmail || ''),
          transactionType: (body.transactionType as 'READY_PURCHASE') || 'READY_PURCHASE',
          targetPropertyFils: Math.round(Number(body.targetPropertyAed || 0) * 100),
          clientConsentConfirmed: body.clientConsentConfirmed === '1' || body.clientConsentConfirmed === true,
          notes: String(body.notes || ''),
        });
        return respondOk(`Buyer lead #${leadId} dropped to Betterway Advisory Desk (5-minute SLA active)`);
      }

      case 'create_pint_invoice': {
        assertRole(user, ['SUPER_ADMIN', 'FINANCE_ADMIN']);
        const inv = createPintAeTaxInvoice(db, user, {
          invoiceType: (body.invoiceType as 'TAX_INVOICE_380') || 'TAX_INVOICE_380',
          dealId: body.dealId ? Number(body.dealId) : null,
          counterpartyName: String(body.counterpartyName || ''),
          counterpartyTrn15: String(body.counterpartyTrn15 || ''),
          counterpartyPeppolId: String(body.counterpartyPeppolId || ''),
          issueDate: String(body.issueDate || new Date().toISOString().slice(0, 10)),
          supplyDate: String(body.supplyDate || new Date().toISOString().slice(0, 10)),
          subtotalFils: Math.round(Number(body.subtotalAed || 0) * 100),
          vatRateBps: Number(body.vatRatePct ?? 5) * 100,
          description: String(body.description || 'Mortgage Brokerage Advisory Services'),
        });
        return respondOk(`Peppol PINT-AE e-Invoice ${inv.invoice_number} generated & posted to GL`);
      }

      case 'create_vendor_bill': {
        assertRole(user, STAFF_ROLES);
        const subtotalFils = Math.round(Number(body.subtotalAed || 0) * 100);
        const inputVatFils = Math.round(Number(body.inputVatAed ?? (Number(body.subtotalAed || 0) * 0.05)) * 100);
        const res = submitVendorBillWithApprovalGate(db, user, {
          vendorName: String(body.vendorName || 'Office Vendor'),
          vendorTrn15: String(body.vendorTrn15 || '100000000000003'),
          billDate: String(body.billDate || new Date().toISOString().slice(0, 10)),
          expenseAccountCode: String(body.expenseAccountCode || '6200'),
          marketingChannel: body.marketingChannel ? String(body.marketingChannel) : undefined,
          subtotalFils,
          inputVatFils,
          inputVatCategory: (body.inputVatCategory as 'DIRECT_TAXABLE') || 'DIRECT_TAXABLE',
          ctDeductibility: (body.ctDeductibility as 'FULL_100') || 'FULL_100',
          requireMakerCheckerGate: body.requireMakerCheckerGate === '1',
        });
        if (res.approvalStatus === 'PENDING_OWNER_APPROVAL') {
          return respondOk(
            `Expense ${res.billNumber} (> AED 5,000) queued in Maker-Checker Approval Gate awaiting Owner Shabib Siraj / Warda / Team Manager Daniel Xavier sign-off`,
          );
        }
        return respondOk(`Company expense ${res.billNumber} recorded in General Ledger with UAE VAT & Corporate Tax rules`);
      }

      case 'decide_vendor_bill': {
        const decision = String(body.decision) === 'REJECTED' ? 'REJECTED' : 'APPROVED';
        const res = decidePendingVendorBill(db, user, {
          billId: Number(body.billId),
          decision,
        });
        return respondOk(
          `Vendor bill ${res.billNumber} ${res.approvalStatus === 'APPROVED' ? 'approved and posted to Double-Entry General Ledger' : 'rejected (zero GL impact)'}`,
        );
      }

      case 'renew_employee_document': {
        assertRole(user, ['SUPER_ADMIN', 'HR_MANAGER']);
        renewEmployeeStatutoryDocument(db, user, {
          employeeId: Number(body.employeeId),
          docField: body.docField as 'visa_expiry_date',
          newExpiryDate: String(body.newExpiryDate || '2028-12-31'),
        });
        return respondOk('Employee statutory document expiry date renewed & compliance hold cleared');
      }

      case 'toggle_production_lock': {
        const enabled = String(body.enabled) === '1';
        const res = toggleProductionSecurityLock(db, user, enabled);
        return respondOk(
          res.productionLockEnabled
            ? 'Production Security Lock ENABLED: Quick Role Switcher disabled across workspace'
            : 'Production Security Lock DISABLED: Executive Role Switcher re-enabled',
        );
      }

      case 'update_sales_progression_blocking': {
        assertRole(user, STAFF_ROLES);
        updateSalesProgressionAndBlockingDesk(db, user, {
          dealId: Number(body.dealId || 1),
          valuationFirm: String(body.valuationFirm || 'ValuStrat RICS Panel'),
          valuationAccessStatus: String(body.valuationAccessStatus || 'ACCESS_CONFIRMED'),
          developerPortalName: String(body.developerPortalName || 'Emaar Sakani Portal'),
          nocStatus: (body.nocStatus as 'ISSUED') || 'APPLIED',
          dldBlockingStage: String(body.dldBlockingStage || 'TITLE_BLOCKED_AT_TRUSTEE'),
          trusteeOffice: String(body.trusteeOffice || 'Al Manara Registration Trustee'),
        });
        return respondOk(
          'In-House Sales Progression updated: RICS Valuer Access, Developer E-NOC Portal & Finance-to-Finance DLD Blocking stage recorded',
        );
      }

      case 'post_manual_journal': {
        assertRole(user, ['SUPER_ADMIN', 'FINANCE_ADMIN']);
        const amountFils = Math.round(Number(body.amountAed || 0) * 100);
        postJournalEntry(db, user, {
          entryDate: String(body.entryDate || new Date().toISOString().slice(0, 10)),
          memo: String(body.memo || 'Manual adjustment'),
          sourceModule: 'MANUAL_JOURNAL',
          sourceId: `MAN-${Date.now()}`,
          lines: [
            { accountCode: String(body.debitAccount || '1100'), debitFils: amountFils, creditFils: 0, lineMemo: String(body.memo || '') },
            { accountCode: String(body.creditAccount || '3100'), debitFils: 0, creditFils: amountFils, lineMemo: String(body.memo || '') },
          ],
        });
        return respondOk('Balanced double-entry journal posted to General Ledger');
      }

      case 'import_backbook_csv': {
        assertRole(user, ['SUPER_ADMIN', 'FINANCE_ADMIN']);
        const res = importLegacyBackbookCsv(db, user, String(body.csvContent || ''));
        return respondOk(`Imported ${res.importedCount} legacy back-book mortgage(s) into 90-Day Radar & Clawback Watchlist`);
      }

      case 'add_employee': {
        assertRole(user, ['SUPER_ADMIN', 'HR_MANAGER']);
        db.prepare(
          `INSERT INTO employees (
            emp_code, full_name, nationality_code, is_uae_national, nafis_registered, gpssa_number,
            mohre_person_id_14, routing_agent_id_9, employee_iban_23, contract_type, department, designation,
            join_date, basic_salary_fils, housing_allowance_fils, transport_allowance_fils,
            monthly_draw_fils, visa_expiry_date, emirates_id_expiry_date, rera_card_expiry_date, medical_ins_expiry_date
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'MAINLAND_MOHRE', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        ).run(
          String(body.empCode || `BW-EMP-${Date.now().toString().slice(-3)}`),
          String(body.fullName || ''),
          String(body.nationalityCode || 'AE'),
          body.isUaeNational === '1' ? 1 : 0,
          body.nafisRegistered === '1' ? 1 : 0,
          String(body.gpssaNumber || ''),
          String(body.mohrePersonId14 || '00491827364501').padStart(14, '0').slice(0, 14),
          String(body.routingAgentId9 || '302620122').padStart(9, '0').slice(0, 9),
          String(body.employeeIban23 || 'AE070331234567890123456'),
          String(body.department || 'Sales Advisory'),
          String(body.designation || 'Mortgage Advisor'),
          String(body.joinDate || '2026-01-01'),
          Math.round(Number(body.basicSalaryAed || 10_000) * 100),
          Math.round(Number(body.housingAllowanceAed || 4_000) * 100),
          Math.round(Number(body.transportAllowanceAed || 1_000) * 100),
          Math.round(Number(body.monthlyDrawAed || 0) * 100),
          String(body.visaExpiryDate || '2028-12-31'),
          String(body.eidExpiryDate || '2028-12-31'),
          body.reraCardExpiryDate ? String(body.reraCardExpiryDate) : null,
          String(body.medicalExpiryDate || '2027-06-30'),
        );
        return respondOk('UAE employee onboarded to MOHRE WPS & Nafis/GPSSA roster');
      }

      case 'add_leave_record': {
        assertRole(user, ['SUPER_ADMIN', 'HR_MANAGER']);
        const startDate = String(body.startDate || '2026-11-01');
        const daysCount = Math.max(1, Number(body.daysCount || 5));
        const computedEnd = new Date(Date.parse(startDate + 'T00:00:00Z') + (daysCount - 1) * 86_400_000)
          .toISOString()
          .slice(0, 10);
        db.prepare(
          `INSERT INTO leave_records (employee_id, leave_type, start_date, end_date, days_count, status)
           VALUES (?, ?, ?, ?, ?, 'APPROVED')`,
        ).run(
          Number(body.employeeId),
          String(body.leaveType || 'ANNUAL'),
          startDate,
          body.endDate ? String(body.endDate) : computedEnd,
          daysCount,
        );
        return respondOk('Employee leave recorded (Unpaid days auto-deduct in WPS .SIF & EOSB)');
      }

      case 'run_wps_payroll': {
        assertRole(user, ['SUPER_ADMIN', 'HR_MANAGER', 'FINANCE_ADMIN']);
        const periodMonth = String(body.periodMonth || '2026-11');
        const run = runMonthlyWpsPayroll(db, user, {
          periodMonth,
          payStartDate: String(body.payStartDate || `${periodMonth}-01`),
          payEndDate: String(body.payEndDate || `${periodMonth}-30`),
        });
        return respondOk(`MOHRE WPS Payroll ${run.period_month} generated (${run.sif_filename})`);
      }

      case 'sign_kfs': {
        const dealId = Number(body.dealId);
        const applicantId = Number(body.applicantId);

        if (user.role === 'CLIENT') {
          const deal = db.prepare('SELECT household_id FROM deals WHERE id = ?').get(dealId) as
            | { household_id: number }
            | undefined;
          const myApp = db
            .prepare('SELECT id, user_id FROM applicants WHERE id = ? AND household_id = ?')
            .get(applicantId, deal?.household_id ?? -1) as { id: number; user_id: number | null } | undefined;
          if (!myApp) throw new ForbiddenError('Cannot sign KFS outside your household');
          if (myApp.user_id !== null && Number(myApp.user_id) !== user.id) {
            throw new ForbiddenError('Joint co-borrowers with linked accounts must sign their own CBUAE KFS personally');
          }
        } else {
          assertRole(user, ['SUPER_ADMIN', 'SALES_ADVISOR', 'CREDIT_UNDERWRITER', 'COMPLIANCE_MLRO']);
        }

        recordKfsAcknowledgement(db, {
          dealId,
          applicantId,
          disclosedBrokerFeeFils: Math.round(Number(body.disclosedBrokerFeeAed || 0) * 100),
          disclosedLfiCommissionRange: String(body.disclosedLfiCommissionRange || '0.45% - 1.00% paid by LFI'),
          signedByName: String(body.signedByName || user.full_name_en),
        });
        return respondOk('CBUAE Key Facts Statement (KFS) digitally signed & timestamped');
      }

      case 'run_aml_screening': {
        assertRole(user, ['SUPER_ADMIN', 'COMPLIANCE_MLRO', 'CREDIT_UNDERWRITER']);
        const res = runApplicantAmlScreening(db, user, {
          dealId: Number(body.dealId),
          applicantId: Number(body.applicantId),
          sourceOfFundsType: String(body.sourceOfFundsType || 'UAE_SALARY_SAVINGS'),
          verified: body.verified !== '0',
          notes: String(body.notes || ''),
        });
        return respondOk(`AML/CDD Screened: Risk=${res.riskBand} (${res.riskScore}), Deal CDD=${res.dealCddStatus}`);
      }

      case 'create_goaml_report': {
        assertMlroAccess(user);
        const flags = String(body.redFlags || 'UNVERIFIED_THIRD_PARTY_FUNDS')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
        const rep = createGoAmlReport(db, user, {
          reportType: body.reportType === 'STR' ? 'STR' : 'SAR',
          dealId: body.dealId ? Number(body.dealId) : null,
          subjectSummary: String(body.subjectSummary || ''),
          redFlags: flags,
        });
        return respondOk(`Sealed UAE FIU goAML report ${rep.report_ref} created`);
      }

      case 'log_sanadak_complaint': {
        assertRole(user, STAFF_ROLES);
        const ref = logSanadakComplaint(db, user, {
          dealId: body.dealId ? Number(body.dealId) : null,
          complainantName: String(body.complainantName || ''),
          category: String(body.category || 'Fee / Rate Disclosure'),
          description: String(body.description || ''),
        });
        return respondOk(`Complaint ${ref} logged with 2-day Ack & 15-day Sanadak SLA clocks`);
      }

      case 'resolve_sanadak_complaint': {
        assertRole(user, ['SUPER_ADMIN', 'COMPLIANCE_MLRO']);
        db.prepare(
          `UPDATE sanadak_complaints
           SET ack_sent_at = COALESCE(ack_sent_at, datetime('now')),
               resolved_at = datetime('now'),
               outcome_notes = ?
           WHERE id = ?`,
        ).run(String(body.outcomeNotes || 'Resolved in writing with borrower'), Number(body.complaintId));
        return respondOk('Customer complaint marked resolved within CBUAE / Sanadak SLA');
      }

      case 'create_wiki_article': {
        assertRole(user, ['SUPER_ADMIN', 'CREDIT_UNDERWRITER', 'COMPLIANCE_MLRO', 'PROGRESSION_MANAGER']);
        const titleEn = String(body.titleEn || '').trim();
        const slug = `${titleEn.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString().slice(-4)}`;
        db.prepare(
          `INSERT INTO wiki_articles (slug, category, bank_id, title_en, title_ar, body_en, body_ar, policy_version, clause_ref)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        ).run(
          slug,
          String(body.category || 'CBUAE Credit Policy'),
          body.bankId ? Number(body.bankId) : null,
          titleEn,
          String(body.titleAr || ''),
          String(body.bodyEn || ''),
          String(body.bodyAr || ''),
          String(body.policyVersion || 'v2026.1'),
          String(body.clauseRef || 'Internal-SOP'),
        );
        return respondOk('Bank credit policy article published to Wiki & Co-Pilot index');
      }

      case 'complete_ops_task': {
        assertRole(user, STAFF_ROLES);
        db.prepare(`UPDATE ops_tasks SET status = 'COMPLETED' WHERE id = ?`).run(Number(body.taskId));
        return respondOk('Command Board SLA task marked completed');
      }

      case 'wf_advance': {
        const r = advanceDeal(db, user, Number(body.dealId));
        return respondOk(`Deal moved to ${r.stage}`, r);
      }

      case 'wf_exception': {
        const r = applyException(db, user, Number(body.dealId), String(body.kind) as ExceptionKind, {
          reason: String(body.reason || ''),
          targetStage: body.targetStage ? (String(body.targetStage) as Stage) : undefined,
          reasonCode: body.reasonCode ? String(body.reasonCode) : undefined,
        });
        return respondOk(`Deal is now ${r.stage}`, r);
      }

      case 'save_quote': {
        const r = saveQuote(db, user, Number(body.dealId));
        return respondOk(`Quote v${r.version} saved as draft`, r);
      }

      case 'approve_quote': {
        approveQuote(db, user, Number(body.quoteId), String(body.overrideReason || ''));
        return respondOk('Quote approved');
      }

      case 'review_batch': {
        reviewBatch(db, user, Number(body.batchId), String(body.evidenceRef || ''));
        return respondOk('Batch signed off');
      }

      case 'generate_uat': {
        const n = generateUatCases(db, user);
        return respondOk(`${n} UAT cases generated from playbooks`);
      }

      case 'record_partner_payout': {
        recordPartnerPayout(db, user, { settlementId: Number(body.settlementId), amountFils: Math.round(Number(body.amountAed || 0) * 100), paymentRef: String(body.paymentRef || ''), approvalRef: String(body.approvalRef || ''), approvedByUserId: Number(body.approvedBy) });
        return respondOk('Partner payout recorded with approval evidence');
      }

      case 'reverse_partner_payout': {
        reversePartnerPayout(db, user, Number(body.payoutId), String(body.reversalRef || ''));
        return respondOk('Partner payout reversed');
      }

      case 'mfa_start': { startMfa(db, user); return respondOk('Add the secret to your authenticator app, then enter a code to switch MFA on'); }
      case 'mfa_confirm': { confirmMfa(db, user, String(body.code || '')); return respondOk('MFA is on. You will be asked for a code at every sign-in'); }
      case 'mfa_disable': { disableMfa(db, user, Number(body.userId || user.id), String(body.code || '')); return respondOk('MFA turned off'); }
      case 'open_incident': {
        const r = openIncident(db, user, { kind: String(body.kind) === 'DATA_REQUEST' ? 'DATA_REQUEST' : 'INCIDENT', subtype: String(body.subtype || 'OTHER'), severity: (String(body.severity || 'NORMAL') as 'NORMAL'), subject: String(body.subject || ''), description: String(body.description || '') });
        return respondOk(`${r.ref} opened, due ${r.dueAt}`);
      }
      case 'close_incident': { closeIncident(db, user, Number(body.incidentId), String(body.closureRef || '')); return respondOk('Closed with evidence'); }
      case 'retention_purge': {
        const ids = String(body.ids || '').split(',').map(Number).filter(Boolean);
        const r = purgeRetention(db, user, { recordType: String(body.recordType) === 'LEAD' ? 'LEAD' : 'VAULT_DOCUMENT', ids, approvalRef: String(body.approvalRef || '') });
        return respondOk(`${r.purged} record(s) deleted per retention rules${r.skipped ? `, ${r.skipped} skipped (not due or on hold)` : ''}`);
      }

      case 'notification_sent':
      case 'notification_skip': {
        assertRole(user, STAFF_ROLES);
        db.prepare("UPDATE notifications SET status = ?, sent_at = CASE WHEN ? = 'SENT' THEN datetime('now') ELSE sent_at END, note = ? WHERE id = ? AND status = 'QUEUED'").run(action === 'notification_sent' ? 'SENT' : 'SKIPPED', action === 'notification_sent' ? 'SENT' : '', `by ${user.full_name_en}`, Number(body.notificationId));
        return respondOk(action === 'notification_sent' ? 'Marked as sent' : 'Skipped');
      }

      case 'golive_update': {
        assertRole(user, ['SUPER_ADMIN']);
        if (!String(body.evidence || '').trim()) throw new Error('Evidence is required to close an item');
        db.prepare("UPDATE go_live_items SET status = ?, evidence = ?, updated_at = datetime('now') WHERE id = ?").run(String(body.status) === 'NOT_APPLICABLE' ? 'NOT_APPLICABLE' : 'DONE', String(body.evidence).trim(), Number(body.itemId));
        writeAuditLog(db, user, 'go_live_items', Number(body.itemId), 'GOLIVE_ITEM_CLOSED', null, { evidence: body.evidence });
        return respondOk('Checklist item closed');
      }
      case 'add_holiday': {
        assertRole(user, ['SUPER_ADMIN', 'PROGRESSION_MANAGER', 'CREDIT_UNDERWRITER']);
        const day = String(body.day || '');
        if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) throw new Error('Pick a date');
        db.prepare('INSERT OR REPLACE INTO public_holidays (day, name) VALUES (?, ?)').run(day, String(body.name || 'Holiday'));
        return respondOk('Holiday added');
      }
      case 'remove_holiday': {
        assertRole(user, ['SUPER_ADMIN', 'PROGRESSION_MANAGER', 'CREDIT_UNDERWRITER']);
        db.prepare('DELETE FROM public_holidays WHERE day = ?').run(String(body.day));
        return respondOk('Holiday removed');
      }

      case 'run_dr_test': {
        const r = runBackupAndRestoreTest(db, user);
        if (r.status === 'FAIL') throw new Error(`Backup drill FAILED: ${r.problems.join('; ')}`);
        return respondOk(`Backup and restore drill passed in ${r.seconds}s. Evidence logged (sha256 ${r.sha256.slice(0, 12)}…)`);
      }

      case 'send_owner_briefing': {
        assertRole(user, STAFF_ROLES);
        const kind = String(body.kind) === 'attendance-1030' ? 'attendance-1030' : 'morning';
        const r = generateOwnerBriefing(db, user, kind);
        return respondOk(r.summaryText, r);
      }

      case 'queue_delete_to_bin': {
        assertRole(user, STAFF_ROLES);
        const binId = requestRecordDeletionToBin(db, user, {
          entityType: String(body.entityType || 'deals'),
          entityId: String(body.entityId || '1'),
          recordTitle: String(body.recordTitle || 'Record'),
          deleteReason: String(body.deleteReason || ''),
        });
        return respondOk(`Record queued in Pending Delete Bin (#${binId}) awaiting Owner Shabib Siraj sign-off`);
      }

      case 'decide_recycle_bin': {
        const decision = String(body.decision) === 'APPROVED_DELETED' ? 'APPROVED_DELETED' : 'REJECTED_RESTORED';
        const r = decideRecycleBinRequest(db, user, {
          binId: Number(body.binId),
          decision,
          ownerNotes: String(body.ownerNotes || ''),
        });
        return respondOk(`Pending Delete Bin item #${r.id} marked ${r.status} by Owner Shabib Siraj`);
      }

      case 'submit_manager_decision': {
        assertRole(user, STAFF_ROLES);
        const id = submitManagerAdminDecision(db, user, {
          subject: String(body.subject || ''),
          category: String(body.category || 'Operational Policy / Budget Decision'),
          reason: String(body.reason || ''),
          amountFils: Math.round(Number(body.amountAed || 0) * 100),
        });
        return respondOk(`Administrative decision #${id} submitted to Owner Shabib Siraj for sign-off`);
      }

      case 'decide_manager_decision': {
        const decision = String(body.decision) === 'REJECTED' ? 'REJECTED' : 'APPROVED';
        const r = decideManagerAdminDecision(db, user, {
          decisionId: Number(body.decisionId),
          decision,
          ownerComment: String(body.ownerComment || ''),
        });
        return respondOk(`Decision ${r.decision_ref} ${r.status.toLowerCase()} by Owner Shabib Siraj`);
      }

      case 'owner_admin_control': {
        const act = String(body.controlAction || 'activate') as 'suspend' | 'activate' | 'force_signout' | 'reset_password' | 'unlock';
        const r = executeOwnerAdminControl(db, user, {
          action: act,
          notes: String(body.notes || ''),
        });
        return respondOk(`Owner Action Executed: ${r.action.toUpperCase()} on ${r.adminEmail} (status: ${r.adminStatus})`);
      }

      case 'create_deal_withdrawal': {
        assertRole(user, STAFF_ROLES);
        const wId = createDealWithdrawalRequest(db, user, {
          dealId: Number(body.dealId || 1),
          department: (body.department as 'READY_SECONDARY') || 'READY_SECONDARY',
          withdrawalReason: String(body.withdrawalReason || ''),
          collectedFeeFils: Math.round(Number(body.collectedFeeAed || 0) * 100),
          incurredCostFils: Math.round(Number(body.incurredCostAed || 0) * 100),
          paymentChannel: String(body.paymentChannel || 'Betterway Company Bank Account (AED/FX)'),
        });
        return respondOk(`Deal withdrawal & refund request #${wId} routed to Owner Shabib Siraj for final approval`);
      }

      case 'decide_deal_withdrawal': {
        const decision = String(body.decision) === 'REJECTED' ? 'REJECTED' : 'APPROVED_REFUNDED';
        const r = decideDealWithdrawal(db, user, {
          withdrawalId: Number(body.withdrawalId),
          decision,
          ownerNotes: String(body.ownerNotes || ''),
        });
        return respondOk(`Withdrawal ${r.withdrawal_ref} marked ${r.status} by Owner Shabib Siraj`);
      }

      case 'reception_qr_checkin': {
        assertRole(user, STAFF_ROLES);
        const canOverrideTime = user.role === 'SUPER_ADMIN' || user.role === 'HR_MANAGER';
        const r = recordReceptionQrCheckIn(db, user, {
          checkInDate: canOverrideTime && body.checkInDate ? String(body.checkInDate) : undefined,
          checkInTimeGst: canOverrideTime && body.checkInTimeGst ? String(body.checkInTimeGst) : undefined,
          networkSsid: String(body.networkSsid || 'Betterway-Office-5G'),
          qrStandCode: String(body.qrStandCode || 'BW-RECEPTION-STAND-DXB-1'),
        });
        return respondOk(
          `Attendance Check-In Recorded (${r.checkInTimeGst} GST · ${r.status}${r.isLate ? ` · ${r.lateMinutes}m late` : ''}${r.contemptorAlertTriggered ? ' · CONTEMPTOR ALERT SENT TO OWNER' : ''})`,
        );
      }

      case 'lock_office_wifi': {
        assertRole(user, STAFF_ROLES);
        const strictIpLock = body.strictIpLock === '1' || body.strictIpLock === 'true' || body.strictIpLock === true;
        const detectedIp = extractClientIp(req);
        const cfg = updateOfficeWifiLock(db, user, {
          ssid: body.ssid ? String(body.ssid) : undefined,
          officeIp: body.officeIp ? String(body.officeIp) : detectedIp,
          strictIpLock,
        });
        return respondOk(
          cfg.strictIpLock
            ? `Office Wi-Fi IP Lock ENABLED (${cfg.ssid} · Gateway ${cfg.officeIp})`
            : `Office Wi-Fi IP Lock disabled (${cfg.ssid})`,
        );
      }

      case 'submit_daily_report': {
        assertRole(user, STAFF_ROLES);
        const reportDate = String(body.reportDate || new Date().toISOString().slice(0, 10));
        db.prepare(
          `INSERT INTO daily_work_reports (user_id, employee_name, report_date, calls_count, leads_qualified, site_visits_count, ipas_submitted, summary_notes, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'SUBMITTED')`,
        ).run(
          user.id,
          user.full_name_en,
          reportDate,
          Number(body.callsCount || 0),
          Number(body.leadsQualified || 0),
          Number(body.siteVisitsCount || 0),
          Number(body.ipasSubmitted || 0),
          String(body.summaryNotes || 'Daily mortgage advisory summary submitted'),
        );
        return respondOk('End-of-day staff work report logged to Company Operations Centre');
      }

      case 'sync_dld_feed': {
        assertRole(user, STAFF_ROLES);
        const r = syncDailyDldTransactions(db, user);
        return respondOk(`DLD Open Data Synced for ${r.date} (${r.insertedCount} new daily transfers added)`);
      }

      case 'create_ops_task': {
        assertRole(user, STAFF_ROLES);
        const title = String(body.title || '').trim();
        if (!title) throw new Error('Task title is required');
        const assignedRole = String(body.assignedRole || 'SALES_ADVISOR');
        const priority = ['CRITICAL', 'HIGH', 'NORMAL'].includes(String(body.priority))
          ? String(body.priority)
          : 'HIGH';
        const dueAt = String(body.dueAt || new Date(Date.now() + 86_400_000).toISOString().slice(0, 16));
        const dealId = body.dealId ? Number(body.dealId) : null;
        const r = db
          .prepare(
            `INSERT INTO ops_tasks (deal_id, assigned_role, priority, title, due_at, status)
             VALUES (?, ?, ?, ?, ?, 'OPEN')`,
          )
          .run(dealId, assignedRole, priority, title, dueAt);
        writeAuditLog(db, user, 'ops_tasks', Number(r.lastInsertRowid), 'CREATE_OPS_TASK', null, {
          title,
          assignedRole,
          priority,
        });
        return respondOk(`Internal task "${title}" assigned to ${assignedRole.replace(/_/g, ' ')}`);
      }

      case 'generate_amortization_schedule': {
        assertRole(user, STAFF_ROLES);
        const s = generateFixedToFloatingAmortizationSchedule(db, user, {
          dealId: Number(body.dealId || 1),
          principalFils: Math.round(Number(body.principalAed || 2800000) * 100),
          tenureMonths: Number(body.tenureMonths || 300),
          fixedYears: Number(body.fixedYears || 3),
          introRateBps: Math.round(Number(body.introRatePct || 3.99) * 100),
          revertEiborBps: Math.round(Number(body.revertEiborPct || 3.68) * 100),
          revertMarginBps: Math.round(Number(body.revertMarginPct || 1.65) * 100),
          floorRateBps: Math.round(Number(body.floorRatePct || 2.99) * 100),
        });
        return respondOk(
          `Amortization Schedule ${s.scheduleRef} generated: Intro EMI AED ${(s.introMonthlyEmiFils / 100).toFixed(0)} · Revert EMI AED ${(s.revertMonthlyEmiFils / 100).toFixed(0)}`,
        );
      }

      case 'evaluate_credit_risk': {
        assertRole(user, STAFF_ROLES);
        const r = evaluateCreditRiskAndDunning(db, user, {
          dealId: Number(body.dealId || 1),
          aecbScore: Number(body.aecbScore || 750),
          stressedDbrBps: Math.round(Number(body.stressedDbrPct || 41.5) * 100),
          ltvBps: Math.round(Number(body.ltvPct || 78) * 100),
          employerTier: String(body.employerTier || 'APPROVED_LISTED'),
          bouncedChequesCount: Number(body.bouncedChequesCount || 0),
          overdueDays: Number(body.overdueDays || 0),
          overdueAmountFils: Math.round(Number(body.overdueAmountAed || 0) * 100),
        });
        return respondOk(
          `Credit Risk Evaluated: ${r.compositeScore}/100 (${r.riskGrade}) · Decision: ${r.creditCommitteeDecision} · Dunning: ${r.dunningLevel}`,
        );
      }

      case 'register_real_estate_asset': {
        assertRole(user, STAFF_ROLES);
        const a = registerAndValueRealEstateAsset(db, user, {
          dealId: Number(body.dealId || 1),
          registrationType: String(body.registrationType) === 'OQOOD_PRE_TITLE' ? 'OQOOD_PRE_TITLE' : 'TITLE_DEED',
          titleDeedOrOqoodNo: String(body.titleDeedOrOqoodNo || 'DLD-TD-2026-90122'),
          dldPlotNo: String(body.dldPlotNo || 'PLOT-631-0880'),
          makaniNo: String(body.makaniNo || '29481 94880'),
          communityName: String(body.communityName || 'Dubai Hills Estate'),
          buildingOrProjectName: String(body.buildingOrProjectName || 'Park Gate Villas'),
          unitNo: String(body.unitNo || 'V-208'),
          propertyType: String(body.propertyType || 'VILLA'),
          builtUpAreaSqft: Number(body.builtUpAreaSqft || 3200),
          purchasePriceFils: Math.round(Number(body.purchasePriceAed || 4500000) * 100),
          latestValuationFils: Math.round(Number(body.latestValuationAed || 4600000) * 100),
          annualServiceChargeFils: Math.round(Number(body.annualServiceChargeAed || 22400) * 100),
          ejariAnnualRentFils: Math.round(Number(body.ejariAnnualRentAed || 280000) * 100),
          firstRankMortgageeBank: String(body.firstRankMortgageeBank || 'Emirates NBD'),
        });
        return respondOk(
          `Asset ${a.propertyCode} registered: AED ${a.pricePerSqftAed}/sqft · Gross Yield ${(a.grossYieldBps / 100).toFixed(2)}% · Net Yield ${(a.netYieldBps / 100).toFixed(2)}%`,
        );
      }

      case 'register_pdc_cheque': {
        assertRole(user, STAFF_ROLES);
        const c = registerPdcCheque(db, user, {
          dealId: Number(body.dealId || 1),
          chequeType: (body.chequeType as 'SECURITY_DEPOSIT_10PCT') || 'SECURITY_DEPOSIT_10PCT',
          chequeNumber: String(body.chequeNumber || 'CHQ-900112'),
          drawerName: String(body.drawerName || 'Khalid Al Nuaimi'),
          drawerBank: String(body.drawerBank || 'Emirates NBD'),
          payeeName: String(body.payeeName || 'Betterway Mortgages LLC'),
          amountFils: Math.round(Number(body.amountAed || 25000) * 100),
          maturityDate: String(body.maturityDate || '2026-12-15'),
        });
        return respondOk(`Cheque ${c.chequeRef} logged in Safe Vault (${c.vaultStatus})`);
      }

      case 'transition_pdc_cheque': {
        assertRole(user, STAFF_ROLES);
        const t = transitionPdcChequeStatus(db, user, {
          chequeId: Number(body.chequeId),
          newStatus: (body.newStatus as 'CLEARED') || 'CLEARED',
          bounceReason: String(body.bounceReason || ''),
        });
        return respondOk(`Cheque ${t.chequeRef} transitioned to ${t.newStatus}`);
      }

      default:
        throw new Error(`Unknown OS action: ${action}`);
    }
  } catch (err) {
    return respondErr(err);
  }
}
