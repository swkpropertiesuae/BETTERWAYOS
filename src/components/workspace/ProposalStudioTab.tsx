'use client';

import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Copy,
  Download,
  FileSpreadsheet,
  FileText,
  Image as ImageIcon,
  Printer,
  Sparkles,
} from 'lucide-react';
import { useOs } from '@/components/os/OsProvider';
import { fmtAed, GlossyBlackCard, StatusPill } from '@/components/os/UiKit';
import {
  calculateProposalOption,
  PROPOSAL_DOCUMENT_CHECKLISTS,
  UAE_BANK_POLICIES,
} from '@/lib/domain/bank-intelligence';
import { downloadJpegDocument, downloadWordDocument, printBrandedDocument } from '@/lib/workspace/exporters';

interface OptionDraft {
  bankCode: string;
  fixedRatePct: number;
  fixedMonths: number;
  variableRatePct: number;
  lifeInsurancePaPct: number;
  processingFeePct: number;
  valuationFeeAed: number;
}

function defaultForBank(code: string): OptionDraft {
  const b = UAE_BANK_POLICIES.find((x) => x.code === code) || UAE_BANK_POLICIES[0];
  return {
    bankCode: b.code,
    fixedRatePct: b.indicativeBestRatePct,
    fixedMonths: b.code === 'RAK' || b.code === 'MASHREQ' || b.code === 'SCB' ? 24 : 36,
    variableRatePct: Number((b.indicativeBestRatePct + 1.65).toFixed(2)),
    lifeInsurancePaPct: b.lifeInsurancePaPct,
    processingFeePct: b.code === 'SCB' ? 0 : 0.25,
    valuationFeeAed: b.valuationFeeAed,
  };
}

export function ProposalStudioTab() {
  const { user, toast } = useOs();
  const [clientName, setClientName] = useState('Valued Betterway Client');
  const [emirate, setEmirate] = useState('Dubai');
  const [profile, setProfile] = useState<string>('Salaried');
  const [txType, setTxType] = useState('Ready Purchase');
  const [mortgageType, setMortgageType] = useState<'Conventional' | 'Islamic'>('Conventional');
  const [propertyValueAed, setPropertyValueAed] = useState(3_500_000);
  const [ltvPct, setLtvPct] = useState(80);
  const [tenorMonths, setTenorMonths] = useState(300);
  const [personalLoanAed, setPersonalLoanAed] = useState(0);
  const [lumpSumMonth12Aed, setLumpSumMonth12Aed] = useState(0);
  const [downloadingXlsx, setDownloadingXlsx] = useState(false);

  const [optA, setOptA] = useState<OptionDraft>(() => defaultForBank('ENBD'));
  const [optB, setOptB] = useState<OptionDraft>(() => defaultForBank('ADIB'));
  const [optC, setOptC] = useState<OptionDraft>(() => defaultForBank('CBD'));
  const [activeScheduleIdx, setActiveScheduleIdx] = useState<0 | 1 | 2>(0);

  const loanAmountAed = Math.round((propertyValueAed * ltvPct) / 100);

  const computed = useMemo(
    () =>
      [optA, optB, optC].map((opt) =>
        calculateProposalOption({
          ...opt,
          propertyValueAed,
          loanAmountAed,
          tenorMonths,
          personalLoanAmountAed: personalLoanAed,
          personalLoanMonths: 48,
          lumpSumAtMonth12Aed: lumpSumMonth12Aed,
        }),
      ),
    [optA, optB, optC, propertyValueAed, loanAmountAed, tenorMonths, personalLoanAed, lumpSumMonth12Aed],
  );

  const bestIdx = useMemo(() => {
    let idx = 0;
    for (let i = 1; i < computed.length; i++) {
      if (computed[i].fixedPeriodTotalMonthlyAed < computed[idx].fixedPeriodTotalMonthlyAed) idx = i;
    }
    return idx;
  }, [computed]);

  const checklist = PROPOSAL_DOCUMENT_CHECKLISTS[profile] ?? PROPOSAL_DOCUMENT_CHECKLISTS.Salaried;

  const buildDocPayload = () => ({
    filename: `Betterway_3Bank_Proposal_${clientName.replace(/[^A-Za-z0-9]+/g, '_')}`,
    badge: `BETTERWAY 3-BANK MORTGAGE PROPOSAL · ${emirate.toUpperCase()} · ${mortgageType.toUpperCase()}`,
    title: `UAE Mortgage Proposal for ${clientName}`,
    subtitle: `${profile} · ${txType} · Property ${fmtAed(propertyValueAed)} · Loan ${fmtAed(loanAmountAed)} (${ltvPct}% LTV) · ${Math.round(tenorMonths / 12)} Years`,
    sealedBy: user?.name || 'Betterway Mortgages LLC',
    metaPairs: [
      { label: 'Client & Advisor', value: `${clientName} · Advisor: ${user?.name || 'Betterway Advisory Desk'}` },
      { label: 'Property Value & LTV', value: `${fmtAed(propertyValueAed)} · ${ltvPct}% LTV → Loan ${fmtAed(loanAmountAed)}` },
      { label: 'Profile & Transaction', value: `${profile} · ${txType} · ${mortgageType} · ${emirate}` },
      { label: 'Broker Advisory Fee', value: 'AED 0 (100% Zero Client Broker Fee · Direct Bank Settlement)' },
    ],
    sections: [
      ...computed.map((c, idx) => ({
        heading: `Option ${idx + 1}: ${c.bankName} — ${c.fixedRatePct}% Fixed (${c.fixedMonths}m) → ${c.variableRatePct}% Post-Fixed`,
        rows: [
          { label: 'Fixed Period Monthly EMI', value: `${fmtAed(c.fixedPeriodEmiAed)} / mo (+ Life Ins → ${fmtAed(c.fixedPeriodTotalMonthlyAed)} / mo)` },
          { label: 'Post-Fixed Estimated EMI', value: `${fmtAed(c.postFixedEmiAed)} / mo` },
          { label: 'Total Cash Required to Close', value: `${fmtAed(c.cashToCloseAed)} (Down Payment ${fmtAed(c.downPaymentAed)} + DLD ${fmtAed(c.dldTransferFeeAed)} + Mortgage Reg ${fmtAed(c.dldMortgageRegAed)} + Val ${fmtAed(c.valuationFeeAed)})` },
          { label: 'Life Insurance & Valuation', value: `${c.lifeInsurancePaPct}% p.a. · Valuation ${fmtAed(c.valuationFeeAed)} · Est. Processing ${fmtAed(c.processingFeeEstAed)}` },
          ...(personalLoanAed > 0 ? [{ label: 'Combined Monthly (with P-Loan)', value: `${fmtAed(c.combinedMonthlyWithPLoanAed)} / mo` }] : []),
        ],
      })),
      {
        heading: `Required Documents Checklist (${profile})`,
        text: checklist.join('\n'),
      },
    ],
  });

  const downloadProposalExcel = async () => {
    setDownloadingXlsx(true);
    try {
      const r = await fetch('/api/v1/utilities/proposal-excel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName,
          advisorName: user?.name || 'Betterway Advisor',
          emirate,
          profile,
          txType,
          mortgageType,
          propertyValueAed,
          loanAmountAed,
          ltvPct,
          tenorMonths,
          personalLoanAed,
          lumpSumMonth12Aed,
          options: [optA, optB, optC],
        }),
      });
      if (!r.ok) {
        toast('Could not generate Excel proposal', 'err');
        return;
      }
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Betterway_Proposal_${clientName.replace(/[^A-Za-z0-9]+/g, '_')}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast('Downloaded 3-Bank Proposal + Amortization Excel (.xlsx)!');
    } finally {
      setDownloadingXlsx(false);
    }
  };

  const copyWhatsAppQuote = () => {
    const lines = [
      `*Betterway Mortgages LLC — UAE Mortgage Proposal*`,
      `Client: ${clientName} (${profile} · ${emirate})`,
      `Property: ${fmtAed(propertyValueAed)} | Loan: ${fmtAed(loanAmountAed)} (${ltvPct}% LTV · ${Math.round(tenorMonths / 12)} yrs)`,
      '',
      ...computed.map(
        (c, i) =>
          `*Option ${i + 1}: ${c.bankName}* — ${c.fixedRatePct}% Fixed (${c.fixedMonths}m)\n• Monthly EMI: ${fmtAed(c.fixedPeriodEmiAed)} (Total w/ Life: ${fmtAed(c.fixedPeriodTotalMonthlyAed)})\n• Cash to Close: ${fmtAed(c.cashToCloseAed)} | Valuation: ${fmtAed(c.valuationFeeAed)}`,
      ),
      '',
      `Zero Client Broker Fee · Direct CBUAE Bank Panel`,
    ];
    void navigator.clipboard?.writeText(lines.join('\n'));
    toast('Copied WhatsApp-ready 3-Bank Proposal to clipboard!');
  };

  const setters = [setOptA, setOptB, setOptC];
  const drafts = [optA, optB, optC];
  const activeOption = computed[activeScheduleIdx];

  return (
    <div className="space-y-5">
      {/* Header + Export Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-extrabold flex items-center gap-2">
            <Sparkles size={17} className="text-[#119c78]" /> 3-Bank Auto-Eco Proposal Maker (Excel · Word · JPEG · WhatsApp)
          </h2>
          <p className="text-xs text-[var(--bw-muted)]">
            Built directly from Betterway&apos;s Proposal Sheet Auto-Eco workbook: compare 3 UAE banks side-by-side with full 300-month amortization, life insurance, optional personal loan top-up, and client document checklist.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <button type="button" onClick={copyWhatsAppQuote} className="bw-btn bw-btn-outline py-2 min-h-[36px] text-xs">
            <Copy size={13} /> Copy WhatsApp
          </button>
          <button
            type="button"
            disabled={downloadingXlsx}
            onClick={() => void downloadProposalExcel()}
            className="bw-btn bw-btn-primary py-2 min-h-[36px] text-xs"
          >
            <FileSpreadsheet size={13} /> {downloadingXlsx ? 'Building .xlsx…' : 'Export Excel (.xlsx)'}
          </button>
          <button type="button" onClick={() => downloadWordDocument(buildDocPayload())} className="bw-btn bw-btn-obsidian py-2 min-h-[36px] text-xs">
            <FileText size={13} /> .DOC
          </button>
          <button type="button" onClick={() => void downloadJpegDocument(buildDocPayload())} className="bw-btn bw-btn-gold py-2 min-h-[36px] text-xs">
            <ImageIcon size={13} /> .JPEG
          </button>
          <button type="button" onClick={() => printBrandedDocument(buildDocPayload())} className="bw-btn bw-btn-outline py-2 min-h-[36px] text-xs">
            <Printer size={13} /> PDF
          </button>
        </div>
      </div>

      {/* Borrower & Loan Inputs */}
      <div className="bw-card p-5 grid sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
        <div>
          <label className="font-bold block mb-1">Client Full Name</label>
          <input value={clientName} onChange={(e) => setClientName(e.target.value)} className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] font-semibold" />
        </div>
        <div>
          <label className="font-bold block mb-1">Borrower Profile</label>
          <select value={profile} onChange={(e) => setProfile(e.target.value)} className="w-full h-9 px-2.5 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] font-semibold">
            {Object.keys(PROPOSAL_DOCUMENT_CHECKLISTS).map((k) => (
              <option key={k}>{k}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="font-bold block mb-1">Transaction &amp; Emirate</label>
          <div className="grid grid-cols-2 gap-1.5">
            <select value={txType} onChange={(e) => setTxType(e.target.value)} className="h-9 px-2 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)]">
              <option>Ready Purchase</option>
              <option>Handover</option>
              <option>Buyout</option>
              <option>Equity Release</option>
              <option>Buyout + Equity</option>
            </select>
            <select value={emirate} onChange={(e) => setEmirate(e.target.value)} className="h-9 px-2 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)]">
              <option>Dubai</option>
              <option>Abu Dhabi</option>
              <option>Sharjah</option>
              <option>RAK</option>
              <option>Ajman</option>
            </select>
          </div>
        </div>
        <div>
          <label className="font-bold block mb-1">Property Value (AED)</label>
          <input type="number" value={propertyValueAed} onChange={(e) => setPropertyValueAed(Number(e.target.value))} className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] font-mono-num font-bold" />
        </div>
        <div>
          <label className="font-bold block mb-1">LTV % &amp; Tenor (Months)</label>
          <div className="grid grid-cols-2 gap-1.5">
            <input type="number" min={20} max={85} value={ltvPct} onChange={(e) => setLtvPct(Number(e.target.value))} className="h-9 px-2.5 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] font-mono-num font-bold" />
            <input type="number" min={60} max={300} value={tenorMonths} onChange={(e) => setTenorMonths(Number(e.target.value))} className="h-9 px-2.5 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] font-mono-num font-bold" />
          </div>
        </div>
        <div>
          <label className="font-bold block mb-1">Islamic / Conventional</label>
          <select value={mortgageType} onChange={(e) => setMortgageType(e.target.value as any)} className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] font-semibold">
            <option>Conventional</option>
            <option>Islamic</option>
          </select>
        </div>
        <div>
          <label className="font-bold block mb-1">Calculated Loan (AED)</label>
          <div className="h-9 px-3 rounded-xl bg-[#0a0e14] text-[#34f0bc] font-mono-num font-extrabold flex items-center">
            {fmtAed(loanAmountAed)}
          </div>
        </div>
        <div>
          <label className="font-bold block mb-1">Optional Personal Loan (48m)</label>
          <input type="number" value={personalLoanAed} onChange={(e) => setPersonalLoanAed(Number(e.target.value))} placeholder="0" className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] font-mono-num" />
        </div>
        <div>
          <label className="font-bold block mb-1">Month-12 Lump Sum (AED)</label>
          <input type="number" value={lumpSumMonth12Aed} onChange={(e) => setLumpSumMonth12Aed(Number(e.target.value))} placeholder="0" className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] font-mono-num" />
        </div>
        <div className="flex items-end">
          <div className="w-full h-9 px-3 rounded-xl bg-[var(--bw-mint-soft)] border border-[#9be8ce] text-[#053b2e] font-bold flex items-center justify-center">
            Down Payment: {fmtAed(Math.max(0, propertyValueAed - loanAmountAed), true)}
          </div>
        </div>
      </div>

      {/* 3 Glossy Floating Shining Black Side-by-Side Bank Option Cards */}
      <div className="grid lg:grid-cols-3 gap-5">
        {computed.map((opt, idx) => {
          const draft = drafts[idx];
          const setter = setters[idx];
          const isBest = idx === bestIdx;
          return (
            <GlossyBlackCard key={idx} className="p-5 space-y-4" accent={isBest ? 'emerald' : 'gold'}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#fbe8a4]">
                  Option {String.fromCharCode(65 + idx)}
                </span>
                {isBest && (
                  <span className="px-2.5 py-0.5 rounded-full bg-[#22e2ad] text-[#070e1a] text-[10px] font-extrabold">
                    Lowest Monthly
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="col-span-2">
                  <label className="text-[10.5px] font-bold text-slate-400 block mb-1">Choose UAE Bank</label>
                  <select
                    value={draft.bankCode}
                    onChange={(e) => setter(defaultForBank(e.target.value))}
                    className="w-full h-9 px-3 rounded-xl bg-white/10 border border-white/15 text-white font-bold outline-none"
                  >
                    {UAE_BANK_POLICIES.map((b) => (
                      <option key={b.code} value={b.code} className="text-black">
                        {b.name} ({b.indicativeBestRatePct}% from · {b.loanType})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">Fixed Rate (%)</label>
                  <input
                    type="number"
                    step="0.05"
                    value={draft.fixedRatePct}
                    onChange={(e) => setter({ ...draft, fixedRatePct: Number(e.target.value) })}
                    className="w-full h-8 px-2.5 rounded-lg bg-white/10 border border-white/15 text-white font-mono-num font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">Fixed Months</label>
                  <input
                    type="number"
                    value={draft.fixedMonths}
                    onChange={(e) => setter({ ...draft, fixedMonths: Number(e.target.value) })}
                    className="w-full h-8 px-2.5 rounded-lg bg-white/10 border border-white/15 text-white font-mono-num font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">Post-Fixed (%)</label>
                  <input
                    type="number"
                    step="0.05"
                    value={draft.variableRatePct}
                    onChange={(e) => setter({ ...draft, variableRatePct: Number(e.target.value) })}
                    className="w-full h-8 px-2.5 rounded-lg bg-white/10 border border-white/15 text-white font-mono-num"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">Life Ins (% p.a.)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={draft.lifeInsurancePaPct}
                    onChange={(e) => setter({ ...draft, lifeInsurancePaPct: Number(e.target.value) })}
                    className="w-full h-8 px-2.5 rounded-lg bg-white/10 border border-white/15 text-white font-mono-num"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-white/12 space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-slate-300">Monthly EMI + Life</span>
                  <span className="font-display text-2xl font-extrabold font-mono-num text-[#34f0bc]">
                    {fmtAed(opt.fixedPeriodTotalMonthlyAed)}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono-num">
                  <div className="p-2.5 rounded-xl bg-white/[0.06]">
                    <div className="text-slate-400 text-[10px]">Principal + Profit EMI</div>
                    <div className="font-bold text-white">{fmtAed(opt.fixedPeriodEmiAed)}</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/[0.06]">
                    <div className="text-slate-400 text-[10px]">Post-Fixed EMI</div>
                    <div className="font-bold text-[#fbe8a4]">{fmtAed(opt.postFixedEmiAed)}</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/[0.06]">
                    <div className="text-slate-400 text-[10px]">Cash to Close</div>
                    <div className="font-bold text-white">{fmtAed(opt.cashToCloseAed, true)}</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/[0.06]">
                    <div className="text-slate-400 text-[10px]">Valuation + PF</div>
                    <div className="font-bold text-slate-200">{fmtAed(opt.valuationFeeAed + opt.processingFeeEstAed)}</div>
                  </div>
                </div>
                {personalLoanAed > 0 && (
                  <div className="p-2.5 rounded-xl bg-[#22e2ad]/15 border border-[#22e2ad]/35 text-[11px] flex justify-between font-bold text-[#34f0bc]">
                    <span>Combined w/ Personal Loan:</span>
                    <span className="font-mono-num">{fmtAed(opt.combinedMonthlyWithPLoanAed)}/mo</span>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setActiveScheduleIdx(idx as 0 | 1 | 2)}
                className={`w-full py-2 rounded-full text-xs font-extrabold cursor-pointer transition ${
                  activeScheduleIdx === idx
                    ? 'bg-[#22e2ad] text-[#070e1a]'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                {activeScheduleIdx === idx ? 'Showing Amortization Below ✓' : 'View 300-Month Schedule'}
              </button>
            </GlossyBlackCard>
          );
        })}
      </div>

      {/* Bottom Split: Amortization Schedule Preview + Auto Document Checklist */}
      <div className="grid lg:grid-cols-12 gap-5">
        <div className="lg:col-span-8 bw-card p-5 space-y-3 overflow-x-auto">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-display text-sm font-extrabold">
              Amortization Milestones — {activeOption.bankName} ({activeOption.fixedRatePct}% Fixed → {activeOption.variableRatePct}% Post-Fixed)
            </h3>
            <StatusPill label={`Total Profit/Interest: ${fmtAed(activeOption.totalInterestAed, true)}`} tone="gold" />
          </div>
          <table className="w-full text-xs min-w-[600px] font-mono-num">
            <thead>
              <tr className="bg-[var(--bw-soft)] border-b border-[var(--bw-line)] text-[10.5px] font-sans font-bold text-[var(--bw-muted)]">
                <th className="py-2 px-3 text-start">Month</th>
                <th className="py-2 px-3 text-end">Rate %</th>
                <th className="py-2 px-3 text-end">EMI</th>
                <th className="py-2 px-3 text-end">Life Ins.</th>
                <th className="py-2 px-3 text-end">Total / Mo</th>
                <th className="py-2 px-3 text-end">Principal</th>
                <th className="py-2 px-3 text-end">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--bw-line)]">
              {activeOption.schedulePreview.map((r) => (
                <tr key={r.month} className="hover:bg-[var(--bw-hover)]">
                  <td className="py-2 px-3 font-bold">M{r.month}</td>
                  <td className="py-2 px-3 text-end">{r.ratePct.toFixed(2)}%</td>
                  <td className="py-2 px-3 text-end">{fmtAed(r.emiAed)}</td>
                  <td className="py-2 px-3 text-end text-[var(--bw-muted)]">{fmtAed(r.lifeInsuranceAed)}</td>
                  <td className="py-2 px-3 text-end font-bold text-[#119c78]">{fmtAed(r.totalMonthlyAed)}</td>
                  <td className="py-2 px-3 text-end">{fmtAed(r.principalAed)}</td>
                  <td className="py-2 px-3 text-end font-semibold">{fmtAed(r.closingBalanceAed)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="lg:col-span-4 bw-card p-5 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-display text-sm font-extrabold">Document Checklist</h3>
            <StatusPill label={profile} tone="navy" />
          </div>
          <p className="text-[11px] text-[var(--bw-muted)]">
            Automatically included on the client&apos;s Excel, Word &amp; JPEG proposal sheet.
          </p>
          <ul className="space-y-2 text-xs">
            {checklist.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-[#119c78] shrink-0 mt-0.5" />
                <span className="font-medium text-[var(--bw-body)]">{item}</span>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => void downloadProposalExcel()}
            className="bw-btn bw-btn-obsidian w-full text-xs mt-2"
          >
            <Download size={14} className="text-[#34f0bc]" /> Download Complete Proposal Excel
          </button>
        </div>
      </div>
    </div>
  );
}
