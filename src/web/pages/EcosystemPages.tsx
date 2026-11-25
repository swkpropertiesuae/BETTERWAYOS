import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  ExternalLink,
  Handshake,
  MapPin,
  PlayCircle,
  Search,
  Smartphone,
  Upload,
} from 'lucide-react';
import { UAE_COMMUNITIES } from '@shared/communities-data';
import { apiFetch, fmtAed } from '../lib/api';
import { useAuth } from '../lib/auth-context';
import { BankBadge, PageHeader, StaffAvatar, StatusPill } from '../components/UiPrimitives';

export function MarketPulsePage() {
  const [emirate, setEmirate] = useState<'all' | 'dubai' | 'abu-dhabi' | 'northern'>('all');
  const [q, setQ] = useState('');

  const filtered = UAE_COMMUNITIES.filter((c) => {
    if (emirate !== 'all' && c.emirate !== emirate) return false;
    if (q.trim()) {
      const s = q.toLowerCase();
      return c.name.toLowerCase().includes(s) || c.devs.toLowerCase().includes(s);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="60 UAE Freehold Mortgage Corridors · DLD & ADREC Benchmarks"
        title="UAE Market"
        accent="Pulse & Yields"
        subtitle="Dubai, Abu Dhabi, Ras Al Khaimah & Sharjah freehold communities with price/sq.ft., gross rental yield, master developers, and mortgage financing demand."
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {[
            ['all', 'All 60 Communities'],
            ['dubai', 'Dubai (45)'],
            ['abu-dhabi', 'Abu Dhabi (10)'],
            ['northern', 'RAK & Sharjah (5)'],
          ].map(([id, lbl]) => (
            <button
              key={id}
              type="button"
              onClick={() => setEmirate(id as any)}
              className={`px-3.5 py-2 rounded-full text-xs font-bold cursor-pointer ${
                emirate === id ? 'bg-[#070E1A] text-[#FCF1B7] dark:bg-[#179373] dark:text-white' : 'bg-[var(--bw-card)] border border-[var(--bw-line)]'
              }`}
            >
              {lbl}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute start-3.5 top-1/2 -translate-y-1/2 text-[var(--bw-muted)]" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search community or developer…"
            className="w-full h-9 ps-9 pe-3 rounded-full border border-[var(--bw-line)] bg-[var(--bw-card)] text-xs"
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((c) => (
          <div key={c.slug} className="bw-card overflow-hidden flex flex-col">
            <div className="relative h-32 bg-[#070E1A]">
              <img src={c.image} alt={c.name} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#070E1A]/90 via-transparent to-transparent" />
              <div className="absolute top-2.5 end-2.5">
                <StatusPill label={`${c.grossYieldPct}% Yield`} tone="emerald" />
              </div>
              <div className="absolute bottom-2.5 start-3 end-3 text-white">
                <div className="text-sm font-bold truncate">{c.name}</div>
                <div className="text-[10.5px] text-slate-300 truncate">{c.nameAr}</div>
              </div>
            </div>
            <div className="p-3.5 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[var(--bw-muted)] flex items-center gap-1"><MapPin size={12} /> {c.stock}</span>
                <span className="font-mono-num font-bold">AED {c.avgPsfAed.toLocaleString()}/sqft</span>
              </div>
              <div className="text-[11px] text-[var(--bw-muted)] truncate">Developers: {c.devs}</div>
              <div className="flex items-center justify-between pt-2 border-t border-[var(--bw-line)]">
                <span className="text-[10.5px] uppercase font-semibold text-[var(--bw-muted)]">Mortgage Demand</span>
                <StatusPill label={c.mortgageDemand} tone={c.mortgageDemand === 'Very High' ? 'gold' : 'blue'} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ClientPortalPage() {
  const { toast } = useAuth();
  const [refCode, setRefCode] = useState('BW-2026-M03');
  const [data, setData] = useState<any>(null);

  const lookup = async (ref = refCode) => {
    try {
      const d = await apiFetch(`/api/v1/public/status?ref=${encodeURIComponent(ref)}`);
      setData(d);
    } catch (e: any) {
      toast(e.message, 'err');
    }
  };

  useEffect(() => {
    void lookup();
  }, []);

  const uploadDoc = async (docId: string) => {
    await apiFetch('/api/v1/public/upload-doc', { method: 'POST', body: JSON.stringify({ docId, fileName: 'borrower_scan_2026.pdf' }) });
    toast('Document securely uploaded to Betterway Vault!');
    await lookup(refCode);
  };

  const currentOrder = data ? Number(String(data.case.stage_code).slice(0, 2)) : 1;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Phase 2 Feature #13 · Branded Borrower Workspace"
        title="Betterway"
        accent="Client Portal"
        subtitle="Live 12-milestone borrower tracking, direct encrypted vault uploads, shortlisted bank offers, and Betterway's official explainer walkthrough."
        actions={
          <div className="flex items-center gap-2">
            <input
              value={refCode}
              onChange={(e) => setRefCode(e.target.value)}
              placeholder="Case code (e.g. BW-2026-M03)"
              className="h-9 px-3 rounded-full border border-[var(--bw-line)] bg-[var(--bw-card)] text-xs font-mono-num"
            />
            <button type="button" onClick={() => void lookup(refCode)} className="h-9 px-4 rounded-full bg-[#070E1A] text-[#FCF1B7] text-xs font-bold cursor-pointer">
              Track Case
            </button>
          </div>
        }
      />

      {data && (
        <div className="grid lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-5">
            {/* 12-Milestone Visual Progress Header */}
            <div className="bw-card p-6 bg-[#070E1A] text-white border-[#D7B158]/35">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <img src="/brand/betterway-logo-horizontal-dark-bg.svg" alt="Betterway" className="h-7 mb-2" />
                  <h3 className="text-xl font-bold">{data.case.borrower_name} · {data.case.case_code}</h3>
                  <div className="text-xs text-slate-300 mt-0.5">
                    {data.case.project_name} ({data.case.unit_door || data.case.community}) · {fmtAed(data.case.requested_loan_aed)} ({data.case.ltv_pct}% LTV)
                  </div>
                </div>
                <StatusPill label={`Milestone ${currentOrder} / 12`} tone="emerald" />
              </div>
              <div className="mt-5 grid grid-cols-4 sm:grid-cols-6 gap-2">
                {data.milestones.map((m: any) => (
                  <div
                    key={m.code}
                    className={`p-2 rounded-xl text-[10px] border ${
                      m.order <= currentOrder
                        ? 'bg-[#179373]/30 border-[#34DFAC]/60 text-white font-bold'
                        : 'bg-white/5 border-white/10 text-slate-400'
                    }`}
                  >
                    <div>{String(m.order).padStart(2, '0')}</div>
                    <div className="truncate">{m.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Client Document Checklist */}
            <div className="bw-card p-5 space-y-3">
              <h4 className="text-sm font-bold">Your Secure Document Vault Checklist</h4>
              <div className="grid sm:grid-cols-2 gap-2.5 text-xs">
                {data.documents.map((doc: any) => (
                  <div key={doc.id} className="p-3 rounded-xl border border-[var(--bw-line)] flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 min-w-0">
                      <CheckCircle2 size={14} className={doc.status === 'Verified' ? 'text-[#179373]' : 'text-amber-500'} />
                      <span className="truncate font-medium">{doc.doc_name}</span>
                    </span>
                    {doc.status === 'Missing' ? (
                      <button type="button" onClick={() => void uploadDoc(doc.id)} className="px-2.5 py-1 rounded-full bg-[#179373] text-white font-bold inline-flex items-center gap-1 shrink-0 cursor-pointer">
                        <Upload size={11} /> Upload
                      </button>
                    ) : (
                      <StatusPill label={doc.status} tone={doc.status === 'Verified' ? 'emerald' : 'gold'} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Shortlisted Bank Offers */}
            <div className="bw-card p-5 space-y-3">
              <h4 className="text-sm font-bold">Active Bank Submissions &amp; Offers</h4>
              <div className="grid sm:grid-cols-2 gap-3 text-xs">
                {data.submissions.map((s: any, idx: number) => (
                  <div key={idx} className="p-3.5 rounded-2xl bg-[var(--bw-soft)] border border-[var(--bw-line)] flex items-center justify-between">
                    <div className="space-y-1">
                      <BankBadge bankKey={s.bank_key} />
                      <div className="font-mono-num text-[11px]">{s.rate_pct}% · {s.product_type}</div>
                    </div>
                    <StatusPill label={s.status} tone="emerald" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Sidebar: Advisor Card + Official Betterway Explainer Video */}
          <div className="lg:col-span-4 space-y-5">
            {data.advisor && (
              <div className="bw-card p-5 space-y-3">
                <div className="text-[10.5px] uppercase tracking-wider font-bold text-[#179373]">Your Dedicated Advisory Desk</div>
                <div className="flex items-center gap-3">
                  <StaffAvatar avatar={data.advisor.avatar} name={data.advisor.name} size="lg" />
                  <div>
                    <div className="font-bold text-sm">{data.advisor.name}</div>
                    <div className="text-xs text-[var(--bw-muted)]">{data.advisor.designation}</div>
                    <div className="text-[11px] text-[#179373] mt-0.5">{data.advisor.email}</div>
                  </div>
                </div>
                {data.coordinator && (
                  <div className="pt-3 border-t border-[var(--bw-line)] flex items-center gap-3">
                    <StaffAvatar avatar={data.coordinator.avatar} name={data.coordinator.name} size="sm" />
                    <div className="text-xs">
                      <div className="font-bold">{data.coordinator.name}</div>
                      <div className="text-[var(--bw-muted)]">Conveyancing &amp; DLD Progression</div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="bw-card overflow-hidden">
              <div className="px-4 py-3 border-b border-[var(--bw-line)] text-xs font-bold flex items-center gap-2">
                <PlayCircle size={15} className="text-[#179373]" /> Betterway UAE Mortgage Walkthrough
              </div>
              <video
                controls
                poster="/video/betterway-explainer.jpg"
                className="w-full aspect-video bg-[#070E1A]"
              >
                <source src="/video/betterway-explainer.mp4" type="video/mp4" />
              </video>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function PartnerHubPage() {
  const { toast } = useAuth();
  const [referrals, setReferrals] = useState<any[]>([]);
  const [form, setForm] = useState({
    agency_name: 'SWK Properties LLC',
    agent_name: '',
    agent_phone: '+971 55 ',
    rera_orn: 'ORN-31910',
    rera_brn: 'BRN-',
    buyer_name: '',
    property_value_aed: 2800000,
    target_loan_aed: 2240000,
    commission_share_pct: 25,
  });

  const load = async () => {
    const d = await apiFetch<{ referrals: any[] }>('/api/partners');
    setReferrals(d.referrals || []);
  };
  useEffect(() => {
    void load();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiFetch<any>('/api/partners/referrals', { method: 'POST', body: JSON.stringify(form) });
      toast(`Referral registered: ${res.referral_code} · Est. Partner Payout ${fmtAed(res.estimated_payout_aed)}`);
      setForm({ ...form, agent_name: '', buyer_name: '' });
      await load();
    } catch (err: any) {
      toast(err.message, 'err');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="B2B Realtor Ecosystem · Rivaling Hub by Holo & PRYPCO One"
        title="RERA Partner"
        accent="Referral Hub"
        subtitle="60-second buyer registration for SWK Properties and external Dubai RERA brokers with locked attribution, live milestone visibility, and guaranteed DSA payout tracking."
      />

      <div className="grid lg:grid-cols-12 gap-6">
        <form onSubmit={submit} className="lg:col-span-5 bw-card p-5 space-y-3 text-xs">
          <h3 className="text-sm font-bold flex items-center gap-2">
            <Handshake size={16} className="text-[#179373]" /> Register New Buyer Referral
          </h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold mb-1">Agency Name</label>
              <input required value={form.agency_name} onChange={(e) => setForm({ ...form, agency_name: e.target.value })} className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-card)]" />
            </div>
            <div>
              <label className="block font-bold mb-1">RERA ORN / BRN</label>
              <input required value={form.rera_brn} onChange={(e) => setForm({ ...form, rera_brn: e.target.value })} className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-card)] font-mono-num" />
            </div>
            <div>
              <label className="block font-bold mb-1">Agent Name</label>
              <input required value={form.agent_name} onChange={(e) => setForm({ ...form, agent_name: e.target.value })} className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-card)]" />
            </div>
            <div>
              <label className="block font-bold mb-1">Buyer Name</label>
              <input required value={form.buyer_name} onChange={(e) => setForm({ ...form, buyer_name: e.target.value })} className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-card)]" />
            </div>
            <div>
              <label className="block font-bold mb-1">Property Value (AED)</label>
              <input type="number" value={form.property_value_aed} onChange={(e) => setForm({ ...form, property_value_aed: Number(e.target.value), target_loan_aed: Math.round(Number(e.target.value) * 0.8) })} className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-card)] font-mono-num" />
            </div>
            <div>
              <label className="block font-bold mb-1">Target Loan (AED)</label>
              <input type="number" value={form.target_loan_aed} onChange={(e) => setForm({ ...form, target_loan_aed: Number(e.target.value) })} className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-card)] font-mono-num" />
            </div>
          </div>
          <button type="submit" className="w-full h-10 rounded-full bg-gradient-to-r from-[#179373] to-[#0A4A3E] text-white font-bold cursor-pointer">
            Lock Attribution &amp; Register Referral
          </button>
        </form>

        <div className="lg:col-span-7 bw-card overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[600px]">
            <thead className="bg-[var(--bw-soft)] text-[10.5px] uppercase text-[var(--bw-muted)]">
              <tr>
                <th className="p-3">Ref</th>
                <th className="p-3">Partner Agency / Agent</th>
                <th className="p-3">Buyer &amp; Loan</th>
                <th className="p-3">Stage</th>
                <th className="p-3">Est. Payout</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--bw-line)]">
              {referrals.map((r) => (
                <tr key={r.id}>
                  <td className="p-3 font-mono-num font-bold text-[#179373]">{r.referral_code}</td>
                  <td className="p-3">
                    <div className="font-bold">{r.agency_name}</div>
                    <div className="text-[11px] text-[var(--bw-muted)]">{r.agent_name} · {r.rera_brn}</div>
                  </td>
                  <td className="p-3">
                    <div className="font-bold">{r.buyer_name}</div>
                    <div className="font-mono-num text-[11px] text-[var(--bw-muted)]">{fmtAed(r.target_loan_aed, true)}</div>
                  </td>
                  <td className="p-3"><StatusPill label={r.stage_label} tone="blue" /></td>
                  <td className="p-3 font-mono-num font-bold text-[#BA8D36]">{fmtAed(r.estimated_payout_aed)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function MobilePreviewPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Dedicated PWA + Capacitor 7 Android/iOS Companion (SWK Mobile v3.0.0 + nCino 3-Mode Parity)"
        title="Betterway"
        accent="Mobile App Suite"
        subtitle="Live interactive preview of our standalone Betterway Mobile App served at /mobile/ — switch inside the phone between Advisor/Staff Mode, Borrower Pocket Mode, and RERA Partner Mode."
        actions={
          <a
            href="/mobile/"
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 rounded-full text-xs font-bold text-white bg-gradient-to-r from-[#179373] to-[#0A4A3E] inline-flex items-center gap-1.5"
          >
            <ExternalLink size={14} /> Open Fullscreen Mobile App
          </a>
        }
      />

      <div className="grid lg:grid-cols-12 gap-8 items-start">
        {/* Live Interactive iPhone/Android Phone Frame */}
        <div className="lg:col-span-5 flex justify-center">
          <div className="w-[390px] h-[790px] rounded-[48px] bg-[#070E1A] p-3 shadow-2xl border-[6px] border-[#1E2D45] relative">
            <div className="w-28 h-5 bg-[#070E1A] rounded-b-2xl mx-auto absolute top-2.5 left-1/2 -translate-x-1/2 z-20" />
            <iframe
              src="/mobile/"
              title="Betterway Mobile App Live Preview"
              className="w-full h-full rounded-[38px] bg-[#070E1A] border-0"
            />
          </div>
        </div>

        {/* Native Architecture & Capacitor Spec Card */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bw-card p-6 bg-[#070E1A] text-white border-[#D7B158]/35 flex items-center gap-4">
            <img
              src="/brand/betterway-app-icon-dark-squircle-512x512.png"
              alt="Betterway App Icon"
              className="size-16 rounded-2xl shadow-lg"
            />
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#34DFAC]">com.betterwaymortgages.mobile</div>
              <h3 className="text-xl font-bold mt-0.5">Betterway Mobile v1.0 (PWA + Capacitor 7)</h3>
              <p className="text-xs text-slate-300 mt-1">
                Zero-bloat offline-shell architecture modeled on SWK Mobile v3.0.0 with Android Keystore / FLAG_SECURE hardening, biometric lock, and real-time sync feed (/api/sync/changes).
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-3 text-xs">
            <div className="bw-card p-4 space-y-1.5">
              <div className="font-bold text-[#179373] flex items-center gap-1.5"><Smartphone size={14} /> 1. Advisor / Staff Mode</div>
              <p className="text-[var(--bw-muted)]">Live 12-stage pipeline, masked vault dialer, 24-bank rate cards, CBUAE DBR/EMI calculator, Reception QR check-in, Field Duty GPS, and mandatory Daily Close report.</p>
            </div>
            <div className="bw-card p-4 space-y-1.5">
              <div className="font-bold text-[#BA8D36] flex items-center gap-1.5"><Smartphone size={14} /> 2. Borrower Pocket Mode</div>
              <p className="text-[var(--bw-muted)]">Live 12-milestone progress tracker, instant camera document upload to vault, EMI &amp; cash-to-close planner, shortlisted bank quotes, and direct advisor contact.</p>
            </div>
            <div className="bw-card p-4 space-y-1.5">
              <div className="font-bold text-sky-600 dark:text-sky-400 flex items-center gap-1.5"><Smartphone size={14} /> 3. RERA Partner Mode</div>
              <p className="text-[var(--bw-muted)]">60-second buyer referral submission, instant indicative pre-qualification letter, real-time deal progression updates, and DSA partner payout wallet.</p>
            </div>
          </div>

          <div className="bw-card p-5 space-y-2 text-xs">
            <div className="font-bold text-sm">Android APK / Play Store AAB &amp; iOS Build Commands</div>
            <pre className="p-3.5 rounded-xl bg-[#070E1A] text-[#34DFAC] font-mono-num overflow-x-auto text-[11px]">{`cd mobile
npm install
npm run build:www       # Packages strict-CSP app + all Betterway brand/bank/staff assets
npx cap add android     # Initializes hardened Android Gradle project (minSdk 24, FLAG_SECURE)
npx cap sync android    # Syncs www/ + Betterway squircle launcher icons
cd android && ./gradlew assembleRelease`}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}
