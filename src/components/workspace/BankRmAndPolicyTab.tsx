'use client';

import React, { useMemo, useState } from 'react';
import {
  Building2,
  CheckCircle2,
  Mail,
  Phone,
  Search,
  Sparkles,
  Zap,
} from 'lucide-react';
import { fmtAed, GlossyBlackCard, StatusPill } from '@/components/os/UiKit';
import {
  answerBankPolicyQuery,
  evaluateAllBanksEligibility,
  UAE_BANK_POLICIES,
  UAE_BANK_RMS,
} from '@/lib/domain/bank-intelligence';

export function BankRmAndPolicyTab({ mode }: { mode: 'matcher' | 'matrix' | 'rms' }) {
  // 60-Second Multi-Bank Eligibility Matcher
  const [income, setIncome] = useState(35_000);
  const [propVal, setPropVal] = useState(2_800_000);
  const [emis, setEmis] = useState(1_500);
  const [ccLimits, setCcLimits] = useState(40_000);
  const [residency, setResidency] = useState<'uae_national' | 'expat_resident' | 'non_resident'>('expat_resident');
  const [employment, setEmployment] = useState<'salaried' | 'self_employed'>('salaried');
  const [pref, setPref] = useState<'all' | 'islamic' | 'conventional'>('all');
  const [tenorY, setTenorY] = useState(25);

  // Instant AI Bank Policy Finder
  const [policyQ, setPolicyQ] = useState('Non-Resident 60% LTV');

  // 18-Bank Matrix filters
  const [matrixFilter, setMatrixFilter] = useState<'all' | 'islamic' | 'conventional' | 'nonres' | 'fastpass' | 'selfemp' | 'commercial'>('all');
  const [matrixSearch, setMatrixSearch] = useState('');

  // 140+ RM Directory filters
  const [rmBank, setRmBank] = useState('ALL');
  const [rmSearch, setRmSearch] = useState('');

  const matches = useMemo(
    () =>
      evaluateAllBanksEligibility({
        monthlyIncomeAed: income,
        propertyValueAed: propVal,
        existingEmisAed: emis,
        creditCardLimitsAed: ccLimits,
        residency,
        employment,
        preference: pref,
        tenorYears: tenorY,
      }),
    [income, propVal, emis, ccLimits, residency, employment, pref, tenorY],
  );

  const aiAnswer = useMemo(() => answerBankPolicyQuery(policyQ), [policyQ]);

  const filteredMatrix = useMemo(() => {
    const q = matrixSearch.trim().toLowerCase();
    return UAE_BANK_POLICIES.filter((b) => {
      if (matrixFilter === 'islamic' && !b.loanType.includes('Islamic')) return false;
      if (matrixFilter === 'conventional' && !b.loanType.includes('Conventional')) return false;
      if (matrixFilter === 'nonres' && !b.nonResidentSupported) return false;
      if (matrixFilter === 'fastpass' && !b.fastPass14Day) return false;
      if (matrixFilter === 'selfemp' && b.selfEmployedFriendly === 'Strict') return false;
      if (matrixFilter === 'commercial' && !b.commercialSupported) return false;
      if (q && !`${b.name} ${b.short} ${b.stlFixedSummary} ${b.keyNotes} ${b.emirates}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [matrixFilter, matrixSearch]);

  const rmBanks = useMemo(() => ['ALL', ...Array.from(new Set(UAE_BANK_RMS.map((r) => r.bank)))], []);
  const filteredRms = useMemo(() => {
    const q = rmSearch.trim().toLowerCase();
    return UAE_BANK_RMS.filter((r) => {
      if (rmBank !== 'ALL' && r.bank !== rmBank) return false;
      if (q && !`${r.bank} ${r.desk} ${r.rmName} ${r.phone} ${r.email} ${r.escalationName || ''}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [rmBank, rmSearch]);

  if (mode === 'matcher') {
    const eligibleCount = matches.filter((m) => m.verdict === 'Eligible').length;
    const fastPassCount = matches.filter((m) => m.verdict === 'Eligible' && m.bank.fastPass14Day).length;

    return (
      <div className="space-y-6">
        {/* Top Row: Instant 60-Second Eligibility Matcher + AI Policy Finder */}
        <div className="grid lg:grid-cols-12 gap-5">
          <div className="lg:col-span-7 bw-card p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="font-display text-base font-extrabold flex items-center gap-2">
                  <Zap size={16} className="text-[#119c78]" /> 60-Second Instant Multi-Bank Matcher
                </h2>
                <p className="text-xs text-[var(--bw-muted)]">
                  Enter client numbers once to see every matching UAE bank, exact LTV, stressed DBR &amp; 14-Day Fast-Pass lenders.
                </p>
              </div>
              <div className="flex gap-1.5">
                <StatusPill label={`${eligibleCount} Eligible Banks`} tone="emerald" />
                <StatusPill label={`${fastPassCount} Fast-Pass`} tone="gold" />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
              <div>
                <label className="font-bold block mb-1">Monthly Income (AED)</label>
                <input type="number" value={income} onChange={(e) => setIncome(Number(e.target.value))} className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] font-mono-num font-bold" />
              </div>
              <div>
                <label className="font-bold block mb-1">Property Value (AED)</label>
                <input type="number" value={propVal} onChange={(e) => setPropVal(Number(e.target.value))} className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] font-mono-num font-bold" />
              </div>
              <div>
                <label className="font-bold block mb-1">Existing EMIs (AED)</label>
                <input type="number" value={emis} onChange={(e) => setEmis(Number(e.target.value))} className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] font-mono-num" />
              </div>
              <div>
                <label className="font-bold block mb-1">Credit Card Limits</label>
                <input type="number" value={ccLimits} onChange={(e) => setCcLimits(Number(e.target.value))} className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] font-mono-num" />
              </div>
              <div>
                <label className="font-bold block mb-1">Residency</label>
                <select value={residency} onChange={(e) => setResidency(e.target.value as any)} className="w-full h-9 px-2.5 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)]">
                  <option value="expat_resident">UAE Expat Resident</option>
                  <option value="uae_national">UAE National</option>
                  <option value="non_resident">Non-Resident</option>
                </select>
              </div>
              <div>
                <label className="font-bold block mb-1">Work Type</label>
                <select value={employment} onChange={(e) => setEmployment(e.target.value as any)} className="w-full h-9 px-2.5 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)]">
                  <option value="salaried">Salaried</option>
                  <option value="self_employed">Self-Employed</option>
                </select>
              </div>
              <div>
                <label className="font-bold block mb-1">Bank Type</label>
                <select value={pref} onChange={(e) => setPref(e.target.value as any)} className="w-full h-9 px-2.5 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)]">
                  <option value="all">All (Islamic &amp; Conv.)</option>
                  <option value="islamic">Islamic Only</option>
                  <option value="conventional">Conventional Only</option>
                </select>
              </div>
              <div>
                <label className="font-bold block mb-1">Tenor (Years)</label>
                <input type="number" min={5} max={25} value={tenorY} onChange={(e) => setTenorY(Number(e.target.value))} className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] font-mono-num" />
              </div>
            </div>

            <div className="space-y-2 max-h-[380px] overflow-y-auto pe-1">
              {matches.map((m) => (
                <div
                  key={m.bank.code}
                  className="p-3.5 rounded-2xl border border-[var(--bw-line)] bg-[var(--bw-soft)]/70 flex flex-wrap items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-display font-extrabold text-sm text-[var(--bw-ink)]">{m.bank.name}</span>
                      <StatusPill
                        label={m.verdict}
                        tone={m.verdict === 'Eligible' ? 'emerald' : m.verdict === 'Borderline' ? 'gold' : 'red'}
                      />
                      {m.bank.fastPass14Day && <StatusPill label={`Fast-Pass ~${m.bank.totalTatDays}d`} tone="navy" />}
                      <StatusPill label={m.bank.loanType} tone="slate" />
                    </div>
                    <div className="text-[11px] text-[var(--bw-muted)]">{m.reasons[0]}</div>
                  </div>
                  <div className="flex items-center gap-4 font-mono-num text-end shrink-0">
                    <div>
                      <div className="text-[10px] text-[var(--bw-muted)]">From Rate</div>
                      <div className="font-extrabold text-[#119c78]">{m.bank.indicativeBestRatePct}%</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-[var(--bw-muted)]">Max Loan ({m.maxAllowedLtvPct}%)</div>
                      <div className="font-extrabold">{fmtAed(m.maxLoanForPropertyAed, true)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-[var(--bw-muted)]">Est. EMI</div>
                      <div className="font-extrabold">{fmtAed(m.estimatedMonthlyEmiAed)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-[var(--bw-muted)]">Stress DBR</div>
                      <div className={`font-extrabold ${m.stressedDbrPct <= 50 ? 'text-[#119c78]' : 'text-[#e11d48]'}`}>
                        {m.stressedDbrPct}%
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Glossy Black Instant AI Bank Policy Finder */}
          <GlossyBlackCard className="lg:col-span-5 p-5 space-y-4" accent="dual">
            <div>
              <div className="inline-flex items-center gap-1.5 text-[10.5px] font-extrabold uppercase tracking-[0.14em] text-[#34f0bc]">
                <Sparkles size={13} className="text-[#fbe8a4]" /> Instant AI Bank Policy Finder
              </div>
              <h3 className="font-display text-lg font-extrabold text-white mt-1">
                Ask any UAE bank policy rule
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Instant answers directly from Betterway&apos;s 18-bank policy sheet + direct RM contact.
              </p>
            </div>

            <div className="relative">
              <Search size={15} className="absolute start-3.5 top-1/2 -translate-y-1/2 text-[#34f0bc]" />
              <input
                value={policyQ}
                onChange={(e) => setPolicyQ(e.target.value)}
                placeholder="Ask: airline pilots, non-resident, 30% partial, optional life..."
                className="w-full h-10 ps-10 pe-3 rounded-xl bg-white/10 border border-white/15 text-xs text-white placeholder:text-slate-400 outline-none focus:border-[#22e2ad]"
              />
            </div>

            <div className="flex flex-wrap gap-1.5 text-[11px]">
              {[
                'Non-Resident 60% LTV',
                'Emirates Airline pilots',
                'Optional life / free property',
                '30% free partial settlement',
                'Self-employed low doc',
                'Fastest 11-day TAT',
              ].map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => setPolicyQ(chip)}
                  className={`px-2.5 py-1 rounded-full font-bold cursor-pointer transition ${
                    policyQ === chip
                      ? 'bg-[#22e2ad] text-[#070e1a]'
                      : 'bg-white/10 text-slate-200 hover:bg-white/20'
                  }`}
                >
                  {chip}
                </button>
              ))}
            </div>

            <div className="space-y-2.5 pt-2 border-t border-white/12 max-h-[380px] overflow-y-auto pe-1">
              <div className="text-xs font-extrabold text-[#fbe8a4]">{aiAnswer.headline}</div>
              {aiAnswer.matchedBanks.map((hit) => (
                <div key={hit.bank} className="p-3 rounded-xl bg-white/[0.06] border border-white/10 text-xs space-y-1">
                  <div className="font-extrabold text-white flex items-center gap-1.5">
                    <CheckCircle2 size={13} className="text-[#34f0bc] shrink-0" /> {hit.bank}
                  </div>
                  <div className="text-[11px] text-slate-300 leading-relaxed">{hit.highlight}</div>
                  {hit.rmContact && (
                    <div className="text-[10.5px] font-semibold text-[#fbe8a4] pt-0.5">
                      Direct RM: {hit.rmContact}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </GlossyBlackCard>
        </div>
      </div>
    );
  }

  if (mode === 'matrix') {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1.5 text-xs">
            {[
              ['all', `All ${UAE_BANK_POLICIES.length} UAE Banks`],
              ['fastpass', 'Fast-Pass (11–15d)'],
              ['islamic', 'Islamic'],
              ['conventional', 'Conventional'],
              ['selfemp', 'Self-Employed'],
              ['commercial', 'Commercial'],
              ['nonres', 'Non-Resident'],
            ].map(([k, label]) => (
              <button
                key={k}
                type="button"
                onClick={() => setMatrixFilter(k as any)}
                className={`px-3.5 py-1.5 rounded-full font-extrabold cursor-pointer transition ${
                  matrixFilter === k
                    ? 'bg-[#0a0e14] text-[#34f0bc] border border-[#22e2ad]/50'
                    : 'bg-[var(--bw-card)] border border-[var(--bw-line)] text-[var(--bw-body)]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <input
            value={matrixSearch}
            onChange={(e) => setMatrixSearch(e.target.value)}
            placeholder="Filter bank, rate, Emirates, policy..."
            className="h-9 px-3.5 rounded-full border border-[var(--bw-line-strong)] bg-[var(--bw-card)] text-xs w-64"
          />
        </div>

        <div className="bw-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs min-w-[1100px]">
              <thead>
                <tr className="bg-[#0a0e14] text-white text-[10.5px] uppercase tracking-wider">
                  <th className="py-3 px-3.5 text-start">Bank &amp; Type</th>
                  <th className="py-3 px-3 text-start">STL Fixed (2026)</th>
                  <th className="py-3 px-3 text-start">NSTL &amp; Self-Employed</th>
                  <th className="py-3 px-3 text-start">Post-Fixed Margin</th>
                  <th className="py-3 px-3 text-start">Fees &amp; Insurance</th>
                  <th className="py-3 px-3 text-start">Partial / Exit</th>
                  <th className="py-3 px-3 text-start">Max LTV / Min Sal / TAT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--bw-line)]">
                {filteredMatrix.map((b) => (
                  <tr key={b.code} className="hover:bg-[var(--bw-hover)] align-top">
                    <td className="py-3 px-3.5">
                      <div className="font-display font-extrabold text-sm text-[var(--bw-ink)]">{b.name}</div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        <StatusPill label={b.loanType} tone={b.loanType === 'Islamic' ? 'emerald' : 'blue'} />
                        {b.fastPass14Day && <StatusPill label="Fast-Pass" tone="gold" />}
                      </div>
                      <div className="text-[10.5px] text-[var(--bw-muted)] mt-1">{b.emirates}</div>
                    </td>
                    <td className="py-3 px-3 font-semibold text-[#0b5442] dark:text-[#34f0bc] max-w-[200px]">
                      {b.stlFixedSummary}
                    </td>
                    <td className="py-3 px-3 max-w-[220px] space-y-1">
                      <div><strong>NSTL:</strong> {b.nstlFixedSummary}</div>
                      <div className="text-[11px] text-[var(--bw-muted)]"><strong>SE:</strong> {b.selfEmployedFixedSummary}</div>
                      <div className="text-[11px] text-[var(--bw-muted)]"><strong>NR:</strong> {b.nonResidentFixedSummary}</div>
                    </td>
                    <td className="py-3 px-3 max-w-[180px] text-[11px]">
                      <div className="font-bold">{b.postFixedMargin}</div>
                      <div className="text-[var(--bw-muted)] mt-0.5">Stress: {b.stressTestRule}</div>
                    </td>
                    <td className="py-3 px-3 max-w-[200px] text-[11px] space-y-0.5">
                      <div><strong>PF:</strong> {b.processingFee}</div>
                      <div><strong>Val:</strong> {b.valuationFee}</div>
                      <div><strong>Life:</strong> {b.lifeInsurancePaPct}% · <strong>Prop:</strong> {b.propertyInsurancePaPct}%</div>
                    </td>
                    <td className="py-3 px-3 max-w-[180px] text-[11px] space-y-0.5">
                      <div><strong>Partial:</strong> {b.partialSettlement}</div>
                      <div className="text-[var(--bw-muted)]"><strong>Exit:</strong> {b.earlySettlement}</div>
                    </td>
                    <td className="py-3 px-3 text-[11px] font-mono-num space-y-0.5">
                      <div>Local {b.maxLtvLocalPct}% · Expat {b.maxLtvExpatPct}% · NR {b.maxLtvNonResPct}%</div>
                      <div>Min Sal: {fmtAed(b.minSalaryExpatAed)} · Max {fmtAed(b.maxLoanAed, true)}</div>
                      <div className="font-sans font-bold text-[#119c78]">TAT: ~{b.totalTatDays} working days (PA {b.paTatDays}d)</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // mode === 'rms' (140+ Direct Bank RM & Escalation Directory)
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-base font-extrabold flex items-center gap-2">
            <Building2 size={16} className="text-[#119c78]" /> Direct UAE Bank RM &amp; Escalation Directory ({filteredRms.length} Contacts)
          </h2>
          <p className="text-xs text-[var(--bw-muted)]">
            1-click call or email verified bank RMs, submission desks, and escalation heads across 18 UAE lenders.
          </p>
        </div>
        <input
          value={rmSearch}
          onChange={(e) => setRmSearch(e.target.value)}
          placeholder="Search RM name, bank, phone, escalation..."
          className="h-9 px-4 rounded-full border border-[var(--bw-line-strong)] bg-[var(--bw-card)] text-xs w-72"
        />
      </div>

      <div className="flex flex-wrap gap-1.5 text-xs">
        {rmBanks.map((bank) => (
          <button
            key={bank}
            type="button"
            onClick={() => setRmBank(bank)}
            className={`px-3 py-1.5 rounded-full font-bold cursor-pointer transition ${
              rmBank === bank
                ? 'bg-[#0a0e14] text-[#34f0bc] border border-[#22e2ad]/50'
                : 'bg-[var(--bw-card)] border border-[var(--bw-line)]'
            }`}
          >
            {bank}
          </button>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredRms.map((rm, i) => (
          <div key={`${rm.bank}-${rm.rmName}-${i}`} className="bw-card p-4 space-y-2.5 text-xs">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-[10.5px] font-extrabold uppercase tracking-wider text-[#119c78]">
                  {rm.bank} · {rm.desk}
                </div>
                <div className="font-display font-extrabold text-sm text-[var(--bw-ink)] mt-0.5">{rm.rmName}</div>
              </div>
              <StatusPill
                label={rm.directSubmissionAllowed ? 'Direct OK' : 'No Direct Sub'}
                tone={rm.directSubmissionAllowed ? 'emerald' : 'gold'}
              />
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {rm.phone && (
                <a
                  href={`tel:${rm.phone.replace(/\s+/g, '')}`}
                  className="px-3 py-1.5 rounded-full bg-[#0a0e14] text-[#34f0bc] font-mono-num font-bold inline-flex items-center gap-1 hover:brightness-110"
                >
                  <Phone size={11} /> {rm.phone}
                </a>
              )}
              {rm.email && (
                <a
                  href={`mailto:${rm.email}`}
                  className="px-3 py-1.5 rounded-full bg-[var(--bw-soft)] border border-[var(--bw-line)] text-[var(--bw-ink)] font-semibold inline-flex items-center gap-1 hover:border-[#119c78] truncate max-w-full"
                >
                  <Mail size={11} className="text-[#119c78] shrink-0" />
                  <span className="truncate">{rm.email}</span>
                </a>
              )}
            </div>

            {rm.escalationName && (
              <div className="pt-2 border-t border-[var(--bw-line)] text-[11px] text-[var(--bw-muted)]">
                <strong className="text-[#9a7123] dark:text-[#fbe8a4]">Escalation POC:</strong> {rm.escalationName}
                {rm.escalationPhone ? ` · ${rm.escalationPhone}` : ''}
                {rm.escalationEmail ? ` · ${rm.escalationEmail}` : ''}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
