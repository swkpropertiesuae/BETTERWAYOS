'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  CheckCircle2,
  Crown,
  Database,
  FileCheck2,
  FileText,
  Flame,
  Lock,
  MapPin,
  Printer,
  Receipt,
  ShieldCheck,
  Sparkles,
  Upload,
  Users,
  Wallet,
  XCircle,
} from 'lucide-react';
import { useOs } from '@/components/os/OsProvider';
import { fmtAed, MetricTile, StaffAvatar, StatusPill } from '@/components/os/UiKit';
import { TeamDailyWorkspaceTab } from '@/components/workspace/TeamDailyWorkspaceTab';
import { ForensicVisitsTab } from '@/components/workspace/ForensicVisitsTab';
import { CatalogBrochureStudioTab } from '@/components/workspace/CatalogBrochureStudioTab';
import { LegalFormsStudioTab } from '@/components/workspace/LegalFormsStudioTab';
import { PinToPinClosingsTab } from '@/components/workspace/PinToPinClosingsTab';
import { CommissionsExpensesTab } from '@/components/workspace/CommissionsExpensesTab';

type ExecTab =
  | 'team'
  | 'visits'
  | 'catalog'
  | 'legal'
  | 'closings'
  | 'commissions'
  | 'goldrush'
  | 'fasttrack'
  | 'bulkai'
  | 'approvals'
  | 'vat';

const VALID_TABS: readonly ExecTab[] = [
  'team',
  'visits',
  'catalog',
  'legal',
  'closings',
  'commissions',
  'goldrush',
  'fasttrack',
  'bulkai',
  'approvals',
  'vat',
];

export default function ExecutiveOwnerDeskPage() {
  const { user, toast } = useOs();
  const [tab, setTab] = useState<ExecTab>('team');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const qp = new URLSearchParams(window.location.search).get('tab') as ExecTab | null;
    if (qp && VALID_TABS.includes(qp)) setTab(qp);
  }, []);

  // Privacy Fast Track creation form
  const [ftForm, setFtForm] = useState({
    clientName: '',
    clientPhone: '+971 50 ',
    clientEmail: '',
    communityFreeform: '',
    developerFreeform: '',
    propertySummary: '',
    propertyPriceAed: 5_000_000,
    loanAmountAed: 3_500_000,
    expectedFeeAed: 45_000,
    urgency: 'IMMEDIATE_CASH' as 'IMMEDIATE_CASH' | 'VIP_PRIVATE' | 'CONFIDENTIAL',
    targetCashDate: '',
    notes: '',
    privateToMeOnly: false,
  });

  // Fast-track invoice modal
  const [invJob, setInvJob] = useState<any>(null);
  const [invSubtotal, setInvSubtotal] = useState(45_000);
  const [invDesc, setInvDesc] = useState('Executive Mortgage Structuring & Priority Bank Coordination');
  const [printInvoice, setPrintInvoice] = useState<any>(null);

  // Bulk AI Upload state
  const [bulkText, setBulkText] = useState(
    'Tariq Al Naimi, +971 50 441 8821, Dubai Hills Estate, Sidra Villa 44, 4800000\nLisa Hartmann, +971 58 912 3304, Palm Jumeirah, Shoreline Bldg 4, 3450000, lisa@example.com',
  );
  const [bulkTarget, setBulkTarget] = useState<'vault' | 'leads' | 'fast_track'>('vault');
  const [bulkResult, setBulkResult] = useState<any>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/v1/executive/overview');
      if (r.ok) setData(await r.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (!user?.isOwner) {
    return (
      <div className="bw-card p-10 text-center space-y-3 max-w-lg mx-auto mt-10">
        <Lock size={28} className="mx-auto text-red-600" />
        <h2 className="text-lg font-extrabold">Owner-Only Sanctuary</h2>
        <p className="text-xs text-[var(--bw-muted)]">
          This workspace is strictly restricted to Warda Kapadia (Owner, Founder &amp; MD) and Shabib Siraj (Executive Director).
        </p>
      </div>
    );
  }

  const createFastTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/v1/executive/fast-track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ftForm),
    });
    const out = await res.json();
    if (!res.ok) {
      toast(out.error || 'Failed to create Fast-Track job', 'err');
      return;
    }
    toast(`Created ${out.job.job_code} in ${user.privacyLaneTitle} (Master Log bypassed)!`);
    setFtForm({ ...ftForm, clientName: '', propertySummary: '', notes: '' });
    await load();
  };

  const issueFastTrackInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invJob) return;
    const res = await fetch(`/api/v1/executive/fast-track/${invJob.id}/invoice`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        billToName: invJob.client_name,
        description: invDesc,
        subtotalAed: invSubtotal,
      }),
    });
    const out = await res.json();
    if (!res.ok) {
      toast(out.error || 'Invoice failed', 'err');
      return;
    }
    toast(`Private 5% VAT Invoice ${out.invoice.invoice_no} issued (segregated Owner-only ledger)!`);
    setInvJob(null);
    setPrintInvoice(out.invoice);
    await load();
  };

  const runBulkUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/v1/executive/bulk-ai-upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rawText: bulkText, target: bulkTarget }),
    });
    const out = await res.json();
    if (!res.ok) {
      toast(out.error || 'Bulk upload failed', 'err');
      return;
    }
    setBulkResult(out);
    toast(`Bulk AI parsed & saved ${out.inserted} clients (${out.duplicatesSkipped} duplicates skipped)!`);
    await load();
  };

  const decideMasterReq = async (id: string, decision: 'APPROVED' | 'REJECTED') => {
    const res = await fetch(`/api/v1/masters/change-requests/${id}/decide`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision, note: `${decision} by ${user.name}` }),
    });
    const out = await res.json();
    if (!res.ok) {
      toast(out.error || 'Decision failed', 'err');
      return;
    }
    toast(`Master Log proposal ${decision}!`);
    await load();
  };

  const decideApproval = async (id: string, decision: 'APPROVED' | 'REJECTED') => {
    const res = await fetch(`/api/v1/approvals/${id}/decide`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision, note: `${decision} by ${user.name}` }),
    });
    const out = await res.json();
    if (!res.ok) {
      toast(out.error || 'Approval error', 'err');
      return;
    }
    toast(
      out.approval.status === 'OWNER_1_APPROVED'
        ? '1st Owner sign-off recorded — awaiting Co-Owner 2nd sign-off (2-of-2).'
        : `Approval ${out.approval.status}!`,
    );
    await load();
  };

  const ownerTitle = user.executiveAppTitle || "Warda's Place";
  const workspaceLabel = user.email.toLowerCase().includes('warda') ? "Warda's Workspace" : "Shabib's Workspace";
  const privacyTitle = user.privacyLaneTitle || "Warda's Client — Privacy Fast Track";
  const vat = data?.consolidatedVat;

  return (
    <div className="space-y-6">
      {/* 21st.dev Glossy Floating Shining Black Executive Sanctuary — Warda's Workspace & Shabib's Workspace */}
      <section className="bw-glossy-black p-6 sm:p-7 space-y-5 no-print">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <StaffAvatar name={user.name} avatarUrl={user.avatarUrl} initials={user.initials} size="lg" />
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-[#22e2ad]/35 text-[#fbe8a4] text-[10.5px] font-extrabold uppercase tracking-[0.14em]">
                <Crown size={12} className="text-[#d9b356]" /> {ownerTitle} · Equal Co-Owner Control (Warda &amp; Shabib)
              </div>
              <h1 className="font-display text-2xl sm:text-[32px] font-extrabold mt-1.5 tracking-[-0.03em] text-white">
                {workspaceLabel}{' '}
                <span className="bg-gradient-to-r from-[#34f0bc] to-[#fbe8a4] bg-clip-text text-transparent">
                  · Command Desk
                </span>
              </h1>
              <p className="text-xs sm:text-[13.5px] text-slate-300 mt-1 max-w-3xl">
                Simple owner hub for team daily tasks, GPS mortgage meetings, bank brochures, fillable Word/JPEG forms, 5-track closings, advisor payouts, full Excel backups &amp; <strong className="text-[#fbe8a4]">{privacyTitle}</strong>.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href="/api/v1/utilities/master-backup-excel"
              className="bw-btn bw-btn-gold text-xs py-2 min-h-[38px]"
            >
              <Database size={14} /> Full Excel Backup
            </a>
            <Link
              href="/os/mortgage-desk"
              className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-bold inline-flex items-center gap-1.5 transition"
            >
              <Sparkles size={14} className="text-[#34f0bc]" /> 18-Bank &amp; Proposals
            </Link>
          </div>
        </div>

        {/* High-Contrast Glossy Capsule Tabs (Zero white-on-white flicker) */}
        <div className="space-y-3 pt-4 border-t border-white/12">
          <div className="space-y-2">
            <div className="text-[10.5px] font-extrabold uppercase tracking-[0.15em] text-[#34f0bc]">
              1 · Daily UAE Mortgage Operations
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'team', label: 'Team & Daily To-Do', icon: Users },
                { id: 'visits', label: 'Mortgage Field Meetings', icon: MapPin },
                { id: 'catalog', label: 'APL Catalog & Brochures', icon: Building2 },
                { id: 'legal', label: 'Mortgage Forms (Word / JPEG)', icon: FileText },
                { id: 'closings', label: 'Pin-to-Pin Disbursals (5 Tracks)', icon: FileCheck2 },
                { id: 'commissions', label: 'Advisor DSA & Expenses', icon: Wallet },
              ].map((t) => {
                const Icon = t.icon;
                const active = tab === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTab(t.id as ExecTab)}
                    className={`px-4 py-2 rounded-full text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer ${
                      active
                        ? 'bg-[#22e2ad] text-[#070e1a] shadow-[0_8px_20px_-6px_rgba(34,226,173,0.7)] ring-2 ring-[#34f0bc]/60'
                        : 'bg-white/[0.08] text-white hover:bg-white/[0.16] border border-white/15'
                    }`}
                  >
                    <Icon size={13} /> {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-[10.5px] font-extrabold uppercase tracking-[0.15em] text-[#fbe8a4]">
              2 · Private Fast Track, Gold-Rush Kanban, Bulk AI, Approvals &amp; VAT 201
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'goldrush', label: '1–12 Gold-Rush Playbook & Kanban' },
                { id: 'fasttrack', label: `${privacyTitle} (${data?.fastTrackJobs?.length ?? 0})` },
                { id: 'bulkai', label: 'Bulk AI Uploading' },
                {
                  id: 'approvals',
                  label: `All Owner Approvals (${(data?.pendingApprovals?.length ?? 0) + (data?.pendingMasterRequests?.length ?? 0)})`,
                },
                { id: 'vat', label: 'Owner Consolidated P&L & VAT 201' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id as ExecTab)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold cursor-pointer ${
                    tab === t.id
                      ? 'bg-[#fbe8a4] text-[#070e1a] shadow-md ring-2 ring-[#d9b356]/70'
                      : 'bg-white/[0.06] text-slate-200 hover:bg-white/[0.14] border border-white/12'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* NEW WARDA & SHABIB WORKSPACE MODULES */}
      {tab === 'team' && <TeamDailyWorkspaceTab />}
      {tab === 'visits' && <ForensicVisitsTab />}
      {tab === 'catalog' && <CatalogBrochureStudioTab />}
      {tab === 'legal' && <LegalFormsStudioTab />}
      {tab === 'closings' && <PinToPinClosingsTab />}
      {tab === 'commissions' && <CommissionsExpensesTab />}

      {loading && !data && ['goldrush', 'fasttrack', 'bulkai', 'approvals', 'vat'].includes(tab) ? (
        <div className="bw-card p-10 text-center text-xs text-[var(--bw-muted)]">Loading Executive Ledger...</div>
      ) : null}

      {/* TAB 1: 1-12 Gold-Rush Playbook & Full Kanban */}
      {data && tab === 'goldrush' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            <MetricTile
              label="Immediate Cash Fast-Track Queue"
              value={fmtAed(data.urgentCashTotalAed, true)}
              hint={`${data.fastTrackJobs.length} private VIP / cash jobs`}
              tone="navy"
            />
            <MetricTile
              label="Active 12-Stage Pipeline Deals"
              value={data.stageCounts.reduce((s: number, c: any) => s + c.totalCount, 0)}
              hint="Standard + Privacy Fast Track combined"
              tone="emerald"
            />
            <MetricTile
              label="Pending Owner Sign-Offs"
              value={data.pendingApprovals.length + data.pendingMasterRequests.length}
              hint="Master Log proposals, Seals, 2-of-2 Payouts"
              tone="gold"
            />
            <MetricTile
              label="Consolidated Revenue (Owner)"
              value={fmtAed(vat?.consolidatedRevenueAed ?? 0, true)}
              hint={`Net FTA VAT: ${fmtAed(vat?.netFtaVatPayableAed ?? 0)}`}
            />
          </div>

          {/* 12-Stage Summary Ribbon */}
          <div className="bw-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-extrabold flex items-center gap-2">
                  <Flame size={16} className="text-amber-500" /> The Gold Rush — Exact 12-Stage Lead Counts &amp; Kanban
                </h2>
                <p className="text-xs text-[var(--bw-muted)]">
                  Track every stage from 01 Enquiry to 12 Client Care day-by-day alongside Privacy Fast Track cash deals.
                </p>
              </div>
              <Link href="/os/pipeline" className="text-xs font-bold text-[#007b52] hover:underline">
                Open Full Pipeline →
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
              {data.stageCounts.map((st: any) => (
                <div key={st.code} className="rounded-xl border border-[var(--bw-line)] p-3 bg-[var(--bw-bg)]/60">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase text-[var(--bw-muted)]">Step {st.order}</span>
                    <span className="px-2 py-0.5 rounded-full bg-[#025e3d] text-[#FCF1B7] text-[11px] font-mono-num font-extrabold">
                      {st.totalCount}
                    </span>
                  </div>
                  <div className="text-xs font-bold mt-1 truncate">{st.label}</div>
                  <div className="text-[10.5px] font-mono-num text-[#007b52] font-semibold mt-0.5">
                    {fmtAed(st.totalLoanAed, true)}
                  </div>
                  {st.fastTrackCount > 0 && (
                    <div className="text-[10px] font-bold text-amber-600 mt-0.5">★ {st.fastTrackCount} Fast-Track</div>
                  )}
                </div>
              ))}
            </div>

            {/* Full Horizontal 12-Column Kanban Board */}
            <div className="overflow-x-auto pb-2">
              <div className="flex gap-3 min-w-max">
                {data.stageCounts.map((st: any) => (
                  <div
                    key={st.code}
                    className="w-64 shrink-0 rounded-2xl border border-[var(--bw-line)] bg-[var(--bw-bg)]/70 p-3 flex flex-col gap-2.5"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-[var(--bw-line)]">
                      <span className="text-xs font-extrabold">{st.shortLabel}</span>
                      <StatusPill label={String(st.totalCount)} tone={st.totalCount > 0 ? 'emerald' : 'slate'} />
                    </div>
                    {st.fastTrackJobs.map((ft: any) => (
                      <div key={ft.id} className="p-2.5 rounded-xl bg-[#025e3d] text-white border border-[#D4AF37]/50 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-[#FCF1B7]">{ft.job_code} · VIP FAST TRACK</span>
                          <span className="text-[9.5px] px-1.5 py-0.5 rounded bg-amber-500 text-[#025e3d] font-extrabold">
                            {ft.urgency === 'IMMEDIATE_CASH' ? 'CASH NOW' : 'PRIVATE'}
                          </span>
                        </div>
                        <div className="font-bold">{ft.client_name}</div>
                        <div className="text-[11px] text-[#34DFAC] font-mono-num">
                          Fee: {fmtAed(ft.expected_fee_aed)} · Loan: {fmtAed(ft.loan_amount_aed, true)}
                        </div>
                      </div>
                    ))}
                    {st.cases.map((c: any) => (
                      <div key={c.id} className="p-2.5 rounded-xl bg-[var(--bw-card)] border border-[var(--bw-line)] text-xs space-y-1">
                        <div className="text-[10px] font-mono-num text-[var(--bw-muted)]">{c.case_code}</div>
                        <div className="font-bold">{c.borrower_name}</div>
                        <div className="text-[11px] text-[#007b52] font-mono-num">{fmtAed(c.requested_loan_aed, true)}</div>
                      </div>
                    ))}
                    {st.totalCount === 0 && (
                      <div className="py-6 text-center text-[11px] text-[var(--bw-muted)]">No deals in {st.label}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Warda's / Shabib's Client — Privacy Fast Track */}
      {data && tab === 'fasttrack' && (
        <div className="grid lg:grid-cols-12 gap-6">
          <form onSubmit={createFastTrack} className="lg:col-span-5 bw-card p-5 space-y-3.5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-extrabold flex items-center gap-1.5">
                  <Lock size={15} className="text-[#D4AF37]" /> New {privacyTitle}
                </h2>
                <p className="text-[11px] text-[var(--bw-muted)]">
                  Bypasses Master Log completely. Zero visibility for Admin, Managers, or Staff.
                </p>
              </div>
              <StatusPill label="Owner Only" tone="navy" />
            </div>

            <div className="grid sm:grid-cols-2 gap-3 text-xs">
              <div className="sm:col-span-2">
                <label className="font-bold block mb-1">Client Full Name *</label>
                <input
                  required
                  value={ftForm.clientName}
                  onChange={(e) => setFtForm({ ...ftForm, clientName: e.target.value })}
                  placeholder="VIP / Private Client Name"
                  className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-bg)]"
                />
              </div>
              <div>
                <label className="font-bold block mb-1">Direct Phone</label>
                <input
                  value={ftForm.clientPhone}
                  onChange={(e) => setFtForm({ ...ftForm, clientPhone: e.target.value })}
                  className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-bg)]"
                />
              </div>
              <div>
                <label className="font-bold block mb-1">Urgency Lane</label>
                <select
                  value={ftForm.urgency}
                  onChange={(e) => setFtForm({ ...ftForm, urgency: e.target.value as any })}
                  className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-bg)]"
                >
                  <option value="IMMEDIATE_CASH">Immediate Cash Priority</option>
                  <option value="VIP_PRIVATE">VIP Private Client</option>
                  <option value="CONFIDENTIAL">Confidential Mandate</option>
                </select>
              </div>
              <div>
                <label className="font-bold block mb-1">Community / Area (Freeform)</label>
                <input
                  value={ftForm.communityFreeform}
                  onChange={(e) => setFtForm({ ...ftForm, communityFreeform: e.target.value })}
                  placeholder="No Master Log required"
                  className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-bg)]"
                />
              </div>
              <div>
                <label className="font-bold block mb-1">Developer (Freeform)</label>
                <input
                  value={ftForm.developerFreeform}
                  onChange={(e) => setFtForm({ ...ftForm, developerFreeform: e.target.value })}
                  placeholder="Optional"
                  className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-bg)]"
                />
              </div>
              <div>
                <label className="font-bold block mb-1">Property Value (AED)</label>
                <input
                  type="number"
                  value={ftForm.propertyPriceAed}
                  onChange={(e) => setFtForm({ ...ftForm, propertyPriceAed: Number(e.target.value) })}
                  className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-bg)] font-mono-num"
                />
              </div>
              <div>
                <label className="font-bold block mb-1">Loan Amount (AED)</label>
                <input
                  type="number"
                  value={ftForm.loanAmountAed}
                  onChange={(e) => setFtForm({ ...ftForm, loanAmountAed: Number(e.target.value) })}
                  className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-bg)] font-mono-num"
                />
              </div>
              <div>
                <label className="font-bold block mb-1">Expected Immediate Fee / Cash (AED)</label>
                <input
                  type="number"
                  value={ftForm.expectedFeeAed}
                  onChange={(e) => setFtForm({ ...ftForm, expectedFeeAed: Number(e.target.value) })}
                  className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-bg)] font-mono-num"
                />
              </div>
              <div>
                <label className="font-bold block mb-1">Target Cash Date</label>
                <input
                  type="date"
                  value={ftForm.targetCashDate}
                  onChange={(e) => setFtForm({ ...ftForm, targetCashDate: e.target.value })}
                  className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-bg)]"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="font-bold block mb-1">Confidential Notes</label>
                <textarea
                  rows={2}
                  value={ftForm.notes}
                  onChange={(e) => setFtForm({ ...ftForm, notes: e.target.value })}
                  placeholder="Bank RM terms, cash deadline, private instructions..."
                  className="w-full p-2.5 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-bg)]"
                />
              </div>
              <label className="sm:col-span-2 flex items-center gap-2 text-xs font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={ftForm.privateToMeOnly}
                  onChange={(e) => setFtForm({ ...ftForm, privateToMeOnly: e.target.checked })}
                />
                Lock &quot;Private to me only&quot; (hide even from Co-Owner)
              </label>
            </div>

            <button
              type="submit"
              className="w-full h-10 rounded-full bg-[#025e3d] hover:bg-[#007b52] text-[#FCF1B7] text-xs font-extrabold cursor-pointer"
            >
              Launch Fast-Track Job (Bypass Master Log)
            </button>
          </form>

          <div className="lg:col-span-7 space-y-4">
            <div className="bw-card p-5 space-y-3">
              <h3 className="text-sm font-extrabold">Active Privacy Fast-Track Jobs ({data.fastTrackJobs.length})</h3>
              {data.fastTrackJobs.length === 0 ? (
                <div className="py-8 text-center text-xs text-[var(--bw-muted)]">
                  No Privacy Fast-Track jobs created yet. Use the form on the left for instant VIP/cash-lane deals.
                </div>
              ) : (
                data.fastTrackJobs.map((j: any) => (
                  <div key={j.id} className="p-4 rounded-2xl border border-[#D4AF37]/35 bg-[var(--bw-bg)]/70 space-y-2 text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <span className="font-mono-num font-bold text-[#007b52]">{j.job_code}</span> ·{' '}
                        <span className="font-extrabold text-sm">{j.client_name}</span>
                        {j.private_to_owner_id && <span className="ms-2 text-[10px] font-bold text-amber-600">🔒 Single-Owner Lock</span>}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <StatusPill label={j.urgency} tone="gold" />
                        <StatusPill label={j.cash_status} tone={j.cash_status === 'COLLECTED' ? 'emerald' : 'navy'} />
                      </div>
                    </div>
                    <div className="text-[var(--bw-muted)]">
                      {j.community_freeform || 'Confidential Asset'} · Loan: <strong className="font-mono-num text-[var(--bw-ink)]">{fmtAed(j.loan_amount_aed)}</strong> · Expected Cash:{' '}
                      <strong className="font-mono-num text-[#007b52]">{fmtAed(j.expected_fee_aed)}</strong>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-[var(--bw-line)]">
                      <button
                        type="button"
                        onClick={() => {
                          setInvJob(j);
                          setInvSubtotal(Number(j.expected_fee_aed || 25_000));
                        }}
                        className="px-3 py-1.5 rounded-full bg-[#025e3d] text-[#FCF1B7] font-bold inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Receipt size={12} /> Create Custom 5% VAT Invoice
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Segregated Owner Fast-Track Invoices */}
            {data.fastTrackInvoices.length > 0 && (
              <div className="bw-card p-5 space-y-3">
                <h3 className="text-sm font-extrabold">Owner-Only Fast-Track Invoices (Hidden from Accounts Staff)</h3>
                {data.fastTrackInvoices.map((inv: any) => (
                  <div key={inv.id} className="p-3 rounded-xl border border-[var(--bw-line)] flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div>
                      <div className="font-bold">{inv.invoice_no} · {inv.bill_to_name}</div>
                      <div className="text-[var(--bw-muted)]">{inv.description}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono-num font-extrabold text-[#007b52]">{fmtAed(inv.total_aed)}</span>
                      <button
                        type="button"
                        onClick={() => setPrintInvoice(inv)}
                        className="px-3 py-1 rounded-full border border-[var(--bw-line)] font-bold inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Printer size={12} /> Print
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: Bulk AI Uploading */}
      {data && tab === 'bulkai' && (
        <div className="grid lg:grid-cols-12 gap-6">
          <form onSubmit={runBulkUpload} className="lg:col-span-7 bw-card p-5 space-y-4">
            <div>
              <h2 className="text-base font-extrabold flex items-center gap-2">
                <Upload size={16} className="text-[#007b52]" /> Bulk AI Client &amp; Lead Importer
              </h2>
              <p className="text-xs text-[var(--bw-muted)]">
                Paste messy WhatsApp lists, CSV exports, or developer buyer sheets. Automatically extracts names, UAE phones, emails, communities, AED prices, and skips duplicates.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              {[
                { id: 'vault', label: 'Masked Client Vault (Safe Dispatch)' },
                { id: 'leads', label: 'Step 01 New Enquiries (Daily CRM)' },
                { id: 'fast_track', label: `${privacyTitle} (Owner Only)` },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setBulkTarget(t.id as any)}
                  className={`px-3.5 py-2 rounded-full font-bold border cursor-pointer ${
                    bulkTarget === t.id
                      ? 'bg-[#007b52] text-white border-[#007b52]'
                      : 'border-[var(--bw-line)] bg-[var(--bw-bg)]'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <textarea
              rows={8}
              required
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              className="w-full p-3.5 rounded-2xl border border-[var(--bw-line)] bg-[var(--bw-bg)] font-mono text-xs"
            />
            <button
              type="submit"
              className="px-6 py-2.5 rounded-full bg-[#007b52] text-white text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles size={14} /> Run AI Parse &amp; Save
            </button>
          </form>

          <div className="lg:col-span-5 bw-card p-5 space-y-3">
            <h3 className="text-sm font-extrabold">Last Bulk AI Run</h3>
            {!bulkResult ? (
              <div className="text-xs text-[var(--bw-muted)] py-8 text-center">
                Paste rows and click <strong>Run AI Parse &amp; Save</strong> to ingest leads with automatic deduplication.
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <MetricTile label="Saved Records" value={bulkResult.inserted} tone="emerald" />
                  <MetricTile label="Duplicates Skipped" value={bulkResult.duplicatesSkipped} tone="gold" />
                </div>
                <div className="space-y-1.5 max-h-60 overflow-y-auto">
                  {(bulkResult.preview ?? []).map((p: any, i: number) => (
                    <div key={i} className="p-2.5 rounded-xl bg-[var(--bw-bg)] border border-[var(--bw-line)]">
                      <div className="font-bold">{p.contactName} · {p.contactPhone}</div>
                      <div className="text-[var(--bw-muted)]">{p.community} · {fmtAed(p.propertyPriceAed)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: All Owner Approvals (1-of-2 & 2-of-2) */}
      {data && tab === 'approvals' && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Admin Master Log Proposals (1-of-2) */}
          <div className="bw-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold">Admin Master Log Change Requests (1-of-2 Owner Approval)</h3>
              <StatusPill label={`${data.pendingMasterRequests.length} Pending`} tone="gold" />
            </div>
            {data.pendingMasterRequests.length === 0 ? (
              <div className="py-8 text-center text-xs text-[var(--bw-muted)]">No pending Admin Master Log proposals.</div>
            ) : (
              data.pendingMasterRequests.map((req: any) => (
                <div key={req.id} className="p-4 rounded-2xl border border-[var(--bw-line)] bg-[var(--bw-bg)]/60 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold uppercase text-[#007b52]">
                      {req.action} · {req.registry_key}
                    </span>
                    <StatusPill label="1-of-2 Sign-Off" tone="blue" />
                  </div>
                  <div className="text-[var(--bw-muted)]">Reason: {req.reason}</div>
                  <pre className="p-2.5 rounded-xl bg-[var(--bw-card)] border border-[var(--bw-line)] text-[10.5px] overflow-x-auto">
                    {JSON.stringify(req.after_payload, null, 2)}
                  </pre>
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => void decideMasterReq(req.id, 'APPROVED')}
                      className="px-3.5 py-1.5 rounded-full bg-[#007b52] text-white font-bold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <CheckCircle2 size={12} /> Approve &amp; Commit
                    </button>
                    <button
                      type="button"
                      onClick={() => void decideMasterReq(req.id, 'REJECTED')}
                      className="px-3.5 py-1.5 rounded-full bg-red-600 text-white font-bold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <XCircle size={12} /> Reject
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Unified Approvals (1-of-2 Seals/Leave & 2-of-2 Payouts/Delete Bin) */}
          <div className="bw-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold">Corporate Seals, Payouts &amp; Delete Bin (1-of-2 &amp; 2-of-2)</h3>
              <StatusPill label={`${data.pendingApprovals.length} Open`} tone="navy" />
            </div>
            {data.pendingApprovals.length === 0 ? (
              <div className="py-8 text-center text-xs text-[var(--bw-muted)]">All Owner approval queues are clear.</div>
            ) : (
              data.pendingApprovals.map((ap: any) => (
                <div key={ap.id} className="p-4 rounded-2xl border border-[var(--bw-line)] bg-[var(--bw-bg)]/60 space-y-2 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-extrabold">{ap.title}</span>
                    <StatusPill
                      label={ap.approval_mode === '2_OF_2' ? '2-of-2 (Warda + Shabib)' : '1-of-2 Owner'}
                      tone={ap.approval_mode === '2_OF_2' ? 'red' : 'emerald'}
                    />
                  </div>
                  <div className="text-[var(--bw-muted)]">{ap.summary}</div>
                  {ap.status === 'OWNER_1_APPROVED' && (
                    <div className="text-[11px] font-bold text-amber-600">
                      ✓ 1st Owner signed off ({ap.approver_1_id}) — awaiting Co-Owner 2nd signature.
                    </div>
                  )}
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => void decideApproval(ap.id, 'APPROVED')}
                      className="px-3.5 py-1.5 rounded-full bg-[#025e3d] text-[#FCF1B7] font-bold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <ShieldCheck size={12} /> Sign &amp; Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => void decideApproval(ap.id, 'REJECTED')}
                      className="px-3.5 py-1.5 rounded-full bg-red-600 text-white font-bold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <XCircle size={12} /> Reject
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 5: Owner Consolidated P&L & UAE VAT 201 (Option A) */}
      {data && tab === 'vat' && vat && (
        <div className="bw-card p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-extrabold">Owner-Only Consolidated P&amp;L &amp; UAE FTA VAT 201</h2>
              <p className="text-xs text-[var(--bw-muted)]">
                Private view for Warda Kapadia &amp; Shabib Siraj merging Standard Company Ledger + Segregated Privacy Fast Track Invoices.
              </p>
            </div>
            <StatusPill label="Option A · Zero Staff Visibility" tone="navy" />
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <MetricTile label="Standard Ledger Revenue" value={fmtAed(vat.standardRevenueAed)} hint={`Output VAT: ${fmtAed(vat.standardOutputVatAed)}`} />
            <MetricTile label="Privacy Fast Track Revenue" value={fmtAed(vat.fastTrackRevenueAed)} hint={`Output VAT: ${fmtAed(vat.fastTrackOutputVatAed)}`} tone="navy" />
            <MetricTile label="Consolidated Output VAT (5%)" value={fmtAed(vat.consolidatedOutputVatAed)} hint={`Less Input VAT: ${fmtAed(vat.inputVatRecoverableAed)}`} tone="gold" />
            <MetricTile label="Net FTA VAT 201 Payable" value={fmtAed(vat.netFtaVatPayableAed)} hint={`Consolidated Net Profit: ${fmtAed(vat.consolidatedNetProfitAed)}`} tone="emerald" />
          </div>
        </div>
      )}

      {/* Invoice Issue Modal */}
      {invJob && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 no-print">
          <form onSubmit={issueFastTrackInvoice} className="w-full max-w-md bw-card p-6 space-y-4">
            <h3 className="text-base font-extrabold">Issue Private 5% VAT Invoice · {invJob.job_code}</h3>
            <p className="text-xs text-[var(--bw-muted)]">
              Saved strictly in Owner-only Fast-Track Ledger (excluded from non-Owner Accounts reports).
            </p>
            <div className="space-y-2 text-xs">
              <label className="font-bold block">Description</label>
              <input
                required
                value={invDesc}
                onChange={(e) => setInvDesc(e.target.value)}
                className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-bg)]"
              />
              <label className="font-bold block">Subtotal (AED, excl. 5% VAT)</label>
              <input
                type="number"
                required
                value={invSubtotal}
                onChange={(e) => setInvSubtotal(Number(e.target.value))}
                className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-bg)] font-mono-num"
              />
              <div className="p-3 rounded-xl bg-[var(--bw-soft)] font-mono-num">
                5% UAE VAT: <strong>{fmtAed(invSubtotal * 0.05)}</strong> · Total: <strong>{fmtAed(invSubtotal * 1.05)}</strong>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setInvJob(null)} className="px-4 py-2 rounded-full border border-[var(--bw-line)] text-xs font-bold cursor-pointer">
                Cancel
              </button>
              <button type="submit" className="px-5 py-2 rounded-full bg-[#025e3d] text-[#FCF1B7] text-xs font-extrabold cursor-pointer">
                Issue &amp; Preview Invoice
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Printable Private Tax Invoice Modal */}
      {printInvoice && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white text-[#161d1a] rounded-3xl p-8 space-y-5 shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-200 pb-4">
              <div>
                <img src="/brand/logo-horizontal-light.svg" alt="Betterway Mortgages" className="h-9 mb-2" />
                <div className="text-xs text-slate-600">Betterway Mortgages LLC · Al Nasr Plaza, Oud Metha, Dubai, UAE</div>
              </div>
              <div className="text-end">
                <div className="text-lg font-extrabold">TAX INVOICE</div>
                <div className="text-xs font-mono-num font-bold text-[#007b52]">{printInvoice.invoice_no}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <div className="text-slate-500 uppercase font-bold text-[10px]">Bill To</div>
                <div className="font-bold text-sm mt-0.5">{printInvoice.bill_to_name}</div>
              </div>
              <div className="text-end">
                <div className="text-slate-500 uppercase font-bold text-[10px]">Corporate Settlement IBAN</div>
                <div className="font-mono-num font-bold mt-0.5">{printInvoice.corporate_iban}</div>
              </div>
            </div>
            <div className="border border-slate-200 rounded-xl p-4 text-xs space-y-2">
              <div className="flex justify-between">
                <span>{printInvoice.description}</span>
                <span className="font-mono-num font-bold">{fmtAed(printInvoice.subtotal_aed)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>UAE FTA VAT ({printInvoice.vat_rate_pct}%)</span>
                <span className="font-mono-num">{fmtAed(printInvoice.vat_amount_aed)}</span>
              </div>
              <div className="flex justify-between text-base font-extrabold pt-2 border-t border-slate-200">
                <span>Total Due (AED)</span>
                <span className="font-mono-num text-[#007b52]">{fmtAed(printInvoice.total_aed)}</span>
              </div>
            </div>
            <div className="flex justify-end gap-2 no-print">
              <button type="button" onClick={() => setPrintInvoice(null)} className="px-4 py-2 rounded-full border border-slate-300 text-xs font-bold cursor-pointer">
                Close
              </button>
              <button type="button" onClick={() => window.print()} className="px-5 py-2 rounded-full bg-[#025e3d] text-[#FCF1B7] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer">
                <FileText size={13} /> Print / Save PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
