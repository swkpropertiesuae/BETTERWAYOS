'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import {
  ArrowRight,
  ArrowUpRight,
  Building2,
  CheckCircle2,
  Clock,
  Landmark,
  LayoutGrid,
  QrCode,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trash2,
  TrendingUp,
  UserPlus,
  Users,
} from 'lucide-react';
import { OS_APPS } from '@/lib/os-apps';
import { StaffAvatar } from '@/components/staff-avatar';

const EASE_OUT_EXPO = [0.22, 1, 0.36, 1] as const;

export interface ExecutiveDashboardData {
  user: {
    fullName: string;
    email: string;
    role: string;
    isOwner: boolean;
    canPrintQr: boolean;
  };
  dubaiDateLabel: string;
  greeting: string;
  metrics: {
    activeDealsCount: number;
    activePipelineAed: number;
    activeLeadsCount: number;
    websiteLeadsCount: number;
    eibor3mPct: string;
    eiborDate: string;
    checkedInTodayCount: number;
    totalStaffCount: number;
    pendingBinCount: number;
    pendingDecisionsCount: number;
    pendingRatesCount: number;
    openContemptorsCount: number;
    openTasksCount: number;
    banksCount: number;
  };
  recentLeads: Array<{
    id: number;
    contactName: string;
    contactPhone: string;
    sourceChannel: string;
    transactionType: string;
    targetPropertyAed: number;
    stage: string;
    advisorName: string;
    createdAt: string;
  }>;
  recentDeals: Array<{
    id: number;
    dealRef: string;
    borrowerName: string;
    communityName: string;
    targetLoanAed: number;
    stage: string;
    bankName: string;
  }>;
  teamRoster: Array<{
    email: string;
    fullName: string;
    designation: string;
    department: string;
    role: string;
    tier: 'executive' | 'management' | 'specialist';
    avatarUrl: string | null;
    portrait8kUrl: string | null;
    checkedInToday: boolean;
    checkInTimeGst: string | null;
    checkInStatus: string | null;
  }>;
}

function formatAedCompact(aed: number): string {
  if (aed >= 1_000_000) return `AED ${(aed / 1_000_000).toFixed(2)}M`;
  if (aed >= 1_000) return `AED ${(aed / 1_000).toFixed(0)}K`;
  return `AED ${Math.round(aed).toLocaleString('en-US')}`;
}

export function BetterwayOsDashboard({ data }: { data: ExecutiveDashboardData }) {
  const { user, metrics, recentLeads, recentDeals, teamRoster } = data;
  const firstName = user.fullName.split(' ')[0] || user.fullName;
  const pendingOwnerTotal =
    metrics.pendingBinCount + metrics.pendingDecisionsCount + metrics.pendingRatesCount + metrics.openContemptorsCount;

  return (
    <div className="space-y-6 pb-8">
      {/* Executive Calm Operating Wallet Hero */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
        className="relative overflow-hidden rounded-[28px] border border-[#d7b04e]/35 p-6 sm:p-8 text-white shadow-xl"
        style={{
          background:
            'radial-gradient(640px 280px at 92% -10%, rgba(215,176,78,0.22), transparent 62%), radial-gradient(500px 260px at 4% 115%, rgba(14,52,102,0.68), transparent 62%), linear-gradient(155deg, #041933 0%, #021125 58%, #010915 100%)',
        }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
          aria-hidden
        />

        <div className="relative z-10 flex flex-wrap items-start justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#d7b04e]/40 bg-[#d7b04e]/15 px-3 py-1 font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-[#f2dcb3]">
                <span className="size-1.5 rounded-full bg-emerald-400" />
                {data.dubaiDateLabel}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 font-mono text-[10.5px] uppercase tracking-[0.14em] text-slate-300">
                {user.isOwner ? 'Supreme Owner Governance' : user.role.replace(/_/g, ' ')}
              </span>
            </div>

            <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-white leading-[1.12]">
              {data.greeting},{' '}
              <span className="serif text-[#f2dcb3] text-[1.14em] font-normal">{firstName}.</span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl">
              Live SQLite operating ledger for Betterway Mortgages LLC — {metrics.banksCount} UAE panel banks, CBUAE 50%
              DBR underwriting, DLD conveyancing, MOHRE WPS payroll, and real-time website enquiry intake.
            </p>

            <div className="flex flex-wrap items-center gap-2.5 pt-2">
              <Link
                href="/os/crm"
                className="inline-flex items-center gap-2 rounded-full bg-[#d7b04e] hover:bg-[#f2dcb3] px-4 py-2 text-xs font-bold text-[#021125] transition shadow-md"
              >
                <UserPlus size={14} />
                <span>New Enquiry / CRM</span>
              </Link>
              <Link
                href="/os/los"
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 hover:bg-white/15 px-4 py-2 text-xs font-semibold text-white transition"
              >
                <Landmark size={14} />
                <span>24-Bank Underwriting</span>
              </Link>
              <Link
                href="/os/reception-qr"
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 hover:bg-white/15 px-4 py-2 text-xs font-semibold text-white transition"
              >
                <QrCode size={14} />
                <span>Reception QR Attendance</span>
              </Link>
              <Link
                href="/os/home"
                className="inline-flex items-center gap-2 rounded-full border border-[#d7b04e]/35 bg-[#021125]/60 hover:bg-[#072244] px-4 py-2 text-xs font-semibold text-[#f2dcb3] transition"
              >
                <LayoutGrid size={14} />
                <span>All 10 Apps</span>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 min-w-[250px] sm:min-w-[290px]">
            <div className="rounded-2xl border border-white/12 bg-white/[0.06] p-3.5 backdrop-blur-xs">
              <div className="font-mono text-[10px] uppercase tracking-wider text-slate-400">CBUAE 3M EIBOR</div>
              <div className="mt-1 font-mono text-2xl font-bold text-[#f2dcb3]">{metrics.eibor3mPct}%</div>
              <div className="text-[10.5px] text-slate-400 mt-0.5">Fixing {metrics.eiborDate}</div>
            </div>
            <div className="rounded-2xl border border-white/12 bg-white/[0.06] p-3.5 backdrop-blur-xs">
              <div className="font-mono text-[10px] uppercase tracking-wider text-slate-400">Office Attendance</div>
              <div className="mt-1 font-mono text-2xl font-bold text-emerald-300">
                {metrics.checkedInTodayCount}/{metrics.totalStaffCount}
              </div>
              <div className="text-[10.5px] text-slate-400 mt-0.5">10:05 AM GST grace</div>
            </div>
            <div className="col-span-2 rounded-2xl border border-[#d7b04e]/30 bg-[#d7b04e]/10 p-3.5 flex items-center justify-between gap-3">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-wider text-[#f2dcb3]">
                  Owner Governance Queue
                </div>
                <div className="text-xs font-semibold text-white mt-0.5">
                  {pendingOwnerTotal === 0
                    ? 'All approvals & delete bin items clear'
                    : `${pendingOwnerTotal} item(s) awaiting Shabib Siraj review`}
                </div>
              </div>
              <Link
                href="/os/command"
                className="shrink-0 inline-flex items-center justify-center size-8 rounded-full bg-[#d7b04e] text-[#021125] hover:bg-[#f2dcb3] transition"
                aria-label="Open Executive Command"
              >
                <ArrowUpRight size={15} />
              </Link>
            </div>
          </div>
        </div>
      </motion.section>

      {/* 4 Live SQLite KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Active Mortgage Pipeline',
            value: formatAedCompact(metrics.activePipelineAed),
            sub: `${metrics.activeDealsCount} live file(s) in underwriting / transfer`,
            href: '/os/deals',
            icon: TrendingUp,
            accent: 'text-[#021125]',
          },
          {
            label: 'CRM Enquiries & Web Intake',
            value: String(metrics.activeLeadsCount),
            sub: `${metrics.websiteLeadsCount} direct from BetterwayMortgages web`,
            href: '/os/crm',
            icon: UserPlus,
            accent: 'text-emerald-700',
          },
          {
            label: 'Open SLA Tasks',
            value: String(metrics.openTasksCount),
            sub: '5-minute GST response & DLD milestones',
            href: '/os/activities',
            icon: Clock,
            accent: 'text-[#8a6518]',
          },
          {
            label: 'Governance & Rate Queue',
            value: String(pendingOwnerTotal),
            sub: `${metrics.pendingBinCount} bin · ${metrics.pendingDecisionsCount} decisions · ${metrics.pendingRatesCount} rates`,
            href: '/os/recycle-bin',
            icon: ShieldCheck,
            accent: pendingOwnerTotal > 0 ? 'text-amber-700' : 'text-emerald-700',
          },
        ].map((card, idx) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.42, delay: 0.06 * idx, ease: EASE_OUT_EXPO }}
            >
              <Link
                href={card.href}
                className="group block rounded-[20px] bg-white border border-[#e2e6ea] hover:border-[#d7b04e] p-5 shadow-xs hover:shadow-md transition"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-[#64748b]">
                    {card.label}
                  </span>
                  <span className="size-8 rounded-full bg-[#f8f9fa] border border-[#e2e6ea] flex items-center justify-center text-[#021125] group-hover:bg-[#021125] group-hover:text-[#d7b04e] transition">
                    <Icon size={15} />
                  </span>
                </div>
                <div className={`mt-2.5 font-display font-num text-2xl font-bold tracking-tight ${card.accent}`}>
                  {card.value}
                </div>
                <div className="mt-1 text-xs text-[#4a5868] truncate">{card.sub}</div>
              </Link>
            </motion.div>
          );
        })}
      </div>

      {/* Main 2-Column Operating Desk: Live Pipeline + Official Betterway 8K Team Roster */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 cols: Live Enquiries, Deals & Governance */}
        <div className="lg:col-span-7 space-y-6">
          {/* Live CRM Enquiries */}
          <div className="rounded-[22px] bg-white border border-[#e2e6ea] p-5 shadow-xs">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <div className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[#8a6518]">
                  Live Website &amp; Partner Intake
                </div>
                <h2 className="font-display text-lg font-bold text-[#021125]">
                  Recent Enquiries ({recentLeads.length})
                </h2>
              </div>
              <Link
                href="/os/crm"
                className="inline-flex items-center gap-1 rounded-full bg-[#f8f9fa] hover:bg-[#faf3e0] border border-[#e2e6ea] px-3 py-1.5 text-xs font-semibold text-[#021125] transition"
              >
                <span>Open CRM</span>
                <ArrowRight size={13} />
              </Link>
            </div>

            {recentLeads.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#cbd5e1] bg-[#f8f9fa] p-6 text-center">
                <p className="text-xs font-semibold text-[#021125]">No active leads in the production ledger yet.</p>
                <p className="text-[11.5px] text-[#64748b] mt-1">
                  Submit an enquiry from the BetterwayMortgages website or add a lead directly in CRM to see real-time
                  advisor assignment here.
                </p>
                <Link href="/os/crm" className="mt-3 inline-flex bw-btn-navy">
                  Capture First Enquiry
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-[#e2e6ea] text-[#64748b] uppercase text-[10px]">
                      <th className="py-2 pr-3">Client</th>
                      <th className="py-2 px-2">Channel</th>
                      <th className="py-2 px-2">Property</th>
                      <th className="py-2 px-2">Advisor</th>
                      <th className="py-2 pl-2">Stage</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f1f5f9]">
                    {recentLeads.map((l) => (
                      <tr key={l.id} className="hover:bg-[#f8f9fa]">
                        <td className="py-2.5 pr-3">
                          <div className="font-semibold text-[#021125]">{l.contactName}</div>
                          <div className="font-mono text-[10.5px] text-[#64748b]">{l.contactPhone}</div>
                        </td>
                        <td className="py-2.5 px-2">
                          <span className="rounded-full bg-[#faf3e0] border border-[#d7b04e]/40 px-2 py-0.5 font-mono text-[10px] font-semibold text-[#8a6518]">
                            {l.sourceChannel.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 font-mono font-semibold text-[#021125]">
                          {formatAedCompact(l.targetPropertyAed)}
                        </td>
                        <td className="py-2.5 px-2 text-[#4a5868]">{l.advisorName}</td>
                        <td className="py-2.5 pl-2">
                          <span className="rounded-full bg-[#021125]/5 border border-[#021125]/15 px-2 py-0.5 text-[10px] font-bold text-[#021125]">
                            {l.stage}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Active Deals + Owner Governance Shortcuts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-[22px] bg-white border border-[#e2e6ea] p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-display text-base font-bold text-[#021125]">Active Mortgage Deals</h3>
                  <Link href="/os/deals" className="text-xs font-semibold text-[#8a6518] hover:underline">
                    Pipeline →
                  </Link>
                </div>
                {recentDeals.length === 0 ? (
                  <p className="text-xs text-[#64748b] leading-relaxed">
                    Clean production ledger ready for live client conversions. Convert a qualified lead in CRM to launch
                    24-bank underwriting and CBUAE KFS sign-off.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {recentDeals.map((d) => (
                      <Link
                        key={d.id}
                        href="/os/deals"
                        className="block rounded-xl border border-[#e2e6ea] hover:border-[#d7b04e] p-2.5 transition"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-[#021125]">{d.borrowerName}</span>
                          <span className="font-mono text-[11px] font-bold text-[#8a6518]">
                            {formatAedCompact(d.targetLoanAed)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-[#64748b] mt-0.5">
                          <span>
                            {d.dealRef} · {d.communityName}
                          </span>
                          <span className="font-semibold text-[#021125]">{d.stage.replace(/_/g, ' ')}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
              <div className="mt-4 pt-3 border-t border-[#f1f5f9] flex items-center justify-between text-[11px] text-[#64748b]">
                <span>24 UAE Banks · 80 Projects APL</span>
                <Link href="/os/banks-apl" className="font-semibold text-[#021125] hover:underline">
                  Rate Cards
                </Link>
              </div>
            </div>

            <div className="rounded-[22px] bg-[#021125] text-white border border-[#d7b04e]/35 p-5 shadow-sm flex flex-col justify-between">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#d7b04e]">
                  SWK-Grade Owner Controls
                </div>
                <h3 className="font-display text-base font-bold text-white mt-1">
                  Shabib Siraj Governance Desk
                </h3>
                <div className="mt-3 space-y-2 text-xs">
                  <Link
                    href="/os/recycle-bin"
                    className="flex items-center justify-between rounded-xl bg-white/[0.06] hover:bg-white/[0.11] px-3 py-2 transition"
                  >
                    <span className="flex items-center gap-2">
                      <Trash2 size={14} className="text-[#d7b04e]" />
                      Pending Delete Bin
                    </span>
                    <span className="font-mono font-bold text-[#f2dcb3]">{metrics.pendingBinCount}</span>
                  </Link>
                  <Link
                    href="/os/command"
                    className="flex items-center justify-between rounded-xl bg-white/[0.06] hover:bg-white/[0.11] px-3 py-2 transition"
                  >
                    <span className="flex items-center gap-2">
                      <ShieldCheck size={14} className="text-[#d7b04e]" />
                      Admin &amp; Manager Decisions
                    </span>
                    <span className="font-mono font-bold text-[#f2dcb3]">{metrics.pendingDecisionsCount}</span>
                  </Link>
                  <Link
                    href="/os/reception-qr"
                    className="flex items-center justify-between rounded-xl bg-white/[0.06] hover:bg-white/[0.11] px-3 py-2 transition"
                  >
                    <span className="flex items-center gap-2">
                      <ShieldAlert size={14} className="text-amber-300" />
                      Contemptor Alerts (7d)
                    </span>
                    <span className="font-mono font-bold text-amber-300">{metrics.openContemptorsCount}</span>
                  </Link>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-300">
                <span>Admin supervised by Owner</span>
                <Link href="/os/security" className="font-semibold text-[#d7b04e] hover:underline">
                  MFA &amp; Lock →
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Right 5 cols: Official Betterway Mortgages LLC Team & Live Attendance */}
        <div className="lg:col-span-5">
          <div className="rounded-[22px] bg-white border border-[#e2e6ea] p-5 shadow-xs h-full flex flex-col">
            <div className="flex items-center justify-between gap-2 mb-4">
              <div>
                <div className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[#8a6518]">
                  Official Staff Roster · 8K Studio Profiles
                </div>
                <h2 className="font-display text-lg font-bold text-[#021125]">
                  Betterway Leadership &amp; Team ({teamRoster.length})
                </h2>
              </div>
              <Link
                href="/os/team"
                className="inline-flex items-center gap-1 rounded-full bg-[#f8f9fa] hover:bg-[#faf3e0] border border-[#e2e6ea] px-3 py-1.5 text-xs font-semibold text-[#021125] transition"
              >
                <Users size={13} />
                <span>Workload</span>
              </Link>
            </div>

            <div className="space-y-2 flex-1">
              {teamRoster.map((member) => (
                <div
                  key={member.email}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-[#e2e6ea] bg-[#f8f9fa]/70 hover:bg-white hover:border-[#d7b04e]/70 p-2.5 transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <StaffAvatar
                      name={member.fullName}
                      email={member.email}
                      avatarUrl={member.avatarUrl}
                      size={40}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-[#021125] truncate">{member.fullName}</span>
                        {member.tier === 'executive' && (
                          <span className="rounded-full bg-[#021125] text-[#d7b04e] px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase">
                            Exec
                          </span>
                        )}
                        {member.tier === 'management' && (
                          <span className="rounded-full bg-[#faf3e0] text-[#8a6518] border border-[#d7b04e]/50 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase">
                            Mgr
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-[#4a5868] truncate">{member.designation}</div>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    {member.checkedInToday ? (
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[10px] font-bold ${
                          member.checkInStatus === 'LATE'
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        <CheckCircle2 size={11} />
                        {member.checkInTimeGst} GST
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-slate-100 text-slate-500 px-2 py-0.5 font-mono text-[10px]">
                        Not scanned
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-[#f1f5f9] flex items-center justify-between text-xs">
              <span className="text-[#64748b] flex items-center gap-1.5">
                <Sparkles size={13} className="text-[#8a6518]" />
                Synced with public website portfolio
              </span>
              <Link href="/os/reception-qr" className="font-semibold text-[#021125] hover:text-[#8a6518]">
                Reception QR →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* SWKOS 10-App Department Launcher Bento Grid */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[#8a6518]">
              SWK-Parity Modular Architecture
            </div>
            <h2 className="font-display text-xl font-bold text-[#021125]">
              Institutional Departments &amp; Operating Apps
            </h2>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <Link
              href="/os/home"
              className="rounded-full bg-white border border-[#e2e6ea] hover:border-[#021125] px-3.5 py-1.5 font-semibold text-[#021125] transition"
            >
              Full App Launcher
            </Link>
            <Link
              href="/os/workspace"
              className="rounded-full bg-white border border-[#e2e6ea] hover:border-[#021125] px-3.5 py-1.5 font-semibold text-[#4a5868] hover:text-[#021125] transition"
            >
              Legacy Canvas Workspace
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {OS_APPS.map((app, idx) => {
            const Icon = app.icon;
            const firstHref = app.items[0]?.href || '/os/home';
            return (
              <motion.div
                key={app.key}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.38, delay: 0.03 * idx, ease: EASE_OUT_EXPO }}
              >
                <Link
                  href={firstHref}
                  className="swk-app-tile h-full"
                  style={{ minHeight: 158, padding: '18px 12px 16px' }}
                >
                  <span className={`swk-app-icon tone-${app.tone}`} style={{ width: 52, height: 52, borderRadius: 18 }}>
                    <Icon size={22} />
                  </span>
                  <div className="swk-app-name">{app.label}</div>
                  <div className="swk-app-blurb">{app.blurb}</div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
