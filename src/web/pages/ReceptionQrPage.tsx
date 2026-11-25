import React, { useEffect, useState } from 'react';
import { CheckCircle2, ClipboardCheck, Lock, LogIn, LogOut, QrCode, Wifi } from 'lucide-react';
import { apiFetch } from '../lib/api';
import { useAuth } from '../lib/auth-context';
import { PageHeader, StatusPill } from '../components/UiPrimitives';

export function ReceptionQrPage() {
  const { user, toast } = useAuth();
  const [qr, setQr] = useState<any>(null);
  const [live, setLive] = useState<{ events: any[]; reports: any[] }>({ events: [], reports: [] });
  const [summaryToday, setSummaryToday] = useState('');
  const [planTomorrow, setPlanTomorrow] = useState('');
  const [callsMade, setCallsMade] = useState(14);
  const [casesSubmitted, setCasesSubmitted] = useState(2);

  const loadQr = async () => {
    try {
      const d = await apiFetch('/api/attendance/qr-terminal');
      setQr(d);
    } catch {
      /* ignore */
    }
  };

  const loadLive = async () => {
    try {
      const d = await apiFetch<{ events: any[]; reports: any[] }>('/api/attendance/live');
      setLive(d);
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    void loadQr();
    void loadLive();
    const id = setInterval(() => void loadQr(), 5000);
    return () => clearInterval(id);
  }, []);

  const handleCheckIn = async () => {
    try {
      const res = await apiFetch<any>('/api/attendance/checkin', {
        method: 'POST',
        body: JSON.stringify({ qrToken: qr?.code, mode: 'OFFICE_QR', note: 'Al Nasr Plaza Live QR Check-In' }),
      });
      toast(`Checked in at ${res.dubaiTime} GST (Late: ${res.lateMinutes}m)`);
      await loadLive();
    } catch (e: any) {
      toast(e.message, 'err');
    }
  };

  const handleCheckOut = async () => {
    try {
      const res = await apiFetch<any>('/api/attendance/checkout', { method: 'POST' });
      toast(`Shift checked out cleanly at ${res.dubaiTime} GST`);
      await loadLive();
    } catch (e: any) {
      toast(e.message, 'err');
    }
  };

  const handleDailyClose = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/api/daily/report', {
        method: 'POST',
        body: JSON.stringify({
          summary_today: summaryToday,
          plan_tomorrow: planTomorrow,
          calls_made: callsMade,
          cases_submitted: casesSubmitted,
        }),
      });
      toast('Mandatory Daily Close Report submitted — Owner alerted & check-out unlocked!');
      setSummaryToday('');
      setPlanTomorrow('');
      await loadLive();
    } catch (err: any) {
      toast(err.message, 'err');
    }
  };

  const toggleWifiLock = async () => {
    if (!qr) return;
    try {
      const res = await apiFetch<any>('/api/attendance/wifi-lock', {
        method: 'POST',
        body: JSON.stringify({ locked: !qr.officeWifiLocked }),
      });
      toast(`Office Wi-Fi Lock ${res.locked ? 'ENABLED' : 'UNLOCKED'}`);
      await loadQr();
    } catch (err: any) {
      toast(err.message, 'err');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="SWK OS v3.8.0 Attendance Parity · Al Nasr Plaza, Oud Metha"
        title="Reception QR Attendance &"
        accent="Mandatory Daily Close"
        subtitle="20-second rotating cryptographic HMAC reception QR, Admin Office Wi-Fi lock, Dubai GST shift tracking (Mon–Fri 09:00–19:00, Sat 10:00–16:00), and mandatory end-of-day report before check-out."
      />

      <div className="grid lg:grid-cols-12 gap-6">
        {/* Live 20s Rotating QR Terminal */}
        <div className="lg:col-span-5 bw-card p-6 bg-[#070E1A] text-white border-[#D7B158]/40 flex flex-col items-center text-center">
          <img src="/brand/betterway-logo-horizontal-dark-bg.svg" alt="Betterway" className="h-9 mb-3" />
          <div className="text-[11px] uppercase tracking-[0.22em] text-[#34DFAC] font-bold">
            Live 20-Second Rotating Reception QR
          </div>
          <div className="text-xs text-slate-300 mt-1">{qr?.officeAddress || 'Al Nasr Plaza, Oud Metha, Dubai'}</div>

          {qr?.qrDataUrl && (
            <div className="my-5 p-3.5 rounded-3xl bg-white shadow-2xl border-4 border-[#D7B158]/60">
              <img src={qr.qrDataUrl} alt="Rotating Betterway Reception QR" className="size-56" />
            </div>
          )}

          <div className="font-mono-num text-xs text-[#FCF1B7] bg-white/10 px-3.5 py-1.5 rounded-full">
            Token: {qr?.code || 'Loading…'} · Rotates in {qr?.expiresInSec ?? 20}s
          </div>

          <div className="mt-4 w-full p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between text-xs">
            <span className="flex items-center gap-2 text-slate-300">
              <Wifi size={14} className="text-[#34DFAC]" /> {qr?.officeWifiSsid || 'Betterway-AlNasrPlaza-5G'}
            </span>
            <button
              type="button"
              onClick={() => void toggleWifiLock()}
              disabled={!user?.can_lock_wifi}
              className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/10 hover:bg-white/20 disabled:opacity-50 cursor-pointer flex items-center gap-1"
            >
              <Lock size={11} /> {qr?.officeWifiLocked ? 'Wi-Fi Locked' : 'Unlocked'}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2.5 w-full mt-4">
            <button
              type="button"
              onClick={() => void handleCheckIn()}
              className="h-11 rounded-full bg-gradient-to-r from-[#34DFAC] to-[#179373] text-[#070E1A] font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <LogIn size={15} /> Scan &amp; Check In
            </button>
            <button
              type="button"
              onClick={() => void handleCheckOut()}
              className="h-11 rounded-full bg-white/10 border border-white/20 text-white font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-white/15 cursor-pointer"
            >
              <LogOut size={15} /> Check Out
            </button>
          </div>
        </div>

        {/* Mandatory Daily Close Form & Live Attendance Feed */}
        <div className="lg:col-span-7 space-y-5">
          <form onSubmit={handleDailyClose} className="bw-card p-5 space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <ClipboardCheck size={16} className="text-[#179373]" /> Mandatory Daily Close Report (Unlocks Check-Out)
              </h3>
              <StatusPill label="Min 30 chars each" tone="gold" />
            </div>
            <div className="grid sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-bold mb-1">Calls Completed Today</label>
                <input type="number" value={callsMade} onChange={(e) => setCallsMade(Number(e.target.value))} className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-card)] font-mono-num" />
              </div>
              <div>
                <label className="block font-bold mb-1">Bank Submissions / Quotes</label>
                <input type="number" value={casesSubmitted} onChange={(e) => setCasesSubmitted(Number(e.target.value))} className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-card)] font-mono-num" />
              </div>
            </div>
            <div className="text-xs">
              <label className="block font-bold mb-1">Today&apos;s Mortgage Progress Summary ({summaryToday.length}/30 min)</label>
              <textarea
                rows={2}
                required
                value={summaryToday}
                onChange={(e) => setSummaryToday(e.target.value)}
                placeholder="Summarize DIPs secured, bank follow-ups, valuations ordered, and SWK Relay conversions…"
                className="w-full p-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-card)]"
              />
            </div>
            <div className="text-xs">
              <label className="block font-bold mb-1">Tomorrow&apos;s Priority Action Plan ({planTomorrow.length}/30 min)</label>
              <textarea
                rows={2}
                required
                value={planTomorrow}
                onChange={(e) => setPlanTomorrow(e.target.value)}
                placeholder="List tomorrow's scheduled borrower callbacks, FOL signatures, and DLD Trustee slots…"
                className="w-full p-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-card)]"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-full bg-gradient-to-r from-[#179373] to-[#0A4A3E] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 size={14} /> Submit Daily Close &amp; Alert Owner
            </button>
          </form>

          {/* Live Gate Events */}
          <div className="bw-card p-5 space-y-2.5">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <QrCode size={16} className="text-[#BA8D36]" /> Live Al Nasr Plaza Gate Log (Dubai GST)
            </h3>
            <div className="divide-y divide-[var(--bw-line)] max-h-60 overflow-y-auto text-xs">
              {live.events.map((ev) => (
                <div key={ev.id} className="py-2.5 flex items-center justify-between gap-2">
                  <div>
                    <b>{ev.user_name}</b> · <span className="text-[var(--bw-muted)]">{ev.note}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 font-mono-num">
                    <StatusPill label={ev.event_type} tone={ev.event_type === 'CHECK_IN' ? 'emerald' : 'navy'} />
                    <span>{ev.dubai_time}</span>
                    {ev.late_minutes > 0 && <StatusPill label={`+${ev.late_minutes}m late`} tone="red" />}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
