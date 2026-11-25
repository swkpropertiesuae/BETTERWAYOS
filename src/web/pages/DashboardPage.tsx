import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowUpRight,
  Building2,
  CalendarClock,
  CheckCircle2,
  Landmark,
  QrCode,
  ShieldAlert,
  TrendingUp,
  Trophy,
  Wallet,
} from 'lucide-react';
import { apiFetch, fmtAed } from '../lib/api';
import { useAuth } from '../lib/auth-context';
import { BankBadge, PageHeader, StaffAvatar, StatusPill } from '../components/UiPrimitives';

function EiborCurveChart({ history }: { history: any[] }) {
  if (!history?.length) return null;
  const w = 540;
  const h = 175;
  const padX = 34;
  const padY = 20;
  const minV = 3.2;
  const maxV = 5.0;
  const xFor = (i: number) => padX + (i / Math.max(1, history.length - 1)) * (w - padX * 2);
  const yFor = (v: number) => h - padY - ((v - minV) / (maxV - minV)) * (h - padY * 2);

  const linePath = (key: string) =>
    history.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${xFor(i).toFixed(1)} ${yFor(pt[key]).toFixed(1)}`).join(' ');

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-44 overflow-visible">
      {[3.5, 4.0, 4.5, 5.0].map((v) => (
        <g key={v}>
          <line x1={padX} y1={yFor(v)} x2={w - padX} y2={yFor(v)} stroke="currentColor" strokeOpacity={0.12} strokeDasharray="3 4" />
          <text x={2} y={yFor(v) + 4} fontSize="10" fill="currentColor" opacity={0.55} className="font-mono-num">
            {v.toFixed(1)}%
          </text>
        </g>
      ))}
      <path d={linePath('oneYear')} fill="none" stroke="#D7B158" strokeWidth="2.2" />
      <path d={linePath('sixMonth')} fill="none" stroke="#38BDF8" strokeWidth="2.2" />
      <path d={linePath('threeMonth')} fill="none" stroke="#34DFAC" strokeWidth="3" />
      {history.map((pt, i) => (
        <g key={pt.date}>
          <circle cx={xFor(i)} cy={yFor(pt.threeMonth)} r="3.4" fill="#34DFAC" />
          {i % 2 === 0 && (
            <text x={xFor(i)} y={h - 2} textAnchor="middle" fontSize="9.5" fill="currentColor" opacity={0.55}>
              {pt.date.slice(5)}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}

export function DashboardPage() {
  const { user, toast } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const d = await apiFetch('/api/dashboard');
      setData(d);
    } catch (e: any) {
      toast(e.message || 'Failed to load dashboard', 'err');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  if (loading || !data) {
    return <div className="p-10 text-center text-sm text-[var(--bw-muted)]">Loading Betterway Executive Desk…</div>;
  }

  const { kpis, stageCounts, advisorStats, upcomingTransfers, rateResetWatch, pendingActions, eibor, attendanceToday } = data;
  const maxStageLoan = Math.max(1, ...stageCounts.map((s: any) => s.loanAed));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={`${user?.tier || 'Executive'} Command · Betterway Mortgages OS`}
        title="Mortgage Brokerage"
        accent="Executive Desk"
        subtitle="Real-time UAE loan book, CBUAE EIBOR curves, 12-milestone funnel velocity, SWK Dual-Relay attribution, and Owner governance sign-offs."
        actions={
          <>
            <Link
              to="/pipeline"
              className="px-4 py-2 rounded-full text-xs font-bold text-white bg-gradient-to-r from-[#179373] to-[#0A4A3E]"
            >
              Open 12-Stage LOS
            </Link>
            <Link
              to="/calculators"
              className="px-4 py-2 rounded-full text-xs font-bold border border-[var(--bw-line)] bg-[var(--bw-card)] hover:border-[#D7B158]"
            >
              CBUAE Affordability Studio
            </Link>
          </>
        }
      />

      {/* 4 Bento KPI Cards */}
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bw-card p-5 relative overflow-hidden bg-[#070E1A] text-white border-[#D7B158]/35">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#D7B158]">Active Mortgage Book</span>
            <Landmark size={18} className="text-[#34DFAC]" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono-num mt-2">{fmtAed(kpis.totalPipelineLoanAed, true)}</div>
          <div className="text-xs text-slate-300 mt-1">
            {kpis.activeCases} active files · {fmtAed(kpis.totalPropertyVolumeAed, true)} asset value
          </div>
        </div>

        <div className="bw-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--bw-muted)]">Projected Bank DSA Pool</span>
            <Wallet size={18} className="text-[#179373]" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono-num mt-2 text-[#0A4A3E] dark:text-[#34DFAC]">
            {fmtAed(kpis.projectedDsaAed)}
          </div>
          <div className="text-xs text-[var(--bw-muted)] mt-1">
            Settled net: <b className="text-[var(--bw-ink)]">{fmtAed(kpis.settledRevenueAed)}</b> · 0.75%–0.95% DSA
          </div>
        </div>

        <div className="bw-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--bw-muted)]">SWK Properties Dual-Relay</span>
            <Building2 size={18} className="text-[#BA8D36]" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono-num mt-2">{fmtAed(kpis.swkRelayVolumeAed, true)}</div>
          <div className="text-xs text-[var(--bw-muted)] mt-1">
            Linked DLD handover &amp; secondary buyers · <span className="text-[#179373] font-semibold">Dual Fee Capture</span>
          </div>
        </div>

        <div className="bw-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--bw-muted)]">Office Attendance &amp; Governance</span>
            <QrCode size={18} className="text-[#179373]" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono-num mt-2">
            {kpis.checkedInToday} <span className="text-sm font-normal text-[var(--bw-muted)]">/ 9 Checked In</span>
          </div>
          <div className="text-xs mt-1 flex items-center gap-2">
            <StatusPill
              label={`${kpis.pendingApprovalsCount} Owner Approvals`}
              tone={kpis.pendingApprovalsCount > 0 ? 'gold' : 'emerald'}
            />
            <span className="text-[var(--bw-muted)]">{kpis.openLeads} open leads</span>
          </div>
        </div>
      </div>

      {/* Main Analytics Bento Grid */}
      <div className="grid lg:grid-cols-12 gap-5">
        {/* Live CBUAE EIBOR Chart (5 cols) */}
        <div className="lg:col-span-5 bw-card p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <div>
                <div className="text-[10.5px] font-bold uppercase tracking-[0.2em] text-[#179373]">CBUAE Benchmark</div>
                <h3 className="text-base font-bold">Live EIBOR 90-Day Yield Curve</h3>
              </div>
              <StatusPill label={`As of ${eibor.asOfDate}`} tone="navy" />
            </div>
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="p-2.5 rounded-xl bg-[var(--bw-soft)]">
                <div className="text-[10px] text-[var(--bw-muted)]">3M EIBOR</div>
                <div className="text-base font-bold font-mono-num text-[#179373] dark:text-[#34DFAC]">
                  {eibor.latest.threeMonth.toFixed(3)}%
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-[var(--bw-soft)]">
                <div className="text-[10px] text-[var(--bw-muted)]">6M EIBOR</div>
                <div className="text-base font-bold font-mono-num text-sky-600 dark:text-sky-400">
                  {eibor.latest.sixMonth.toFixed(3)}%
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-[var(--bw-soft)]">
                <div className="text-[10px] text-[var(--bw-muted)]">1Y EIBOR</div>
                <div className="text-base font-bold font-mono-num text-[#BA8D36] dark:text-[#FCF1B7]">
                  {eibor.latest.oneYear.toFixed(3)}%
                </div>
              </div>
            </div>
            <EiborCurveChart history={eibor.history} />
          </div>
          <div className="mt-3 pt-3 border-t border-[var(--bw-line)] flex items-center justify-between text-xs text-[var(--bw-muted)]">
            <span className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1"><i className="size-2 rounded-full bg-[#34DFAC]" />3M</span>
              <span className="inline-flex items-center gap-1"><i className="size-2 rounded-full bg-sky-400" />6M</span>
              <span className="inline-flex items-center gap-1"><i className="size-2 rounded-full bg-[#D7B158]" />1Y</span>
            </span>
            <Link to="/banks" className="font-bold text-[#179373] hover:underline flex items-center gap-1">
              24-Bank Desk <ArrowUpRight size={13} />
            </Link>
          </div>
        </div>

        {/* 12-Milestone Pipeline Velocity (7 cols) */}
        <div className="lg:col-span-7 bw-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-[10.5px] font-bold uppercase tracking-[0.2em] text-[#179373]">12-Milestone LOS</div>
              <h3 className="text-base font-bold">Pipeline Distribution by Milestone</h3>
            </div>
            <Link to="/pipeline" className="text-xs font-bold text-[#179373] hover:underline">
              Manage Kanban →
            </Link>
          </div>
          <div className="space-y-2.5">
            {stageCounts.map((s: any) => (
              <div key={s.code} className="grid grid-cols-12 items-center gap-3 text-xs">
                <div className="col-span-4 sm:col-span-3 truncate font-semibold text-[var(--bw-body)]">
                  {String(s.order).padStart(2, '0')} · {s.label}
                </div>
                <div className="col-span-5 sm:col-span-6 h-3 rounded-full bg-[var(--bw-soft)] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.max(s.count ? 8 : 0, Math.round((s.loanAed / maxStageLoan) * 100))}%`,
                      backgroundColor: s.color,
                    }}
                  />
                </div>
                <div className="col-span-3 text-end font-mono-num font-semibold">
                  {s.count} · {s.loanAed > 0 ? fmtAed(s.loanAed, true) : '—'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Advisor Leaderboard (with 8K Studio Portraits) + Governance & Upcoming Transfers */}
      <div className="grid lg:grid-cols-12 gap-5">
        <div className="lg:col-span-6 bw-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Trophy size={18} className="text-[#D7B158]" />
              <h3 className="text-base font-bold">Advisory Desk Leaderboard</h3>
            </div>
            <Link to="/team" className="text-xs font-bold text-[#179373] hover:underline">
              Full 8K Team →
            </Link>
          </div>
          <div className="space-y-3">
            {advisorStats.map((adv: any, idx: number) => (
              <div
                key={adv.id}
                className="flex items-center gap-3.5 p-3 rounded-2xl bg-[var(--bw-soft)]/70 border border-[var(--bw-line)]"
              >
                <span className="w-6 text-center font-mono-num text-xs font-bold text-[#BA8D36]">#{idx + 1}</span>
                <StaffAvatar avatar={adv.avatar} name={adv.name} initials={adv.initials} size="md" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold truncate">{adv.name}</span>
                    <span className="font-mono-num text-xs font-bold text-[#179373] dark:text-[#34DFAC]">
                      {fmtAed(adv.volumeAed, true)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-[var(--bw-muted)] mt-0.5">
                    <span>
                      {adv.casesCount} cases · Est. DSA {fmtAed(adv.dsaAed)}
                    </span>
                    <span className="font-mono-num">{adv.targetPct}% of target</span>
                  </div>
                  <div className="mt-1.5 h-1.5 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full bw-emerald-gradient"
                      style={{ width: `${Math.max(4, adv.targetPct)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Owner Action Queue + Upcoming DLD Transfers & Rate-Reset Watch */}
        <div className="lg:col-span-6 space-y-5">
          <div className="bw-card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert size={18} className="text-[#BA8D36]" />
                <h3 className="text-base font-bold">Executive Approvals &amp; Governance</h3>
              </div>
              <Link to="/compliance" className="text-xs font-bold text-[#179373]">
                Review Queue →
              </Link>
            </div>
            <div className="space-y-2.5 text-xs">
              {pendingActions.withdrawals.map((w: any) => (
                <div key={w.id} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/25">
                  <div>
                    <div className="font-bold">Withdrawal Refund · {w.case_code} ({w.borrower_name})</div>
                    <div className="text-[var(--bw-muted)]">Refundable {fmtAed(w.refundable_aed)} · Requested by {w.requested_by}</div>
                  </div>
                  <Link to="/finance" className="px-3 py-1.5 rounded-full bg-[#070E1A] text-[#FCF1B7] font-bold shrink-0">
                    Decide
                  </Link>
                </div>
              ))}
              {pendingActions.pendingSeals.map((s: any) => (
                <div key={s.id} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-[var(--bw-soft)] border border-[var(--bw-line)]">
                  <div>
                    <div className="font-bold">{s.category} · {s.record_code}</div>
                    <div className="text-[var(--bw-muted)]">{s.subject}</div>
                  </div>
                  <StatusPill label={s.status} tone="gold" />
                </div>
              ))}
              {pendingActions.pendingDeletes.map((d: any) => (
                <div key={d.id} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/25">
                  <div>
                    <div className="font-bold flex items-center gap-1.5"><AlertTriangle size={13} /> Delete Bin · {d.record_label}</div>
                    <div className="text-[var(--bw-muted)]">By {d.requested_by_name}: &ldquo;{d.reason}&rdquo;</div>
                  </div>
                  <Link to="/compliance" className="px-3 py-1.5 rounded-full bg-red-600 text-white font-bold shrink-0">
                    Review
                  </Link>
                </div>
              ))}
            </div>
          </div>

          <div className="bw-card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CalendarClock size={18} className="text-[#179373]" />
                <h3 className="text-base font-bold">Upcoming DLD Transfers &amp; Rate-Reset Watch</h3>
              </div>
              <TrendingUp size={16} className="text-[var(--bw-muted)]" />
            </div>
            <div className="space-y-2">
              {upcomingTransfers.slice(0, 4).map((c: any) => (
                <div key={c.id} className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-[var(--bw-soft)]/70 text-xs">
                  <div className="min-w-0">
                    <div className="font-bold truncate">{c.case_code} · {c.borrower_name}</div>
                    <div className="text-[var(--bw-muted)] truncate">{c.project_name} ({c.community})</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <BankBadge bankKey={c.primary_bank_key} showName={false} />
                    <StatusPill label={c.transfer_date} tone="emerald" />
                  </div>
                </div>
              ))}
              {rateResetWatch.slice(0, 1).map((c: any) => (
                <div key={`rst-${c.id}`} className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-[#D7B158]/12 border border-[#D7B158]/30 text-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-[#BA8D36]" />
                    <span><b>Rate-Reset Radar:</b> {c.borrower_name} fixed ends {c.fixed_expiry_date}</span>
                  </div>
                  <StatusPill label="Buyout Ready" tone="gold" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Live Al Nasr Plaza Reception Attendance Strip */}
      <div className="bw-card p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-[#0A4A3E] text-[#34DFAC] flex items-center justify-center">
            <QrCode size={18} />
          </div>
          <div>
            <div className="text-xs font-bold">Al Nasr Plaza Reception QR Attendance · Today (Dubai GST)</div>
            <div className="text-[11px] text-[var(--bw-muted)]">
              {attendanceToday.slice(0, 5).map((a: any) => `${a.user_name} (${a.dubai_time})`).join(' · ')}
            </div>
          </div>
        </div>
        <Link to="/reception-qr" className="px-3.5 py-2 rounded-full text-xs font-bold border border-[var(--bw-line)] hover:border-[#179373]">
          Open Live QR Terminal →
        </Link>
      </div>
    </div>
  );
}
