'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { ArrowRight, Building2, CheckCircle2, Plus, X } from 'lucide-react';
import { useOs } from '@/components/os/OsProvider';
import { fmtAed, PageHeader, StatusPill } from '@/components/os/UiKit';
import { MORTGAGE_TYPES, PIPELINE_STAGES } from '@/lib/domain/workflow';
import { UAE_BANKS } from '@/lib/domain/banks';
import type { StageCode } from '@/lib/domain/types';

export default function PipelinePage() {
  const { toast } = useOs();
  const [cases, setCases] = useState<any[]>([]);
  const [view, setView] = useState<'kanban' | 'table'>('kanban');
  const [newOpen, setNewOpen] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [evidence, setEvidence] = useState('');
  const [subBank, setSubBank] = useState('emirates-nbd');
  const [form, setForm] = useState({
    borrowerName: '',
    borrowerPhone: '+971 50 ',
    borrowerEmail: '',
    borrowerProfile: 'salaried',
    mortgageType: 'Resale Purchase (Secondary)',
    community: 'Dubai Hills Estate',
    projectName: '',
    developer: 'Emaar Properties',
    propertyPriceAed: 3_000_000,
    requestedLoanAed: 2_400_000,
    monthlyIncomeAed: 45_000,
    primaryBankKey: 'emirates-nbd',
  });

  const load = useCallback(async () => {
    const r = await fetch('/api/v1/pipeline/cases');
    if (r.ok) {
      const d = await r.json();
      setCases(d.cases ?? []);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const createCase = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = await fetch('/api/v1/pipeline/cases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const d = await r.json();
    if (!r.ok) {
      toast(d.error || 'Failed to create case', 'err');
      return;
    }
    toast(`Opened ${d.mortgageCase.case_code} + spawned ${d.documents.length} Document Vault items!`);
    setNewOpen(false);
    setForm({ ...form, borrowerName: '', projectName: '' });
    await load();
  };

  const advance = async (c: any, nextStage: StageCode) => {
    const note = evidence.trim() || `Advanced to ${nextStage} with verified documentation`;
    const r = await fetch(`/api/v1/pipeline/cases/${c.id}/advance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nextStage, evidenceNote: note }),
    });
    const d = await r.json();
    if (!r.ok) {
      toast(d.error || 'Advance failed', 'err');
      return;
    }
    toast(`${c.case_code} moved to ${nextStage}!`);
    setEvidence('');
    setSelected(null);
    await load();
  };

  const submitBank = async (c: any) => {
    const r = await fetch(`/api/v1/pipeline/cases/${c.id}/submissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bankKey: subBank, loanAmountAed: Number(c.requested_loan_aed || 0) }),
    });
    if (r.ok) {
      toast('Parallel bank submission logged!');
      await load();
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Step 1 → Step 12 Mortgage Execution Playbook"
        title="12-Step Mortgage"
        accent="Pipeline"
        subtitle="Enquiry → Eligibility → Pick Banks → Collect Papers → Submit → Pre-Approval → Valuation → Final Offer (FOL) → Developer NOC → Transfer & Disbursal → Commission → Client Care."
        actions={
          <>
            <div className="inline-flex rounded-full border border-[var(--bw-line)] p-0.5 bg-[var(--bw-card)] text-xs font-bold">
              <button
                type="button"
                onClick={() => setView('kanban')}
                className={`px-3 py-1.5 rounded-full cursor-pointer ${view === 'kanban' ? 'bg-[#0A1128] text-[#FCF1B7]' : ''}`}
              >
                12-Stage Kanban
              </button>
              <button
                type="button"
                onClick={() => setView('table')}
                className={`px-3 py-1.5 rounded-full cursor-pointer ${view === 'table' ? 'bg-[#0A1128] text-[#FCF1B7]' : ''}`}
              >
                Table View
              </button>
            </div>
            <button
              type="button"
              onClick={() => setNewOpen(true)}
              className="h-9 px-4 rounded-full bg-[#0D8A6A] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus size={14} /> Open Mortgage Case
            </button>
          </>
        }
      />

      {/* Exact Stage Counts Strip */}
      <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-12 gap-2">
        {PIPELINE_STAGES.map((st) => {
          const count = cases.filter((c) => c.stage_code === st.code).length;
          return (
            <div key={st.code} className="bw-card p-2.5 text-center">
              <div className="text-[9.5px] font-bold uppercase text-[var(--bw-muted)] truncate">{st.shortLabel}</div>
              <div className="text-lg font-extrabold font-mono-num text-[#0D8A6A] mt-0.5">{count}</div>
            </div>
          );
        })}
      </div>

      {view === 'kanban' ? (
        <div className="overflow-x-auto pb-3">
          <div className="flex gap-3 min-w-max">
            {PIPELINE_STAGES.map((st, idx) => {
              const items = cases.filter((c) => c.stage_code === st.code);
              const nextSt = PIPELINE_STAGES[idx + 1];
              return (
                <div key={st.code} className="w-72 shrink-0 bw-card p-3.5 flex flex-col gap-3">
                  <div className="flex items-center justify-between pb-2 border-b border-[var(--bw-line)]">
                    <div>
                      <div className="text-xs font-extrabold">{st.shortLabel}</div>
                      <div className="text-[10px] text-[var(--bw-muted)]">{st.ownerDesk}</div>
                    </div>
                    <StatusPill label={String(items.length)} tone={items.length > 0 ? 'emerald' : 'slate'} />
                  </div>
                  <div className="space-y-2.5">
                    {items.length === 0 ? (
                      <div className="py-8 text-center text-[11px] text-[var(--bw-muted)]">0 deals</div>
                    ) : (
                      items.map((c) => {
                        const docs = c.case_documents ?? [];
                        const uploaded = docs.filter((d: any) => d.status === 'Uploaded' || d.status === 'Verified').length;
                        return (
                          <div
                            key={c.id}
                            onClick={() => setSelected(c)}
                            className="p-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-bg)]/70 hover:border-[#0D8A6A] cursor-pointer space-y-1.5 text-xs transition"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-mono-num font-bold text-[#0D8A6A]">{c.case_code}</span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--bw-card)] border border-[var(--bw-line)]">
                                {c.ltv_pct}% LTV
                              </span>
                            </div>
                            <div className="font-extrabold text-sm">{c.borrower_name}</div>
                            <div className="text-[11px] text-[var(--bw-muted)] truncate">
                              {c.community} · {c.project_name || c.mortgage_type}
                            </div>
                            <div className="flex items-center justify-between pt-1.5 border-t border-[var(--bw-line)] text-[11px]">
                              <span className="font-mono-num font-bold">{fmtAed(c.requested_loan_aed, true)}</span>
                              <span className="text-[var(--bw-muted)]">Vault {uploaded}/{docs.length}</span>
                            </div>
                            {nextSt && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  void advance(c, nextSt.code);
                                }}
                                className="w-full mt-1 py-1.5 rounded-lg bg-[#0A1128] text-[#FCF1B7] text-[10.5px] font-bold inline-flex items-center justify-center gap-1 cursor-pointer"
                              >
                                Move to {nextSt.shortLabel} <ArrowRight size={11} />
                              </button>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bw-card p-5 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[var(--bw-line)] text-[10.5px] uppercase text-[var(--bw-muted)]">
                <th className="py-2 text-start">Case</th>
                <th className="py-2 text-start">Borrower</th>
                <th className="py-2 text-start">Stage</th>
                <th className="py-2 text-start">Property</th>
                <th className="py-2 text-end">Loan AED</th>
                <th className="py-2 text-end">DBR / LTV</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--bw-line)]">
              {cases.map((c) => (
                <tr key={c.id} onClick={() => setSelected(c)} className="hover:bg-[var(--bw-soft)]/60 cursor-pointer">
                  <td className="py-2.5 font-mono-num font-bold text-[#0D8A6A]">{c.case_code}</td>
                  <td className="py-2.5 font-bold">{c.borrower_name}</td>
                  <td className="py-2.5"><StatusPill label={c.stage_code} tone="emerald" /></td>
                  <td className="py-2.5">{c.community} · {c.project_name}</td>
                  <td className="py-2.5 text-end font-mono-num font-bold">{fmtAed(c.requested_loan_aed)}</td>
                  <td className="py-2.5 text-end font-mono-num">{c.dbr_pct}% / {c.ltv_pct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Case 360° Drawer */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-lg bg-[var(--bw-card)] h-full p-6 overflow-y-auto space-y-5 border-s border-[var(--bw-line)]">
            <div className="flex items-start justify-between border-b border-[var(--bw-line)] pb-3">
              <div>
                <div className="text-xs font-mono-num font-bold text-[#0D8A6A]">{selected.case_code}</div>
                <h3 className="text-lg font-extrabold">{selected.borrower_name}</h3>
                <div className="text-xs text-[var(--bw-muted)]">
                  {selected.borrower_phone} · {selected.community} ({selected.mortgage_type})
                </div>
              </div>
              <button type="button" onClick={() => setSelected(null)} className="p-1 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="p-3 rounded-xl bg-[var(--bw-bg)]">
                <div className="text-[10px] text-[var(--bw-muted)] uppercase font-bold">Loan</div>
                <div className="font-mono-num font-extrabold">{fmtAed(selected.requested_loan_aed, true)}</div>
              </div>
              <div className="p-3 rounded-xl bg-[var(--bw-bg)]">
                <div className="text-[10px] text-[var(--bw-muted)] uppercase font-bold">LTV</div>
                <div className="font-mono-num font-extrabold">{selected.ltv_pct}%</div>
              </div>
              <div className="p-3 rounded-xl bg-[var(--bw-bg)]">
                <div className="text-[10px] text-[var(--bw-muted)] uppercase font-bold">Stressed DBR</div>
                <div className="font-mono-num font-extrabold">{selected.dbr_pct}%</div>
              </div>
            </div>

            {/* Parallel 24-Bank Submission */}
            <div className="p-4 rounded-2xl border border-[var(--bw-line)] space-y-2.5 text-xs">
              <div className="font-extrabold flex items-center gap-1.5">
                <Building2 size={14} className="text-[#0D8A6A]" /> Parallel Bank Submissions ({(selected.bank_submissions ?? []).length})
              </div>
              <div className="flex gap-2">
                <select
                  value={subBank}
                  onChange={(e) => setSubBank(e.target.value)}
                  className="flex-1 h-9 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-bg)]"
                >
                  {UAE_BANKS.map((b) => (
                    <option key={b.key} value={b.key}>
                      {b.name} ({b.indicativeFixed3Y}% · {b.type})
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => void submitBank(selected)}
                  className="px-3.5 rounded-xl bg-[#0D8A6A] text-white font-bold cursor-pointer"
                >
                  Submit
                </button>
              </div>
              {(selected.bank_submissions ?? []).map((s: any) => (
                <div key={s.id} className="flex items-center justify-between p-2 rounded-lg bg-[var(--bw-bg)]">
                  <span className="font-bold">{s.bank_name} · {s.lender_ref}</span>
                  <StatusPill label={s.status} tone="emerald" />
                </div>
              ))}
            </div>

            {/* Stage Transition with Mandatory Evidence */}
            <div className="p-4 rounded-2xl border border-[var(--bw-line)] space-y-2.5 text-xs">
              <div className="font-extrabold">Advance Stage (Mandatory Evidence Log)</div>
              <input
                value={evidence}
                onChange={(e) => setEvidence(e.target.value)}
                placeholder="Enter verification evidence (e.g. Pre-Approval ref, Valuation report AED 3.1M)..."
                className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-bg)]"
              />
              <div className="grid grid-cols-2 gap-1.5">
                {PIPELINE_STAGES.map((st) => (
                  <button
                    key={st.code}
                    type="button"
                    onClick={() => void advance(selected, st.code)}
                    className={`p-2 rounded-xl text-start font-bold border cursor-pointer ${
                      selected.stage_code === st.code
                        ? 'bg-[#0A1128] text-[#FCF1B7] border-[#D4AF37]'
                        : 'border-[var(--bw-line)] hover:border-[#0D8A6A]'
                    }`}
                  >
                    {st.shortLabel}
                  </button>
                ))}
              </div>
            </div>

            {/* Linked Vault Checklist Summary */}
            <div className="p-4 rounded-2xl border border-[var(--bw-line)] space-y-2 text-xs">
              <div className="font-extrabold flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-[#0D8A6A]" /> Per-Client Document Vault ({(selected.case_documents ?? []).length} docs)
              </div>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {(selected.case_documents ?? []).map((d: any) => (
                  <div key={d.id} className="flex items-center justify-between py-1 border-b border-[var(--bw-line)]/60">
                    <span className="truncate pe-2">{d.doc_name}</span>
                    <StatusPill label={d.status} tone={d.status === 'Verified' ? 'emerald' : d.status === 'Uploaded' ? 'blue' : 'slate'} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Case Modal */}
      {newOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={createCase} className="w-full max-w-xl bw-card p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[var(--bw-line)] pb-3">
              <h3 className="text-base font-extrabold">Open 12-Step Mortgage Case (Auto-Spawns Client Vault)</h3>
              <button type="button" onClick={() => setNewOpen(false)} className="cursor-pointer"><X size={16} /></button>
            </div>
            <div className="grid sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="font-bold block mb-1">Borrower Name *</label>
                <input required value={form.borrowerName} onChange={(e) => setForm({ ...form, borrowerName: e.target.value })} className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-bg)]" />
              </div>
              <div>
                <label className="font-bold block mb-1">Phone *</label>
                <input required value={form.borrowerPhone} onChange={(e) => setForm({ ...form, borrowerPhone: e.target.value })} className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-bg)]" />
              </div>
              <div>
                <label className="font-bold block mb-1">Borrower Profile</label>
                <select value={form.borrowerProfile} onChange={(e) => setForm({ ...form, borrowerProfile: e.target.value })} className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-bg)]">
                  <option value="salaried">Resident Salaried</option>
                  <option value="self_employed_full">Self-Employed (Full-Doc)</option>
                  <option value="self_employed_low_doc">Self-Employed (Low-Doc)</option>
                  <option value="non_resident">Non-Resident Overseas</option>
                </select>
              </div>
              <div>
                <label className="font-bold block mb-1">Mortgage Type</label>
                <select value={form.mortgageType} onChange={(e) => setForm({ ...form, mortgageType: e.target.value })} className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-bg)]">
                  {MORTGAGE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="font-bold block mb-1">Community</label>
                <input value={form.community} onChange={(e) => setForm({ ...form, community: e.target.value })} className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-bg)]" />
              </div>
              <div>
                <label className="font-bold block mb-1">Project / Tower</label>
                <input value={form.projectName} onChange={(e) => setForm({ ...form, projectName: e.target.value })} className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-bg)]" />
              </div>
              <div>
                <label className="font-bold block mb-1">Property Price (AED)</label>
                <input type="number" value={form.propertyPriceAed} onChange={(e) => setForm({ ...form, propertyPriceAed: Number(e.target.value) })} className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-bg)] font-mono-num" />
              </div>
              <div>
                <label className="font-bold block mb-1">Requested Loan (AED)</label>
                <input type="number" value={form.requestedLoanAed} onChange={(e) => setForm({ ...form, requestedLoanAed: Number(e.target.value) })} className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-bg)] font-mono-num" />
              </div>
              <div>
                <label className="font-bold block mb-1">Monthly Income (AED)</label>
                <input type="number" value={form.monthlyIncomeAed} onChange={(e) => setForm({ ...form, monthlyIncomeAed: Number(e.target.value) })} className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-bg)] font-mono-num" />
              </div>
              <div>
                <label className="font-bold block mb-1">Primary Bank</label>
                <select value={form.primaryBankKey} onChange={(e) => setForm({ ...form, primaryBankKey: e.target.value })} className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-bg)]">
                  {UAE_BANKS.map((b) => <option key={b.key} value={b.key}>{b.name}</option>)}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t border-[var(--bw-line)]">
              <button type="button" onClick={() => setNewOpen(false)} className="px-4 py-2 rounded-full border border-[var(--bw-line)] text-xs font-bold cursor-pointer">Cancel</button>
              <button type="submit" className="px-5 py-2 rounded-full bg-[#0D8A6A] text-white text-xs font-bold cursor-pointer">Create Case &amp; Vault</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
