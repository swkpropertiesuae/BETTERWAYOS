'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Banknote,
  Building2,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  HandCoins,
  Lock,
  Percent,
  Plus,
  Receipt,
  Scale,
  ShieldAlert,
  Wallet,
} from 'lucide-react';
import { useOs } from '@/components/os/OsProvider';
import { fmtAed, MetricTile, PageHeader, StatusPill } from '@/components/os/UiKit';
import { SubFeatureTabs, type SubFeatureItem } from '@/components/os/SubFeatureTabs';
import { AttachmentPicker } from '@/components/os/AttachmentPicker';
import { uploadFilesToScope } from '@/lib/workspace/attachments-types';

type AccountsSubTab = 'invoices' | 'receipts' | 'commissions' | 'bills' | 'payments' | 'matching' | 'reports';

const ACCOUNTS_SUB_TABS: ReadonlyArray<SubFeatureItem<AccountsSubTab>> = [
  { id: 'invoices', num: '01', label: 'Tax Invoices', icon: Receipt },
  { id: 'receipts', num: '02', label: 'Receipts', icon: HandCoins },
  { id: 'commissions', num: '03', label: 'Commissions (50/50)', icon: Percent },
  { id: 'bills', num: '04', label: 'Supplier Bills', icon: Wallet },
  { id: 'payments', num: '05', label: 'Payments', icon: Banknote },
  { id: 'matching', num: '06', label: 'Bank Matching', icon: Scale },
  { id: 'reports', num: '07', label: 'Profit, Balance & VAT', icon: FileSpreadsheet },
];

interface AccountsPayload {
  summary: {
    revenueAed: number;
    expensesAed: number;
    netProfitAed: number;
    outputVatAed: number;
    inputVatAed: number;
    netVatPayableAed: number;
  };
  invoices: Array<Record<string, unknown>>;
  expenses: Array<Record<string, unknown>>;
  payouts: Array<Record<string, unknown>>;
  journalEntries: Array<Record<string, unknown>>;
  coa: Array<{ code: string; name: string; account_type: string }>;
  brokers: Array<Record<string, unknown>>;
}

export default function AccountsPage() {
  const { user, toast } = useOs();
  const [tab, setTab] = useState<AccountsSubTab>('invoices');
  const [data, setData] = useState<AccountsPayload | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  // Invoice form
  const [invCounterparty, setInvCounterparty] = useState('Emirates NBD PJSC — Mortgage DSA');
  const [invTrn, setInvTrn] = useState('100049281700003');
  const [invSubtotal, setInvSubtotal] = useState('18500');
  const [invIban, setInvIban] = useState('AE460260001015889900101');

  // Expense / Supplier Bill form
  const [expVendor, setExpVendor] = useState('Etisalat Business Fiber — Oud Metha');
  const [expDesc, setExpDesc] = useState('Monthly Office Fiber + Static IP');
  const [expAmount, setExpAmount] = useState('1499');
  const [expAccount, setExpAccount] = useState('5200');

  // Corporate Payout form (2-of-2 Owner sign-off)
  const [payBrokerId, setPayBrokerId] = useState('');
  const [payName, setPayName] = useState('Emirates Premier Realty LLC');
  const [payAccountType, setPayAccountType] = useState('CORPORATE');
  const [payIban, setPayIban] = useState('AE460260001015889900202');
  const [payBank, setPayBank] = useState('Wio Business UAE');
  const [payAmount, setPayAmount] = useState('6500');
  const [payOrnOk, setPayOrnOk] = useState(true);
  const [payLetterOk, setPayLetterOk] = useState(true);
  const [invFiles, setInvFiles] = useState<File[]>([]);
  const [expFiles, setExpFiles] = useState<File[]>([]);
  const [payFiles, setPayFiles] = useState<File[]>([]);

  // 50/50 Commission Split Estimator
  const [commLoan, setCommLoan] = useState(3_000_000);
  const [commDsaPct, setCommDsaPct] = useState(0.85);
  const [commSplitPct, setCommSplitPct] = useState(50);

  // Bank Matching state
  const [matchedIds, setMatchedIds] = useState<Record<string, boolean>>({});

  const load = useCallback(async () => {
    setError('');
    const r = await fetch('/api/v1/accounts', { cache: 'no-store' });
    const j = await r.json();
    if (!r.ok) {
      setError(j.error || 'Unable to load Accounts');
      return;
    }
    setData(j);
    const firstBroker = (j.brokers ?? [])[0] as Record<string, unknown> | undefined;
    if (firstBroker) {
      setPayBrokerId((prev) => prev || String(firstBroker.id || ''));
      setPayName((prev) => prev || String(firstBroker.agency_name || ''));
      if (firstBroker.corporate_iban) setPayIban(String(firstBroker.corporate_iban));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function submitInvoice(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const r = await fetch('/api/v1/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: 'invoice',
          counterpartyName: invCounterparty,
          counterpartyTrn: invTrn,
          subtotalAed: Number(invSubtotal),
          receivingCorporateIban: invIban,
        }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Invoice creation failed');
      if (invFiles.length > 0 && j.invoice?.id) {
        await uploadFilesToScope(invFiles, 'accounts-invoice', String(j.invoice.id)).catch(() => null);
      }
      setInvFiles([]);
      setNotice(`Issued ${j.invoice.invoice_no} with UAE 5% VAT & auto-posted GL journal entry.`);
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setBusy(false);
    }
  }

  async function submitExpense(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const r = await fetch('/api/v1/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: 'expense',
          vendorName: expVendor,
          description: expDesc,
          amountAed: Number(expAmount),
          accountCode: expAccount,
        }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Expense failed');
      if (expFiles.length > 0) {
        await uploadFilesToScope(expFiles, 'accounts-expense', String(j.expense?.id || `exp-${Date.now()}`)).catch(() => null);
      }
      setExpFiles([]);
      setNotice(`Recorded supplier bill for ${expVendor} via Betterway Corporate Bank Account.`);
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setBusy(false);
    }
  }

  async function submitPayout(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const r = await fetch('/api/v1/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: 'payout',
          brokerId: payBrokerId || null,
          payeeName: payName,
          payeeAccountType: payAccountType,
          destinationIban: payIban,
          bankName: payBank,
          amountAed: Number(payAmount),
          ornVerified: payOrnOk,
          bankLetterVerified: payLetterOk,
        }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Payout rejected');
      if (payFiles.length > 0 && j.payout?.id) {
        await uploadFilesToScope(payFiles, 'accounts-payout', String(j.payout.id)).catch(() => null);
      }
      setPayFiles([]);
      setNotice(`Payout ${j.payout.payout_code} queued for 2-of-2 Owner Dual Sign-Off (Warda Kapadia + Shabib Siraj).`);
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Corporate Guard blocked payout');
    } finally {
      setBusy(false);
    }
  }

  const canAccess = user?.role === 'OWNER' || user?.role === 'OFFICE_ADMIN';
  const grossDsa = Math.round((commLoan * commDsaPct) / 100);
  const advisorShare = Math.round((grossDsa * commSplitPct) / 100);
  const houseShare = grossDsa - advisorShare;

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Finance · UAE FTA VAT 5% · Corporate-Account-Only Guard"
        title="Accounts &"
        accent="UAE VAT Ledger"
        subtitle="Tax Invoices (PINT-AE XML), Receipts, 50/50 Advisor DSA Commissions, Supplier Bills, Corporate Payouts, Bank Matching & Profit/Balance/VAT 201."
        actions={
          user?.isOwner ? (
            <Link href="/os/corner?tab=vat" className="bw-btn bw-btn-obsidian text-xs py-2 min-h-[36px]">
              <Lock size={13} className="text-[#dfc285]" /> Owner Consolidated VAT 201
            </Link>
          ) : null
        }
      />

      {!canAccess ? (
        <div className="rounded-2xl border border-amber-400/40 bg-amber-50 dark:bg-amber-950/20 p-6 flex items-center gap-3 text-sm">
          <ShieldAlert className="text-amber-600 shrink-0" />
          <div>
            <strong>Restricted Financial Module:</strong> Standard Company Accounts &amp; UAE VAT are restricted to Owners (Warda Kapadia &amp; Shabib Siraj) and Office Admin.
          </div>
        </div>
      ) : (
        <>
          <SubFeatureTabs sectionTitle="Accounts" items={ACCOUNTS_SUB_TABS} activeId={tab} onSelect={setTab} />

          {error && <div className="rounded-xl border border-red-400/40 bg-red-50 p-3 text-xs font-semibold text-red-700">{error}</div>}
          {notice && (
            <div className="rounded-xl border border-emerald-500/35 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800 flex items-center gap-2">
              <CheckCircle2 size={14} /> {notice}
            </div>
          )}

          <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
            <MetricTile label="Standard Revenue" value={fmtAed(data?.summary.revenueAed, true)} tone="navy" />
            <MetricTile label="Expenses" value={fmtAed(data?.summary.expensesAed, true)} />
            <MetricTile label="Net Profit" value={fmtAed(data?.summary.netProfitAed, true)} tone="emerald" />
            <MetricTile label="Output VAT (5%)" value={fmtAed(data?.summary.outputVatAed)} />
            <MetricTile label="Input VAT" value={fmtAed(data?.summary.inputVatAed)} />
            <MetricTile label="Net VAT Payable" value={fmtAed(data?.summary.netVatPayableAed)} tone="gold" />
          </div>

          {/* 01 TAX INVOICES */}
          {tab === 'invoices' && (
            <div className="grid lg:grid-cols-3 gap-5">
              <form onSubmit={submitInvoice} className="bw-card p-5 space-y-3">
                <h2 className="text-sm font-extrabold flex items-center gap-1.5">
                  <Plus size={15} className="text-[#0e5a49]" /> Issue Bank DSA Tax Invoice
                </h2>
                <p className="text-[11px] text-[var(--bw-muted)]">Auto-applies 5% UAE FTA VAT, posts double-entry GL (`1100` Dr / `4000` Cr), and locks to Betterway Corporate IBAN.</p>
                <input value={invCounterparty} onChange={(e) => setInvCounterparty(e.target.value)} placeholder="Bank / Counterparty Legal Name" className="w-full rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] px-3 py-2 text-xs" required />
                <input value={invTrn} onChange={(e) => setInvTrn(e.target.value)} placeholder="Counterparty UAE TRN (15 digits)" className="w-full rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] px-3 py-2 text-xs" />
                <input type="number" value={invSubtotal} onChange={(e) => setInvSubtotal(e.target.value)} placeholder="Subtotal AED (excl. VAT)" className="w-full rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] px-3 py-2 text-xs" required />
                <input value={invIban} onChange={(e) => setInvIban(e.target.value)} placeholder="Betterway Corporate Receiving IBAN (AE...)" className="w-full rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] px-3 py-2 text-xs font-mono" required />
                <AttachmentPicker files={invFiles} onChange={setInvFiles} label="Attach Bank Disbursal Advice / DSA Confirmation" compact />
                <button disabled={busy} className="bw-btn bw-btn-obsidian w-full text-xs">
                  {busy ? 'Issuing…' : 'Issue UAE Tax Invoice (5% VAT)'}
                </button>
              </form>

              <div className="lg:col-span-2 bw-card p-5 space-y-3 overflow-x-auto">
                <h3 className="text-sm font-extrabold">Standard Tax Invoices ({data?.invoices.length ?? 0})</h3>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-[var(--bw-muted)] border-b border-[var(--bw-line)]">
                      <th className="py-2 pr-3">Invoice #</th>
                      <th className="py-2 pr-3">Counterparty</th>
                      <th className="py-2 pr-3">Subtotal</th>
                      <th className="py-2 pr-3">VAT 5%</th>
                      <th className="py-2 pr-3">Total AED</th>
                      <th className="py-2">PINT-AE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data?.invoices ?? []).map((inv) => (
                      <tr key={String(inv.id)} className="border-b border-[var(--bw-line)]/60">
                        <td className="py-2.5 pr-3 font-mono font-bold">{String(inv.invoice_no)}</td>
                        <td className="py-2.5 pr-3">{String(inv.counterparty_name)}</td>
                        <td className="py-2.5 pr-3 font-mono-num">{fmtAed(Number(inv.subtotal_aed))}</td>
                        <td className="py-2.5 pr-3 font-mono-num">{fmtAed(Number(inv.vat_amount_aed))}</td>
                        <td className="py-2.5 pr-3 font-mono-num font-bold">{fmtAed(Number(inv.total_aed))}</td>
                        <td className="py-2.5">
                          <a href={`/api/v1/accounts?pintInvoiceId=${String(inv.id)}`} className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0e5a49] hover:underline">
                            <Download size={12} /> XML
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 02 RECEIPTS */}
          {tab === 'receipts' && (
            <div className="bw-card p-5 space-y-4 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-display text-sm font-extrabold">Bank DSA &amp; Advisory Payment Receipts ({data?.invoices.length ?? 0})</h2>
                  <p className="text-[11px] text-[var(--bw-muted)]">Official receipt vouchers tied to Betterway corporate receiving IBANs.</p>
                </div>
                <StatusPill label="Corporate IBAN Verified" tone="emerald" />
              </div>
              <div className="space-y-2">
                {(data?.invoices ?? []).map((inv) => (
                  <div key={String(inv.id)} className="p-3.5 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-soft)]/50 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="font-extrabold">RCT-{String(inv.invoice_no)} · {String(inv.counterparty_name)}</div>
                      <div className="text-[11px] text-[var(--bw-muted)]">IBAN: {String(inv.receiving_corporate_iban || invIban)}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono-num font-extrabold text-[#0e5a49]">{fmtAed(Number(inv.total_aed))}</span>
                      <StatusPill label={String(inv.status || 'ISSUED')} tone="emerald" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 03 COMMISSIONS (50/50) */}
          {tab === 'commissions' && (
            <div className="grid lg:grid-cols-12 gap-5 text-xs">
              <div className="lg:col-span-5 bw-card p-5 space-y-3">
                <h2 className="font-display text-sm font-extrabold">50/50 Advisor DSA Commission Split Modeller</h2>
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="col-span-2">
                    <label className="font-bold block mb-1">Disbursed Mortgage Loan (AED)</label>
                    <input type="number" value={commLoan} onChange={(e) => setCommLoan(Number(e.target.value))} className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] font-mono-num font-bold" />
                  </div>
                  <div>
                    <label className="font-bold block mb-1">Bank DSA Rate (%)</label>
                    <input type="number" step="0.05" value={commDsaPct} onChange={(e) => setCommDsaPct(Number(e.target.value))} className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] font-mono-num" />
                  </div>
                  <div>
                    <label className="font-bold block mb-1">Advisor Split (%)</label>
                    <input type="number" value={commSplitPct} onChange={(e) => setCommSplitPct(Number(e.target.value))} className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] font-mono-num" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 pt-2">
                  <MetricTile label="Gross Bank DSA" value={fmtAed(grossDsa)} tone="navy" />
                  <MetricTile label={`Advisor (${commSplitPct}%)`} value={fmtAed(advisorShare)} tone="emerald" />
                  <MetricTile label={`Betterway (${100 - commSplitPct}%)`} value={fmtAed(houseShare)} tone="gold" />
                </div>
              </div>
              <div className="lg:col-span-7 bw-card p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-sm font-extrabold">Advisor DSA &amp; RERA Referral Payout Ledger</h3>
                  {user?.isOwner && (
                    <Link href="/os/place?tab=commissions" className="text-xs font-extrabold text-[#0e5a49] hover:underline">
                      Open Full Cash / BT / Botim Settlement →
                    </Link>
                  )}
                </div>
                <p className="text-[11px] text-[var(--bw-muted)]">All external RERA partner splits require verified corporate IBAN + 2-of-2 Owner release.</p>
                <div className="space-y-2">
                  {(data?.payouts ?? []).map((p) => (
                    <div key={String(p.id)} className="p-3 rounded-xl border border-[var(--bw-line)] flex items-center justify-between">
                      <div>
                        <div className="font-bold">{String(p.payout_code)} · {String(p.payee_name)}</div>
                        <div className="text-[11px] text-[var(--bw-muted)] font-mono">{String(p.destination_iban)}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono-num font-bold">{fmtAed(Number(p.amount_aed))}</span>
                        <StatusPill label={String(p.status)} tone="gold" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 04 SUPPLIER BILLS */}
          {tab === 'bills' && (
            <div className="grid lg:grid-cols-3 gap-5">
              <form onSubmit={submitExpense} className="bw-card p-5 space-y-3">
                <h2 className="text-sm font-extrabold">Record Supplier Bill / Corporate Expense</h2>
                <input value={expVendor} onChange={(e) => setExpVendor(e.target.value)} placeholder="Vendor Legal Name" className="w-full rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] px-3 py-2 text-xs" required />
                <input value={expDesc} onChange={(e) => setExpDesc(e.target.value)} placeholder="Description" className="w-full rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] px-3 py-2 text-xs" required />
                <div className="grid grid-cols-2 gap-2">
                  <input type="number" value={expAmount} onChange={(e) => setExpAmount(e.target.value)} placeholder="Amount AED" className="rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] px-3 py-2 text-xs" required />
                  <input value={expAccount} onChange={(e) => setExpAccount(e.target.value)} placeholder="COA Code (e.g. 5200)" className="rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] px-3 py-2 text-xs font-mono" required />
                </div>
                <AttachmentPicker files={expFiles} onChange={setExpFiles} label="Attach Supplier Tax Invoice / Receipt" compact />
                <button disabled={busy} className="bw-btn bw-btn-obsidian w-full text-xs">Post Supplier Bill</button>
              </form>
              <div className="lg:col-span-2 bw-card p-5 space-y-3 overflow-x-auto">
                <h3 className="text-sm font-extrabold">Recorded Supplier Bills ({data?.expenses.length ?? 0})</h3>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-[var(--bw-muted)] border-b border-[var(--bw-line)]">
                      <th className="py-2 pr-3">Vendor</th>
                      <th className="py-2 pr-3">Account</th>
                      <th className="py-2 pr-3">Description</th>
                      <th className="py-2 pr-3">Amount</th>
                      <th className="py-2">Input VAT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data?.expenses ?? []).map((ex) => (
                      <tr key={String(ex.id)} className="border-b border-[var(--bw-line)]/60">
                        <td className="py-2 pr-3 font-semibold">{String(ex.vendor_name)}</td>
                        <td className="py-2 pr-3 font-mono">{String(ex.account_code)}</td>
                        <td className="py-2 pr-3 text-[var(--bw-muted)]">{String(ex.description)}</td>
                        <td className="py-2 pr-3 font-mono-num">{fmtAed(Number(ex.amount_aed))}</td>
                        <td className="py-2 font-mono-num">{fmtAed(Number(ex.vat_aed))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 05 PAYMENTS */}
          {tab === 'payments' && (
            <div className="grid lg:grid-cols-3 gap-5">
              <form onSubmit={submitPayout} className="bw-card p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-extrabold">Corporate Partner Payment</h2>
                  <StatusPill label="2-of-2 Owners" tone="navy" />
                </div>
                <p className="text-[11px] text-[var(--bw-muted)]">Corporate-Account-Only Guard enforces verified UAE Corporate IBAN, RERA ORN &amp; dual Owner sign-off.</p>
                <select
                  value={payBrokerId}
                  onChange={(e) => {
                    setPayBrokerId(e.target.value);
                    const b = data?.brokers.find((x) => String(x.id) === e.target.value);
                    if (b) {
                      setPayName(String(b.agency_name || ''));
                      if (b.corporate_iban) setPayIban(String(b.corporate_iban));
                      if (b.bank_name) setPayBank(String(b.bank_name));
                    }
                  }}
                  required
                  className="w-full rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] px-3 py-2 text-xs"
                >
                  <option value="">Select Registered RERA Partner Brokerage</option>
                  {(data?.brokers ?? []).map((b) => (
                    <option key={String(b.id)} value={String(b.id)}>
                      {String(b.agency_name)} · ORN {String(b.orn_number)}
                    </option>
                  ))}
                </select>
                <input value={payName} onChange={(e) => setPayName(e.target.value)} placeholder="Corporate Payee Legal Entity" className="w-full rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] px-3 py-2 text-xs" required />
                <select value={payAccountType} onChange={(e) => setPayAccountType(e.target.value)} className="w-full rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] px-3 py-2 text-xs">
                  <option value="CORPORATE">CORPORATE — Verified UAE Entity Bank Account</option>
                  <option value="PERSONAL">PERSONAL — (Blocked by Corporate Guard)</option>
                  <option value="CASH">CASH — (Blocked by Corporate Guard)</option>
                </select>
                <input value={payIban} onChange={(e) => setPayIban(e.target.value)} placeholder="UAE Corporate IBAN" className="w-full rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] px-3 py-2 text-xs font-mono" required />
                <div className="grid grid-cols-2 gap-2">
                  <input value={payBank} onChange={(e) => setPayBank(e.target.value)} placeholder="Bank Name" className="rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] px-3 py-2 text-xs" />
                  <input type="number" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} placeholder="Amount AED" className="rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] px-3 py-2 text-xs" required />
                </div>
                <label className="flex items-center gap-2 text-xs">
                  <input type="checkbox" checked={payOrnOk} onChange={(e) => setPayOrnOk(e.target.checked)} /> RERA ORN Certificate Verified
                </label>
                <label className="flex items-center gap-2 text-xs">
                  <input type="checkbox" checked={payLetterOk} onChange={(e) => setPayLetterOk(e.target.checked)} /> Corporate Bank Account Letter Verified
                </label>
                <AttachmentPicker files={payFiles} onChange={setPayFiles} label="Attach Corporate IBAN Letter / ORN / Invoice" compact />
                <button disabled={busy} className="bw-btn bw-btn-obsidian w-full text-xs">Queue Payment for 2-of-2 Release</button>
              </form>

              <div className="lg:col-span-2 bw-card p-5 space-y-3 overflow-x-auto">
                <h3 className="text-sm font-extrabold">Outgoing Corporate Payment Queue ({data?.payouts.length ?? 0})</h3>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-[var(--bw-muted)] border-b border-[var(--bw-line)]">
                      <th className="py-2 pr-3">Code</th>
                      <th className="py-2 pr-3">Payee Entity</th>
                      <th className="py-2 pr-3">Corporate IBAN</th>
                      <th className="py-2 pr-3">Amount</th>
                      <th className="py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data?.payouts ?? []).map((p) => (
                      <tr key={String(p.id)} className="border-b border-[var(--bw-line)]/60">
                        <td className="py-2 pr-3 font-mono font-bold">{String(p.payout_code)}</td>
                        <td className="py-2 pr-3">{String(p.payee_name)}</td>
                        <td className="py-2 pr-3 font-mono text-[11px]">{String(p.destination_iban)}</td>
                        <td className="py-2 pr-3 font-mono-num font-bold">{fmtAed(Number(p.amount_aed))}</td>
                        <td className="py-2">
                          <StatusPill label={String(p.status)} tone={String(p.status) === 'PAID' ? 'emerald' : 'gold'} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 06 BANK MATCHING */}
          {tab === 'matching' && (
            <div className="bw-card p-5 space-y-4 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="font-display text-sm font-extrabold">Corporate Bank Statement Matching (Wio / ENBD)</h2>
                  <p className="text-[11px] text-[var(--bw-muted)]">Match incoming UAE bank DSA transfers against issued Tax Invoices to lock GL cash reconciliation.</p>
                </div>
                <StatusPill label={`${Object.values(matchedIds).filter(Boolean).length} Reconciled`} tone="emerald" />
              </div>
              <div className="space-y-2">
                {(data?.invoices ?? []).map((inv) => {
                  const id = String(inv.id);
                  const ok = Boolean(matchedIds[id]);
                  return (
                    <div key={id} className="p-3.5 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-soft)]/50 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <div className="font-bold">{String(inv.invoice_no)} · {String(inv.counterparty_name)}</div>
                        <div className="text-[11px] text-[var(--bw-muted)] font-mono-num">Expected Credit: {fmtAed(Number(inv.total_aed))}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setMatchedIds((p) => ({ ...p, [id]: !p[id] }));
                          toast(ok ? 'Unmatched bank entry' : `Matched ${String(inv.invoice_no)} to bank feed!`);
                        }}
                        className={`px-3.5 py-1.5 rounded-full font-extrabold cursor-pointer ${ok ? 'bg-[#0e5a49] text-white' : 'bg-[#0b192c] text-[#64c4a8]'}`}
                      >
                        {ok ? '✓ Matched to Bank' : 'Match Bank Credit'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 07 PROFIT, BALANCE & VAT */}
          {tab === 'reports' && (
            <div className="space-y-5">
              <div className="grid md:grid-cols-3 gap-4 text-xs">
                <div className="bw-card p-5 space-y-2">
                  <div className="font-extrabold text-[#0e5a49] uppercase text-[10.5px]">Statement of Profit &amp; Loss</div>
                  <div className="flex justify-between"><span>Bank DSA Revenue</span><strong className="font-mono-num">{fmtAed(data?.summary.revenueAed)}</strong></div>
                  <div className="flex justify-between"><span>Operating Expenses</span><strong className="font-mono-num">{fmtAed(data?.summary.expensesAed)}</strong></div>
                  <div className="flex justify-between pt-2 border-t border-[var(--bw-line)] text-sm font-extrabold">
                    <span>Net Profit (Standard)</span><span className="font-mono-num text-[#0e5a49]">{fmtAed(data?.summary.netProfitAed)}</span>
                  </div>
                </div>
                <div className="bw-card p-5 space-y-2">
                  <div className="font-extrabold text-[#967028] uppercase text-[10.5px]">UAE FTA VAT 201 Summary (5%)</div>
                  <div className="flex justify-between"><span>Box 1 Output VAT</span><strong className="font-mono-num">{fmtAed(data?.summary.outputVatAed)}</strong></div>
                  <div className="flex justify-between"><span>Box 9 Recoverable Input VAT</span><strong className="font-mono-num">{fmtAed(data?.summary.inputVatAed)}</strong></div>
                  <div className="flex justify-between pt-2 border-t border-[var(--bw-line)] text-sm font-extrabold">
                    <span>Net FTA VAT Payable</span><span className="font-mono-num text-[#967028]">{fmtAed(data?.summary.netVatPayableAed)}</span>
                  </div>
                </div>
                <div className="bw-card p-5 space-y-2">
                  <div className="font-extrabold text-[var(--bw-ink)] uppercase text-[10.5px]">IFRS Balance &amp; Exports</div>
                  <p className="text-[11px] text-[var(--bw-muted)]">Export complete Trial Balance, GL &amp; VAT 201 inside the 17-sheet Master Excel workbook.</p>
                  <a href="/api/v1/utilities/master-backup-excel" className="bw-btn bw-btn-obsidian w-full text-xs py-2 min-h-[36px] mt-1">
                    <Download size={13} className="text-[#64c4a8]" /> Export GL &amp; VAT (.xlsx)
                  </a>
                </div>
              </div>

              <div className="bw-card p-5 overflow-x-auto">
                <h3 className="text-sm font-extrabold mb-3">UAE IFRS Chart of Accounts ({data?.coa.length ?? 0})</h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {(data?.coa ?? []).map((a) => (
                    <div key={a.code} className="flex items-center justify-between rounded-xl border border-[var(--bw-line)] px-3 py-2 text-xs">
                      <div>
                        <span className="font-mono font-bold text-[#0e5a49] mr-2">{a.code}</span>
                        <span className="font-medium">{a.name}</span>
                      </div>
                      <StatusPill label={a.account_type} tone="slate" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
