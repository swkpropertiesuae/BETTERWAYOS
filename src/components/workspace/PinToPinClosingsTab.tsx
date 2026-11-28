'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, Circle, Clock, FileText, Image as ImageIcon, Plus, Printer, Trash2 } from 'lucide-react';
import { useOs } from '@/components/os/OsProvider';
import { fmtAed, MetricTile, StatusPill } from '@/components/os/UiKit';
import { CLOSING_TRACKS, type ClosingStageItem, type ClosingTrack } from '@/lib/workspace/domain';
import { downloadJpegDocument, downloadWordDocument, printBrandedDocument } from '@/lib/workspace/exporters';
import { AttachmentPicker } from '@/components/os/AttachmentPicker';
import { uploadFilesToScope } from '@/lib/workspace/attachments-types';

export function PinToPinClosingsTab() {
  const { user, toast } = useOs();
  const [data, setData] = useState<any>(null);
  const [trackFilter, setTrackFilter] = useState<string>('ALL');
  const [selectedId, setSelectedId] = useState<string>('');
  const [showNew, setShowNew] = useState(false);
  const [dossierFiles, setDossierFiles] = useState<File[]>([]);
  const [chequeFiles, setChequeFiles] = useState<File[]>([]);

  const [form, setForm] = useState({
    track: 'Ready Purchase Mortgage' as ClosingTrack,
    title: '',
    caseId: '',
    agentName: '',
    community: '',
    projectName: '',
    unitNo: '',
    clientName: '',
    clientPhone: '',
    clientEmail: '',
    clientPassportEid: '',
    counterpartyName: '',
    counterpartyPhone: '',
    isThirdParty: false,
    thirdPartyAgency: '',
    thirdPartyAgent: '',
    thirdPartyBrn: '',
    thirdPartyPhone: '',
    askingPriceAed: 0,
    agreedPriceAed: 0,
    yearlyRentAed: 0,
    depositAed: 0,
    dldOrAdmFeeAed: 0,
    agencyCommissionAed: 0,
    totalChequesCount: 3,
    paymentMode: 'Manager Cheque',
    escrowOrBankRef: '',
    deedOrOqoodOrFolRef: '',
    nocRef: '',
    handoverDate: '',
    disbursalSummary: '',
    notes: '',
  });

  const [chq, setChq] = useState({
    chequeNo: '',
    bankName: 'Emirates NBD',
    payeeName: '',
    payerName: '',
    purpose: 'Down Payment Manager Cheque',
    paymentMethod: 'Manager Cheque',
    amountAed: 0,
    chequeDate: '',
    status: 'Received',
    notes: '',
  });

  const load = useCallback(async () => {
    const qs = trackFilter !== 'ALL' ? `?track=${encodeURIComponent(trackFilter)}` : '';
    const r = await fetch(`/api/v1/workspace/closings${qs}`, { cache: 'no-store' });
    if (r.ok) {
      const d = await r.json();
      setData(d);
      if (!selectedId && d.dossiers?.[0]?.id) setSelectedId(d.dossiers[0].id);
    }
  }, [trackFilter, selectedId]);

  useEffect(() => {
    void load();
  }, [load]);

  const dossiers: any[] = data?.dossiers ?? [];
  const selected = dossiers.find((d) => d.id === selectedId) || dossiers[0] || null;

  const createDossier = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = await fetch('/api/v1/workspace/closings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const out = await r.json();
    if (!r.ok) {
      toast(out.error || 'Failed to create mortgage closing dossier', 'err');
      return;
    }
    if (dossierFiles.length > 0 && out.dossier?.id) {
      await uploadFilesToScope(dossierFiles, 'closing-dossier', String(out.dossier.id)).catch(() => null);
    }
    toast(`Created Pin-to-Pin ${form.track} Dossier ${out.dossier.dossier_no}!`);
    setShowNew(false);
    setDossierFiles([]);
    setSelectedId(out.dossier.id);
    await load();
  };

  const cycleStage = async (stageIdx: number) => {
    if (!selected) return;
    const stages: ClosingStageItem[] = Array.isArray(selected.stages_json) ? [...selected.stages_json] : [];
    const cur = stages[stageIdx];
    if (!cur) return;
    const nextStatus: ClosingStageItem['status'] =
      cur.status === 'Pending' ? 'In Progress' : cur.status === 'In Progress' ? 'Done' : 'Pending';
    stages[stageIdx] = {
      ...cur,
      status: nextStatus,
      completedAt: nextStatus === 'Done' ? new Date().toISOString().slice(0, 10) : '',
      ownerName: user?.name || '',
    };
    const r = await fetch('/api/v1/workspace/closings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update_dossier', dossierId: selected.id, stages }),
    });
    if (r.ok) {
      toast(`Stage ${cur.step} marked ${nextStatus}`);
      await load();
    }
  };

  const addCheque = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    const r = await fetch('/api/v1/workspace/closings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'add_cheque', dossierId: selected.id, ...chq }),
    });
    const out = await r.json().catch(() => ({}));
    if (r.ok) {
      if (chequeFiles.length > 0) {
        await uploadFilesToScope(chequeFiles, 'closing-cheque', String(out.cheque?.id || selected.id)).catch(() => null);
      }
      toast('Manager cheque / settlement row added to mortgage ledger!');
      setChq({ ...chq, chequeNo: '', amountAed: 0, notes: '' });
      setChequeFiles([]);
      await load();
    }
  };

  const updateChequeStatus = async (chequeId: string, status: string) => {
    const r = await fetch('/api/v1/workspace/closings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update_cheque', chequeId, status }),
    });
    if (r.ok) {
      toast(`Settlement cheque updated to ${status}`);
      await load();
    }
  };

  const deleteCheque = async (chequeId: string) => {
    const r = await fetch('/api/v1/workspace/closings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete_cheque', chequeId }),
    });
    if (r.ok) {
      toast('Cheque row removed');
      await load();
    }
  };

  const buildClosingExport = (dos: any) => {
    const stages: ClosingStageItem[] = Array.isArray(dos.stages_json) ? dos.stages_json : [];
    const cheques: any[] = dos.cheques ?? [];
    return {
      filename: `${dos.dossier_no}_${String(dos.track || 'Mortgage').replace(/[^A-Za-z0-9]+/g, '_')}_PinToPin_Disbursal`,
      badge: `PIN-TO-PIN UAE MORTGAGE CLOSING REPORT · ${String(dos.track || '').toUpperCase()}`,
      title: `${dos.dossier_no} · ${dos.title}`,
      subtitle: `${dos.community} / ${dos.project_name} ${dos.unit_no ? `#${dos.unit_no}` : ''} · Status: ${dos.status}`,
      sealedBy: user?.name,
      metaPairs: [
        { label: 'Mortgage Track & Status', value: `${dos.track} · ${dos.status} · Disbursal Date: ${dos.handover_date || 'TBD'}` },
        { label: 'Borrower Details', value: `${dos.client_name} · ${dos.client_phone} · ${dos.client_email} · ID: ${dos.client_passport_eid || '—'}` },
        { label: 'Lending Bank & RM', value: `${dos.counterparty_name || '—'} · ${dos.counterparty_phone || '—'}` },
        {
          label: 'Referring RERA Partner',
          value: dos.is_third_party
            ? `${dos.third_party_agency} · ${dos.third_party_agent} (ORN/BRN ${dos.third_party_brn}) · ${dos.third_party_phone}`
            : 'Direct Borrower',
        },
        { label: 'Valuation / Approved Loan / Equity', value: `Val ${fmtAed(dos.asking_price_aed)} · Loan ${fmtAed(dos.agreed_price_aed)} · Equity ${fmtAed(dos.yearly_rent_aed)}` },
        { label: 'Bank Fees / DLD / Bank DSA', value: `Bank Fees ${fmtAed(dos.deposit_aed)} · DLD ${fmtAed(dos.dld_or_adm_fee_aed)} · DSA ${fmtAed(dos.agency_commission_aed)} (+VAT ${fmtAed(dos.vat_aed)})` },
        { label: 'FOL / Deed / NOC Refs', value: `Title Deed/Oqood/FOL: ${dos.ejari_or_oqood_or_deed_ref || '—'} · Dev e-NOC: ${dos.noc_ref || '—'} · Bank/Escrow: ${dos.escrow_or_bank_ref || '—'}` },
      ],
      sections: [
        {
          heading: 'Pin-to-Pin Mortgage Stage Checklist (Intake → Disbursal & DSA)',
          rows: stages.map((st) => ({
            label: `Step ${st.step}: ${st.label}`,
            value: `${st.status}${st.completedAt ? ` (${st.completedAt})` : ''}${st.ownerName ? ` · ${st.ownerName}` : ''}`,
          })),
        },
        {
          heading: `Manager Cheques, DLD Fees & Disbursal Ledger (${cheques.length} Items · Total ${fmtAed(dos.chequeSummary?.totalAmountAed ?? 0)})`,
          rows: cheques.map((c, idx) => ({
            label: `#${idx + 1} · ${c.purpose} (${c.payment_method})`,
            value: `${fmtAed(c.amount_aed)} · Chq ${c.cheque_no || 'N/A'} · ${c.bank_name || ''} · Date ${c.cheque_date || '—'} · ${c.status}`,
          })),
        },
      ],
    };
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-extrabold">Pin-to-Pin Mortgage Closing Dossiers (Scratch → Disbursal · 5 UAE Mortgage Tracks)</h2>
          <p className="text-xs text-[var(--bw-muted)]">
            Complete stage-by-stage mortgage closing checklists, borrower/bank RM/RERA referrer records, FOL/Oqood/Title Deed/e-NOC references, and Manager&apos;s Cheque &amp; DLD fee ledgers across Ready Purchase, Off-Plan Handover Finance, Buyout &amp; Refinance, Equity Release, and Non-Resident &amp; Commercial mortgages.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowNew((v) => !v)}
          className="px-4 py-2 rounded-full bg-[#0e5243] text-white text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer"
        >
          <Plus size={14} /> {showNew ? 'Hide New Dossier' : 'New Mortgage Closing Dossier'}
        </button>
      </div>

      {/* 5 Authentic UAE Mortgage Track Pills */}
      <div className="flex flex-wrap gap-1.5 text-xs">
        {['ALL', ...CLOSING_TRACKS].map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTrackFilter(t)}
            className={`px-3.5 py-1.5 rounded-full font-bold cursor-pointer ${
              trackFilter === t ? 'bg-[#0e5243] text-[#ebd5a6]' : 'border border-[var(--bw-line)] bg-[var(--bw-card)]'
            }`}
          >
            {t === 'ALL' ? `All 5 Mortgage Tracks (${dossiers.length})` : t}
          </button>
        ))}
      </div>

      {/* New Mortgage Closing Dossier Form */}
      {showNew && (
        <form onSubmit={createDossier} className="bw-card p-5 space-y-3 text-xs border-[#0e5243]/40">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-extrabold">Create Pin-to-Pin Mortgage Closing Dossier</h3>
            {(data?.activeCases ?? []).length > 0 && (
              <select
                value={form.caseId}
                onChange={(e) => {
                  const found = (data.activeCases ?? []).find((c: any) => c.id === e.target.value);
                  if (found) {
                    setForm((f) => ({
                      ...f,
                      caseId: found.id,
                      clientName: found.borrower_name || '',
                      clientPhone: found.borrower_phone || '',
                      clientEmail: found.borrower_email || '',
                      community: found.community || '',
                      projectName: found.project_name || '',
                      unitNo: found.unit_door || '',
                      askingPriceAed: Number(found.property_price_aed || 0),
                      agreedPriceAed: Number(found.requested_loan_aed || 0),
                      title: `${f.track} · ${found.borrower_name}`,
                    }));
                  }
                }}
                className="h-8 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-bg)]"
              >
                <option value="">Bootstrap from Active Mortgage Case (Optional)...</option>
                {(data?.activeCases ?? []).map((c: any) => (
                  <option key={c.id} value={c.id}>{c.case_code} · {c.borrower_name} ({c.community})</option>
                ))}
              </select>
            )}
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            <div>
              <label className="font-bold block mb-1">Mortgage Closing Track *</label>
              <select value={form.track} onChange={(e) => setForm({ ...form, track: e.target.value as ClosingTrack })} className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-bg)] font-bold">
                {CLOSING_TRACKS.map((tr) => <option key={tr}>{tr}</option>)}
              </select>
            </div>
            <div>
              <label className="font-bold block mb-1">Borrower Full Name *</label>
              <input required value={form.clientName} onChange={(e) => setForm({ ...form, clientName: e.target.value })} placeholder="Primary Mortgage Applicant" className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-bg)]" />
            </div>
            <div>
              <label className="font-bold block mb-1">Borrower Phone &amp; EID/Passport</label>
              <div className="grid grid-cols-2 gap-1.5">
                <input value={form.clientPhone} onChange={(e) => setForm({ ...form, clientPhone: e.target.value })} placeholder="Phone" className="h-9 px-2 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-bg)]" />
                <input value={form.clientPassportEid} onChange={(e) => setForm({ ...form, clientPassportEid: e.target.value })} placeholder="EID / Passport" className="h-9 px-2 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-bg)]" />
              </div>
            </div>
            <div>
              <label className="font-bold block mb-1">Community / Project / Unit</label>
              <div className="grid grid-cols-3 gap-1">
                <input value={form.community} onChange={(e) => setForm({ ...form, community: e.target.value })} placeholder="Area" className="h-9 px-2 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-bg)]" />
                <input value={form.projectName} onChange={(e) => setForm({ ...form, projectName: e.target.value })} placeholder="Project" className="h-9 px-2 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-bg)]" />
                <input value={form.unitNo} onChange={(e) => setForm({ ...form, unitNo: e.target.value })} placeholder="Unit" className="h-9 px-2 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-bg)]" />
              </div>
            </div>
            <div>
              <label className="font-bold block mb-1">Property Valuation (AED)</label>
              <input type="number" value={form.askingPriceAed} onChange={(e) => setForm({ ...form, askingPriceAed: Number(e.target.value) })} className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-bg)] font-mono-num" />
            </div>
            <div>
              <label className="font-bold block mb-1">Approved Loan Amount (AED)</label>
              <input type="number" value={form.agreedPriceAed} onChange={(e) => setForm({ ...form, agreedPriceAed: Number(e.target.value) })} className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-bg)] font-mono-num" />
            </div>
            <div>
              <label className="font-bold block mb-1">Down Payment &amp; Expected DSA (AED)</label>
              <div className="grid grid-cols-2 gap-1.5">
                <input type="number" value={form.yearlyRentAed} onChange={(e) => setForm({ ...form, yearlyRentAed: Number(e.target.value) })} placeholder="Down Payment" className="h-9 px-2 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-bg)] font-mono-num" />
                <input type="number" value={form.agencyCommissionAed} onChange={(e) => setForm({ ...form, agencyCommissionAed: Number(e.target.value) })} placeholder="Bank DSA AED" className="h-9 px-2 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-bg)] font-mono-num" />
              </div>
            </div>
            <div>
              <label className="font-bold block mb-1">FOL / Oqood / Title Deed Ref</label>
              <input value={form.deedOrOqoodOrFolRef} onChange={(e) => setForm({ ...form, deedOrOqoodOrFolRef: e.target.value })} placeholder="FOL / Deed / Oqood #" className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-bg)]" />
            </div>
          </div>

          <AttachmentPicker files={dossierFiles} onChange={setDossierFiles} label="Attach Signed FOL / Oqood / Title Deed / NOC Pack" compact />

          <button type="submit" className="px-6 py-2 rounded-full bg-[#0e5243] text-[#ebd5a6] font-extrabold cursor-pointer">
            Create Pin-to-Pin Mortgage Dossier
          </button>
        </form>
      )}

      {/* Main Split: Dossier List + Full Pin-to-Pin Stage & Manager Cheque Ledger */}
      <div className="grid lg:grid-cols-12 gap-5">
        <div className="lg:col-span-4 space-y-2.5 max-h-[600px] overflow-y-auto pe-1">
          {dossiers.length === 0 ? (
            <div className="bw-card p-8 text-center text-xs text-[var(--bw-muted)]">
              No mortgage closing dossiers yet. Click <strong>New Mortgage Closing Dossier</strong> to launch a Ready Purchase, Off-Plan Handover Finance, Buyout &amp; Refinance, Equity Release, or Non-Resident &amp; Commercial file.
            </div>
          ) : (
            dossiers.map((d) => {
              const st: ClosingStageItem[] = Array.isArray(d.stages_json) ? d.stages_json : [];
              const done = st.filter((x) => x.status === 'Done').length;
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setSelectedId(d.id)}
                  className={`w-full text-start bw-card p-4 space-y-1.5 text-xs cursor-pointer transition ${
                    selected?.id === d.id ? 'border-[#0e5243] ring-1 ring-[#0e5243]' : ''
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono-num font-bold text-[#0e5243]">{d.dossier_no}</span>
                    <StatusPill label={d.track} tone="navy" />
                  </div>
                  <div className="font-extrabold">{d.client_name}</div>
                  <div className="text-[11px] text-[var(--bw-muted)]">{d.community} · {d.project_name} {d.unit_no ? `#${d.unit_no}` : ''}</div>
                  <div className="flex items-center justify-between pt-1 text-[11px] font-mono-num">
                    <span>{done}/{st.length} Steps Done</span>
                    <span className="text-[#0e5243] font-bold">{d.cheques?.length ?? 0} Cheques</span>
                  </div>
                </button>
              );
            })
          )}
        </div>

        <div className="lg:col-span-8 bw-card p-5 space-y-5 text-xs">
          {!selected ? (
            <div className="py-16 text-center text-[var(--bw-muted)]">Select a Mortgage Closing Dossier to view its stage-by-stage checklist and Manager&apos;s Cheque disbursal ledger.</div>
          ) : (
            <>
              <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-[var(--bw-line)]">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono-num font-bold text-[#0e5243]">{selected.dossier_no}</span>
                    <StatusPill label={selected.track} tone="navy" />
                    <StatusPill label={selected.status} tone="emerald" />
                  </div>
                  <h3 className="text-base font-extrabold mt-1">{selected.title}</h3>
                  <div className="text-[11px] text-[var(--bw-muted)]">
                    Borrower: <strong>{selected.client_name}</strong> ({selected.client_phone || '—'}) · Loan: <strong>{fmtAed(selected.agreed_price_aed)}</strong> · Valuation: <strong>{fmtAed(selected.asking_price_aed)}</strong>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <button type="button" onClick={() => downloadWordDocument(buildClosingExport(selected))} className="px-3 py-1.5 rounded-lg bg-[#0e5243] text-[#ebd5a6] font-bold inline-flex items-center gap-1 cursor-pointer">
                    <FileText size={12} /> .DOC
                  </button>
                  <button type="button" onClick={() => void downloadJpegDocument(buildClosingExport(selected))} className="px-3 py-1.5 rounded-lg bg-[#0e5243] text-white font-bold inline-flex items-center gap-1 cursor-pointer">
                    <ImageIcon size={12} /> .JPEG
                  </button>
                  <button type="button" onClick={() => printBrandedDocument(buildClosingExport(selected))} className="px-3 py-1.5 rounded-lg border border-[var(--bw-line)] font-bold inline-flex items-center gap-1 cursor-pointer">
                    <Printer size={12} /> PDF
                  </button>
                </div>
              </div>

              {/* Stage-by-Stage Pin-to-Pin Mortgage Checklist */}
              <div className="space-y-2">
                <div className="font-extrabold text-sm">Pin-to-Pin Mortgage Stage Checklist (Click any step to advance Pending → In Progress → Done)</div>
                <div className="grid sm:grid-cols-2 gap-2">
                  {(selected.stages_json ?? []).map((st: ClosingStageItem, idx: number) => (
                    <button
                      key={st.step}
                      type="button"
                      onClick={() => void cycleStage(idx)}
                      className={`p-3 rounded-xl border text-start flex items-start gap-2.5 transition cursor-pointer ${
                        st.status === 'Done'
                          ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-400/45'
                          : st.status === 'In Progress'
                            ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-400/45'
                            : 'bg-[var(--bw-bg)]/60 border-[var(--bw-line)]'
                      }`}
                    >
                      {st.status === 'Done' ? (
                        <CheckCircle2 size={16} className="text-[#0e5243] shrink-0 mt-0.5" />
                      ) : st.status === 'In Progress' ? (
                        <Clock size={16} className="text-amber-600 shrink-0 mt-0.5" />
                      ) : (
                        <Circle size={16} className="text-[var(--bw-muted)] shrink-0 mt-0.5" />
                      )}
                      <div className="min-w-0">
                        <div className="font-bold">Step {st.step}. {st.label}</div>
                        <div className="text-[10.5px] text-[var(--bw-muted)]">
                          {st.status}{st.completedAt ? ` · ${st.completedAt}` : ''}{st.ownerName ? ` · ${st.ownerName}` : ''}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Manager Cheques, DLD Fees & Disbursal Ledger */}
              <div className="space-y-3 pt-3 border-t border-[var(--bw-line)]">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <MetricTile label="Total Settlement" value={fmtAed(selected.chequeSummary?.totalAmountAed ?? 0, true)} hint={`${selected.chequeSummary?.totalCheques ?? 0} cheques/transfers`} tone="navy" />
                  <MetricTile label="Cleared / Disbursed" value={fmtAed(selected.chequeSummary?.clearedAed ?? 0, true)} tone="emerald" />
                  <MetricTile label="Held / Issued" value={fmtAed(selected.chequeSummary?.receivedAed ?? 0, true)} tone="gold" />
                  <MetricTile label="Pending" value={fmtAed(selected.chequeSummary?.pendingAed ?? 0, true)} />
                </div>

                <form onSubmit={addCheque} className="p-3.5 rounded-2xl bg-[var(--bw-bg)] border border-[var(--bw-line)] grid sm:grid-cols-6 gap-2">
                  <input value={chq.chequeNo} onChange={(e) => setChq({ ...chq, chequeNo: e.target.value })} placeholder="Manager Chq / Ref #" className="h-8 px-2 rounded-lg border border-[var(--bw-line)] bg-[var(--bw-card)]" />
                  <input value={chq.bankName} onChange={(e) => setChq({ ...chq, bankName: e.target.value })} placeholder="Lending Bank" className="h-8 px-2 rounded-lg border border-[var(--bw-line)] bg-[var(--bw-card)]" />
                  <select value={chq.purpose} onChange={(e) => setChq({ ...chq, purpose: e.target.value })} className="h-8 px-2 rounded-lg border border-[var(--bw-line)] bg-[var(--bw-card)]">
                    <option>Down Payment Manager Cheque</option>
                    <option>Bank Loan Disbursal Cheque</option>
                    <option>DLD 0.25% Mortgage Reg Fee</option>
                    <option>DLD 4% Transfer Fee</option>
                    <option>Bank Valuation Fee</option>
                    <option>Bank Processing Fee</option>
                    <option>Liability Buyout Settlement</option>
                    <option>Developer SOA Escrow Payment</option>
                    <option>Bank DSA Commission Receipt</option>
                    <option>RERA Partner Referral Split</option>
                  </select>
                  <select value={chq.paymentMethod} onChange={(e) => setChq({ ...chq, paymentMethod: e.target.value })} className="h-8 px-2 rounded-lg border border-[var(--bw-line)] bg-[var(--bw-card)]">
                    <option>Manager Cheque</option>
                    <option>Bank Transfer (BT)</option>
                    <option>Escrow</option>
                    <option>Cheque / PDC</option>
                    <option>Cash</option>
                    <option>Botim</option>
                  </select>
                  <input type="number" required value={chq.amountAed} onChange={(e) => setChq({ ...chq, amountAed: Number(e.target.value) })} placeholder="AED Amount" className="h-8 px-2 rounded-lg border border-[var(--bw-line)] bg-[var(--bw-card)] font-mono-num" />
                  <button type="submit" className="h-8 rounded-lg bg-[#0e5243] text-white font-bold cursor-pointer">+ Add Payment</button>
                  <div className="sm:col-span-6 pt-1">
                    <AttachmentPicker files={chequeFiles} onChange={setChequeFiles} label="Attach Manager Cheque Scan / Bank Transfer Slip" compact />
                  </div>
                </form>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-start min-w-[640px]">
                    <thead>
                      <tr className="border-b border-[var(--bw-line)] text-[10px] uppercase text-[var(--bw-muted)]">
                        <th className="py-2 text-start">Mortgage Payment &amp; Mode</th>
                        <th className="py-2 text-start">Cheque # / Bank</th>
                        <th className="py-2 text-end">Amount (AED)</th>
                        <th className="py-2 text-center">Status</th>
                        <th className="py-2 text-end">Quick Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--bw-line)]">
                      {(selected.cheques ?? []).map((c: any) => (
                        <tr key={c.id}>
                          <td className="py-2.5">
                            <div className="font-bold">{c.purpose}</div>
                            <div className="text-[10.5px] text-[var(--bw-muted)]">{c.payment_method}</div>
                          </td>
                          <td className="py-2.5 font-mono-num">{c.cheque_no || '—'} · {c.bank_name || '—'}</td>
                          <td className="py-2.5 text-end font-mono-num font-bold">{fmtAed(c.amount_aed)}</td>
                          <td className="py-2.5 text-center">
                            <StatusPill label={c.status} tone={c.status === 'Cleared' || c.status === 'Paid' ? 'emerald' : c.status === 'Bounced' ? 'red' : 'gold'} />
                          </td>
                          <td className="py-2.5 text-end space-x-1">
                            {c.status !== 'Cleared' && (
                              <button type="button" onClick={() => void updateChequeStatus(c.id, 'Cleared')} className="px-2 py-1 rounded bg-[#0e5243] text-white text-[10px] font-bold cursor-pointer">
                                Clear
                              </button>
                            )}
                            <button type="button" onClick={() => void deleteCheque(c.id)} className="p-1 text-red-500 cursor-pointer" title="Delete cheque">
                              <Trash2 size={12} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
