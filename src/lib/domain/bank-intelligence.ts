/**
 * Betterway Mortgages LLC — Official 18-Bank UAE Policy Matrix, 2026 Quick Rates,
 * 140+ Direct Bank RM & Escalation Contacts, 5-Profile Document Checklists,
 * 3-Bank Auto-Eco Proposal Engine & Dubai Competitor OS Matching Tools.
 *
 * 100% UAE CBUAE Mortgage-Exclusive — Betterway Mortgages LLC Proprietary Policy Data.
 */

export interface BankPolicyRecord {
  code: string;
  name: string;
  short: string;
  loanType: 'Islamic' | 'Conventional' | 'Islamic & Conventional';
  fastPass14Day: boolean;
  indicativeBestRatePct: number;
  stlFixedSummary: string;
  nstlFixedSummary: string;
  selfEmployedFixedSummary: string;
  nonResidentFixedSummary: string;
  postFixedMargin: string;
  day1Variable: string;
  stressTestRule: string;
  feeFinance: string;
  earlySettlement: string;
  partialSettlement: string;
  lifeInsurancePaPct: number;
  lifeInsuranceNote: string;
  propertyInsurancePaPct: number;
  propertyInsuranceNote: string;
  processingFee: string;
  preApprovalFee: string;
  valuationFee: string;
  valuationFeeAed: number;
  maxLtvLocalPct: number;
  maxLtvExpatPct: number;
  maxLtvNonResPct: number;
  maxTenureYears: number;
  minLoanAed: number;
  maxLoanAed: number;
  minSalaryExpatAed: number;
  minSalaryLocalAed: number;
  minLosRule: string;
  buyoutSupported: boolean;
  equityReleaseSummary: string;
  selfEmployedFriendly: 'Yes' | 'Mixed' | 'Low-Doc 60%' | 'Strict';
  nonResidentSupported: boolean;
  commercialSupported: boolean;
  emirates: string;
  paTatDays: number;
  valuationTatDays: number;
  folTatDays: number;
  totalTatDays: number;
  bonusRule: string;
  rentalIncomeRule: string;
  airlineRule: string;
  keyNotes: string;
}

export interface BankRmContact {
  bank: string;
  desk: string;
  rmName: string;
  phone: string;
  email: string;
  escalationName?: string;
  escalationPhone?: string;
  escalationEmail?: string;
  directSubmissionAllowed: boolean;
}

export const UAE_BANK_POLICIES: BankPolicyRecord[] = [
  {
    code: 'RAK',
    name: 'RAKBANK',
    short: 'RAK',
    loanType: 'Islamic & Conventional',
    fastPass14Day: false,
    indicativeBestRatePct: 3.89,
    stlFixedSummary: 'Elite (50k+ sal): 3.89% 2Y · Non-Elite: 3.99% 2Y (HIO +0.50%)',
    nstlFixedSummary: 'Elite: 3.99% 2Y · Non-Elite: 4.10% 2Y',
    selfEmployedFixedSummary: 'Elite+Biz: 4.10% 2Y · Elite/Biz: 4.24% 2Y · Non-Elite: 4.49% 2Y',
    nonResidentFixedSummary: 'Salaried: 5.24% 2Y · Self-Employed: 5.49% 2Y',
    postFixedMargin: '1.69% + 3M EIBOR (Non-HIO) · 1.94% + 3M EIBOR (Home In One)',
    day1Variable: 'RAKelite 0.99% + 3M EIBOR · Non-Elite 1.49% + 3M EIBOR',
    stressTestRule: 'Rate + 2% (DBR <= 50%)',
    feeFinance: 'Yes — 6% (DLD + Fee Finance)',
    earlySettlement: '1% of outstanding capped at AED 10,500',
    partialSettlement: 'Free up to 20% p.a. post fixed (25% Elite), then 1% capped AED 10,000',
    lifeInsurancePaPct: 0.1908,
    lifeInsuranceNote: '0.1908% p.a. (0.0242% p.m. reducing single / 0.055% joint)',
    propertyInsurancePaPct: 0.0348,
    propertyInsuranceNote: '0.0348% p.a. based on property value',
    processingFee: 'STL: NIL · NSTL/SE: 0.50% + VAT · Buyout: 0%',
    preApprovalFee: 'NIL (Resident Salaried/SE) · AED 1,050 NR',
    valuationFee: 'AED 3,150 incl. VAT (AED 1,942.50 up to AED 8M promo)',
    valuationFeeAed: 3150,
    maxLtvLocalPct: 85,
    maxLtvExpatPct: 80,
    maxLtvNonResPct: 60,
    maxTenureYears: 25,
    minLoanAed: 500_000,
    maxLoanAed: 20_000_000,
    minSalaryExpatAed: 15_000,
    minSalaryLocalAed: 15_000,
    minLosRule: '3m (salary > 25k) · 6m (salary < 25k) · 1y NR',
    buyoutSupported: true,
    equityReleaseSummary: 'Buyout + Equity up to 70% LTV (renovation/construction proof required)',
    selfEmployedFriendly: 'Yes',
    nonResidentSupported: true,
    commercialSupported: false,
    emirates: 'Dubai, Abu Dhabi & RAK',
    paTatDays: 3,
    valuationTatDays: 3,
    folTatDays: 3,
    totalTatDays: 18,
    bonusRule: '50% of 2-year average bonus',
    rentalIncomeRule: '82% of rental income (capped at primary income for expats)',
    airlineRule: '50% of 6m average variable + 50% accommodation allowance',
    keyNotes: 'RAKelite: Loan > 2.5M or Salary >= 50k or 250k 3m avg balance. Home-in-One offset available.',
  },
  {
    code: 'ENBD',
    name: 'Emirates NBD',
    short: 'ENBD',
    loanType: 'Conventional',
    fastPass14Day: true,
    indicativeBestRatePct: 3.89,
    stlFixedSummary: '3.89% 2Y · 3.99% 3Y · 4.69% 5Y',
    nstlFixedSummary: '4.39% 2Y & 3Y · 4.79% 5Y',
    selfEmployedFixedSummary: 'Full & Low Doc: 4.99% 3Y · 5.09% 5Y',
    nonResidentFixedSummary: 'Salaried: 4.99% 3Y · Self-Employed: 5.29% 3Y',
    postFixedMargin: '1.99% + 1M EIBOR (1.79% + 1M EIBOR standard post-intro)',
    day1Variable: '1.10% + 1M EIBOR (STL mandatory, NIL PF)',
    stressTestRule: 'Post-intro rate 1.79% + 1M EIBOR',
    feeFinance: 'Yes — 6% Secondary / 4% Primary Sale',
    earlySettlement: '1% of outstanding capped at AED 10,500',
    partialSettlement: 'Free up to 20% p.a. (25% if requested at pre-approval)',
    lifeInsurancePaPct: 0.2052,
    lifeInsuranceNote: '0.2052% p.a. (0.0180% p.m. primary; assignment optional)',
    propertyInsurancePaPct: 0.06,
    propertyInsuranceNote: '0.06% p.a. (promo 0.001% p.m.)',
    processingFee: 'STL: 0.25% + VAT · NSTL/SE/NR: 0.50% + VAT · NIL Variable',
    preApprovalFee: 'NIL',
    valuationFee: 'AED 3,150 incl. VAT (refundable on variable disbursal)',
    valuationFeeAed: 3150,
    maxLtvLocalPct: 85,
    maxLtvExpatPct: 80,
    maxLtvNonResPct: 60,
    maxTenureYears: 25,
    minLoanAed: 250_000,
    maxLoanAed: 15_000_000,
    minSalaryExpatAed: 15_000,
    minSalaryLocalAed: 15_000,
    minLosRule: '6m listed company / 1y non-listed (3y total career history)',
    buyoutSupported: true,
    equityReleaseSummary: 'Up to 80% controlled purchase / 20% or AED 300k cashout',
    selfEmployedFriendly: 'Yes',
    nonResidentSupported: true,
    commercialSupported: true,
    emirates: 'Dubai & Abu Dhabi (All UAE for Nationals)',
    paTatDays: 2,
    valuationTatDays: 3,
    folTatDays: 2,
    totalTatDays: 11,
    bonusRule: '50% of lowest bonus in last 3 years (min 20k salary)',
    rentalIncomeRule: '75% secondary rental (capped 75% salary); 60% pure rental (min 1M)',
    airlineRule: 'Doctors & Airline: 100% 6m variable + 100% accommodation allowance',
    keyNotes: 'Fastest total TAT (~11 working days). 15M max (30M by exception). ENBD VAT & Avg Balance SE programs up to 3M.',
  },
  {
    code: 'CBD',
    name: 'Commercial Bank of Dubai',
    short: 'CBD',
    loanType: 'Islamic & Conventional',
    fastPass14Day: false,
    indicativeBestRatePct: 3.99,
    stlFixedSummary: '3.99% 3Y · 4.19% 5Y (Green Home discount available)',
    nstlFixedSummary: '4.49% 3Y · 4.59% 5Y',
    selfEmployedFixedSummary: '4.49% 3Y · 4.59% 5Y',
    nonResidentFixedSummary: '5.49% 3Y & 5Y',
    postFixedMargin: 'STL/NSTL: 1.79% + 3M EIBOR · SE: 1.99% + 3M · NR: 2.79% + 3M',
    day1Variable: '1.39% + 3M EIBOR (Floor 1.39%) · SE 1.59% + 3M',
    stressTestRule: '1.79% + 3M EIBOR + 2% (DBR <= 50%)',
    feeFinance: 'Yes — up to 7% of property cost (Secondary)',
    earlySettlement: '1% of outstanding capped at AED 10,500',
    partialSettlement: 'Free up to 15% p.a., then 1% capped AED 10,500',
    lifeInsurancePaPct: 0.14004,
    lifeInsuranceNote: '0.14004% p.a. (0.01167% p.m. reducing; external assignment not allowed)',
    propertyInsurancePaPct: 0.06,
    propertyInsuranceNote: '0.06% p.a. (0.04% standard)',
    processingFee: 'STL: 0.25% + VAT (min 3k) · NSTL/LowDoc: 0.50% · SE/NR: 1% · Buyout 0%',
    preApprovalFee: 'NIL (Revalidation AED 525)',
    valuationFee: 'AED 3,150 incl. VAT (50% refunded post disbursal)',
    valuationFeeAed: 3150,
    maxLtvLocalPct: 85,
    maxLtvExpatPct: 80,
    maxLtvNonResPct: 60,
    maxTenureYears: 25,
    minLoanAed: 250_000,
    maxLoanAed: 20_000_000,
    minSalaryExpatAed: 12_000,
    minSalaryLocalAed: 40_000,
    minLosRule: '3m confirmed + exp letter (New to UAE 35k+ with 1 salary credit)',
    buyoutSupported: true,
    equityReleaseSummary: '60% LTV new purchase / 20% renovation (75% Buyout + Equity)',
    selfEmployedFriendly: 'Yes',
    nonResidentSupported: true,
    commercialSupported: false,
    emirates: 'Dubai & Abu Dhabi',
    paTatDays: 5,
    valuationTatDays: 4,
    folTatDays: 10,
    totalTatDays: 27,
    bonusRule: '50% of 2-year average fixed bonus',
    rentalIncomeRule: '83% of rental income with NO cap vs salary',
    airlineRule: 'Emirates Airline flying allowance 80% of 6m avg + 25–100% housing',
    keyNotes: 'Min AED 12k salary for Expats! Best for uncapped rental income (83%), Green LEED loans, and No-Audit SE up to 6M.',
  },
  {
    code: 'ADIB',
    name: 'Abu Dhabi Islamic Bank',
    short: 'ADIB',
    loanType: 'Islamic',
    fastPass14Day: false,
    indicativeBestRatePct: 3.99,
    stlFixedSummary: '3.99% 3Y · 4.34% 5Y (2Y promo 3.99%)',
    nstlFixedSummary: '4.14% 3Y · 4.59% 5Y',
    selfEmployedFixedSummary: '4.69%–4.99% 3Y · 5.19% 5Y',
    nonResidentFixedSummary: '4.69%–4.99% 3Y · 5.19% 5Y (GCC residents)',
    postFixedMargin: '1.60% + 1M EIBOR (3Y) · 1.75% + 1M EIBOR (5Y) · SE/NR 2.25% + 1M',
    day1Variable: '1.49% + 1M EIBOR (Min 4.44% STL / 4.69% NSTL)',
    stressTestRule: 'Rate + Life Takaful (1M EIBOR + 1.49% + Takaful)',
    feeFinance: 'Personal finance 10% over 4y (STL only)',
    earlySettlement: '1% + VAT capped at AED 10,500',
    partialSettlement: 'Free up to 30% p.a.!',
    lifeInsurancePaPct: 0.3,
    lifeInsuranceNote: '0.30% p.a. (0.025% monthly reducing balance)',
    propertyInsurancePaPct: 0,
    propertyInsuranceNote: 'FREE FOR LIFE (Complimentary Islamic Property Takaful)',
    processingFee: 'STL: NIL · NSTL/SE/NR: 0.50% + VAT (min 5k) · Handover/Buyout 0%',
    preApprovalFee: 'NIL',
    valuationFee: 'AED 2,625 incl. VAT',
    valuationFeeAed: 2625,
    maxLtvLocalPct: 85,
    maxLtvExpatPct: 80,
    maxLtvNonResPct: 50,
    maxTenureYears: 25,
    minLoanAed: 250_000,
    maxLoanAed: 35_000_000,
    minSalaryExpatAed: 10_000,
    minSalaryLocalAed: 10_000,
    minLosRule: '6m current OR 1 salary credit with 1y UAE continuity',
    buyoutSupported: true,
    equityReleaseSummary: '1st degree up to 80% Local / 75% Expat; Land & Construction finance',
    selfEmployedFriendly: 'Mixed',
    nonResidentSupported: true,
    commercialSupported: false,
    emirates: 'All Emirates (UAE-wide)',
    paTatDays: 3,
    valuationTatDays: 4,
    folTatDays: 6,
    totalTatDays: 22,
    bonusRule: '50% of lower of last 2 years guaranteed bonus',
    rentalIncomeRule: '83% (2+ properties) or 70% (1 property)',
    airlineRule: '50% variable + 100% company accommodation for Emirates Airline',
    keyNotes: 'Free Property Insurance for life, 30% free yearly partial settlement, up to 6m payment holiday (STL), max AED 35M.',
  },
  {
    code: 'FAB',
    name: 'First Abu Dhabi Bank',
    short: 'FAB',
    loanType: 'Islamic & Conventional',
    fastPass14Day: false,
    indicativeBestRatePct: 3.99,
    stlFixedSummary: '3.99% 3Y · 4.19% 5Y (with Salary + Card + iSave)',
    nstlFixedSummary: '4.24% 3Y · 4.44% 5Y',
    selfEmployedFixedSummary: 'Full Doc: 4.24% 3Y / 4.44% 5Y · Low Doc: 4.59% 3Y / 4.74% 5Y',
    nonResidentFixedSummary: '5.24% Fixed 1/3/5Y (50% Max LTV)',
    postFixedMargin: 'STL: 1.50% + 3M EIBOR · NSTL/SE Full: 1.89% + 3M · SE Low: 2.25% + 3M',
    day1Variable: 'Intro 1Y: 3M EIBOR + 0.55% (STL) / 0.74% (NSTL) · Floor 1.99%',
    stressTestRule: 'Follow-on rate (3M EIBOR + Margin) + 2%',
    feeFinance: 'Yes — 6% Secondary',
    earlySettlement: '1.05% capped at AED 10,500',
    partialSettlement: 'Post fixed: Free up to 25% STL / 15% NSTL-SE',
    lifeInsurancePaPct: 0.1344,
    lifeInsuranceNote: '0.1344% p.a. (0.0112% p.m. — lowest bank life insurance)',
    propertyInsurancePaPct: 0.0528,
    propertyInsuranceNote: '0.0528% p.a. recovered yearly',
    processingFee: 'STL: NIL · NSTL: 0.50% + VAT · SE: 1% + VAT · Buyout: 0%',
    preApprovalFee: 'NIL',
    valuationFee: 'AED 3,150 incl. VAT (refunded on buyout)',
    valuationFeeAed: 3150,
    maxLtvLocalPct: 85,
    maxLtvExpatPct: 80,
    maxLtvNonResPct: 50,
    maxTenureYears: 25,
    minLoanAed: 1_000_000,
    maxLoanAed: 20_000_000,
    minSalaryExpatAed: 15_000,
    minSalaryLocalAed: 15_000,
    minLosRule: '3m confirmed (deviation available for elite clients)',
    buyoutSupported: true,
    equityReleaseSummary: 'Buyout + Equity allowed (<=25% renovation / >25% new purchase)',
    selfEmployedFriendly: 'Strict',
    nonResidentSupported: true,
    commercialSupported: true,
    emirates: 'All Emirates (Dubai, Abu Dhabi, Listed Sharjah)',
    paTatDays: 3,
    valuationTatDays: 3,
    folTatDays: 3,
    totalTatDays: 17,
    bonusRule: 'Not considered',
    rentalIncomeRule: '83% of rental (10 months) · Pure rental DSCR min 160k w/ 2-3 free properties',
    airlineRule: 'Emirates & Etihad: 100% of 3m variable + 100% accommodation',
    keyNotes: 'Lowest bank life insurance (0.1344% p.a.) and strong AED 1.5M+ HNW/UAE National desk.',
  },
  {
    code: 'MASHREQ',
    name: 'Mashreq Bank',
    short: 'Mashreq',
    loanType: 'Islamic & Conventional',
    fastPass14Day: true,
    indicativeBestRatePct: 3.99,
    stlFixedSummary: 'Premium (40k sal or 3M+ loan): 3.99% 2Y · General: 4.25% 2Y',
    nstlFixedSummary: 'Premium: 3.99% 2Y · General: 4.25% 2Y',
    selfEmployedFixedSummary: 'SE Premium: 4.99% 2Y · SE General: 5.25% 2Y',
    nonResidentFixedSummary: 'NR Premium: 5.75% 2Y · NR General: 5.99% 2Y',
    postFixedMargin: 'Salaried: 1.75% + 3M EIBOR · SE: 2.25% + 3M · NR: 2.99% + 3M',
    day1Variable: 'Preferential: 1.49% + 3M EIBOR · Others: 1.65% + 3M · Low Doc: 2.25% + 3M',
    stressTestRule: 'Follow-on rate (Fixed) / Rate + 2% (Variable)',
    feeFinance: 'Yes — 6% DLD + Broker + 0.25% Mortgage Reg (Secondary)',
    earlySettlement: '1% of outstanding capped at AED 10,500',
    partialSettlement: 'Free up to 25% p.a.!',
    lifeInsurancePaPct: 0.1656,
    lifeInsuranceNote: '0.1656% p.a. recovered yearly',
    propertyInsurancePaPct: 0.06,
    propertyInsuranceNote: '0.06% p.a. recovered yearly',
    processingFee: 'STL: NIL · NSTL: 0.50% + VAT · SE: 1% · Buyout: NIL',
    preApprovalFee: 'NIL Salaried · AED 1,050 Self-Employed / Low-Doc',
    valuationFee: 'AED 2,625 incl. VAT',
    valuationFeeAed: 2625,
    maxLtvLocalPct: 85,
    maxLtvExpatPct: 80,
    maxLtvNonResPct: 60,
    maxTenureYears: 25,
    minLoanAed: 350_000,
    maxLoanAed: 10_000_000,
    minSalaryExpatAed: 15_000,
    minSalaryLocalAed: 15_000,
    minLosRule: '6m (or 1 salary credit with 6m continuity even from home country)',
    buyoutSupported: true,
    equityReleaseSummary: 'Yes — up to 60% Low-Doc (6m bank statements + ID only, 25k avg bal)',
    selfEmployedFriendly: 'Low-Doc 60%',
    nonResidentSupported: true,
    commercialSupported: true,
    emirates: 'Dubai & Abu Dhabi (Title Deed)',
    paTatDays: 3,
    valuationTatDays: 3,
    folTatDays: 3,
    totalTatDays: 14,
    bonusRule: '100% of guaranteed 2y bonus · 50% of 6m commission',
    rentalIncomeRule: '83% capped up to salary income',
    airlineRule: '50% of 6m variable + 100% accommodation for Emirates Airline',
    keyNotes: 'Fast-Pass 14 working days! Instant digital account link (0 days). Industry-best 60% LTV Low-Doc & Non-Resident speed.',
  },
  {
    code: 'DIB',
    name: 'Dubai Islamic Bank',
    short: 'DIB',
    loanType: 'Islamic',
    fastPass14Day: false,
    indicativeBestRatePct: 3.95,
    stlFixedSummary: '3.95% 3Y · 4.50% 5Y',
    nstlFixedSummary: '4.10% 3Y · 4.70% 5Y',
    selfEmployedFixedSummary: '4.10% 3Y · 4.70% 5Y',
    nonResidentFixedSummary: 'Variable only: Salaried 7.11% / SE 8.86% (50% Max LTV)',
    postFixedMargin: 'STL: 1.00% + 3M EIBOR · NSTL/SE Full: 1.50% + 3M · Low Doc: 1.75% + 3M',
    day1Variable: 'FTV<=60%: 1.25% + 3M EIBOR (STL) · 1.50% + 3M (NSTL)',
    stressTestRule: '1.75% + 3M EIBOR + Life Takaful (~0.36%)',
    feeFinance: 'Yes — 6% DLD + Broker + Trustee VAT (Secondary)',
    earlySettlement: '1% of outstanding capped at AED 10,500',
    partialSettlement: '1% or AED 10,000 whichever lower',
    lifeInsurancePaPct: 0.22188,
    lifeInsuranceNote: '0.22188% p.a. + 1 Year Property Insurance FREE',
    propertyInsurancePaPct: 0.03325,
    propertyInsuranceNote: '0.03325% p.a. (Year 1 Free)',
    processingFee: 'STL / 1st-Time Buyer: NIL · NSTL: 0.50% + VAT · SE/NR: 1% · Buyout: 0%',
    preApprovalFee: 'NIL',
    valuationFee: 'AED 2,500 incl. VAT (DXB/AUH) · AED 3,000 Other Emirates',
    valuationFeeAed: 2500,
    maxLtvLocalPct: 85,
    maxLtvExpatPct: 80,
    maxLtvNonResPct: 50,
    maxTenureYears: 25,
    minLoanAed: 250_000,
    maxLoanAed: 6_000_000,
    minSalaryExpatAed: 10_000,
    minSalaryLocalAed: 10_000,
    minLosRule: '6m current (prev employment history if <1y)',
    buyoutSupported: true,
    equityReleaseSummary: 'Yes — max 70% LTV capped AED 3M',
    selfEmployedFriendly: 'Mixed',
    nonResidentSupported: true,
    commercialSupported: true,
    emirates: 'All Emirates (UAE-wide)',
    paTatDays: 3,
    valuationTatDays: 3,
    folTatDays: 3,
    totalTatDays: 17,
    bonusRule: '50% of 2y fixed bonus (or 50% of lowest 3y variable bonus)',
    rentalIncomeRule: '83% of rent (capped 50% fixed salary) · 65% SE',
    airlineRule: 'Emirates Airline: 100% 6m variable + 100% company accommodation!',
    keyNotes: 'Ultra-low AED 10k min salary, 2% CC limit in DBR (other banks) vs 5% standard, lowest post-fixed margin (1.00%+3M EIBOR STL)!',
  },
  {
    code: 'SCB',
    name: 'Standard Chartered UAE',
    short: 'SCB',
    loanType: 'Islamic & Conventional',
    fastPass14Day: false,
    indicativeBestRatePct: 3.90,
    stlFixedSummary: '3.90% 2Y · 4.10% 3Y · 4.29% 5Y (MortgageOne Offset +0.25%)',
    nstlFixedSummary: '3.90% 2Y · 4.10% 3Y · 4.29% 5Y (STL not required!)',
    selfEmployedFixedSummary: '3.90% 2Y · 4.10% 3Y · 4.29% 5Y',
    nonResidentFixedSummary: 'Resident/Global Priority — 50%–60% LTV',
    postFixedMargin: '1.10% + 3M EIBOR (or 1.75% + SCBLR)',
    day1Variable: 'Standard: 0.99% + 3M EIBOR · MortgageOne Offset: 1.25% + 3M',
    stressTestRule: 'Variable: Rate + 2% · Fixed: 1.75% + SCBLR + 2%',
    feeFinance: 'No',
    earlySettlement: '0.525% capped AED 10,500 · NIL after 5 years!',
    partialSettlement: 'Free up to 30% every year & NIL after 5 years!',
    lifeInsurancePaPct: 0,
    lifeInsuranceNote: 'OPTIONAL (Huge monthly savings vs mandatory banks)',
    propertyInsurancePaPct: 0.0483,
    propertyInsuranceNote: '0.0483% p.a. Conv · FREE for entire tenure on Islamic Saadiq!',
    processingFee: 'NIL (Promo / Buyout NIL · Equity 0.2625%)',
    preApprovalFee: 'NIL',
    valuationFee: 'AED 2,625–3,000 + VAT (Refunded upon successful disbursal!)',
    valuationFeeAed: 2625,
    maxLtvLocalPct: 80,
    maxLtvExpatPct: 75,
    maxLtvNonResPct: 60,
    maxTenureYears: 25,
    minLoanAed: 300_000,
    maxLoanAed: 18_000_000,
    minSalaryExpatAed: 15_000,
    minSalaryLocalAed: 15_000,
    minLosRule: '6m current OR <6m confirmed + 1y UAE continuity',
    buyoutSupported: true,
    equityReleaseSummary: 'Yes — 1 additional property purchase (cashier order to seller) or renovation',
    selfEmployedFriendly: 'Mixed',
    nonResidentSupported: false,
    commercialSupported: false,
    emirates: 'Dubai & Abu Dhabi',
    paTatDays: 3,
    valuationTatDays: 3,
    folTatDays: 3,
    totalTatDays: 17,
    bonusRule: '70% of last credited bonus',
    rentalIncomeRule: '83% up to primary income',
    airlineRule: '30% basic as accommodation + 70% of 3m variable pay',
    keyNotes: 'Optional Life Insurance, MortgageOne/SaadiqOne interest-offset current account, 30% free annual prepayment & 0% exit fee after 5 years!',
  },
  {
    code: 'HSBC',
    name: 'HSBC UAE',
    short: 'HSBC',
    loanType: 'Conventional',
    fastPass14Day: true,
    indicativeBestRatePct: 3.90,
    stlFixedSummary: '3.90% 2Y · 4.10% 3Y · 4.29% 5Y (Premier/Advance)',
    nstlFixedSummary: '3.90% 2Y · 4.10% 3Y · 4.29% 5Y',
    selfEmployedFixedSummary: '3.90% 2Y · 4.10% 3Y · 4.29% 5Y (2y Audited)',
    nonResidentFixedSummary: 'Premier/Jade Global: 5.49%–6.49% Fixed (60% Max LTV)',
    postFixedMargin: '1.59% + 3M EIBOR (1–2Y) · 1.79% + 3M EIBOR (3–5Y)',
    day1Variable: 'Premier: 1.19% + 3M EIBOR · Advance: 1.37% + 3M',
    stressTestRule: 'Follow-on rate + 2%',
    feeFinance: 'No',
    earlySettlement: '1% capped AED 10,000 · NIL after 3y (variable)',
    partialSettlement: 'Free up to 25% every year',
    lifeInsurancePaPct: 0.18,
    lifeInsuranceNote: 'External Zurich / Sukoon / MetLife accepted!',
    propertyInsurancePaPct: 0.05,
    propertyInsuranceNote: 'External RSA / AXA / Sukoon accepted',
    processingFee: 'Premier: 0.50% (50% promo discount) · Buyout: AED 2,500 waived · Green: 0%',
    preApprovalFee: 'NIL',
    valuationFee: 'AED 2,500 + VAT (waived on buyout promos)',
    valuationFeeAed: 2625,
    maxLtvLocalPct: 85,
    maxLtvExpatPct: 80,
    maxLtvNonResPct: 60,
    maxTenureYears: 25,
    minLoanAed: 350_000,
    maxLoanAed: 35_000_000,
    minSalaryExpatAed: 15_000,
    minSalaryLocalAed: 15_000,
    minLosRule: '3m (AIP on 1st salary credit! Internal transfer 1 salary credit)',
    buyoutSupported: true,
    equityReleaseSummary: 'Up to AED 500k renovation / >500k direct to contractor',
    selfEmployedFriendly: 'Mixed',
    nonResidentSupported: true,
    commercialSupported: false,
    emirates: 'Dubai & Abu Dhabi',
    paTatDays: 1,
    valuationTatDays: 3,
    folTatDays: 3,
    totalTatDays: 15,
    bonusRule: '50% of 2-year average bonus',
    rentalIncomeRule: '82% of rental income',
    airlineRule: '100% accommodation allowance (variable flying excluded)',
    keyNotes: 'Fast-Pass 1-day AIP & 15d TAT! Up to AED 35M loan, 25bps Green discount, external life insurance assignment allowed.',
  },
  {
    code: 'ADCB',
    name: 'ADCB',
    short: 'ADCB',
    loanType: 'Islamic & Conventional',
    fastPass14Day: false,
    indicativeBestRatePct: 4.75,
    stlFixedSummary: 'Excellency/Emirati: 4.75% 3Y & 5Y · Others: 4.99% (0.25% listed disc)',
    nstlFixedSummary: '4.99% 1Y/3Y/5Y · Home Saver 4.99% 2Y',
    selfEmployedFixedSummary: 'Excellency: 4.75% 3Y/5Y · Standard: 4.99%',
    nonResidentFixedSummary: 'Resident focused',
    postFixedMargin: '1.99% + 3M EIBOR (5Y/Excellency) · 2.25% + 3M (3Y)',
    day1Variable: 'Excellency: 1.50% + 1M/3M EIBOR · Others: 1.75% + 1M/3M',
    stressTestRule: 'Follow-on Margin + 3M EIBOR',
    feeFinance: 'Yes — 6% (DLD + Broker) + 0.25% Mortgage Reg (Secondary)',
    earlySettlement: '1.05% capped AED 10,500 · NIL after 7 years',
    partialSettlement: 'Free up to 30% every year!',
    lifeInsurancePaPct: 0.2208,
    lifeInsuranceNote: '0.0184% p.m. reducing (External assignment fee AED 5,250)',
    propertyInsurancePaPct: 0.042,
    propertyInsuranceNote: '0.042% p.a. recovered yearly',
    processingFee: 'Excellency/Emirati: 0.525% · Others: 0.7875% (cap AED 52,500) · Buyout: 0%',
    preApprovalFee: 'NIL',
    valuationFee: 'AED 3,150 incl. VAT (Free on buyout!)',
    valuationFeeAed: 3150,
    maxLtvLocalPct: 85,
    maxLtvExpatPct: 80,
    maxLtvNonResPct: 0,
    maxTenureYears: 25,
    minLoanAed: 250_000,
    maxLoanAed: 24_000_000,
    minSalaryExpatAed: 15_000,
    minSalaryLocalAed: 8_000,
    minLosRule: '3m with confirmation + previous experience letter',
    buyoutSupported: true,
    equityReleaseSummary: 'Primary + Equity up to 80% LTV upon TD/MD; 3rd party purchase',
    selfEmployedFriendly: 'Yes',
    nonResidentSupported: false,
    commercialSupported: true,
    emirates: 'Dubai, Abu Dhabi & select RAK/Ajman/Sharjah',
    paTatDays: 3,
    valuationTatDays: 3,
    folTatDays: 3,
    totalTatDays: 17,
    bonusRule: '50% of 2y average (listed employers)',
    rentalIncomeRule: '83% up to primary income',
    airlineRule: 'Emirates/Etihad/FlyDubai Aviator 0.25% rate discount + 50% flying allowance',
    keyNotes: 'No audit needed up to AED 10M (VAT margin method!). 0.25% special rate for ADNOC, Mubadala, Aldar, RTA, Emirates & Etihad.',
  },
  {
    code: 'EIB',
    name: 'Emirates Islamic',
    short: 'EIB',
    loanType: 'Islamic',
    fastPass14Day: false,
    indicativeBestRatePct: 3.99,
    stlFixedSummary: '3.99% 3Y · 4.39% 5Y',
    nstlFixedSummary: '4.19% 3Y · 4.59% 5Y',
    selfEmployedFixedSummary: '4.19% 3Y · 4.59% 5Y',
    nonResidentFixedSummary: '4.19% 3Y · 4.59% 5Y (Freehold)',
    postFixedMargin: '1.99% + 3M EIBOR (All segments)',
    day1Variable: 'FTV<=75%: 1.74% + 3M (STL) / 1.99% + 3M (NSTL) · Handover NIL PF/Val',
    stressTestRule: 'Current rate + 2%',
    feeFinance: 'Yes — 6%',
    earlySettlement: '1% capped at AED 10,500',
    partialSettlement: '1% capped at AED 10,500',
    lifeInsurancePaPct: 0.1224,
    lifeInsuranceNote: '0.1224% p.a. (Ultra-competitive Takaful rate)',
    propertyInsurancePaPct: 0.0504,
    propertyInsuranceNote: '0.0504% p.a.',
    processingFee: 'STL: NIL · NSTL: 0.50% + VAT · Buyout: 0%',
    preApprovalFee: 'NIL (Standard AED 1,050 freehold, waiver requestable)',
    valuationFee: 'AED 2,625 incl. VAT (NIL on developer handover promo)',
    valuationFeeAed: 2625,
    maxLtvLocalPct: 85,
    maxLtvExpatPct: 80,
    maxLtvNonResPct: 60,
    maxTenureYears: 25,
    minLoanAed: 200_000,
    maxLoanAed: 15_000_000,
    minSalaryExpatAed: 15_000,
    minSalaryLocalAed: 8_000,
    minLosRule: '6m + previous experience letter',
    buyoutSupported: true,
    equityReleaseSummary: 'Up to 70% LTV (AED 300k renovation / property purchase)',
    selfEmployedFriendly: 'Yes',
    nonResidentSupported: true,
    commercialSupported: true,
    emirates: 'All Locations of UAE (Freehold)',
    paTatDays: 3,
    valuationTatDays: 3,
    folTatDays: 3,
    totalTatDays: 17,
    bonusRule: '50% of 3-year average bonus',
    rentalIncomeRule: '75% of rental income (capped 75% salary)',
    airlineRule: '50% average sales/variable pay',
    keyNotes: 'Ultra-low 0.1224% life insurance, 5.49% Istisna under-construction finance, AED 8k min salary for UAE Nationals.',
  },
  {
    code: 'NBF',
    name: 'National Bank of Fujairah',
    short: 'NBF',
    loanType: 'Islamic & Conventional',
    fastPass14Day: false,
    indicativeBestRatePct: 4.25,
    stlFixedSummary: '4.50% 3Y · 4.25% 5Y',
    nstlFixedSummary: '4.75% 3Y · 4.50% 5Y',
    selfEmployedFixedSummary: 'Full Doc: 5.25% 3Y / 4.99% 5Y · Low Doc: 5.50% 3Y / 5.24% 5Y',
    nonResidentFixedSummary: 'UAE Residents only',
    postFixedMargin: 'STL: 1.49% + 3M EIBOR · NSTL/SE: 1.75% + 3M EIBOR',
    day1Variable: 'Bundled STL: 1.49% + 3M EIBOR · Standard: 1.65% + 3M (Floor 2.99%)',
    stressTestRule: 'Rate + 2%',
    feeFinance: 'No',
    earlySettlement: '1% capped at AED 10,000',
    partialSettlement: '1% capped at AED 10,000',
    lifeInsurancePaPct: 0.3108,
    lifeInsuranceNote: '0.3108% p.a. (0.02358% p.m.)',
    propertyInsurancePaPct: 0.0396,
    propertyInsuranceNote: '0.0396% p.a.',
    processingFee: 'STL: NIL · NSTL: 0.50% + VAT (0.25% >5M) · SE: 1% · Buyout: 0%',
    preApprovalFee: 'AED 1,050 (adjusted to PF; refundable if declined)',
    valuationFee: 'AED 2,625 incl. VAT',
    valuationFeeAed: 2625,
    maxLtvLocalPct: 85,
    maxLtvExpatPct: 80,
    maxLtvNonResPct: 0,
    maxTenureYears: 25,
    minLoanAed: 200_000,
    maxLoanAed: 20_000_000,
    minSalaryExpatAed: 15_000,
    minSalaryLocalAed: 15_000,
    minLosRule: '6m confirmed (Self-Employed: only 1 YEAR LOB accepted!)',
    buyoutSupported: true,
    equityReleaseSummary: 'Easiest bank for pure equity (up to 70% LTV, bundled offer)',
    selfEmployedFriendly: 'Yes',
    nonResidentSupported: false,
    commercialSupported: false,
    emirates: 'All Emirates (Ajman capped 50% LTV)',
    paTatDays: 4,
    valuationTatDays: 3,
    folTatDays: 5,
    totalTatDays: 20,
    bonusRule: '50% guaranteed bonus',
    rentalIncomeRule: '83% of rental income',
    airlineRule: 'Standard income assessment',
    keyNotes: 'Accepts Self-Employed with only 1 year Length of Business (LOB) & no audit under AED 5M! Easiest pure equity desk.',
  },
  {
    code: 'ARAB',
    name: 'Arab Bank UAE',
    short: 'Arab Bank',
    loanType: 'Conventional',
    fastPass14Day: true,
    indicativeBestRatePct: 3.98,
    stlFixedSummary: '3.98% 2Y · 4.15% 3Y',
    nstlFixedSummary: '4.15% 2Y · 4.30% 3Y',
    selfEmployedFixedSummary: '4.89% 2Y · 4.99% 3Y',
    nonResidentFixedSummary: '6.99% 2Y Fixed (50% Max LTV)',
    postFixedMargin: 'STL: 1.89% + 6M EIBOR · NSTL: 1.99% + 6M · SE: 2.50% + 6M',
    day1Variable: 'Fixed introductory periods preferred',
    stressTestRule: 'STL 6.59%–6.84% / NSTL 6.84%–7.09%',
    feeFinance: 'Personal loan 10% over 4 years',
    earlySettlement: '1% capped AED 10,500 (0% on property sale!)',
    partialSettlement: 'Free up to 25% every year!',
    lifeInsurancePaPct: 0.42,
    lifeInsuranceNote: '0.42% p.a. (Independent life insurance can be assigned)',
    propertyInsurancePaPct: 0.06,
    propertyInsuranceNote: '0.06% p.a.',
    processingFee: 'STL: 0.25% + VAT · NSTL/SE: 0.50% · Buyout: 0% · Equity: 1%',
    preApprovalFee: 'NIL by email (AED 1,000 formal letter)',
    valuationFee: 'AED 3,000 incl. VAT',
    valuationFeeAed: 3000,
    maxLtvLocalPct: 85,
    maxLtvExpatPct: 80,
    maxLtvNonResPct: 50,
    maxTenureYears: 25,
    minLoanAed: 200_000,
    maxLoanAed: 7_300_000,
    minSalaryExpatAed: 20_000,
    minSalaryLocalAed: 15_000,
    minLosRule: '1y UAE/Core Arabs · 2y Non-Arabs',
    buyoutSupported: true,
    equityReleaseSummary: 'Locals/Arabs 60% LTV · Non-Arabs 50% LTV (direct cash to client A/c)',
    selfEmployedFriendly: 'Mixed',
    nonResidentSupported: true,
    commercialSupported: false,
    emirates: 'Dubai, Abu Dhabi, Sharjah & RAK (Al Hamra)',
    paTatDays: 3,
    valuationTatDays: 2,
    folTatDays: 2,
    totalTatDays: 12,
    bonusRule: '90%–100% of lower of 2 years bonus!',
    rentalIncomeRule: '75% of rent up to 25% of gross salary',
    airlineRule: '75% of 6m commission / 90% of 9m + school education allowance included!',
    keyNotes: 'Fast-Pass 12 working days total TAT! 90-day payment grace period after disbursal & 0% early exit fee on sale.',
  },
  {
    code: 'SIB',
    name: 'Sharjah Islamic Bank',
    short: 'SIB',
    loanType: 'Islamic',
    fastPass14Day: false,
    indicativeBestRatePct: 3.99,
    stlFixedSummary: '3.99% 3Y · 4.25% 5Y',
    nstlFixedSummary: '4.25% 3Y · 4.49% 5Y',
    selfEmployedFixedSummary: '4.49% 3Y · 4.99% 5Y',
    nonResidentFixedSummary: 'UAE Residents',
    postFixedMargin: 'STL: 1.75% + 3M EIBOR · NSTL: 1.99% + 3M · SE: 2.25% + 3M',
    day1Variable: 'Commercial/Office: 4.00%–5.25% + 6M EIBOR',
    stressTestRule: '3M EIBOR + Bank margin',
    feeFinance: 'Yes',
    earlySettlement: '1% + VAT capped at AED 10,000',
    partialSettlement: '1% capped at AED 10,500',
    lifeInsurancePaPct: 0.21,
    lifeInsuranceNote: '0.21% p.a. (0.0225% monthly reducing)',
    propertyInsurancePaPct: 0.0175,
    propertyInsuranceNote: '0.0175% p.a. (min AED 455 — lowest paid property cover)',
    processingFee: 'STL: NIL · NSTL: 0.50% + VAT (min 2k) · SE: 1% + VAT',
    preApprovalFee: 'NIL (AED 2,100 adjusted toward PF on commercial)',
    valuationFee: 'AED 2,625 incl. VAT (Internal ASAS valuation)',
    valuationFeeAed: 2625,
    maxLtvLocalPct: 85,
    maxLtvExpatPct: 80,
    maxLtvNonResPct: 0,
    maxTenureYears: 25,
    minLoanAed: 250_000,
    maxLoanAed: 15_000_000,
    minSalaryExpatAed: 12_000,
    minSalaryLocalAed: 12_000,
    minLosRule: '6m confirmed (1y history)',
    buyoutSupported: true,
    equityReleaseSummary: 'Pure buyout residential; Commercial CashyourProperty available',
    selfEmployedFriendly: 'Mixed',
    nonResidentSupported: false,
    commercialSupported: true,
    emirates: 'Dubai, Abu Dhabi, Sharjah & Ajman',
    paTatDays: 4,
    valuationTatDays: 3,
    folTatDays: 4,
    totalTatDays: 18,
    bonusRule: 'Not considered',
    rentalIncomeRule: '70% of annual rental income',
    airlineRule: 'Standard salary assessment',
    keyNotes: 'Min AED 12k salary (listed), lowest paid property insurance (0.0175%), strong Sharjah/Northern Emirates & commercial retail/office desk.',
  },
  {
    code: 'AJMAN',
    name: 'Ajman Bank',
    short: 'Ajman',
    loanType: 'Islamic',
    fastPass14Day: false,
    indicativeBestRatePct: 3.99,
    stlFixedSummary: '3.99% 3Y Fixed',
    nstlFixedSummary: '3.5M+: 4.10% · 2M–3.49M: 4.15% · <2M: 4.25% (3Y)',
    selfEmployedFixedSummary: '4.10%–4.25% 3Y Fixed (tiered by loan size)',
    nonResidentFixedSummary: 'UAE Residents only',
    postFixedMargin: 'STL: 1.59% + 3M EIBOR · NSTL/SE: 1.69% + 3M EIBOR',
    day1Variable: '1st Degree: 1.75% + 3M (STL) / 1.99% + 3M (NSTL) · Floor 3.99%',
    stressTestRule: 'Follow-on rate including EIBOR',
    feeFinance: 'No',
    earlySettlement: '1% capped at AED 10,500',
    partialSettlement: '1% capped at AED 10,000',
    lifeInsurancePaPct: 0.324,
    lifeInsuranceNote: '0.324% p.a.',
    propertyInsurancePaPct: 0.03996,
    propertyInsuranceNote: '0.03996% p.a.',
    processingFee: 'STL: NIL · NSTL: 0.35% + VAT · SE: 0.50% + VAT',
    preApprovalFee: 'NIL',
    valuationFee: 'AED 2,625 incl. VAT',
    valuationFeeAed: 2625,
    maxLtvLocalPct: 85,
    maxLtvExpatPct: 80,
    maxLtvNonResPct: 0,
    maxTenureYears: 25,
    minLoanAed: 250_000,
    maxLoanAed: 10_000_000,
    minSalaryExpatAed: 15_000,
    minSalaryLocalAed: 15_000,
    minLosRule: '3m Local / 6m Expat confirmed',
    buyoutSupported: true,
    equityReleaseSummary: 'Pure purchase / resale / buyout + under-construction (40% completion)',
    selfEmployedFriendly: 'Mixed',
    nonResidentSupported: false,
    commercialSupported: false,
    emirates: 'All Emirates (except Fujairah & UAQ)',
    paTatDays: 4,
    valuationTatDays: 3,
    folTatDays: 4,
    totalTatDays: 18,
    bonusRule: '1y fixed bonus up to 30% salary',
    rentalIncomeRule: '70% with rental assignment (30% standard)',
    airlineRule: '50% of 6m regular commission',
    keyNotes: 'Ultra-competitive 0.35% NSTL processing fee & 4.10%–4.25% 3Y fixed for Self-Employed!',
  },
  {
    code: 'UAB',
    name: 'United Arab Bank',
    short: 'UAB',
    loanType: 'Islamic & Conventional',
    fastPass14Day: false,
    indicativeBestRatePct: 4.49,
    stlFixedSummary: 'Variable-led: 1.49% + 3M EIBOR (Sadara 1.25% + 3M)',
    nstlFixedSummary: '1.99% + 3M EIBOR (Sadara 1.59% + 3M)',
    selfEmployedFixedSummary: 'Low Doc: 1.99% + 3M (Sadara 1.59% + 3M)',
    nonResidentFixedSummary: '2.99% + 3M EIBOR (Sadara 2.39% · Low Doc 50k avg bal)',
    postFixedMargin: '1.49%–1.99% + 3M EIBOR (Floor 2.49%–2.99%)',
    day1Variable: 'Sadara STL: 1.25% + 3M EIBOR · Standard STL: 1.49% + 3M',
    stressTestRule: 'Rate + 2%',
    feeFinance: 'Personal loan @ 4.49% for 4 years to cover closing costs',
    earlySettlement: '1% capped at AED 10,000',
    partialSettlement: '1% capped at AED 10,000',
    lifeInsurancePaPct: 0.18,
    lifeInsuranceNote: '0.18% p.a.',
    propertyInsurancePaPct: 0.06,
    propertyInsuranceNote: '0.06% p.a.',
    processingFee: 'STL: 0.25% · NSTL: 0.50% · Buyout: NIL · Low Doc: 1%',
    preApprovalFee: 'NIL',
    valuationFee: 'AED 3,150 incl. VAT',
    valuationFeeAed: 3150,
    maxLtvLocalPct: 85,
    maxLtvExpatPct: 80,
    maxLtvNonResPct: 50,
    maxTenureYears: 25,
    minLoanAed: 300_000,
    maxLoanAed: 15_000_000,
    minSalaryExpatAed: 15_000,
    minSalaryLocalAed: 15_000,
    minLosRule: '3m confirmed + previous experience letter',
    buyoutSupported: true,
    equityReleaseSummary: 'Normal LTVs for renovation / new purchase (3rd party payment)',
    selfEmployedFriendly: 'Low-Doc 60%',
    nonResidentSupported: true,
    commercialSupported: false,
    emirates: 'All Emirates',
    paTatDays: 4,
    valuationTatDays: 3,
    folTatDays: 4,
    totalTatDays: 19,
    bonusRule: 'Not considered',
    rentalIncomeRule: '80% of rental income',
    airlineRule: '80% of variable pay + 100% specified accommodation (min 8k basic)',
    keyNotes: 'Tenor up to AGE 70 for BOTH Salaried and Self-Employed! Low-Doc Non-Resident with AED 50k 6m avg balance.',
  },
  {
    code: 'BOB',
    name: 'Bank of Baroda UAE',
    short: 'BoB',
    loanType: 'Conventional',
    fastPass14Day: false,
    indicativeBestRatePct: 4.9,
    stlFixedSummary: '4.90% Fixed 2 Years',
    nstlFixedSummary: '4.90% Fixed 2 Years',
    selfEmployedFixedSummary: '2.00% + 3M EIBOR (Floor 3.50%–4.50%)',
    nonResidentFixedSummary: 'Indian & GCC Nationals corridor',
    postFixedMargin: '2.00% + 3M EIBOR (Floor 4.50%)',
    day1Variable: '2.00% + 3M EIBOR (Floor 3.50%)',
    stressTestRule: '2.25% + 3M EIBOR + 2%',
    feeFinance: 'No',
    earlySettlement: '1% capped at AED 10,000',
    partialSettlement: '1% capped at AED 10,000',
    lifeInsurancePaPct: 0.2,
    lifeInsuranceNote: 'Bank / assigned cover',
    propertyInsurancePaPct: 0.05,
    propertyInsuranceNote: 'Applicant assigns property insurance to BoB',
    processingFee: '1% + VAT (Ceiling AED 25,000 + VAT)',
    preApprovalFee: 'NIL',
    valuationFee: 'AED 2,500 + VAT (Legal + Val AED 5,000 + VAT)',
    valuationFeeAed: 2625,
    maxLtvLocalPct: 85,
    maxLtvExpatPct: 75,
    maxLtvNonResPct: 0,
    maxTenureYears: 25,
    minLoanAed: 200_000,
    maxLoanAed: 60_000_000,
    minSalaryExpatAed: 10_000,
    minSalaryLocalAed: 10_000,
    minLosRule: '2y UAE visa (6m confirmed current)',
    buyoutSupported: false,
    equityReleaseSummary: 'Not offered',
    selfEmployedFriendly: 'Mixed',
    nonResidentSupported: false,
    commercialSupported: true,
    emirates: 'Dubai, Sharjah & RAK',
    paTatDays: 5,
    valuationTatDays: 4,
    folTatDays: 5,
    totalTatDays: 22,
    bonusRule: '50% of 2-year average bonus',
    rentalIncomeRule: '12m average bank credit assessment',
    airlineRule: '50% of 2y average other income',
    keyNotes: 'Up to AED 60M loan ceiling! Strong Indian & GCC National corridor (min AED 10k salary; PAN mandatory for Indians).',
  },
  {
    code: 'ALHILAL',
    name: 'Al Hilal Bank',
    short: 'Al Hilal',
    loanType: 'Islamic',
    fastPass14Day: false,
    indicativeBestRatePct: 4.99,
    stlFixedSummary: 'UAE Nationals / Tharwa: 4.99% 3Y & 5Y (0.25% listed disc)',
    nstlFixedSummary: '4.99% 3Y · 5.24% 5Y',
    selfEmployedFixedSummary: 'Refer ADCB Group Islamic desk',
    nonResidentFixedSummary: 'UAE Residents only',
    postFixedMargin: '2.25% + 3M EIBOR (3Y) · 1.99% + 3M EIBOR (5Y)',
    day1Variable: 'Tharwa/Nationals: 1.50% + 3M EIBOR · Others: 1.75% + 3M',
    stressTestRule: 'Follow-on Margin + 3M EIBOR',
    feeFinance: 'Yes (ADCB Group terms)',
    earlySettlement: '1% capped at AED 10,500',
    partialSettlement: 'Up to 30% p.a.',
    lifeInsurancePaPct: 0.22,
    lifeInsuranceNote: 'ADCB Group Islamic Takaful',
    propertyInsurancePaPct: 0.042,
    propertyInsuranceNote: '0.042% p.a.',
    processingFee: '0.525%–0.7875% · Buyout: NIL',
    preApprovalFee: 'NIL',
    valuationFee: 'AED 3,150 incl. VAT',
    valuationFeeAed: 3150,
    maxLtvLocalPct: 85,
    maxLtvExpatPct: 80,
    maxLtvNonResPct: 0,
    maxTenureYears: 25,
    minLoanAed: 250_000,
    maxLoanAed: 24_000_000,
    minSalaryExpatAed: 15_000,
    minSalaryLocalAed: 8_000,
    minLosRule: '3m confirmed + previous experience',
    buyoutSupported: true,
    equityReleaseSummary: 'ADCB Group Sharia equity options',
    selfEmployedFriendly: 'Mixed',
    nonResidentSupported: false,
    commercialSupported: false,
    emirates: 'Dubai & Abu Dhabi',
    paTatDays: 3,
    valuationTatDays: 3,
    folTatDays: 3,
    totalTatDays: 17,
    bonusRule: '50% of 2y listed bonus',
    rentalIncomeRule: '83% up to primary income',
    airlineRule: '0.25% Aviator & Mubadala/ADNOC/Aldar/RTA discount',
    keyNotes: 'ADCB Group Islamic arm — special 0.25% discount for UAE Nationals, Tharwa, ADNOC, Mubadala, RTA, Emirates & Etihad.',
  },
];

export const UAE_BANK_RMS: BankRmContact[] = [
  // CBD
  { bank: 'CBD', desk: 'Submission Desk', rmName: 'Roseinalyn Pangaa', phone: '', email: 'roseinalyn.pangga@cbd.ae', directSubmissionAllowed: true },
  { bank: 'CBD', desk: "Hani's Team", rmName: 'Ali Abbas', phone: '056 495 0001', email: 'ali.abbas@cbd.ae', escalationName: 'Hani El-Mekki', escalationPhone: '050 818 4819', escalationEmail: 'hani.elhanafi@cbd.ae', directSubmissionAllowed: true },
  { bank: 'CBD', desk: "Hani's Team", rmName: 'Ashok Rajendran', phone: '052 684 7827', email: 'ashok.r@cbd.ae', escalationName: 'Hani El-Mekki', escalationPhone: '050 818 4819', directSubmissionAllowed: true },
  { bank: 'CBD', desk: "Hani's Team", rmName: 'Afzal Aziz', phone: '050 284 7029', email: 'afzal.aziz@cbd.ae', directSubmissionAllowed: true },
  { bank: 'CBD', desk: "Hani's Team", rmName: 'Obaidullah Khaja', phone: '056 874 4336', email: 'obaidullah.khaja@cbd.ae', directSubmissionAllowed: true },
  { bank: 'CBD', desk: "Hani's Team", rmName: 'Yasmeen Anwar', phone: '', email: 'yasmeen.anwar@cbd.ae', directSubmissionAllowed: true },
  { bank: 'CBD', desk: 'Dubai Retail', rmName: 'Arshad Rizwan', phone: '050 205 7523', email: 'anjum.bhatti@cbd.ae', directSubmissionAllowed: true },
  { bank: 'CBD', desk: 'Dubai Retail', rmName: 'Tariq Sharif', phone: '055 760 3866', email: 'tariq.sharif@cbd.ae', directSubmissionAllowed: true },
  { bank: 'CBD', desk: 'Dubai Retail', rmName: 'Mian Ahmed Shujah Ul Din', phone: '058 576 1473', email: 'mian.shujahuldin@cbd.ae', directSubmissionAllowed: true },
  { bank: 'CBD', desk: 'Dubai Retail', rmName: 'Anjum Naseer Bhatti', phone: '056 588 2260', email: 'anjum.bhatti@cbd.ae', directSubmissionAllowed: true },
  { bank: 'CBD', desk: "Shahid's Team", rmName: 'Khalid Mehmood', phone: '055 128 9516', email: 'khalid.mehmood2@cbd.ae', escalationName: 'Shahid Liaqat', escalationPhone: '055 119 2920', escalationEmail: 'shahid.liaqat@cbd.ae', directSubmissionAllowed: true },
  { bank: 'CBD', desk: "Shahid's Team", rmName: 'Lamiae Elatyfy', phone: '054 495 1718', email: 'lamiae.elatyfy@cbd.ae', directSubmissionAllowed: true },
  { bank: 'CBD', desk: "Shahid's Team", rmName: 'Shijithra Kumar', phone: '052 645 2875', email: 'shijithra.kumar@cbd.ae', directSubmissionAllowed: true },
  { bank: 'CBD', desk: "Shahid's Team", rmName: 'Akash Bansal', phone: '056 908 1393', email: 'akash.bansal@cbd.ae', directSubmissionAllowed: true },
  { bank: 'CBD', desk: "Shahid's Team", rmName: 'Sharjeel Khan', phone: '050 735 8932', email: 'sharjeel.khan@cbd.ae', directSubmissionAllowed: true },
  { bank: 'CBD', desk: "Shahid's Team", rmName: 'Mohammed Azam Siddiqui', phone: '050 762 0366', email: 'mohammed.siddiqui@cbd.ae', directSubmissionAllowed: true },
  { bank: 'CBD', desk: 'Dubai Retail', rmName: 'Rajesh Arumugam', phone: '055 271 4332', email: 'rajesh.arumugam@cbd.ae', directSubmissionAllowed: true },
  { bank: 'CBD', desk: 'Dubai Retail', rmName: 'Usman Farooq', phone: '050 379 2887', email: 'usman.farooq@cbd.ae', directSubmissionAllowed: true },
  { bank: 'CBD', desk: 'Dubai Retail', rmName: 'Manoj Puri', phone: '050 884 7040', email: 'manoj.puri@cbd.ae', directSubmissionAllowed: true },
  { bank: 'CBD', desk: 'Dubai Retail', rmName: 'Annuradha Singh', phone: '050 307 6796', email: 'annuradha.singh@cbd.ae', directSubmissionAllowed: true },
  { bank: 'CBD', desk: 'Dubai Retail', rmName: 'Farhan Idrees', phone: '050 866 1201', email: 'farhan.idrees@cbd.ae', directSubmissionAllowed: true },
  { bank: 'CBD', desk: 'Abu Dhabi', rmName: 'Helal Abdelmagid Rezk', phone: '052 334 2230', email: 'helal.rezk@cbd.ae', escalationName: 'Shah Alam', escalationPhone: '055 945 3339', escalationEmail: 'shah.alam@cbd.ae', directSubmissionAllowed: true },
  // DIB
  { bank: 'DIB', desk: 'Referral Desk', rmName: 'DIB HF Leads Desk', phone: '', email: 'hf.leads@dib.ae', directSubmissionAllowed: true },
  { bank: 'DIB', desk: 'Direct', rmName: 'Zakkir Hussain', phone: '050 276 4633', email: 'zakkir.hussain@dib.ae', escalationName: 'Nelson Fernandes', escalationPhone: '050 737 9380', escalationEmail: 'nelson.fernandes@dib.ae', directSubmissionAllowed: true },
  { bank: 'DIB', desk: 'Direct', rmName: 'Suhail Nasarullah', phone: '055 272 0021', email: 'suhail.nasarulla@dib.ae', directSubmissionAllowed: true },
  { bank: 'DIB', desk: 'Direct', rmName: 'Dinesh Jewani', phone: '052 731 4101', email: 'dinesh.jewani@dib.ae', directSubmissionAllowed: true },
  { bank: 'DIB', desk: 'Direct', rmName: 'Waqas S Khan', phone: '055 920 3736', email: 'Waqas.SKhan@dib.ae', directSubmissionAllowed: true },
  { bank: 'DIB', desk: 'Advisory', rmName: 'Muhammad Irfan', phone: '056 604 0943', email: 'muhammad.airfan@dib.ae', directSubmissionAllowed: false },
  { bank: 'DIB', desk: 'Advisory', rmName: 'Aslam Valappil', phone: '050 171 7039', email: 'aslam.valappil@dib.ae', directSubmissionAllowed: false },
  { bank: 'DIB', desk: 'Advisory', rmName: 'Najeeb Ahmad', phone: '055 421 1786', email: 'najeeb.ahmad@dib.ae', directSubmissionAllowed: false },
  { bank: 'DIB', desk: 'Advisory', rmName: 'Jibran Wani', phone: '050 129 1690', email: 'Jibran.wani@dib.ae', directSubmissionAllowed: false },
  // Emirates NBD
  { bank: 'ENBD', desk: 'Direct', rmName: 'Suraj Singh', phone: '056 163 3505', email: 'surajsin@emiratesnbd.com', escalationName: 'Ameer Koroth Thottathil', escalationPhone: '050 422 8109', escalationEmail: 'KorothT@emiratesnbd.com', directSubmissionAllowed: true },
  { bank: 'ENBD', desk: 'Coordinator', rmName: 'Satya Narayana', phone: '050 587 2017', email: 'VeeraB@emiratesnbd.com', directSubmissionAllowed: false },
  { bank: 'ENBD', desk: 'Coordinator', rmName: 'Arsalam Rafiq', phone: '052 575 2487', email: 'arsalamr@emiratesnbd.com', directSubmissionAllowed: true },
  { bank: 'ENBD', desk: 'CC Submission', rmName: 'Luvis F (Coordinator)', phone: '', email: 'LuvisF@emiratesnbd.com', directSubmissionAllowed: true },
  // Arab Bank
  { bank: 'Arab Bank', desk: 'Direct', rmName: 'Faris Sheriff', phone: '055 923 0588', email: 'faris.sheriff@arabbank.ae', directSubmissionAllowed: true },
  // Ajman Bank
  { bank: 'Ajman Bank', desk: 'Submission Desk', rmName: 'Ajman HF Submissions', phone: '', email: 'HF@ajmanbank.ae', escalationName: 'Atif Jamal', escalationPhone: '056 179 5868', escalationEmail: 'Atif.Jamal@AjmanBank.ae', directSubmissionAllowed: true },
  { bank: 'Ajman Bank', desk: 'Direct', rmName: 'Faisal Ilyas Khan', phone: '052 633 5388', email: 'Faisal.Khan@ajmanbank.ae', directSubmissionAllowed: true },
  { bank: 'Ajman Bank', desk: 'Direct', rmName: 'Sherif Ahmed Rob', phone: '050 894 1007', email: 'sharif.ahmed@ajmanbank.ae', directSubmissionAllowed: true },
  { bank: 'Ajman Bank', desk: 'Direct', rmName: 'Mushrraf Abdul Saeed Hakim', phone: '050 295 3631', email: 'mushrraf.saeed@ajmanbank.ae', directSubmissionAllowed: true },
  { bank: 'Ajman Bank', desk: 'Direct', rmName: 'Atif Jamal', phone: '056 179 5868', email: 'Atif.Jamal@AjmanBank.ae', directSubmissionAllowed: true },
  { bank: 'Ajman Bank', desk: 'Direct', rmName: 'Mohamed Mamdouh', phone: '050 688 0629', email: 'Mohamed.Elsayed@ajmanbank.ae', directSubmissionAllowed: true },
  // HSBC
  { bank: 'HSBC', desk: 'CC All Submissions', rmName: 'HSBC Mortgage Team', phone: '', email: 'mortgage.team@hsbc.com', directSubmissionAllowed: true },
  { bank: 'HSBC', desk: 'Direct', rmName: 'Mayank Talreja', phone: '056 978 6633', email: 'mayank.l.talreja@hsbc.com', escalationName: 'Kashif Gul Ahmed', escalationPhone: '056 676 2075', escalationEmail: 'kashif.gul@hsbc.com', directSubmissionAllowed: true },
  { bank: 'HSBC', desk: 'Direct', rmName: 'Adnan Larik', phone: '050 718 4749', email: 'adnan.larik@hsbc.com', escalationName: 'Joseph Guirguis', escalationEmail: 'Joseph.guirguis@hsbc.com', directSubmissionAllowed: true },
  { bank: 'HSBC', desk: 'Direct', rmName: 'Catherine Emmerson', phone: '056 683 3859', email: 'catherine.emmerson@hsbc.com', directSubmissionAllowed: true },
  { bank: 'HSBC', desk: 'Direct', rmName: 'Shivani Sharda', phone: '056 228 2082', email: 'shivani.sharda@hsbc.com', directSubmissionAllowed: true },
  { bank: 'HSBC', desk: 'Direct', rmName: 'Elizabeth Healy', phone: '056 411 4727', email: 'elizabeth.healy@hsbc.com', directSubmissionAllowed: true },
  { bank: 'HSBC', desk: 'Direct', rmName: 'Barbara Soper', phone: '050 395 0966', email: 'barbara.soper@hsbc.com', directSubmissionAllowed: true },
  { bank: 'HSBC', desk: 'Direct', rmName: 'Dinesh Ramesh Chandiramani', phone: '056 686 8135', email: 'dinesh.chandiramani@hsbc.com', directSubmissionAllowed: true },
  { bank: 'HSBC', desk: 'Direct', rmName: 'Syed Danial Hasan', phone: '056 818 4271', email: 'syed.d.rizvi@hsbc.com', directSubmissionAllowed: true },
  // EIB
  { bank: 'EIB', desk: 'Direct', rmName: 'Khalid Kazi', phone: '055 999 2679', email: 'khalidkazi@emiratesislamic.ae', directSubmissionAllowed: true },
  { bank: 'EIB', desk: 'Direct', rmName: 'Muhammad Morsi', phone: '050 992 0957', email: 'MohamedMAHM@emiratesislamic.ae', directSubmissionAllowed: true },
  // ADCB
  { bank: 'ADCB', desk: 'Partner Direct', rmName: 'Rahul Pandey', phone: '055 963 3207', email: 'RahulPandey.ext@adcb.com', escalationName: 'Muhammed Imran Jawaid Arain', escalationPhone: '050 935 4097', escalationEmail: 'muhammed.i@adcb.com', directSubmissionAllowed: true },
  { bank: 'ADCB', desk: 'Partner Direct', rmName: 'Shradha Jethwa', phone: '052 253 3743', email: 'Shradhajethwa.ext@adcb.com', directSubmissionAllowed: true },
  { bank: 'ADCB', desk: 'Partner Direct', rmName: 'Krishna Kumar', phone: '050 185 2267', email: 'Krishnakumarkaladharan.ext@adcb.com', directSubmissionAllowed: true },
  { bank: 'ADCB', desk: 'Partner Direct', rmName: 'Sagar Das', phone: '052 766 3300', email: 'sagardas.ext@adcb.com', directSubmissionAllowed: true },
  { bank: 'ADCB', desk: 'Partner Direct', rmName: 'Mohamed Zayed (Halim)', phone: '056 969 6957', email: 'Mohamedzayed.ext@adcb.com', directSubmissionAllowed: true },
  { bank: 'ADCB', desk: 'Dubai Retail', rmName: 'Omar Shah', phone: '050 496 4757', email: 'shah.o@adcb.com', directSubmissionAllowed: true },
  { bank: 'ADCB', desk: 'Dubai Retail', rmName: 'Vivek Bhatia', phone: '055 387 4713', email: 'vivekbhatia.ext@adcb.com', directSubmissionAllowed: true },
  { bank: 'ADCB', desk: 'Dubai Retail', rmName: 'Yusuff Ali Khan', phone: '056 628 4948', email: 'yusuffkhan.ext@adcb.com', directSubmissionAllowed: true },
  { bank: 'ADCB', desk: 'Dubai Retail', rmName: 'Yazad Hodiwalla', phone: '056 786 5678', email: 'Yazad.Hodiwalla@adcb.com', directSubmissionAllowed: true },
  { bank: 'ADCB', desk: 'Dubai Retail', rmName: 'Shailesh Kamble', phone: '055 950 9834', email: 'shaileshkamble.ext@adcb.com', directSubmissionAllowed: true },
  { bank: 'ADCB', desk: 'Abu Dhabi Direct', rmName: 'Cristina Cravtova', phone: '052 769 7144', email: 'cristinacravtova.ext@adcb.com', directSubmissionAllowed: true },
  { bank: 'ADCB', desk: 'Abu Dhabi Direct', rmName: 'Ahmed Shaat', phone: '050 516 4745', email: 'ahmedshaat.ext@adcb.com', directSubmissionAllowed: true },
  { bank: 'ADCB', desk: 'Abu Dhabi Direct', rmName: 'Waseem Nakawah', phone: '052 690 4940', email: 'WaseemNakawah.ext@adcb.com', directSubmissionAllowed: true },
  { bank: 'ADCB', desk: 'Abu Dhabi Direct', rmName: 'Ahmed Elsiddig Mohamed', phone: '050 240 8980', email: 'Ahmed.M@adcb.com', directSubmissionAllowed: true },
  { bank: 'ADCB', desk: 'Commercial Banking', rmName: 'Hassan Ayoub', phone: '054 991 1526', email: 'Hassan.Ayoub@adcb.com', directSubmissionAllowed: true },
  { bank: 'ADCB', desk: 'Commercial Banking', rmName: 'Preetham Monteiro', phone: '054 991 1528', email: 'preetham.monteiro@adcb.com', directSubmissionAllowed: true },
  // ADIB
  { bank: 'ADIB', desk: 'CC All Submissions', rmName: 'ADIB Main Mailbox', phone: '', email: 'hfmb@adib.com', directSubmissionAllowed: true },
  { bank: 'ADIB', desk: 'Direct', rmName: 'Attiq Ur Rehman', phone: '052 715 2270', email: 'Attiq.Rehman@adib.com', escalationName: 'Soufian Dweidari', escalationPhone: '050 755 2458', escalationEmail: 'soufian.dweidari@adib.com', directSubmissionAllowed: true },
  { bank: 'ADIB', desk: 'Direct', rmName: 'Asif Reza', phone: '056 905 8091', email: 'Asif.Khan@adib.com', directSubmissionAllowed: true },
  { bank: 'ADIB', desk: 'Direct', rmName: 'Habib Asif', phone: '052 551 7037', email: 'Muhammad.Asif@adib.com', directSubmissionAllowed: true },
  { bank: 'ADIB', desk: 'Direct', rmName: 'Mohammed Khaja', phone: '050 893 5038', email: 'mohammed.khaja@adib.com', directSubmissionAllowed: true },
  { bank: 'ADIB', desk: 'Direct', rmName: 'Hassan Abdullah Hammam', phone: '055 550 0787', email: 'Hassan.Hammam@adib.com', directSubmissionAllowed: true },
  { bank: 'ADIB', desk: 'Direct', rmName: 'Rami Jrab', phone: '050 387 7334', email: 'M.Jrab@adib.com', directSubmissionAllowed: true },
  { bank: 'ADIB', desk: 'Direct', rmName: 'Mohamed Kamal Nofal', phone: '050 800 3980', email: 'mohamed.nofal@adib.com', directSubmissionAllowed: true },
  { bank: 'ADIB', desk: 'Direct', rmName: 'Fakhar Abbas Rizvi', phone: '052 830 6462', email: 'fakhar.rizvi@adib.com', directSubmissionAllowed: true },
  { bank: 'ADIB', desk: 'Direct', rmName: 'Yahya Alhalawany', phone: '058 642 1932', email: 'Yahya.Alhalawany@adib.com', directSubmissionAllowed: true },
  { bank: 'ADIB', desk: 'Advisory', rmName: 'Athar Chorghay', phone: '050 866 0105', email: 'Athar.Chorghay@adib.com', directSubmissionAllowed: false },
  { bank: 'ADIB', desk: 'Direct', rmName: 'Mohamad Mahmoud Alakhal', phone: '055 554 6643', email: 'Mohamad.Alakhal@adib.com', directSubmissionAllowed: true },
  // Mashreq
  { bank: 'Mashreq', desk: 'Retail Direct', rmName: 'Vibhav Tyagi', phone: '050 679 3345', email: 'VibhavT@mashreq.com', escalationName: 'Ameya Rao', escalationPhone: '055 403 0871', escalationEmail: 'AmeyaRao@mashreq.com', directSubmissionAllowed: true },
  { bank: 'Mashreq', desk: 'Retail Direct', rmName: 'Eslam Ahmed', phone: '052 831 6363', email: 'eslamah@mashreq.com', escalationName: 'Sameer Dhyani', escalationPhone: '050 421 9563', escalationEmail: 'SameerDh@mashreq.com', directSubmissionAllowed: true },
  { bank: 'Mashreq', desk: 'Retail Direct', rmName: 'Sameer Anil Mulye', phone: '056 150 1404', email: 'SameerM@mashreq.com', directSubmissionAllowed: true },
  { bank: 'Mashreq', desk: 'Retail Direct', rmName: 'Praveen Choudhary', phone: '050 569 5113', email: 'PraveenCh@mashreq.com', directSubmissionAllowed: true },
  { bank: 'Mashreq', desk: 'Retail Direct', rmName: 'Viju Pola', phone: '055 224 1615', email: 'vijupo@mashreq.com', directSubmissionAllowed: true },
  { bank: 'Mashreq', desk: 'Retail Direct', rmName: 'Vinod Kumar', phone: '055 314 4174', email: 'VinodK@mashreq.com', directSubmissionAllowed: true },
  { bank: 'Mashreq', desk: 'Emarati Segment', rmName: 'Peter Farag', phone: '050 716 6059', email: 'peterfa@mashreq.com', directSubmissionAllowed: true },
  { bank: 'Mashreq', desk: 'Emarati Segment', rmName: 'Ahmed Mahgoub Mohamed', phone: '055 540 4049', email: 'ahmedabdelg@mashreq.com', directSubmissionAllowed: true },
  { bank: 'Mashreq', desk: 'Emarati Segment', rmName: 'Mohamed Moussa', phone: '056 539 6036', email: 'Mohamedy@mashreq.com', directSubmissionAllowed: true },
  { bank: 'Mashreq', desk: 'Business Banking', rmName: 'Sheetal Milind Vaidya', phone: '', email: 'sheetalmilindv@mashreq.com', directSubmissionAllowed: true },
  { bank: 'Mashreq', desk: 'Business Banking', rmName: 'Sabeel Ata', phone: '', email: 'SabeelA@mashreq.com', directSubmissionAllowed: true },
  { bank: 'Mashreq', desk: 'Business Banking', rmName: 'Vibhor Khattar', phone: '052 350 9500', email: 'vibhork@mashreq.com', directSubmissionAllowed: true },
  { bank: 'Mashreq', desk: 'Business Banking', rmName: 'Sanjay Singh', phone: '056 883 3320', email: 'Sanjaysingh@mashreq.com', directSubmissionAllowed: true },
  { bank: 'Mashreq', desk: 'Business Banking', rmName: 'Rwituja Chowdhury', phone: '052 847 4214', email: 'rwitujac@mashreq.com', directSubmissionAllowed: true },
  { bank: 'Mashreq', desk: 'Business Banking', rmName: 'Pramod Nimraniya', phone: '056 406 2698', email: 'pramodni@mashreq.com', directSubmissionAllowed: true },
  { bank: 'Mashreq', desk: 'Business Banking', rmName: 'Mohd Aamir Khan', phone: '052 554 5690', email: 'mohdaamirk@mashreq.com', directSubmissionAllowed: true },
  { bank: 'Mashreq', desk: 'Business Banking', rmName: 'Krunal Patel', phone: '050 107 6883', email: 'krunalpa@mashreq.com', directSubmissionAllowed: true },
  { bank: 'Mashreq', desk: 'Business Banking', rmName: 'Lalit Kumar Raimalani', phone: '050 138 0231', email: 'LalitKumar1@mashreq.com', directSubmissionAllowed: true },
  { bank: 'Mashreq', desk: 'Business Banking', rmName: 'Kunal Kumar', phone: '050 241 4575', email: 'kunalku@mashreq.com', directSubmissionAllowed: true },
  { bank: 'Mashreq', desk: 'Business Banking', rmName: 'Prateek G', phone: '056 583 9943', email: 'PrateekG@mashreq.com', directSubmissionAllowed: true },
  // NBF
  { bank: 'NBF', desk: 'Referral Desk', rmName: 'NBF Mortgages Desk', phone: '', email: 'mortgages@nbf.ae', directSubmissionAllowed: true },
  { bank: 'NBF', desk: 'Direct', rmName: 'Suvef Raza Shaikh', phone: '056 991 3677', email: 'xSuvef@nbf.ae', escalationName: 'Ahmedulla Khan', escalationPhone: '050 369 7668', escalationEmail: 'ahmedulla.k@nbf.ae', directSubmissionAllowed: true },
  { bank: 'NBF', desk: 'Direct', rmName: 'Jijo Thomas', phone: '056 865 0815', email: 'xjijothomas@nbf.ae', escalationName: 'Haider Mohammad Khan', escalationEmail: 'xmohammad@nbf.ae', directSubmissionAllowed: true },
  { bank: 'NBF', desk: 'Direct', rmName: 'Mahesh Madhavankutty Nair', phone: '056 206 9013', email: 'xmaheshnair@nbf.ae', directSubmissionAllowed: true },
  { bank: 'NBF', desk: 'Direct', rmName: 'Eman Eldefrawy', phone: '052 170 8600', email: 'xemaneldefrawy@nbf.ae', directSubmissionAllowed: true },
  { bank: 'NBF', desk: 'Direct', rmName: 'Asad Nazir', phone: '055 210 5454', email: 'xasad@nbf.ae', directSubmissionAllowed: true },
  { bank: 'NBF', desk: 'Direct', rmName: 'Ram Bahadur', phone: '055 550 5635', email: 'xrambahadur@nbf.ae', directSubmissionAllowed: true },
  { bank: 'NBF', desk: 'Direct', rmName: 'Thahzeen Razack', phone: '056 750 5630', email: 'xThahzeenCR@nbf.ae', directSubmissionAllowed: true },
  { bank: 'NBF', desk: 'Direct', rmName: 'Hamad', phone: '052 161 4661', email: 'xHamad@nbf.ae', directSubmissionAllowed: true },
  { bank: 'NBF', desk: 'Direct', rmName: 'Shirish Shankar Bada', phone: '058 846 1020', email: 'xShirish@nbf.ae', directSubmissionAllowed: true },
  { bank: 'NBF', desk: 'Direct', rmName: 'Mohamed Zaid Ramzeen', phone: '052 730 2939', email: 'xmohamedramzeen@nbf.ae', directSubmissionAllowed: true },
  { bank: 'NBF', desk: 'Direct', rmName: 'Andrew Gawargy', phone: '055 896 7260', email: 'xandrewgawargy@nbf.ae', directSubmissionAllowed: true },
  { bank: 'NBF', desk: 'Direct', rmName: 'Harendra Gaardi', phone: '055 996 6473', email: 'xHarendra@nbf.ae', directSubmissionAllowed: true },
  // UAB
  { bank: 'UAB', desk: 'Direct', rmName: 'Hozefa Jambusarwala', phone: '055 800 9573', email: 'hozefa.jambusarwala@uab.ae', directSubmissionAllowed: true },
  { bank: 'UAB', desk: 'Direct', rmName: 'Murtaza Ali', phone: '050 168 1030', email: 'murtaza.ali@uab.ae', directSubmissionAllowed: true },
  // SCB
  { bank: 'SCB', desk: 'Dubai', rmName: 'Shahnawaz Akhtar', phone: '052 912 4959', email: 'shahnawaz.akhtar@sc.com', escalationName: 'Ahmed Ibrahim', escalationEmail: 'ahmed.ibrahim@sc.com', directSubmissionAllowed: true },
  { bank: 'SCB', desk: 'Dubai', rmName: 'Shivam Dubey', phone: '052 935 9962', email: 'shivam.dubey@sc.com', escalationName: 'Ayesha Al Mansoori', escalationEmail: 'Ayesha.AlMansoori@sc.com', directSubmissionAllowed: true },
  { bank: 'SCB', desk: 'Dubai', rmName: 'Saurabh Kumar', phone: '055 900 6423', email: 'Saurabh.Kumar4@sc.com', directSubmissionAllowed: true },
  { bank: 'SCB', desk: 'Dubai', rmName: 'Baker Abusara', phone: '050 853 9522', email: 'bakermahmoud.abusara@sc.com', directSubmissionAllowed: true },
  { bank: 'SCB', desk: 'Dubai', rmName: 'Mohammed Asif Sajjad', phone: '055 623 4385', email: 'MohammedAsif.Sajjad@sc.com', directSubmissionAllowed: true },
  { bank: 'SCB', desk: 'Dubai', rmName: 'Olena Kalych', phone: '055 802 9013', email: 'olena.kalych@sc.com', directSubmissionAllowed: true },
  { bank: 'SCB', desk: 'Dubai', rmName: 'Hussein Bani Ata', phone: '050 862 7373', email: 'Hussein.BaniAta@sc.com', directSubmissionAllowed: true },
  // FAB
  { bank: 'FAB', desk: 'Retail Submission', rmName: 'Hoomam Saleh', phone: '052 596 2234', email: 'Hoomam.saleh@bankfab.com', directSubmissionAllowed: true },
  { bank: 'FAB', desk: 'Retail', rmName: 'Vishal Vij', phone: '050 654 3924', email: 'vishal.vij@bankfab.com', escalationName: 'Hoomam Saleh', escalationPhone: '052 596 2234', directSubmissionAllowed: true },
  { bank: 'FAB', desk: 'Retail', rmName: 'Ismail Kolathur', phone: '055 927 5575', email: 'Ismail.Kolathur@bankfab.com', directSubmissionAllowed: true },
  { bank: 'FAB', desk: 'Retail', rmName: 'Tatyan Fakhry', phone: '052 865 1185', email: 'tatyan.fakhryyounes@bankfab.com', directSubmissionAllowed: true },
  { bank: 'FAB', desk: 'Retail', rmName: 'Alaa Adribi', phone: '050 850 0379', email: 'alaa.aldribi@bankfab.com', directSubmissionAllowed: true },
  { bank: 'FAB', desk: 'Retail', rmName: 'Osama Hasanain', phone: '054 386 1763', email: 'Osama.Hassanien@bankfab.com', directSubmissionAllowed: true },
  { bank: 'FAB', desk: 'Retail', rmName: 'Davood Abduljabbar', phone: '050 461 9500', email: 'davood.abduljabbar@bankfab.com', directSubmissionAllowed: true },
  { bank: 'FAB', desk: 'CMS Commercial', rmName: 'Boby George', phone: '050 212 9893', email: 'boby.george@bankfab.com', escalationEmail: 'CMBReferral@bankfab.com', directSubmissionAllowed: true },
  { bank: 'FAB', desk: 'CMS Commercial', rmName: 'Savio Bento Remedios', phone: '050 287 1182', email: 'savio.remedios@bankfab.com', directSubmissionAllowed: true },
  { bank: 'FAB', desk: 'CMS Commercial', rmName: 'Ajaz Shaikh', phone: '055 885 2765', email: 'ajaz.shaikh@bankfab.com', directSubmissionAllowed: true },
  { bank: 'FAB', desk: 'CMS Commercial', rmName: 'Mohamad Haj Hassan', phone: '050 312 5908', email: 'mohamad.hassan@bankfab.com', directSubmissionAllowed: true },
  { bank: 'FAB', desk: 'CMS Commercial', rmName: 'Saeed Shaikh', phone: '', email: 'Saeed.Shaikh@bankfab.com', directSubmissionAllowed: true },
  // Bank of Baroda
  { bank: 'Bank of Baroda', desk: 'Dubai Credit', rmName: 'Veda A. Jadye (Commercial)', phone: '050 858 1807', email: 'credit.deira@bankofbaroda-uae.ae', directSubmissionAllowed: true },
  { bank: 'Bank of Baroda', desk: 'Dubai Retail', rmName: 'Praveen (Retail)', phone: '055 831 8860', email: 'credit.deira@bankofbaroda-uae.ae', directSubmissionAllowed: true },
  { bank: 'Bank of Baroda', desk: 'Dubai Retail', rmName: 'Vikas Ranjan (Retail)', phone: '050 789 0165', email: 'credit.deira@bankofbaroda-uae.ae', directSubmissionAllowed: true },
  { bank: 'Bank of Baroda', desk: 'Sharjah', rmName: 'Ankur Datta', phone: '050 742 1977', email: 'credit.sharjah@bankofbaroda-uae.ae', directSubmissionAllowed: true },
  { bank: 'Bank of Baroda', desk: 'RAK', rmName: 'Kushal Jain', phone: '050 867 7682', email: 'rasal@bankofbaroda-uae.ae', directSubmissionAllowed: true },
  // RAKBANK
  { bank: 'RAKBANK', desk: 'All Submissions', rmName: 'RAK Mortgage Referrals', phone: '', email: 'mortgagereferrals@rakbank.ae', escalationName: 'Sunil Tekchandani', escalationPhone: '050 954 9533', escalationEmail: 'sunil.tekchandani@rakbank.ae', directSubmissionAllowed: true },
  { bank: 'RAKBANK', desk: 'Retail', rmName: 'Santunu Barua', phone: '052 248 4030', email: 'Santunu.Barua@rakbank.ae', directSubmissionAllowed: true },
  { bank: 'RAKBANK', desk: 'Retail', rmName: 'Burhan Athar', phone: '055 441 2206', email: 'Burhan.Athar@rakbank.ae', directSubmissionAllowed: true },
  { bank: 'RAKBANK', desk: 'Retail', rmName: 'Ashita Dhakan', phone: '055 313 7683', email: 'Ashita.Dhakan@rakbank.ae', directSubmissionAllowed: true },
  { bank: 'RAKBANK', desk: 'Retail', rmName: 'Suraj Madathipadath', phone: '050 230 7330', email: 'suraj.m@rakbank.ae', directSubmissionAllowed: true },
  { bank: 'RAKBANK', desk: 'Retail', rmName: 'Shashank Shetty', phone: '050 485 7842', email: 'shashank.shetty@rakbank.ae', directSubmissionAllowed: true },
  { bank: 'RAKBANK', desk: 'Retail', rmName: 'Hemant Arjunsingh Thakur', phone: '055 573 2988', email: 'Hemant.Thakur@rakbank.ae', directSubmissionAllowed: true },
  { bank: 'RAKBANK', desk: 'Retail', rmName: 'Rakhil Bhaskaran Nair', phone: '055 452 6064', email: 'Rakhil.N@rakbank.ae', directSubmissionAllowed: true },
  { bank: 'RAKBANK', desk: 'Retail', rmName: 'Puneet Malik', phone: '', email: 'Puneet.Malik@rakbank.ae', directSubmissionAllowed: true },
  { bank: 'RAKBANK', desk: 'Commercial', rmName: 'Basel Rashad', phone: '054 446 8008', email: 'basel.barakat@rakbank.ae', escalationName: 'Jyoti Ranjan', escalationPhone: '050 292 7257', escalationEmail: 'jyoti.ranjan@rakbank.ae', directSubmissionAllowed: true },
  { bank: 'RAKBANK', desk: 'Commercial', rmName: 'Badusha Abdulsalam', phone: '056 152 2840', email: 'Badusha.Abdulsalam@rakbank.ae', directSubmissionAllowed: true },
  { bank: 'RAKBANK', desk: 'Commercial', rmName: 'Noel Jackson Airan', phone: '050 707 8680', email: 'noel.jackson@rakbank.ae', directSubmissionAllowed: true },
  // Al Hilal Bank
  { bank: 'Al Hilal Bank', desk: 'Direct', rmName: 'Ahmed Elmasry', phone: '056 187 4756', email: 'aelmasry@alhilalbank.ae', escalationName: 'Nada Razzouk', escalationPhone: '055 828 9999', escalationEmail: 'nrazzouk@alhilalbank.ae', directSubmissionAllowed: true },
  { bank: 'Al Hilal Bank', desk: 'Direct', rmName: 'Hany Mohamed', phone: '', email: 'hmohamed@alhilalbank.ae', directSubmissionAllowed: true },
  { bank: 'Al Hilal Bank', desk: 'Direct', rmName: 'Marleen Rizk', phone: '050 311 1347', email: 'mrisk@alhilalbank.ae', directSubmissionAllowed: true },
  { bank: 'Al Hilal Bank', desk: 'Direct', rmName: 'Puja Bharti', phone: '058 553 1007', email: 'pbharti@alhilalbank.ae', escalationName: 'Easa Shamsi', escalationEmail: 'ealshamsi@alhilalbank.ae', directSubmissionAllowed: true },
  // Sharjah Islamic Bank
  { bank: 'Sharjah Islamic Bank', desk: 'Case Submission', rmName: 'Abdalla Ibrahim', phone: '', email: 'abdalla.ibrahim@sib.ae', directSubmissionAllowed: true },
  { bank: 'Sharjah Islamic Bank', desk: 'CC Support', rmName: 'Said Ibrahim', phone: '055 423 0888', email: 'said.ibrahim.ext@sib.ae', directSubmissionAllowed: true },
  { bank: 'Sharjah Islamic Bank', desk: 'CC Support', rmName: 'Waseem Jan', phone: '055 723 6059', email: 'waseem.mir.ext@sib.ae', directSubmissionAllowed: true },
];

export const PROPOSAL_DOCUMENT_CHECKLISTS: Record<string, string[]> = {
  Salaried: [
    '1. Passport copy (clear color scan)',
    '2. UAE Residence Visa copy',
    '3. Emirates ID (Front & Back copies)',
    '4. Recent dated Salary Certificate (within 30 days)',
    '5. Last 6 months Payslips (if variable pay/allowances)',
    '6. Last 6 months Personal Bank Statements (e-statements)',
  ],
  'Self Employed (Full Doc)': [
    '1. Passport copy',
    '2. UAE Residence Visa page',
    '3. Emirates ID (Front & Back)',
    '4. Trade License (all pages)',
    '5. MOA and Amendments / Share Certificate',
    '6. Latest 6 months Personal Bank Statements',
    '7. Latest 6–12 months Company Bank Statements (All Banks)',
    '8. Last 2 years Audited Financial Reports (Bank-approved auditor)',
    '9. UAE VAT Registration Certificate',
    '10. Last 4 Quarters FTA VAT Returns',
    '11. Commercial Office Lease / Registered Business Address Proof',
    '12. AECB Credit Report (Individual & Company)',
  ],
  'Self Employed (Low Doc)': [
    '1. Passport copy',
    '2. UAE Residence Visa page',
    '3. Emirates ID (Front & Back)',
    '4. Trade License (all pages)',
    '5. MOA and Amendments (if any)',
    '6. Latest 6 months Personal Bank Statements (min 25k–50k avg bal)',
    '7. VAT Certificate (optional for < 60% LTV)',
    '8. Registered Office Address Proof',
    '9. AECB Credit Report',
  ],
  'Non-Resident (Salaried)': [
    '1. Passport copy (all pages)',
    '2. Home Country National ID copy',
    '3. Latest 6 months Personal Bank Statements in English (All Accounts)',
    '4. Latest Salary Certificate',
    '5. Last 6 months Payslips (English)',
    '6. Latest Utility Bill / Proof of Residence',
    '7. Recent Home Country Credit Bureau Report (valid within 30 days)',
  ],
  'Non-Resident (Self Employed)': [
    '1. Passport copy (all pages)',
    '2. Home Country National ID copy',
    '3. Latest 6 months Personal Bank Statements in English (All Accounts)',
    '4. Company Incorporation Certificate & Shareholding Proof',
    '5. Latest Utility Bill / Proof of Residence',
    '6. Recent Home Country Credit Bureau Report',
    '7. Company Website & Corporate Profile',
  ],
};

export const CREDIT_ANALYST_STATEMENT_CHECKLIST = [
  'Opening & Closing Balance match across all months',
  'Inward Cheque Return check (zero recent bounces)',
  'Inter-Account & Related-Party transfers excluded from CTO',
  'Regular Debit & Hidden Liability check (auto-loans, credit cards)',
  'Minimum & Average Daily Balance stability check',
  'Client / Revenue Concentration Risk check',
  'Valid Authentic e-Statement / Bank Stamp verification',
] as const;

export interface AmortizationRow {
  month: number;
  ratePct: number;
  emiAed: number;
  lifeInsuranceAed: number;
  totalMonthlyAed: number;
  interestAed: number;
  principalAed: number;
  closingBalanceAed: number;
}

export interface ProposalOptionSummary {
  bankCode: string;
  bankName: string;
  fixedRatePct: number;
  fixedMonths: number;
  variableRatePct: number;
  lifeInsurancePaPct: number;
  fixedPeriodEmiAed: number;
  fixedPeriodTotalMonthlyAed: number;
  postFixedEmiAed: number;
  totalInterestAed: number;
  totalLifeInsuranceAed: number;
  valuationFeeAed: number;
  processingFeeEstAed: number;
  dldTransferFeeAed: number;
  dldMortgageRegAed: number;
  downPaymentAed: number;
  cashToCloseAed: number;
  personalLoanMonthlyAed: number;
  combinedMonthlyWithPLoanAed: number;
  schedulePreview: AmortizationRow[];
}

export function calculateProposalOption(input: {
  bankCode: string;
  propertyValueAed: number;
  loanAmountAed: number;
  tenorMonths: number;
  fixedRatePct: number;
  fixedMonths: number;
  variableRatePct: number;
  lifeInsurancePaPct: number;
  processingFeePct: number;
  valuationFeeAed: number;
  personalLoanAmountAed?: number;
  personalLoanMonths?: number;
  lumpSumAtMonth12Aed?: number;
}): ProposalOptionSummary {
  const bank = UAE_BANK_POLICIES.find((b) => b.code === input.bankCode);
  const loan = Math.max(0, input.loanAmountAed);
  const tenor = Math.max(12, Math.min(300, Math.round(input.tenorMonths || 300)));
  const fixedM = Math.max(0, Math.min(tenor, Math.round(input.fixedMonths || 36)));

  const pmt = (principal: number, annualPct: number, months: number) => {
    if (principal <= 0 || months <= 0) return 0;
    const r = annualPct / 100 / 12;
    if (r <= 0) return principal / months;
    return (principal * (r * Math.pow(1 + r, months))) / (Math.pow(1 + r, months) - 1);
  };

  let balance = loan;
  let totalInterest = 0;
  let totalLifeIns = 0;
  let fixedEmi = pmt(loan, input.fixedRatePct, tenor);
  let postFixedEmi = fixedEmi;
  const schedulePreview: AmortizationRow[] = [];

  for (let m = 1; m <= tenor; m++) {
    const isFixed = m <= fixedM;
    const ratePct = isFixed ? input.fixedRatePct : input.variableRatePct;
    if (m === fixedM + 1 && balance > 0) {
      postFixedEmi = pmt(balance, input.variableRatePct, tenor - fixedM);
    }
    const emi = isFixed ? fixedEmi : postFixedEmi;
    const r = ratePct / 100 / 12;
    const interest = balance * r;
    const principal = Math.min(balance, Math.max(0, emi - interest));
    const lifeIns = (balance * (input.lifeInsurancePaPct / 100)) / 12;
    balance = Math.max(0, balance - principal);

    if (m === 12 && (input.lumpSumAtMonth12Aed ?? 0) > 0 && balance > 0) {
      balance = Math.max(0, balance - (input.lumpSumAtMonth12Aed ?? 0));
      if (m < fixedM) fixedEmi = pmt(balance, input.fixedRatePct, tenor - m);
    }

    totalInterest += interest;
    totalLifeIns += lifeIns;

    if (m <= 12 || m === fixedM || m === fixedM + 1 || m === 60 || m === 120 || m === tenor) {
      schedulePreview.push({
        month: m,
        ratePct,
        emiAed: Math.round(emi),
        lifeInsuranceAed: Math.round(lifeIns),
        totalMonthlyAed: Math.round(emi + lifeIns),
        interestAed: Math.round(interest),
        principalAed: Math.round(principal),
        closingBalanceAed: Math.round(balance),
      });
    }
  }

  const downPaymentAed = Math.max(0, input.propertyValueAed - loan);
  const dldTransferFeeAed = Math.round(input.propertyValueAed * 0.04 + 580);
  const dldMortgageRegAed = Math.round(loan * 0.0025 + 290);
  const processingFeeEstAed = Math.round(loan * (input.processingFeePct / 100) * 1.05);
  const cashToCloseAed = downPaymentAed + dldTransferFeeAed + dldMortgageRegAed + processingFeeEstAed + input.valuationFeeAed;

  const pLoanAmt = Math.max(0, input.personalLoanAmountAed ?? 0);
  const pLoanM = Math.max(12, input.personalLoanMonths ?? 48);
  const personalLoanMonthlyAed = pLoanAmt > 0 ? Math.round(pmt(pLoanAmt, 5.99, pLoanM)) : 0;
  const month1Life = Math.round((loan * (input.lifeInsurancePaPct / 100)) / 12);
  const fixedTotal = Math.round(pmt(loan, input.fixedRatePct, tenor) + month1Life);

  return {
    bankCode: input.bankCode,
    bankName: bank?.name || input.bankCode,
    fixedRatePct: input.fixedRatePct,
    fixedMonths: fixedM,
    variableRatePct: input.variableRatePct,
    lifeInsurancePaPct: input.lifeInsurancePaPct,
    fixedPeriodEmiAed: Math.round(pmt(loan, input.fixedRatePct, tenor)),
    fixedPeriodTotalMonthlyAed: fixedTotal,
    postFixedEmiAed: Math.round(postFixedEmi),
    totalInterestAed: Math.round(totalInterest),
    totalLifeInsuranceAed: Math.round(totalLifeIns),
    valuationFeeAed: input.valuationFeeAed,
    processingFeeEstAed,
    dldTransferFeeAed,
    dldMortgageRegAed,
    downPaymentAed,
    cashToCloseAed,
    personalLoanMonthlyAed,
    combinedMonthlyWithPLoanAed: fixedTotal + personalLoanMonthlyAed,
    schedulePreview,
  };
}

export interface BankMatchResult {
  bank: BankPolicyRecord;
  verdict: 'Eligible' | 'Borderline' | 'Ineligible';
  maxAllowedLtvPct: number;
  maxLoanForPropertyAed: number;
  estimatedMonthlyEmiAed: number;
  stressedDbrPct: number;
  reasons: string[];
}

/** 60-Second Multi-Bank Eligibility Matcher (Holo / Prypco Competitor Feature) */
export function evaluateAllBanksEligibility(params: {
  monthlyIncomeAed: number;
  propertyValueAed: number;
  existingEmisAed: number;
  creditCardLimitsAed: number;
  residency: 'uae_national' | 'expat_resident' | 'non_resident';
  employment: 'salaried' | 'self_employed';
  preference: 'all' | 'islamic' | 'conventional';
  tenorYears: number;
}): BankMatchResult[] {
  const months = Math.max(60, Math.min(300, params.tenorYears * 12));
  return UAE_BANK_POLICIES.filter((b) => {
    if (params.preference === 'islamic') return b.loanType.includes('Islamic');
    if (params.preference === 'conventional') return b.loanType.includes('Conventional');
    return true;
  })
    .map((bank) => {
      const reasons: string[] = [];
      let score = 2; // 2=Eligible, 1=Borderline, 0=Ineligible

      const maxLtv =
        params.residency === 'uae_national'
          ? bank.maxLtvLocalPct
          : params.residency === 'non_resident'
            ? bank.maxLtvNonResPct
            : bank.maxLtvExpatPct;

      if (params.residency === 'non_resident' && (!bank.nonResidentSupported || maxLtv <= 0)) {
        score = 0;
        reasons.push('Does not offer Non-Resident program');
      }

      const minSal = params.residency === 'uae_national' ? bank.minSalaryLocalAed : bank.minSalaryExpatAed;
      if (params.monthlyIncomeAed < minSal) {
        score = 0;
        reasons.push(`Needs min AED ${minSal.toLocaleString()} monthly income`);
      }

      if (params.employment === 'self_employed' && bank.selfEmployedFriendly === 'Strict') {
        score = Math.min(score, 1);
        reasons.push('Strict self-employed underwriting (2y audit required)');
      }

      const maxLoan = Math.min(Math.round((params.propertyValueAed * maxLtv) / 100), bank.maxLoanAed);
      if (maxLoan < bank.minLoanAed) {
        score = 0;
        reasons.push(`Below bank min loan AED ${bank.minLoanAed.toLocaleString()}`);
      }

      const rate = bank.indicativeBestRatePct;
      const r = rate / 100 / 12;
      const emi = maxLoan > 0 ? Math.round((maxLoan * (r * Math.pow(1 + r, months))) / (Math.pow(1 + r, months) - 1)) : 0;

      // Stress rate (+2% CBUAE buffer) & DIB 2% CC vs standard 5% CC rule
      const stressR = (rate + 2) / 100 / 12;
      const stressedEmi =
        maxLoan > 0 ? (maxLoan * (stressR * Math.pow(1 + stressR, months))) / (Math.pow(1 + stressR, months) - 1) : 0;
      const ccFactor = bank.code === 'DIB' ? 0.02 : 0.05;
      const totalDebt = params.existingEmisAed + params.creditCardLimitsAed * ccFactor + stressedEmi;
      const dbrPct = params.monthlyIncomeAed > 0 ? Number(((totalDebt / params.monthlyIncomeAed) * 100).toFixed(1)) : 100;

      if (dbrPct > 50) {
        score = Math.min(score, 1);
        reasons.push(`Stressed DBR ${dbrPct}% > 50% (reduce loan or CC limits)`);
      }
      if (reasons.length === 0) {
        reasons.push(bank.fastPass14Day ? `Fast-Pass (~${bank.totalTatDays}d TAT) · ${bank.stlFixedSummary}` : bank.stlFixedSummary);
      }

      return {
        bank,
        verdict: (score === 2 ? 'Eligible' : score === 1 ? 'Borderline' : 'Ineligible') as BankMatchResult['verdict'],
        maxAllowedLtvPct: maxLtv,
        maxLoanForPropertyAed: maxLoan,
        estimatedMonthlyEmiAed: emi,
        stressedDbrPct: dbrPct,
        reasons,
      };
    })
    .sort((a, b) => {
      const rank = { Eligible: 0, Borderline: 1, Ineligible: 2 };
      if (rank[a.verdict] !== rank[b.verdict]) return rank[a.verdict] - rank[b.verdict];
      return a.bank.indicativeBestRatePct - b.bank.indicativeBestRatePct;
    });
}

/** Instant Grounded AI Bank Policy Finder over all 18 UAE Banks + 140+ RMs */
export function answerBankPolicyQuery(question: string): {
  headline: string;
  matchedBanks: Array<{ bank: string; highlight: string; rmContact?: string }>;
} {
  const q = question.toLowerCase().trim();
  const findRm = (short: string) => {
    const rm = UAE_BANK_RMS.find((r) => r.bank.toLowerCase().includes(short.toLowerCase()) && r.directSubmissionAllowed);
    return rm ? `${rm.rmName}${rm.phone ? ` (${rm.phone})` : ''} · ${rm.email}` : undefined;
  };

  if (q.includes('non-resident') || q.includes('non resident') || q.includes('overseas')) {
    const list = UAE_BANK_POLICIES.filter((b) => b.nonResidentSupported);
    return {
      headline: `${list.length} UAE banks accept Non-Resident mortgages (up to 60% LTV):`,
      matchedBanks: list.map((b) => ({
        bank: `${b.name} (${b.maxLtvNonResPct}% LTV)`,
        highlight: `${b.nonResidentFixedSummary} · Val: ${b.valuationFee}`,
        rmContact: findRm(b.short),
      })),
    };
  }
  if (q.includes('airline') || q.includes('emirates') || q.includes('etihad') || q.includes('pilot') || q.includes('cabin')) {
    return {
      headline: 'Best UAE banks for Emirates / Etihad Airline pilots & staff:',
      matchedBanks: UAE_BANK_POLICIES.filter((b) => b.airlineRule.toLowerCase().includes('airline') || b.airlineRule.toLowerCase().includes('emirates')).map((b) => ({
        bank: b.name,
        highlight: b.airlineRule,
        rmContact: findRm(b.short),
      })),
    };
  }
  if (q.includes('life insurance') || q.includes('optional') || q.includes('free property')) {
    return {
      headline: 'Lowest / Optional Life & Free Property Insurance banks:',
      matchedBanks: [...UAE_BANK_POLICIES]
        .sort((a, b) => a.lifeInsurancePaPct - b.lifeInsurancePaPct)
        .slice(0, 6)
        .map((b) => ({
          bank: `${b.name} (Life ${b.lifeInsurancePaPct}%)`,
          highlight: `Life: ${b.lifeInsuranceNote} · Property: ${b.propertyInsuranceNote}`,
          rmContact: findRm(b.short),
        })),
    };
  }
  if (q.includes('partial') || q.includes('30%') || q.includes('prepay') || q.includes('early')) {
    return {
      headline: 'Best Free Annual Partial Settlement & Early Exit policies:',
      matchedBanks: UAE_BANK_POLICIES.filter((b) => b.partialSettlement.includes('25%') || b.partialSettlement.includes('30%') || b.partialSettlement.includes('20%')).map((b) => ({
        bank: b.name,
        highlight: `Partial: ${b.partialSettlement} · Full Exit: ${b.earlySettlement}`,
        rmContact: findRm(b.short),
      })),
    };
  }
  if (q.includes('self employed') || q.includes('self-employed') || q.includes('low doc') || q.includes('audit') || q.includes('1 year')) {
    return {
      headline: 'Top Self-Employed & Low-Doc friendly UAE banks:',
      matchedBanks: UAE_BANK_POLICIES.filter((b) => b.selfEmployedFriendly === 'Yes' || b.selfEmployedFriendly === 'Low-Doc 60%').map((b) => ({
        bank: `${b.name} (${b.selfEmployedFriendly})`,
        highlight: `${b.selfEmployedFixedSummary} · ${b.keyNotes}`,
        rmContact: findRm(b.short),
      })),
    };
  }
  if (q.includes('fast') || q.includes('quick') || q.includes('tat') || q.includes('urgent')) {
    return {
      headline: 'Fastest Disbursal TAT UAE Banks (Fast-Pass 11–15 working days):',
      matchedBanks: [...UAE_BANK_POLICIES]
        .sort((a, b) => a.totalTatDays - b.totalTatDays)
        .slice(0, 6)
        .map((b) => ({
          bank: `${b.name} (~${b.totalTatDays} days)`,
          highlight: `PA ${b.paTatDays}d · Val ${b.valuationTatDays}d · FOL ${b.folTatDays}d · ${b.stlFixedSummary}`,
          rmContact: findRm(b.short),
        })),
    };
  }
  if (q.includes('rental') || q.includes('rent')) {
    return {
      headline: 'Rental income inclusion policies across UAE banks:',
      matchedBanks: UAE_BANK_POLICIES.slice(0, 8).map((b) => ({
        bank: b.name,
        highlight: b.rentalIncomeRule,
        rmContact: findRm(b.short),
      })),
    };
  }

  // Generic keyword search across all 18 banks
  const hits = UAE_BANK_POLICIES.filter((b) =>
    `${b.name} ${b.short} ${b.loanType} ${b.stlFixedSummary} ${b.keyNotes} ${b.equityReleaseSummary} ${b.emirates}`
      .toLowerCase()
      .includes(q),
  );
  const chosen = hits.length > 0 ? hits : UAE_BANK_POLICIES.slice(0, 6);
  return {
    headline: hits.length > 0 ? `Found ${hits.length} matching UAE bank policy rules:` : 'Top lowest-rate UAE banks right now:',
    matchedBanks: chosen.slice(0, 8).map((b) => ({
      bank: `${b.name} (${b.indicativeBestRatePct}% from)`,
      highlight: `${b.stlFixedSummary} · ${b.keyNotes}`,
      rmContact: findRm(b.short),
    })),
  };
}

/** Credit Card Limit Reduction Impact on CBUAE 5% DBR Liability */
export function computeCreditCardDbrImpact(
  cards: Array<{ bank: string; oldLimitAed: number; newLimitAed: number }>,
) {
  const oldTotal = cards.reduce((s, c) => s + Math.max(0, Number(c.oldLimitAed || 0)), 0);
  const newTotal = cards.reduce((s, c) => s + Math.max(0, Number(c.newLimitAed || 0)), 0);
  const limitReduced = Math.max(0, oldTotal - newTotal);
  const monthlyDbrFreedAed = Math.round(limitReduced * 0.05);
  // Roughly AED 1,000/mo freed EMI unlocks ~AED 170,000 extra 25y mortgage capacity at 4.5%
  const extraMortgageCapacityAed = Math.round(monthlyDbrFreedAed * 170);
  return { oldTotal, newTotal, limitReduced, monthlyDbrFreedAed, extraMortgageCapacityAed };
}
