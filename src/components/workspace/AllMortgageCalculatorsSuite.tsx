'use client';

import React, { useMemo, useState } from 'react';
import {
  Activity,
  Award,
  Building2,
  Calculator,
  CheckCircle2,
  Copy,
  CreditCard,
  DollarSign,
  Home,
  Landmark,
  Percent,
  PiggyBank,
  Printer,
  RefreshCw,
  Scale,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { useOs } from '@/components/os/OsProvider';
import { fmtAed, GlossyBlackCard, StatusPill } from '@/components/os/UiKit';
import { calculateCbuaeEligibility } from '@/lib/domain/cbuae-math';
import { computeCreditCardDbrImpact } from '@/lib/domain/bank-intelligence';
import { EIBOR_SNAPSHOT } from '@/lib/domain/banks';
import {
  AED_FX_RATES,
  calcAdvisorTools,
  calcAmortizationSummary,
  calcBuyoutAndEquityRelease,
  calcBuyToLetYieldAndDscr,
  calcEiborRateShock,
  calcPrepaymentSavings,
  calcRentVsBuyDubai,
  calcUpfrontCashToClose,
  type UaeEmirate,
} from '@/lib/domain/uae-calculators';

type CalcToolId =
  | 'emi'
  | 'dbr'
  | 'cash'
  | 'buyout'
  | 'prepay'
  | 'rentbuy'
  | 'offplan'
  | 'yield'
  | 'shock'
  | 'cc'
  | 'advisor'
  | 'fx';

const CALC_TABS: Array<{ id: CalcToolId; label: string; tag: string; icon: React.ComponentType<{ size?: number; className?: string }> }> = [
  { id: 'emi', label: '1. EMI & Amortization', tag: 'Fixed → Var', icon: Calculator },
  { id: 'dbr', label: '2. CBUAE 50% DBR', tag: 'Max Loan', icon: ShieldCheck },
  { id: 'cash', label: '3. DLD & Cash-to-Close', tag: '4 Emirates', icon: Building2 },
  { id: 'buyout', label: '4. Buyout & Equity', tag: '1% Cap', icon: RefreshCw },
  { id: 'prepay', label: '5. Prepayment Saver', tag: '20-30% Free', icon: PiggyBank },
  { id: 'rentbuy', label: '6. Rent vs Buy Dubai', tag: 'Break-Even', icon: Home },
  { id: 'offplan', label: '7. Off-Plan vs Ready', tag: '50% vs 80%', icon: Scale },
  { id: 'yield', label: '8. Rental Yield & DSCR', tag: 'Buy-to-Let', icon: TrendingUp },
  { id: 'shock', label: '9. EIBOR Rate Shock', tag: 'Stress Test', icon: Activity },
  { id: 'cc', label: '10. CC Limit Optimizer', tag: '5% Rule', icon: CreditCard },
  { id: 'advisor', label: '11. DSA, Golden Visa & Age', tag: 'Advisor Pro', icon: Award },
  { id: 'fx', label: '12. Multi-Currency FX', tag: 'AED / USD', icon: DollarSign },
];

export function AllMortgageCalculatorsSuite() {
  const { toast } = useOs();
  const [active, setActive] = useState<CalcToolId>('emi');

  // 1. EMI & Amortization
  const [emiIn, setEmiIn] = useState({
    propertyPriceAed: 3_200_000,
    ltvPct: 80,
    fixedRatePct: 3.89,
    fixedYears: 3,
    reversionRatePct: 5.95,
    tenureYears: 25,
    lifeInsAnnualPct: 0.21,
    propInsAnnualPct: 0.04,
  });

  // 2. DBR & Max Borrowing
  const [dbrIn, setDbrIn] = useState({
    propertyPriceAed: 3_500_000,
    monthlyIncomeAed: 42_000,
    annualBonusAed: 60_000,
    annualRentIncomeAed: 120_000,
    existingEmisAed: 2_000,
    creditCardLimitsAed: 50_000,
    residency: 'expat_resident' as 'uae_national' | 'expat_resident' | 'non_resident',
    borrowerProfile: 'salaried' as 'salaried' | 'self_employed_full' | 'self_employed_low_doc' | 'non_resident',
    ageYears: 35,
    isFirstHome: true,
    interestRatePct: 3.99,
  });

  // 3. Upfront Cash-to-Close
  const [cashIn, setCashIn] = useState({
    emirate: 'Dubai (DLD)' as UaeEmirate,
    propertyPriceAed: 3_000_000,
    ltvPct: 80,
    processingFeePct: 0.5,
    valuationFeeAed: 3150,
    agencyFeePct: 2,
    feeFinancePct: 0,
  });

  // 4. Buyout & Equity Release
  const [buyoutIn, setBuyoutIn] = useState({
    currentBalanceAed: 2_200_000,
    currentRatePct: 6.15,
    remainingYears: 20,
    newRatePct: 3.89,
    newTenureYears: 20,
    equityReleaseAed: 250_000,
    valuationFeeAed: 2625,
    newProcessingFeePct: 0,
  });

  // 5. Partial Prepayment
  const [prepayIn, setPrepayIn] = useState({
    loanAed: 2_500_000,
    annualRatePct: 4.19,
    tenureYears: 25,
    annualExtraPaymentAed: 100_000,
    oneTimeLumpSumAed: 200_000,
    lumpSumYear: 2,
  });

  // 6. Rent vs Buy Dubai
  const [rvbIn, setRvbIn] = useState({
    annualRentAed: 175_000,
    annualRentGrowthPct: 5,
    propertyPriceAed: 2_600_000,
    ltvPct: 80,
    interestRatePct: 3.99,
    tenureYears: 25,
    annualServiceChargeAed: 24_000,
    annualAppreciationPct: 5,
    horizonYears: 7,
  });

  // 7. Off-Plan vs Ready
  const [offplanPrice, setOffplanPrice] = useState(2_500_000);
  const [offplanRate, setOffplanRate] = useState(4.99);
  const [readyRate, setReadyRate] = useState(3.89);

  // 8. Rental Yield & DSCR
  const [yieldIn, setYieldIn] = useState({
    propertyPriceAed: 2_200_000,
    annualRentAed: 165_000,
    sizeSqft: 1_250,
    serviceChargePerSqftAed: 18,
    vacancyAndMaintPct: 5,
    ltvPct: 75,
    interestRatePct: 3.99,
    tenureYears: 25,
  });

  // 9. EIBOR Rate Shock
  const [shockIn, setShockIn] = useState({
    loanAed: 2_800_000,
    tenureYears: 25,
    fixedRatePct: 3.99,
    eibor3mPct: EIBOR_SNAPSHOT.latest.threeMonth,
    bankMarginPct: 1.5,
  });

  // 10. CC Limit Optimizer
  const [ccRows, setCcRows] = useState([
    { bank: 'ENBD Visa Infinite', oldLimitAed: 80_000, newLimitAed: 20_000 },
    { bank: 'ADCB TouchPoints', oldLimitAed: 45_000, newLimitAed: 15_000 },
    { bank: 'Mashreq Solitaire', oldLimitAed: 35_000, newLimitAed: 0 },
    { bank: 'DIB Prime', oldLimitAed: 25_000, newLimitAed: 10_000 },
  ]);

  // 11. Advisor Pro (DSA + Golden Visa + Age Tenure)
  const [advIn, setAdvIn] = useState({
    propertyPriceAed: 2_500_000,
    loanAmountAed: 2_000_000,
    ageYears: 42,
    employment: 'Salaried' as 'Salaried' | 'Self-Employed',
    isUaeNational: false,
    bankDsaPct: 0.85,
    advisorSplitPct: 40,
    thirdPartySplitPct: 20,
  });

  // 12. Multi-Currency Converter
  const [fxAmountAed, setFxAmountAed] = useState(2_500_000);

  // Computed results
  const emiOut = useMemo(() => calcAmortizationSummary(emiIn), [emiIn]);
  const effectiveMonthlyIncome = Math.round(
    dbrIn.monthlyIncomeAed + (dbrIn.annualBonusAed * 0.5) / 12 + (dbrIn.annualRentIncomeAed * 0.8) / 12,
  );
  const dbrOut = useMemo(
    () => calculateCbuaeEligibility({ ...dbrIn, monthlyIncomeAed: effectiveMonthlyIncome }),
    [dbrIn, effectiveMonthlyIncome],
  );
  const cashOut = useMemo(() => calcUpfrontCashToClose(cashIn), [cashIn]);
  const buyoutOut = useMemo(() => calcBuyoutAndEquityRelease(buyoutIn), [buyoutIn]);
  const prepayOut = useMemo(() => calcPrepaymentSavings(prepayIn), [prepayIn]);
  const rvbOut = useMemo(() => calcRentVsBuyDubai(rvbIn), [rvbIn]);
  const yieldOut = useMemo(() => calcBuyToLetYieldAndDscr(yieldIn), [yieldIn]);
  const shockOut = useMemo(() => calcEiborRateShock(shockIn), [shockIn]);
  const ccOut = useMemo(() => computeCreditCardDbrImpact(ccRows), [ccRows]);
  const advOut = useMemo(() => calcAdvisorTools(advIn), [advIn]);

  const copySummary = (text: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      void navigator.clipboard.writeText(text);
    }
    toast('Client WhatsApp summary copied to clipboard!');
  };

  return (
    <div className="space-y-6">
      {/* 12-Calculator Interactive Launcher Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 no-print">
        {CALC_TABS.map((t) => {
          const Icon = t.icon;
          const isAct = active === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActive(t.id)}
              className={`p-3 rounded-2xl border text-start cursor-pointer transition flex flex-col justify-between gap-2 ${
                isAct
                  ? 'bg-[#0b192c] text-white border-[#47a88d]/60 shadow-lg ring-1 ring-[#47a88d]/40'
                  : 'bg-white dark:bg-[#0f2036] text-[var(--bw-ink)] border-[var(--bw-line)] hover:border-[#0e5a49]'
              }`}
            >
              <div className="flex items-center justify-between gap-1">
                <span
                  className={`size-7 rounded-lg flex items-center justify-center ${
                    isAct ? 'bg-[#47a88d]/20 text-[#64c4a8]' : 'bg-[var(--bw-soft)] text-[#0e5a49]'
                  }`}
                >
                  <Icon size={14} />
                </span>
                <span
                  className={`text-[9.5px] font-extrabold px-2 py-0.5 rounded-full ${
                    isAct ? 'bg-[#dfc285] text-[#0b192c]' : 'bg-[var(--bw-soft)] text-[var(--bw-muted)]'
                  }`}
                >
                  {t.tag}
                </span>
              </div>
              <div className="text-[11.5px] font-extrabold leading-tight">{t.label}</div>
            </button>
          );
        })}
      </div>

      {/* 1. EMI & FULL AMORTIZATION */}
      {active === 'emi' && (
        <div className="grid lg:grid-cols-12 gap-5">
          <div className="lg:col-span-5 bw-card p-5 space-y-4">
            <h2 className="font-display text-base font-extrabold flex items-center gap-2">
              <Calculator size={16} className="text-[#0e5a49]" /> UAE Mortgage EMI &amp; Fixed→Variable Schedule
            </h2>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <label className="col-span-2 space-y-1">
                <span className="font-bold">Property Value (AED)</span>
                <input type="number" value={emiIn.propertyPriceAed} onChange={(e) => setEmiIn({ ...emiIn, propertyPriceAed: Number(e.target.value) })} className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] font-mono-num font-bold" />
              </label>
              <label className="space-y-1">
                <span className="font-bold">LTV (%)</span>
                <input type="number" min={20} max={85} value={emiIn.ltvPct} onChange={(e) => setEmiIn({ ...emiIn, ltvPct: Number(e.target.value) })} className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] font-mono-num" />
              </label>
              <label className="space-y-1">
                <span className="font-bold">Tenure (Years)</span>
                <input type="number" min={3} max={25} value={emiIn.tenureYears} onChange={(e) => setEmiIn({ ...emiIn, tenureYears: Number(e.target.value) })} className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] font-mono-num" />
              </label>
              <label className="space-y-1">
                <span className="font-bold">Fixed Rate (%)</span>
                <input type="number" step="0.01" value={emiIn.fixedRatePct} onChange={(e) => setEmiIn({ ...emiIn, fixedRatePct: Number(e.target.value) })} className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] font-mono-num" />
              </label>
              <label className="space-y-1">
                <span className="font-bold">Fixed Period (Yrs)</span>
                <input type="number" min={0} max={7} value={emiIn.fixedYears} onChange={(e) => setEmiIn({ ...emiIn, fixedYears: Number(e.target.value) })} className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] font-mono-num" />
              </label>
              <label className="space-y-1">
                <span className="font-bold">Post-Fixed Rate (%)</span>
                <input type="number" step="0.01" value={emiIn.reversionRatePct} onChange={(e) => setEmiIn({ ...emiIn, reversionRatePct: Number(e.target.value) })} className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] font-mono-num" />
              </label>
              <label className="space-y-1">
                <span className="font-bold">Life Ins. (% p.a.)</span>
                <input type="number" step="0.01" value={emiIn.lifeInsAnnualPct} onChange={(e) => setEmiIn({ ...emiIn, lifeInsAnnualPct: Number(e.target.value) })} className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] font-mono-num" />
              </label>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() =>
                  copySummary(
                    `Betterway Mortgages Estimate:\nProperty: ${fmtAed(emiIn.propertyPriceAed)}\nLoan (${emiIn.ltvPct}% LTV): ${fmtAed(emiOut.loanAed)}\nFixed EMI (${emiIn.fixedRatePct}% for ${emiIn.fixedYears}Y): ${fmtAed(emiOut.fixedEmiAed)}/mo\nTotal Monthly (incl. Life & Property Ins): ${fmtAed(emiOut.totalMonthlyWithInsAed)}/mo\nPost-Fixed Est. EMI: ${fmtAed(emiOut.postFixedEmiAed)}/mo\nAED 0 Client Broker Fee — Betterway Mortgages LLC`,
                  )
                }
                className="bw-btn bw-btn-obsidian flex-1 text-xs"
              >
                <Copy size={13} /> Copy WhatsApp Quote
              </button>
              <button type="button" onClick={() => window.print()} className="bw-btn bw-btn-outline text-xs">
                <Printer size={13} /> Print
              </button>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <GlossyBlackCard className="p-4" accent="emerald">
                <div className="text-[10px] font-bold uppercase text-slate-400">Fixed Monthly EMI</div>
                <div className="font-display text-xl font-extrabold font-mono-num text-[#64c4a8] mt-1">{fmtAed(emiOut.fixedEmiAed)}</div>
                <div className="text-[10px] text-slate-300">Incl. Ins: {fmtAed(emiOut.totalMonthlyWithInsAed)}</div>
              </GlossyBlackCard>
              <GlossyBlackCard className="p-4" accent="gold">
                <div className="text-[10px] font-bold uppercase text-slate-400">Post-Fixed EMI</div>
                <div className="font-display text-xl font-extrabold font-mono-num text-[#dfc285] mt-1">{fmtAed(emiOut.postFixedEmiAed)}</div>
                <div className="text-[10px] text-slate-300">@ {emiIn.reversionRatePct}% reversion</div>
              </GlossyBlackCard>
              <GlossyBlackCard className="p-4" accent="dual">
                <div className="text-[10px] font-bold uppercase text-slate-400">Loan Amount</div>
                <div className="font-display text-xl font-extrabold font-mono-num text-white mt-1">{fmtAed(emiOut.loanAed, true)}</div>
                <div className="text-[10px] text-slate-300">Down: {fmtAed(emiOut.downPaymentAed, true)}</div>
              </GlossyBlackCard>
              <GlossyBlackCard className="p-4" accent="emerald">
                <div className="text-[10px] font-bold uppercase text-slate-400">Total Interest</div>
                <div className="font-display text-xl font-extrabold font-mono-num text-white mt-1">{fmtAed(emiOut.totalInterestAed, true)}</div>
                <div className="text-[10px] text-[#64c4a8]">Total: {fmtAed(emiOut.totalPayableAed, true)}</div>
              </GlossyBlackCard>
            </div>

            <div className="bw-card overflow-hidden">
              <div className="px-4 py-3 border-b border-[var(--bw-line)] font-display text-xs font-extrabold">
                Year-by-Year Amortization Schedule ({emiIn.tenureYears} Years)
              </div>
              <div className="max-h-72 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-[#0b192c] text-white text-[10px]">
                    <tr>
                      <th className="py-2 px-3 text-start">Yr</th>
                      <th className="py-2 px-3 text-center">Rate</th>
                      <th className="py-2 px-3 text-end">Monthly EMI</th>
                      <th className="py-2 px-3 text-end">Principal Paid</th>
                      <th className="py-2 px-3 text-end">Interest Paid</th>
                      <th className="py-2 px-3 text-end">Ending Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--bw-line)] font-mono-num">
                    {emiOut.yearlySchedule.map((row) => (
                      <tr key={row.year} className="hover:bg-[var(--bw-hover)]">
                        <td className="py-2 px-3 font-bold">Y{row.year}</td>
                        <td className="py-2 px-3 text-center">{row.ratePct}%</td>
                        <td className="py-2 px-3 text-end font-bold">{fmtAed(row.emiAed)}</td>
                        <td className="py-2 px-3 text-end text-[#0e5a49]">{fmtAed(row.principalPaidAed)}</td>
                        <td className="py-2 px-3 text-end text-[#7d5b1c]">{fmtAed(row.interestPaidAed)}</td>
                        <td className="py-2 px-3 text-end font-bold">{fmtAed(row.endingBalanceAed)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. CBUAE 50% DBR & MAX BORROWING */}
      {active === 'dbr' && (
        <div className="grid lg:grid-cols-12 gap-5">
          <div className="lg:col-span-6 bw-card p-5 space-y-4">
            <h2 className="font-display text-base font-extrabold flex items-center gap-2">
              <ShieldCheck size={16} className="text-[#0e5a49]" /> CBUAE 50% DBR &amp; Maximum Loan Power
            </h2>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <label className="space-y-1">
                <span className="font-bold">Fixed Monthly Salary (AED)</span>
                <input type="number" value={dbrIn.monthlyIncomeAed} onChange={(e) => setDbrIn({ ...dbrIn, monthlyIncomeAed: Number(e.target.value) })} className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] font-mono-num font-bold" />
              </label>
              <label className="space-y-1">
                <span className="font-bold">Annual Bonus (50% credited)</span>
                <input type="number" value={dbrIn.annualBonusAed} onChange={(e) => setDbrIn({ ...dbrIn, annualBonusAed: Number(e.target.value) })} className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] font-mono-num" />
              </label>
              <label className="space-y-1">
                <span className="font-bold">Annual Rental Income (80% credited)</span>
                <input type="number" value={dbrIn.annualRentIncomeAed} onChange={(e) => setDbrIn({ ...dbrIn, annualRentIncomeAed: Number(e.target.value) })} className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] font-mono-num" />
              </label>
              <label className="space-y-1">
                <span className="font-bold">Target Property Price (AED)</span>
                <input type="number" value={dbrIn.propertyPriceAed} onChange={(e) => setDbrIn({ ...dbrIn, propertyPriceAed: Number(e.target.value) })} className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] font-mono-num" />
              </label>
              <label className="space-y-1">
                <span className="font-bold">Existing Loan EMIs (AED)</span>
                <input type="number" value={dbrIn.existingEmisAed} onChange={(e) => setDbrIn({ ...dbrIn, existingEmisAed: Number(e.target.value) })} className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] font-mono-num" />
              </label>
              <label className="space-y-1">
                <span className="font-bold">Total CC Limits (5% CBUAE rule)</span>
                <input type="number" value={dbrIn.creditCardLimitsAed} onChange={(e) => setDbrIn({ ...dbrIn, creditCardLimitsAed: Number(e.target.value) })} className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] font-mono-num" />
              </label>
              <label className="space-y-1">
                <span className="font-bold">Residency</span>
                <select value={dbrIn.residency} onChange={(e) => setDbrIn({ ...dbrIn, residency: e.target.value as any })} className="w-full h-9 px-2.5 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)]">
                  <option value="expat_resident">UAE Expat Resident</option>
                  <option value="uae_national">UAE National</option>
                  <option value="non_resident">Non-Resident</option>
                </select>
              </label>
              <label className="space-y-1">
                <span className="font-bold">Borrower Age (Years)</span>
                <input type="number" min={21} max={68} value={dbrIn.ageYears} onChange={(e) => setDbrIn({ ...dbrIn, ageYears: Number(e.target.value) })} className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] font-mono-num" />
              </label>
            </div>
          </div>

          <GlossyBlackCard className="lg:col-span-6 p-6 space-y-4" accent="dual">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-base font-extrabold text-white">CBUAE Eligibility Verdict</h3>
              <StatusPill label={dbrOut.eligible ? 'CBUAE PASS (<=50% DBR)' : 'EXCEEDS 50% DBR'} tone={dbrOut.eligible ? 'emerald' : 'red'} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-white/[0.06] border border-white/10">
                <div className="text-[10px] text-slate-400 uppercase font-bold">Recognized Monthly Income</div>
                <div className="font-mono-num text-xl font-extrabold text-white mt-0.5">{fmtAed(effectiveMonthlyIncome)}</div>
              </div>
              <div className="p-3.5 rounded-xl bg-white/[0.06] border border-white/10">
                <div className="text-[10px] text-slate-400 uppercase font-bold">Max Allowed Loan</div>
                <div className="font-mono-num text-xl font-extrabold text-[#64c4a8] mt-0.5">{fmtAed(dbrOut.requestedLoanAed, true)}</div>
                <div className="text-[10px] text-slate-300">Max LTV {dbrOut.maxLtvPct}% · {dbrOut.maxTenureYears} yrs</div>
              </div>
              <div className="p-3.5 rounded-xl bg-white/[0.06] border border-white/10">
                <div className="text-[10px] text-slate-400 uppercase font-bold">Stressed DBR %</div>
                <div className="font-mono-num text-xl font-extrabold text-[#dfc285] mt-0.5">{dbrOut.stressedDbrPct.toFixed(1)}%</div>
                <div className="text-[10px] text-slate-300">50% CBUAE legal ceiling</div>
              </div>
              <div className="p-3.5 rounded-xl bg-white/[0.06] border border-white/10">
                <div className="text-[10px] text-slate-400 uppercase font-bold">Monthly EMI (Base)</div>
                <div className="font-mono-num text-xl font-extrabold text-white mt-0.5">{fmtAed(dbrOut.monthlyEmiAtRateAed)}</div>
                <div className="text-[10px] text-[#64c4a8]">CC 5% burden: {fmtAed(Math.round(dbrIn.creditCardLimitsAed * 0.05))}</div>
              </div>
            </div>
          </GlossyBlackCard>
        </div>
      )}

      {/* 3. UPFRONT CASH-TO-CLOSE & DLD/ADM/SHARJAH/RAK */}
      {active === 'cash' && (
        <div className="grid lg:grid-cols-12 gap-5">
          <div className="lg:col-span-5 bw-card p-5 space-y-4">
            <h2 className="font-display text-base font-extrabold flex items-center gap-2">
              <Building2 size={16} className="text-[#0e5a49]" /> UAE Upfront Cash-to-Close &amp; DLD Calculator
            </h2>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <label className="col-span-2 space-y-1">
                <span className="font-bold">Emirate Land Department</span>
                <select value={cashIn.emirate} onChange={(e) => setCashIn({ ...cashIn, emirate: e.target.value as UaeEmirate })} className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] font-bold">
                  <option>Dubai (DLD)</option>
                  <option>Abu Dhabi (ADM)</option>
                  <option>Sharjah (SRERD)</option>
                  <option>Ras Al Khaimah</option>
                </select>
              </label>
              <label className="col-span-2 space-y-1">
                <span className="font-bold">Property Price (AED)</span>
                <input type="number" value={cashIn.propertyPriceAed} onChange={(e) => setCashIn({ ...cashIn, propertyPriceAed: Number(e.target.value) })} className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] font-mono-num font-bold" />
              </label>
              <label className="space-y-1">
                <span className="font-bold">LTV (%)</span>
                <input type="number" value={cashIn.ltvPct} onChange={(e) => setCashIn({ ...cashIn, ltvPct: Number(e.target.value) })} className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] font-mono-num" />
              </label>
              <label className="space-y-1">
                <span className="font-bold">Fee Finance Added (%)</span>
                <input type="number" min={0} max={7} step="0.5" value={cashIn.feeFinancePct} onChange={(e) => setCashIn({ ...cashIn, feeFinancePct: Number(e.target.value) })} className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] font-mono-num" />
              </label>
              <label className="space-y-1">
                <span className="font-bold">Bank PF (%)</span>
                <input type="number" step="0.05" value={cashIn.processingFeePct} onChange={(e) => setCashIn({ ...cashIn, processingFeePct: Number(e.target.value) })} className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] font-mono-num" />
              </label>
              <label className="space-y-1">
                <span className="font-bold">Valuation Fee (AED)</span>
                <input type="number" value={cashIn.valuationFeeAed} onChange={(e) => setCashIn({ ...cashIn, valuationFeeAed: Number(e.target.value) })} className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] font-mono-num" />
              </label>
            </div>
          </div>

          <GlossyBlackCard className="lg:col-span-7 p-6 space-y-4" accent="gold">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[10.5px] uppercase font-extrabold text-[#dfc285]">Net Cash Required on Transfer Day</div>
                <div className="font-display text-3xl font-extrabold font-mono-num text-white mt-0.5">{fmtAed(cashOut.netUpfrontCashAed)}</div>
              </div>
              <StatusPill label="AED 0 Betterway Fee" tone="emerald" />
            </div>
            <div className="grid sm:grid-cols-2 gap-2.5 text-xs">
              {[
                ['Down Payment', cashOut.downPaymentAed],
                [`${cashIn.emirate} Transfer Fee`, cashOut.landDeptTransferFeeAed],
                ['Registration Trustee Fee', cashOut.trusteeFeeAed],
                ['Mortgage Registration Fee', cashOut.mortgageRegFeeAed],
                ['Bank Processing Fee (+5% VAT)', cashOut.bankProcessingFeeAed],
                ['Bank Valuation Fee (incl. VAT)', cashOut.valuationInclVatAed],
                ['Agency Fee (if applicable +5% VAT)', cashOut.agencyFeeInclVatAed],
                ['Less: Fee Finance Rolled In', -cashOut.feeFinanceAddedAed],
              ].map(([lbl, amt]) => (
                <div key={String(lbl)} className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-white/[0.06] border border-white/10">
                  <span className="text-slate-300">{lbl}</span>
                  <span className={`font-mono-num font-extrabold ${Number(amt) < 0 ? 'text-[#64c4a8]' : 'text-white'}`}>
                    {Number(amt) < 0 ? `- ${fmtAed(Math.abs(Number(amt)))}` : fmtAed(Number(amt))}
                  </span>
                </div>
              ))}
            </div>
          </GlossyBlackCard>
        </div>
      )}

      {/* 4. BUYOUT / REFINANCE & EQUITY RELEASE */}
      {active === 'buyout' && (
        <div className="grid lg:grid-cols-12 gap-5">
          <div className="lg:col-span-5 bw-card p-5 space-y-4">
            <h2 className="font-display text-base font-extrabold flex items-center gap-2">
              <RefreshCw size={16} className="text-[#0e5a49]" /> Mortgage Buyout &amp; Equity Release Calculator
            </h2>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <label className="space-y-1">
                <span className="font-bold">Current Balance (AED)</span>
                <input type="number" value={buyoutIn.currentBalanceAed} onChange={(e) => setBuyoutIn({ ...buyoutIn, currentBalanceAed: Number(e.target.value) })} className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] font-mono-num font-bold" />
              </label>
              <label className="space-y-1">
                <span className="font-bold">Current Rate (%)</span>
                <input type="number" step="0.05" value={buyoutIn.currentRatePct} onChange={(e) => setBuyoutIn({ ...buyoutIn, currentRatePct: Number(e.target.value) })} className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] font-mono-num" />
              </label>
              <label className="space-y-1">
                <span className="font-bold">New UAE Bank Rate (%)</span>
                <input type="number" step="0.05" value={buyoutIn.newRatePct} onChange={(e) => setBuyoutIn({ ...buyoutIn, newRatePct: Number(e.target.value) })} className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] font-mono-num font-bold" />
              </label>
              <label className="space-y-1">
                <span className="font-bold">Remaining Tenure (Yrs)</span>
                <input type="number" value={buyoutIn.remainingYears} onChange={(e) => setBuyoutIn({ ...buyoutIn, remainingYears: Number(e.target.value), newTenureYears: Number(e.target.value) })} className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] font-mono-num" />
              </label>
              <label className="col-span-2 space-y-1">
                <span className="font-bold">Optional Cash-Out Equity Release (AED)</span>
                <input type="number" value={buyoutIn.equityReleaseAed} onChange={(e) => setBuyoutIn({ ...buyoutIn, equityReleaseAed: Number(e.target.value) })} className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] font-mono-num" />
              </label>
            </div>
          </div>

          <GlossyBlackCard className="lg:col-span-7 p-6 space-y-4" accent="emerald">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-white/[0.06] border border-white/10">
                <div className="text-[10px] uppercase font-bold text-slate-400">Monthly Saving (Pure Buyout)</div>
                <div className="font-mono-num text-xl font-extrabold text-[#64c4a8] mt-0.5">{fmtAed(buyoutOut.monthlyPureSavingAed)}/mo</div>
              </div>
              <div className="p-3.5 rounded-xl bg-white/[0.06] border border-white/10">
                <div className="text-[10px] uppercase font-bold text-slate-400">Break-Even Time</div>
                <div className="font-mono-num text-xl font-extrabold text-[#dfc285] mt-0.5">{buyoutOut.breakEvenMonths} Months</div>
              </div>
              <div className="p-3.5 rounded-xl bg-white/[0.06] border border-white/10">
                <div className="text-[10px] uppercase font-bold text-slate-400">5-Year Net Savings</div>
                <div className="font-mono-num text-xl font-extrabold text-white mt-0.5">{fmtAed(buyoutOut.fiveYearNetSavingsAed)}</div>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-2.5 text-xs pt-2 border-t border-white/10">
              <div className="flex justify-between"><span>Old EMI ({buyoutIn.currentRatePct}%):</span><strong className="font-mono-num">{fmtAed(buyoutOut.oldEmiAed)}</strong></div>
              <div className="flex justify-between"><span>New EMI (w/ Equity {fmtAed(buyoutIn.equityReleaseAed, true)}):</span><strong className="font-mono-num text-[#64c4a8]">{fmtAed(buyoutOut.newEmiAed)}</strong></div>
              <div className="flex justify-between"><span>CBUAE Early Settlement Cap (1% / 10k+VAT):</span><strong className="font-mono-num">{fmtAed(buyoutOut.earlySettlementFeeAed)}</strong></div>
              <div className="flex justify-between"><span>Total Switching Cost (incl. DLD 0.25% &amp; Trustee):</span><strong className="font-mono-num text-[#dfc285]">{fmtAed(buyoutOut.totalSwitchingCostAed)}</strong></div>
            </div>
          </GlossyBlackCard>
        </div>
      )}

      {/* 5. PARTIAL PREPAYMENT & LUMP-SUM INTEREST SAVER */}
      {active === 'prepay' && (
        <div className="grid lg:grid-cols-12 gap-5">
          <div className="lg:col-span-5 bw-card p-5 space-y-4">
            <h2 className="font-display text-base font-extrabold flex items-center gap-2">
              <PiggyBank size={16} className="text-[#0e5a49]" /> Annual Partial Settlement &amp; Lump-Sum Saver
            </h2>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <label className="space-y-1">
                <span className="font-bold">Loan Amount (AED)</span>
                <input type="number" value={prepayIn.loanAed} onChange={(e) => setPrepayIn({ ...prepayIn, loanAed: Number(e.target.value) })} className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] font-mono-num font-bold" />
              </label>
              <label className="space-y-1">
                <span className="font-bold">Interest Rate (%)</span>
                <input type="number" step="0.05" value={prepayIn.annualRatePct} onChange={(e) => setPrepayIn({ ...prepayIn, annualRatePct: Number(e.target.value) })} className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] font-mono-num" />
              </label>
              <label className="space-y-1">
                <span className="font-bold">Annual Free Prepayment (AED/yr)</span>
                <input type="number" value={prepayIn.annualExtraPaymentAed} onChange={(e) => setPrepayIn({ ...prepayIn, annualExtraPaymentAed: Number(e.target.value) })} className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] font-mono-num" />
              </label>
              <label className="space-y-1">
                <span className="font-bold">One-Time Lump Sum (AED)</span>
                <input type="number" value={prepayIn.oneTimeLumpSumAed} onChange={(e) => setPrepayIn({ ...prepayIn, oneTimeLumpSumAed: Number(e.target.value) })} className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] font-mono-num" />
              </label>
            </div>
          </div>

          <GlossyBlackCard className="lg:col-span-7 p-6 grid sm:grid-cols-3 gap-4 items-center" accent="emerald">
            <div>
              <div className="text-[10.5px] uppercase font-bold text-slate-400">Total Interest Saved</div>
              <div className="font-display text-2xl font-extrabold font-mono-num text-[#64c4a8] mt-1">{fmtAed(prepayOut.interestSavedAed)}</div>
            </div>
            <div>
              <div className="text-[10.5px] uppercase font-bold text-slate-400">Time Cut Off Mortgage</div>
              <div className="font-display text-2xl font-extrabold font-mono-num text-[#dfc285] mt-1">{prepayOut.yearsSaved} Years</div>
              <div className="text-[11px] text-slate-300">({prepayOut.monthsSaved} months saved)</div>
            </div>
            <div>
              <div className="text-[10.5px] uppercase font-bold text-slate-400">New Payoff Horizon</div>
              <div className="font-display text-2xl font-extrabold font-mono-num text-white mt-1">{prepayOut.newPayoffYears} Years</div>
              <div className="text-[11px] text-slate-300">vs {prepayIn.tenureYears} yrs original</div>
            </div>
          </GlossyBlackCard>
        </div>
      )}

      {/* 6. RENT VS BUY DUBAI */}
      {active === 'rentbuy' && (
        <div className="grid lg:grid-cols-12 gap-5">
          <div className="lg:col-span-5 bw-card p-5 space-y-4">
            <h2 className="font-display text-base font-extrabold flex items-center gap-2">
              <Home size={16} className="text-[#0e5a49]" /> Dubai Rent vs Buy Wealth Break-Even
            </h2>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <label className="space-y-1">
                <span className="font-bold">Current Annual Rent (AED)</span>
                <input type="number" value={rvbIn.annualRentAed} onChange={(e) => setRvbIn({ ...rvbIn, annualRentAed: Number(e.target.value) })} className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] font-mono-num font-bold" />
              </label>
              <label className="space-y-1">
                <span className="font-bold">Property Price (AED)</span>
                <input type="number" value={rvbIn.propertyPriceAed} onChange={(e) => setRvbIn({ ...rvbIn, propertyPriceAed: Number(e.target.value) })} className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] font-mono-num font-bold" />
              </label>
              <label className="space-y-1">
                <span className="font-bold">Stay Horizon (Years)</span>
                <input type="number" min={2} max={20} value={rvbIn.horizonYears} onChange={(e) => setRvbIn({ ...rvbIn, horizonYears: Number(e.target.value) })} className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] font-mono-num" />
              </label>
              <label className="space-y-1">
                <span className="font-bold">Appreciation (% p.a.)</span>
                <input type="number" step="0.5" value={rvbIn.annualAppreciationPct} onChange={(e) => setRvbIn({ ...rvbIn, annualAppreciationPct: Number(e.target.value) })} className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] font-mono-num" />
              </label>
            </div>
          </div>

          <GlossyBlackCard className="lg:col-span-7 p-6 space-y-4" accent="dual">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-base font-extrabold text-white">{rvbOut.verdict}</h3>
              <StatusPill label={`Break-Even: Year ${rvbOut.breakEvenYear}`} tone="gold" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-white/[0.06] border border-white/10">
                <div className="text-[10px] uppercase font-bold text-slate-400">{rvbIn.horizonYears}Y Rent Sunk</div>
                <div className="font-mono-num text-lg font-extrabold text-[#fda4af] mt-0.5">{fmtAed(rvbOut.totalRentPaidAed, true)}</div>
              </div>
              <div className="p-3.5 rounded-xl bg-white/[0.06] border border-white/10">
                <div className="text-[10px] uppercase font-bold text-slate-400">Net Home Equity Built</div>
                <div className="font-mono-num text-lg font-extrabold text-[#64c4a8] mt-0.5">{fmtAed(rvbOut.netEquityBuiltAed, true)}</div>
              </div>
              <div className="p-3.5 rounded-xl bg-white/[0.06] border border-white/10">
                <div className="text-[10px] uppercase font-bold text-slate-400">Monthly EMI</div>
                <div className="font-mono-num text-lg font-extrabold text-[#dfc285] mt-0.5">{fmtAed(rvbOut.emiAed)}</div>
              </div>
            </div>
          </GlossyBlackCard>
        </div>
      )}

      {/* 7. OFF-PLAN (50% LTV) VS READY (80% LTV) */}
      {active === 'offplan' && (
        <div className="space-y-4">
          <div className="bw-card p-5 grid sm:grid-cols-3 gap-3 text-xs">
            <label className="space-y-1">
              <span className="font-bold">Property Price (AED)</span>
              <input type="number" value={offplanPrice} onChange={(e) => setOffplanPrice(Number(e.target.value))} className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] font-mono-num font-bold" />
            </label>
            <label className="space-y-1">
              <span className="font-bold">Off-Plan Rate (%)</span>
              <input type="number" step="0.05" value={offplanRate} onChange={(e) => setOffplanRate(Number(e.target.value))} className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] font-mono-num" />
            </label>
            <label className="space-y-1">
              <span className="font-bold">Ready Resale Rate (%)</span>
              <input type="number" step="0.05" value={readyRate} onChange={(e) => setReadyRate(Number(e.target.value))} className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] font-mono-num" />
            </label>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <GlossyBlackCard className="p-6 space-y-2.5" accent="gold">
              <StatusPill label="CBUAE Off-Plan Cap: 50% LTV" tone="gold" />
              <h3 className="font-display text-lg font-extrabold text-white">Off-Plan Construction / Handover</h3>
              <div className="text-xs text-slate-300 space-y-1.5 pt-1">
                <div className="flex justify-between"><span>Buyer Cash Required (50% + 4% Oqood):</span><strong className="font-mono-num text-[#dfc285]">{fmtAed(offplanPrice * 0.54)}</strong></div>
                <div className="flex justify-between"><span>Max Bank Mortgage (50% LTV):</span><strong className="font-mono-num text-white">{fmtAed(offplanPrice * 0.5)}</strong></div>
                <div className="flex justify-between"><span>Est. Monthly EMI (25Y @ {offplanRate}%):</span><strong className="font-mono-num text-[#64c4a8]">{fmtAed(calcAmortizationSummary({ propertyPriceAed: offplanPrice, ltvPct: 50, fixedRatePct: offplanRate, fixedYears: 3, reversionRatePct: offplanRate + 1, tenureYears: 25, lifeInsAnnualPct: 0.2, propInsAnnualPct: 0.04 }).fixedEmiAed)}/mo</strong></div>
              </div>
            </GlossyBlackCard>
            <GlossyBlackCard className="p-6 space-y-2.5" accent="emerald">
              <StatusPill label="CBUAE Ready Cap: 80% LTV Expat" tone="emerald" />
              <h3 className="font-display text-lg font-extrabold text-white">Ready Resale / Secondary</h3>
              <div className="text-xs text-slate-300 space-y-1.5 pt-1">
                <div className="flex justify-between"><span>Buyer Cash Required (20% + ~6.5% DLD/Fees):</span><strong className="font-mono-num text-[#64c4a8]">{fmtAed(offplanPrice * 0.265)}</strong></div>
                <div className="flex justify-between"><span>Max Bank Mortgage (80% LTV):</span><strong className="font-mono-num text-white">{fmtAed(offplanPrice * 0.8)}</strong></div>
                <div className="flex justify-between"><span>Est. Monthly EMI (25Y @ {readyRate}%):</span><strong className="font-mono-num text-[#dfc285]">{fmtAed(calcAmortizationSummary({ propertyPriceAed: offplanPrice, ltvPct: 80, fixedRatePct: readyRate, fixedYears: 3, reversionRatePct: readyRate + 1.5, tenureYears: 25, lifeInsAnnualPct: 0.2, propInsAnnualPct: 0.04 }).fixedEmiAed)}/mo</strong></div>
              </div>
            </GlossyBlackCard>
          </div>
        </div>
      )}

      {/* 8. RENTAL YIELD & DSCR */}
      {active === 'yield' && (
        <div className="grid lg:grid-cols-12 gap-5">
          <div className="lg:col-span-5 bw-card p-5 space-y-4">
            <h2 className="font-display text-base font-extrabold flex items-center gap-2">
              <TrendingUp size={16} className="text-[#0e5a49]" /> Buy-to-Let Rental Yield &amp; Investor DSCR
            </h2>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <label className="space-y-1">
                <span className="font-bold">Purchase Price (AED)</span>
                <input type="number" value={yieldIn.propertyPriceAed} onChange={(e) => setYieldIn({ ...yieldIn, propertyPriceAed: Number(e.target.value) })} className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] font-mono-num font-bold" />
              </label>
              <label className="space-y-1">
                <span className="font-bold">Annual Rent (AED)</span>
                <input type="number" value={yieldIn.annualRentAed} onChange={(e) => setYieldIn({ ...yieldIn, annualRentAed: Number(e.target.value) })} className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] font-mono-num font-bold" />
              </label>
              <label className="space-y-1">
                <span className="font-bold">Unit Size (Sq.Ft)</span>
                <input type="number" value={yieldIn.sizeSqft} onChange={(e) => setYieldIn({ ...yieldIn, sizeSqft: Number(e.target.value) })} className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] font-mono-num" />
              </label>
              <label className="space-y-1">
                <span className="font-bold">Service Charge (AED/sqft)</span>
                <input type="number" value={yieldIn.serviceChargePerSqftAed} onChange={(e) => setYieldIn({ ...yieldIn, serviceChargePerSqftAed: Number(e.target.value) })} className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] font-mono-num" />
              </label>
            </div>
          </div>

          <GlossyBlackCard className="lg:col-span-7 p-6 space-y-4" accent="emerald">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-base font-extrabold text-white">Investor Return Metrics</h3>
              <StatusPill label={`DSCR ${yieldOut.dscr}x · ${yieldOut.dscrVerdict}`} tone={yieldOut.dscr >= 1.25 ? 'emerald' : 'gold'} />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-white/[0.06] border border-white/10">
                <div className="text-[10px] uppercase text-slate-400 font-bold">Gross Yield</div>
                <div className="font-mono-num text-xl font-extrabold text-[#64c4a8]">{yieldOut.grossYieldPct}%</div>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.06] border border-white/10">
                <div className="text-[10px] uppercase text-slate-400 font-bold">Net Yield</div>
                <div className="font-mono-num text-xl font-extrabold text-[#dfc285]">{yieldOut.netYieldPct}%</div>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.06] border border-white/10">
                <div className="text-[10px] uppercase text-slate-400 font-bold">Monthly Cashflow</div>
                <div className={`font-mono-num text-xl font-extrabold ${yieldOut.monthlyNetCashflowAed >= 0 ? 'text-[#64c4a8]' : 'text-[#fda4af]'}`}>
                  {fmtAed(yieldOut.monthlyNetCashflowAed)}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.06] border border-white/10">
                <div className="text-[10px] uppercase text-slate-400 font-bold">Cash-on-Cash ROI</div>
                <div className="font-mono-num text-xl font-extrabold text-white">{yieldOut.cashOnCashRoiPct}%</div>
              </div>
            </div>
          </GlossyBlackCard>
        </div>
      )}

      {/* 9. EIBOR RATE SHOCK SIMULATOR */}
      {active === 'shock' && (
        <div className="grid lg:grid-cols-12 gap-5">
          <div className="lg:col-span-4 bw-card p-5 space-y-3 text-xs">
            <h2 className="font-display text-base font-extrabold flex items-center gap-2">
              <Activity size={16} className="text-[#0e5a49]" /> Fixed vs EIBOR Rate Shock
            </h2>
            <label className="block space-y-1">
              <span className="font-bold">Loan Amount (AED)</span>
              <input type="number" value={shockIn.loanAed} onChange={(e) => setShockIn({ ...shockIn, loanAed: Number(e.target.value) })} className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] font-mono-num font-bold" />
            </label>
            <label className="block space-y-1">
              <span className="font-bold">Fixed Rate Benchmark (%)</span>
              <input type="number" step="0.05" value={shockIn.fixedRatePct} onChange={(e) => setShockIn({ ...shockIn, fixedRatePct: Number(e.target.value) })} className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] font-mono-num" />
            </label>
            <label className="block space-y-1">
              <span className="font-bold">Bank Variable Margin (% + 3M EIBOR {shockIn.eibor3mPct}%)</span>
              <input type="number" step="0.05" value={shockIn.bankMarginPct} onChange={(e) => setShockIn({ ...shockIn, bankMarginPct: Number(e.target.value) })} className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] font-mono-num" />
            </label>
          </div>
          <div className="lg:col-span-8 bw-card overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[var(--bw-line)] flex items-center justify-between">
              <span className="font-display text-sm font-extrabold">Scenario Comparison vs Fixed EMI ({fmtAed(shockOut.fixedEmi)}/mo)</span>
              <StatusPill label={`Current Var: ${shockOut.baseVarRate}%`} tone="navy" />
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-[#0b192c] text-white text-[10px]">
                  <th className="py-2.5 px-4 text-start">EIBOR Scenario</th>
                  <th className="py-2.5 px-3 text-center">Effective Rate</th>
                  <th className="py-2.5 px-3 text-end">Monthly EMI</th>
                  <th className="py-2.5 px-3 text-end">Monthly Diff vs Fixed</th>
                  <th className="py-2.5 px-4 text-end">3-Year Cost Diff</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--bw-line)] font-mono-num">
                {shockOut.scenarios.map((s) => (
                  <tr key={s.label} className="hover:bg-[var(--bw-hover)]">
                    <td className="py-3 px-4 font-sans font-bold">{s.label}</td>
                    <td className="py-3 px-3 text-center font-bold">{s.ratePct}%</td>
                    <td className="py-3 px-3 text-end font-extrabold">{fmtAed(s.emiAed)}</td>
                    <td className={`py-3 px-3 text-end font-bold ${s.monthlyDiffVsFixedAed <= 0 ? 'text-[#0e5a49]' : 'text-[#881b30]'}`}>
                      {s.monthlyDiffVsFixedAed >= 0 ? `+${fmtAed(s.monthlyDiffVsFixedAed)}` : fmtAed(s.monthlyDiffVsFixedAed)}
                    </td>
                    <td className="py-3 px-4 text-end font-bold">{fmtAed(s.threeYearDiffAed)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 10. CREDIT CARD LIMIT OPTIMIZER */}
      {active === 'cc' && (
        <div className="grid lg:grid-cols-12 gap-5">
          <div className="lg:col-span-7 bw-card p-5 space-y-3 text-xs">
            <h2 className="font-display text-base font-extrabold flex items-center gap-2">
              <CreditCard size={16} className="text-[#0e5a49]" /> UAE Credit Card Limit Reduction Optimizer (CBUAE 5% Rule)
            </h2>
            {ccRows.map((c, idx) => (
              <div key={c.bank} className="grid grid-cols-3 gap-2 items-center">
                <div className="font-bold">{c.bank}</div>
                <input
                  type="number"
                  value={c.oldLimitAed}
                  onChange={(e) => setCcRows((prev) => prev.map((x, i) => (i === idx ? { ...x, oldLimitAed: Number(e.target.value) } : x)))}
                  className="h-9 px-3 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] font-mono-num"
                />
                <input
                  type="number"
                  value={c.newLimitAed}
                  onChange={(e) => setCcRows((prev) => prev.map((x, i) => (i === idx ? { ...x, newLimitAed: Number(e.target.value) } : x)))}
                  className="h-9 px-3 rounded-xl border border-[#0e5a49] bg-[#eaf4f1]/50 font-mono-num font-bold"
                />
              </div>
            ))}
          </div>
          <GlossyBlackCard className="lg:col-span-5 p-6 space-y-3" accent="emerald">
            <div className="text-[10.5px] uppercase font-bold text-slate-400">Extra Mortgage Capacity Unlocked</div>
            <div className="font-display text-3xl font-extrabold font-mono-num text-[#64c4a8]">{fmtAed(ccOut.extraMortgageCapacityAed)}</div>
            <div className="text-xs text-slate-300 space-y-1 pt-2 border-t border-white/10">
              <div className="flex justify-between"><span>Total CC Limit Reduced:</span><strong className="font-mono-num">{fmtAed(ccOut.limitReduced)}</strong></div>
              <div className="flex justify-between"><span>Monthly DBR Freed (5%):</span><strong className="font-mono-num text-[#dfc285]">{fmtAed(ccOut.monthlyDbrFreedAed)}/mo</strong></div>
            </div>
          </GlossyBlackCard>
        </div>
      )}

      {/* 11. ADVISOR PRO TOOLS (BANK DSA SPLIT + GOLDEN VISA + MAX AGE TENURE) */}
      {active === 'advisor' && (
        <div className="grid lg:grid-cols-12 gap-5">
          <div className="lg:col-span-5 bw-card p-5 space-y-4">
            <h2 className="font-display text-base font-extrabold flex items-center gap-2">
              <Award size={16} className="text-[#0e5a49]" /> Bank DSA Payout, Golden Visa &amp; Max Tenure Checker
            </h2>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <label className="space-y-1">
                <span className="font-bold">Property Value (AED)</span>
                <input type="number" value={advIn.propertyPriceAed} onChange={(e) => setAdvIn({ ...advIn, propertyPriceAed: Number(e.target.value) })} className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] font-mono-num font-bold" />
              </label>
              <label className="space-y-1">
                <span className="font-bold">Disbursed Loan (AED)</span>
                <input type="number" value={advIn.loanAmountAed} onChange={(e) => setAdvIn({ ...advIn, loanAmountAed: Number(e.target.value) })} className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] font-mono-num font-bold" />
              </label>
              <label className="space-y-1">
                <span className="font-bold">Client Age (Yrs)</span>
                <input type="number" value={advIn.ageYears} onChange={(e) => setAdvIn({ ...advIn, ageYears: Number(e.target.value) })} className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] font-mono-num" />
              </label>
              <label className="space-y-1">
                <span className="font-bold">Profile</span>
                <select value={advIn.employment} onChange={(e) => setAdvIn({ ...advIn, employment: e.target.value as any })} className="w-full h-9 px-2.5 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)]">
                  <option>Salaried</option>
                  <option>Self-Employed</option>
                </select>
              </label>
              <label className="space-y-1">
                <span className="font-bold">Bank DSA Rate (%)</span>
                <input type="number" step="0.05" value={advIn.bankDsaPct} onChange={(e) => setAdvIn({ ...advIn, bankDsaPct: Number(e.target.value) })} className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] font-mono-num" />
              </label>
              <label className="space-y-1">
                <span className="font-bold">Advisor / 3rd Party %</span>
                <div className="flex gap-1.5">
                  <input type="number" value={advIn.advisorSplitPct} onChange={(e) => setAdvIn({ ...advIn, advisorSplitPct: Number(e.target.value) })} className="w-1/2 h-9 px-2 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] font-mono-num" />
                  <input type="number" value={advIn.thirdPartySplitPct} onChange={(e) => setAdvIn({ ...advIn, thirdPartySplitPct: Number(e.target.value) })} className="w-1/2 h-9 px-2 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] font-mono-num" />
                </div>
              </label>
            </div>
          </div>

          <GlossyBlackCard className="lg:col-span-7 p-6 space-y-4" accent="gold">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="inline-flex items-center gap-2 text-sm font-extrabold text-white">
                <CheckCircle2 size={16} className={advOut.goldenVisaEligible ? 'text-[#64c4a8]' : 'text-amber-400'} />
                {advOut.goldenVisaEligible
                  ? '10-Year UAE Golden Visa Eligible (Property >= AED 2M)'
                  : `Golden Visa Shortfall: ${fmtAed(advOut.goldenVisaShortfallAed)}`}
              </div>
              <StatusPill label={`Max Tenure: ${advOut.maxTenureByAge} Yrs (Cap Age ${advOut.maxAge})`} tone="gold" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-white/[0.06] border border-white/10">
                <div className="text-[10px] uppercase text-slate-400 font-bold">Gross Bank DSA</div>
                <div className="font-mono-num text-lg font-extrabold text-white">{fmtAed(advOut.grossBankDsaAed)}</div>
                <div className="text-[10px] text-slate-300">+5% VAT: {fmtAed(advOut.ftaVat5PctAed)}</div>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.06] border border-white/10">
                <div className="text-[10px] uppercase text-slate-400 font-bold">Advisor Split ({advIn.advisorSplitPct}%)</div>
                <div className="font-mono-num text-lg font-extrabold text-[#64c4a8]">{fmtAed(advOut.advisorPayoutAed)}</div>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.06] border border-white/10">
                <div className="text-[10px] uppercase text-slate-400 font-bold">3rd-Party ({advIn.thirdPartySplitPct}%)</div>
                <div className="font-mono-num text-lg font-extrabold text-[#dfc285]">{fmtAed(advOut.thirdPartyPayoutAed)}</div>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.06] border border-white/10">
                <div className="text-[10px] uppercase text-slate-400 font-bold">Betterway Net</div>
                <div className="font-mono-num text-lg font-extrabold text-white">{fmtAed(advOut.houseNetAed)}</div>
              </div>
            </div>
          </GlossyBlackCard>
        </div>
      )}

      {/* 12. MULTI-CURRENCY CONVERTER (NON-RESIDENT BUYERS) */}
      {active === 'fx' && (
        <div className="bw-card p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-base font-extrabold flex items-center gap-2">
                <Landmark size={16} className="text-[#0e5a49]" /> Non-Resident &amp; International Buyer Currency Converter
              </h2>
              <p className="text-xs text-[var(--bw-muted)]">Instant AED conversion for USD, EUR, GBP, SAR &amp; INR international mortgage clients.</p>
            </div>
            <label className="flex items-center gap-2 text-xs font-bold">
              <span>Amount (AED):</span>
              <input
                type="number"
                value={fxAmountAed}
                onChange={(e) => setFxAmountAed(Number(e.target.value))}
                className="w-44 h-9 px-3 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] font-mono-num font-extrabold"
              />
            </label>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {AED_FX_RATES.map((fx) => (
              <GlossyBlackCard key={fx.code} className="p-4 space-y-1" accent="emerald">
                <div className="text-[10.5px] font-bold uppercase text-[#dfc285]">{fx.code} · {fx.name}</div>
                <div className="font-display text-xl font-extrabold font-mono-num text-white">
                  {Math.round(fxAmountAed * fx.perAed).toLocaleString('en-US')}
                </div>
                <div className="text-[10px] text-[#64c4a8] flex items-center gap-1">
                  <Percent size={10} /> 1 AED = {fx.perAed.toFixed(4)} {fx.code}
                </div>
              </GlossyBlackCard>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
