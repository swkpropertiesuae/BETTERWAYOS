import Link from 'next/link';
import { getDb } from '@/server/db';
import { requireStaffUser } from '@/server/auth/request';
import { OsBanner } from '@/components/os-banner';
import { StaffAvatar } from '@/components/staff-avatar';
import { PrintQrStandButton, ReceptionQrScanWidget } from '@/components/reception-qr-client';
import {
  canPrintReceptionQr,
  generateReceptionStandQrSvg,
  getOfficeWifiConfig,
} from '@/server/engines/swk-enterprise-engine';

export const dynamic = 'force-dynamic';

const OFFICE_RECEPTION_QR_TOKEN = 'BW-RECEPTION-STAND-DXB-1';

export default async function ReceptionQrPage({
  searchParams,
}: {
  searchParams: Promise<{ print?: string; scan?: string; stand?: string; notice?: string; error?: string }>;
}) {
  const user = await requireStaffUser();
  const sp = await searchParams;
  const wantsPoster = sp.print === '1';
  const allowedToPrint = canPrintReceptionQr(user);

  const scanUrl = `https://os.betterwaymortgages.com/os/reception-qr?scan=1&stand=${OFFICE_RECEPTION_QR_TOKEN}`;
  const qrSvg = generateReceptionStandQrSvg(scanUrl, '#021125', '#ffffff');
  const qrDataUri = `data:image/svg+xml;utf8,${encodeURIComponent(qrSvg)}`;

  const db = getDb();
  const wifiCfg = getOfficeWifiConfig(db);
  const canOverrideTime = user.role === 'SUPER_ADMIN' || user.role === 'HR_MANAGER';
  const attendanceLogs = db
    .prepare('SELECT * FROM office_attendance_logs ORDER BY id DESC LIMIT 25')
    .all() as Array<Record<string, unknown>>;

  const contemptorAlerts = db
    .prepare('SELECT * FROM late_contemptor_alerts ORDER BY id DESC LIMIT 10')
    .all() as Array<Record<string, unknown>>;

  return (
    <div className="space-y-6">
      <OsBanner notice={sp.notice} error={sp.error} />

      {/* Header Banner */}
      <div className="rounded-2xl bg-white text-gray-900 p-6 border border-gray-200 shadow-xs flex flex-wrap items-center justify-between gap-4 print:hidden">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#8a6518]">
            Step 10 · SWK-Grade Office Attendance &amp; Anti-Loophole QR Verification
          </div>
          <h1 className="font-display text-2xl md:text-3xl font-bold mt-1 text-[#021125]">
            Office Reception QR Attendance &amp; Working Hours
          </h1>
          <p className="text-xs text-gray-600 mt-1 max-w-2xl">
            Mon–Fri <code>10:00 AM – 7:00 PM</code> · Sat <code>10:00 AM – 4:00 PM</code> · Sun Holiday. Grace window
            until <code>10:05 AM GST</code>. Three or more late arrivals in 7 days automatically alert Supreme Owner{' '}
            <strong>Shabib Siraj</strong>, Executive Director <strong>Warda</strong>, and Team Manager{' '}
            <strong>Daniel Xavier</strong>.
          </p>
        </div>

        {/* HARD RULE: Only Owner Shabib Siraj, Warda, Admin, or Team Manager Daniel Xavier can open Print QR Poster */}
        {allowedToPrint ? (
          <Link
            href={wantsPoster ? '/os/reception-qr' : '/os/reception-qr?print=1'}
            className="px-4 py-2.5 rounded-xl bg-[#021125] hover:bg-[#072244] text-[#d7b04e] border border-[#d7b04e]/40 text-xs font-bold transition"
          >
            {wantsPoster ? 'Close Printable QR Stand' : 'Print Reception QR Stand (Owner / Manager Only)'}
          </Link>
        ) : (
          <span className="px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-[11px] text-gray-600">
            QR Stand Printing Restricted to Owner (Shabib Siraj / Warda) &amp; Team Manager (Daniel Xavier)
          </span>
        )}
      </div>

      {/* Printable Reception Stand QR Poster (Matches SWK ReceptionQrPage ?print=1) */}
      {wantsPoster && allowedToPrint && (
        <div className="w-full max-w-md bg-white text-[#021125] rounded-3xl p-8 shadow-2xl border-4 border-[#d7b04e] text-center space-y-5 mx-auto">
          <div
            className="flex flex-col items-center justify-center gap-2 rounded-2xl px-5 py-4 mx-auto"
            style={{
              background: 'linear-gradient(135deg, #021125 0%, #072244 100%)',
              border: '1px solid rgba(215, 176, 78, 0.55)',
            }}
          >
            <img src="/brand/logo-white.svg" alt="Betterway Mortgages LLC" className="h-11 w-auto object-contain" />
            <div className="text-[10px] uppercase tracking-[0.2em] text-[#d7b04e] font-bold">
              Betterway Mortgages LLC · Office Attendance QR
            </div>
          </div>

          <div className="p-4 bg-white rounded-2xl border-2 border-[#e2e6ea] inline-block mx-auto">
            <img
              src={qrDataUri}
              alt="Betterway Mortgages LLC Office Attendance QR Code"
              className="w-64 h-64 mx-auto block"
            />
          </div>

          <div className="space-y-1.5">
            <h2 className="font-display font-bold text-xl text-[#021125]">Scan to Sign In &amp; Check In</h2>
            <p className="text-xs text-[#4a5868] leading-relaxed">
              1. Connect your phone to <b>Betterway-Office-5G</b> Office Wi-Fi.
              <br />
              2. Scan this QR code with your phone camera before <b>10:05 AM GST</b>.
              <br />
              3. Sign in with your Betterway email &amp; password.
            </p>
            <div className="pt-1 text-[11px] font-bold text-[#021125]">
              Betterway Mortgages LLC · Al Nasr Plaza, Oud Metha, Dubai
            </div>
            <div className="text-[10px] font-semibold text-[#8a6518]">
              Authorized by Shabib Siraj, Warda &amp; Daniel Xavier
            </div>
          </div>

          <div className="pt-2 flex items-center justify-center gap-3 print:hidden">
            <PrintQrStandButton />
            <Link
              href="/os/reception-qr"
              className="px-4 py-2.5 rounded-xl bg-slate-100 text-[#021125] font-semibold text-xs border border-slate-300"
            >
              Scan &amp; Check-In View
            </Link>
          </div>
          <div className="text-[10px] font-mono text-slate-400 break-all">{scanUrl}</div>
        </div>
      )}

      {/* Working Hours, Live Camera Scan Check-In & Attendance Roll Call */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:hidden">
        <div className="space-y-4">
          <ReceptionQrScanWidget
            defaultEmail={user.email}
            defaultName={user.full_name_en}
            standCode={sp.stand || OFFICE_RECEPTION_QR_TOKEN}
          />

          {/* Office Wi-Fi IP Lock (Owner / Admin / Manager Only — SWKOS Parity) */}
          {allowedToPrint && (
            <div className="bw-card p-4 space-y-3 border-[#d7b04e]/40">
              <div className="flex items-center justify-between gap-2">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#8a6518]">
                  SWK-Grade Office Wi-Fi IP Lock
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-bold ${
                    wifiCfg.strictIpLock
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}
                >
                  {wifiCfg.strictIpLock ? `LOCKED (${wifiCfg.officeIp})` : 'UNLOCKED'}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Lock check-ins strictly to the office router public IP so remote Wi-Fi spoofing is blocked server-side.
              </p>
              <form method="POST" action="/api/v1/actions" className="space-y-2 text-xs">
                <input type="hidden" name="action" value="lock_office_wifi" />
                <input type="hidden" name="returnTo" value="/os/reception-qr" />
                <input type="hidden" name="strictIpLock" value={wifiCfg.strictIpLock ? '0' : '1'} />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    name="ssid"
                    defaultValue={wifiCfg.ssid}
                    className="bw-input text-xs"
                    placeholder="Office SSID"
                  />
                  <input
                    type="text"
                    name="officeIp"
                    defaultValue={wifiCfg.officeIp}
                    className="bw-input font-num text-xs"
                    placeholder="Auto-detect current IP"
                  />
                </div>
                <button type="submit" className="bw-btn-navy w-full">
                  {wifiCfg.strictIpLock ? 'Disable Strict IP Lock' : 'Lock to Office Public IP'}
                </button>
              </form>
            </div>
          )}

          {/* Server Form Fallback — Restricted to SUPER_ADMIN / HR_MANAGER */}
          {canOverrideTime && (
            <div className="bw-card p-4 space-y-3">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Manual / Back-Office Time Override (Admin / HR)
              </div>
              <form method="POST" action="/api/v1/actions" className="space-y-2.5 text-xs">
                <input type="hidden" name="action" value="reception_qr_checkin" />
                <input type="hidden" name="returnTo" value="/os/reception-qr" />
                <input type="hidden" name="qrStandCode" value={OFFICE_RECEPTION_QR_TOKEN} />
                <input type="hidden" name="networkSsid" value={wifiCfg.ssid} />
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    name="checkInTimeGst"
                    defaultValue="09:58"
                    required
                    className="bw-input font-num flex-1"
                    placeholder="HH:MM GST"
                  />
                  <button type="submit" className="bw-btn-navy shrink-0">
                    Log GST Arrival
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Continuous Contemptor Alerts + Today's Roll Call */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bw-card p-5 border-rose-200">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700">
                  10:30 AM Owner &amp; Manager Escalation
                </span>
                <h2 className="font-display text-lg font-bold text-[#021125]">
                  Continuous Contemptor Alerts (3+ Late Arrivals in 7 Days)
                </h2>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-rose-50 text-rose-800 text-xs font-bold border border-rose-200">
                {contemptorAlerts.length} Active Alert(s)
              </span>
            </div>
            {contemptorAlerts.length === 0 ? (
              <p className="text-xs text-slate-600">
                Zero continuous contemptors in the current 7-day rolling window. All staff within the 10:05 AM GST punctuality threshold.
              </p>
            ) : (
              <div className="space-y-2">
                {contemptorAlerts.map((c) => (
                  <div
                    key={String(c.id)}
                    className="p-3 rounded-xl bg-rose-50/70 border border-rose-200 flex flex-wrap items-center justify-between gap-2 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <StaffAvatar name={String(c.employee_name)} email={String(c.email)} size={30} />
                      <div>
                        <span className="font-bold text-[#021125]">{String(c.employee_name)}</span> ({String(c.email)}) —{' '}
                        <strong className="text-rose-700">{Number(c.late_count_7d)} late arrivals in 7 days</strong>
                      </div>
                    </div>
                    <span className="font-num text-[11px] font-bold text-rose-800">
                      Notified: Shabib Siraj, Warda &amp; Daniel Xavier
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bw-card p-5">
            <h2 className="font-display text-lg font-bold text-[#021125] mb-3">
              Office Reception Attendance Log ({attendanceLogs.length})
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 uppercase text-[10px]">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Staff Member</th>
                    <th className="py-2.5 px-3">Shift</th>
                    <th className="py-2.5 px-3">Arrival (GST)</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Minutes Late</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {attendanceLogs.map((a) => (
                    <tr key={String(a.id)}>
                      <td className="py-2.5 px-3 font-num">{String(a.check_in_date)}</td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2.5">
                          <StaffAvatar name={String(a.employee_name)} email={String(a.email)} size={28} />
                          <span className="font-bold text-[#021125]">{String(a.employee_name)}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3">{String(a.shift_name)}</td>
                      <td className="py-2.5 px-3 font-num font-bold">{String(a.check_in_time_gst)}</td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            a.status === 'ON_TIME'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {String(a.status)}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-num">
                        {Number(a.late_minutes) > 0 ? `${Number(a.late_minutes)} mins` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
