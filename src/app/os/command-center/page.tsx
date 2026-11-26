'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, CheckCircle2, MapPin, Radar, Users } from 'lucide-react';
import { fmtAed, MetricTile, PageHeader, StaffAvatar, StatusPill } from '@/components/os/UiKit';

export default function CommandCenterPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch('/api/v1/dashboard/overview')
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Live Executive War Room · Asia/Dubai GST"
        title="Command"
        accent="Center"
        subtitle="Real-time 100% daily enquiry pulse, 12-stage mortgage funnel counts, Oud Metha live office presence (Hikvision + QR), active Field GPS radar, and critical alerts."
      />

      {data && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
            <MetricTile label="Active Loan Book" value={fmtAed(data.kpis.loanBookAed, true)} hint={`${data.kpis.activeCasesCount} cases`} tone="navy" />
            <MetricTile label="Expected DSA Revenue" value={fmtAed(data.kpis.expectedDsaAed, true)} hint="0.85% avg panel rate" tone="gold" />
            <MetricTile label="Today's Enquiries" value={data.kpis.todayEnquiriesCount} hint={`Date: ${data.todayDubai}`} tone="emerald" />
            <MetricTile label="Office Presence" value={`${data.kpis.checkedInCount}/${data.kpis.totalStaffCount}`} hint="Hikvision + QR live" />
            <MetricTile label="Active Field GPS" value={data.kpis.activeFieldVisitsCount} hint="Bank / Valuation / DLD" tone={data.kpis.activeFieldVisitsCount > 0 ? 'emerald' : 'default'} />
          </div>

          {/* 12-Stage Live Count Matrix */}
          <div className="bw-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold flex items-center gap-2">
                <Radar size={15} className="text-[#0D8A6A]" /> Live Lead &amp; Deal Distribution Across All 12 Pipeline Stages
              </h2>
              <Link href="/os/pipeline" className="text-xs font-bold text-[#0D8A6A] hover:underline">
                Open 12-Step Kanban →
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5">
              {data.stageCounts.map((s: any) => (
                <div key={s.code} className="p-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-bg)]/60">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase text-[var(--bw-muted)]">Step {s.order}</span>
                    <span className="text-sm font-extrabold font-mono-num text-[#0D8A6A]">{s.count}</span>
                  </div>
                  <div className="text-xs font-bold mt-1 truncate">{s.label}</div>
                  <div className="text-[10.5px] font-mono-num text-[var(--bw-muted)]">{fmtAed(s.loanVolumeAed, true)}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid lg:grid-cols-12 gap-5">
            {/* Live Office Staff Presence & Task Load */}
            <div className="lg:col-span-6 bw-card p-5 space-y-3">
              <h3 className="text-sm font-extrabold flex items-center gap-2">
                <Users size={15} className="text-[#0D8A6A]" /> Team Presence &amp; Live Workload
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

            {/* Active Field Visits + Critical Alerts */}
            <div className="lg:col-span-6 space-y-5">
              <div className="bw-card p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-extrabold flex items-center gap-2">
                    <MapPin size={15} className="text-[#0D8A6A]" /> Live Field Staff GPS Radar
                  </h3>
                  <Link href="/os/field-gps" className="text-xs font-bold text-[#0D8A6A] hover:underline">
                    Open Map →
                  </Link>
                </div>
                {data.activeFieldVisits.length === 0 ? (
                  <div className="text-xs text-[var(--bw-muted)] py-4">No active field visits right now.</div>
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
                    <CheckCircle2 size={14} className="text-[#0D8A6A]" /> All critical alerts clear.
                  </div>
                ) : (
                  data.criticalAlerts.slice(0, 6).map((al: any) => (
                    <Link key={al.id} href={al.href || '/os'} className="block p-3 rounded-xl border border-[var(--bw-line)] hover:border-[#0D8A6A] text-xs">
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
    </div>
  );
}
