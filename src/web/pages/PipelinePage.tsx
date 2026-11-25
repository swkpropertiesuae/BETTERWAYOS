import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  FileCheck2,
  KanbanSquare,
  Landmark,
  Plus,
  Search,
  Send,
  Table2,
  Trash2,
} from 'lucide-react';
import { apiFetch, fmtAed } from '../lib/api';
import { useAuth } from '../lib/auth-context';
import { CASE_MILESTONES, MORTGAGE_TYPES } from '@shared/workflow-constants';
import { UAE_BANKS } from '@shared/banks-data';
import { BankBadge, ModalDialog, PageHeader, StatusPill } from '../components/UiPrimitives';

export function PipelinePage() {
  const { user, toast } = useAuth();
  const [cases, setCases] = useState<any[]>([]);
  const [view, setView] = useState<'kanban' | 'table'>('kanban');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<any>(null);
  const [newOpen, setNewOpen] = useState(false);

  // Case 360° interactive form states
  const [nextStage, setNextStage] = useState('');
  const [stageReason, setStageReason] = useState('');
  const [subBankKey, setSubBankKey] = useState('emirates-nbd');
  const [deleteReason, setDeleteReason] = useState('');

  // New Case Form
  const [form, setForm] = useState({
    borrower_name: '',
    borrower_phone: '+971 50 ',
    borrower_profile: 'salaried',
    mortgage_type: 'Resale Purchase (Secondary)',
    community: 'Dubai Hills Estate',
    project_name: '',
    property_price_aed: 2800000,
    requested_loan_aed: 2240000,
    monthly_income_aed: 52000,
    primary_bank_key: 'emirates-nbd',
    is_swk_relay: false,
  });

  const loadCases = async () => {
    try {
      const d = await apiFetch<{ cases: any[] }>(`/api/cases?q=${encodeURIComponent(search)}`);
      setCases(d.cases || []);
    } catch (e: any) {
      toast(e.message, 'err');
    }
  };

  const loadDetail = async (id: string) => {
    setSelectedId(id);
    try {
      const d = await apiFetch<any>(`/api/cases/${id}`);
      setDetail(d);
      setNextStage(d.case.stage_code);
      setStageReason('');
      setDeleteReason('');
    } catch (e: any) {
      toast(e.message, 'err');
    }
  };

  useEffect(() => {
    void loadCases();
  }, [search]);

  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiFetch<{ id: string; case_code: string }>('/api/cases', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      toast(`Created mortgage case ${res.case_code} with auto-generated document vault!`);
      setNewOpen(false);
      await loadCases();
      await loadDetail(res.id);
    } catch (err: any) {
      toast(err.message, 'err');
    }
  };

  const handleStageUpdate = async () => {
    if (!detail) return;
    try {
      await apiFetch(`/api/cases/${detail.case.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ stage_code: nextStage, reason: stageReason }),
      });
      toast('Milestone updated & logged to immutable audit trail');
      await loadCases();
      await loadDetail(detail.case.id);
    } catch (err: any) {
      toast(err.message, 'err');
    }
  };

  const handleAddBankSub = async () => {
    if (!detail) return;
    try {
      const res = await apiFetch<any>(`/api/cases/${detail.case.id}/submissions`, {
        method: 'POST',
        body: JSON.stringify({ bank_key: subBankKey }),
      });
      toast(`Parallel bank submission logged: ${res.bank_name} (${res.lender_ref})`);
      await loadDetail(detail.case.id);
    } catch (err: any) {
      toast(err.message, 'err');
    }
  };

  const handleDocToggle = async (docId: string, current: string) => {
    const next = current === 'Missing' ? 'Uploaded' : current === 'Uploaded' ? 'Verified' : 'Missing';
    try {
      await apiFetch(`/api/documents/${docId}`, { method: 'PATCH', body: JSON.stringify({ status: next }) });
      toast(`Document marked ${next}`);
      if (selectedId) await loadDetail(selectedId);
    } catch (err: any) {
      toast(err.message, 'err');
    }
  };

  const handleDeleteRequest = async () => {
    if (!detail) return;
    try {
      const res = await apiFetch<any>(`/api/cases/${detail.case.id}`, {
        method: 'DELETE',
        body: JSON.stringify({ reason: deleteReason }),
      });
      if (res.mode === 'queued_for_owner_approval') {
        toast('Queued in Owner Pending Delete Bin (requires Shabib Siraj approval)', 'info');
      } else {
        toast('Case archived directly by Owner authority');
      }
      setSelectedId(null);
      setDetail(null);
      await loadCases();
    } catch (err: any) {
      toast(err.message, 'err');
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="12-Milestone Loan Origination System (LOS)"
        title="Mortgage Case"
        accent="Pipeline"
        subtitle="Parallel 24-bank submissions, profile-adaptive document vault checklists, valuation/NOC tracking, and mandatory audit-reason governance."
        actions={
          <>
            <div className="relative">
              <Search size={14} className="absolute start-3 top-1/2 -translate-y-1/2 text-[var(--bw-muted)]" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search borrower, project, code…"
                className="h-9 ps-8 pe-3 rounded-full border border-[var(--bw-line)] bg-[var(--bw-card)] text-xs focus:outline-none focus:border-[#179373]"
              />
            </div>
            <div className="inline-flex rounded-full border border-[var(--bw-line)] bg-[var(--bw-card)] p-0.5">
              <button
                type="button"
                onClick={() => setView('kanban')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 cursor-pointer ${
                  view === 'kanban' ? 'bg-[#070E1A] text-[#FCF1B7]' : 'text-[var(--bw-muted)]'
                }`}
              >
                <KanbanSquare size={13} /> Kanban
              </button>
              <button
                type="button"
                onClick={() => setView('table')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 cursor-pointer ${
                  view === 'table' ? 'bg-[#070E1A] text-[#FCF1B7]' : 'text-[var(--bw-muted)]'
                }`}
              >
                <Table2 size={13} /> Table
              </button>
            </div>
            <button
              type="button"
              onClick={() => setNewOpen(true)}
              className="px-4 py-2 rounded-full text-xs font-bold text-white bg-gradient-to-r from-[#179373] to-[#0A4A3E] flex items-center gap-1.5 cursor-pointer"
            >
              <Plus size={14} /> Originate Case
            </button>
          </>
        }
      />

      {view === 'kanban' ? (
        <div className="flex gap-3.5 overflow-x-auto pb-4">
          {CASE_MILESTONES.map((m) => {
            const colCases = cases.filter((c) => c.stage_code === m.code);
            return (
              <div
                key={m.code}
                className="w-[290px] shrink-0 rounded-3xl bg-[var(--bw-soft)]/70 border border-[var(--bw-line)] p-3 flex flex-col"
              >
                <div className="flex items-center justify-between px-1 pb-2.5 mb-2 border-b border-[var(--bw-line)]">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: m.color }} />
                    <span className="text-xs font-bold truncate">
                      {String(m.order).padStart(2, '0')} · {m.label}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono-num font-bold bg-[var(--bw-card)] border border-[var(--bw-line)]">
                    {colCases.length}
                  </span>
                </div>
                <div className="space-y-2.5 flex-1">
                  {colCases.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => void loadDetail(c.id)}
                      className="w-full text-start p-3.5 rounded-2xl bg-[var(--bw-card)] border border-[var(--bw-line)] hover:border-[#179373] shadow-sm transition-all cursor-pointer"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10.5px] font-mono-num font-bold text-[#179373]">{c.case_code}</span>
                        {c.is_swk_relay === 1 && <StatusPill label="SWK Relay" tone="gold" />}
                      </div>
                      <div className="text-sm font-bold mt-1 truncate">{c.borrower_name}</div>
                      <div className="text-[11px] text-[var(--bw-muted)] truncate">
                        {c.project_name} · {c.community}
                      </div>
                      <div className="mt-2.5 flex items-center justify-between">
                        <span className="font-mono-num text-xs font-bold">{fmtAed(c.requested_loan_aed, true)}</span>
                        <span className="text-[10.5px] font-mono-num text-[var(--bw-muted)]">
                          LTV {c.ltv_pct}% · DBR {c.dbr_pct}%
                        </span>
                      </div>
                      <div className="mt-2.5 pt-2 border-t border-[var(--bw-line)] flex items-center justify-between">
                        <BankBadge bankKey={c.primary_bank_key} />
                        <span className="text-[10px] font-semibold text-[var(--bw-muted)]">{c.mortgage_type.split(' ')[0]}</span>
                      </div>
                    </button>
                  ))}
                  {!colCases.length && (
                    <div className="p-4 text-center text-[11px] text-[var(--bw-muted)] border border-dashed border-[var(--bw-line)] rounded-2xl">
                      No cases in stage
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bw-card overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[960px]">
            <thead className="bg-[var(--bw-soft)] text-[10.5px] uppercase tracking-wider text-[var(--bw-muted)]">
              <tr>
                <th className="p-3.5">Case Code</th>
                <th className="p-3.5">Borrower &amp; Profile</th>
                <th className="p-3.5">Property &amp; Type</th>
                <th className="p-3.5">Loan / LTV / DBR</th>
                <th className="p-3.5">Primary Bank</th>
                <th className="p-3.5">Milestone</th>
                <th className="p-3.5">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--bw-line)]">
              {cases.map((c) => {
                const ms = CASE_MILESTONES.find((m) => m.code === c.stage_code);
                return (
                  <tr key={c.id} className="hover:bg-[var(--bw-soft)]/50">
                    <td className="p-3.5 font-mono-num font-bold text-[#179373]">{c.case_code}</td>
                    <td className="p-3.5">
                      <div className="font-bold">{c.borrower_name}</div>
                      <div className="text-[11px] text-[var(--bw-muted)]">{c.nationality} · {c.borrower_profile}</div>
                    </td>
                    <td className="p-3.5">
                      <div className="font-semibold">{c.project_name} ({c.unit_door || c.community})</div>
                      <div className="text-[11px] text-[var(--bw-muted)]">{c.mortgage_type}</div>
                    </td>
                    <td className="p-3.5 font-mono-num">
                      <div className="font-bold">{fmtAed(c.requested_loan_aed)}</div>
                      <div className="text-[11px] text-[var(--bw-muted)]">LTV {c.ltv_pct}% · DBR {c.dbr_pct}%</div>
                    </td>
                    <td className="p-3.5"><BankBadge bankKey={c.primary_bank_key} /></td>
                    <td className="p-3.5">
                      <StatusPill label={ms ? `${ms.order}. ${ms.label}` : c.stage_code} tone="emerald" />
                    </td>
                    <td className="p-3.5">
                      <button
                        type="button"
                        onClick={() => void loadDetail(c.id)}
                        className="px-3 py-1.5 rounded-full bg-[#070E1A] text-[#FCF1B7] font-bold cursor-pointer"
                      >
                        Open 360°
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Case 360° Deep Underwriting & Progression Modal */}
      <ModalDialog
        open={Boolean(detail)}
        onClose={() => {
          setSelectedId(null);
          setDetail(null);
        }}
        maxWidth="max-w-4xl"
        title={detail ? `${detail.case.case_code} — ${detail.case.borrower_name}` : ''}
        subtitle={
          detail
            ? `${detail.case.mortgage_type} · ${detail.case.project_name} (${detail.case.community}) · Portal Token: ${detail.case.portal_token}`
            : ''
        }
      >
        {detail && (
          <div className="space-y-6">
            {/* Financial Snapshot */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-2xl bg-[var(--bw-soft)]">
                <div className="text-[10px] uppercase text-[var(--bw-muted)]">Property Value</div>
                <div className="font-mono-num font-bold text-sm mt-0.5">{fmtAed(detail.case.property_price_aed)}</div>
              </div>
              <div className="p-3 rounded-2xl bg-[var(--bw-soft)]">
                <div className="text-[10px] uppercase text-[var(--bw-muted)]">Target Loan ({detail.case.ltv_pct}%)</div>
                <div className="font-mono-num font-bold text-sm text-[#179373] mt-0.5">{fmtAed(detail.case.requested_loan_aed)}</div>
              </div>
              <div className="p-3 rounded-2xl bg-[var(--bw-soft)]">
                <div className="text-[10px] uppercase text-[var(--bw-muted)]">CBUAE Stressed DBR</div>
                <div className={`font-mono-num font-bold text-sm mt-0.5 ${detail.case.dbr_pct > 50 ? 'text-red-500' : 'text-emerald-600'}`}>
                  {detail.case.dbr_pct}% / 50.0%
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-[var(--bw-soft)]">
                <div className="text-[10px] uppercase text-[var(--bw-muted)]">Est. Bank DSA ({detail.case.dsa_rate_pct}%)</div>
                <div className="font-mono-num font-bold text-sm text-[#BA8D36] mt-0.5">
                  {fmtAed((detail.case.requested_loan_aed * detail.case.dsa_rate_pct) / 100)}
                </div>
              </div>
            </div>

            {/* Stage Transition with Mandatory Audit Reason */}
            <div className="p-4 rounded-2xl border border-[var(--bw-line)] bg-[var(--bw-soft)]/50 space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-[#179373]">Advance Milestone (Mandatory Audit Reason)</div>
              <div className="grid sm:grid-cols-3 gap-2.5">
                <select
                  value={nextStage}
                  onChange={(e) => setNextStage(e.target.value)}
                  className="h-10 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-card)] text-xs font-semibold"
                >
                  {CASE_MILESTONES.map((m) => (
                    <option key={m.code} value={m.code}>
                      {String(m.order).padStart(2, '0')} · {m.label}
                    </option>
                  ))}
                </select>
                <input
                  value={stageReason}
                  onChange={(e) => setStageReason(e.target.value)}
                  placeholder="Mandatory reason (e.g. ENBD DIP letter received)…"
                  className="h-10 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-card)] text-xs"
                />
                <button
                  type="button"
                  onClick={() => void handleStageUpdate()}
                  className="h-10 px-4 rounded-xl bg-[#179373] text-white text-xs font-bold hover:brightness-110 cursor-pointer"
                >
                  Update Milestone
                </button>
              </div>
            </div>

            {/* Parallel Multi-Bank Submissions */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="text-sm font-bold flex items-center gap-2">
                  <Landmark size={16} className="text-[#179373]" /> Parallel Bank Submissions ({detail.submissions.length})
                </h4>
                <div className="flex items-center gap-2">
                  <select
                    value={subBankKey}
                    onChange={(e) => setSubBankKey(e.target.value)}
                    className="h-8 px-2.5 rounded-lg border border-[var(--bw-line)] bg-[var(--bw-card)] text-xs"
                  >
                    {UAE_BANKS.map((b) => (
                      <option key={b.key} value={b.key}>
                        {b.name} ({b.indicativeFixed3Y}%)
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => void handleAddBankSub()}
                    className="h-8 px-3 rounded-lg bg-[#070E1A] text-[#FCF1B7] text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Send size={12} /> Submit to Bank
                  </button>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-2.5">
                {detail.submissions.map((s: any) => (
                  <div key={s.id} className="p-3 rounded-2xl border border-[var(--bw-line)] bg-[var(--bw-card)] flex items-center justify-between gap-2">
                    <div className="space-y-1">
                      <BankBadge bankKey={s.bank_key} />
                      <div className="text-[11px] font-mono-num text-[var(--bw-muted)]">
                        Ref: {s.lender_ref} · {s.rate_pct}% ({s.product_type})
                      </div>
                    </div>
                    <StatusPill label={s.status} tone="emerald" />
                  </div>
                ))}
              </div>
            </div>

            {/* Per-Profile Document Vault Checklist */}
            <div className="space-y-2.5">
              <h4 className="text-sm font-bold flex items-center gap-2">
                <FileCheck2 size={16} className="text-[#BA8D36]" /> Vault Document Checklist ({detail.case.borrower_profile})
              </h4>
              <div className="grid sm:grid-cols-2 gap-2">
                {detail.documents.map((doc: any) => (
                  <button
                    key={doc.id}
                    type="button"
                    onClick={() => void handleDocToggle(doc.id, doc.status)}
                    className="flex items-center justify-between gap-2 p-2.5 rounded-xl border border-[var(--bw-line)] hover:border-[#179373] text-start cursor-pointer"
                  >
                    <span className="text-xs font-medium flex items-center gap-2 min-w-0">
                      <CheckCircle2
                        size={14}
                        className={doc.status === 'Verified' ? 'text-[#179373]' : doc.status === 'Uploaded' ? 'text-amber-500' : 'text-slate-300'}
                      />
                      <span className="truncate">{doc.doc_name}</span>
                    </span>
                    <StatusPill
                      label={doc.status}
                      tone={doc.status === 'Verified' ? 'emerald' : doc.status === 'Uploaded' ? 'gold' : 'red'}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* SWK-Parity Protected Deletion -> Owner Pending Delete Bin */}
            <div className="p-4 rounded-2xl border border-red-500/25 bg-red-500/5 space-y-2.5">
              <div className="text-xs font-bold text-red-600 dark:text-red-400 flex items-center gap-1.5">
                <Trash2 size={14} /> Protected Delete ({user?.can_approve_deletions ? 'Owner Direct Archive' : 'Routes to Owner Pending Delete Bin'})
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  placeholder="Mandatory written deletion reason (min 6 chars)…"
                  className="flex-1 h-9 px-3 rounded-xl border border-red-500/30 bg-[var(--bw-card)] text-xs"
                />
                <button
                  type="button"
                  onClick={() => void handleDeleteRequest()}
                  className="h-9 px-4 rounded-xl bg-red-600 text-white text-xs font-bold cursor-pointer"
                >
                  {user?.can_approve_deletions ? 'Archive Case' : 'Request Owner Approval'}
                </button>
              </div>
            </div>
          </div>
        )}
      </ModalDialog>

      {/* Originate New Mortgage Case Modal */}
      <ModalDialog open={newOpen} onClose={() => setNewOpen(false)} title="Originate New UAE Mortgage Case" subtitle="Automatically calculates CBUAE LTV/DBR and provisions the profile-specific Document Vault checklist.">
        <form onSubmit={handleCreateCase} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold mb-1">Borrower Full Name</label>
              <input required value={form.borrower_name} onChange={(e) => setForm({ ...form, borrower_name: e.target.value })} className="w-full h-10 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-card)] text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">UAE / International Mobile</label>
              <input required value={form.borrower_phone} onChange={(e) => setForm({ ...form, borrower_phone: e.target.value })} className="w-full h-10 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-card)] text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">Borrower Underwriting Profile</label>
              <select value={form.borrower_profile} onChange={(e) => setForm({ ...form, borrower_profile: e.target.value })} className="w-full h-10 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-card)] text-sm">
                <option value="salaried">Resident Salaried (≥ AED 10k)</option>
                <option value="self_employed_full">Self-Employed Full-Doc (2yr TL / 2M TO)</option>
                <option value="self_employed_low_doc">Self-Employed Low-Doc (AED 40k Personal)</option>
                <option value="non_resident">Non-Resident Overseas Buyer</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">Mortgage Type</label>
              <select value={form.mortgage_type} onChange={(e) => setForm({ ...form, mortgage_type: e.target.value })} className="w-full h-10 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-card)] text-sm">
                {MORTGAGE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">Project / Building</label>
              <input required value={form.project_name} onChange={(e) => setForm({ ...form, project_name: e.target.value })} placeholder="e.g. Dubai Creek Residences" className="w-full h-10 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-card)] text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">Primary Target Bank</label>
              <select value={form.primary_bank_key} onChange={(e) => setForm({ ...form, primary_bank_key: e.target.value })} className="w-full h-10 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-card)] text-sm">
                {UAE_BANKS.map((b) => <option key={b.key} value={b.key}>{b.name} ({b.indicativeFixed3Y}%)</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">Property Value (AED)</label>
              <input type="number" value={form.property_price_aed} onChange={(e) => setForm({ ...form, property_price_aed: Number(e.target.value) })} className="w-full h-10 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-card)] text-sm font-mono-num" />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">Requested Loan (AED)</label>
              <input type="number" value={form.requested_loan_aed} onChange={(e) => setForm({ ...form, requested_loan_aed: Number(e.target.value) })} className="w-full h-10 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-card)] text-sm font-mono-num" />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">Monthly Verifiable Income (AED)</label>
              <input type="number" value={form.monthly_income_aed} onChange={(e) => setForm({ ...form, monthly_income_aed: Number(e.target.value) })} className="w-full h-10 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-card)] text-sm font-mono-num" />
            </div>
            <label className="flex items-center gap-2.5 text-xs font-semibold pt-6 cursor-pointer">
              <input type="checkbox" checked={form.is_swk_relay} onChange={(e) => setForm({ ...form, is_swk_relay: e.target.checked })} className="size-4 accent-[#179373]" />
              Link to SWK Properties Dual-Relay Attribution
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setNewOpen(false)} className="px-4 py-2 rounded-full border border-[var(--bw-line)] text-xs font-bold cursor-pointer">Cancel</button>
            <button type="submit" className="px-5 py-2 rounded-full bg-gradient-to-r from-[#179373] to-[#0A4A3E] text-white text-xs font-bold cursor-pointer">Create Case &amp; Vault</button>
          </div>
        </form>
      </ModalDialog>
    </div>
  );
}
