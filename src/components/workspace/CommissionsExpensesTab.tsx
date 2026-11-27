'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Download, FileText, Image as ImageIcon, Plus, Printer, Trash2, Wallet } from 'lucide-react';
import { useOs } from '@/components/os/OsProvider';
import { fmtAed, MetricTile, StatusPill } from '@/components/os/UiKit';
import {
  CLOSING_TRACKS,
  COMMISSION_ENTRY_TYPES,
  COMMISSION_PAYMENT_MODES,
  COMMISSION_STATUSES,
  type CommissionEntryType,
} from '@/lib/workspace/domain';
import { downloadCsv, downloadJpegDocument, downloadWordDocument, printBrandedDocument } from '@/lib/workspace/exporters';

export function CommissionsExpensesTab() {
  const { user, toast } = useOs();
  const [data, setData] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [modeFilter, setModeFilter] = useState('ALL');

  const [form, setForm] = useState({
    entryType: 'Advisor DSA Commission' as CommissionEntryType,
    agentUserId: 'USR-07',
    agentName: 'Asif Khan',
    dealRef: '',
    propertyLabel: '',
    track: 'Ready Purchase Mortgage',
    grossAmountAed: 25_000,
    splitPct: 50,
    status: 'Pending' as 'Pending' | 'Received' | 'Paid',
    paymentMode: 'Bank Transfer (BT)',
    paymentReference: '',
    expenseCategory: '',
    isThirdParty: false,
    thirdPartyAgency: '',
    thirdPartyAgentName: '',
    thirdPartyBrn: '',
    thirdPartyPhone: '',
    thirdPartyEmail: '',
    thirdPartyPaymentDetails: '',
    notes: '',
  });

  const load = useCallback(async () => {
    const r = await fetch('/api/v1/workspace/commissions-expenses', { cache: 'no-store' });
    if (r.ok) setData(await r.json());
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const addEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = await fetch('/api/v1/workspace/commissions-expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const out = await r.json();
    if (!r.ok) {
      toast(out.error || 'Failed to save entry', 'err');
      return;
    }
    toast(`Recorded ${out.entry.entry_no} (${fmtAed(out.entry.net_amount_aed)} · ${out.entry.payment_mode})!`);
    setForm((f) => ({ ...f, dealRef: '', propertyLabel: '', paymentReference: '', notes: '' }));
    await load();
  };

  const setStatus = async (id: string, status: 'Pending' | 'Received' | 'Paid') => {
    const r = await fetch('/api/v1/workspace/commissions-expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update_status', id, status }),
    });
    if (r.ok) {
      toast(`Marked as ${status}`);
      await load();
    }
  };

  const deleteEntry = async (id: string) => {
    const r = await fetch('/api/v1/workspace/commissions-expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', id }),
    });
    if (r.ok) {
      toast('Entry deleted');
      await load();
    }
  };

  const entries: any[] = (data?.entries ?? []).filter((e: any) => {
    if (statusFilter !== 'ALL' && e.status !== statusFilter) return false;
    if (modeFilter !== 'ALL' && e.payment_mode !== modeFilter) return false;
    return true;
  });

  const totals = data?.summary?.totals ?? {
    totalReceivedAed: 0,
    totalPaidAed: 0,
    totalPendingAed: 0,
    totalExpensesAed: 0,
    totalThirdPartyAed: 0,
  };
  const agentSummaries: any[] = data?.summary?.agents ?? [];

  const exportStatementPayload = {
    filename: `Betterway_Advisor_DSA_Commissions_Expenses_${new Date().toISOString().slice(0, 10)}`,
    badge: 'OWNER ADVISOR DSA COMMISSION & CASE EXPENSE SETTLEMENT STATEMENT',
    title: 'Mortgage Advisor DSA Commissions, Case Expenses & RERA Partner Splits',
    subtitle: `Prepared for ${user?.name} · Paid / Received / Pending across Cash, Bank Transfer (BT) & Botim`,
    sealedBy: user?.name,
    metaPairs: [
      { label: 'Bank DSA Received', value: fmtAed(totals.totalReceivedAed) },
      { label: 'Total Paid Out', value: fmtAed(totals.totalPaidAed) },
      { label: 'Total Pending', value: fmtAed(totals.totalPendingAed) },
      { label: 'Advisor Case Expenses', value: fmtAed(totals.totalExpensesAed) },
      { label: 'RERA Partner Splits', value: fmtAed(totals.totalThirdPartyAed) },
    ],
    sections: [
      {
        heading: 'Per-Advisor Net Settlement Summary',
        rows: agentSummaries.map((a) => ({
          label: a.agentName,
          value: `Received ${fmtAed(a.commissionReceivedAed)} | Paid ${fmtAed(a.commissionPaidAed)} | Pending ${fmtAed(a.commissionPendingAed)} | Expenses ${fmtAed(a.expensesByAgentAed)} | Net Due ${fmtAed(a.netBalanceDueAed)}`,
        })),
      },
      {
        heading: `Detailed Mortgage Settlement Entries (${entries.length})`,
        rows: entries.slice(0, 40).map((e) => ({
          label: `${e.entry_no} · ${e.agent_name} (${e.entry_type})`,
          value: `${fmtAed(e.net_amount_aed)} · ${e.status} · ${e.payment_mode} ${e.is_third_party ? `· Partner ORN: ${e.third_party_agency} (${e.third_party_agent_name})` : ''}`,
        })),
      },
    ],
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-extrabold flex items-center gap-2">
            <Wallet size={16} className="text-[#D4AF37]" /> Advisor DSA Commissions &amp; Case Expenses Ledger (Paid · Received · Pending)
          </h2>
          <p className="text-xs text-[var(--bw-muted)]">
            Track every Mortgage Advisor Bank DSA commission, advisor case expense, draw/advance, and RERA Partner Referral split across Cash, Bank Transfer (BT), Botim, or Manager Cheque.
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5 text-xs">
          <button
            type="button"
            onClick={() =>
              downloadCsv(
                'Betterway_Advisor_DSA_Commissions_Expenses',
                ['Entry No', 'Date', 'Type', 'Mortgage Advisor', 'Case Ref', 'Bank / Facility', 'Track', 'Gross DSA AED', 'Advisor Split %', 'Net AED', 'Status', 'Payment Mode', 'Ref', 'Partner Brokerage', 'Partner Broker', 'ORN/BRN', 'Partner Phone'],
                entries.map((e) => [
                  e.entry_no, e.entry_date, e.entry_type, e.agent_name, e.deal_ref, e.property_label, e.track,
                  e.gross_amount_aed, e.split_pct, e.net_amount_aed, e.status, e.payment_mode, e.payment_reference,
                  e.third_party_agency, e.third_party_agent_name, e.third_party_brn, e.third_party_phone,
                ]),
              )
            }
            className="px-3 py-1.5 rounded-full border border-[var(--bw-line)] font-bold inline-flex items-center gap-1 cursor-pointer"
          >
            <Download size={12} /> CSV
          </button>
          <button type="button" onClick={() => downloadWordDocument(exportStatementPayload)} className="px-3 py-1.5 rounded-full bg-[#0A1128] text-[#FCF1B7] font-bold inline-flex items-center gap-1 cursor-pointer">
            <FileText size={12} /> .DOC
          </button>
          <button type="button" onClick={() => void downloadJpegDocument(exportStatementPayload)} className="px-3 py-1.5 rounded-full bg-[#0D8A6A] text-white font-bold inline-flex items-center gap-1 cursor-pointer">
            <ImageIcon size={12} /> .JPEG
          </button>
          <button type="button" onClick={() => printBrandedDocument(exportStatementPayload)} className="px-3 py-1.5 rounded-full border border-[var(--bw-line)] font-bold inline-flex items-center gap-1 cursor-pointer">
            <Printer size={12} /> PDF
          </button>
        </div>
      </div>

      {/* KPI Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <MetricTile label="DSA Received" value={fmtAed(totals.totalReceivedAed, true)} tone="emerald" />
        <MetricTile label="Paid Out" value={fmtAed(totals.totalPaidAed, true)} tone="navy" />
        <MetricTile label="Pending" value={fmtAed(totals.totalPendingAed, true)} tone="gold" />
        <MetricTile label="Advisor Expenses" value={fmtAed(totals.totalExpensesAed, true)} />
        <MetricTile label="Partner Splits" value={fmtAed(totals.totalThirdPartyAed, true)} tone="navy" />
      </div>

      <div className="grid lg:grid-cols-12 gap-5">
        {/* Add Advisor DSA Commission / Case Expense Form */}
        <form onSubmit={addEntry} className="lg:col-span-4 bw-card p-5 space-y-3 text-xs">
          <h3 className="text-sm font-extrabold flex items-center gap-1.5">
            <Plus size={15} className="text-[#0D8A6A]" /> Log Advisor DSA Commission or Case Expense
          </h3>
          <div>
            <label className="font-bold block mb-1">Settlement Entry Type</label>
            <select value={form.entryType} onChange={(e) => setForm({ ...form, entryType: e.target.value as CommissionEntryType, isThirdParty: e.target.value === 'RERA Partner Referral Split' ? true : form.isThirdParty })} className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-bg)] font-bold">
              {COMMISSION_ENTRY_TYPES.map((et) => (
                <option key={et} value={et}>{et}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="font-bold block mb-1">Mortgage Advisor / Staff Member</label>
            <select
              value={form.agentUserId}
              onChange={(e) => {
                const st = (data?.staff ?? []).find((s: any) => s.id === e.target.value);
                setForm({ ...form, agentUserId: e.target.value, agentName: st?.name || form.agentName });
              }}
              className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-bg)]"
            >
              {(data?.staff ?? []).map((s: any) => (
                <option key={s.id} value={s.id}>{s.name} ({s.designation})</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-bold block mb-1">Mortgage Case Ref</label>
              <input value={form.dealRef} onChange={(e) => setForm({ ...form, dealRef: e.target.value })} placeholder="BW-2026-01" className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-bg)]" />
            </div>
            <div>
              <label className="font-bold block mb-1">Mortgage Track</label>
              <select value={form.track} onChange={(e) => setForm({ ...form, track: e.target.value })} className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-bg)]">
                {CLOSING_TRACKS.map((tr) => <option key={tr}>{tr}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="font-bold block mb-1">Bank / Case Expense Description</label>
            <input value={form.propertyLabel} onChange={(e) => setForm({ ...form, propertyLabel: e.target.value })} placeholder="ENBD Disbursal DSA / Valuation Fee / Trustee Expense" className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-bg)]" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-bold block mb-1">Gross Bank DSA / Amt (AED)</label>
              <input type="number" required value={form.grossAmountAed} onChange={(e) => setForm({ ...form, grossAmountAed: Number(e.target.value) })} className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-bg)] font-mono-num" />
            </div>
            <div>
              <label className="font-bold block mb-1">Advisor / Partner Split %</label>
              <input type="number" value={form.splitPct} onChange={(e) => setForm({ ...form, splitPct: Number(e.target.value) })} className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-bg)] font-mono-num" />
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-[var(--bw-soft)] font-mono-num text-center font-bold">
            Net Amount: <span className="text-[#0D8A6A]">{fmtAed((form.grossAmountAed * form.splitPct) / 100)}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-bold block mb-1">Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as any })} className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-bg)] font-bold">
                {COMMISSION_STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="font-bold block mb-1">Payment Mode</label>
              <select value={form.paymentMode} onChange={(e) => setForm({ ...form, paymentMode: e.target.value })} className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-bg)] font-bold">
                {COMMISSION_PAYMENT_MODES.map((m) => <option key={m}>{m}</option>)}
              </select>
            </div>
          </div>
          <input value={form.paymentReference} onChange={(e) => setForm({ ...form, paymentReference: e.target.value })} placeholder="Bank Transfer Ref / Botim Txn / Receipt #" className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-bg)]" />

          <label className="flex items-center gap-2 font-bold cursor-pointer pt-1">
            <input type="checkbox" checked={form.isThirdParty} onChange={(e) => setForm({ ...form, isThirdParty: e.target.checked })} />
            Include Referring RERA Partner Brokerage (Corporate IBAN)
          </label>
          {form.isThirdParty && (
            <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-400/40 space-y-2">
              <input value={form.thirdPartyAgency} onChange={(e) => setForm({ ...form, thirdPartyAgency: e.target.value })} placeholder="Partner Brokerage Name (RERA ORN)" className="w-full h-8 px-2.5 rounded-lg border border-[var(--bw-line)] bg-[var(--bw-card)]" />
              <div className="grid grid-cols-2 gap-1.5">
                <input value={form.thirdPartyAgentName} onChange={(e) => setForm({ ...form, thirdPartyAgentName: e.target.value })} placeholder="Partner Broker Name" className="h-8 px-2.5 rounded-lg border border-[var(--bw-line)] bg-[var(--bw-card)]" />
                <input value={form.thirdPartyBrn} onChange={(e) => setForm({ ...form, thirdPartyBrn: e.target.value })} placeholder="RERA ORN / BRN" className="h-8 px-2.5 rounded-lg border border-[var(--bw-line)] bg-[var(--bw-card)]" />
                <input value={form.thirdPartyPhone} onChange={(e) => setForm({ ...form, thirdPartyPhone: e.target.value })} placeholder="Partner Phone" className="h-8 px-2.5 rounded-lg border border-[var(--bw-line)] bg-[var(--bw-card)]" />
                <input value={form.thirdPartyEmail} onChange={(e) => setForm({ ...form, thirdPartyEmail: e.target.value })} placeholder="Partner Email" className="h-8 px-2.5 rounded-lg border border-[var(--bw-line)] bg-[var(--bw-card)]" />
              </div>
              <input value={form.thirdPartyPaymentDetails} onChange={(e) => setForm({ ...form, thirdPartyPaymentDetails: e.target.value })} placeholder="Verified Corporate IBAN / Bank Details (No Personal Accounts)" className="w-full h-8 px-2.5 rounded-lg border border-[var(--bw-line)] bg-[var(--bw-card)]" />
            </div>
          )}

          <button type="submit" className="w-full h-10 rounded-full bg-[#0A1128] text-[#FCF1B7] font-extrabold cursor-pointer">
            Save Entry to Mortgage Settlement Ledger
          </button>
        </form>

        {/* Per-Advisor Summary & Full Ledger */}
        <div className="lg:col-span-8 space-y-4">
          {agentSummaries.length > 0 && (
            <div className="bw-card p-5 space-y-2.5 overflow-x-auto">
              <h3 className="text-sm font-extrabold">Per-Advisor Net Settlement Summary</h3>
              <table className="w-full text-xs min-w-[580px]">
                <thead>
                  <tr className="border-b border-[var(--bw-line)] text-[10px] uppercase text-[var(--bw-muted)]">
                    <th className="py-2 text-start">Mortgage Advisor</th>
                    <th className="py-2 text-end">DSA Received</th>
                    <th className="py-2 text-end">Paid</th>
                    <th className="py-2 text-end">Pending</th>
                    <th className="py-2 text-end">Case Expenses</th>
                    <th className="py-2 text-end">Net Balance Due</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--bw-line)] font-mono-num">
                  {agentSummaries.map((a) => (
                    <tr key={a.agentName}>
                      <td className="py-2 font-sans font-bold">{a.agentName}</td>
                      <td className="py-2 text-end text-[#0D8A6A]">{fmtAed(a.commissionReceivedAed)}</td>
                      <td className="py-2 text-end">{fmtAed(a.commissionPaidAed)}</td>
                      <td className="py-2 text-end text-amber-600">{fmtAed(a.commissionPendingAed)}</td>
                      <td className="py-2 text-end">{fmtAed(a.expensesByAgentAed)}</td>
                      <td className="py-2 text-end font-extrabold text-[#0A1128] dark:text-[#FCF1B7]">{fmtAed(a.netBalanceDueAed)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="bw-card p-5 space-y-3 overflow-x-auto">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-extrabold">Advisor DSA Commission &amp; Case Expense Entries ({entries.length})</h3>
              <div className="flex flex-wrap gap-1.5 text-[11px]">
                {['ALL', 'Pending', 'Received', 'Paid'].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatusFilter(s)}
                    className={`px-2.5 py-1 rounded-full font-bold cursor-pointer ${
                      statusFilter === s ? 'bg-[#0A1128] text-[#FCF1B7]' : 'border border-[var(--bw-line)]'
                    }`}
                  >
                    {s}
                  </button>
                ))}
                {['ALL', 'Cash', 'Bank Transfer (BT)', 'Botim'].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setModeFilter(m)}
                    className={`px-2.5 py-1 rounded-full font-bold cursor-pointer ${
                      modeFilter === m ? 'bg-[#0D8A6A] text-white' : 'border border-[var(--bw-line)]'
                    }`}
                  >
                    {m === 'ALL' ? 'All Modes' : m}
                  </button>
                ))}
              </div>
            </div>

            {entries.length === 0 ? (
              <div className="py-10 text-center text-xs text-[var(--bw-muted)]">
                No Advisor DSA commission or case expense entries recorded yet. Use the form on the left to log Paid, Received, or Pending mortgage settlements.
              </div>
            ) : (
              <table className="w-full text-xs min-w-[680px]">
                <thead>
                  <tr className="border-b border-[var(--bw-line)] text-[10px] uppercase text-[var(--bw-muted)]">
                    <th className="py-2 text-start">Entry / Mortgage Advisor</th>
                    <th className="py-2 text-start">Case &amp; RERA Partner ORN</th>
                    <th className="py-2 text-center">Mode</th>
                    <th className="py-2 text-end">Net AED</th>
                    <th className="py-2 text-center">Status</th>
                    <th className="py-2 text-end">Settle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--bw-line)]">
                  {entries.map((e) => (
                    <tr key={e.id}>
                      <td className="py-2.5">
                        <div className="font-mono-num text-[10px] font-bold text-[#0D8A6A]">{e.entry_no} · {e.entry_type}</div>
                        <div className="font-bold">{e.agent_name}</div>
                      </td>
                      <td className="py-2.5">
                        <div>{e.deal_ref || e.track} · {e.property_label || '—'}</div>
                        {e.is_third_party && (
                          <div className="text-[10.5px] text-amber-700 dark:text-amber-300 font-semibold">
                            Partner ORN: {e.third_party_agency} ({e.third_party_agent_name} · {e.third_party_phone})
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 text-center">
                        <StatusPill label={e.payment_mode} tone="slate" />
                      </td>
                      <td className="py-2.5 text-end font-mono-num font-extrabold">{fmtAed(e.net_amount_aed)}</td>
                      <td className="py-2.5 text-center">
                        <StatusPill label={e.status} tone={e.status === 'Paid' ? 'emerald' : e.status === 'Received' ? 'blue' : 'gold'} />
                      </td>
                      <td className="py-2.5 text-end space-x-1">
                        {e.status === 'Pending' && (
                          <button type="button" onClick={() => void setStatus(e.id, 'Received')} className="px-2 py-1 rounded bg-sky-600 text-white text-[10px] font-bold cursor-pointer">
                            Received
                          </button>
                        )}
                        {e.status !== 'Paid' && (
                          <button type="button" onClick={() => void setStatus(e.id, 'Paid')} className="px-2 py-1 rounded bg-[#0D8A6A] text-white text-[10px] font-bold cursor-pointer">
                            Mark Paid
                          </button>
                        )}
                        <button type="button" onClick={() => void deleteEntry(e.id)} className="p-1 text-red-500 cursor-pointer" title="Delete">
                          <Trash2 size={12} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
