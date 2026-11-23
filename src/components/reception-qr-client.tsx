'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, Eye, EyeOff, Lock, Mail, Printer, QrCode, Wifi, WifiOff } from 'lucide-react';
import { StaffAvatar } from '@/components/staff-avatar';
import { OFFICIAL_STAFF_DIRECTORY } from '@/lib/staff-directory';

interface CheckInResponse {
  ok: boolean;
  referenceNo: string;
  checkInDate: string;
  checkInTimeGst: string;
  shiftName: string;
  isLate: boolean;
  lateMinutes: number;
  status: string;
  employee: {
    userId: number;
    email: string;
    fullNameEn: string;
    role: string;
    designation: string;
    department: string;
    avatarUrl: string | null;
  };
}

export function ReceptionQrScanWidget({
  defaultEmail,
  defaultName,
  standCode = 'BW-RECEPTION-STAND-DXB-1',
}: {
  defaultEmail: string;
  defaultName: string;
  standCode?: string;
}) {
  const [email, setEmail] = useState(defaultEmail);
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [connectionType, setConnectionType] = useState<'wifi' | 'cellular'>('wifi');
  const [ssid, setSsid] = useState('Betterway-Office-5G');
  const [detectedIp, setDetectedIp] = useState<string>('');
  const [strictIpLock, setStrictIpLock] = useState<boolean>(false);
  const [ipMatches, setIpMatches] = useState<boolean>(true);
  const [deviceId, setDeviceId] = useState('BW-WEB-BROWSER');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CheckInResponse | null>(null);

  useEffect(() => {
    try {
      const key = 'bw.browser.device_id';
      let id = localStorage.getItem(key) || '';
      if (!id) {
        id = `BW-WEB-${Math.random().toString(36).slice(2, 9).toUpperCase()}`;
        localStorage.setItem(key, id);
      }
      setDeviceId(id);
    } catch {
      /* ignore */
    }

    const navConn = (navigator as any)?.connection || (navigator as any)?.mozConnection || (navigator as any)?.webkitConnection;
    const raw = String(navConn?.type || navConn?.effectiveType || 'wifi').toLowerCase();
    if (raw.includes('cellular') || raw === '3g' || raw === '2g') {
      setConnectionType('cellular');
    }

    fetch('/api/v1/reception-qr/checkin')
      .then((r) => r.json())
      .then((d) => {
        if (d.ssid) setSsid(String(d.ssid));
        if (d.detected_client_ip) setDetectedIp(String(d.detected_client_ip));
        setStrictIpLock(Boolean(d.strict_ip));
        setIpMatches(d.ip_matches_office !== false);
      })
      .catch(() => {
        /* ignore */
      });
  }, []);

  const networkApproved = connectionType === 'wifi' && (!strictIpLock || ipMatches);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!networkApproved) {
      setError('Cellular data check-in is blocked. Please connect your phone to Betterway-Office-5G Wi-Fi.');
      return;
    }
    setBusy(true);
    try {
      const r = await fetch('/api/v1/reception-qr/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          connectionType,
          networkSsid: ssid,
          qrStandCode: standCode,
          deviceId,
        }),
      });
      const data = await r.json();
      if (!r.ok || !data.ok) {
        setError(data.error || 'Check-in verification failed.');
      } else {
        setResult(data as CheckInResponse);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error during QR check-in.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl bg-[#021125] text-white border border-[#d7b04e]/40 p-5 shadow-xl space-y-4">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3.5">
        <div className="flex items-center gap-2.5">
          <img src="/brand/icon-gold-squircle-midnight.svg" alt="Betterway" className="w-9 h-9 rounded-lg border border-[#d7b04e]/40" />
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-[#d7b04e]">
              SWK-Grade Camera QR Check-In
            </div>
            <h2 className="text-base font-bold text-white">
              {result ? 'Attendance Confirmed' : 'Office Reception Sign-In'}
            </h2>
          </div>
        </div>
        <StaffAvatar name={result?.employee.fullNameEn || defaultName} email={email} size={38} />
      </div>

      {result ? (
        <div className="space-y-4 py-1 text-center">
          <div className="w-14 h-14 rounded-full bg-emerald-500/20 border-2 border-emerald-400 text-emerald-300 flex items-center justify-center mx-auto">
            <CheckCircle2 size={30} />
          </div>
          <div className="flex flex-col items-center gap-1">
            <StaffAvatar
              name={result.employee.fullNameEn}
              email={result.employee.email}
              avatarUrl={result.employee.avatarUrl}
              size={56}
            />
            <div className="text-base font-bold text-emerald-300 mt-1">Checked In Successfully</div>
            <div className="text-sm font-semibold text-white">{result.employee.fullNameEn}</div>
            <div className="text-xs text-slate-300">{result.employee.designation}</div>
          </div>

          <div className="rounded-xl bg-[#041933] border border-white/10 p-3.5 text-xs space-y-2 text-left">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Arrival Time (GST)</span>
              <span className="font-mono font-bold text-white">
                {result.checkInDate} · {result.checkInTimeGst} GST
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Punctuality Status</span>
              <span className={`font-bold ${result.isLate ? 'text-amber-300' : 'text-emerald-300'}`}>
                {result.isLate ? `LATE (+${result.lateMinutes} mins)` : 'ON TIME (≤10:05 AM) ✓'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Verified Office Wi-Fi</span>
              <span className="font-semibold text-emerald-300">{ssid}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Reference</span>
              <span className="font-mono text-[#d7b04e] font-bold">{result.referenceNo}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setResult(null);
              window.location.reload();
            }}
            className="w-full py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-white cursor-pointer"
          >
            Refresh Attendance Log
          </button>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-3 text-xs">
          <div
            className={`px-3 py-2.5 rounded-xl border flex items-center justify-between gap-2 ${
              networkApproved
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
                : 'bg-rose-950/60 border-rose-500/50 text-rose-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {networkApproved ? (
                <Wifi size={15} className="text-emerald-400 shrink-0" />
              ) : (
                <WifiOff size={15} className="text-rose-400 shrink-0" />
              )}
              <span>
                {networkApproved
                  ? `Connected to ${ssid}${strictIpLock ? ` · IP Locked (${detectedIp || 'verified'})` : ' (Office Wi-Fi Verified)'}`
                  : strictIpLock && !ipMatches
                    ? `Office Wi-Fi IP Lock Mismatch (${detectedIp}) — Connect to ${ssid}`
                    : 'Cellular Data Detected — Blocked by Anti-Loophole Rule'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setConnectionType((c) => (c === 'wifi' ? 'cellular' : 'wifi'))}
              className="text-[10px] underline text-[#d7b04e] shrink-0 cursor-pointer"
            >
              {networkApproved ? 'Test Cellular Block' : 'Switch to Wi-Fi'}
            </button>
          </div>

          {error && (
            <div className="p-2.5 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-200 text-xs">
              {error}
            </div>
          )}

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Staff Member Email
            </label>
            <select
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl bg-[#041933] border border-white/15 px-3 py-2.5 text-white text-xs outline-none focus:border-[#d7b04e]"
            >
              {OFFICIAL_STAFF_DIRECTORY.map((s) => (
                <option key={s.email} value={s.email}>
                  {s.fullNameEn} — {s.designation} ({s.email})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Password
            </label>
            <div className="relative flex items-center">
              <Lock size={14} className="absolute left-3 text-slate-400" />
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter your staff password"
                className="w-full rounded-xl bg-[#041933] border border-white/15 pl-9 pr-9 py-2.5 text-white text-xs outline-none focus:border-[#d7b04e]"
              />
              <button
                type="button"
                onClick={() => setShowPass((s) => !s)}
                className="absolute right-3 text-slate-400 hover:text-white cursor-pointer"
              >
                {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10.5px] text-slate-400 mb-1">Office Wi-Fi SSID</label>
              <input
                type="text"
                value={ssid}
                onChange={(e) => setSsid(e.target.value)}
                className="w-full rounded-lg bg-[#041933] border border-white/15 px-2.5 py-1.5 text-white text-[11px]"
              />
            </div>
            <div>
              <label className="block text-[10.5px] text-slate-400 mb-1">Device Fingerprint</label>
              <input
                type="text"
                value={deviceId}
                readOnly
                className="w-full rounded-lg bg-[#041933]/60 border border-white/10 px-2.5 py-1.5 text-slate-300 font-mono text-[11px]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={busy}
            className="w-full py-2.5 rounded-xl bg-[#d7b04e] hover:bg-[#f2dcb3] text-[#021125] font-bold text-xs transition cursor-pointer flex items-center justify-center gap-2"
          >
            <QrCode size={15} />
            <span>{busy ? 'Verifying Wi-Fi & Recording Check-In…' : 'Verify Office Wi-Fi & Check In Now'}</span>
          </button>
        </form>
      )}
    </div>
  );
}

export function PrintQrStandButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="px-5 py-2.5 rounded-xl bg-[#021125] text-[#d7b04e] font-bold text-xs border border-[#d7b04e]/50 cursor-pointer inline-flex items-center gap-2 hover:bg-[#072244]"
    >
      <Printer size={15} />
      <span>Print Reception QR Stand</span>
    </button>
  );
}
