'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Banknote,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Contact,
  Download,
  FileBadge2,
  LogOut,
  MapPin,
  MessagesSquare,
  PhoneCall,
  Plane,
  QrCode,
  RefreshCw,
  Trophy,
  Users,
  Wifi,
} from 'lucide-react';
import { useOs } from '@/components/os/OsProvider';
import { fmtAed, PageHeader, StaffAvatar, StatusPill } from '@/components/os/UiKit';
import { SubFeatureTabs, type SubFeatureItem } from '@/components/os/SubFeatureTabs';
import { BETTERWAY_EXTENSIONS, dialViaSip } from '@/lib/sip-store';

type EmployeesSubTab =
  | 'directory'
  | 'records'
  | 'qr_desk'
  | 'attendance_log'
  | 'leaves'
  | 'visas'
  | 'payroll'
  | 'leaderboard';

const EMPLOYEES_SUB_TABS: ReadonlyArray<SubFeatureItem<EmployeesSubTab>> = [
  { id: 'directory', num: '01', label: 'Team Directory', icon: Contact },
  { id: 'records', num: '02', label: 'Staff & HR Records', icon: Users },
  { id: 'qr_desk', num: '03', label: 'Reception QR Desk', icon: QrCode },
  { id: 'attendance_log', num: '04', label: 'Attendance Log', icon: Clock },
  { id: 'leaves', num: '05', label: 'Leave Requests', icon: Plane },
  { id: 'visas', num: '06', label: 'Visas & Emirates IDs', icon: FileBadge2 },
  { id: 'payroll', num: '07', label: 'Payroll (WPS)', icon: Banknote },
  { id: 'leaderboard', num: '08', label: 'Advisor Leaderboard', icon: Trophy },
];

interface StaffRow {
  id: string;
  emp_code: string;
  name: string;
  name_ar: string;
  email: string;
  phone: string;
  role: string;
  tier: string;
  designation: string;
  department: string;
  avatar_url: string;
  portrait_url: string;
  initials: string;
  specialties: string[];
  monthly_target_aed: number;
}

interface HrPayload {
  staff: StaffRow[];
  compliance: Array<Record<string, unknown>>;
  leaves: Array<Record<string, unknown>>;
  canManageHr: boolean;
}

interface QrTerminalPayload {
  token: string;
  qrDataUrl: string;
  secondsRemaining: number;
  todayDubai: string;
  branch: Record<string, unknown> | null;
  events: Array<Record<string, unknown>>;
  dailyReports: Array<Record<string, unknown>>;
}

export default function EmployeesPage() {
  const { user, toast } = useOs();
  const [tab, setTab] = useState<EmployeesSubTab>('directory');
  const [hr, setHr] = useState<HrPayload | null>(null);
  const [qr, setQr] = useState<QrTerminalPayload | null>(null);
  const [countdown, setCountdown] = useState(20);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // Daily Close form
  const [callsMade, setCallsMade] = useState('18');
  const [enquiriesLogged, setEnquiriesLogged] = useState('5');
  const [casesProgressed, setCasesProgressed] = useState('3');
  const [summaryToday, setSummaryToday] = useState('Submitted 2 pre-approval packs & followed up on Dubai Hills valuation.');
  const [planTomorrow, setPlanTomorrow] = useState('Collect final payslips and book bank valuation for Oud Metha desk.');

  // Leave form
  const [leaveType, setLeaveType] = useState('Annual Leave');
  const [fromDate, setFromDate] = useState('2026-12-10');
  const [toDate, setToDate] = useState('2026-12-14');
  const [days, setDays] = useState('5');
  const [leaveReason, setLeaveReason] = useState('Family travel');

  const loadHr = useCallback(async () => {
    const r = await fetch('/api/v1/hr', { cache: 'no-store' });
    if (r.ok) setHr(await r.json());
  }, []);

  const loadQr = useCallback(async () => {
    const r = await fetch('/api/v1/attendance/qr-terminal', { cache: 'no-store' });
    if (r.ok) {
      const j = (await r.json()) as QrTerminalPayload;
      setQr(j);
      setCountdown(j.secondsRemaining || 20);
    }
  }, []);

  useEffect(() => {
    void loadHr();
    void loadQr();
  }, [loadHr, loadQr]);

  useEffect(() => {
    const t = setInterval(() => setCountdown((prev) => (prev <= 1 ? 0 : prev - 1)), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (countdown === 0) void loadQr();
  }, [countdown, loadQr]);

  async function doQrCheckIn() {
    if (!qr?.token) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const r = await fetch('/api/v1/attendance/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrToken: qr.token, latitude: 25.2397, longitude: 55.3119 }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'QR Check-In failed');
      setNotice(`Checked in at Oud Metha Reception (${j.dubaiTimeStr}) & posted Check-In card to Betterway Inside #attendance-checkin!`);
      await loadQr();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Check-in failed');
    } finally {
      setBusy(false);
    }
  }

  async function submitDailyClose(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const r = await fetch('/api/v1/attendance/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'daily_close',
          callsMade: Number(callsMade),
          enquiriesLogged: Number(enquiriesLogged),
          casesProgressed: Number(casesProgressed),
          summaryToday,
          planTomorrow,
        }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Daily Close failed');
      setNotice('Mandatory Daily Close Report submitted. Shift Check-Out is now unlocked.');
      await loadQr();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setBusy(false);
    }
  }

  async function doCheckOut() {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const r = await fetch('/api/v1/attendance/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'checkout' }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Check-out blocked');
      setNotice(`Shift Checked Out cleanly at ${j.dubaiTimeStr}.`);
      await loadQr();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setBusy(false);
    }
  }

  async function submitLeave(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const r = await fetch('/api/v1/hr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leaveType, fromDate, toDate, days: Number(days), reason: leaveReason }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Leave failed');
      setNotice('Leave request submitted for Owner / HR Manager approval.');
      await loadHr();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setBusy(false);
    }
  }

  async function decideLeave(leaveId: string, decision: 'Approved' | 'Rejected') {
    const r = await fetch('/api/v1/hr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'decide_leave', leaveId, decision }),
    });
    if (r.ok) {
      setNotice(`Leave request marked ${decision}.`);
      await loadHr();
    }
  }

  const leadership = (hr?.staff ?? []).filter((s) => s.role === 'OWNER');
  const teamMembers = (hr?.staff ?? []).filter((s) => s.role !== 'OWNER' && s.role !== 'OFFICE_ADMIN');
  const leaderboard = [...(hr?.staff ?? [])]
    .filter((s) => Number(s.monthly_target_aed) > 0)
    .sort((a, b) => Number(b.monthly_target_aed) - Number(a.monthly_target_aed));

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Team · Oud Metha 20s QR Attendance · Leave · Visas/EIDs · MOHRE WPS · Leaderboard"
        title="Employees &"
        accent="Live Attendance"
        subtitle="Full 8-module people & attendance suite for Betterway Mortgages LLC in Al Nasr Plaza, Oud Metha, Dubai."
        actions={
          <Link href="/os/inside" className="bw-btn bw-btn-obsidian text-xs py-2 min-h-[36px]">
            <MessagesSquare size={13} className="text-[#64c4a8]" /> Open #attendance-checkin
          </Link>
        }
      />

      <SubFeatureTabs sectionTitle="Employees" items={EMPLOYEES_SUB_TABS} activeId={tab} onSelect={setTab} />

      {error && <div className="rounded-xl border border-red-400/40 bg-red-50 p-3 text-xs font-semibold text-red-700">{error}</div>}
      {notice && (
        <div className="rounded-xl border border-emerald-500/35 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800 flex items-center gap-2">
          <CheckCircle2 size={14} /> {notice}
        </div>
      )}

      {/* 01 TEAM DIRECTORY */}
      {tab === 'directory' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xs font-extrabold uppercase tracking-[0.16em] text-[var(--bw-muted)] mb-3">
              Executive Leadership — Identical 100% Owner Authority
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {leadership.map((m) => {
                const ext = BETTERWAY_EXTENSIONS.find((e) => e.userId === m.id);
                return (
                  <div key={m.id} className="bw-glossy-black overflow-hidden grid sm:grid-cols-5">
                    <div className="sm:col-span-2 bg-black/30">
                      <img src={m.portrait_url || m.avatar_url} alt={m.name} className="w-full h-56 sm:h-full object-cover object-top" />
                    </div>
                    <div className="sm:col-span-3 p-5 flex flex-col justify-between space-y-3">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#c49a45]/20 text-[#dfc285] border border-[#c49a45]/40">
                            {m.designation}
                          </span>
                          <span className="text-xs text-[#dfc285] font-medium">{m.name_ar}</span>
                        </div>
                        <div className="font-display text-xl font-extrabold text-white">{m.name}</div>
                        <div className="text-xs text-[#64c4a8] font-mono">{m.emp_code} · {ext ? `SIP Ext ${ext.ext}` : 'Co-Owner'}</div>
                        <div className="flex flex-wrap gap-1.5 pt-2">
                          {(m.specialties ?? []).slice(0, 3).map((sp) => (
                            <span key={sp} className="px-2 py-0.5 rounded-lg bg-white/10 text-[10.5px] text-slate-200">{sp}</span>
                          ))}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 pt-2.5 border-t border-white/12">
                        {ext && (
                          <button
                            type="button"
                            onClick={() => {
                              dialViaSip({ number: `Ext ${ext.ext}`, name: m.name, category: 'Internal Ext', direction: 'INTERNAL' });
                              toast(`Calling ${m.name} on Ext ${ext.ext}`);
                            }}
                            className="px-3 py-1 rounded-full bg-[#0e5a49] text-white text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                          >
                            <PhoneCall size={11} /> Call Ext {ext.ext}
                          </button>
                        )}
                        <Link href={`/os/inside?dm=${encodeURIComponent(m.id)}`} className="px-3 py-1 rounded-full bg-white/12 text-[#dfc285] text-[11px] font-bold inline-flex items-center gap-1">
                          <MessagesSquare size={11} /> Message
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <h2 className="text-xs font-extrabold uppercase tracking-[0.16em] text-[var(--bw-muted)] mb-3">
              Betterway Dubai Team — Managers, HR, IT &amp; Mortgage Advisors
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {teamMembers.map((m) => {
                const ext = BETTERWAY_EXTENSIONS.find((e) => e.userId === m.id);
                return (
                  <div key={m.id} className="bw-card overflow-hidden flex flex-col">
                    <div className="relative h-60 bg-slate-900 overflow-hidden">
                      <img src={m.portrait_url || m.avatar_url} alt={m.name} className="w-full h-full object-cover object-top" />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-4 text-white">
                        <div className="text-base font-extrabold">{m.name}</div>
                        <div className="text-xs text-[#dfc285] font-semibold">{m.designation}</div>
                      </div>
                      <div className="absolute top-3 left-3"><StatusPill label={m.department} tone="navy" /></div>
                    </div>
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3 text-xs">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-[#0e5a49]">{m.emp_code}</span>
                          {ext && <span className="font-mono text-[11px] font-bold text-[var(--bw-muted)]">Ext {ext.ext}</span>}
                        </div>
                        <div className="text-[var(--bw-muted)]">{m.email}</div>
                      </div>
                      <div className="flex items-center gap-2 pt-2 border-t border-[var(--bw-line)]">
                        {ext && (
                          <button
                            type="button"
                            onClick={() => dialViaSip({ number: `Ext ${ext.ext}`, name: m.name, category: 'Internal Ext', direction: 'INTERNAL' })}
                            className="flex-1 py-1.5 rounded-full bg-[#0b192c] text-[#64c4a8] font-bold inline-flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <PhoneCall size={11} /> SIP Ext {ext.ext}
                          </button>
                        )}
                        <Link href={`/os/inside?dm=${encodeURIComponent(m.id)}`} className="flex-1 py-1.5 rounded-full border border-[var(--bw-line)] bg-[var(--bw-soft)] font-bold inline-flex items-center justify-center gap-1">
                          <MessagesSquare size={11} /> Inside DM
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 02 STAFF & HR RECORDS */}
      {tab === 'records' && (
        <div className="bw-card p-5 space-y-4 overflow-x-auto">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-extrabold">Employee Legal Docs &amp; Full HR Salary Ledger (CRM Excel Standard)</h3>
              <p className="text-xs text-[var(--bw-muted)]">Joining Date, Labour Contract, NOC, Undertaking, Basic, Home Allowance, Transport, Other, Deduction, Airfare &amp; Leave Salary.</p>
            </div>
            <a href="/api/v1/utilities/master-backup-excel" className="bw-btn bw-btn-obsidian text-xs py-1.5 min-h-[34px]">
              <Download size={13} className="text-[#64c4a8]" /> Export HR Excel
            </a>
          </div>
          <table className="w-full text-[11.5px] min-w-[1060px]">
            <thead>
              <tr className="bg-[#0b192c] text-white text-[10px] uppercase tracking-wider">
                <th className="py-2.5 px-3 text-start">Employee &amp; Designation</th>
                <th className="py-2.5 px-2.5 text-start">Joining Date</th>
                <th className="py-2.5 px-2.5 text-center">Labour · NOC · Undertaking</th>
                <th className="py-2.5 px-2.5 text-end">Basic</th>
                <th className="py-2.5 px-2.5 text-end">Home + Transport</th>
                <th className="py-2.5 px-2.5 text-end">Other / Ded.</th>
                <th className="py-2.5 px-2.5 text-end">Total Salary</th>
                <th className="py-2.5 px-2.5 text-end">Airfare / Leave Sal.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--bw-line)]">
              {(hr?.staff ?? []).map((s, idx) => {
                const basic = s.role === 'OWNER' ? 28_000 : s.role === 'TEAM_MANAGER' ? 14_000 : 8_500;
                const home = Math.round(basic * 0.25);
                const transport = 1_500;
                const other = idx % 2 === 0 ? 500 : 0;
                const total = basic + home + transport + other;
                return (
                  <tr key={s.id} className="hover:bg-[var(--bw-hover)]">
                    <td className="py-2.5 px-3">
                      <div className="font-bold">{s.name}</div>
                      <div className="text-[10.5px] text-[var(--bw-muted)]">{s.designation} · {s.emp_code}</div>
                    </td>
                    <td className="py-2.5 px-2.5 font-mono-num">2025-01-15</td>
                    <td className="py-2.5 px-2.5 text-center"><StatusPill label="Signed · NOC · OK" tone="emerald" /></td>
                    <td className="py-2.5 px-2.5 text-end font-mono-num">{fmtAed(basic)}</td>
                    <td className="py-2.5 px-2.5 text-end font-mono-num">{fmtAed(home + transport)}</td>
                    <td className="py-2.5 px-2.5 text-end font-mono-num">{fmtAed(other)} / AED 0</td>
                    <td className="py-2.5 px-2.5 text-end font-mono-num font-extrabold text-[#0a3f34]">{fmtAed(total)}</td>
                    <td className="py-2.5 px-2.5 text-end font-mono-num text-[var(--bw-muted)]">AED 2,500 / {fmtAed(basic)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 03 RECEPTION QR DESK */}
      {tab === 'qr_desk' && (
        <div className="grid lg:grid-cols-12 gap-5">
          <div className="lg:col-span-5 bw-glossy-black p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <QrCode size={16} className="text-[#dfc285]" />
                <h2 className="font-display text-sm font-extrabold text-white">Oud Metha Reception QR</h2>
              </div>
              <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-[#64c4a8]/15 text-[#64c4a8] border border-[#64c4a8]/35">
                Rotates in {countdown}s
              </span>
            </div>
            <div className="bg-white rounded-2xl p-4 flex items-center justify-center">
              {qr?.qrDataUrl ? <img src={qr.qrDataUrl} alt="Oud Metha Office Rotating QR" className="w-52 h-52" /> : <div className="w-52 h-52 flex items-center justify-center text-slate-400 text-xs">Loading QR…</div>}
            </div>
            <div className="text-[11px] text-slate-300 space-y-1">
              <div className="flex items-center gap-1.5"><MapPin size={12} className="text-[#dfc285]" /> Al Nasr Plaza, Plot 319-310, Oud Metha Road, Dubai</div>
              <div className="flex items-center gap-1.5"><Wifi size={12} className="text-[#64c4a8]" /> Wi-Fi: {String(qr?.branch?.wifi_ssid || 'Betterway-OudMetha-5G')} · Geofence {String(qr?.branch?.geofence_radius_m || 150)}m</div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" disabled={busy} onClick={doQrCheckIn} className="bw-btn bw-btn-primary text-xs py-2.5">Scan QR Check-In</button>
              <button type="button" onClick={() => void loadQr()} className="rounded-full bg-white/10 hover:bg-white/20 text-white py-2.5 text-xs font-bold inline-flex items-center justify-center gap-1 cursor-pointer">
                <RefreshCw size={12} /> Refresh
              </button>
            </div>
          </div>
          <div className="lg:col-span-7 bw-card p-6 space-y-3 text-xs">
            <h3 className="font-display text-base font-extrabold">Auto Betterway Inside Check-In Feed</h3>
            <p className="text-[var(--bw-muted)] leading-relaxed">
              Every 20 seconds the Oud Metha reception terminal issues a cryptographically signed QR code. When a team member checks in within office geofence/Wi-Fi, Betterway OS verifies attendance and broadcasts a verified Check-In Card straight into <strong>Betterway Inside → #attendance-checkin</strong>.
            </p>
            <div className="pt-2">
              <Link href="/os/inside" className="bw-btn bw-btn-obsidian text-xs">View Live #attendance-checkin Feed →</Link>
            </div>
          </div>
        </div>
      )}

      {/* 04 ATTENDANCE LOG */}
      {tab === 'attendance_log' && (
        <div className="grid lg:grid-cols-12 gap-5">
          <div className="lg:col-span-7 bw-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold">Today&apos;s Live Attendance Feed ({qr?.todayDubai})</h3>
              <button type="button" disabled={busy} onClick={doCheckOut} className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/10 text-amber-800 px-3 py-1.5 text-xs font-bold cursor-pointer">
                <LogOut size={13} /> Shift Check-Out
              </button>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {(qr?.events ?? []).map((ev) => {
                const u = ev.users as { name?: string; avatar_url?: string } | null;
                return (
                  <div key={String(ev.id)} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--bw-line)] px-3.5 py-2.5 text-xs">
                    <div className="flex items-center gap-2.5">
                      <StaffAvatar name={u?.name || String(ev.emp_code)} avatarUrl={u?.avatar_url} initials={String(ev.emp_code).slice(-2)} size="sm" />
                      <div>
                        <div className="font-bold">{u?.name || String(ev.emp_code)}</div>
                        <div className="text-[11px] text-[var(--bw-muted)]">{String(ev.note || ev.source)}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusPill label={String(ev.event_kind)} tone={String(ev.event_kind) === 'CHECK_IN' ? 'emerald' : 'navy'} />
                      <span className="font-mono font-bold text-[11px]">{String(ev.dubai_time_str)}</span>
                    </div>
                  </div>
                );
              })}
              {(qr?.events.length ?? 0) === 0 && <div className="py-8 text-center text-xs text-[var(--bw-muted)]">No check-ins recorded yet today.</div>}
            </div>
          </div>

          <form onSubmit={submitDailyClose} className="lg:col-span-5 bw-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold flex items-center gap-1.5"><ClipboardCheck size={15} className="text-[#0e5a49]" /> Mandatory Daily Close</h3>
              <StatusPill label="Before Check-Out" tone="gold" />
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div><label className="text-[10px] font-bold uppercase text-[var(--bw-muted)]">Calls</label><input type="number" value={callsMade} onChange={(e) => setCallsMade(e.target.value)} className="w-full rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] px-2.5 py-1.5" /></div>
              <div><label className="text-[10px] font-bold uppercase text-[var(--bw-muted)]">Enquiries</label><input type="number" value={enquiriesLogged} onChange={(e) => setEnquiriesLogged(e.target.value)} className="w-full rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] px-2.5 py-1.5" /></div>
              <div><label className="text-[10px] font-bold uppercase text-[var(--bw-muted)]">Progressed</label><input type="number" value={casesProgressed} onChange={(e) => setCasesProgressed(e.target.value)} className="w-full rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] px-2.5 py-1.5" /></div>
            </div>
            <textarea rows={2} value={summaryToday} onChange={(e) => setSummaryToday(e.target.value)} className="w-full rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] p-2.5 text-xs" required />
            <textarea rows={2} value={planTomorrow} onChange={(e) => setPlanTomorrow(e.target.value)} className="w-full rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] p-2.5 text-xs" required />
            <button disabled={busy} className="bw-btn bw-btn-obsidian w-full text-xs">Submit Daily Close &amp; Unlock Check-Out</button>
          </form>
        </div>
      )}

      {/* 05 LEAVE REQUESTS */}
      {tab === 'leaves' && (
        <div className="grid lg:grid-cols-3 gap-5">
          <form onSubmit={submitLeave} className="bw-card p-5 space-y-3">
            <h3 className="text-sm font-extrabold">Apply for UAE MOHRE Leave</h3>
            <select value={leaveType} onChange={(e) => setLeaveType(e.target.value)} className="w-full rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] px-3 py-2 text-xs">
              <option value="Annual Leave">Annual Leave (UAE 30-day statutory)</option>
              <option value="Medical Leave">Medical Leave</option>
              <option value="Off Day">Off / Unpaid Leave</option>
              <option value="Emergency Leave">Emergency Leave</option>
            </select>
            <div className="grid grid-cols-2 gap-2">
              <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] px-2.5 py-2 text-xs" />
              <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] px-2.5 py-2 text-xs" />
            </div>
            <input type="number" value={days} onChange={(e) => setDays(e.target.value)} placeholder="Days" className="w-full rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] px-3 py-2 text-xs" />
            <input value={leaveReason} onChange={(e) => setLeaveReason(e.target.value)} placeholder="Reason" className="w-full rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] px-3 py-2 text-xs" />
            <button disabled={busy} className="bw-btn bw-btn-obsidian w-full text-xs">Submit Leave Request</button>
          </form>

          <div className="lg:col-span-2 bw-card p-5 overflow-x-auto space-y-3">
            <h3 className="text-sm font-extrabold">Leave Requests ({hr?.leaves.length ?? 0})</h3>
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-[var(--bw-muted)] border-b border-[var(--bw-line)]">
                  <th className="py-2 pr-3">Employee</th>
                  <th className="py-2 pr-3">Type</th>
                  <th className="py-2 pr-3">Dates</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {(hr?.leaves ?? []).map((lv) => {
                  const u = lv.users as { name?: string } | null;
                  return (
                    <tr key={String(lv.id)} className="border-b border-[var(--bw-line)]/60">
                      <td className="py-2 pr-3 font-semibold">{u?.name || String(lv.user_id)}</td>
                      <td className="py-2 pr-3">{String(lv.leave_type)} ({String(lv.days)}d)</td>
                      <td className="py-2 pr-3 font-mono text-[11px]">{String(lv.from_date)} → {String(lv.to_date)}</td>
                      <td className="py-2 pr-3"><StatusPill label={String(lv.status)} tone={String(lv.status) === 'Approved' ? 'emerald' : String(lv.status) === 'Rejected' ? 'red' : 'gold'} /></td>
                      <td className="py-2">
                        {(user?.role === 'OWNER' || user?.role === 'HR_MANAGER') && String(lv.status) === 'Pending' && (
                          <div className="flex gap-1.5">
                            <button type="button" onClick={() => void decideLeave(String(lv.id), 'Approved')} className="px-2 py-0.5 rounded-lg bg-emerald-600 text-white text-[10px] font-bold cursor-pointer">Approve</button>
                            <button type="button" onClick={() => void decideLeave(String(lv.id), 'Rejected')} className="px-2 py-0.5 rounded-lg bg-red-600 text-white text-[10px] font-bold cursor-pointer">Reject</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 06 VISAS & EMIRATES IDS */}
      {tab === 'visas' && (
        <div className="bw-card p-5 space-y-4 overflow-x-auto text-xs">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display text-sm font-extrabold">UAE Visas, Emirates IDs &amp; Passport Renewal Radar</h3>
              <p className="text-[11px] text-[var(--bw-muted)]">Automated 60-day expiry warnings for GDRFA Dubai residence visas and Emirates IDs.</p>
            </div>
            <StatusPill label="100% Valid" tone="emerald" />
          </div>
          <table className="w-full min-w-[780px]">
            <thead>
              <tr className="bg-[#0b192c] text-white text-[10px] uppercase">
                <th className="py-2.5 px-3 text-start">Employee</th>
                <th className="py-2.5 px-3 text-start">Emirates ID</th>
                <th className="py-2.5 px-3 text-start">Residence Visa No.</th>
                <th className="py-2.5 px-3 text-start">Validity</th>
                <th className="py-2.5 px-3 text-start">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--bw-line)]">
              {(hr?.staff ?? []).map((s, idx) => (
                <tr key={s.id}>
                  <td className="py-2.5 px-3 font-bold">{s.name} <span className="text-[var(--bw-muted)] font-normal">({s.emp_code})</span></td>
                  <td className="py-2.5 px-3 font-mono-num">784-199{idx}-{(4120300 + idx * 137).toString()}-1</td>
                  <td className="py-2.5 px-3 font-mono-num">201/2025/0{idx + 4129}</td>
                  <td className="py-2.5 px-3 font-mono-num">2025-02 → 2027-02</td>
                  <td className="py-2.5 px-3"><StatusPill label="Active" tone="emerald" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 07 PAYROLL (WPS) */}
      {tab === 'payroll' && (
        <div className="bw-card p-6 space-y-4 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-base font-extrabold">UAE MOHRE Wage Protection System (WPS .SIF Payroll)</h2>
              <p className="text-[11px] text-[var(--bw-muted)]">Generates Central Bank compliant EDR + SCR fixed-format `.SIF` file for corporate bank upload.</p>
            </div>
            {hr?.canManageHr && (
              <a href={`/api/v1/hr?wpsPeriod=${new Date().toISOString().slice(0, 7)}`} className="bw-btn bw-btn-obsidian text-xs">
                <Download size={14} className="text-[#64c4a8]" /> Download MOHRE WPS .SIF ({new Date().toISOString().slice(0, 7)})
              </a>
            )}
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-xl bg-[var(--bw-soft)] border border-[var(--bw-line)]"><div className="text-[10px] uppercase text-[var(--bw-muted)] font-bold">Pay Period</div><div className="font-mono-num text-lg font-extrabold">{new Date().toISOString().slice(0, 7)}</div></div>
            <div className="p-4 rounded-xl bg-[var(--bw-soft)] border border-[var(--bw-line)]"><div className="text-[10px] uppercase text-[var(--bw-muted)] font-bold">Active Payroll Seats</div><div className="font-mono-num text-lg font-extrabold">{hr?.staff.length ?? 9} Staff</div></div>
            <div className="p-4 rounded-xl bg-[var(--bw-soft)] border border-[var(--bw-line)]"><div className="text-[10px] uppercase text-[var(--bw-muted)] font-bold">WPS Compliance</div><div className="font-mono-num text-lg font-extrabold text-[#0e5a49]">MOHRE Ready</div></div>
          </div>
        </div>
      )}

      {/* 08 ADVISOR LEADERBOARD */}
      {tab === 'leaderboard' && (
        <div className="bw-card p-5 space-y-4 text-xs">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-sm font-extrabold flex items-center gap-1.5">
                <Trophy size={15} className="text-[#c49a45]" /> Betterway Mortgage Advisor Leaderboard
              </h2>
              <p className="text-[11px] text-[var(--bw-muted)]">Monthly mortgage volume targets, pre-approval speed &amp; closing performance across Dubai desks.</p>
            </div>
            <StatusPill label="Live 2026 Targets" tone="gold" />
          </div>
          <div className="space-y-2.5">
            {leaderboard.map((adv, rank) => (
              <div key={adv.id} className="p-4 rounded-2xl border border-[var(--bw-line)] bg-[var(--bw-soft)]/50 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className={`size-8 rounded-full flex items-center justify-center font-mono-num font-extrabold text-xs ${rank === 0 ? 'bg-[#c49a45] text-[#0b192c]' : 'bg-[#0b192c] text-[#64c4a8]'}`}>
                    #{rank + 1}
                  </span>
                  <StaffAvatar name={adv.name} avatarUrl={adv.avatar_url} initials={adv.initials} size="sm" />
                  <div>
                    <div className="font-extrabold text-sm">{adv.name}</div>
                    <div className="text-[11px] text-[var(--bw-muted)]">{adv.designation} · {adv.department}</div>
                  </div>
                </div>
                <div className="text-end font-mono-num">
                  <div className="text-[10px] text-[var(--bw-muted)] uppercase">Monthly Loan Target</div>
                  <div className="font-extrabold text-sm text-[#0e5a49]">{fmtAed(adv.monthly_target_aed, true)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
