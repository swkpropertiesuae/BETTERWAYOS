import React, { useEffect, useState } from 'react';
import { AlertOctagon, CheckCircle2, Plus, ShieldCheck, Wallet } from 'lucide-react';
import { apiFetch, fmtAed } from '../lib/api';
import { useAuth } from '../lib/auth-context';
import { UAE_BANKS } from '@shared/banks-data';
import { LEGAL_UAE_PAYMENT_CHANNELS } from '@shared/workflow-constants';
import { BankBadge, ModalDialog, PageHeader, StatusPill } from '../components/UiPrimitives';

export function FinancePage() {
  const { user, toast } = useAuth();
  const [ledger, setLedger] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    case_code: 'BW-2026-M01',
    borrower_name: 'Afshin Behbahani',
    bank_key: 'dib',
    bank_name: 'Dubai Islamic Bank',
    loan_disbursed_aed: 2238779,
    dsa_rate_pct: 0.85,
    partner_share_aed: 4750,
    payment_channel: LEGAL_UAE_PAYMENT_CHANNELS[0] as string,
  });

  const load = async () => {
    const d = await apiFetch<{ ledger: any[]; withdrawals: any[] }>('/api/finance');
    setLedger(d.ledger || []);
    setWithdrawals(d.withdrawals || []);
  };

  useEffect(() => {
    void load();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiFetch<any>('/api/finance/entries', { method: 'POST', body: JSON.stringify(form) });
      toast(`Posted DSA invoice ${res.invoice_ref} (${fmtAed(res.gross_dsa_aed)} + 5% VAT)`);
      setOpen(false);
      await load();
    } catch (err: any) {
      toast(err.message, 'err');
    }
  };

  const testPersonalGuard = async () => {
    try {
      await apiFetch('/api/finance/entries', {
        method: 'POST',
        body: JSON.stringify({ ...form, payment_channel: 'Advisor Personal Bank Account' }),
      });
    } catch (err: any) {
      toast(`GUARD BLOCKED (400): ${err.message}`, 'err');
    }
  };

  const approveLedger = async (id: string) => {
    try {
      await apiFetch(`/api/finance/entries/${id}/approve`, { method: 'POST' });
      toast('DSA settlement approved & reconciled by Owner');
      await load();
    } catch (err: any) {
      toast(err.message, 'err');
    }
  };

  const decideWithdrawal = async (id: string, decision: 'Approved' | 'Rejected') => {
    try {
      await apiFetch(`/api/withdrawals/${id}/decide`, { method: 'POST', body: JSON.stringify({ decision }) });
      toast(`Withdrawal ${decision} by Owner authority`);
      await load();
    } catch (err: any) {
      toast(err.message, 'err');
    }
  };

  const totalGross = ledger.reduce((s, r) => s + Number(r.gross_dsa_aed || 0), 0);
  const totalVat = ledger.reduce((s, r) => s + Number(r.vat_aed || 0), 0);
  const totalSwk = ledger.reduce((s, r) => s + Number(r.swk_relay_fee_aed || 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Treasury, Bank DSA Commissions & UAE Legal Payment Guard"
        title="Finance, Commissions &"
        accent="Withdrawals"
        subtitle="Zero-tolerance corporate payment enforcement (personal advisor accounts blocked at API level), 5% UAE VAT, 6-month bank clawback watch, SWK Dual-Relay attribution, and Owner refund sign-offs."
        actions={
          <>
            <button
              type="button"
              onClick={() => void testPersonalGuard()}
              className="px-4 py-2 rounded-full text-xs font-bold border border-red-500/40 text-red-600 dark:text-red-400 bg-red-500/5 flex items-center gap-1.5 cursor-pointer"
            >
              <AlertOctagon size={14} /> Test Personal-Account Block
            </button>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="px-4 py-2 rounded-full text-xs font-bold text-white bg-gradient-to-r from-[#179373] to-[#0A4A3E] flex items-center gap-1.5 cursor-pointer"
            >
              <Plus size={14} /> Post DSA Invoice
            </button>
          </>
        }
      />

      <div className="grid sm:grid-cols-3 gap-4">
        <div className="bw-card p-5 bg-[#070E1A] text-white border-[#D7B158]/35">
          <div className="text-[11px] uppercase tracking-wider text-[#D7B158] font-bold">Total Bank DSA Ledger</div>
          <div className="text-2xl font-bold font-mono-num mt-1">{fmtAed(totalGross)}</div>
          <div className="text-xs text-slate-300 mt-1">UAE 5% Output VAT: {fmtAed(totalVat)}</div>
        </div>
        <div className="bw-card p-5">
          <div className="text-[11px] uppercase tracking-wider text-[var(--bw-muted)] font-bold">SWK Dual-Relay Synergy</div>
          <div className="text-2xl font-bold font-mono-num mt-1 text-[#179373]">{fmtAed(totalSwk)}</div>
          <div className="text-xs text-[var(--bw-muted)] mt-1">Cross-venture brokerage fee capture</div>
        </div>
        <div className="bw-card p-5">
          <div className="text-[11px] uppercase tracking-wider text-[var(--bw-muted)] font-bold">Legal Payment Control</div>
          <div className="text-sm font-bold text-[#179373] mt-1.5 flex items-center gap-1.5">
            <ShieldCheck size={18} /> Zero-Personal-Account Guard ON
          </div>
          <div className="text-xs text-[var(--bw-muted)] mt-1">5 licensed UAE corporate / escrow rails only</div>
        </div>
      </div>

      {/* Bank DSA Commission Ledger */}
      <div className="bw-card overflow-x-auto">
        <div className="px-5 py-3.5 border-b border-[var(--bw-line)] font-bold text-sm flex items-center gap-2">
          <Wallet size={16} className="text-[#179373]" /> Bank DSA Invoices, Clawback Watch &amp; Payouts
        </div>
        <table className="w-full text-left text-xs min-w-[960px]">
          <thead className="bg-[var(--bw-soft)] text-[10.5px] uppercase text-[var(--bw-muted)]">
            <tr>
              <th className="p-3.5">Invoice</th>
              <th className="p-3.5">Case &amp; Borrower</th>
              <th className="p-3.5">Lender</th>
              <th className="p-3.5">Loan / Gross DSA / VAT</th>
              <th className="p-3.5">Payment Channel</th>
              <th className="p-3.5">Clawback Until</th>
              <th className="p-3.5">Status / Owner Sign-Off</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--bw-line)]">
            {ledger.map((r) => (
              <tr key={r.id}>
                <td className="p-3.5 font-mono-num font-bold text-[#179373]">{r.invoice_ref}</td>
                <td className="p-3.5">
                  <div className="font-bold">{r.borrower_name}</div>
                  <div className="text-[11px] text-[var(--bw-muted)]">{r.case_code}</div>
                </td>
                <td className="p-3.5"><BankBadge bankKey={r.bank_key} /></td>
                <td className="p-3.5 font-mono-num">
                  <div className="font-bold">{fmtAed(r.gross_dsa_aed)} ({r.dsa_rate_pct}%)</div>
                  <div className="text-[11px] text-[var(--bw-muted)]">Loan {fmtAed(r.loan_disbursed_aed, true)} · VAT {fmtAed(r.vat_aed)}</div>
                </td>
                <td className="p-3.5 max-w-[200px] text-[11px]">{r.payment_channel}</td>
                <td className="p-3.5 font-mono-num">{r.clawback_until}</td>
                <td className="p-3.5">
                  <div className="flex items-center gap-2">
                    <StatusPill label={r.status} tone={r.status === 'Settled' ? 'emerald' : 'gold'} />
                    {r.status !== 'Settled' && user?.can_approve_payouts === 1 && (
                      <button
                        type="button"
                        onClick={() => void approveLedger(r.id)}
                        className="px-2.5 py-1 rounded-full bg-[#070E1A] text-[#FCF1B7] font-bold cursor-pointer"
                      >
                        Approve
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Withdrawals & Client Refund Governance */}
      <div className="bw-card p-5 space-y-3">
        <h3 className="text-sm font-bold">Deal Withdrawals &amp; Refund Protection (Owner Shabib Siraj Approval)</h3>
        {withdrawals.map((w) => (
          <div key={w.id} className="p-4 rounded-2xl bg-[var(--bw-soft)]/70 border border-[var(--bw-line)] flex flex-wrap items-center justify-between gap-4 text-xs">
            <div>
              <div className="font-bold text-sm">{w.case_code} — {w.borrower_name}</div>
              <div className="text-[var(--bw-muted)] mt-0.5">{w.reason} · Requested by {w.requested_by}</div>
              <div className="font-mono-num mt-1">
                Paid: <b>{fmtAed(w.paid_fee_aed)}</b> · Deduction: <b>{fmtAed(w.deduction_aed)}</b> · Refundable:{' '}
                <b className="text-[#179373]">{fmtAed(w.refundable_aed)}</b>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <StatusPill label={w.status} tone={w.status.includes('Approved') ? 'emerald' : w.status.includes('Rejected') ? 'red' : 'gold'} />
              {w.status === 'Pending Owner Approval' && user?.can_approve_payouts === 1 && (
                <>
                  <button type="button" onClick={() => void decideWithdrawal(w.id, 'Approved')} className="px-3 py-1.5 rounded-full bg-[#179373] text-white font-bold flex items-center gap-1 cursor-pointer">
                    <CheckCircle2 size={13} /> Approve Refund
                  </button>
                  <button type="button" onClick={() => void decideWithdrawal(w.id, 'Rejected')} className="px-3 py-1.5 rounded-full bg-red-600 text-white font-bold cursor-pointer">
                    Reject
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      <ModalDialog open={open} onClose={() => setOpen(false)} title="Post Bank DSA Commission Invoice" subtitle="Strictly enforces licensed UAE corporate payment rails.">
        <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold mb-1">Case Code</label>
              <input value={form.case_code} onChange={(e) => setForm({ ...form, case_code: e.target.value })} className="w-full h-10 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-card)]" />
            </div>
            <div>
              <label className="block font-bold mb-1">Borrower Name</label>
              <input value={form.borrower_name} onChange={(e) => setForm({ ...form, borrower_name: e.target.value })} className="w-full h-10 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-card)]" />
            </div>
            <div>
              <label className="block font-bold mb-1">Lending Bank</label>
              <select
                value={form.bank_key}
                onChange={(e) => {
                  const bk = UAE_BANKS.find((b) => b.key === e.target.value);
                  setForm({ ...form, bank_key: e.target.value, bank_name: bk?.name || e.target.value, dsa_rate_pct: bk?.dsaRatePct || 0.85 });
                }}
                className="w-full h-10 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-card)]"
              >
                {UAE_BANKS.map((b) => <option key={b.key} value={b.key}>{b.name} ({b.dsaRatePct}% DSA)</option>)}
              </select>
            </div>
            <div>
              <label className="block font-bold mb-1">Disbursed Loan (AED)</label>
              <input type="number" value={form.loan_disbursed_aed} onChange={(e) => setForm({ ...form, loan_disbursed_aed: Number(e.target.value) })} className="w-full h-10 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-card)] font-mono-num" />
            </div>
            <div className="sm:col-span-2">
              <label className="block font-bold mb-1">Permitted Legal UAE Payment Channel</label>
              <select value={form.payment_channel} onChange={(e) => setForm({ ...form, payment_channel: e.target.value })} className="w-full h-10 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-card)]">
                {LEGAL_UAE_PAYMENT_CHANNELS.map((ch) => <option key={ch} value={ch}>{ch}</option>)}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 rounded-full border border-[var(--bw-line)] font-bold">Cancel</button>
            <button type="submit" className="px-5 py-2 rounded-full bg-[#179373] text-white font-bold cursor-pointer">Post Invoice</button>
          </div>
        </form>
      </ModalDialog>
    </div>
  );
}
