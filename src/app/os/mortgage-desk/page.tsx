'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Building2, Calculator, CalendarClock, FileSpreadsheet } from 'lucide-react';
import { useOs } from '@/components/os/OsProvider';
import { fmtAed, MetricTile, PageHeader, StatusPill } from '@/components/os/UiKit';
import { calculateBuyoutSavings, calculateCbuaeEligibility, calculateCtoAndAvgBalance } from '@/lib/domain/cbuae-math';
import { UAE_BANKS } from '@/lib/domain/banks';

export default function MortgageDeskPage() {
  const { toast } = useOs();
  const [tab, setTab] = useState<'schedule' | 'banks' | 'calculators' | 'cto'>('schedule');
  const [desk, setDesk] = useState<{ events: any[]; valuations: any[]; banks: any[]; cases: any[] }>({
    events: [],
    valuations: [],
    banks: [],
    cases: [],
  });

  // Valuation form
  const [valForm, setValForm] = useState({
    caseId: '',
    bankKey: 'emirates-nbd',
    valuationCompany: 'CBRE / Cavendish Maxwell',
    accessContact: '',
    bookedDate: new Date(Date.now() + 86_400_000 * 2).toISOString().slice(0, 16),
    feeAed: 3150,
  });

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

  // CTO & Avg Balance 6-month analyzer
  const [ctoRows, setCtoRows] = useState([
    { month: 'Month 1', creditsAed: 48_000, minBalanceAed: 18_500, avgBalanceAed: 29_000 },
    { month: 'Month 2', creditsAed: 52_000, minBalanceAed: 21_000, avgBalanceAed: 31_000 },
    { month: 'Month 3', creditsAed: 44_500, minBalanceAed: 16_000, avgBalanceAed: 27_000 },
    { month: 'Month 4', creditsAed: 51_000, minBalanceAed: 19_500, avgBalanceAed: 30_500 },
    { month: 'Month 5', creditsAed: 46_000, minBalanceAed: 17_200, avgBalanceAed: 28_400 },
    { month: 'Month 6', creditsAed: 54_000, minBalanceAed: 22_000, avgBalanceAed: 33_800 },
  ]);

  const load = useCallback(async () => {
    const r = await fetch('/api/v1/mortgage-desk');
    if (r.ok) {
      const d = await r.json();
      setDesk(d);
      if (!valForm.caseId && d.cases?.[0]?.id) setValForm((p) => ({ ...p, caseId: d.cases[0].id }));
    }
  }, [valForm.caseId]);

  useEffect(() => {
    void load();
  }, [load]);

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
      await load();
    }
  };

  const elig = calculateCbuaeEligibility(calc);
  const buyout = calculateBuyoutSavings({
    outstandingBalanceAed: elig.requestedLoanAed,
    currentRatePct: 6.25,
    newRatePct: calc.interestRatePct,
    remainingYears: Math.min(20, elig.maxTenureYears),
  });
  const cto = calculateCtoAndAvgBalance(ctoRows);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Mortgage Exclusive Business Desk · 24 UAE Banks & CBUAE Math"
        title="Mortgage Exclusive"
        accent="Business Desk"
        subtitle="Schedules, Form F/FOL deadlines, Bank Valuation bookings & follow-ups, live 24-Bank APL Matrix, 8 CBUAE calculators, and CTO / Average Balance Bank Statement Analyzer."
        actions={
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'schedule', label: 'Schedule & Valuations', icon: CalendarClock },
              { id: 'banks', label: '24 UAE Banks', icon: Building2 },
              { id: 'calculators', label: 'CBUAE Calculators', icon: Calculator },
              { id: 'cto', label: 'CTO / Avg Balance', icon: FileSpreadsheet },
            ].map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id as any)}
                  className={`px-3.5 py-2 rounded-full text-xs font-bold inline-flex items-center gap-1.5 border cursor-pointer ${
                    tab === t.id ? 'bg-[#025e3d] text-[#FCF1B7] border-[#D4AF37]' : 'bg-[var(--bw-card)] border-[var(--bw-line)]'
                  }`}
                >
                  <Icon size={13} /> {t.label}
                </button>
              );
            })}
          </div>
        }
      />

      {tab === 'schedule' && (
        <div className="grid lg:grid-cols-12 gap-6">
          <form onSubmit={bookValuation} className="lg:col-span-5 bw-card p-5 space-y-3 text-xs">
            <h3 className="text-sm font-extrabold">Book Property Valuation &amp; Schedule Follow-Up</h3>
            <div>
              <label className="font-bold block mb-1">Mortgage Case</label>
              <select value={valForm.caseId} onChange={(e) => setValForm({ ...valForm, caseId: e.target.value })} className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-bg)]">
                <option value="">Select case...</option>
                {desk.cases.map((c) => (
                  <option key={c.id} value={c.id}>{c.case_code} · {c.borrower_name} ({c.community})</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-bold block mb-1">Lending Bank</label>
                <select value={valForm.bankKey} onChange={(e) => setValForm({ ...valForm, bankKey: e.target.value })} className="w-full h-9 px-2.5 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-bg)]">
                  {UAE_BANKS.map((b) => <option key={b.key} value={b.key}>{b.name}</option>)}
                </select>
              </div>
              <div>
                <label className="font-bold block mb-1">Valuation Fee (AED)</label>
                <input type="number" value={valForm.feeAed} onChange={(e) => setValForm({ ...valForm, feeAed: Number(e.target.value) })} className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-bg)] font-mono-num" />
              </div>
            </div>
            <input required value={valForm.valuationCompany} onChange={(e) => setValForm({ ...valForm, valuationCompany: e.target.value })} placeholder="Valuation panel firm (CBRE, JLL, Cavendish...)" className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-bg)]" />
            <input required value={valForm.accessContact} onChange={(e) => setValForm({ ...valForm, accessContact: e.target.value })} placeholder="Property access contact / key holder" className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-bg)]" />
            <input type="datetime-local" value={valForm.bookedDate} onChange={(e) => setValForm({ ...valForm, bookedDate: e.target.value })} className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-bg)]" />
            <button type="submit" className="w-full h-10 rounded-full bg-[#007b52] text-white font-bold cursor-pointer">
              Book Valuation &amp; Sync Calendar
            </button>
          </form>

          <div className="lg:col-span-7 space-y-4">
            <div className="bw-card p-5 space-y-3">
              <h3 className="text-sm font-extrabold">Active Bank Valuations ({desk.valuations.length})</h3>
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
              <h3 className="text-sm font-extrabold">Upcoming Deadlines, Valuations &amp; Follow-Ups ({desk.events.length})</h3>
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
      )}

      {tab === 'banks' && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {UAE_BANKS.map((b) => (
            <div key={b.id} className="bw-card p-4 space-y-3 text-xs">
              <div className="flex items-center justify-between gap-2">
                <div className="h-9 px-2.5 rounded-xl bg-white border border-slate-200 flex items-center">
                  <img src={b.logo} alt={b.name} className="h-6 max-w-[110px] object-contain" />
                </div>
                <StatusPill label={b.type} tone={b.type === 'Islamic' ? 'emerald' : 'blue'} />
              </div>
              <div>
                <div className="font-extrabold text-sm">{b.name}</div>
                <div className="text-[11px] text-[var(--bw-muted)]">{b.note}</div>
              </div>
              <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-[var(--bw-line)] font-mono-num">
                <div><div className="text-[9.5px] text-[var(--bw-muted)]">3Y Fixed</div><strong>{b.indicativeFixed3Y}%</strong></div>
                <div><div className="text-[9.5px] text-[var(--bw-muted)]">DSA</div><strong className="text-[#007b52]">{b.dsaRatePct}%</strong></div>
                <div><div className="text-[9.5px] text-[var(--bw-muted)]">SLA</div><strong>{b.slaDays}d</strong></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'calculators' && (
        <div className="grid lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bw-card p-5 space-y-3 text-xs">
            <h3 className="text-sm font-extrabold">CBUAE 50% DBR, LTV, Cash-to-Close &amp; Buyout Modeller</h3>
            <div className="grid grid-cols-2 gap-2.5">
              <div><label className="font-bold block mb-1">Property Price (AED)</label><input type="number" value={calc.propertyPriceAed} onChange={(e) => setCalc({ ...calc, propertyPriceAed: Number(e.target.value) })} className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-bg)] font-mono-num" /></div>
              <div><label className="font-bold block mb-1">Monthly Income (AED)</label><input type="number" value={calc.monthlyIncomeAed} onChange={(e) => setCalc({ ...calc, monthlyIncomeAed: Number(e.target.value) })} className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-bg)] font-mono-num" /></div>
              <div><label className="font-bold block mb-1">Existing EMIs (AED)</label><input type="number" value={calc.existingEmisAed} onChange={(e) => setCalc({ ...calc, existingEmisAed: Number(e.target.value) })} className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-bg)] font-mono-num" /></div>
              <div><label className="font-bold block mb-1">Credit Card Limits</label><input type="number" value={calc.creditCardLimitsAed} onChange={(e) => setCalc({ ...calc, creditCardLimitsAed: Number(e.target.value) })} className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-bg)] font-mono-num" /></div>
              <div>
                <label className="font-bold block mb-1">Residency</label>
                <select value={calc.residency} onChange={(e) => setCalc({ ...calc, residency: e.target.value as any })} className="w-full h-9 px-2.5 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-bg)]">
                  <option value="expat_resident">Expat Resident</option>
                  <option value="uae_national">UAE National</option>
                  <option value="non_resident">Non-Resident</option>
                </select>
              </div>
              <div>
                <label className="font-bold block mb-1">Profile</label>
                <select value={calc.borrowerProfile} onChange={(e) => setCalc({ ...calc, borrowerProfile: e.target.value as any })} className="w-full h-9 px-2.5 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-bg)]">
                  <option value="salaried">Salaried (Max Age 65)</option>
                  <option value="self_employed_full">Self-Employed Full-Doc (Age 70)</option>
                  <option value="self_employed_low_doc">Self-Employed Low-Doc</option>
                  <option value="non_resident">Non-Resident</option>
                </select>
              </div>
              <div><label className="font-bold block mb-1">Age (Years)</label><input type="number" value={calc.ageYears} onChange={(e) => setCalc({ ...calc, ageYears: Number(e.target.value) })} className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-bg)] font-mono-num" /></div>
              <div><label className="font-bold block mb-1">Fixed Rate (%)</label><input type="number" step="0.05" value={calc.interestRatePct} onChange={(e) => setCalc({ ...calc, interestRatePct: Number(e.target.value) })} className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-bg)] font-mono-num" /></div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-4">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <MetricTile label="Eligible Max Loan" value={fmtAed(elig.eligibleLoanAed)} hint={`Max LTV ${elig.maxLtvPct}% · ${elig.maxTenureYears} yrs`} tone="navy" />
              <MetricTile label="Monthly EMI (@ Fixed)" value={fmtAed(elig.monthlyEmiAtRateAed)} hint={`Stressed DBR: ${elig.stressedDbrPct}% (Cap 50%)`} tone={elig.eligible ? 'emerald' : 'red'} />
              <MetricTile label="Total Cash to Close" value={fmtAed(elig.totalCashToCloseAed)} hint={`DLD + Fees: ${fmtAed(elig.dldClosingCostsAed)}`} tone="gold" />
            </div>
            <div className="bw-card p-5 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-extrabold">Buy-Out Refinance Savings (vs 6.25% Revert Rate)</span>
                <StatusPill label={elig.goldenVisaEligible ? 'Golden Visa AED 2M Eligible' : 'Standard Title'} tone={elig.goldenVisaEligible ? 'gold' : 'slate'} />
              </div>
              <div className="grid sm:grid-cols-3 gap-3 pt-2">
                <div>Monthly Savings: <strong className="font-mono-num text-[#007b52]">{fmtAed(buyout.monthlySavingsAed)}/mo</strong></div>
                <div>CBUAE Exit Cap (+VAT): <strong className="font-mono-num">{fmtAed(buyout.earlySettlementInclVat)}</strong></div>
                <div>Break-Even: <strong className="font-mono-num">{buyout.breakEvenMonths} months</strong></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'cto' && (
        <div className="grid lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bw-card p-5 space-y-3">
            <h3 className="text-sm font-extrabold">6-Month Bank Statement CTO &amp; Average Balance Analyzer</h3>
            <div className="space-y-2">
              {ctoRows.map((row, idx) => (
                <div key={row.month} className="grid grid-cols-4 gap-2 text-xs items-center">
                  <span className="font-bold">{row.month}</span>
                  <input type="number" value={row.creditsAed} onChange={(e) => setCtoRows((p) => p.map((r, i) => (i === idx ? { ...r, creditsAed: Number(e.target.value) } : r)))} className="h-8 px-2 rounded-lg border border-[var(--bw-line)] bg-[var(--bw-bg)] font-mono-num" placeholder="Credits" />
                  <input type="number" value={row.minBalanceAed} onChange={(e) => setCtoRows((p) => p.map((r, i) => (i === idx ? { ...r, minBalanceAed: Number(e.target.value) } : r)))} className="h-8 px-2 rounded-lg border border-[var(--bw-line)] bg-[var(--bw-bg)] font-mono-num" placeholder="Min Bal" />
                  <input type="number" value={row.avgBalanceAed} onChange={(e) => setCtoRows((p) => p.map((r, i) => (i === idx ? { ...r, avgBalanceAed: Number(e.target.value) } : r)))} className="h-8 px-2 rounded-lg border border-[var(--bw-line)] bg-[var(--bw-bg)] font-mono-num" placeholder="Avg Bal" />
                </div>
              ))}
            </div>
          </div>
          <div className="lg:col-span-5 bw-card p-5 space-y-3 text-xs">
            <h3 className="text-sm font-extrabold">Betterway Low-Doc &amp; Non-Resident Verdict</h3>
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
      )}
    </div>
  );
}
