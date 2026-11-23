import { activeRows } from '@/server/data-hub/import';
import { loadImportedRules, segmentsFor } from './imported-rules';
import type { DatabaseSync } from 'node:sqlite';
import { ForbiddenError, writeAuditLog, type UserRecord } from '@/server/auth';

export function emiFils(principalFils: number, annualRateBps: number, tenureMonths: number): number {
  if (principalFils <= 0 || tenureMonths <= 0) return 0;
  if (annualRateBps <= 0) return Math.round(principalFils / tenureMonths);
  const r = annualRateBps / 10_000 / 12;
  const pow = Math.pow(1 + r, tenureMonths);
  return Math.round((principalFils * r * pow) / (pow - 1));
}

export function fiveYearCumulativeInterestFils(
  principalFils: number,
  tenureMonths: number,
  introRateBps: number,
  fixedYears: number,
  revertRateBps: number,
): number {
  let balance = principalFils;
  let totalInterest = 0;
  const fixedMonths = Math.min(60, fixedYears * 12);
  const horizon = Math.min(60, tenureMonths);

  const introEmi = emiFils(principalFils, introRateBps, tenureMonths);
  for (let m = 1; m <= horizon; m++) {
    const activeRateBps = m <= fixedMonths ? introRateBps : revertRateBps;
    const currentEmi =
      m === fixedMonths + 1 ? emiFils(balance, revertRateBps, Math.max(1, tenureMonths - fixedMonths)) : m <= fixedMonths ? introEmi : emiFils(balance, revertRateBps, Math.max(1, tenureMonths - m + 1));
    const monthlyInterest = Math.round((balance * (activeRateBps / 10_000)) / 12);
    const principalPaid = Math.max(0, currentEmi - monthlyInterest);
    totalInterest += monthlyInterest;
    balance = Math.max(0, balance - principalPaid);
  }
  return totalInterest;
}

export function statutoryMaxLtvBps(params: {
  residencyType: string;
  isFirstHome: boolean;
  propertyStatus: string;
  valuationBaseFils: number;
  nonResidentBankMaxBps: number;
}): number {
  if (params.propertyStatus === 'OFFPLAN_UNDER_CONSTRUCTION') {
    return 5000; // CBUAE 50% statutory cap on under-construction off-plan
  }
  if (params.residencyType === 'NON_RESIDENT') {
    return params.nonResidentBankMaxBps;
  }
  if (!params.isFirstHome) {
    // CBUAE Mortgage Regulations: 2nd / investment property cap is 65% for UAE Nationals and 60% for Expats
    return params.residencyType === 'UAE_NATIONAL' ? 6500 : 6000;
  }
  const over5M = params.valuationBaseFils > 500_000_000; // AED 5,000,000 in fils
  if (params.residencyType === 'UAE_NATIONAL') {
    return over5M ? 7500 : 8500;
  }
  return over5M ? 7000 : 8000;
}

export type EligibleBankOffer = {
  rulesApplied?: string[];
  bankId: number;
  bankKey: string;
  bankName: string;
  bankShort: string;
  logoPath: string;
  structure: string;
  rateCardId: number;
  productCode: string;
  financeMode: string;
  fixedYears: number;
  introRateBps: number;
  revertMarginBps: number;
  floorRateBps: number;
  effectiveRevertRateBps: number;
  introEmiFils: number;
  revertEmiFils: number;
  fiveYearInterestFils: number;
  arrangementFeeFils: number;
  fiveYearTotalCostFils: number;
  calculatedDbrBps: number;
  calculatedLtvBps: number;
  maxAllowedLtvBps: number;
  assessableHouseholdIncomeFils: number;
};

export type BankKnockout = {
  bankId: number;
  bankKey: string;
  bankName: string;
  reason: string;
};

export function evaluateDealAcross24Banks(db: DatabaseSync, dealId: number) {
  const deal = db.prepare('SELECT * FROM deals WHERE id = ?').get(dealId) as Record<string, unknown> | undefined;
  if (!deal) throw new Error(`Deal ${dealId} not found`);

  const applicants = db
    .prepare("SELECT * FROM applicants WHERE household_id = ? AND applicant_role IN ('PRIMARY','CO_BORROWER') ORDER BY id ASC")
    .all(Number(deal.household_id)) as Record<string, unknown>[];
  if (applicants.length === 0) throw new Error('Deal household has no obligated applicants');

  const primary = applicants[0];
  const appIds = applicants.map((a) => Number(a.id));
  const liabilities = db
    .prepare(
      `SELECT * FROM applicant_liabilities
       WHERE applicant_id IN (${appIds.map(() => '?').join(',')}) AND to_be_cleared_before_fol = 0`,
    )
    .all(...appIds) as Record<string, unknown>[];

  const latestEibor = db
    .prepare('SELECT * FROM eibor_fixings ORDER BY fixing_date DESC LIMIT 1')
    .get() as { one_month_micro: number; three_month_micro: number; six_month_micro: number } | undefined;
  const eibor3mBps = latestEibor ? Math.round(latestEibor.three_month_micro / 1000) : 421;
  const eibor1mBps = latestEibor ? Math.round(latestEibor.one_month_micro / 1000) : 414;
  const eibor6mBps = latestEibor ? Math.round(latestEibor.six_month_micro / 1000) : 469;

  const banks = db.prepare('SELECT * FROM banks ORDER BY id ASC').all() as Record<string, unknown>[];
  const activeCards = db
    .prepare("SELECT * FROM bank_rate_cards WHERE status = 'ACTIVE' ORDER BY fixed_years ASC, intro_rate_bps ASC")
    .all() as Record<string, unknown>[];

  const netLoanNeededFils = Math.max(0, Number(deal.target_loan_fils) - Number(deal.housing_grant_fils || 0));
  const tenureMonths = Math.min(300, Math.max(12, Number(deal.tenure_months)));
  const purchasePriceFils = Number(deal.purchase_price_fils);
  const estValFils = Number(deal.estimated_valuation_fils);

  const imported = loadImportedRules(db);
  const segments = segmentsFor(deal, applicants);
  const eligibleOffers: EligibleBankOffer[] = [];
  const knockouts: BankKnockout[] = [];

  for (const bank of banks) {
    const bankId = Number(bank.id);
    const bankKey = String(bank.bank_key);
    const bankName = String(bank.name_en);

    const bankRef = { id: bankId, bank_key: bankKey, short_name: String(bank.short_name), name_en: bankName };
    const rulesApplied: string[] = [];
    const status = imported.bankStatus(bankRef);
    if (status && status !== 'ACTIVE') {
      knockouts.push({ bankId, bankKey, bankName, reason: `${bankName} is ${status} in Bank_Master` });
      continue;
    }
    const bankLimits = imported.eligibility(bankRef, segments);
    rulesApplied.push(...bankLimits.ids);
    if (bankLimits.maxTenorMonths && tenureMonths > bankLimits.maxTenorMonths) {
      knockouts.push({ bankId, bankKey, bankName, reason: `Requested tenor ${tenureMonths}m exceeds ${bankName} rule limit ${bankLimits.maxTenorMonths}m` });
      continue;
    }

    // Preference filter
    if (deal.finance_preference === 'ISLAMIC_ONLY' && bank.structure === 'CONVENTIONAL') {
      knockouts.push({ bankId, bankKey, bankName, reason: 'Client requested Sharia-compliant Islamic finance only' });
      continue;
    }
    if (deal.finance_preference === 'CONVENTIONAL_ONLY' && bank.structure === 'ISLAMIC') {
      knockouts.push({ bankId, bankKey, bankName, reason: 'Client requested conventional structure only' });
      continue;
    }

    // Non-resident check
    const hasNonResident = applicants.some((a) => a.residency_type === 'NON_RESIDENT');
    if (hasNonResident && Number(bank.accepts_non_resident) !== 1) {
      knockouts.push({ bankId, bankKey, bankName, reason: `${bankName} does not underwrite non-resident overseas applicants` });
      continue;
    }

    // Imported non-resident country / income-currency rules (tighten only: a bank with rules accepts only what they list)
    let nrReason: string | null = null;
    for (const app of applicants) {
      if (app.residency_type !== 'NON_RESIDENT') continue;
      const r = imported.nonResident(bankRef, String(app.residence_country), String(app.currency_code || 'AED'));
      if (r && !r.allowed) nrReason = `${bankName} has no verified rule for ${app.residence_country} residents earning in ${app.currency_code || 'AED'}`;
    }
    if (nrReason) { knockouts.push({ bankId, bankKey, bankName, reason: nrReason }); continue; }

    // Age-at-maturity check (CBUAE / bank policy: 65 salaried, 70 self-employed)
    const nowYear = new Date().getUTCFullYear();
    const tenureYears = tenureMonths / 12;
    let ageKnockoutReason: string | null = null;
    for (const app of applicants) {
      const birthYear = Number(String(app.dob || '1988-01-01').slice(0, 4)) || 1988;
      const currentAge = Math.max(21, nowYear - birthYear);
      const maxAge = app.employment_type === 'SELF_EMPLOYED' ? Number(bank.max_age_self_emp || 70) : Number(bank.max_age_salaried || 65);
      if (currentAge + tenureYears > maxAge) {
        ageKnockoutReason = `Applicant age at maturity (${(currentAge + tenureYears).toFixed(1)}y) exceeds ${bankName} limit (${maxAge}y)`;
        break;
      }
    }
    if (ageKnockoutReason) {
      knockouts.push({ bankId, bankKey, bankName, reason: ageKnockoutReason });
      continue;
    }

    // Tower APL check for off-plan / handover projects
    let aplMaxLtvBps: number | null = null;
    let valuationBasis: 'LOWER_OF_SPA_OR_VAL' | 'FRESH_MARKET_VAL' = 'LOWER_OF_SPA_OR_VAL';
    if (deal.project_id) {
      const apl = db
        .prepare('SELECT * FROM bank_project_apl WHERE bank_id = ? AND project_id = ? LIMIT 1')
        .get(bankId, Number(deal.project_id)) as Record<string, unknown> | undefined;
      if (apl) {
        if (apl.apl_status === 'BLOCKED') {
          knockouts.push({ bankId, bankKey, bankName, reason: `Selected tower is BLOCKED on ${bankName}'s Approved Project List (APL)` });
          continue;
        }
        const review = activeRows(db, 11).find((r) => imported.matchesBank(bankRef, r.bank_id) && imported.matchesProject(db, deal.project_id, r.project_id) && r.next_review_at);
        if (review && review.next_review_at < new Date().toISOString().slice(0, 10)) {
          knockouts.push({ bankId, bankKey, bankName, reason: `${bankName} eligibility for this project was due for review on ${review.next_review_at}: manual review required` });
          continue;
        }
        aplMaxLtvBps = Number(apl.max_ltv_bps);
        valuationBasis = apl.valuation_basis as 'LOWER_OF_SPA_OR_VAL' | 'FRESH_MARKET_VAL';
      }
    }

    const baseValFils =
      deal.property_status === 'HANDOVER_COMPLETION' && valuationBasis === 'FRESH_MARKET_VAL'
        ? estValFils
        : Math.min(purchasePriceFils, estValFils);

    const statCapBps = statutoryMaxLtvBps({
      residencyType: String(primary.residency_type),
      isFirstHome: Number(deal.is_first_home) === 1,
      propertyStatus: String(deal.property_status),
      valuationBaseFils: baseValFils,
      nonResidentBankMaxBps: Number(bank.non_resident_max_ltv_bps || 6000),
    });
    const maxAllowedLtvBps = Math.min(aplMaxLtvBps !== null ? Math.min(statCapBps, aplMaxLtvBps) : statCapBps, bankLimits.maxLtvBps ?? 10_000);
    const calculatedLtvBps = baseValFils > 0 ? Math.round((netLoanNeededFils * 10_000) / baseValFils) : 10_000;

    if (calculatedLtvBps > maxAllowedLtvBps) {
      knockouts.push({
        bankId,
        bankKey,
        bankName,
        reason: `Requested LTV (${(calculatedLtvBps / 100).toFixed(1)}%) exceeds CBUAE/APL ceiling (${(maxAllowedLtvBps / 100).toFixed(1)}%)`,
      });
      continue;
    }

    // Assessable household monthly income (applying FX haircuts, bonus haircut, rental haircut, or self-employed audited net profit)
    const bonusKeepRatio = (10_000 - Number(bank.bonus_haircut_bps || 5000)) / 10_000;
    const rentalKeepRatio = (10_000 - Number(bank.rental_haircut_bps || 2500)) / 10_000;
    let totalMonthlyIncomeFils = 0;

    const bankPolicies = imported.policies(bankRef);
    let policyKnockout: string | null = null;
    const policyPct = (app: Record<string, unknown>, incomeType: string, fallback: number) => {
      const p = bankPolicies.find((x) => (!x.employer_category || x.employer_category.toUpperCase() === String(app.employer_tier)) && x.income_type.toUpperCase() === incomeType && x.accepted_income_pct);
      if (p) rulesApplied.push(p.policy_id);
      return p ? Math.min(100, Number(p.accepted_income_pct)) / 100 : fallback;
    };
    for (const app of applicants) {
      for (const p of bankPolicies) {
        if (p.employer_category && p.employer_category.toUpperCase() !== String(app.employer_tier)) continue;
        if (p.employment_tenure_months && Number(app.length_of_service_months) < Number(p.employment_tenure_months)) policyKnockout = `Service ${app.length_of_service_months}m is below ${bankName} policy minimum ${p.employment_tenure_months}m (${p.policy_id})`;
        if (/required|mandatory/i.test(p.salary_transfer_rule) && Number(app.stl_preference) === 0) policyKnockout = `${bankName} requires salary transfer (${p.policy_id})`;
      }
    }
    if (policyKnockout) {
      knockouts.push({ bankId, bankKey, bankName, reason: policyKnockout });
      continue;
    }
    for (const app of applicants) {
      const nr = app.residency_type === 'NON_RESIDENT' ? imported.nonResident(bankRef, String(app.residence_country), String(app.currency_code || 'AED')) : null;
      const haircutBps = Math.max(Number(app.fx_haircut_bps || 0), nr?.haircutBps ?? 0);
      const fxMult = (Number(app.fx_rate_to_aed_bps || 10_000) / 10_000) * ((10_000 - haircutBps) / 10_000);
      if (app.employment_type === 'SELF_EMPLOYED') {
        const avgAnnualProfit = (Number(app.net_profit_yr1_fils) + Number(app.net_profit_yr2_fils)) / 2;
        const ownerMonthly = (avgAnnualProfit / 12) * (Number(app.ownership_bps || 10_000) / 10_000);
        totalMonthlyIncomeFils += Math.round(ownerMonthly * fxMult);
      } else {
        const baseMonthly = Number(app.basic_salary_fils) * policyPct(app, 'SALARY', 1) + Number(app.allowances_fils) * policyPct(app, 'ALLOWANCES', 1) + Number(app.commission_monthly_avg_fils) * policyPct(app, 'COMMISSION', 1);
        const bonusMonthly = (Number(app.bonus_annual_avg_fils) / 12) * policyPct(app, 'BONUS', bonusKeepRatio);
        const rentalMonthly = (Number(app.rental_income_annual_fils) / 12) * policyPct(app, 'RENTAL', rentalKeepRatio);
        totalMonthlyIncomeFils += Math.round((baseMonthly + bonusMonthly + rentalMonthly) * fxMult);
      }
    }

    if (bankLimits.incomeFactor) totalMonthlyIncomeFils = Math.round(totalMonthlyIncomeFils * bankLimits.incomeFactor);
    if (bankLimits.minIncomeFils && totalMonthlyIncomeFils < bankLimits.minIncomeFils) {
      knockouts.push({ bankId, bankKey, bankName, reason: `Household income below ${bankName} rule minimum (AED ${(bankLimits.minIncomeFils / 100).toFixed(0)}/month)` });
      continue;
    }

    // Liabilities & card-limit obligation (3% vs 5%)
    const cardDbrBps = Number(bank.card_limit_dbr_bps);
    let existingMonthlyDebtFils = 0;
    for (const liab of liabilities) {
      if (liab.liability_type === 'CREDIT_CARD' || liab.liability_type === 'OVERDRAFT') {
        existingMonthlyDebtFils += Math.round((Number(liab.credit_limit_fils) * cardDbrBps) / 10_000);
      } else {
        existingMonthlyDebtFils += Number(liab.monthly_emi_fils);
      }
    }

    const stressEmiFils = emiFils(netLoanNeededFils, Number(bank.stress_rate_bps), tenureMonths);
    const totalStressedDebtFils = existingMonthlyDebtFils + stressEmiFils;
    const calculatedDbrBps =
      totalMonthlyIncomeFils > 0 ? Math.round((totalStressedDebtFils * 10_000) / totalMonthlyIncomeFils) : 10_000;

    const dbrCapBps = Math.min(5000, bankLimits.maxDbrBps ?? 5000);
    if (calculatedDbrBps > dbrCapBps) {
      knockouts.push({
        bankId,
        bankKey,
        bankName,
        reason: `Stressed DBR (${(calculatedDbrBps / 100).toFixed(2)}%) exceeds ${dbrCapBps === 5000 ? 'statutory 50.00% CBUAE' : `rule ${(dbrCapBps / 100).toFixed(2)}%`} ceiling`,
      });
      continue;
    }

    const importedProducts = imported.products(bankRef);
    const bankCards = activeCards
      .filter((c) => Number(c.bank_id) === bankId)
      .flatMap((c) => {
        if (!importedProducts) return [c];
        const o = importedProducts.get(String(c.product_code).trim().toLowerCase().replace(/[\s-]+/g, '_'));
        if (!o) return []; // import is the source of truth for this bank
        rulesApplied.push(`PRODUCT:${o.product_id}`);
        return [{ ...c,
          ...(o.fixed_rate_pct ? { intro_rate_bps: Math.round(Number(o.fixed_rate_pct) * 100) } : {}),
          ...(o.revert_margin_pct ? { revert_margin_bps: Math.round(Number(o.revert_margin_pct) * 100) } : {}),
          ...(o.floor_pct ? { floor_rate_bps: Math.round(Number(o.floor_pct) * 100) } : {}),
          ...(o.fixed_months ? { fixed_years: Number(o.fixed_months) / 12 } : {}),
          ...(['1M', '3M', '6M'].includes(o.benchmark_tenor?.toUpperCase()) ? { eibor_tenor: o.benchmark_tenor.toUpperCase() } : {}) }];
      });
    if (bankCards.length === 0) {
      knockouts.push({ bankId, bankKey, bankName, reason: 'No active approved rate card on file' });
      continue;
    }

    // Pick lowest 5-year cost active rate card for this bank
    const todayIso = new Date().toISOString().slice(0, 10);
    const evaluatedCards = bankCards
      .filter((c) => {
        if (totalMonthlyIncomeFils < Number(c.min_salary_fils)) return false;
        const pl = imported.eligibility(bankRef, segments, String(c.product_code));
        if (pl.minIncomeFils && totalMonthlyIncomeFils < pl.minIncomeFils) return false;
        if (pl.maxLtvBps && calculatedLtvBps > pl.maxLtvBps) return false;
        if (pl.maxDbrBps && calculatedDbrBps > pl.maxDbrBps) return false;
        const scope = String(c.residency_scope || 'ALL');
        if (scope === 'UAE_NATIONAL_ONLY' && primary.residency_type !== 'UAE_NATIONAL') return false;
        if (scope === 'RESIDENT_ONLY' && hasNonResident) return false;
        if (scope === 'NON_RESIDENT' && !hasNonResident) return false;
        if (c.effective_from && String(c.effective_from) > todayIso) return false;
        if (c.effective_to && String(c.effective_to) < todayIso) return false;
        return true;
      })
      .map((card) => {
        const tenor = String(card.eibor_tenor);
        const benchBps = tenor === '1M' ? eibor1mBps : tenor === '6M' ? eibor6mBps : eibor3mBps;
        const introRateBps = Number(card.intro_rate_bps);
        const revertMarginBps = Number(card.revert_margin_bps);
        const floorRateBps = Number(card.floor_rate_bps);
        const effectiveRevertRateBps = Math.max(benchBps + revertMarginBps, floorRateBps);
        const fixedYears = Number(card.fixed_years);

        const introEmi = emiFils(netLoanNeededFils, introRateBps, tenureMonths);
        // Compute amortized balance at end of fixed period for realistic revert EMI
        let remBalance = netLoanNeededFils;
        const fixedMonths = Math.min(tenureMonths, fixedYears * 12);
        for (let m = 1; m <= fixedMonths; m++) {
          const interest = Math.round((remBalance * (introRateBps / 10_000)) / 12);
          remBalance = Math.max(0, remBalance - Math.max(0, introEmi - interest));
        }
        const remMonths = Math.max(1, tenureMonths - fixedMonths);
        const revertEmi = fixedMonths >= tenureMonths ? introEmi : emiFils(remBalance, effectiveRevertRateBps, remMonths);
        const fiveYearInterest = fiveYearCumulativeInterestFils(
          netLoanNeededFils,
          tenureMonths,
          introRateBps,
          fixedYears,
          effectiveRevertRateBps,
        );
        const arrangementFeeFils =
          deal.transaction_type === 'BUYOUT'
            ? Math.round((netLoanNeededFils * Number(card.buyout_fee_bps)) / 10_000)
            : Math.round((netLoanNeededFils * Number(card.arrangement_fee_bps)) / 10_000);
        const fiveYearTotalCostFils = fiveYearInterest + arrangementFeeFils + Number(card.valuation_fee_fils);

        return {
          bankId,
          bankKey,
          bankName,
          bankShort: String(bank.short_name),
          logoPath: String(bank.logo_path),
          structure: String(bank.structure),
          rateCardId: Number(card.id),
          productCode: String(card.product_code),
          financeMode: String(card.finance_mode),
          fixedYears,
          introRateBps,
          revertMarginBps,
          floorRateBps,
          effectiveRevertRateBps,
          introEmiFils: introEmi,
          revertEmiFils: revertEmi,
          fiveYearInterestFils: fiveYearInterest,
          arrangementFeeFils,
          fiveYearTotalCostFils,
          calculatedDbrBps,
          calculatedLtvBps,
          maxAllowedLtvBps,
          assessableHouseholdIncomeFils: totalMonthlyIncomeFils,
          rulesApplied: [...new Set(rulesApplied)],
        } satisfies EligibleBankOffer;
      })
      .sort((a, b) => a.fiveYearTotalCostFils - b.fiveYearTotalCostFils);

    if (evaluatedCards.length === 0) {
      knockouts.push({ bankId, bankKey, bankName, reason: 'Household income below bank minimum salary threshold' });
      continue;
    }

    eligibleOffers.push(evaluatedCards[0]);
  }

  eligibleOffers.sort((a, b) => a.fiveYearTotalCostFils - b.fiveYearTotalCostFils);

  return {
    dealId,
    netLoanNeededFils,
    eibor3mBps,
    eligibleOffers,
    knockouts,
  };
}

export function submitRateCardForApproval(
  db: DatabaseSync,
  maker: UserRecord,
  input: {
    bankId: number;
    productCode: string;
    financeMode: 'CONVENTIONAL' | 'IJARA' | 'MURABAHA' | 'MUSHARAKA';
    residencyScope: 'ALL' | 'RESIDENT_ONLY' | 'UAE_NATIONAL_ONLY' | 'NON_RESIDENT';
    stlRequired: 0 | 1;
    fixedYears: 0 | 1 | 2 | 3 | 5;
    introRateBps: number;
    eiborTenor: '1M' | '3M' | '6M';
    revertMarginBps: number;
    floorRateBps: number;
    effectiveFrom: string;
  },
): number {
  if (!['SUPER_ADMIN', 'CREDIT_UNDERWRITER'].includes(maker.role)) {
    throw new ForbiddenError('Only Credit Underwriters or Admins can submit rate cards');
  }
  const res = db
    .prepare(
      `INSERT INTO bank_rate_cards (
        bank_id, product_code, finance_mode, residency_scope, stl_required, fixed_years,
        intro_rate_bps, eibor_tenor, revert_margin_bps, floor_rate_bps, status, created_by, effective_from
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING_APPROVAL', ?, ?)`,
    )
    .run(
      input.bankId,
      input.productCode,
      input.financeMode,
      input.residencyScope,
      input.stlRequired,
      input.fixedYears,
      input.introRateBps,
      input.eiborTenor,
      input.revertMarginBps,
      input.floorRateBps,
      maker.id,
      input.effectiveFrom,
    );
  const id = Number(res.lastInsertRowid);
  writeAuditLog(db, maker, 'bank_rate_cards', id, 'SUBMIT_FOR_APPROVAL', null, input);
  return id;
}

export function approveRateCard(db: DatabaseSync, rateCardId: number, checker: UserRecord) {
  if (checker.can_approve_rates !== 1 || !['SUPER_ADMIN', 'CREDIT_UNDERWRITER'].includes(checker.role)) {
    throw new ForbiddenError('Checker privilege required to approve bank rate cards');
  }
  const existing = db.prepare('SELECT * FROM bank_rate_cards WHERE id = ?').get(rateCardId) as Record<string, unknown> | undefined;
  if (!existing) throw new Error(`Rate card ${rateCardId} not found`);
  if (Number(existing.created_by) === checker.id) {
    throw new ForbiddenError('Maker-Checker violation: creator cannot self-approve their own rate card');
  }

  db.prepare(`UPDATE bank_rate_cards SET status = 'ACTIVE', approved_by = ? WHERE id = ?`).run(checker.id, rateCardId);
  const updated = db.prepare('SELECT * FROM bank_rate_cards WHERE id = ?').get(rateCardId) as {
    id: number;
    status: string;
    approved_by: number;
  };
  writeAuditLog(db, checker, 'bank_rate_cards', rateCardId, 'APPROVE_RATE_CARD', existing, updated);
  return updated;
}

export function computeCommercialDscr(annualNoiFils: number, loanFils: number, annualRateBps: number, tenureMonths: number) {
  const monthlyService = emiFils(loanFils, annualRateBps, tenureMonths);
  const annualDebtService = monthlyService * 12;
  const dscrBps = annualDebtService > 0 ? Math.round((annualNoiFils * 10_000) / annualDebtService) : 0;
  return {
    monthlyDebtServiceFils: monthlyService,
    annualDebtServiceFils: annualDebtService,
    dscrBps, // e.g. 13500 = 1.35x DSCR
    meetsInstitutional125x: dscrBps >= 12500,
  };
}
