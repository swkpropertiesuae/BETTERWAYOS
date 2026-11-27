'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  ClipboardCheck,
  Download,
  LogOut,
  MapPin,
  QrCode,
  RefreshCw,
  ShieldCheck,
  Users,
  Wifi,
} from 'lucide-react';
import { useOs } from '@/components/os/OsProvider';
import { fmtAed, PageHeader, StaffAvatar, StatusPill } from '@/components/os/UiKit';

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
  const { user } = useOs();
  const [tab, setTab] = useState<'roster' | 'attendance' | 'hr'>('roster');
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
    loadHr();
    loadQr();
  }, [loadHr, loadQr]);

  // 20-second rotating Oud Metha Reception QR countdown (clean effect without mutating inside updater)
  useEffect(() => {
    const t = setInterval(() => {
      setCountdown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (countdown === 0) {
      void loadQr();
    }
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
        body: JSON.stringify({
          qrToken: qr.token,
          latitude: 25.2397,
          longitude: 55.3119,
        }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'QR Check-In failed');
      setNotice(`Checked in at Oud Metha Reception (${j.dubaiTimeStr}) & posted Check-In card to Team Group #attendance-checkin!`);
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

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Team · Oud Metha 20s QR + Geofence Attendance · MOHRE WPS"
        title="Employees &"
        accent="Live Attendance"
        subtitle="Official Betterway Mortgages LLC 8-member leadership & advisory studio roster, Oud Metha Al Nasr Plaza 20s rotating QR check-in (auto-posted to #attendance-checkin), Mandatory Daily Close, and UAE MOHRE WPS payroll."
        actions={
          <Link
            href="/os/inside"
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#025e3d] text-white px-3.5 py-2 text-xs font-bold hover:brightness-110"
          >
            Open #attendance-checkin Group →
          </Link>
        }
      />

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

      <div className="flex flex-wrap gap-2">
        {(
          [
            ['roster', 'Official 8-Member Studio Roster', Users],
            ['attendance', 'Oud Metha Reception QR Attendance', QrCode],
            ['hr', 'UAE Visas, Leave & MOHRE WPS (.SIF)', ShieldCheck],
          ] as const
        ).map(([k, label, Icon]) => (
          <button
            key={k}
            type="button"
            onClick={() => setTab(k)}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border transition ${
              tab === k ? 'bg-[#025e3d] text-white border-[#025e3d]' : 'bg-[var(--bw-card)] border-[var(--bw-line)]'
            }`}
          >
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {tab === 'roster' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xs font-extrabold uppercase tracking-[0.16em] text-[var(--bw-muted)] mb-3">
              Executive Leadership — Identical 100% Owner Authority
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {leadership.map((m) => (
                <div
                  key={m.id}
                  className="rounded-2xl overflow-hidden bg-[#025e3d] text-white border border-[#D4AF37]/40 grid sm:grid-cols-5"
                >
                  <div className="sm:col-span-2 bg-black/30">
                    <img
                      src={m.portrait_url || m.avatar_url}
                      alt={m.name}
                      className="w-full h-56 sm:h-full object-cover object-top"
                    />
                  </div>
                  <div className="sm:col-span-3 p-5 flex flex-col justify-between space-y-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#D4AF37]/15 text-[#FCF1B7] border border-[#D4AF37]/40">
                          {m.designation}
                        </span>
                        <span className="text-xs text-[#D4AF37]/80 font-medium">{m.name_ar}</span>
                      </div>
                      <div className="text-xl font-extrabold">{m.name}</div>
                      <div className="text-xs text-[#D4AF37] font-mono">{m.emp_code} · 100% Co-Owner Access</div>
                      <div className="flex flex-wrap gap-1.5 pt-2">
                        {(m.specialties ?? []).slice(0, 3).map((sp) => (
                          <span key={sp} className="px-2 py-0.5 rounded-lg bg-white/10 text-[10.5px] text-slate-200">
                            {sp}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="text-[11px] text-[#FCF1B7]/90 border-t border-white/10 pt-2.5 flex items-center justify-between">
                      <span>{m.email}</span>
                      <span className="font-mono text-[#34DFAC]">Staff ID {m.emp_code}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-xs font-extrabold uppercase tracking-[0.16em] text-[var(--bw-muted)] mb-3">
              Betterway Dubai Team — Managers, HR, IT &amp; Advisors
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {teamMembers.map((m) => (
                <div
                  key={m.id}
                  className="rounded-2xl overflow-hidden bg-[var(--bw-card)] border border-[var(--bw-line)] flex flex-col"
                >
                  <div className="relative h-64 bg-slate-900 overflow-hidden">
                    <img
                      src={m.portrait_url || m.avatar_url}
                      alt={m.name}
                      className="w-full h-full object-cover object-top"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-4 text-white">
                      <div className="text-base font-extrabold">{m.name}</div>
                      <div className="text-xs text-[#FCF1B7] font-semibold">{m.designation}</div>
                    </div>
                    <div className="absolute top-3 left-3">
                      <StatusPill label={m.department} tone="navy" />
                    </div>
                  </div>
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono font-bold text-[var(--bw-emerald)]">{m.emp_code}</span>
                        <StatusPill label={m.role} tone="slate" />
                      </div>
                      <div className="text-xs text-[var(--bw-muted)]">{m.email}</div>
                      {Number(m.monthly_target_aed) > 0 && (
                        <div className="text-[11px] font-semibold text-[var(--bw-ink)]">
                          Monthly Target: {fmtAed(m.monthly_target_aed, true)}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {(m.specialties ?? []).slice(0, 3).map((sp) => (
                        <span
                          key={sp}
                          className="px-2 py-0.5 rounded-md bg-slate-500/10 text-[10px] font-medium text-[var(--bw-muted)]"
                        >
                          {sp}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'attendance' && (
        <div className="grid lg:grid-cols-3 gap-5">
          {/* Left: Oud Metha Rotating QR + Hikvision Door Test */}
          <div className="space-y-4">
            <div className="rounded-2xl bg-[#025e3d] text-white border border-[#D4AF37]/40 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <QrCode size={16} className="text-[#D4AF37]" />
                  <h2 className="text-sm font-extrabold">Oud Metha Reception QR</h2>
                </div>
                <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-[#34DFAC]/15 text-[#34DFAC] border border-[#34DFAC]/35">
                  Rotates in {countdown}s
                </span>
              </div>
              <div className="bg-white rounded-2xl p-3 flex items-center justify-center">
                {qr?.qrDataUrl ? (
                  <img src={qr.qrDataUrl} alt="Oud Metha Office Rotating QR" className="w-48 h-48" />
                ) : (
                  <div className="w-48 h-48 flex items-center justify-center text-slate-400 text-xs">Loading QR…</div>
                )}
              </div>
              <div className="text-[11px] text-slate-300 space-y-1">
                <div className="flex items-center gap-1.5">
                  <MapPin size={12} className="text-[#D4AF37]" /> Al Nasr Plaza, Plot 319-310, Oud Metha Road, Dubai
                </div>
                <div className="flex items-center gap-1.5">
                  <Wifi size={12} className="text-[#34DFAC]" /> Wi-Fi: {String(qr?.branch?.wifi_ssid || 'Betterway-OudMetha-5G')} · Geofence {String(qr?.branch?.geofence_radius_m || 150)}m
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={doQrCheckIn}
                  className="rounded-xl bg-[#0B664F] text-white py-2.5 text-xs font-bold hover:brightness-110"
                >
                  Scan QR Check-In
                </button>
                <button
                  type="button"
                  onClick={() => void loadQr()}
                  className="rounded-xl bg-white/10 text-white py-2.5 text-xs font-bold inline-flex items-center justify-center gap-1"
                >
                  <RefreshCw size={12} /> Refresh
                </button>
              </div>
            </div>

            <div className="rounded-2xl bg-[var(--bw-card)] border border-[var(--bw-line)] p-4 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-extrabold">Auto Team Group Check-In Active</span>
                <StatusPill label="Oud Metha QR Mode" tone="emerald" />
              </div>
              <p className="text-[11px] text-[var(--bw-muted)] leading-relaxed">
                When staff scan the live 20-second Oud Metha Reception QR, Betterway OS verifies office Wi-Fi/GPS geofence and automatically broadcasts a timestamped Check-In card into <strong>#attendance-checkin</strong>.
              </p>
            </div>
          </div>

          {/* Center & Right: Today's Live Attendance + Mandatory Daily Close */}
          <div className="lg:col-span-2 space-y-5">
            <div className="rounded-2xl bg-[var(--bw-card)] border border-[var(--bw-line)] p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold">Today&apos;s Live Attendance Feed ({qr?.todayDubai})</h3>
                <button
                  type="button"
                  disabled={busy}
                  onClick={doCheckOut}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-300 px-3 py-1.5 text-xs font-bold"
                >
                  <LogOut size={13} /> Shift Check-Out
                </button>
              </div>
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {(qr?.events ?? []).map((ev) => {
                  const u = ev.users as { name?: string; designation?: string; avatar_url?: string } | null;
                  return (
                    <div
                      key={String(ev.id)}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--bw-line)] px-3.5 py-2.5 text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <StaffAvatar name={u?.name || String(ev.emp_code)} avatarUrl={u?.avatar_url} initials={String(ev.emp_code).slice(-2)} size="sm" />
                        <div>
                          <div className="font-bold">{u?.name || String(ev.emp_code)}</div>
                          <div className="text-[11px] text-[var(--bw-muted)]">{String(ev.note || ev.source)}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusPill
                          label={String(ev.event_kind)}
                          tone={String(ev.event_kind) === 'CHECK_IN' ? 'emerald' : String(ev.event_kind) === 'CHECK_OUT' ? 'navy' : 'slate'}
                        />
                        <StatusPill label={String(ev.source)} tone="blue" />
                        <span className="font-mono font-bold text-[11px]">{String(ev.dubai_time_str)}</span>
                      </div>
                    </div>
                  );
                })}
                {(qr?.events.length ?? 0) === 0 && (
                  <div className="py-8 text-center text-xs text-[var(--bw-muted)]">
                    No check-ins recorded yet today. Scan the live 20-second Oud Metha Reception QR to check in.
                  </div>
                )}
              </div>
            </div>

            <form onSubmit={submitDailyClose} className="rounded-2xl bg-[var(--bw-card)] border border-[var(--bw-line)] p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold flex items-center gap-1.5">
                  <ClipboardCheck size={15} className="text-[var(--bw-emerald)]" /> Mandatory Daily Close Report
                </h3>
                <StatusPill label="Required Before Check-Out" tone="gold" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] font-bold uppercase text-[var(--bw-muted)]">Calls Made</label>
                  <input
                    type="number"
                    value={callsMade}
                    onChange={(e) => setCallsMade(e.target.value)}
                    className="w-full rounded-xl border border-[var(--bw-line)] bg-transparent px-3 py-1.5 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-[var(--bw-muted)]">Enquiries Logged</label>
                  <input
                    type="number"
                    value={enquiriesLogged}
                    onChange={(e) => setEnquiriesLogged(e.target.value)}
                    className="w-full rounded-xl border border-[var(--bw-line)] bg-transparent px-3 py-1.5 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-[var(--bw-muted)]">Cases Progressed</label>
                  <input
                    type="number"
                    value={casesProgressed}
                    onChange={(e) => setCasesProgressed(e.target.value)}
                    className="w-full rounded-xl border border-[var(--bw-line)] bg-transparent px-3 py-1.5 text-xs"
                  />
                </div>
              </div>
              <textarea
                rows={2}
                value={summaryToday}
                onChange={(e) => setSummaryToday(e.target.value)}
                placeholder="Today's achievements..."
                className="w-full rounded-xl border border-[var(--bw-line)] bg-transparent p-2.5 text-xs"
                required
              />
              <textarea
                rows={2}
                value={planTomorrow}
                onChange={(e) => setPlanTomorrow(e.target.value)}
                placeholder="Tomorrow's top priorities..."
                className="w-full rounded-xl border border-[var(--bw-line)] bg-transparent p-2.5 text-xs"
                required
              />
              <button disabled={busy} className="rounded-xl bg-[#025e3d] text-white px-4 py-2 text-xs font-bold">
                Submit Daily Close &amp; Unlock Shift Check-Out
              </button>
            </form>
          </div>
        </div>
      )}

      {tab === 'hr' && (
        <div className="space-y-5">
          {hr?.canManageHr && (
            <div className="rounded-2xl bg-[var(--bw-card)] border border-[var(--bw-line)] p-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-sm font-extrabold">UAE MOHRE Wage Protection System (WPS .SIF Export)</div>
                <div className="text-xs text-[var(--bw-muted)]">
                  Generates Central Bank compliant EDR + SCR fixed-format payroll `.SIF` file for corporate bank upload.
                </div>
              </div>
              <a
                href={`/api/v1/hr?wpsPeriod=${new Date().toISOString().slice(0, 7)}`}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#025e3d] text-[#FCF1B7] px-4 py-2.5 text-xs font-bold"
              >
                <Download size={14} /> Download MOHRE WPS .SIF ({new Date().toISOString().slice(0, 7)})
              </a>
            </div>
          )}

          <div className="grid lg:grid-cols-3 gap-5">
            <form onSubmit={submitLeave} className="rounded-2xl bg-[var(--bw-card)] border border-[var(--bw-line)] p-5 space-y-3">
              <h3 className="text-sm font-extrabold">Apply for Leave</h3>
              <select
                value={leaveType}
                onChange={(e) => setLeaveType(e.target.value)}
                className="w-full rounded-xl border border-[var(--bw-line)] bg-[var(--bw-card)] px-3 py-2 text-xs"
              >
                <option value="Annual Leave">Annual Leave (UAE 30-day statutory)</option>
                <option value="Sick Leave">Sick Leave</option>
                <option value="Emergency Leave">Emergency Leave</option>
              </select>
              <div className="grid grid-cols-2 gap-2">
                <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="rounded-xl border border-[var(--bw-line)] bg-transparent px-2.5 py-2 text-xs" />
                <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="rounded-xl border border-[var(--bw-line)] bg-transparent px-2.5 py-2 text-xs" />
              </div>
              <input type="number" value={days} onChange={(e) => setDays(e.target.value)} placeholder="Days" className="w-full rounded-xl border border-[var(--bw-line)] bg-transparent px-3 py-2 text-xs" />
              <input value={leaveReason} onChange={(e) => setLeaveReason(e.target.value)} placeholder="Reason" className="w-full rounded-xl border border-[var(--bw-line)] bg-transparent px-3 py-2 text-xs" />
              <button disabled={busy} className="w-full rounded-xl bg-[#025e3d] text-white py-2 text-xs font-bold">
                Submit Leave Request
              </button>
            </form>

            <div className="lg:col-span-2 rounded-2xl bg-[var(--bw-card)] border border-[var(--bw-line)] p-5 overflow-x-auto space-y-4">
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
                        <td className="py-2 pr-3">
                          <StatusPill
                            label={String(lv.status)}
                            tone={String(lv.status) === 'Approved' ? 'emerald' : String(lv.status) === 'Rejected' ? 'red' : 'gold'}
                          />
                        </td>
                        <td className="py-2">
                          {(user?.role === 'OWNER' || user?.role === 'HR_MANAGER') && String(lv.status) === 'Pending' && (
                            <div className="flex gap-1.5">
                              <button
                                type="button"
                                onClick={() => void decideLeave(String(lv.id), 'Approved')}
                                className="px-2 py-0.5 rounded-lg bg-emerald-600 text-white text-[10px] font-bold"
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                onClick={() => void decideLeave(String(lv.id), 'Rejected')}
                                className="px-2 py-0.5 rounded-lg bg-red-600 text-white text-[10px] font-bold"
                              >
                                Reject
                              </button>
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
        </div>
      )}
    </div>
  );
}
