'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Building2,
  Calculator,
  CalendarClock,
  CheckSquare,
  CreditCard,
  Download,
  FileSpreadsheet,
  PhoneCall,
  Sparkles,
  Zap,
} from 'lucide-react';
import { useOs } from '@/components/os/OsProvider';
import { fmtAed, GlossyBlackCard, MetricTile, PageHeader, StatusPill } from '@/components/os/UiKit';
import { LiveBankMarquee } from '@/components/os/LiveBankMarquee';
import Link from 'next/link';
import { calculateBuyoutSavings, calculateCbuaeEligibility, calculateCtoAndAvgBalance } from '@/lib/domain/cbuae-math';
import { UAE_BANKS } from '@/lib/domain/banks';
import { computeCreditCardDbrImpact, CREDIT_ANALYST_STATEMENT_CHECKLIST } from '@/lib/domain/bank-intelligence';
import { ProposalStudioTab } from '@/components/workspace/ProposalStudioTab';
import { BankRmAndPolicyTab } from '@/components/workspace/BankRmAndPolicyTab';
import { useInstantApi } from '@/lib/client-cache';

type DeskTab = 'proposal' | 'matcher' | 'matrix' | 'rms' | 'statement' | 'schedule';

function MortgageDeskInner() {
  const { toast } = useOs();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<DeskTab>('proposal');
  const { data: liveDesk, reload } = useInstantApi<{ events: any[]; valuations: any[]; banks: any[]; cases: any[] }>('/api/v1/mortgage-desk');
  const desk = liveDesk ?? { events: [], valuations: [], banks: [], cases: [] };

  useEffect(() => {
    const t = searchParams?.get('tab');
    if (t === 'proposal' || t === 'matcher' || t === 'matrix' || t === 'rms') {
      setTab(t);
    } else if (t === 'cbuae' || t === 'statement') {
      setTab('statement');
    } else if (t === 'valuations' || t === 'schedule') {
      setTab('schedule');
    }
  }, [searchParams]);

  // Valuation form
  const [valForm, setValForm] = useState({
    caseId: '',
    bankKey: 'emirates-nbd',
    valuationCompany: 'CBRE / Cavendish Maxwell',
    accessContact: '',
    bookedDate: new Date(Date.now() + 86_400_000 * 2).toISOString().slice(0, 16),
    feeAed: 3150,
  });

  useEffect(() => {
    if (!valForm.caseId && desk.cases?.[0]?.id) {
      setValForm((p) => ({ ...p, caseId: desk.cases[0].id }));
    }
  }, [desk.cases, valForm.caseId]);

  // CBUAE Calculator state
  const [calc, setCalc] = useState({
    propertyPriceAed: 3_000_000,
    monthlyIncomeAed: 45_000,
    existingEmisAed: 2_000,
    creditCardLimitsAed: 30_000,
    residency: 'expat_resident' as 'uae_national' | 'expat_resident' | 'non_resident',
    borrowerProfile: 'salaried' as 'salaried' | 'self_employed_full' | 'self_employed_low_doc' | 'non_resident',
    ageYears: 36,
    isFirstHome: true,
    interestRatePct: 3.89,
  });

  // CTO & Avg Balance 6-month analyzer (with USD→AED option from user's sheet)
  const [currency, setCurrency] = useState<'AED' | 'USD'>('AED');
  const [ctoRows, setCtoRows] = useState([
    { month: 'Month 1', creditsAed: 48_000, minBalanceAed: 18_500, avgBalanceAed: 29_000 },
    { month: 'Month 2', creditsAed: 52_000, minBalanceAed: 21_000, avgBalanceAed: 31_000 },
    { month: 'Month 3', creditsAed: 44_500, minBalanceAed: 16_000, avgBalanceAed: 27_000 },
    { month: 'Month 4', creditsAed: 51_000, minBalanceAed: 19_500, avgBalanceAed: 30_500 },
    { month: 'Month 5', creditsAed: 46_000, minBalanceAed: 17_200, avgBalanceAed: 28_400 },
    { month: 'Month 6', creditsAed: 54_000, minBalanceAed: 22_000, avgBalanceAed: 33_800 },
  ]);

  // Credit Card Limit Reduction Planner (directly from user's sheet: EIB, HSBC, Mashreq, SIB, DIB)
  const [ccCards, setCcCards] = useState([
    { bank: 'EIB', oldLimitAed: 70_300, newLimitAed: 20_000 },
    { bank: 'HSBC', oldLimitAed: 5_000, newLimitAed: 5_000 },
    { bank: 'Mashreq', oldLimitAed: 37_600, newLimitAed: 20_000 },
    { bank: 'SIB', oldLimitAed: 10_000, newLimitAed: 10_000 },
    { bank: 'DIB', oldLimitAed: 15_006, newLimitAed: 15_006 },
  ]);
  const [analystChecks, setAnalystChecks] = useState<Record<string, boolean>>({});

  const bookValuation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valForm.caseId) {
      toast('Select a mortgage case first', 'err');
      return;
    }
    const r = await fetch('/api/v1/mortgage-desk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind: 'valuation', ...valForm, bookedDate: new Date(valForm.bookedDate).toISOString() }),
    });
    if (r.ok) {
      toast('Bank Valuation booked & added to Schedule!');
      await reload();
    }
  };

  const fx = currency === 'USD' ? 3.6725 : 1;
  const ctoNormalized = ctoRows.map((r) => ({
    ...r,
    creditsAed: Math.round(r.creditsAed * fx),
    minBalanceAed: Math.round(r.minBalanceAed * fx),
    avgBalanceAed: Math.round(r.avgBalanceAed * fx),
  }));
  const elig = calculateCbuaeEligibility(calc);
  const buyout = calculateBuyoutSavings({
    outstandingBalanceAed: elig.requestedLoanAed,
    currentRatePct: 6.25,
    newRatePct: calc.interestRatePct,
    remainingYears: Math.min(20, elig.maxTenureYears),
  });
  const cto = calculateCtoAndAvgBalance(ctoNormalized);
  const ccImpact = computeCreditCardDbrImpact(ccCards);

  return (
    <div className="space-y-6">
      <LiveBankMarquee />
      <PageHeader
        eyebrow="18-Bank 2026 Policy Matrix · 159 Direct Bank RMs · 3-Bank Auto-Eco Proposal Maker"
        title="24-Bank Mortgage"
        accent="Super-Hub"
        subtitle="Use the top bar sub-pages to switch instantly between 3-Bank Proposals, 60-Sec Matcher & AI Policy, Updated 2026 18-Bank Matrix, 159 Direct Bank RMs, CBUAE/CTO/Avg Balance & Bank Valuations."
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href="/os/calculators" className="bw-btn bw-btn-obsidian text-xs py-2 min-h-[38px]">
              <Calculator size={14} className="text-[#34f0bc]" /> All 12 UAE Calculators
            </Link>
            <a href="/api/v1/utilities/bank-matrix-excel" className="bw-btn bw-btn-gold text-xs py-2 min-h-[38px]">
              <Download size={14} /> Download 2026 Matrix (.xlsx)
            </a>
          </div>
        }
      />

      {/* Glossy Shining Black Pill Switcher */}
      <div className="flex flex-wrap gap-2 no-print">
        {[
          { id: 'proposal', label: '3-Bank Proposal Maker', icon: Sparkles },
          { id: 'matcher', label: '60-Sec Matcher & AI Policy', icon: Zap },
          { id: 'matrix', label: '18-Bank Policy & Rates', icon: Building2 },
          { id: 'rms', label: '140+ Direct Bank RMs', icon: PhoneCall },
          { id: 'statement', label: 'CBUAE, CC Reducer & Statements', icon: FileSpreadsheet },
          { id: 'schedule', label: 'Valuations & 24-Bank Logos', icon: CalendarClock },
        ].map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id as DeskTab)}
              className={`px-4 py-2.5 rounded-full text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer transition ${
                active
                  ? 'bg-[#0a0e14] text-[#34f0bc] border border-[#22e2ad]/60 shadow-lg'
                  : 'bg-[var(--bw-card)] text-[var(--bw-body)] border border-[var(--bw-line)] hover:border-[#119c78]'
              }`}
            >
              <Icon size={14} className={active ? 'text-[#fbe8a4]' : 'text-[#119c78]'} /> {t.label}
            </button>
          );
        })}
      </div>

      {tab === 'proposal' && <ProposalStudioTab />}
      {tab === 'matcher' && <BankRmAndPolicyTab mode="matcher" />}
      {tab === 'matrix' && <BankRmAndPolicyTab mode="matrix" />}
      {tab === 'rms' && <BankRmAndPolicyTab mode="rms" />}

      {tab === 'statement' && (
        <div className="space-y-6">
          {/* Row 1: CBUAE DBR / Buyout Modeller */}
          <div className="grid lg:grid-cols-12 gap-5">
            <div className="lg:col-span-5 bw-card p-5 space-y-3 text-xs">
              <h3 className="font-display text-sm font-extrabold flex items-center gap-1.5">
                <Calculator size={15} className="text-[#119c78]" /> CBUAE 50% DBR, LTV &amp; Buyout Calculator
              </h3>
              <div className="grid grid-cols-2 gap-2.5">
                <div><label className="font-bold block mb-1">Property Price (AED)</label><input type="number" value={calc.propertyPriceAed} onChange={(e) => setCalc({ ...calc, propertyPriceAed: Number(e.target.value) })} className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] font-mono-num" /></div>
                <div><label className="font-bold block mb-1">Monthly Income (AED)</label><input type="number" value={calc.monthlyIncomeAed} onChange={(e) => setCalc({ ...calc, monthlyIncomeAed: Number(e.target.value) })} className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] font-mono-num" /></div>
                <div><label className="font-bold block mb-1">Existing EMIs (AED)</label><input type="number" value={calc.existingEmisAed} onChange={(e) => setCalc({ ...calc, existingEmisAed: Number(e.target.value) })} className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] font-mono-num" /></div>
                <div><label className="font-bold block mb-1">Credit Card Limits</label><input type="number" value={calc.creditCardLimitsAed} onChange={(e) => setCalc({ ...calc, creditCardLimitsAed: Number(e.target.value) })} className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] font-mono-num" /></div>
                <div>
                  <label className="font-bold block mb-1">Residency</label>
                  <select value={calc.residency} onChange={(e) => setCalc({ ...calc, residency: e.target.value as any })} className="w-full h-9 px-2.5 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)]">
                    <option value="expat_resident">Expat Resident</option>
                    <option value="uae_national">UAE National</option>
                    <option value="non_resident">Non-Resident</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold block mb-1">Profile</label>
                  <select value={calc.borrowerProfile} onChange={(e) => setCalc({ ...calc, borrowerProfile: e.target.value as any })} className="w-full h-9 px-2.5 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)]">
                    <option value="salaried">Salaried (Max Age 65)</option>
                    <option value="self_employed_full">Self-Employed Full-Doc (Age 70)</option>
                    <option value="self_employed_low_doc">Self-Employed Low-Doc</option>
                    <option value="non_resident">Non-Resident</option>
                  </select>
                </div>
                <div><label className="font-bold block mb-1">Age (Years)</label><input type="number" value={calc.ageYears} onChange={(e) => setCalc({ ...calc, ageYears: Number(e.target.value) })} className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] font-mono-num" /></div>
                <div><label className="font-bold block mb-1">Fixed Rate (%)</label><input type="number" step="0.05" value={calc.interestRatePct} onChange={(e) => setCalc({ ...calc, interestRatePct: Number(e.target.value) })} className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] font-mono-num" /></div>
              </div>
            </div>

            <div className="lg:col-span-7 space-y-4">
              <div className="grid sm:grid-cols-3 gap-3">
                <MetricTile label="Eligible Max Loan" value={fmtAed(elig.eligibleLoanAed)} hint={`Max LTV ${elig.maxLtvPct}% · ${elig.maxTenureYears} yrs`} tone="navy" />
                <MetricTile label="Monthly EMI" value={fmtAed(elig.monthlyEmiAtRateAed)} hint={`Stressed DBR: ${elig.stressedDbrPct}% (Cap 50%)`} tone={elig.eligible ? 'emerald' : 'red'} />
                <MetricTile label="Total Cash to Close" value={fmtAed(elig.totalCashToCloseAed)} hint={`DLD + Fees: ${fmtAed(elig.dldClosingCostsAed)}`} tone="gold" />
              </div>
              <div className="bw-card p-5 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold">Buyout Savings (vs 6.25% Revert Rate)</span>
                  <StatusPill label={elig.goldenVisaEligible ? 'Golden Visa AED 2M Eligible' : 'Standard Title'} tone={elig.goldenVisaEligible ? 'gold' : 'slate'} />
                </div>
                <div className="grid sm:grid-cols-3 gap-3 pt-2">
                  <div>Monthly Savings: <strong className="font-mono-num text-[#119c78]">{fmtAed(buyout.monthlySavingsAed)}/mo</strong></div>
                  <div>CBUAE Exit Cap (+VAT): <strong className="font-mono-num">{fmtAed(buyout.earlySettlementInclVat)}</strong></div>
                  <div>Break-Even: <strong className="font-mono-num">{buyout.breakEvenMonths} months</strong></div>
                </div>
              </div>
            </div>
          </div>

          {/* Row 2: Credit Card Limit Reduction Planner + 7-Point Statement Checklist */}
          <div className="grid lg:grid-cols-12 gap-5">
            <div className="lg:col-span-7 bw-card p-5 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-sm font-extrabold flex items-center gap-1.5">
                  <CreditCard size={15} className="text-[#119c78]" /> Credit Card Limit Reduction → Extra Mortgage Eligibility
                </h3>
                <StatusPill label={`Freed DBR: ${fmtAed(ccImpact.monthlyDbrFreedAed)}/mo`} tone="emerald" />
              </div>
              <div className="space-y-2">
                {ccCards.map((c, idx) => (
                  <div key={idx} className="grid grid-cols-4 gap-2 items-center">
                    <input value={c.bank} onChange={(e) => setCcCards((p) => p.map((x, i) => (i === idx ? { ...x, bank: e.target.value } : x)))} className="h-8 px-2.5 rounded-lg border border-[var(--bw-line)] bg-[var(--bw-soft)] font-bold" />
                    <input type="number" value={c.oldLimitAed} onChange={(e) => setCcCards((p) => p.map((x, i) => (i === idx ? { ...x, oldLimitAed: Number(e.target.value) } : x)))} className="h-8 px-2.5 rounded-lg border border-[var(--bw-line)] bg-[var(--bw-soft)] font-mono-num" placeholder="Old Limit" />
                    <input type="number" value={c.newLimitAed} onChange={(e) => setCcCards((p) => p.map((x, i) => (i === idx ? { ...x, newLimitAed: Number(e.target.value) } : x)))} className="h-8 px-2.5 rounded-lg border border-[var(--bw-line)] bg-[var(--bw-soft)] font-mono-num" placeholder="New Limit" />
                    <div className="text-end font-mono-num font-bold text-[#119c78]">
                      -{fmtAed(Math.max(0, c.oldLimitAed - c.newLimitAed))}
                    </div>
                  </div>
                ))}
              </div>
              <GlossyBlackCard className="p-4 grid sm:grid-cols-3 gap-3 font-mono-num" accent="emerald">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase">Total Limit Cut</div>
                  <div className="text-lg font-extrabold text-white">{fmtAed(ccImpact.limitReduced)}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase">5% Monthly DBR Saved</div>
                  <div className="text-lg font-extrabold text-[#34f0bc]">{fmtAed(ccImpact.monthlyDbrFreedAed)}/mo</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase">Extra Loan Unlocked</div>
                  <div className="text-lg font-extrabold text-[#fbe8a4]">+{fmtAed(ccImpact.extraMortgageCapacityAed, true)}</div>
                </div>
              </GlossyBlackCard>
            </div>

            <div className="lg:col-span-5 bw-card p-5 space-y-3 text-xs">
              <h3 className="font-display text-sm font-extrabold flex items-center gap-1.5">
                <CheckSquare size={15} className="text-[#119c78]" /> 7-Point Credit Analyst Bank Statement Checklist
              </h3>
              <div className="space-y-2">
                {CREDIT_ANALYST_STATEMENT_CHECKLIST.map((item) => (
                  <label key={item} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-[var(--bw-soft)] border border-[var(--bw-line)] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(analystChecks[item])}
                      onChange={(e) => setAnalystChecks((p) => ({ ...p, [item]: e.target.checked }))}
                      className="mt-0.5"
                    />
                    <span className="font-medium text-[var(--bw-ink)]">{item}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Row 3: 6-Month Bank Statement CTO & Daily Average Balance (AED / USD) */}
          <div className="grid lg:grid-cols-12 gap-5">
            <div className="lg:col-span-7 bw-card p-5 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-display text-sm font-extrabold">6-Month Bank Statement CTO &amp; Average Balance ({currency})</h3>
                <div className="flex gap-1 text-xs">
                  {(['AED', 'USD'] as const).map((cur) => (
                    <button
                      key={cur}
                      type="button"
                      onClick={() => setCurrency(cur)}
                      className={`px-3 py-1 rounded-full font-bold cursor-pointer ${
                        currency === cur ? 'bg-[#0a0e14] text-[#34f0bc]' : 'border border-[var(--bw-line)]'
                      }`}
                    >
                      {cur}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                {ctoRows.map((row, idx) => (
                  <div key={row.month} className="grid grid-cols-4 gap-2 text-xs items-center">
                    <span className="font-bold">{row.month}</span>
                    <input type="number" value={row.creditsAed} onChange={(e) => setCtoRows((p) => p.map((r, i) => (i === idx ? { ...r, creditsAed: Number(e.target.value) } : r)))} className="h-8 px-2 rounded-lg border border-[var(--bw-line)] bg-[var(--bw-soft)] font-mono-num" placeholder="Credits" />
                    <input type="number" value={row.minBalanceAed} onChange={(e) => setCtoRows((p) => p.map((r, i) => (i === idx ? { ...r, minBalanceAed: Number(e.target.value) } : r)))} className="h-8 px-2 rounded-lg border border-[var(--bw-line)] bg-[var(--bw-soft)] font-mono-num" placeholder="Min Bal" />
                    <input type="number" value={row.avgBalanceAed} onChange={(e) => setCtoRows((p) => p.map((r, i) => (i === idx ? { ...r, avgBalanceAed: Number(e.target.value) } : r)))} className="h-8 px-2 rounded-lg border border-[var(--bw-line)] bg-[var(--bw-soft)] font-mono-num" placeholder="Avg Bal" />
                  </div>
                ))}
              </div>
            </div>
            <div className="lg:col-span-5 bw-card p-5 space-y-3 text-xs">
              <h3 className="font-display text-sm font-extrabold">Betterway Low-Doc &amp; Non-Resident Verdict (in AED)</h3>
              <div className="grid grid-cols-2 gap-2.5">
                <MetricTile label="Avg Monthly Credits" value={fmtAed(cto.avgMonthlyCreditsAed)} tone="emerald" />
                <MetricTile label="Overall Avg Balance" value={fmtAed(cto.overallAvgBalanceAed)} tone="navy" />
              </div>
              <div className="flex flex-wrap gap-2">
                <StatusPill label={cto.qualifiesLowDocSelfEmployed ? '✓ Low-Doc Qualified (up to 2.0M)' : '✗ Below Low-Doc Rules'} tone={cto.qualifiesLowDocSelfEmployed ? 'emerald' : 'red'} />
                <StatusPill label={cto.qualifiesNonResident ? '✓ Non-Resident Qualified (up to 2.2M)' : '✗ Below Non-Res Rules'} tone={cto.qualifiesNonResident ? 'gold' : 'red'} />
              </div>
              <ul className="list-disc ps-4 space-y-1 text-[var(--bw-muted)]">
                {cto.notes.map((n, i) => <li key={i}>{n}</li>)}
              </ul>
            </div>
          </div>
        </div>
      )}

      {tab === 'schedule' && (
        <div className="space-y-6">
          <div className="grid lg:grid-cols-12 gap-6">
            <form onSubmit={bookValuation} className="lg:col-span-5 bw-card p-5 space-y-3 text-xs">
              <h3 className="font-display text-sm font-extrabold">Book Property Valuation &amp; Sync Calendar</h3>
              <div>
                <label className="font-bold block mb-1">Mortgage Case</label>
                <select value={valForm.caseId} onChange={(e) => setValForm({ ...valForm, caseId: e.target.value })} className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)]">
                  <option value="">Select case...</option>
                  {desk.cases.map((c) => (
                    <option key={c.id} value={c.id}>{c.case_code} · {c.borrower_name} ({c.community})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold block mb-1">Lending Bank</label>
                  <select value={valForm.bankKey} onChange={(e) => setValForm({ ...valForm, bankKey: e.target.value })} className="w-full h-9 px-2.5 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)]">
                    {UAE_BANKS.map((b) => <option key={b.key} value={b.key}>{b.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="font-bold block mb-1">Valuation Fee (AED)</label>
                  <input type="number" value={valForm.feeAed} onChange={(e) => setValForm({ ...valForm, feeAed: Number(e.target.value) })} className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] font-mono-num" />
                </div>
              </div>
              <input required value={valForm.valuationCompany} onChange={(e) => setValForm({ ...valForm, valuationCompany: e.target.value })} placeholder="Valuation panel firm (CBRE, JLL, Cavendish...)" className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)]" />
              <input required value={valForm.accessContact} onChange={(e) => setValForm({ ...valForm, accessContact: e.target.value })} placeholder="Property access contact / key holder" className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)]" />
              <input type="datetime-local" value={valForm.bookedDate} onChange={(e) => setValForm({ ...valForm, bookedDate: e.target.value })} className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)]" />
              <button type="submit" className="bw-btn bw-btn-obsidian w-full text-xs">
                Book Valuation &amp; Sync Schedule
              </button>
            </form>

            <div className="lg:col-span-7 space-y-4">
              <div className="bw-card p-5 space-y-3">
                <h3 className="font-display text-sm font-extrabold">Active Bank Valuations ({desk.valuations.length})</h3>
                {desk.valuations.length === 0 ? (
                  <div className="text-xs text-[var(--bw-muted)] py-6 text-center">No valuations booked yet.</div>
                ) : (
                  desk.valuations.map((v) => (
                    <div key={v.id} className="p-3 rounded-xl border border-[var(--bw-line)] flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold">{v.valuation_company} · {v.bank_key.toUpperCase()}</div>
                        <div className="text-[var(--bw-muted)]">Access: {v.access_contact} · Fee: {fmtAed(v.fee_aed)}</div>
                      </div>
                      <StatusPill label={v.status} tone="emerald" />
                    </div>
                  ))
                )}
              </div>
              <div className="bw-card p-5 space-y-3">
                <h3 className="font-display text-sm font-extrabold">Upcoming Deadlines &amp; Follow-Ups ({desk.events.length})</h3>
                {desk.events.map((ev) => (
                  <div key={ev.id} className="p-3 rounded-xl border border-[var(--bw-line)] flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold">{ev.title}</div>
                      <div className="text-[var(--bw-muted)]">{new Date(ev.starts_at).toLocaleString()} · {ev.location}</div>
                    </div>
                    <StatusPill label={ev.event_type} tone="gold" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 24-Bank Brand Logo Wall */}
          <div className="space-y-3">
            <h3 className="font-display text-sm font-extrabold">Full 24-Bank UAE Lender Panel</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {UAE_BANKS.map((b) => (
                <div key={b.id} className="bw-card p-4 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <div className="h-9 px-2.5 rounded-xl bg-white border border-slate-200 flex items-center">
                      <img src={b.logo} alt={b.name} className="h-6 max-w-[110px] object-contain" />
                    </div>
                    <StatusPill label={b.type} tone={b.type === 'Islamic' ? 'emerald' : 'blue'} />
                  </div>
                  <div className="font-display font-extrabold text-sm">{b.name}</div>
                  <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-[var(--bw-line)] font-mono-num">
                    <div><div className="text-[9.5px] text-[var(--bw-muted)]">3Y Fixed</div><strong>{b.indicativeFixed3Y}%</strong></div>
                    <div><div className="text-[9.5px] text-[var(--bw-muted)]">DSA</div><strong className="text-[#119c78]">{b.dsaRatePct}%</strong></div>
                    <div><div className="text-[9.5px] text-[var(--bw-muted)]">SLA</div><strong>{b.slaDays}d</strong></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MortgageDeskPage() {
  return (
    <Suspense fallback={<div className="p-8 text-xs text-[var(--bw-muted)]">Loading 24-Bank Mortgage Hub...</div>}>
      <MortgageDeskInner />
    </Suspense>
  );
}
