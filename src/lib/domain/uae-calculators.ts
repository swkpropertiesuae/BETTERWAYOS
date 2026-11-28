/**
 * Betterway Mortgages LLC — Complete UAE CBUAE Mortgage Calculators & Advisor Math Engine
 * 12 Institutional Calculators:
 * 1. Fixed -> Post-Fixed EMI & Amortization + Insurance
 * 2. CBUAE 50% DBR & Maximum Borrowing Power
 * 3. UAE Upfront Cash-to-Close & Emirate Transfer Fees (Dubai DLD / Abu Dhabi ADM / Sharjah / RAK)
 * 4. Buyout / Refinance & Equity Release Savings + Break-Even
 * 5. Partial Prepayment & Lump-Sum Interest Saver
 * 6. Dubai Rent vs Buy Wealth Break-Even
 * 7. Off-Plan (50% LTV) vs Ready (80% LTV) Comparison
 * 8. Buy-to-Let Rental Yield, Net Cashflow & DSCR
 * 9. Fixed vs Variable (EIBOR Rate Shock) Simulator
 * 10. Golden Visa AED 2M Property Equity & Age-at-Maturity Tenure Checker
 * 11. Bank DSA Commission, 5% UAE VAT & Advisor / 3rd-Party Split Calculator
 * 12. Currency Converter (AED <-> USD / EUR / GBP / INR / SAR)
 */

export function calcMonthlyEmi(principalAed: number, annualRatePct: number, months: number): number {
  if (principalAed <= 0 || months <= 0) return 0;
  const r = annualRatePct / 100 / 12;
  if (r <= 0) return Math.round(principalAed / months);
  return Math.round((principalAed * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1));
}

export function calcAmortizationSummary(input: {
  propertyPriceAed: number;
  ltvPct: number;
  fixedRatePct: number;
  fixedYears: number;
  reversionRatePct: number;
  tenureYears: number;
  lifeInsAnnualPct: number;
  propInsAnnualPct: number;
}) {
  const loanAed = Math.round((input.propertyPriceAed * input.ltvPct) / 100);
  const downPaymentAed = Math.max(0, input.propertyPriceAed - loanAed);
  const totalMonths = Math.max(12, Math.round(input.tenureYears * 12));
  const fixedMonths = Math.min(totalMonths, Math.max(0, Math.round(input.fixedYears * 12)));

  const fixedEmiAed = calcMonthlyEmi(loanAed, input.fixedRatePct, totalMonths);
  const monthlyLifeInsAed = Math.round((loanAed * (input.lifeInsAnnualPct / 100)) / 12);
  const monthlyPropInsAed = Math.round((input.propertyPriceAed * (input.propInsAnnualPct / 100)) / 12);

  let balance = loanAed;
  let totalInterestAed = 0;
  let postFixedEmiAed = fixedEmiAed;
  const yearlySchedule: Array<{
    year: number;
    ratePct: number;
    emiAed: number;
    principalPaidAed: number;
    interestPaidAed: number;
    endingBalanceAed: number;
  }> = [];

  for (let y = 1; y <= input.tenureYears; y++) {
    let yearPrincipal = 0;
    let yearInterest = 0;
    let yearRate = input.fixedRatePct;
    let yearEmi = fixedEmiAed;

    for (let m = 1; m <= 12; m++) {
      const monthIdx = (y - 1) * 12 + m;
      if (monthIdx > totalMonths || balance <= 0) break;
      const isFixed = monthIdx <= fixedMonths;
      const activeRate = isFixed ? input.fixedRatePct : input.reversionRatePct;
      if (!isFixed && monthIdx === fixedMonths + 1) {
        postFixedEmiAed = calcMonthlyEmi(balance, activeRate, totalMonths - fixedMonths);
      }
      const emi = isFixed ? fixedEmiAed : postFixedEmiAed;
      yearRate = activeRate;
      yearEmi = emi;
      const interest = balance * (activeRate / 100 / 12);
      const principal = Math.min(balance, Math.max(0, emi - interest));
      balance = Math.max(0, balance - principal);
      yearPrincipal += principal;
      yearInterest += interest;
      totalInterestAed += interest;
    }

    yearlySchedule.push({
      year: y,
      ratePct: Number(yearRate.toFixed(2)),
      emiAed: Math.round(yearEmi),
      principalPaidAed: Math.round(yearPrincipal),
      interestPaidAed: Math.round(yearInterest),
      endingBalanceAed: Math.round(balance),
    });
  }

  return {
    loanAed,
    downPaymentAed,
    fixedEmiAed,
    postFixedEmiAed: Math.round(postFixedEmiAed),
    monthlyLifeInsAed,
    monthlyPropInsAed,
    totalMonthlyWithInsAed: fixedEmiAed + monthlyLifeInsAed + monthlyPropInsAed,
    totalInterestAed: Math.round(totalInterestAed),
    totalPayableAed: Math.round(loanAed + totalInterestAed),
    yearlySchedule,
  };
}

export type UaeEmirate = 'Dubai (DLD)' | 'Abu Dhabi (ADM)' | 'Sharjah (SRERD)' | 'Ras Al Khaimah';

export function calcUpfrontCashToClose(input: {
  emirate: UaeEmirate;
  propertyPriceAed: number;
  ltvPct: number;
  processingFeePct: number;
  valuationFeeAed: number;
  agencyFeePct: number;
  feeFinancePct: number; // e.g. 0 to 6% rolled into mortgage
}) {
  const baseLoanAed = Math.round((input.propertyPriceAed * input.ltvPct) / 100);
  const feeFinanceAddedAed = Math.round((input.propertyPriceAed * input.feeFinancePct) / 100);
  const totalLoanWithFeesAed = baseLoanAed + feeFinanceAddedAed;
  const downPaymentAed = Math.max(0, input.propertyPriceAed - baseLoanAed);

  const transferFeeRate = input.emirate === 'Abu Dhabi (ADM)' ? 0.02 : 0.04;
  const landDeptTransferFeeAed = Math.round(input.propertyPriceAed * transferFeeRate + (input.emirate === 'Dubai (DLD)' ? 580 : 0));
  const trusteeFeeAed =
    input.emirate === 'Dubai (DLD)' ? (input.propertyPriceAed >= 500_000 ? 4200 : 2100) : 2100;
  const mortgageRegRate = input.emirate === 'Abu Dhabi (ADM)' ? 0.001 : 0.0025;
  const mortgageRegFeeAed = Math.round(totalLoanWithFeesAed * mortgageRegRate + (input.emirate === 'Dubai (DLD)' ? 290 : 0));

  const bankProcessingFeeAed = Math.round(baseLoanAed * (input.processingFeePct / 100) * 1.05); // incl 5% VAT
  const valuationInclVatAed = Math.round(input.valuationFeeAed);
  const agencyFeeInclVatAed = Math.round(input.propertyPriceAed * (input.agencyFeePct / 100) * 1.05);

  const totalFeesAed =
    landDeptTransferFeeAed +
    trusteeFeeAed +
    mortgageRegFeeAed +
    bankProcessingFeeAed +
    valuationInclVatAed +
    agencyFeeInclVatAed;

  const netUpfrontCashAed = Math.max(0, downPaymentAed + totalFeesAed - feeFinanceAddedAed);

  return {
    baseLoanAed,
    feeFinanceAddedAed,
    totalLoanWithFeesAed,
    downPaymentAed,
    landDeptTransferFeeAed,
    trusteeFeeAed,
    mortgageRegFeeAed,
    bankProcessingFeeAed,
    valuationInclVatAed,
    agencyFeeInclVatAed,
    totalFeesAed,
    netUpfrontCashAed,
  };
}

export function calcBuyoutAndEquityRelease(input: {
  currentBalanceAed: number;
  currentRatePct: number;
  remainingYears: number;
  newRatePct: number;
  newTenureYears: number;
  equityReleaseAed: number;
  valuationFeeAed: number;
  newProcessingFeePct: number;
}) {
  const oldEmiAed = calcMonthlyEmi(input.currentBalanceAed, input.currentRatePct, input.remainingYears * 12);
  const newLoanAed = input.currentBalanceAed + Math.max(0, input.equityReleaseAed);
  const newEmiAed = calcMonthlyEmi(newLoanAed, input.newRatePct, input.newTenureYears * 12);
  const pureBuyoutEmiAed = calcMonthlyEmi(input.currentBalanceAed, input.newRatePct, input.remainingYears * 12);

  // CBUAE Early Settlement Cap: 1% of remaining balance OR AED 10,000 whichever is lower (+ 5% VAT)
  const earlySettlementFeeAed = Math.round(Math.min(input.currentBalanceAed * 0.01, 10_000) * 1.05);
  const dldMortgageReRegAed = Math.round(newLoanAed * 0.0025 + 290);
  const newProcessingFeeAed = Math.round(newLoanAed * (input.newProcessingFeePct / 100) * 1.05);
  const totalSwitchingCostAed = earlySettlementFeeAed + dldMortgageReRegAed + input.valuationFeeAed + newProcessingFeeAed + 4200;

  const monthlyPureSavingAed = oldEmiAed - pureBuyoutEmiAed;
  const breakEvenMonths = monthlyPureSavingAed > 0 ? Math.ceil(totalSwitchingCostAed / monthlyPureSavingAed) : 0;
  const fiveYearNetSavingsAed = monthlyPureSavingAed * 60 - totalSwitchingCostAed;

  return {
    oldEmiAed,
    newLoanAed,
    newEmiAed,
    pureBuyoutEmiAed,
    earlySettlementFeeAed,
    dldMortgageReRegAed,
    newProcessingFeeAed,
    totalSwitchingCostAed,
    monthlyPureSavingAed,
    breakEvenMonths,
    fiveYearNetSavingsAed,
  };
}

export function calcPrepaymentSavings(input: {
  loanAed: number;
  annualRatePct: number;
  tenureYears: number;
  annualExtraPaymentAed: number;
  oneTimeLumpSumAed: number;
  lumpSumYear: number;
}) {
  const months = input.tenureYears * 12;
  const r = input.annualRatePct / 100 / 12;
  const baseEmi = calcMonthlyEmi(input.loanAed, input.annualRatePct, months);
  const baseTotalInterest = Math.max(0, baseEmi * months - input.loanAed);

  let bal = input.loanAed;
  let totalInterestWithExtra = 0;
  let actualMonths = 0;

  for (let m = 1; m <= months && bal > 1; m++) {
    actualMonths = m;
    const interest = bal * r;
    const principal = Math.min(bal, Math.max(0, baseEmi - interest));
    bal -= principal;
    totalInterestWithExtra += interest;

    // Annual free partial prepayment at month 12, 24, 36...
    if (m % 12 === 0 && input.annualExtraPaymentAed > 0 && bal > 0) {
      bal = Math.max(0, bal - input.annualExtraPaymentAed);
    }
    if (m === input.lumpSumYear * 12 && input.oneTimeLumpSumAed > 0 && bal > 0) {
      bal = Math.max(0, bal - input.oneTimeLumpSumAed);
    }
  }

  const monthsSaved = Math.max(0, months - actualMonths);
  const interestSavedAed = Math.max(0, Math.round(baseTotalInterest - totalInterestWithExtra));
  return {
    baseEmi,
    baseTotalInterestAed: Math.round(baseTotalInterest),
    newTotalInterestAed: Math.round(totalInterestWithExtra),
    interestSavedAed,
    monthsSaved,
    yearsSaved: Number((monthsSaved / 12).toFixed(1)),
    newPayoffYears: Number((actualMonths / 12).toFixed(1)),
  };
}

export function calcRentVsBuyDubai(input: {
  annualRentAed: number;
  annualRentGrowthPct: number;
  propertyPriceAed: number;
  ltvPct: number;
  interestRatePct: number;
  tenureYears: number;
  annualServiceChargeAed: number;
  annualAppreciationPct: number;
  horizonYears: number;
}) {
  const loanAed = Math.round((input.propertyPriceAed * input.ltvPct) / 100);
  const emiAed = calcMonthlyEmi(loanAed, input.interestRatePct, input.tenureYears * 12);
  const upfrontFeesAed = Math.round(input.propertyPriceAed * 0.065);
  const downPaymentAed = input.propertyPriceAed - loanAed;

  let totalRentPaid = 0;
  let currentRent = input.annualRentAed;
  let bal = loanAed;
  let totalInterestPaid = 0;
  let breakEvenYear = 0;

  for (let y = 1; y <= input.horizonYears; y++) {
    totalRentPaid += currentRent;
    currentRent *= 1 + input.annualRentGrowthPct / 100;

    for (let m = 1; m <= 12; m++) {
      const intr = bal * (input.interestRatePct / 100 / 12);
      const prin = Math.min(bal, Math.max(0, emiAed - intr));
      bal = Math.max(0, bal - prin);
      totalInterestPaid += intr;
    }

    const futureVal = input.propertyPriceAed * Math.pow(1 + input.annualAppreciationPct / 100, y);
    const netBuyCost = upfrontFeesAed + totalInterestPaid + input.annualServiceChargeAed * y - (futureVal - input.propertyPriceAed);
    if (!breakEvenYear && netBuyCost < totalRentPaid) {
      breakEvenYear = y;
    }
  }

  const futurePropertyValAed = Math.round(input.propertyPriceAed * Math.pow(1 + input.annualAppreciationPct / 100, input.horizonYears));
  const netEquityBuiltAed = Math.round(futurePropertyValAed - bal);
  const buyNetAdvantageAed = Math.round(netEquityBuiltAed - downPaymentAed - upfrontFeesAed + totalRentPaid - (emiAed * 12 + input.annualServiceChargeAed) * input.horizonYears);

  return {
    emiAed,
    totalRentPaidAed: Math.round(totalRentPaid),
    futurePropertyValAed,
    remainingLoanAed: Math.round(bal),
    netEquityBuiltAed,
    buyNetAdvantageAed,
    breakEvenYear: breakEvenYear || input.horizonYears,
    verdict: buyNetAdvantageAed >= 0 ? 'Buying Builds More Wealth' : 'Renting Costs Less Short-Term',
  };
}

export function calcBuyToLetYieldAndDscr(input: {
  propertyPriceAed: number;
  annualRentAed: number;
  sizeSqft: number;
  serviceChargePerSqftAed: number;
  vacancyAndMaintPct: number;
  ltvPct: number;
  interestRatePct: number;
  tenureYears: number;
}) {
  const annualServiceChargeAed = Math.round(input.sizeSqft * input.serviceChargePerSqftAed);
  const vacancyMaintAed = Math.round((input.annualRentAed * input.vacancyAndMaintPct) / 100);
  const netOperatingIncomeAed = Math.max(0, input.annualRentAed - annualServiceChargeAed - vacancyMaintAed);
  const grossYieldPct = input.propertyPriceAed > 0 ? Number(((input.annualRentAed / input.propertyPriceAed) * 100).toFixed(2)) : 0;
  const netYieldPct = input.propertyPriceAed > 0 ? Number(((netOperatingIncomeAed / input.propertyPriceAed) * 100).toFixed(2)) : 0;

  const loanAed = Math.round((input.propertyPriceAed * input.ltvPct) / 100);
  const monthlyEmiAed = calcMonthlyEmi(loanAed, input.interestRatePct, input.tenureYears * 12);
  const annualDebtServiceAed = monthlyEmiAed * 12;
  const annualNetCashflowAed = netOperatingIncomeAed - annualDebtServiceAed;
  const monthlyNetCashflowAed = Math.round(annualNetCashflowAed / 12);
  const totalCashInvestedAed = Math.round(input.propertyPriceAed - loanAed + input.propertyPriceAed * 0.065);
  const cashOnCashRoiPct = totalCashInvestedAed > 0 ? Number(((annualNetCashflowAed / totalCashInvestedAed) * 100).toFixed(2)) : 0;
  const dscr = annualDebtServiceAed > 0 ? Number((netOperatingIncomeAed / annualDebtServiceAed).toFixed(2)) : 0;

  return {
    annualServiceChargeAed,
    netOperatingIncomeAed,
    grossYieldPct,
    netYieldPct,
    loanAed,
    monthlyEmiAed,
    annualNetCashflowAed,
    monthlyNetCashflowAed,
    cashOnCashRoiPct,
    dscr,
    dscrVerdict: dscr >= 1.25 ? 'Strong Bank Investor DSCR (>=1.25x)' : dscr >= 1.0 ? 'Self-Covering (1.0x–1.24x)' : 'Negative Cashflow (<1.0x)',
  };
}

export function calcEiborRateShock(input: {
  loanAed: number;
  tenureYears: number;
  fixedRatePct: number;
  eibor3mPct: number;
  bankMarginPct: number;
}) {
  const months = input.tenureYears * 12;
  const fixedEmi = calcMonthlyEmi(input.loanAed, input.fixedRatePct, months);
  const baseVarRate = input.eibor3mPct + input.bankMarginPct;

  const scenarios = [
    { label: 'EIBOR Drops -0.75%', ratePct: Math.max(2.5, baseVarRate - 0.75) },
    { label: 'EIBOR Flat (Current)', ratePct: baseVarRate },
    { label: 'EIBOR Rises +1.00%', ratePct: baseVarRate + 1.0 },
    { label: 'CBUAE Stress (+2.00%)', ratePct: baseVarRate + 2.0 },
  ].map((s) => {
    const emi = calcMonthlyEmi(input.loanAed, s.ratePct, months);
    return {
      label: s.label,
      ratePct: Number(s.ratePct.toFixed(2)),
      emiAed: emi,
      monthlyDiffVsFixedAed: emi - fixedEmi,
      threeYearDiffAed: (emi - fixedEmi) * 36,
    };
  });

  return { fixedEmi, baseVarRate: Number(baseVarRate.toFixed(2)), scenarios };
}

export function calcAdvisorTools(input: {
  propertyPriceAed: number;
  loanAmountAed: number;
  ageYears: number;
  employment: 'Salaried' | 'Self-Employed';
  isUaeNational: boolean;
  bankDsaPct: number;
  advisorSplitPct: number;
  thirdPartySplitPct: number;
}) {
  const maxAge = input.employment === 'Self-Employed' || input.isUaeNational ? 70 : 65;
  const maxTenureByAge = Math.max(0, Math.min(25, maxAge - input.ageYears));
  const goldenVisaEligible = input.propertyPriceAed >= 2_000_000;
  const goldenVisaShortfallAed = Math.max(0, 2_000_000 - input.propertyPriceAed);

  const grossBankDsaAed = Math.round((input.loanAmountAed * input.bankDsaPct) / 100);
  const ftaVat5PctAed = Math.round(grossBankDsaAed * 0.05);
  const totalBankInvoiceAed = grossBankDsaAed + ftaVat5PctAed;
  const advisorPayoutAed = Math.round((grossBankDsaAed * input.advisorSplitPct) / 100);
  const thirdPartyPayoutAed = Math.round((grossBankDsaAed * input.thirdPartySplitPct) / 100);
  const houseNetAed = Math.max(0, grossBankDsaAed - advisorPayoutAed - thirdPartyPayoutAed);

  return {
    maxAge,
    maxTenureByAge,
    goldenVisaEligible,
    goldenVisaShortfallAed,
    grossBankDsaAed,
    ftaVat5PctAed,
    totalBankInvoiceAed,
    advisorPayoutAed,
    thirdPartyPayoutAed,
    houseNetAed,
  };
}

export const AED_FX_RATES = [
  { code: 'USD', name: 'US Dollar', perAed: 1 / 3.6725 },
  { code: 'EUR', name: 'Euro', perAed: 1 / 3.98 },
  { code: 'GBP', name: 'British Pound', perAed: 1 / 4.66 },
  { code: 'SAR', name: 'Saudi Riyal', perAed: 3.75 / 3.6725 },
  { code: 'INR', name: 'Indian Rupee', perAed: 84.5 / 3.6725 },
];
