// Deterministic CBUAE / DLD / Betterway 15-Year Underwriting Math Engine
// Pure TypeScript functions shared across Server, Web OS, and Mobile App.

export const CBUAE_RULE_VERSION = 'CBUAE-2026.11-V3';
export const DEFAULT_STRESS_RATE = 6.5;

export function emi(principal: number, ratePct: number, years: number): number {
  const n = Math.round(years * 12);
  if (principal <= 0 || n <= 0) return 0;
  const r = ratePct / 100 / 12;
  if (r === 0) return principal / n;
  const f = Math.pow(1 + r, n);
  return (principal * r * f) / (f - 1);
}

export function principalFromEmi(payment: number, ratePct: number, years: number): number {
  const n = Math.round(years * 12);
  if (payment <= 0 || n <= 0) return 0;
  const r = ratePct / 100 / 12;
  if (r === 0) return payment * n;
  const f = Math.pow(1 + r, n);
  return (payment * (f - 1)) / (r * f);
}

export function balanceAfter(principal: number, ratePct: number, years: number, k: number): number {
  const r = ratePct / 100 / 12;
  const m = emi(principal, ratePct, years);
  if (r === 0) return Math.max(0, principal - m * k);
  const f = Math.pow(1 + r, k);
  return Math.max(0, principal * f - (m * (f - 1)) / r);
}

/** Betterway Underwriting PDF: Salaried age cap 65, Self-Employed / UAE National age cap 70, max tenure 25 yrs. */
export function maxTenure(age: number, profile: 'salaried' | 'self_employed' | 'national' = 'salaried'): number {
  const capAge = profile === 'salaried' ? 65 : 70;
  return Math.max(0, Math.min(25, capAge - age));
}

export function maxLtvPct(opts: {
  residency: 'uae_national' | 'expat_resident' | 'non_resident' | 'gcc_national';
  propertyPriceAed: number;
  propertyCount: 1 | 2;
  isOffPlan?: boolean;
  isLowDoc?: boolean;
}): number {
  if (opts.isOffPlan) return 50;
  if (opts.isLowDoc) return opts.propertyCount === 1 ? 60 : 50;
  if (opts.residency === 'non_resident') return 60;
  if (opts.propertyCount > 1) return opts.residency === 'uae_national' ? 65 : 60;
  if (opts.residency === 'uae_national') return opts.propertyPriceAed <= 5_000_000 ? 85 : 75;
  return opts.propertyPriceAed <= 5_000_000 ? 80 : 70;
}

export interface CashToCloseInput {
  price: number;
  downPct: number;
  bankFeePct?: number;
  agency?: boolean;
  offPlanHandover?: boolean;
  emirate?: 'dubai' | 'abu-dhabi' | 'northern';
}

export function cashToClose({
  price,
  downPct,
  bankFeePct = 0.5,
  agency = true,
  offPlanHandover = false,
  emirate = 'dubai',
}: CashToCloseInput) {
  const down = price * (downPct / 100);
  const loan = Math.max(0, price - down);
  const dldRate = emirate === 'abu-dhabi' ? 0.02 : 0.04;
  const dld = offPlanHandover ? 580 : price * dldRate + 580;
  const mortgageReg = loan > 0 ? loan * (emirate === 'abu-dhabi' ? 0.001 : 0.0025) + 290 : 0;
  const trustee = price >= 500_000 ? 4200 : 2100;
  const valuation = loan > 0 ? 3150 : 0;
  const agencyFee = agency && !offPlanHandover ? price * 0.02 * 1.05 : 0;
  const bankFee = loan * (bankFeePct / 100) * 1.05;
  const fees = dld + mortgageReg + trustee + valuation + agencyFee + bankFee;
  return { down, loan, dld, mortgageReg, trustee, valuation, agencyFee, bankFee, fees, total: down + fees };
}

export interface DbrInput {
  salary: number;
  existingEmis: number;
  cardLimits: number;
  ccFactor?: 3 | 5;
  years: number;
  stressRate?: number;
  rentalIncomeAnnual?: number;
}

/** CBUAE 50% DBR Borrowing Power with 6.5% Stress Rate & Rental Income Recognition (>= AED 600k/yr per Betterway PDF). */
export function borrowingPower({
  salary,
  existingEmis,
  cardLimits,
  ccFactor = 5,
  years,
  stressRate = DEFAULT_STRESS_RATE,
  rentalIncomeAnnual = 0,
}: DbrInput) {
  const eligibleRentalMonthly = rentalIncomeAnnual >= 600_000 ? (rentalIncomeAnnual * 0.8) / 12 : 0;
  const totalEligibleIncome = salary + eligibleRentalMonthly;
  const capacity = totalEligibleIncome * 0.5;
  const cardHit = cardLimits * (ccFactor / 100);
  const existingTotal = existingEmis + cardHit;
  const available = Math.max(0, capacity - existingTotal);
  const byDbr = principalFromEmi(available, stressRate, years);
  const byMultiple = totalEligibleIncome * 12 * 7;
  const maxLoan = Math.min(byDbr, byMultiple);
  const currentDbrPct = totalEligibleIncome > 0 ? (existingTotal / totalEligibleIncome) * 100 : 0;
  return {
    ruleVersion: CBUAE_RULE_VERSION,
    totalEligibleIncome,
    eligibleRentalMonthly,
    capacity,
    cardHit,
    existingTotal,
    available,
    currentDbrPct,
    maxLoan,
    byDbr,
    byMultiple,
  };
}

/** CBUAE early settlement cap: min(1% of balance, AED 10,000) + 5% VAT. */
export const earlySettlementFee = (balance: number) => Math.min(balance * 0.01, 10_000) * 1.05;

export function buyoutSavings({
  balance,
  currentRate,
  newRate,
  yearsLeft,
  newBankFeePct = 0.5,
  horizonMonths = 36,
}: {
  balance: number;
  currentRate: number;
  newRate: number;
  yearsLeft: number;
  newBankFeePct?: number;
  horizonMonths?: number;
}) {
  const oldEmi = emi(balance, currentRate, yearsLeft);
  const newEmi = emi(balance, newRate, yearsLeft);
  const monthly = oldEmi - newEmi;
  const earlyFee = earlySettlementFee(balance);
  const regFee = balance * 0.0025 + 290;
  const valuationFee = 3150;
  const bankFee = balance * (newBankFeePct / 100) * 1.05;
  const switchCost = earlyFee + regFee + valuationFee + bankFee;
  const oldBal = balanceAfter(balance, currentRate, yearsLeft, horizonMonths);
  const newBal = balanceAfter(balance, newRate, yearsLeft, horizonMonths);
  const gross = monthly * horizonMonths + (oldBal - newBal);
  const net = gross - switchCost;
  const breakEvenMonths = monthly > 0 ? Math.ceil(switchCost / monthly) : Infinity;
  return { oldEmi, newEmi, monthly, earlyFee, regFee, valuationFee, bankFee, switchCost, gross, net, breakEvenMonths };
}

export function fixedThenRevert(
  principal: number,
  years: number,
  fixedRate: number,
  fixedYears: number,
  eibor: number,
  margin: number,
  floor: number,
  horizonYears = 5,
) {
  const revertRate = Math.max(eibor + margin, floor);
  const k1 = fixedYears * 12;
  const e1 = emi(principal, fixedRate, years);
  const bal1 = balanceAfter(principal, fixedRate, years, k1);
  const e2 = emi(bal1, revertRate, Math.max(1, years - fixedYears));
  const k2 = Math.max(0, (horizonYears - fixedYears) * 12);
  const paid = e1 * Math.min(k1, horizonYears * 12) + e2 * k2;
  const endBal =
    k2 > 0
      ? balanceAfter(bal1, revertRate, Math.max(1, years - fixedYears), k2)
      : balanceAfter(principal, fixedRate, years, horizonYears * 12);
  const monthlyShock = e2 - e1;
  return { revertRate, introEmi: e1, revertEmi: e2, monthlyShock, paid, endBal, cost: paid - (principal - endBal) };
}

export function handoverRelease(purchasePrice: number, balanceDuePct: number, currentValuation: number, ltvPct: number) {
  const developerSoaOwed = purchasePrice * (balanceDuePct / 100);
  const loanCap = currentValuation * (ltvPct / 100);
  const cashOutToClient = Math.max(0, loanCap - developerSoaOwed);
  const shortfallFromClient = Math.max(0, developerSoaOwed - loanCap);
  const fees = 0.0025 * loanCap + 290 + 4200 + 580 + 3150;
  return {
    developerSoaOwed,
    loanCap,
    cashOutToClient,
    shortfallFromClient,
    fees,
    valuationUplift: currentValuation - purchasePrice,
  };
}

export function goldenVisaCheck(propertyValue: number, dependants = 0) {
  const eligible = propertyValue >= 2_000_000;
  const mainLow = 9421;
  const mainHigh = 10111;
  const familyLow = 7200 * dependants + (dependants > 0 ? 318.75 : 0);
  const familyHigh = 7680 * dependants + (dependants > 0 ? 318.75 : 0);
  return {
    eligible,
    gapAed: Math.max(0, 2_000_000 - propertyValue),
    estimatedFeeLow: mainLow + familyLow,
    estimatedFeeHigh: mainHigh + familyHigh,
  };
}

export function chequeSplit(price: number, sellerOutstanding: number, downPaid: number, buyerLoan: number) {
  const sellerBank = sellerOutstanding;
  const seller = Math.max(0, price - sellerOutstanding - downPaid);
  const dld = price * 0.04 + 580;
  const mortgageReg = buyerLoan > 0 ? buyerLoan * 0.0025 + 290 : 0;
  const trustee = price >= 500_000 ? 4200 : 2100;
  return { sellerBank, seller, dld, mortgageReg, trustee };
}

export function lifeInsuranceSavings(principal: number, ratePct: number, years: number, bankPct = 0.65, extPct = 0.26) {
  let bankTotal = 0;
  let extTotal = 0;
  for (let y = 0; y < years; y++) {
    const bal = balanceAfter(principal, ratePct, years, y * 12);
    bankTotal += bal * (bankPct / 100);
    extTotal += bal * (extPct / 100);
  }
  return {
    bankTotal,
    extTotal,
    totalSaved: bankTotal - extTotal,
    monthlySaved: (bankTotal - extTotal) / (years * 12),
  };
}

export interface UnderwritingCheckInput {
  profile: 'salaried' | 'self_employed_full' | 'self_employed_low_doc' | 'non_resident';
  monthlyIncomeAed: number;
  existingEmisAed: number;
  cardLimitsAed: number;
  age: number;
  propertyPriceAed: number;
  requestedLoanAed: number;
  businessYears?: number;
  annualTurnoverAed?: number;
  avgMonthlyBalanceAed?: number;
}

/** Betterway 15-Year Underwriting Policy Evaluator (from Mortgage presentation-Landscape.pdf). */
export function evaluateUnderwritingPolicy(input: UnderwritingCheckInput) {
  const reasons: string[] = [];
  const warnings: string[] = [];
  const maxTen = maxTenure(input.age, input.profile === 'salaried' ? 'salaried' : 'self_employed');
  const dbr = borrowingPower({
    salary: input.monthlyIncomeAed,
    existingEmis: input.existingEmisAed,
    cardLimits: input.cardLimitsAed,
    years: Math.max(5, maxTen),
  });
  const proposedStressedEmi = emi(input.requestedLoanAed, DEFAULT_STRESS_RATE, Math.max(5, maxTen));
  const projectedDbrPct =
    input.monthlyIncomeAed > 0
      ? ((input.existingEmisAed + input.cardLimitsAed * 0.05 + proposedStressedEmi) / input.monthlyIncomeAed) * 100
      : 100;
  const requestedLtvPct = input.propertyPriceAed > 0 ? (input.requestedLoanAed / input.propertyPriceAed) * 100 : 0;

  if (maxTen < 5) reasons.push(`Age ${input.age} leaves insufficient tenure (${maxTen} yrs remaining under age cap).`);
  if (projectedDbrPct > 50) reasons.push(`Stressed DBR is ${projectedDbrPct.toFixed(1)}% — exceeds CBUAE 50.0% statutory cap.`);

  if (input.profile === 'salaried') {
    if (input.monthlyIncomeAed < 10_000) reasons.push('Salaried minimum monthly credit is AED 10,000 (6 months continuous).');
    if (requestedLtvPct > (input.propertyPriceAed <= 5_000_000 ? 80 : 70)) {
      reasons.push(`Requested LTV ${requestedLtvPct.toFixed(1)}% exceeds CBUAE expat cap.`);
    }
  } else if (input.profile === 'self_employed_full') {
    if ((input.businessYears ?? 2) < 2) reasons.push('Full-Doc Self-Employed requires minimum 2-year Trade License & 1-year ownership.');
    if ((input.annualTurnoverAed ?? 2_000_000) < 2_000_000) warnings.push('Corporate 12-month turnover below standard AED 2.0M threshold — route to specialist bank.');
  } else if (input.profile === 'self_employed_low_doc') {
    if (input.monthlyIncomeAed < 40_000) reasons.push('Low-Doc Personal Statement tier requires > AED 40,000 monthly credits.');
    if ((input.avgMonthlyBalanceAed ?? 15_000) < 15_000) reasons.push('Low-Doc requires minimum AED 15,000 maintained monthly balance.');
    if (requestedLtvPct > 60) reasons.push('Low-Doc LTV capped at 50%–60% (requires 40%–50% down payment).');
    if (input.requestedLoanAed > 2_000_000) warnings.push('Low-Doc standard ceiling is AED 2,000,000 — exception approval required.');
  } else if (input.profile === 'non_resident') {
    if (input.monthlyIncomeAed < 40_000) reasons.push('Non-Resident desk requires ≥ AED 40,000/mo credited across min 4 transactions.');
    if ((input.avgMonthlyBalanceAed ?? 25_000) < 25_000) warnings.push('Recommended Non-Resident average monthly balance is AED 25,000 (AED 15k month-end floor).');
    if (requestedLtvPct > 60) reasons.push('Non-Resident LTV typically capped at 50%–60% by lender credit policy.');
  }

  const verdict: 'ELIGIBLE' | 'REFER_MANUAL' | 'DECLINE_POLICY' =
    reasons.length > 0 ? 'DECLINE_POLICY' : warnings.length > 0 ? 'REFER_MANUAL' : 'ELIGIBLE';

  return {
    verdict,
    ruleVersion: CBUAE_RULE_VERSION,
    maxTenureYears: maxTen,
    projectedDbrPct: Number(projectedDbrPct.toFixed(2)),
    requestedLtvPct: Number(requestedLtvPct.toFixed(2)),
    maxEligibleLoanAed: Math.round(dbr.maxLoan),
    proposedStressedEmiAed: Math.round(proposedStressedEmi),
    reasons,
    warnings,
  };
}
