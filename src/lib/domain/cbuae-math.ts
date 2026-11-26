export interface CbuaeEligibilityInput {
  propertyPriceAed: number;
  monthlyIncomeAed: number;
  existingEmisAed: number;
  creditCardLimitsAed: number;
  residency: 'uae_national' | 'expat_resident' | 'non_resident';
  borrowerProfile: 'salaried' | 'self_employed_full' | 'self_employed_low_doc' | 'non_resident';
  ageYears: number;
  isFirstHome: boolean;
  isOffPlan?: boolean;
  interestRatePct?: number;
  stressRatePct?: number;
  requestedLoanAed?: number;
}

export interface CbuaeEligibilityResult {
  maxLtvPct: number;
  maxLoanByLtvAed: number;
  maxTenureYears: number;
  cardMonthlyLiabilityAed: number;
  maxAllowedTotalDebtAed: number;
  availableMortgageEmiAed: number;
  maxLoanByDbrAed: number;
  eligibleLoanAed: number;
  requestedLoanAed: number;
  actualLtvPct: number;
  monthlyEmiAtRateAed: number;
  monthlyEmiAtStressAed: number;
  stressedDbrPct: number;
  eligible: boolean;
  reasons: string[];
  dldClosingCostsAed: number;
  downPaymentAed: number;
  totalCashToCloseAed: number;
  goldenVisaEligible: boolean;
}

export function calculateMonthlyEmi(principalAed: number, annualRatePct: number, tenureYears: number): number {
  if (principalAed <= 0 || tenureYears <= 0) return 0;
  const n = Math.round(tenureYears * 12);
  const r = annualRatePct / 100 / 12;
  if (r === 0) return Math.round(principalAed / n);
  const emi = (principalAed * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  return Math.round(emi);
}

export function calculateMaxPrincipalFromEmi(maxEmiAed: number, annualRatePct: number, tenureYears: number): number {
  if (maxEmiAed <= 0 || tenureYears <= 0) return 0;
  const n = Math.round(tenureYears * 12);
  const r = annualRatePct / 100 / 12;
  if (r === 0) return Math.round(maxEmiAed * n);
  const pv = (maxEmiAed * (Math.pow(1 + r, n) - 1)) / (r * Math.pow(1 + r, n));
  return Math.round(pv);
}

export function calculateDldClosingCosts(propertyPriceAed: number, loanAmountAed: number) {
  const dldTransferFee = Math.round(propertyPriceAed * 0.04) + 580;
  const trusteeFee = propertyPriceAed >= 500_000 ? 4_200 : 2_100; // incl. 5% VAT
  const mortgageRegFee = Math.round(loanAmountAed * 0.0025) + 290;
  const bankValuationFee = 3_150; // typical incl. VAT
  const bankArrangementFee = Math.round(loanAmountAed * 0.00525); // 0.5% + 5% VAT
  const total = dldTransferFee + trusteeFee + mortgageRegFee + bankValuationFee + bankArrangementFee;
  return {
    dldTransferFee,
    trusteeFee,
    mortgageRegFee,
    bankValuationFee,
    bankArrangementFee,
    total,
  };
}

export function calculateCbuaeEligibility(input: CbuaeEligibilityInput): CbuaeEligibilityResult {
  const reasons: string[] = [];
  let maxLtvPct = 80;

  if (input.isOffPlan) {
    maxLtvPct = 50;
  } else if (input.residency === 'non_resident' || input.borrowerProfile === 'non_resident') {
    maxLtvPct = 60;
  } else if (input.borrowerProfile === 'self_employed_low_doc') {
    maxLtvPct = input.isFirstHome ? 60 : 50;
  } else if (!input.isFirstHome) {
    maxLtvPct = input.residency === 'uae_national' ? 65 : 60;
  } else if (input.residency === 'uae_national') {
    maxLtvPct = input.propertyPriceAed <= 5_000_000 ? 85 : 75;
  } else {
    maxLtvPct = input.propertyPriceAed <= 5_000_000 ? 80 : 70;
  }

  const maxAge = input.borrowerProfile === 'salaried' ? 65 : 70;
  const maxTenureYears = Math.max(1, Math.min(25, maxAge - input.ageYears));
  const rate = input.interestRatePct ?? 3.99;
  const stressRate = input.stressRatePct ?? 6.5;

  const maxLoanByLtvAed = Math.round((input.propertyPriceAed * maxLtvPct) / 100);
  const cardMonthlyLiabilityAed = Math.round(input.creditCardLimitsAed * 0.05);
  const maxAllowedTotalDebtAed = Math.round(input.monthlyIncomeAed * 0.5);
  const availableMortgageEmiAed = Math.max(0, maxAllowedTotalDebtAed - input.existingEmisAed - cardMonthlyLiabilityAed);
  const maxLoanByDbrAed = calculateMaxPrincipalFromEmi(availableMortgageEmiAed, stressRate, maxTenureYears);

  const eligibleLoanAed = Math.min(maxLoanByLtvAed, maxLoanByDbrAed);
  const requestedLoanAed = input.requestedLoanAed ?? maxLoanByLtvAed;
  const actualLtvPct = input.propertyPriceAed > 0 ? Number(((requestedLoanAed / input.propertyPriceAed) * 100).toFixed(2)) : 0;

  const monthlyEmiAtRateAed = calculateMonthlyEmi(requestedLoanAed, rate, maxTenureYears);
  const monthlyEmiAtStressAed = calculateMonthlyEmi(requestedLoanAed, stressRate, maxTenureYears);
  const stressedDbrPct =
    input.monthlyIncomeAed > 0
      ? Number((((monthlyEmiAtStressAed + input.existingEmisAed + cardMonthlyLiabilityAed) / input.monthlyIncomeAed) * 100).toFixed(2))
      : 100;

  if (stressedDbrPct > 50) reasons.push(`Stressed DBR ${stressedDbrPct}% exceeds CBUAE 50% cap.`);
  if (actualLtvPct > maxLtvPct) reasons.push(`Requested LTV ${actualLtvPct}% exceeds CBUAE ${maxLtvPct}% cap.`);
  if (input.borrowerProfile === 'salaried' && input.monthlyIncomeAed < 10_000) {
    reasons.push('Resident salaried minimum salary threshold is AED 10,000/month.');
  }

  const downPaymentAed = Math.max(0, input.propertyPriceAed - requestedLoanAed);
  const closing = calculateDldClosingCosts(input.propertyPriceAed, requestedLoanAed);

  return {
    maxLtvPct,
    maxLoanByLtvAed,
    maxTenureYears,
    cardMonthlyLiabilityAed,
    maxAllowedTotalDebtAed,
    availableMortgageEmiAed,
    maxLoanByDbrAed,
    eligibleLoanAed,
    requestedLoanAed,
    actualLtvPct,
    monthlyEmiAtRateAed,
    monthlyEmiAtStressAed,
    stressedDbrPct,
    eligible: reasons.length === 0 && eligibleLoanAed > 0,
    reasons,
    dldClosingCostsAed: closing.total,
    downPaymentAed,
    totalCashToCloseAed: downPaymentAed + closing.total,
    goldenVisaEligible: input.propertyPriceAed >= 2_000_000,
  };
}

export function calculateBuyoutSavings(params: {
  outstandingBalanceAed: number;
  currentRatePct: number;
  newRatePct: number;
  remainingYears: number;
}) {
  const currentEmi = calculateMonthlyEmi(params.outstandingBalanceAed, params.currentRatePct, params.remainingYears);
  const newEmi = calculateMonthlyEmi(params.outstandingBalanceAed, params.newRatePct, params.remainingYears);
  const monthlySavingsAed = Math.max(0, currentEmi - newEmi);
  // CBUAE early settlement cap: 1% of remaining balance or AED 10,000, whichever is lower (+ 5% VAT)
  const earlySettlementBase = Math.min(params.outstandingBalanceAed * 0.01, 10_000);
  const earlySettlementInclVat = Math.round(earlySettlementBase * 1.05);
  const switchingCostsAed = earlySettlementInclVat + 3_150 + 4_200 + Math.round(params.outstandingBalanceAed * 0.0025 + 290);
  const breakEvenMonths = monthlySavingsAed > 0 ? Math.ceil(switchingCostsAed / monthlySavingsAed) : 999;
  const fiveYearNetSavingsAed = monthlySavingsAed * Math.min(60, params.remainingYears * 12) - switchingCostsAed;
  return {
    currentEmi,
    newEmi,
    monthlySavingsAed,
    earlySettlementInclVat,
    switchingCostsAed,
    breakEvenMonths,
    fiveYearNetSavingsAed,
  };
}

export interface MonthlyStatementRow {
  month: string;
  creditsAed: number;
  minBalanceAed: number;
  avgBalanceAed: number;
  transactionCount?: number;
}

/** Matches Betterway CTO Calculation_.xlsx & Average Balance_.xlsx rules for Low-Doc & Non-Resident checks. */
export function calculateCtoAndAvgBalance(rows: MonthlyStatementRow[]) {
  if (!rows.length) {
    return {
      monthsCount: 0,
      totalCreditsAed: 0,
      avgMonthlyCreditsAed: 0,
      lowestEndBalanceAed: 0,
      overallAvgBalanceAed: 0,
      qualifiesLowDocSelfEmployed: false,
      qualifiesNonResident: false,
      indicativeMaxLoanAed: 0,
      notes: ['Add 6 months of personal bank statement figures.'],
    };
  }
  const totalCreditsAed = rows.reduce((s, r) => s + Number(r.creditsAed || 0), 0);
  const avgMonthlyCreditsAed = Math.round(totalCreditsAed / rows.length);
  const lowestEndBalanceAed = Math.min(...rows.map((r) => Number(r.minBalanceAed || 0)));
  const overallAvgBalanceAed = Math.round(rows.reduce((s, r) => s + Number(r.avgBalanceAed || 0), 0) / rows.length);

  // Betterway 15-Year Playbook:
  // Self-Employed Low-Doc: >40k/mo credits & >=15k maintained balance -> up to AED 2.0M (50-60% LTV)
  // Non-Resident: >=40k/mo credits, >=15k month-end balance, >=25k avg balance -> up to AED 2.2M
  const qualifiesLowDocSelfEmployed = rows.length >= 6 && avgMonthlyCreditsAed >= 40_000 && lowestEndBalanceAed >= 15_000;
  const qualifiesNonResident = qualifiesLowDocSelfEmployed && overallAvgBalanceAed >= 25_000;

  const notes: string[] = [];
  if (rows.length < 6) notes.push('Banks require minimum 6 continuous months of statements.');
  if (avgMonthlyCreditsAed < 40_000) notes.push(`Average monthly credits AED ${avgMonthlyCreditsAed.toLocaleString()} is below AED 40,000 Low-Doc/Non-Resident threshold.`);
  if (lowestEndBalanceAed < 15_000) notes.push(`Lowest month-end balance AED ${lowestEndBalanceAed.toLocaleString()} fell below AED 15,000 minimum maintenance rule.`);
  if (overallAvgBalanceAed < 25_000) notes.push(`Overall average balance AED ${overallAvgBalanceAed.toLocaleString()} is below AED 25,000 Non-Resident threshold.`);
  if (notes.length === 0) notes.push('Meets Betterway Low-Doc Self-Employed (up to AED 2.0M) and Non-Resident (up to AED 2.2M) bank statement thresholds.');

  return {
    monthsCount: rows.length,
    totalCreditsAed,
    avgMonthlyCreditsAed,
    lowestEndBalanceAed,
    overallAvgBalanceAed,
    qualifiesLowDocSelfEmployed,
    qualifiesNonResident,
    indicativeMaxLoanAed: qualifiesNonResident ? 2_200_000 : qualifiesLowDocSelfEmployed ? 2_000_000 : 0,
    notes,
  };
}
