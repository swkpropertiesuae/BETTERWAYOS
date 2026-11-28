'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Calendar,
  CheckCheck,
  CheckCircle2,
  MapPin,
  Radar,
  ShieldCheck,
  Trash2,
  Users,
} from 'lucide-react';
import { fmtAed, MetricTile, PageHeader, StaffAvatar, StatusPill } from '@/components/os/UiKit';
import { SubFeatureTabs, type SubFeatureItem } from '@/components/os/SubFeatureTabs';
import { useOs } from '@/components/os/OsProvider';

type CommandSubTab = 'warroom' | 'operations' | 'approvals' | 'delete_bin' | 'calendar';

const COMMAND_SUB_TABS: ReadonlyArray<SubFeatureItem<CommandSubTab>> = [
  { id: 'warroom', num: '01', label: 'Command Center', icon: Radar },
  { id: 'operations', num: '02', label: 'Company Operations', icon: ShieldCheck },
  { id: 'approvals', num: '03', label: 'Approvals Queue', icon: CheckCheck },
  { id: 'delete_bin', num: '04', label: 'Delete Bin', icon: Trash2 },
  { id: 'calendar', num: '05', label: 'Calendar', icon: Calendar },
];

export default function CommandCenterPage() {
  const { user } = useOs();
  const [subTab, setSubTab] = useState<CommandSubTab>('warroom');
  const [data, setData] = useState<any>(null);
  const [execData, setExecData] = useState<any>(null);
  const [compData, setCompData] = useState<any>(null);
  const [deskData, setDeskData] = useState<any>(null);

  useEffect(() => {
    fetch('/api/v1/dashboard/overview').then((r) => (r.ok ? r.json() : null)).then(setData).catch(() => {});
    fetch('/api/v1/compliance').then((r) => (r.ok ? r.json() : null)).then(setCompData).catch(() => {});
    fetch('/api/v1/mortgage-desk').then((r) => (r.ok ? r.json() : null)).then(setDeskData).catch(() => {});
    if (user?.isOwner) {
      fetch('/api/v1/executive/overview').then((r) => (r.ok ? r.json() : null)).then(setExecData).catch(() => {});
    }
  }, [user?.isOwner]);

  const pendingApprovals = (execData?.pendingApprovals?.length ?? 0) + (execData?.pendingMasterRequests?.length ?? 0);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Live Executive War Room · Asia/Dubai GST"
        title="Command"
        accent="Center"
        subtitle="Real-time daily enquiry pulse, 12-stage mortgage funnel counts, company operations health, Owner approvals queue, 2-of-2 Delete Bin, and Dubai valuation/FOL calendar."
      />

      <SubFeatureTabs sectionTitle="Command Center" items={COMMAND_SUB_TABS} activeId={subTab} onSelect={setSubTab} />

      {/* 01 COMMAND CENTER */}
      {subTab === 'warroom' && data && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
            <MetricTile label="Active Loan Book" value={fmtAed(data.kpis.loanBookAed, true)} hint={`${data.kpis.activeCasesCount} cases`} tone="navy" />
            <MetricTile label="Expected DSA Revenue" value={fmtAed(data.kpis.expectedDsaAed, true)} hint="0.85% avg panel rate" tone="gold" />
            <MetricTile label="Today's Enquiries" value={data.kpis.todayEnquiriesCount} hint={`Date: ${data.todayDubai}`} tone="emerald" />
            <MetricTile label="Office Presence" value={`${data.kpis.checkedInCount}/${data.kpis.totalStaffCount}`} hint="Oud Metha QR live" />
            <MetricTile label="Active Field GPS" value={data.kpis.activeFieldVisitsCount} hint="Bank / Valuation / DLD" tone={data.kpis.activeFieldVisitsCount > 0 ? 'emerald' : 'default'} />
          </div>

          <div className="bw-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold flex items-center gap-2">
                <Radar size={15} className="text-[#0e5a49]" /> Live Lead &amp; Deal Distribution Across All 12 Pipeline Stages
              </h2>
              <Link href="/os/pipeline" className="text-xs font-bold text-[#0e5a49] hover:underline">
                Open 12-Step Kanban →
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5">
              {data.stageCounts.map((s: any) => (
                <div key={s.code} className="p-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-soft)]/60">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase text-[var(--bw-muted)]">Step {s.order}</span>
                    <span className="text-sm font-extrabold font-mono-num text-[#0e5a49]">{s.count}</span>
                  </div>
                  <div className="text-xs font-bold mt-1 truncate">{s.label}</div>
                  <div className="text-[10.5px] font-mono-num text-[var(--bw-muted)]">{fmtAed(s.loanVolumeAed, true)}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid lg:grid-cols-12 gap-5">
            <div className="lg:col-span-6 bw-card p-5 space-y-3">
              <h3 className="text-sm font-extrabold flex items-center gap-2">
                <Users size={15} className="text-[#0e5a49]" /> Team Presence &amp; Live Workload
              </h3>
              <div className="divide-y divide-[var(--bw-line)]">
                {data.teamTaskSummary.map((m: any) => (
                  <div key={m.userId} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5">
                      <StaffAvatar name={m.name} avatarUrl={m.avatarUrl} initials={m.initials} size="sm" />
                      <div>
                        <div className="font-bold">{m.name}</div>
                        <div className="text-[11px] text-[var(--bw-muted)]">{m.designation}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusPill label={m.checkedInToday ? 'Checked In' : 'Not In Yet'} tone={m.checkedInToday ? 'emerald' : 'slate'} />
                      <StatusPill label={`${m.openCount} Open`} tone={m.criticalCount > 0 ? 'red' : 'blue'} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-6 space-y-5">
              <div className="bw-card p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-extrabold flex items-center gap-2">
                    <MapPin size={15} className="text-[#0e5a49]" /> Live Field Staff GPS Radar
                  </h3>
                  <Link href="/os/field-gps" className="text-xs font-bold text-[#0e5a49] hover:underline">
                    Open Map →
                  </Link>
                </div>
                {data.activeFieldVisits.length === 0 ? (
                  <div className="text-xs text-[var(--bw-muted)] py-4">No active field meetings right now.</div>
                ) : (
                  data.activeFieldVisits.map((fv: any) => (
                    <div key={fv.id} className="p-3 rounded-xl border border-[var(--bw-line)] flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold">{fv.user_name} · {fv.purpose}</div>
                        <div className="text-[11px] text-[var(--bw-muted)]">
                          {fv.destination_label} ({Number(fv.last_lat).toFixed(4)}, {Number(fv.last_lng).toFixed(4)})
                        </div>
                      </div>
                      <StatusPill label={fv.status} tone={fv.status === 'SOS' ? 'red' : 'emerald'} />
                    </div>
                  ))
                )}
              </div>

              <div className="bw-card p-5 space-y-3">
                <h3 className="text-sm font-extrabold flex items-center gap-2">
                  <AlertTriangle size={15} className="text-amber-500" /> Critical Alerts &amp; Escalations
                </h3>
                {data.criticalAlerts.length === 0 ? (
                  <div className="text-xs text-[var(--bw-muted)] py-3 flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-[#0e5a49]" /> All critical alerts clear.
                  </div>
                ) : (
                  data.criticalAlerts.slice(0, 6).map((al: any) => (
                    <Link key={al.id} href={al.href || '/os'} className="block p-3 rounded-xl border border-[var(--bw-line)] hover:border-[#0e5a49] text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold">{al.title}</span>
                        <StatusPill label={al.severity} tone={al.severity === 'critical' ? 'red' : 'gold'} />
                      </div>
                      <div className="text-[11px] text-[var(--bw-muted)] mt-0.5">{al.body}</div>
                    </Link>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* 02 COMPANY OPERATIONS */}
      {subTab === 'operations' && (
        <div className="grid lg:grid-cols-3 gap-5 text-xs">
          <div className="bw-card p-5 space-y-3">
            <h3 className="font-display text-sm font-extrabold">Oud Metha Desk SLA Standards</h3>
            <div className="space-y-2">
              {[
                ['Initial Lead Callback SLA', '≤ 5 mins (Dubai GST)', 'emerald'],
                ['3-Bank Auto-Eco Quote Turnaround', 'Same Day (< 4 hrs)', 'emerald'],
                ['Bank Submission Completeness', '100% 13-Doc Pack', 'gold'],
                ['Valuation Booking Post-PA', 'Within 24 hrs', 'navy'],
              ].map(([k, v, tone]) => (
                <div key={k} className="p-3 rounded-xl bg-[var(--bw-soft)]/70 border border-[var(--bw-line)] flex items-center justify-between">
                  <span className="font-bold">{k}</span>
                  <StatusPill label={v} tone={tone as any} />
                </div>
              ))}
            </div>
          </div>
          <div className="lg:col-span-2 bw-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-sm font-extrabold">Live Operational Links &amp; Escalation Controls</h3>
              <Link href="/os/coordinator" className="text-xs font-extrabold text-[#0e5a49] hover:underline">Open 32-Col Coordinator →</Link>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                { title: 'Coordinator & Logins (32-Col)', desc: 'Track Docs Full/Incomplete, Valuation, FOL, Disbursed & Payouts', href: '/os/coordinator' },
                { title: '12-Step Mortgage Pipeline', desc: 'Move active borrower files from Step 01 Enquiry to Step 12 Care', href: '/os/pipeline' },
                { title: '24-Bank Advisory Desk', desc: '18-Bank 2026 Policy Matrix, 159 Direct Bank RMs & Valuations', href: '/os/mortgage-desk' },
                { title: 'Daily Master Excel Backup', desc: '17-sheet live OS snapshot & midnight Dubai GST automated archives', href: '/os/utilities' },
              ].map((op) => (
                <Link key={op.title} href={op.href} className="p-4 rounded-2xl border border-[var(--bw-line)] bg-[var(--bw-soft)]/40 hover:border-[#0e5a49] transition block">
                  <div className="font-extrabold text-sm">{op.title}</div>
                  <div className="text-[11px] text-[var(--bw-muted)] mt-1">{op.desc}</div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 03 APPROVALS QUEUE */}
      {subTab === 'approvals' && (
        <div className="bw-card p-5 space-y-4 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-sm font-extrabold">Owner Approvals Queue ({pendingApprovals} Pending)</h2>
              <p className="text-[11px] text-[var(--bw-muted)]">1-of-2 Master Log proposals &amp; 2-of-2 Corporate Payouts / Delete Bin releases for Warda Kapadia &amp; Shabib Siraj.</p>
            </div>
            {user?.isOwner && (
              <Link href="/os/corner?tab=approvals" className="bw-btn bw-btn-obsidian text-xs py-1.5 min-h-[34px]">
                Sign Off in Owner Corner →
              </Link>
            )}
          </div>
          {pendingApprovals === 0 ? (
            <div className="py-10 text-center text-[var(--bw-muted)]">All Owner approval queues are clear right now.</div>
          ) : (
            <div className="space-y-2.5">
              {(execData?.pendingApprovals ?? []).map((ap: any) => (
                <div key={ap.id} className="p-3.5 rounded-xl border border-[var(--bw-line)] flex items-center justify-between gap-2">
                  <div>
                    <div className="font-extrabold">{ap.title}</div>
                    <div className="text-[11px] text-[var(--bw-muted)]">{ap.description || ap.approval_type}</div>
                  </div>
                  <StatusPill label={ap.approval_mode} tone={ap.approval_mode === '2_OF_2' ? 'red' : 'emerald'} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 04 DELETE BIN */}
      {subTab === 'delete_bin' && (
        <div className="bw-card p-5 space-y-4 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-sm font-extrabold">2-of-2 Owner Protected Delete Bin ({compData?.deleteBin?.length ?? 0})</h2>
              <p className="text-[11px] text-[var(--bw-muted)]">Permanent deletion is locked behind dual co-owner cryptographic sign-off (Warda + Shabib).</p>
            </div>
            <Link href="/os/compliance" className="bw-btn bw-btn-obsidian text-xs py-1.5 min-h-[34px]">Manage in Compliance →</Link>
          </div>
          {(compData?.deleteBin ?? []).length === 0 ? (
            <div className="py-10 text-center text-[var(--bw-muted)]">Delete Bin is empty — zero pending permanent erasure requests.</div>
          ) : (
            <div className="space-y-2">
              {compData.deleteBin.map((d: any) => (
                <div key={d.id} className="p-3.5 rounded-xl border border-[var(--bw-line)] flex items-center justify-between gap-2">
                  <div>
                    <div className="font-bold">{d.record_label} <span className="font-mono text-[10.5px] text-[var(--bw-muted)]">({d.entity_table})</span></div>
                    <div className="text-[11px] text-[var(--bw-muted)]">{d.reason}</div>
                  </div>
                  <StatusPill label={d.status} tone={d.status === 'PURGED' ? 'red' : 'gold'} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 05 CALENDAR */}
      {subTab === 'calendar' && (
        <div className="grid lg:grid-cols-2 gap-5 text-xs">
          <div className="bw-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-sm font-extrabold">Scheduled Bank Valuations ({deskData?.valuations?.length ?? 0})</h3>
              <Link href="/os/mortgage-desk?tab=schedule" className="text-xs font-bold text-[#0e5a49] hover:underline">Book Valuation →</Link>
            </div>
            {(deskData?.valuations ?? []).length === 0 ? (
              <div className="py-8 text-center text-[var(--bw-muted)]">No property valuations booked yet.</div>
            ) : (
              deskData.valuations.map((v: any) => (
                <div key={v.id} className="p-3 rounded-xl border border-[var(--bw-line)] flex items-center justify-between">
                  <div>
                    <div className="font-bold">{v.valuation_company} · {String(v.bank_key).toUpperCase()}</div>
                    <div className="text-[11px] text-[var(--bw-muted)]">Access: {v.access_contact} · Fee {fmtAed(v.fee_aed)}</div>
                  </div>
                  <StatusPill label={v.status} tone="emerald" />
                </div>
              ))
            )}
          </div>
          <div className="bw-card p-5 space-y-3">
            <h3 className="font-display text-sm font-extrabold">Upcoming FOL Deadlines, DLD Trustee &amp; Bank Meetings ({deskData?.events?.length ?? 0})</h3>
            {(deskData?.events ?? []).length === 0 ? (
              <div className="py-8 text-center text-[var(--bw-muted)]">No upcoming deadlines logged yet.</div>
            ) : (
              deskData.events.map((ev: any) => (
                <div key={ev.id} className="p-3 rounded-xl border border-[var(--bw-line)] flex items-center justify-between">
                  <div>
                    <div className="font-bold">{ev.title}</div>
                    <div className="text-[11px] text-[var(--bw-muted)]">{new Date(ev.starts_at).toLocaleString()} · {ev.location}</div>
                  </div>
                  <StatusPill label={ev.event_type} tone="gold" />
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
