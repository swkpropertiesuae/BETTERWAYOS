'use client';

import React, { useState } from 'react';
import { CheckCircle2, ClipboardList, Download, Landmark, Plus, Receipt } from 'lucide-react';
import { useOs } from '@/components/os/OsProvider';
import { fmtAed, GlossyBlackCard, StatusPill } from '@/components/os/UiKit';

const TX_TYPES = ['Resale', 'Handover', 'Buyout', 'Equity', 'Buy+EQ', 'Handover + Equity', 'Buyout + Equity'] as const;
const LOAN_TYPES = ['Residence', 'Commercial', 'Retail', 'Plots', 'Construction'] as const;

interface CoordinatorLoginRow {
  id: string;
  no: number;
  date: string;
  docsFull: 'Yes' | 'No';
  docsIncompleteNote: string;
  advisor: string;
  thirdPartyName: string;
  thirdPartyPhone: string;
  otherPartnerName: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  txType: (typeof TX_TYPES)[number];
  loanType: (typeof LOAN_TYPES)[number];
  loanAmountAed: number;
  withPersonalLoan: 'Yes' | 'No';
  employment: 'Salaried' | 'Self-Employed';
  residency: 'Resident' | 'Non-Resident';
  bank1: string;
  bank2: string;
  bank3: string;
  otherBank: string;
  preApprovalDate: string;
  preApprovalAmountAed: number;
  valuationDate: string;
  valuationAmountAed: number;
  propertyMortgaged: string;
  folStatus: 'Pending' | 'Issued' | 'Signed';
  disbursedAmountAed: number;
  transferred: 'Pending' | 'Completed';
  titleDeedReceived: 'Pending' | 'Received';
  bankPayoutPct: number;
  payAdvisorAed: number;
  payThirdPartyAed: number;
  disbursedMonth: string;
}

const INITIAL_ROWS: CoordinatorLoginRow[] = [
  {
    id: 'cl-1',
    no: 1,
    date: '2026-11-24',
    docsFull: 'Yes',
    docsIncompleteNote: 'All 6m statements & AECB verified',
    advisor: 'Asif Khan',
    thirdPartyName: 'Rami Al Mansoor',
    thirdPartyPhone: '+971 50 412 8891',
    otherPartnerName: 'Dubai Hills Premier Partners',
    clientName: 'Omar Al Hashimi',
    clientPhone: '+971 52 778 4410',
    clientEmail: 'omar.hashimi@example.ae',
    txType: 'Resale',
    loanType: 'Residence',
    loanAmountAed: 3_600_000,
    withPersonalLoan: 'No',
    employment: 'Salaried',
    residency: 'Resident',
    bank1: 'ADIB',
    bank2: 'ENBD',
    bank3: 'FAB',
    otherBank: '',
    preApprovalDate: '2026-11-26',
    preApprovalAmountAed: 3_600_000,
    valuationDate: '2026-11-27',
    valuationAmountAed: 4_550_000,
    propertyMortgaged: 'Sidra 2 Villa 118, Dubai Hills',
    folStatus: 'Issued',
    disbursedAmountAed: 3_600_000,
    transferred: 'Completed',
    titleDeedReceived: 'Received',
    bankPayoutPct: 0.85,
    payAdvisorAed: 12_240,
    payThirdPartyAed: 6_120,
    disbursedMonth: 'Nov 2026',
  },
  {
    id: 'cl-2',
    no: 2,
    date: '2026-11-26',
    docsFull: 'No',
    docsIncompleteNote: 'Pending 2025 audited financials + VAT Q3',
    advisor: 'Daniel Xavier',
    thirdPartyName: 'Direct Client',
    thirdPartyPhone: '-',
    otherPartnerName: '-',
    clientName: 'Priya Menon',
    clientPhone: '+971 55 889 2314',
    clientEmail: 'priya.m@example.ae',
    txType: 'Buyout + Equity',
    loanType: 'Residence',
    loanAmountAed: 2_850_000,
    withPersonalLoan: 'Yes',
    employment: 'Self-Employed',
    residency: 'Resident',
    bank1: 'RAKBANK',
    bank2: 'CBD',
    bank3: 'Mashreq',
    otherBank: 'DIB',
    preApprovalDate: '2026-11-28',
    preApprovalAmountAed: 2_850_000,
    valuationDate: 'Pending',
    valuationAmountAed: 0,
    propertyMortgaged: 'Marina Gate T2 · Unit 2404',
    folStatus: 'Pending',
    disbursedAmountAed: 0,
    transferred: 'Pending',
    titleDeedReceived: 'Pending',
    bankPayoutPct: 0.9,
    payAdvisorAed: 10_260,
    payThirdPartyAed: 0,
    disbursedMonth: 'Dec 2026',
  },
];

export default function CoordinatorAndLoginsPage() {
  const { user, toast } = useOs();
  const [section, setSection] = useState<'coordinator' | 'logins' | 'disbursed'>('coordinator');
  const [rows, setRows] = useState<CoordinatorLoginRow[]>(INITIAL_ROWS);
  const [form, setForm] = useState({
    clientName: '',
    clientPhone: '+971 50 ',
    clientEmail: '',
    advisor: user?.name || 'Asif Khan',
    thirdPartyName: '',
    thirdPartyPhone: '',
    otherPartnerName: '',
    txType: 'Resale' as (typeof TX_TYPES)[number],
    loanType: 'Residence' as (typeof LOAN_TYPES)[number],
    loanAmountAed: 2_400_000,
    withPersonalLoan: 'No' as 'Yes' | 'No',
    employment: 'Salaried' as 'Salaried' | 'Self-Employed',
    residency: 'Resident' as 'Resident' | 'Non-Resident',
    bank1: 'ENBD',
    bank2: 'ADIB',
    bank3: 'CBD',
    otherBank: '',
    docsFull: 'Yes' as 'Yes' | 'No',
    docsIncompleteNote: '',
    propertyMortgaged: '',
    bankPayoutPct: 0.85,
  });

  const addLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.clientName.trim()) {
      toast('Enter client name first', 'err');
      return;
    }
    const nextNo = rows.length + 1;
    const bankGross = Math.round((form.loanAmountAed * form.bankPayoutPct) / 100);
    setRows((prev) => [
      {
        id: `cl-${Date.now()}`,
        no: nextNo,
        date: new Date().toISOString().slice(0, 10),
        docsFull: form.docsFull,
        docsIncompleteNote: form.docsIncompleteNote || (form.docsFull === 'Yes' ? 'Complete pack' : 'Awaiting docs'),
        advisor: form.advisor,
        thirdPartyName: form.thirdPartyName || 'Direct',
        thirdPartyPhone: form.thirdPartyPhone || '-',
        otherPartnerName: form.otherPartnerName || '-',
        clientName: form.clientName,
        clientPhone: form.clientPhone,
        clientEmail: form.clientEmail,
        txType: form.txType,
        loanType: form.loanType,
        loanAmountAed: form.loanAmountAed,
        withPersonalLoan: form.withPersonalLoan,
        employment: form.employment,
        residency: form.residency,
        bank1: form.bank1,
        bank2: form.bank2,
        bank3: form.bank3,
        otherBank: form.otherBank,
        preApprovalDate: 'Pending',
        preApprovalAmountAed: 0,
        valuationDate: 'Pending',
        valuationAmountAed: 0,
        propertyMortgaged: form.propertyMortgaged || 'Dubai Freehold Unit',
        folStatus: 'Pending',
        disbursedAmountAed: 0,
        transferred: 'Pending',
        titleDeedReceived: 'Pending',
        bankPayoutPct: form.bankPayoutPct,
        payAdvisorAed: Math.round(bankGross * 0.4),
        payThirdPartyAed: form.thirdPartyName ? Math.round(bankGross * 0.2) : 0,
        disbursedMonth: 'Nov 2026',
      },
      ...prev,
    ]);
    setForm({ ...form, clientName: '', propertyMortgaged: '', docsIncompleteNote: '' });
    toast(`Bank Login #${nextNo} logged into Coordinator Master Sheet!`);
  };

  const totalLoanVol = rows.reduce((s, r) => s + r.loanAmountAed, 0);
  const totalDisb = rows.reduce((s, r) => s + r.disbursedAmountAed, 0);
  const totalPayout = rows.reduce((s, r) => s + Math.round((r.loanAmountAed * r.bankPayoutPct) / 100), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--bw-line-strong)] pb-4">
        <div>
          <div className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#0b5442] dark:text-[#34f0bc]">
            Exact CRM Requirement Excel Workflow · 32-Column Master Tracker
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[var(--bw-ink)] mt-1">
            Coordinator, Bank Logins, Disbursed &amp; Payouts
          </h1>
          <p className="text-xs sm:text-sm text-[var(--bw-muted)] mt-1">
            Track Documents Full/Incomplete, 7 Transaction Types, 5 Loan Types, 3-Bank Logins, Pre-Approval, Valuation, FOL, Title Deed, Monthly Disbursals &amp; Bank DSA Payout splits.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'coordinator', label: 'Coordinator (32 Cols)' },
            { id: 'logins', label: 'Advisor Logins Sheet' },
            { id: 'disbursed', label: 'Disbursed & Bank Payouts' },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSection(t.id as any)}
              className={`px-4 py-2 rounded-full text-xs font-extrabold cursor-pointer transition ${
                section === t.id
                  ? 'bg-[#090d13] text-[#34f0bc] border border-[#22e2ad]/50 shadow-md'
                  : 'bg-white dark:bg-[#0e131b] text-[var(--bw-ink)] border border-[var(--bw-line)]'
              }`}
            >
              {t.label}
            </button>
          ))}
          <a href="/api/v1/utilities/master-backup-excel" className="bw-btn bw-btn-gold text-xs py-1.5 min-h-[36px]">
            <Download size={13} /> Full Excel
          </a>
        </div>
      </div>

      {/* Split 4-Card Shining Black KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <GlossyBlackCard className="p-4 space-y-1" accent="emerald">
          <div className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-slate-400">Logged Bank Files</div>
          <div className="font-display text-2xl font-extrabold text-white font-mono-num">{rows.length}</div>
          <div className="text-[11px] text-[#34f0bc]">{rows.filter((r) => r.docsFull === 'Yes').length} docs complete</div>
        </GlossyBlackCard>
        <GlossyBlackCard className="p-4 space-y-1" accent="dual">
          <div className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-slate-400">Logged Loan Volume</div>
          <div className="font-display text-2xl font-extrabold text-[#34f0bc] font-mono-num">{fmtAed(totalLoanVol, true)}</div>
          <div className="text-[11px] text-slate-300">Across Banks 1 / 2 / 3</div>
        </GlossyBlackCard>
        <GlossyBlackCard className="p-4 space-y-1" accent="gold">
          <div className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-slate-400">Disbursed Volume</div>
          <div className="font-display text-2xl font-extrabold text-[#fbe8a4] font-mono-num">{fmtAed(totalDisb, true)}</div>
          <div className="text-[11px] text-slate-300">Transferred &amp; Title Deed</div>
        </GlossyBlackCard>
        <GlossyBlackCard className="p-4 space-y-1" accent="emerald">
          <div className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-slate-400">Expected Bank Payouts</div>
          <div className="font-display text-2xl font-extrabold text-white font-mono-num">{fmtAed(totalPayout, true)}</div>
          <div className="text-[11px] text-[#34f0bc]">Advisor + 3rd Party split</div>
        </GlossyBlackCard>
      </div>

      {/* Add New Bank Login Form (Split Clean Card) */}
      <section className="bw-card p-5 space-y-4">
        <h2 className="font-display text-sm font-extrabold flex items-center gap-2">
          <Plus size={16} className="text-[#119c78]" /> Log New Bank Submission (Full CRM Requirement Fields)
        </h2>
        <form onSubmit={addLogin} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs">
          <input value={form.clientName} onChange={(e) => setForm({ ...form, clientName: e.target.value })} placeholder="Client Name *" className="h-9 px-3 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)]" />
          <input value={form.clientPhone} onChange={(e) => setForm({ ...form, clientPhone: e.target.value })} placeholder="Client Phone" className="h-9 px-3 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)]" />
          <input value={form.clientEmail} onChange={(e) => setForm({ ...form, clientEmail: e.target.value })} placeholder="Client Email" className="h-9 px-3 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)]" />
          <select value={form.txType} onChange={(e) => setForm({ ...form, txType: e.target.value as any })} className="h-9 px-2.5 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] font-semibold">
            {TX_TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
          <select value={form.loanType} onChange={(e) => setForm({ ...form, loanType: e.target.value as any })} className="h-9 px-2.5 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] font-semibold">
            {LOAN_TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
          <input type="number" value={form.loanAmountAed} onChange={(e) => setForm({ ...form, loanAmountAed: Number(e.target.value) })} placeholder="Loan Amount AED" className="h-9 px-3 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] font-mono-num" />

          <select value={form.employment} onChange={(e) => setForm({ ...form, employment: e.target.value as any })} className="h-9 px-2.5 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)]">
            <option>Salaried</option>
            <option>Self-Employed</option>
          </select>
          <select value={form.residency} onChange={(e) => setForm({ ...form, residency: e.target.value as any })} className="h-9 px-2.5 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)]">
            <option>Resident</option>
            <option>Non-Resident</option>
          </select>
          <select value={form.withPersonalLoan} onChange={(e) => setForm({ ...form, withPersonalLoan: e.target.value as any })} className="h-9 px-2.5 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)]">
            <option value="No">Personal Loan: No</option>
            <option value="Yes">Personal Loan: Yes</option>
          </select>
          <input value={form.bank1} onChange={(e) => setForm({ ...form, bank1: e.target.value })} placeholder="Bank Name-1" className="h-9 px-3 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)]" />
          <input value={form.bank2} onChange={(e) => setForm({ ...form, bank2: e.target.value })} placeholder="Bank Name-2" className="h-9 px-3 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)]" />
          <input value={form.bank3} onChange={(e) => setForm({ ...form, bank3: e.target.value })} placeholder="Bank Name-3" className="h-9 px-3 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)]" />

          <input value={form.thirdPartyName} onChange={(e) => setForm({ ...form, thirdPartyName: e.target.value })} placeholder="3rd Party Name" className="h-9 px-3 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)]" />
          <input value={form.thirdPartyPhone} onChange={(e) => setForm({ ...form, thirdPartyPhone: e.target.value })} placeholder="3rd Party Phone" className="h-9 px-3 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)]" />
          <input value={form.propertyMortgaged} onChange={(e) => setForm({ ...form, propertyMortgaged: e.target.value })} placeholder="Property Mortgaged" className="h-9 px-3 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] col-span-2" />
          <select value={form.docsFull} onChange={(e) => setForm({ ...form, docsFull: e.target.value as any })} className="h-9 px-2.5 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] font-semibold">
            <option value="Yes">Docs Full: Yes</option>
            <option value="No">Docs Incomplete</option>
          </select>
          <button type="submit" className="bw-btn bw-btn-obsidian h-9 text-xs">
            <CheckCircle2 size={14} /> Add Login
          </button>
        </form>
      </section>

      {/* SECTION VIEW: COORDINATOR 32-COL MASTER OR ADVISOR LOGINS OR DISBURSED & PAYOUTS */}
      {section === 'coordinator' && (
        <section className="bw-card overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[var(--bw-line)] flex items-center justify-between">
            <h2 className="font-display text-sm font-extrabold flex items-center gap-2">
              <ClipboardList size={16} className="text-[#119c78]" /> Coordinator Master Sheet (Documents + Full 32-Column Bank Login Ledger)
            </h2>
            <StatusPill label="32 Columns Live" tone="navy" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[11.5px] min-w-[1680px]">
              <thead>
                <tr className="bg-[#090d13] text-white text-[10px] uppercase tracking-wider">
                  <th className="py-2.5 px-2.5 text-start">No</th>
                  <th className="py-2.5 px-2.5 text-start">Date</th>
                  <th className="py-2.5 px-2.5 text-start">Docs Full / Incomplete</th>
                  <th className="py-2.5 px-2.5 text-start">Advisor</th>
                  <th className="py-2.5 px-2.5 text-start">3rd Party &amp; Partner</th>
                  <th className="py-2.5 px-2.5 text-start">Client / Phone / Email</th>
                  <th className="py-2.5 px-2.5 text-start">Type · Loan Type</th>
                  <th className="py-2.5 px-2.5 text-end">Loan AED</th>
                  <th className="py-2.5 px-2.5 text-center">P.Loan</th>
                  <th className="py-2.5 px-2.5 text-start">Profile / Res</th>
                  <th className="py-2.5 px-2.5 text-start">Banks 1 / 2 / 3 / Other</th>
                  <th className="py-2.5 px-2.5 text-start">Pre-Approval</th>
                  <th className="py-2.5 px-2.5 text-start">Valuation</th>
                  <th className="py-2.5 px-2.5 text-start">Property Mortgaged</th>
                  <th className="py-2.5 px-2.5 text-center">FOL</th>
                  <th className="py-2.5 px-2.5 text-end">Disbursed</th>
                  <th className="py-2.5 px-2.5 text-center">Transferred</th>
                  <th className="py-2.5 px-2.5 text-center">Title Deed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--bw-line)]">
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-[var(--bw-hover)]">
                    <td className="py-2.5 px-2.5 font-mono-num font-bold">#{r.no}</td>
                    <td className="py-2.5 px-2.5 font-mono-num">{r.date}</td>
                    <td className="py-2.5 px-2.5">
                      <StatusPill label={r.docsFull === 'Yes' ? 'Docs Full' : 'Incomplete'} tone={r.docsFull === 'Yes' ? 'emerald' : 'red'} />
                      <div className="text-[10px] text-[var(--bw-muted)] mt-0.5 max-w-[140px] truncate">{r.docsIncompleteNote}</div>
                    </td>
                    <td className="py-2.5 px-2.5 font-bold">{r.advisor}</td>
                    <td className="py-2.5 px-2.5">
                      <div className="font-semibold">{r.thirdPartyName}</div>
                      <div className="text-[10px] text-[var(--bw-muted)]">{r.thirdPartyPhone} · {r.otherPartnerName}</div>
                    </td>
                    <td className="py-2.5 px-2.5">
                      <div className="font-bold text-[var(--bw-ink)]">{r.clientName}</div>
                      <div className="text-[10px] text-[var(--bw-muted)]">{r.clientPhone} · {r.clientEmail}</div>
                    </td>
                    <td className="py-2.5 px-2.5">
                      <div className="font-bold text-[#0b5442]">{r.txType}</div>
                      <div className="text-[10px] text-[var(--bw-muted)]">{r.loanType}</div>
                    </td>
                    <td className="py-2.5 px-2.5 text-end font-mono-num font-extrabold">{fmtAed(r.loanAmountAed, true)}</td>
                    <td className="py-2.5 px-2.5 text-center">{r.withPersonalLoan}</td>
                    <td className="py-2.5 px-2.5">{r.employment} · {r.residency}</td>
                    <td className="py-2.5 px-2.5 font-bold">{[r.bank1, r.bank2, r.bank3, r.otherBank].filter(Boolean).join(' / ')}</td>
                    <td className="py-2.5 px-2.5">
                      <div className="font-mono-num">{r.preApprovalDate}</div>
                      <div className="text-[10px] font-bold text-[#119c78]">{r.preApprovalAmountAed ? fmtAed(r.preApprovalAmountAed, true) : '-'}</div>
                    </td>
                    <td className="py-2.5 px-2.5">
                      <div className="font-mono-num">{r.valuationDate}</div>
                      <div className="text-[10px] text-[var(--bw-muted)]">{r.valuationAmountAed ? fmtAed(r.valuationAmountAed, true) : '-'}</div>
                    </td>
                    <td className="py-2.5 px-2.5 max-w-[150px] truncate">{r.propertyMortgaged}</td>
                    <td className="py-2.5 px-2.5 text-center">
                      <StatusPill label={r.folStatus} tone={r.folStatus === 'Pending' ? 'gold' : 'emerald'} />
                    </td>
                    <td className="py-2.5 px-2.5 text-end font-mono-num font-extrabold text-[#119c78]">
                      {r.disbursedAmountAed ? fmtAed(r.disbursedAmountAed, true) : '-'}
                    </td>
                    <td className="py-2.5 px-2.5 text-center">
                      <StatusPill label={r.transferred} tone={r.transferred === 'Completed' ? 'emerald' : 'slate'} />
                    </td>
                    <td className="py-2.5 px-2.5 text-center">
                      <StatusPill label={r.titleDeedReceived} tone={r.titleDeedReceived === 'Received' ? 'emerald' : 'gold'} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {section === 'logins' && (
        <section className="bw-card overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[var(--bw-line)]">
            <h2 className="font-display text-sm font-extrabold flex items-center gap-2">
              <Landmark size={16} className="text-[#119c78]" /> Advisor Bank Logins Sheet
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs min-w-[1050px]">
              <thead>
                <tr className="bg-[var(--bw-soft)] border-b border-[var(--bw-line)] text-[10.5px] font-bold text-[var(--bw-muted)]">
                  <th className="py-2.5 px-3 text-start">Date</th>
                  <th className="py-2.5 px-3 text-start">Client Name</th>
                  <th className="py-2.5 px-3 text-start">Type</th>
                  <th className="py-2.5 px-3 text-start">Loan Type</th>
                  <th className="py-2.5 px-3 text-center">Personal Loan</th>
                  <th className="py-2.5 px-3 text-start">Profile / Res</th>
                  <th className="py-2.5 px-3 text-start">Bank 1 / 2 / 3</th>
                  <th className="py-2.5 px-3 text-end">Loan Amount</th>
                  <th className="py-2.5 px-3 text-center">Valuation</th>
                  <th className="py-2.5 px-3 text-center">FOL</th>
                  <th className="py-2.5 px-3 text-end">Disbursed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--bw-line)]">
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-[var(--bw-hover)]">
                    <td className="py-2.5 px-3 font-mono-num">{r.date}</td>
                    <td className="py-2.5 px-3 font-bold">{r.clientName}</td>
                    <td className="py-2.5 px-3 font-bold text-[#0b5442]">{r.txType}</td>
                    <td className="py-2.5 px-3">{r.loanType}</td>
                    <td className="py-2.5 px-3 text-center">{r.withPersonalLoan}</td>
                    <td className="py-2.5 px-3">{r.employment} · {r.residency}</td>
                    <td className="py-2.5 px-3 font-bold">{[r.bank1, r.bank2, r.bank3].filter(Boolean).join(' · ')}</td>
                    <td className="py-2.5 px-3 text-end font-mono-num font-extrabold">{fmtAed(r.loanAmountAed)}</td>
                    <td className="py-2.5 px-3 text-center">{r.valuationDate}</td>
                    <td className="py-2.5 px-3 text-center">{r.folStatus}</td>
                    <td className="py-2.5 px-3 text-end font-mono-num font-bold text-[#119c78]">{fmtAed(r.disbursedAmountAed)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {section === 'disbursed' && (
        <div className="grid lg:grid-cols-2 gap-5">
          <section className="bw-card overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[var(--bw-line)]">
              <h2 className="font-display text-sm font-extrabold">Monthly Disbursed Ledger</h2>
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-[var(--bw-soft)] border-b border-[var(--bw-line)] text-[10.5px] font-bold text-[var(--bw-muted)]">
                  <th className="py-2.5 px-4 text-start">Month</th>
                  <th className="py-2.5 px-4 text-start">Client Name</th>
                  <th className="py-2.5 px-4 text-end">Amount (AED)</th>
                  <th className="py-2.5 px-4 text-start">Other</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--bw-line)]">
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className="py-2.5 px-4 font-bold">{r.disbursedMonth}</td>
                    <td className="py-2.5 px-4 font-bold">{r.clientName}</td>
                    <td className="py-2.5 px-4 text-end font-mono-num font-extrabold text-[#119c78]">{fmtAed(r.disbursedAmountAed || r.loanAmountAed)}</td>
                    <td className="py-2.5 px-4 text-[var(--bw-muted)]">{r.bank1} · {r.txType}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="bw-card overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[var(--bw-line)]">
              <h2 className="font-display text-sm font-extrabold flex items-center gap-2">
                <Receipt size={15} className="text-[#119c78]" /> Bank Payouts, Advisor Split &amp; 3rd-Party Partner Ledger
              </h2>
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-[var(--bw-soft)] border-b border-[var(--bw-line)] text-[10.5px] font-bold text-[var(--bw-muted)]">
                  <th className="py-2.5 px-3 text-start">Client · Bank</th>
                  <th className="py-2.5 px-3 text-center">Bank %</th>
                  <th className="py-2.5 px-3 text-end">Bank Payout</th>
                  <th className="py-2.5 px-3 text-end">Pay Advisor</th>
                  <th className="py-2.5 px-3 text-end">3rd Party</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--bw-line)]">
                {rows.map((r) => {
                  const gross = Math.round((r.loanAmountAed * r.bankPayoutPct) / 100);
                  return (
                    <tr key={r.id}>
                      <td className="py-2.5 px-3">
                        <div className="font-bold">{r.clientName}</div>
                        <div className="text-[10.5px] text-[var(--bw-muted)]">{r.bank1} · {r.advisor}</div>
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono-num font-bold">{r.bankPayoutPct}%</td>
                      <td className="py-2.5 px-3 text-end font-mono-num font-extrabold">{fmtAed(gross)}</td>
                      <td className="py-2.5 px-3 text-end font-mono-num font-bold text-[#119c78]">{fmtAed(r.payAdvisorAed)}</td>
                      <td className="py-2.5 px-3 text-end font-mono-num text-[#9a7123]">{fmtAed(r.payThirdPartyAed)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>
        </div>
      )}
    </div>
  );
}
