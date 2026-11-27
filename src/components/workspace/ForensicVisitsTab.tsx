'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Camera,
  CheckCircle2,
  ExternalLink,
  FileText,
  Flag,
  Image as ImageIcon,
  MapPin,
  Plus,
  Printer,
  ShieldCheck,
} from 'lucide-react';
import { useOs } from '@/components/os/OsProvider';
import { fmtAed, MetricTile, StatusPill } from '@/components/os/UiKit';
import {
  MORTGAGE_DEAL_CATEGORIES,
  MORTGAGE_FIELD_MEETING_TYPES,
  MORTGAGE_MET_ROLES,
  type MortgageFieldMeetingType,
} from '@/lib/workspace/domain';
import { downloadJpegDocument, downloadWordDocument, printBrandedDocument } from '@/lib/workspace/exporters';

interface PaymentRow {
  stage: string;
  paymentMode: string;
  chequeNo: string;
  bankName: string;
  amountAed: number;
  status: string;
}

interface EvidencePhoto {
  name: string;
  caption: string;
  dataUrl: string;
}

export function ForensicVisitsTab({ compactStaffMode = false }: { compactStaffMode?: boolean }) {
  const { user, toast } = useOs();
  const [reports, setReports] = useState<any[]>([]);
  const [isVerifier, setIsVerifier] = useState(false);
  const [filterType, setFilterType] = useState('ALL');
  const [filterOutcome, setFilterOutcome] = useState('ALL');
  const [showForm, setShowForm] = useState(compactStaffMode);
  const [selected, setSelected] = useState<any>(null);
  const [verifyNote, setVerifyNote] = useState('');

  const [form, setForm] = useState({
    reportType: 'Client Consultation' as MortgageFieldMeetingType,
    dealCategory: 'Ready Home Purchase',
    community: '',
    buildingOrProject: '',
    unitNo: '',
    gpsLat: 25.2397,
    gpsLng: 55.3119,
    gpsAccuracyM: 12,
    gpsAddressLabel: '',
    metPersonName: '',
    metPersonRole: 'Borrower / Applicant',
    metPersonPhone: '',
    metPersonEmail: '',
    ownerOrAgentName: '',
    ownerOrAgentPhone: '',
    ownerOrAgentEmail: '',
    isThirdParty: false,
    thirdPartyAgency: '',
    thirdPartyAgentName: '',
    thirdPartyBrn: '',
    thirdPartyPhone: '',
    thirdPartyEmail: '',
    askingPriceAed: 0,
    finalPriceAed: 0,
    yearlyRentAed: 0,
    chequesCount: 2,
    outcome: 'Follow-Up Pending' as 'Closed' | 'Not Closed' | 'Follow-Up Pending',
    notClosedReason: '',
    nextActionDate: '',
    forensicNotes: '',
  });
  const [photos, setPhotos] = useState<EvidencePhoto[]>([]);
  const [payments, setPayments] = useState<PaymentRow[]>([
    { stage: 'Bank Valuation / Processing Fee', paymentMode: 'Bank Transfer (BT)', chequeNo: '', bankName: 'Emirates NBD', amountAed: 0, status: 'Received' },
  ]);

  const load = useCallback(async () => {
    const qs = new URLSearchParams();
    if (filterType !== 'ALL') qs.set('reportType', filterType);
    if (filterOutcome !== 'ALL') qs.set('outcome', filterOutcome);
    const r = await fetch(`/api/v1/field-reports?${qs.toString()}`, { cache: 'no-store' });
    if (r.ok) {
      const d = await r.json();
      setReports(d.reports ?? []);
      setIsVerifier(Boolean(d.isVerifier));
    }
  }, [filterType, filterOutcome]);

  useEffect(() => {
    void load();
  }, [load]);

  const pinGps = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      toast('Browser geolocation unavailable — using Oud Metha Dubai default pin');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((f) => ({
          ...f,
          gpsLat: Number(pos.coords.latitude.toFixed(6)),
          gpsLng: Number(pos.coords.longitude.toFixed(6)),
          gpsAccuracyM: Math.round(pos.coords.accuracy),
        }));
        toast(`GPS pinned accurately (±${Math.round(pos.coords.accuracy)}m)!`);
      },
      () => toast('Could not acquire GPS — confirm location permission', 'err'),
      { enableHighAccuracy: true, timeout: 6000 },
    );
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).slice(0, 4);
    for (const file of files) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setPhotos((prev) => [...prev.slice(0, 5), { name: file.name, caption: file.name.replace(/\.[^.]+$/, ''), dataUrl: reader.result as string }]);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const submitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = await fetch('/api/v1/field-reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        photos,
        paymentStages: form.outcome === 'Closed' ? payments.filter((p) => p.amountAed > 0 || p.stage.trim()) : [],
      }),
    });
    const out = await r.json();
    if (!r.ok) {
      toast(out.error || 'Failed to save forensic mortgage meeting report', 'err');
      return;
    }
    toast(`Forensic ${form.reportType} (${out.report.report_no}) logged & sent for Authority Verification!`);
    setPhotos([]);
    setShowForm(false);
    setSelected(out.report);
    await load();
  };

  const verifyReport = async (reportId: string, status: 'Verified' | 'Flagged' | 'Rejected') => {
    const r = await fetch('/api/v1/field-reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'verify', reportId, verificationStatus: status, verificationNotes: verifyNote || `${status} by ${user?.name}` }),
    });
    const out = await r.json();
    if (!r.ok) {
      toast(out.error || 'Verification failed', 'err');
      return;
    }
    toast(`Forensic report marked ${status}!`);
    setVerifyNote('');
    setSelected(out.report);
    await load();
  };

  const outcomeDisplay = (o: string) =>
    o === 'Closed' ? 'Mandate Signed / Disbursed' : o === 'Not Closed' ? 'Not Proceeded / Declined' : 'Follow-Up Pending';

  const buildExportPayload = (rep: any) => {
    const pays: any[] = Array.isArray(rep.payment_summary_json) ? rep.payment_summary_json : [];
    const ltv = rep.asking_price_aed > 0 ? `${((Number(rep.final_price_aed || 0) / Number(rep.asking_price_aed)) * 100).toFixed(1)}%` : '—';
    return {
      filename: `${rep.report_no}_${String(rep.report_type || 'Mortgage_Field').replace(/[^A-Za-z0-9]+/g, '_')}`,
      badge: `MORTGAGE FIELD FORENSIC REPORT · ${String(rep.report_type || '').toUpperCase()} · ${String(rep.verification_status || '').toUpperCase()}`,
      title: `${rep.report_no} · ${rep.building_or_project || rep.community} ${rep.unit_no ? `(${rep.unit_no})` : ''}`,
      subtitle: `Logged by ${rep.submitted_by_name} on ${rep.visit_date} · GPS ${rep.gps_lat}, ${rep.gps_lng}`,
      sealedBy: rep.verification_status === 'Verified' ? rep.verified_by_name || user?.name : undefined,
      metaPairs: [
        { label: 'Meeting Type & Facility', value: `${rep.report_type} · ${rep.deal_category}` },
        { label: 'Bank / Trustee / Asset GPS', value: `${rep.community} / ${rep.building_or_project} ${rep.unit_no || ''} (${rep.gps_lat}, ${rep.gps_lng})` },
        { label: 'Authority Verification', value: `${rep.verification_status}${rep.verified_by_name ? ` by ${rep.verified_by_name}` : ''}` },
        { label: 'Person Met', value: `${rep.met_person_name} (${rep.met_person_role}) · ${rep.met_person_phone} · ${rep.met_person_email}` },
        { label: 'Bank RM / Institutional Desk', value: `${rep.owner_or_agent_name || '—'} · ${rep.owner_or_agent_phone || '—'} · ${rep.owner_or_agent_email || '—'}` },
        {
          label: 'Referring RERA Partner',
          value: rep.is_third_party
            ? `${rep.third_party_agency} · ${rep.third_party_agent_name} (ORN/BRN ${rep.third_party_brn}) · ${rep.third_party_phone} · ${rep.third_party_email}`
            : 'Direct Borrower Inquiry (No External Referrer)',
        },
        { label: 'Property Value vs Loan Amount', value: `Value ${fmtAed(rep.asking_price_aed)} → Loan ${fmtAed(rep.final_price_aed)} (LTV ${ltv})` },
        { label: 'Monthly Income & Settlement Cheques', value: `${fmtAed(rep.yearly_rent_aed)} / mo · ${rep.cheques_count} Manager/Settlement cheque(s)` },
        { label: 'Case Outcome', value: `${outcomeDisplay(rep.outcome)}${rep.not_closed_reason ? ` — Reason: ${rep.not_closed_reason}` : ''}` },
      ],
      sections: [
        ...(pays.length
          ? [
              {
                heading: 'Stage-Wise Mortgage Fee, Manager Cheque & Disbursal Breakdown',
                rows: pays.map((p, i) => ({
                  label: `Stage ${i + 1}: ${p.stage}`,
                  value: `${fmtAed(p.amountAed)} · ${p.paymentMode} ${p.chequeNo ? `(#${p.chequeNo})` : ''} · ${p.bankName || ''} · ${p.status}`,
                })),
              },
            ]
          : []),
        {
          heading: 'Forensic Underwriting Notes & Verification Audit',
          text: `${rep.forensic_notes || 'No extra notes.'}\n\nVerification Remarks: ${rep.verification_notes || 'Awaiting authority sign-off.'}`,
        },
      ],
    };
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-extrabold flex items-center gap-2">
            <MapPin size={16} className="text-[#0D8A6A]" /> Forensic Mortgage Field Meetings &amp; Inspections (GPS + Authority Verified)
          </h2>
          <p className="text-xs text-[var(--bw-muted)]">
            Every Borrower Consultation, Bank RM / FOL Signing, Valuation Inspection, Developer SOA/NOC, and DLD Trustee Transfer includes GPS pin, evidence photos, Bank RM &amp; RERA referrer details, valuation vs. loan LTV, outcome reason &amp; full payment stage breakdown.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="px-4 py-2 rounded-full bg-[#0D8A6A] text-white text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer"
        >
          <Plus size={14} /> {showForm ? 'Hide Report Form' : 'Log Mortgage Field Meeting'}
        </button>
      </div>

      {!compactStaffMode && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <MetricTile label="Total Field Meetings" value={reports.length} hint="Consultations, Bank RM, Trustee" tone="navy" />
          <MetricTile label="Pending Verification" value={reports.filter((r) => r.verification_status === 'Pending Verification').length} hint="Awaiting Authority sign-off" tone="gold" />
          <MetricTile label="Authority Verified" value={reports.filter((r) => r.verification_status === 'Verified').length} hint="GPS & details approved" tone="emerald" />
          <MetricTile label="Mandates / Disbursals" value={reports.filter((r) => r.outcome === 'Closed').length} hint="Full payment breakdown attached" tone="emerald" />
        </div>
      )}

      {/* Submission Form */}
      {showForm && (
        <form onSubmit={submitReport} className="bw-card p-5 space-y-4 text-xs border-[#0D8A6A]/40">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[var(--bw-line)]">
            <h3 className="text-sm font-extrabold">New Forensic UAE Mortgage Field Meeting Dossier</h3>
            <button
              type="button"
              onClick={pinGps}
              className="px-3.5 py-1.5 rounded-full bg-[#0A1128] text-[#FCF1B7] font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <MapPin size={13} /> Pin Live GPS ({form.gpsLat.toFixed(4)}, {form.gpsLng.toFixed(4)})
            </button>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="font-bold block mb-1">Mortgage Field Activity *</label>
              <select value={form.reportType} onChange={(e) => setForm({ ...form, reportType: e.target.value as MortgageFieldMeetingType })} className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-bg)]">
                {MORTGAGE_FIELD_MEETING_TYPES.map((mt) => (
                  <option key={mt} value={mt}>{mt}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="font-bold block mb-1">Mortgage Facility Type</label>
              <select value={form.dealCategory} onChange={(e) => setForm({ ...form, dealCategory: e.target.value })} className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-bg)]">
                {MORTGAGE_DEAL_CATEGORIES.map((dc) => (
                  <option key={dc} value={dc}>{dc}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="font-bold block mb-1">Community / Bank District *</label>
              <input required value={form.community} onChange={(e) => setForm({ ...form, community: e.target.value })} placeholder="DIFC / Al Barsha Trustee / Dubai Hills" className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-bg)]" />
            </div>
            <div>
              <label className="font-bold block mb-1">Bank Branch / Project &amp; Ref *</label>
              <div className="grid grid-cols-3 gap-1.5">
                <input required value={form.buildingOrProject} onChange={(e) => setForm({ ...form, buildingOrProject: e.target.value })} placeholder="Bank / Project" className="col-span-2 h-9 px-2.5 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-bg)]" />
                <input value={form.unitNo} onChange={(e) => setForm({ ...form, unitNo: e.target.value })} placeholder="Case/Unit" className="h-9 px-2 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-bg)]" />
              </div>
            </div>
          </div>

          {/* Whom Met & Bank RM / Institutional Contact */}
          <div className="grid md:grid-cols-2 gap-4 pt-2 border-t border-[var(--bw-line)]">
            <div className="space-y-2">
              <div className="font-extrabold text-[#0D8A6A]">1. Whom You Met (Borrower / Bank RM / Valuer / Trustee)</div>
              <div className="grid grid-cols-2 gap-2">
                <input required value={form.metPersonName} onChange={(e) => setForm({ ...form, metPersonName: e.target.value })} placeholder="Full Name *" className="h-9 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-bg)]" />
                <select value={form.metPersonRole} onChange={(e) => setForm({ ...form, metPersonRole: e.target.value })} className="h-9 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-bg)]">
                  {MORTGAGE_MET_ROLES.map((role) => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
                <input value={form.metPersonPhone} onChange={(e) => setForm({ ...form, metPersonPhone: e.target.value })} placeholder="Mobile Number" className="h-9 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-bg)]" />
                <input value={form.metPersonEmail} onChange={(e) => setForm({ ...form, metPersonEmail: e.target.value })} placeholder="Email Address" className="h-9 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-bg)]" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="font-extrabold text-[#0D8A6A]">2. Lending Bank RM / Valuation Desk Contact</div>
              <div className="grid grid-cols-3 gap-2">
                <input value={form.ownerOrAgentName} onChange={(e) => setForm({ ...form, ownerOrAgentName: e.target.value })} placeholder="Bank & RM Name" className="h-9 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-bg)]" />
                <input value={form.ownerOrAgentPhone} onChange={(e) => setForm({ ...form, ownerOrAgentPhone: e.target.value })} placeholder="RM Phone" className="h-9 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-bg)]" />
                <input value={form.ownerOrAgentEmail} onChange={(e) => setForm({ ...form, ownerOrAgentEmail: e.target.value })} placeholder="RM Email" className="h-9 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-bg)]" />
              </div>
              <label className="inline-flex items-center gap-2 font-bold cursor-pointer pt-1">
                <input type="checkbox" checked={form.isThirdParty} onChange={(e) => setForm({ ...form, isThirdParty: e.target.checked })} />
                Referred by External RERA Partner Brokerage / Introducer?
              </label>
            </div>
          </div>

          {form.isThirdParty && (
            <div className="p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-400/40 grid sm:grid-cols-2 lg:grid-cols-5 gap-2">
              <input value={form.thirdPartyAgency} onChange={(e) => setForm({ ...form, thirdPartyAgency: e.target.value })} placeholder="Partner Brokerage (ORN)" className="h-9 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-card)]" />
              <input value={form.thirdPartyAgentName} onChange={(e) => setForm({ ...form, thirdPartyAgentName: e.target.value })} placeholder="Referring Broker Name" className="h-9 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-card)]" />
              <input value={form.thirdPartyBrn} onChange={(e) => setForm({ ...form, thirdPartyBrn: e.target.value })} placeholder="RERA ORN / BRN #" className="h-9 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-card)]" />
              <input value={form.thirdPartyPhone} onChange={(e) => setForm({ ...form, thirdPartyPhone: e.target.value })} placeholder="Partner Phone" className="h-9 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-card)]" />
              <input value={form.thirdPartyEmail} onChange={(e) => setForm({ ...form, thirdPartyEmail: e.target.value })} placeholder="Partner Email" className="h-9 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-card)]" />
            </div>
          )}

          {/* Mortgage Valuation, Loan Amount, Monthly Income & Outcome */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2 border-t border-[var(--bw-line)]">
            <div>
              <label className="font-bold block mb-1">Property Valuation (AED)</label>
              <input type="number" value={form.askingPriceAed} onChange={(e) => setForm({ ...form, askingPriceAed: Number(e.target.value) })} className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-bg)] font-mono-num" />
            </div>
            <div>
              <label className="font-bold block mb-1">Approved / Target Loan (AED)</label>
              <input type="number" value={form.finalPriceAed} onChange={(e) => setForm({ ...form, finalPriceAed: Number(e.target.value) })} className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-bg)] font-mono-num" />
            </div>
            <div>
              <label className="font-bold block mb-1">Borrower Monthly Income (AED)</label>
              <input type="number" value={form.yearlyRentAed} onChange={(e) => setForm({ ...form, yearlyRentAed: Number(e.target.value) })} className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-bg)] font-mono-num" />
            </div>
            <div>
              <label className="font-bold block mb-1">Manager / Settlement Cheques</label>
              <input type="number" value={form.chequesCount} onChange={(e) => setForm({ ...form, chequesCount: Number(e.target.value) })} className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-bg)] font-mono-num" />
            </div>
            <div>
              <label className="font-bold block mb-1">Mortgage Outcome *</label>
              <select value={form.outcome} onChange={(e) => setForm({ ...form, outcome: e.target.value as any })} className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-bg)] font-bold">
                <option value="Closed">Mandate Signed / Disbursed</option>
                <option value="Not Closed">Not Proceeded / Declined</option>
                <option value="Follow-Up Pending">Follow-Up Pending</option>
              </select>
            </div>
          </div>

          {form.outcome !== 'Closed' ? (
            <div className="grid sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="font-bold block mb-1">Exact Decline / Hold Reason (AECB, DBR &gt; 50%, Valuation Gap, Rate)</label>
                <input value={form.notClosedReason} onChange={(e) => setForm({ ...form, notClosedReason: e.target.value })} placeholder="DBR above 50%, valuation came lower than MOU, awaiting salary cert or AECB clearance..." className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-bg)]" />
              </div>
              <div>
                <label className="font-bold block mb-1">Next Follow-Up Date</label>
                <input type="date" value={form.nextActionDate} onChange={(e) => setForm({ ...form, nextActionDate: e.target.value })} className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-bg)] font-mono-num" />
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-400/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-[#0D8A6A]">Signed / Disbursed — Stage-Wise Mortgage Fee &amp; Manager Cheque Breakdown</span>
                <button
                  type="button"
                  onClick={() => setPayments([...payments, { stage: 'DLD 0.25% Mortgage Reg / Disbursal Cheque', paymentMode: 'Manager Cheque', chequeNo: '', bankName: '', amountAed: 0, status: 'Pending' }])}
                  className="px-2.5 py-1 rounded-full bg-[#0D8A6A] text-white text-[11px] font-bold cursor-pointer"
                >
                  + Add Payment Stage
                </button>
              </div>
              {payments.map((p, idx) => (
                <div key={idx} className="grid sm:grid-cols-6 gap-2">
                  <input value={p.stage} onChange={(e) => setPayments(payments.map((x, i) => (i === idx ? { ...x, stage: e.target.value } : x)))} placeholder="Stage (Valuation / DLD / Disbursal)" className="h-8 px-2 rounded-lg border border-[var(--bw-line)] bg-[var(--bw-card)]" />
                  <select value={p.paymentMode} onChange={(e) => setPayments(payments.map((x, i) => (i === idx ? { ...x, paymentMode: e.target.value } : x)))} className="h-8 px-2 rounded-lg border border-[var(--bw-line)] bg-[var(--bw-card)]">
                    <option>Manager Cheque</option>
                    <option>Bank Transfer (BT)</option>
                    <option>Cheque / PDC</option>
                    <option>Cash</option>
                    <option>Botim</option>
                  </select>
                  <input value={p.chequeNo} onChange={(e) => setPayments(payments.map((x, i) => (i === idx ? { ...x, chequeNo: e.target.value } : x)))} placeholder="Cheque / Bank Ref #" className="h-8 px-2 rounded-lg border border-[var(--bw-line)] bg-[var(--bw-card)]" />
                  <input value={p.bankName} onChange={(e) => setPayments(payments.map((x, i) => (i === idx ? { ...x, bankName: e.target.value } : x)))} placeholder="Lending Bank" className="h-8 px-2 rounded-lg border border-[var(--bw-line)] bg-[var(--bw-card)]" />
                  <input type="number" value={p.amountAed} onChange={(e) => setPayments(payments.map((x, i) => (i === idx ? { ...x, amountAed: Number(e.target.value) } : x)))} placeholder="Amount AED" className="h-8 px-2 rounded-lg border border-[var(--bw-line)] bg-[var(--bw-card)] font-mono-num" />
                  <select value={p.status} onChange={(e) => setPayments(payments.map((x, i) => (i === idx ? { ...x, status: e.target.value } : x)))} className="h-8 px-2 rounded-lg border border-[var(--bw-line)] bg-[var(--bw-card)]">
                    <option>Received</option>
                    <option>Cleared</option>
                    <option>Paid</option>
                    <option>Pending</option>
                  </select>
                </div>
              ))}
            </div>
          )}

          {/* Evidence Photo Upload & Notes */}
          <div className="grid md:grid-cols-2 gap-3 pt-2 border-t border-[var(--bw-line)]">
            <div className="space-y-2">
              <label className="font-bold flex items-center gap-1.5">
                <Camera size={13} className="text-[#0D8A6A]" /> Upload Valuation / FOL / Trustee Evidence Photos (Up to 6)
              </label>
              <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="block w-full text-[11px]" />
              {photos.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {photos.map((ph, i) => (
                    <img key={i} src={ph.dataUrl} alt={ph.caption} className="size-16 rounded-xl object-cover border border-[var(--bw-line)]" />
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="font-bold block mb-1">Forensic Underwriting &amp; Meeting Minutes</label>
              <textarea rows={3} value={form.forensicNotes} onChange={(e) => setForm({ ...form, forensicNotes: e.target.value })} placeholder="Bank RM feedback, credit exception status, valuation remarks, FOL signing confirmation..." className="w-full p-2.5 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-bg)]" />
            </div>
          </div>

          <button type="submit" className="px-6 py-2.5 rounded-full bg-[#0A1128] text-[#FCF1B7] font-extrabold cursor-pointer">
            Submit GPS-Pinned Mortgage Field Report
          </button>
        </form>
      )}

      {/* Filter Bar */}
      <div className="flex flex-wrap gap-2 text-xs">
        {['ALL', ...MORTGAGE_FIELD_MEETING_TYPES].map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setFilterType(t)}
            className={`px-3 py-1.5 rounded-full font-bold cursor-pointer ${
              filterType === t ? 'bg-[#0A1128] text-[#FCF1B7]' : 'border border-[var(--bw-line)] bg-[var(--bw-card)]'
            }`}
          >
            {t === 'ALL' ? 'All Mortgage Meetings' : t}
          </button>
        ))}
        {['ALL', 'Closed', 'Not Closed', 'Follow-Up Pending'].map((o) => (
          <button
            key={o}
            type="button"
            onClick={() => setFilterOutcome(o)}
            className={`px-3 py-1.5 rounded-full font-bold cursor-pointer ${
              filterOutcome === o ? 'bg-[#0D8A6A] text-white' : 'border border-[var(--bw-line)] bg-[var(--bw-card)]'
            }`}
          >
            {o === 'ALL' ? 'All Outcomes' : outcomeDisplay(o)}
          </button>
        ))}
      </div>

      {/* Report Cards + Forensic Inspector */}
      <div className="grid lg:grid-cols-12 gap-5">
        <div className="lg:col-span-6 space-y-2.5 max-h-[540px] overflow-y-auto pe-1">
          {reports.length === 0 ? (
            <div className="bw-card p-10 text-center text-xs text-[var(--bw-muted)]">
              No forensic mortgage field meetings logged yet. Click <strong>Log Mortgage Field Meeting</strong> above to submit a GPS-pinned Borrower Consultation, Bank RM / FOL Signing, Valuation Inspection, Developer SOA/NOC, or DLD Trustee report.
            </div>
          ) : (
            reports.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setSelected(r)}
                className={`w-full text-start bw-card p-4 space-y-2 text-xs transition cursor-pointer ${
                  selected?.id === r.id ? 'border-[#0D8A6A] ring-1 ring-[#0D8A6A]' : ''
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="font-mono-num font-bold text-[#0D8A6A]">{r.report_no}</span> ·{' '}
                    <span className="font-extrabold">{r.building_or_project || r.community}</span>{' '}
                    {r.unit_no && <span className="text-[var(--bw-muted)]">({r.unit_no})</span>}
                  </div>
                  <div className="flex gap-1.5">
                    <StatusPill label={outcomeDisplay(r.outcome)} tone={r.outcome === 'Closed' ? 'emerald' : r.outcome === 'Not Closed' ? 'red' : 'gold'} />
                    <StatusPill label={r.verification_status} tone={r.verification_status === 'Verified' ? 'emerald' : r.verification_status === 'Flagged' ? 'red' : 'blue'} />
                  </div>
                </div>
                <div className="text-[var(--bw-muted)]">
                  {r.report_type} ({r.deal_category}) · By <strong>{r.submitted_by_name}</strong> on {r.visit_date} · Met: <strong>{r.met_person_name}</strong> ({r.met_person_role})
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono-num">
                  <span>Value {fmtAed(r.asking_price_aed, true)} → Loan {fmtAed(r.final_price_aed, true)}</span>
                  <span>{r.cheques_count} Chq · {(r.photos_json ?? []).length} Photos</span>
                </div>
              </button>
            ))
          )}
        </div>

        <div className="lg:col-span-6 bw-card p-5 space-y-4 text-xs">
          {!selected ? (
            <div className="py-16 text-center text-[var(--bw-muted)]">
              Select any Mortgage Field Meeting card on the left to inspect its GPS pin, evidence photos, Bank RM &amp; RERA partner details, Authority Verification stamp, and Word/JPEG export.
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-start justify-between gap-2 pb-3 border-b border-[var(--bw-line)]">
                <div>
                  <div className="font-mono-num text-[11px] font-bold text-[#0D8A6A]">{selected.report_no} · {selected.report_type}</div>
                  <h3 className="text-base font-extrabold">{selected.building_or_project || selected.community} {selected.unit_no ? `— ${selected.unit_no}` : ''}</h3>
                  <a
                    href={`https://maps.google.com/?q=${selected.gps_lat},${selected.gps_lng}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-mono-num font-bold text-[#0D8A6A] hover:underline mt-0.5"
                  >
                    <MapPin size={12} /> GPS {selected.gps_lat}, {selected.gps_lng} (Open Map Pin) <ExternalLink size={10} />
                  </a>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <button type="button" onClick={() => downloadWordDocument(buildExportPayload(selected))} className="px-2.5 py-1.5 rounded-lg bg-[#0A1128] text-[#FCF1B7] font-bold inline-flex items-center gap-1 cursor-pointer">
                    <FileText size={12} /> .DOC
                  </button>
                  <button type="button" onClick={() => void downloadJpegDocument(buildExportPayload(selected))} className="px-2.5 py-1.5 rounded-lg bg-[#0D8A6A] text-white font-bold inline-flex items-center gap-1 cursor-pointer">
                    <ImageIcon size={12} /> .JPEG
                  </button>
                  <button type="button" onClick={() => printBrandedDocument(buildExportPayload(selected))} className="px-2.5 py-1.5 rounded-lg border border-[var(--bw-line)] font-bold inline-flex items-center gap-1 cursor-pointer">
                    <Printer size={12} /> PDF
                  </button>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-2.5">
                <div className="p-3 rounded-xl bg-[var(--bw-bg)] border border-[var(--bw-line)]">
                  <div className="text-[10px] font-bold uppercase text-[var(--bw-muted)]">Met In Field</div>
                  <div className="font-bold mt-0.5">{selected.met_person_name} ({selected.met_person_role})</div>
                  <div className="text-[11px] text-[var(--bw-muted)]">{selected.met_person_phone || '—'} · {selected.met_person_email || '—'}</div>
                </div>
                <div className="p-3 rounded-xl bg-[var(--bw-bg)] border border-[var(--bw-line)]">
                  <div className="text-[10px] font-bold uppercase text-[var(--bw-muted)]">Bank RM / Desk Contact</div>
                  <div className="font-bold mt-0.5">{selected.owner_or_agent_name || 'Direct Bank Desk'}</div>
                  <div className="text-[11px] text-[var(--bw-muted)]">{selected.owner_or_agent_phone || '—'} · {selected.owner_or_agent_email || '—'}</div>
                </div>
              </div>

              {selected.is_third_party && (
                <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-400/40">
                  <div className="text-[10px] font-bold uppercase text-amber-700 dark:text-amber-300">Referring RERA Partner Brokerage</div>
                  <div className="font-bold mt-0.5">{selected.third_party_agency} — {selected.third_party_agent_name} (ORN/BRN {selected.third_party_brn || 'N/A'})</div>
                  <div className="text-[11px]">{selected.third_party_phone} · {selected.third_party_email}</div>
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono-num">
                <div className="p-2.5 rounded-xl bg-[var(--bw-bg)] border border-[var(--bw-line)]">
                  <div className="text-[9.5px] uppercase text-[var(--bw-muted)]">Valuation</div>
                  <div className="font-bold">{fmtAed(selected.asking_price_aed, true)}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-[var(--bw-bg)] border border-[var(--bw-line)]">
                  <div className="text-[9.5px] uppercase text-[var(--bw-muted)]">Loan Amount</div>
                  <div className="font-bold text-[#0D8A6A]">{fmtAed(selected.final_price_aed, true)}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-[var(--bw-bg)] border border-[var(--bw-line)]">
                  <div className="text-[9.5px] uppercase text-[var(--bw-muted)]">Monthly Income</div>
                  <div className="font-bold">{fmtAed(selected.yearly_rent_aed, true)}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-[var(--bw-bg)] border border-[var(--bw-line)]">
                  <div className="text-[9.5px] uppercase text-[var(--bw-muted)]">Mgr Cheques</div>
                  <div className="font-bold">{selected.cheques_count}</div>
                </div>
              </div>

              {selected.not_closed_reason && (
                <div className="p-3 rounded-xl bg-red-50/60 dark:bg-red-950/20 border border-red-400/40">
                  <div className="font-bold text-red-700 dark:text-red-300">Decline / Hold Reason</div>
                  <div className="mt-0.5">{selected.not_closed_reason}</div>
                </div>
              )}

              {(selected.payment_summary_json ?? []).length > 0 && (
                <div className="space-y-1.5">
                  <div className="font-extrabold text-[#0D8A6A]">Mortgage Fee &amp; Manager Cheque Breakdown</div>
                  {selected.payment_summary_json.map((p: any, idx: number) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-[var(--bw-bg)] border border-[var(--bw-line)] flex items-center justify-between gap-2">
                      <div>
                        <span className="font-bold">{p.stage}</span> · {p.paymentMode} {p.chequeNo ? `(#${p.chequeNo})` : ''} · {p.bankName}
                      </div>
                      <span className="font-mono-num font-bold text-[#0D8A6A]">{fmtAed(p.amountAed)} ({p.status})</span>
                    </div>
                  ))}
                </div>
              )}

              {(selected.photos_json ?? []).length > 0 && (
                <div className="space-y-1.5">
                  <div className="font-extrabold">Attached Evidence Photos ({selected.photos_json.length})</div>
                  <div className="grid grid-cols-3 gap-2">
                    {selected.photos_json.map((ph: any, idx: number) => (
                      <a key={idx} href={ph.dataUrl} download={ph.name} className="block rounded-xl overflow-hidden border border-[var(--bw-line)]">
                        <img src={ph.dataUrl} alt={ph.caption} className="w-full h-24 object-cover" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Authority Verification Box */}
              {isVerifier && (
                <div className="p-3.5 rounded-2xl bg-[#0A1128] text-white space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-[#FCF1B7] inline-flex items-center gap-1.5">
                      <ShieldCheck size={14} /> Authority Verification Decision
                    </span>
                    <StatusPill label={selected.verification_status} tone={selected.verification_status === 'Verified' ? 'emerald' : 'gold'} />
                  </div>
                  <input
                    value={verifyNote}
                    onChange={(e) => setVerifyNote(e.target.value)}
                    placeholder="Verification remarks (GPS confirmed, FOL/valuation proof checked, LTV validated)..."
                    className="w-full h-9 px-3 rounded-xl bg-white/10 border border-white/15 text-white placeholder:text-slate-400"
                  />
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => void verifyReport(selected.id, 'Verified')} className="px-4 py-1.5 rounded-full bg-[#0D8A6A] text-white font-extrabold inline-flex items-center gap-1 cursor-pointer">
                      <CheckCircle2 size={13} /> Verify &amp; Stamp
                    </button>
                    <button type="button" onClick={() => void verifyReport(selected.id, 'Flagged')} className="px-4 py-1.5 rounded-full bg-amber-500 text-[#0A1128] font-extrabold inline-flex items-center gap-1 cursor-pointer">
                      <Flag size={13} /> Flag for Review
                    </button>
                    <button type="button" onClick={() => void verifyReport(selected.id, 'Rejected')} className="px-4 py-1.5 rounded-full bg-red-600 text-white font-extrabold inline-flex items-center gap-1 cursor-pointer">
                      Reject
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
