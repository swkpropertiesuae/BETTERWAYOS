'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Lock,
  Plus,
  Receipt,
  ShieldAlert,
  Wallet,
} from 'lucide-react';
import { useOs } from '@/components/os/OsProvider';
import { fmtAed, MetricTile, PageHeader, StatusPill } from '@/components/os/UiKit';

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
  const { user } = useOs();
  const [tab, setTab] = useState<'invoices' | 'expenses' | 'payouts' | 'coa'>('invoices');
  const [data, setData] = useState<AccountsPayload | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  // Invoice form
  const [invCounterparty, setInvCounterparty] = useState('Emirates NBD PJSC — Mortgage DSA');
  const [invTrn, setInvTrn] = useState('100049281700003');
  const [invSubtotal, setInvSubtotal] = useState('18500');
  const [invIban, setInvIban] = useState('AE460260001015889900101');

  // Expense form
  const [expVendor, setExpVendor] = useState('Etisalat Business Fiber — Oud Metha');
  const [expDesc, setExpDesc] = useState('Monthly Office Fiber + Static IP');
  const [expAmount, setExpAmount] = useState('1499');
  const [expAccount, setExpAccount] = useState('5200');

  // Corporate Payout form (2-of-2 Owner sign-off)
  const [payBrokerId, setPayBrokerId] = useState('');
  const [payName, setPayName] = useState('SWK Properties LLC');
  const [payAccountType, setPayAccountType] = useState('CORPORATE');
  const [payIban, setPayIban] = useState('AE460260001015889900202');
  const [payBank, setPayBank] = useState('Wio Business UAE');
  const [payAmount, setPayAmount] = useState('6500');
  const [payOrnOk, setPayOrnOk] = useState(true);
  const [payLetterOk, setPayLetterOk] = useState(true);

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
    load();
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
      setNotice(`Recorded expense for ${expVendor} via Betterway Corporate Bank Account.`);
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
      setNotice(
        `Payout ${j.payout.payout_code} queued for 2-of-2 Owner Dual Sign-Off (Warda Kapadia + Shabib Siraj).`,
      );
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Corporate Guard blocked payout');
    } finally {
      setBusy(false);
    }
  }

  const canAccess = user?.role === 'OWNER' || user?.role === 'OFFICE_ADMIN';

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Finance · UAE FTA VAT 5% · Corporate-Account-Only Guard"
        title="Accounts &"
        accent="UAE VAT Ledger"
        subtitle="Standard company General Ledger, Bank DSA Invoices (PINT-AE XML), Expenses, and Corporate-Account-Only RERA Broker Payouts (2-of-2 Owner sign-off)."
        actions={
          user?.isOwner ? (
            <Link
              href="/os/executive"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#0A1128] text-[#FCF1B7] border border-[#D4AF37]/40 px-3.5 py-2 text-xs font-bold hover:brightness-110"
            >
              <Lock size={13} /> Open Consolidated VAT &amp; Privacy Fast Track
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
          {user?.isOwner && (
            <div className="rounded-2xl bg-[#0A1128] text-white border border-[#D4AF37]/35 p-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Lock className="text-[#D4AF37] shrink-0" size={18} />
                <div className="text-xs sm:text-sm">
                  <strong className="text-[#FCF1B7]">Segregated Option A Architecture Active:</strong> This screen displays strictly the Standard Company Ledger (visible to Office Admin). Owner Privacy Fast Track revenue &amp; Consolidated UAE VAT 201 live exclusively inside <strong>{user.executiveAppTitle || "Executive Place"}</strong>.
                </div>
              </div>
              <Link href="/os/executive" className="text-xs font-bold text-[#34DFAC] hover:underline">
                View Consolidated P&amp;L →
              </Link>
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-red-400/40 bg-red-50 dark:bg-red-950/30 p-3 text-xs font-semibold text-red-700 dark:text-red-300">
              {error}
            </div>
          )}
          {notice && (
            <div className="rounded-xl border border-emerald-500/35 bg-emerald-50 dark:bg-emerald-950/30 p-3 text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
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

          <div className="flex flex-wrap gap-2">
            {(
              [
                ['invoices', 'Bank DSA Invoices & PINT-AE', Receipt],
                ['expenses', 'Corporate Expenses', Wallet],
                ['payouts', 'RERA Payouts (2-of-2 Guard)', Building2],
                ['coa', `Chart of Accounts (${data?.coa.length ?? 50})`, FileSpreadsheet],
              ] as const
            ).map(([key, label, Icon]) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border transition ${
                  tab === key
                    ? 'bg-[#083B2E] text-white border-[#083B2E]'
                    : 'bg-[var(--bw-card)] border-[var(--bw-line)] text-[var(--bw-ink)] hover:border-[#0B664F]'
                }`}
              >
                <Icon size={14} /> {label}
              </button>
            ))}
          </div>

          {tab === 'invoices' && (
            <div className="grid lg:grid-cols-3 gap-5">
              <form onSubmit={submitInvoice} className="rounded-2xl bg-[var(--bw-card)] border border-[var(--bw-line)] p-5 space-y-3">
                <h2 className="text-sm font-extrabold flex items-center gap-1.5">
                  <Plus size={15} className="text-[var(--bw-emerald)]" /> Issue Bank DSA / Advisory Tax Invoice
                </h2>
                <p className="text-[11px] text-[var(--bw-muted)]">
                  Auto-applies 5% UAE FTA VAT, posts double-entry GL journal (`1100` Dr / `4000` Cr), and locks to Betterway Corporate IBAN.
                </p>
                <input
                  value={invCounterparty}
                  onChange={(e) => setInvCounterparty(e.target.value)}
                  placeholder="Bank / Counterparty Legal Name"
                  className="w-full rounded-xl border border-[var(--bw-line)] bg-transparent px-3 py-2 text-xs"
                  required
                />
                <input
                  value={invTrn}
                  onChange={(e) => setInvTrn(e.target.value)}
                  placeholder="Counterparty UAE TRN (15 digits)"
                  className="w-full rounded-xl border border-[var(--bw-line)] bg-transparent px-3 py-2 text-xs"
                />
                <input
                  type="number"
                  value={invSubtotal}
                  onChange={(e) => setInvSubtotal(e.target.value)}
                  placeholder="Subtotal AED (excl. VAT)"
                  className="w-full rounded-xl border border-[var(--bw-line)] bg-transparent px-3 py-2 text-xs"
                  required
                />
                <input
                  value={invIban}
                  onChange={(e) => setInvIban(e.target.value)}
                  placeholder="Betterway Corporate Receiving IBAN (AE...)"
                  className="w-full rounded-xl border border-[var(--bw-line)] bg-transparent px-3 py-2 text-xs font-mono"
                  required
                />
                <button
                  disabled={busy}
                  className="w-full rounded-xl bg-[#083B2E] text-white py-2.5 text-xs font-bold hover:brightness-110 disabled:opacity-50"
                >
                  {busy ? 'Issuing…' : 'Issue UAE Tax Invoice (5% VAT)'}
                </button>
              </form>

              <div className="lg:col-span-2 rounded-2xl bg-[var(--bw-card)] border border-[var(--bw-line)] p-5 space-y-3 overflow-x-auto">
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
                          <a
                            href={`/api/v1/accounts?pintInvoiceId=${String(inv.id)}`}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-[var(--bw-emerald)] hover:underline"
                          >
                            <Download size={12} /> XML
                          </a>
                        </td>
                      </tr>
                    ))}
                    {(data?.invoices.length ?? 0) === 0 && (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-[var(--bw-muted)]">
                          No standard invoices yet. Issue your first Bank DSA Tax Invoice on the left.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'expenses' && (
            <div className="grid lg:grid-cols-3 gap-5">
              <form onSubmit={submitExpense} className="rounded-2xl bg-[var(--bw-card)] border border-[var(--bw-line)] p-5 space-y-3">
                <h2 className="text-sm font-extrabold">Record Corporate Expense</h2>
                <input
                  value={expVendor}
                  onChange={(e) => setExpVendor(e.target.value)}
                  placeholder="Vendor Legal Name"
                  className="w-full rounded-xl border border-[var(--bw-line)] bg-transparent px-3 py-2 text-xs"
                  required
                />
                <input
                  value={expDesc}
                  onChange={(e) => setExpDesc(e.target.value)}
                  placeholder="Description"
                  className="w-full rounded-xl border border-[var(--bw-line)] bg-transparent px-3 py-2 text-xs"
                  required
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    value={expAmount}
                    onChange={(e) => setExpAmount(e.target.value)}
                    placeholder="Amount AED"
                    className="rounded-xl border border-[var(--bw-line)] bg-transparent px-3 py-2 text-xs"
                    required
                  />
                  <input
                    value={expAccount}
                    onChange={(e) => setExpAccount(e.target.value)}
                    placeholder="COA Code (e.g. 5200)"
                    className="rounded-xl border border-[var(--bw-line)] bg-transparent px-3 py-2 text-xs font-mono"
                    required
                  />
                </div>
                <button disabled={busy} className="w-full rounded-xl bg-[#083B2E] text-white py-2.5 text-xs font-bold">
                  Post Expense
                </button>
              </form>
              <div className="lg:col-span-2 rounded-2xl bg-[var(--bw-card)] border border-[var(--bw-line)] p-5 space-y-3 overflow-x-auto">
                <h3 className="text-sm font-extrabold">Recorded Corporate Expenses ({data?.expenses.length ?? 0})</h3>
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

          {tab === 'payouts' && (
            <div className="grid lg:grid-cols-3 gap-5">
              <form onSubmit={submitPayout} className="rounded-2xl bg-[var(--bw-card)] border border-[var(--bw-line)] p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-extrabold">RERA Partner Broker Payout</h2>
                  <StatusPill label="2-of-2 Owners" tone="navy" />
                </div>
                <p className="text-[11px] text-[var(--bw-muted)]">
                  Corporate-Account-Only Guard enforces verified UAE Corporate IBAN, verified RERA ORN, verified Bank Letter, and requires BOTH Warda Kapadia AND Shabib Siraj to sign off.
                </p>
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
                  className="w-full rounded-xl border border-[var(--bw-line)] bg-[var(--bw-card)] px-3 py-2 text-xs"
                >
                  <option value="">Select Registered RERA Partner Brokerage (Required)</option>
                  {(data?.brokers ?? []).map((b) => (
                    <option key={String(b.id)} value={String(b.id)}>
                      {String(b.agency_name)} · ORN {String(b.orn_number)}
                    </option>
                  ))}
                </select>
                <input
                  value={payName}
                  onChange={(e) => setPayName(e.target.value)}
                  placeholder="Corporate Payee Legal Entity"
                  className="w-full rounded-xl border border-[var(--bw-line)] bg-transparent px-3 py-2 text-xs"
                  required
                />
                <select
                  value={payAccountType}
                  onChange={(e) => setPayAccountType(e.target.value)}
                  className="w-full rounded-xl border border-[var(--bw-line)] bg-[var(--bw-card)] px-3 py-2 text-xs"
                >
                  <option value="CORPORATE">CORPORATE — Verified UAE Entity Bank Account</option>
                  <option value="PERSONAL">PERSONAL — (Will be blocked by Corporate Guard)</option>
                  <option value="CASH">CASH — (Will be blocked by Corporate Guard)</option>
                </select>
                <input
                  value={payIban}
                  onChange={(e) => setPayIban(e.target.value)}
                  placeholder="UAE Corporate IBAN (AE + 21 digits)"
                  className="w-full rounded-xl border border-[var(--bw-line)] bg-transparent px-3 py-2 text-xs font-mono"
                  required
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    value={payBank}
                    onChange={(e) => setPayBank(e.target.value)}
                    placeholder="Bank Name"
                    className="rounded-xl border border-[var(--bw-line)] bg-transparent px-3 py-2 text-xs"
                  />
                  <input
                    type="number"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    placeholder="Amount AED"
                    className="rounded-xl border border-[var(--bw-line)] bg-transparent px-3 py-2 text-xs"
                    required
                  />
                </div>
                <label className="flex items-center gap-2 text-xs">
                  <input type="checkbox" checked={payOrnOk} onChange={(e) => setPayOrnOk(e.target.checked)} />
                  RERA ORN Certificate Verified
                </label>
                <label className="flex items-center gap-2 text-xs">
                  <input type="checkbox" checked={payLetterOk} onChange={(e) => setPayLetterOk(e.target.checked)} />
                  Corporate Bank Account Letter Verified
                </label>
                <button disabled={busy} className="w-full rounded-xl bg-[#0A1128] text-[#FCF1B7] py-2.5 text-xs font-bold">
                  Queue Payout for 2-of-2 Owner Release
                </button>
              </form>

              <div className="lg:col-span-2 rounded-2xl bg-[var(--bw-card)] border border-[var(--bw-line)] p-5 space-y-3 overflow-x-auto">
                <h3 className="text-sm font-extrabold">Outgoing Corporate Payout Queue ({data?.payouts.length ?? 0})</h3>
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
                          <StatusPill
                            label={String(p.status)}
                            tone={String(p.status) === 'READY_TO_PAY' || String(p.status) === 'PAID' ? 'emerald' : 'gold'}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'coa' && (
            <div className="rounded-2xl bg-[var(--bw-card)] border border-[var(--bw-line)] p-5 overflow-x-auto">
              <h3 className="text-sm font-extrabold mb-3">UAE IFRS Chart of Accounts ({data?.coa.length ?? 0})</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {(data?.coa ?? []).map((a) => (
                  <div
                    key={a.code}
                    className="flex items-center justify-between rounded-xl border border-[var(--bw-line)] px-3 py-2 text-xs"
                  >
                    <div>
                      <span className="font-mono font-bold text-[var(--bw-emerald)] mr-2">{a.code}</span>
                      <span className="font-medium">{a.name}</span>
                    </div>
                    <StatusPill label={a.account_type} tone="slate" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
