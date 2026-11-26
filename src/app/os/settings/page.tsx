'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, Fingerprint, Globe, Lock, MapPin, Shield, Terminal, Wifi } from 'lucide-react';
import { PageHeader, StatusPill } from '@/components/os/UiKit';

interface SettingsPayload {
  branch: Record<string, unknown> | null;
  settings: Record<string, unknown>;
  websiteUrl: string;
  hikvisionWebhookUrl: string;
  canEditSecurity: boolean;
}

export default function SettingsPage() {
  const [data, setData] = useState<SettingsPayload | null>(null);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const [wifiSsid, setWifiSsid] = useState('Betterway-OudMetha-5G');
  const [ipCidr, setIpCidr] = useState('127.0.0.1/32,10.0.0.0/8,192.168.0.0/16');
  const [geoRadius, setGeoRadius] = useState('150');
  const [wifiLock, setWifiLock] = useState(true);
  const [geoLock, setGeoLock] = useState(true);
  const [hikSerial, setHikSerial] = useState('DS-K1T342MFX-OUDMETHA');
  const [hikIp, setHikIp] = useState('192.168.1.201');
  const [hikMode, setHikMode] = useState<'SINGLE_ENTRY_READER' | 'DUAL_READER'>('SINGLE_ENTRY_READER');
  const [shiftStart, setShiftStart] = useState('09:00');
  const [graceMin, setGraceMin] = useState('15');

  const load = useCallback(async () => {
    const r = await fetch('/api/v1/settings', { cache: 'no-store' });
    if (!r.ok) return;
    const j = (await r.json()) as SettingsPayload;
    setData(j);
    if (j.branch) {
      setWifiSsid(String(j.branch.wifi_ssid || 'Betterway-OudMetha-5G'));
      setIpCidr(String(j.branch.office_ip_cidr || ''));
      setGeoRadius(String(j.branch.geofence_radius_m || 150));
      setWifiLock(Boolean(j.branch.wifi_lock_enabled));
      setGeoLock(Boolean(j.branch.geofence_lock_enabled));
      setHikSerial(String(j.branch.hikvision_device_serial || 'DS-K1T342MFX-OUDMETHA'));
      setHikIp(String(j.branch.hikvision_local_ip || '192.168.1.201'));
      setHikMode((j.branch.hikvision_reader_mode as 'SINGLE_ENTRY_READER' | 'DUAL_READER') || 'SINGLE_ENTRY_READER');
      setShiftStart(String(j.branch.shift_start_gst || '09:00'));
      setGraceMin(String(j.branch.grace_minutes ?? 15));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function saveSecurity(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const r = await fetch('/api/v1/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branch: {
            wifi_ssid: wifiSsid,
            office_ip_cidr: ipCidr,
            geofence_radius_m: Number(geoRadius),
            wifi_lock_enabled: wifiLock,
            geofence_lock_enabled: geoLock,
            hikvision_device_serial: hikSerial,
            hikvision_local_ip: hikIp,
            hikvision_reader_mode: hikMode,
            shift_start_gst: shiftStart,
            grace_minutes: Number(graceMin),
          },
        }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Settings save failed');
      setNotice('Oud Metha Office Wi-Fi, GPS Geofence & Hikvision Door settings saved cleanly.');
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Owner-Locked Security · Al Nasr Plaza Oud Metha · Hikvision ISAPI · Website Sync"
        title="Settings &"
        accent="Office Hardware"
        subtitle="Configure Oud Metha office Wi-Fi CIDR, GPS geofence lock, Hikvision door fingerprint terminal mode (Single Entry vs Dual Reader), and live BetterwayMortgages.com two-way webhook connectivity."
      />

      {error && <div className="rounded-xl border border-red-400/40 bg-red-50 p-3 text-xs font-semibold text-red-700">{error}</div>}
      {notice && (
        <div className="rounded-xl border border-emerald-500/35 bg-emerald-50 dark:bg-emerald-950/30 p-3 text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
          <CheckCircle2 size={14} /> {notice}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-5">
        <form onSubmit={saveSecurity} className="lg:col-span-2 rounded-2xl bg-[var(--bw-card)] border border-[var(--bw-line)] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold flex items-center gap-1.5">
              <MapPin size={15} className="text-[var(--bw-emerald)]" /> Oud Metha HQ — Al Nasr Plaza (Plot 319-310)
            </h2>
            <StatusPill label={data?.canEditSecurity ? 'Owner Write Enabled' : 'Read-Only (Owner Required)'} tone={data?.canEditSecurity ? 'emerald' : 'gold'} />
          </div>

          <div className="grid sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-[10.5px] font-bold uppercase text-[var(--bw-muted)] mb-1">
                <Wifi size={11} className="inline mr-1" /> Office Wi-Fi SSID
              </label>
              <input
                disabled={!data?.canEditSecurity}
                value={wifiSsid}
                onChange={(e) => setWifiSsid(e.target.value)}
                className="w-full rounded-xl border border-[var(--bw-line)] bg-transparent px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-[10.5px] font-bold uppercase text-[var(--bw-muted)] mb-1">
                Allowed Office IP / CIDR List
              </label>
              <input
                disabled={!data?.canEditSecurity}
                value={ipCidr}
                onChange={(e) => setIpCidr(e.target.value)}
                className="w-full rounded-xl border border-[var(--bw-line)] bg-transparent px-3 py-2 font-mono"
              />
            </div>
            <div>
              <label className="block text-[10.5px] font-bold uppercase text-[var(--bw-muted)] mb-1">
                GPS Geofence Radius (meters around 25.2397, 55.3119)
              </label>
              <input
                disabled={!data?.canEditSecurity}
                type="number"
                value={geoRadius}
                onChange={(e) => setGeoRadius(e.target.value)}
                className="w-full rounded-xl border border-[var(--bw-line)] bg-transparent px-3 py-2 font-mono"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10.5px] font-bold uppercase text-[var(--bw-muted)] mb-1">Shift Start (GST)</label>
                <input
                  disabled={!data?.canEditSecurity}
                  value={shiftStart}
                  onChange={(e) => setShiftStart(e.target.value)}
                  className="w-full rounded-xl border border-[var(--bw-line)] bg-transparent px-3 py-2 font-mono"
                />
              </div>
              <div>
                <label className="block text-[10.5px] font-bold uppercase text-[var(--bw-muted)] mb-1">Grace (Min)</label>
                <input
                  disabled={!data?.canEditSecurity}
                  type="number"
                  value={graceMin}
                  onChange={(e) => setGraceMin(e.target.value)}
                  className="w-full rounded-xl border border-[var(--bw-line)] bg-transparent px-3 py-2 font-mono"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 text-xs">
            <label className="flex items-center gap-2">
              <input disabled={!data?.canEditSecurity} type="checkbox" checked={wifiLock} onChange={(e) => setWifiLock(e.target.checked)} />
              Enforce Oud Metha Office Wi-Fi IP Lock
            </label>
            <label className="flex items-center gap-2">
              <input disabled={!data?.canEditSecurity} type="checkbox" checked={geoLock} onChange={(e) => setGeoLock(e.target.checked)} />
              Enforce GPS Geofence Lock
            </label>
          </div>

          <div className="border-t border-[var(--bw-line)] pt-4 space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5">
              <Fingerprint size={14} className="text-[var(--bw-emerald)]" /> Hikvision Office Door Fingerprint Terminal
            </h3>
            <div className="grid sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-[10.5px] font-bold uppercase text-[var(--bw-muted)] mb-1">Device Serial</label>
                <input
                  disabled={!data?.canEditSecurity}
                  value={hikSerial}
                  onChange={(e) => setHikSerial(e.target.value)}
                  className="w-full rounded-xl border border-[var(--bw-line)] bg-transparent px-3 py-2 font-mono"
                />
              </div>
              <div>
                <label className="block text-[10.5px] font-bold uppercase text-[var(--bw-muted)] mb-1">Office LAN IP</label>
                <input
                  disabled={!data?.canEditSecurity}
                  value={hikIp}
                  onChange={(e) => setHikIp(e.target.value)}
                  className="w-full rounded-xl border border-[var(--bw-line)] bg-transparent px-3 py-2 font-mono"
                />
              </div>
              <div>
                <label className="block text-[10.5px] font-bold uppercase text-[var(--bw-muted)] mb-1">Door Reader Topology</label>
                <select
                  disabled={!data?.canEditSecurity}
                  value={hikMode}
                  onChange={(e) => setHikMode(e.target.value as 'SINGLE_ENTRY_READER' | 'DUAL_READER')}
                  className="w-full rounded-xl border border-[var(--bw-line)] bg-[var(--bw-card)] px-3 py-2"
                >
                  <option value="SINGLE_ENTRY_READER">SINGLE_ENTRY_READER (1st Unlock = IN · Zero False Out)</option>
                  <option value="DUAL_READER">DUAL_READER (Entry + Exit Fingerprint Readers)</option>
                </select>
              </div>
            </div>
          </div>

          {data?.canEditSecurity ? (
            <button disabled={busy} className="rounded-xl bg-[#083B2E] text-white px-5 py-2.5 text-xs font-bold">
              {busy ? 'Saving…' : 'Save Owner Security Configuration'}
            </button>
          ) : (
            <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-3 text-xs flex items-center gap-2">
              <Lock size={14} className="text-amber-600" /> Only Owners (Warda Kapadia or Shabib Siraj) can modify geofence, Wi-Fi, or Hikvision security settings.
            </div>
          )}
        </form>

        <div className="space-y-4">
          <div className="rounded-2xl bg-[#0A1128] text-white border border-[#D4AF37]/35 p-5 space-y-3">
            <h3 className="text-sm font-extrabold flex items-center gap-1.5 text-[#FCF1B7]">
              <Terminal size={15} /> Hikvision LAN Relay Agent
            </h3>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Run this lightweight Node.js agent on the Oud Metha reception PC to stream real-time door fingerprint unlocks via HMAC-SHA256 straight to Betterway OS:
            </p>
            <pre className="rounded-xl bg-black/50 p-3 text-[10.5px] font-mono text-[#34DFAC] overflow-x-auto">
{`HIK_HOST=${hikIp} \\
HIK_USER=admin HIK_PASS=<pass> \\
BW_OS_WEBHOOK=${data?.hikvisionWebhookUrl || 'https://betterwayos.vercel.app/api/v1/attendance/hikvision'} \\
BW_HIKVISION_HMAC_SECRET=<secret> \\
node tools/hikvision-relay/index.mjs`}
            </pre>
          </div>

          <div className="rounded-2xl bg-[var(--bw-card)] border border-[var(--bw-line)] p-5 space-y-2.5 text-xs">
            <h3 className="text-sm font-extrabold flex items-center gap-1.5">
              <Globe size={15} className="text-[var(--bw-emerald)]" /> Website &amp; OS Two-Way Sync
            </h3>
            <div>
              <span className="text-[var(--bw-muted)]">Connected Public Website:</span>{' '}
              <strong className="font-mono">{data?.websiteUrl}</strong>
            </div>
            <div>
              <span className="text-[var(--bw-muted)]">Live CMS Feed:</span>{' '}
              <code className="text-[11px] text-[var(--bw-emerald)]">/api/v1/public/cms</code>
            </div>
            <div>
              <span className="text-[var(--bw-muted)]">Website Lead Intake Webhook:</span>{' '}
              <code className="text-[11px] text-[var(--bw-emerald)]">/api/v1/intake/leads</code>
            </div>
            <div className="pt-2 border-t border-[var(--bw-line)] flex items-center gap-1.5 text-[11px] text-emerald-700 dark:text-emerald-300 font-semibold">
              <Shield size={13} /> Zero SWK Public Branding Guard Enforced
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
