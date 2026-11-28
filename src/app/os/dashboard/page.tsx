'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowRight,
  Calculator,
  CheckCircle2,
  Download,
  FileLock2,
  FileText,
  LayoutGrid,
  MapPin,
  Plus,
  UserCheck,
  UserPlus,
} from 'lucide-react';
import { useOs } from '@/components/os/OsProvider';
import { fmtAed, GlossyBlackCard, MetricTile, ShineLink, StaffAvatar, StatusPill, WalletLoanCard } from '@/components/os/UiKit';
import { useInstantApi } from '@/lib/client-cache';
import { EIBOR_SNAPSHOT } from '@/lib/domain/banks';

const EMPTY_DASHBOARD = {
  kpis: {
    loanBookAed: 0,
    expectedDsaAed: 0,
    todayEnquiriesCount: 0,
    totalLeadsCount: 0,
    activeCasesCount: 0,
    checkedInCount: 0,
    totalStaffCount: 9,
    eibor3m: EIBOR_SNAPSHOT.latest.threeMonth,
  },
  criticalAlerts: [] as any[],
  stageCounts: [] as any[],
  myTasks: [] as any[],
  teamTaskSummary: [] as any[],
  assignedClients: [] as any[],
  user: null as any,
};

export default function DashboardPage() {
  const { user, toast } = useOs();
  const { data: liveData, reload } = useInstantApi<any>('/api/v1/dashboard/overview');
  const data = liveData ?? EMPTY_DASHBOARD;

  const [taskTitle, setTaskTitle] = useState('');
  const [taskPriority, setTaskPriority] = useState<'Critical' | 'High' | 'Normal'>('High');
  const [taskAssignee, setTaskAssignee] = useState('');

  useEffect(() => {
    if (!taskAssignee && (liveData?.user?.id || user?.id)) {
      setTaskAssignee(liveData?.user?.id || user?.id || '');
    }
  }, [liveData, user, taskAssignee]);

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    const r = await fetch('/api/v1/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: taskTitle, priority: taskPriority, assignedTo: taskAssignee || user?.id }),
    });
    if (r.ok) {
      toast('Task added!');
      setTaskTitle('');
      await reload();
    }
  };

  const toggleDone = async (task: any) => {
    const next = task.status === 'Done' ? 'Todo' : 'Done';
    await fetch(`/api/v1/tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next }),
    });
    await reload();
  };

  const firstName = user?.name?.split(' ')[0];

  return (
    <div className="space-y-6">
      {/* Simple English Control Header + 21st.dev Shine Buttons */}
      <header className="flex flex-wrap items-center justify-between gap-4 pb-2">
        <div>
          <div className="inline-flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#0e5a49] dark:text-[#64c4a8] mb-1">
            <span className="size-1.5 rounded-full bg-[#47a88d]" /> Live Dubai Control Desk
          </div>
          <h1 className="font-display text-2xl sm:text-[34px] font-extrabold tracking-[-0.03em] text-[var(--bw-ink)]">
            Your Daily Mortgage Desk
          </h1>
          <p className="text-[13.5px] text-[var(--bw-muted)] mt-1 max-w-[64ch]">
            {firstName ? `Hello ${firstName}. ` : ''}Check today&apos;s numbers, open alerts, move loans through all 12 steps, and track bank payouts.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 no-print">
          <a href="/api/v1/utilities/master-backup-excel" className="bw-btn bw-btn-outline text-xs">
            <Download size={14} className="text-[#0e5a49]" /> Export Excel
          </a>
          <ShineLink href="/os/mortgage-desk" variant="obsidian">
            24-Bank &amp; Proposals
          </ShineLink>
          {user?.isOwner && (
            <ShineLink href="/os/executive" variant="emerald">
              {user.executiveAppTitle || "Warda's Place"}
            </ShineLink>
          )}
        </div>
      </header>

      {/* 4-Column Glossy Floating Shining Black KPI Cards */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3.5" aria-label="Key mortgage numbers">
        <MetricTile
          label="Active Loan Book"
          value={fmtAed(data.kpis.loanBookAed, true)}
          hint={`${data.kpis.activeCasesCount} active cases`}
          tone="navy"
        />
        <MetricTile
          label="Expected Bank DSA"
          value={fmtAed(data.kpis.expectedDsaAed, true)}
          hint="Corporate bank payouts"
          tone="emerald"
        />
        <MetricTile
          label="Today's Enquiries"
          value={data.kpis.todayEnquiriesCount}
          hint={`Total leads: ${data.kpis.totalLeadsCount}`}
          tone="gold"
        />
        <MetricTile
          label="3M CBUAE EIBOR"
          value={`${Number(data.kpis.eibor3m || 4.207).toFixed(3)}%`}
          hint="Live UAE benchmark"
        />
      </section>

      {/* Collapsible Needs Attention Disclosure */}
      {data.criticalAlerts?.length > 0 && (
        <details className="bw-disclosure" open>
          <summary>
            <span>Needs Attention Right Now</span>
            <span className="ms-auto px-2.5 py-0.5 rounded-full bg-[#fdf2f4] text-[#881b30] border border-[#fecdd6] text-xs font-extrabold">
              {data.criticalAlerts.length}
            </span>
          </summary>
          <div className="grid md:grid-cols-2 border-t border-[var(--bw-line)] divide-y md:divide-y-0 md:divide-x divide-[var(--bw-line)]">
            {data.criticalAlerts.slice(0, 6).map((a: any) => (
              <div key={a.id} className="flex items-start gap-3 px-5 py-3.5 hover:bg-[var(--bw-hover)] text-xs">
                <AlertTriangle size={16} className="text-[#9f243b] shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-[var(--bw-ink)]">{a.title}</div>
                  <div className="text-[var(--bw-muted)] mt-0.5">{a.body}</div>
                </div>
              </div>
            ))}
          </div>
        </details>
      )}

      {/* 3-Column Overview: Glossy Black Portfolio + White 12-Step Pipeline + 3D Shining Wallet Card */}
      <section className="grid lg:grid-cols-12 gap-5 items-start" aria-label="Mortgage wallet overview">
        <GlossyBlackCard className="lg:col-span-4 p-6 space-y-5" accent="emerald">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-sm font-extrabold text-white">Mortgage Portfolio Summary</h2>
            <img src="/brand/betterway-icon.svg" alt="" aria-hidden className="size-8" />
          </div>
          <dl className="divide-y divide-white/10">
            <div className="pb-4">
              <dt className="text-xs text-slate-400">Total Active Financed Volume</dt>
              <dd className="font-display text-3xl font-extrabold font-mono-num tracking-[-0.03em] text-white mt-1">
                {fmtAed(data.kpis.loanBookAed, true)}
              </dd>
            </div>
            <div className="py-3 flex items-center justify-between gap-2 text-xs">
              <dt className="text-slate-300">Expected Bank DSA</dt>
              <dd className="font-display text-base font-extrabold font-mono-num text-[#64c4a8]">
                {fmtAed(data.kpis.expectedDsaAed, true)}
              </dd>
            </div>
            <div className="py-3 flex items-center justify-between gap-2 text-xs">
              <dt className="text-slate-300">Active Mortgage Cases</dt>
              <dd className="font-display text-base font-extrabold font-mono-num text-white">{data.kpis.activeCasesCount}</dd>
            </div>
            <div className="pt-3 flex items-center justify-between gap-2 text-xs">
              <dt className="text-slate-300">Team Checked In Today</dt>
              <dd className="font-display text-base font-extrabold font-mono-num text-[#dfc285]">
                {data.kpis.checkedInCount ?? 0} / {data.kpis.totalStaffCount ?? 9}
              </dd>
            </div>
          </dl>
        </GlossyBlackCard>

        <div className="lg:col-span-4 bw-card overflow-hidden">
          <div className="px-5 py-4 border-b border-[var(--bw-line)] flex items-center justify-between">
            <div>
              <h2 className="font-display text-sm font-extrabold text-[var(--bw-ink)]">12-Step Mortgage Pipeline</h2>
              <p className="text-[11px] text-[var(--bw-muted)]">From 01 Enquiry to 12 Client Care</p>
            </div>
            <Link href="/os/pipeline" className="text-xs font-extrabold text-[#0e5a49] hover:underline inline-flex items-center gap-1">
              Open <ArrowRight size={13} />
            </Link>
          </div>
          <div className="p-4 grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto">
            {(data.stageCounts ?? []).map((s: any) => (
              <Link
                key={s.code}
                href="/os/pipeline"
                className="p-3 rounded-xl bg-[var(--bw-soft)] hover:bg-[#0b192c] hover:text-white border border-[var(--bw-line)] hover:border-[#47a88d]/50 transition group"
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-[var(--bw-muted)] group-hover:text-slate-300">Step {s.order}</span>
                  <span className="px-2 py-0.5 rounded-full bg-[#0b192c] group-hover:bg-[#47a88d] text-[#64c4a8] group-hover:text-[#0b192c] font-mono-num font-extrabold">
                    {s.count}
                  </span>
                </div>
                <div className="text-xs font-extrabold mt-1 truncate">{s.label}</div>
              </Link>
            ))}
          </div>
        </div>

        <aside className="lg:col-span-4 space-y-4">
          <WalletLoanCard
            label="Bank DSA Commission Wallet"
            amount={fmtAed(data.kpis.expectedDsaAed, true)}
            subLabel="Corporate Bank Payouts · AED 0 Client Broker Fee"
            footerLeft="Betterway Mortgages LLC"
            footerHref={user?.isOwner ? '/os/executive?tab=commissions' : '/os/accounts'}
            footerLinkLabel="Open Ledger"
          />
          <section className="bw-card p-5 space-y-3">
            <h2 className="font-display text-sm font-extrabold text-[var(--bw-ink)]">Quick Shortcuts</h2>
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'New Lead', href: '/os/crm', icon: UserPlus },
                { label: '18-Bank Rates', href: '/os/mortgage-desk', icon: Calculator },
                { label: 'Client Vault', href: '/os/vault', icon: FileLock2 },
                { label: 'Excel & Forms', href: '/os/utilities', icon: FileText },
                { label: 'Field GPS', href: '/os/field-gps', icon: MapPin },
                { label: 'All Apps', href: '/os', icon: LayoutGrid },
              ].map((s) => {
                const Icon = s.icon;
                return (
                  <Link
                    key={s.href}
                    href={s.href}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[var(--bw-soft)] hover:bg-[#0b192c] text-[var(--bw-ink)] hover:text-[#64c4a8] border border-[var(--bw-line)] hover:border-[#47a88d]/50 text-xs font-bold transition"
                  >
                    <Icon size={13} /> {s.label}
                  </Link>
                );
              })}
            </div>
          </section>
        </aside>
      </section>

      {/* Tasks Today + Team Task Board */}
      <div className="grid lg:grid-cols-12 gap-5">
        <div className="lg:col-span-6 bw-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-sm font-extrabold">
              My Tasks Today ({(data.myTasks ?? []).filter((t: any) => t.status !== 'Done').length} open)
            </h3>
          </div>
          <form onSubmit={addTask} className="flex flex-wrap gap-2">
            <input
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              placeholder="Write a quick follow-up or bank RM task..."
              className="flex-1 min-w-[180px] h-10 px-3.5 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] text-xs outline-none focus:border-[#0e5a49]"
            />
            <select
              value={taskPriority}
              onChange={(e) => setTaskPriority(e.target.value as any)}
              className="h-10 px-3 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] text-xs font-semibold"
            >
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Normal">Normal</option>
            </select>
            {(user?.isOwner || user?.role === 'TEAM_MANAGER' || user?.role === 'OPERATIONS_MANAGER') && (
              <select
                value={taskAssignee}
                onChange={(e) => setTaskAssignee(e.target.value)}
                className="h-10 px-3 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-soft)] text-xs font-semibold"
              >
                {(data.teamTaskSummary ?? []).map((m: any) => (
                  <option key={m.userId} value={m.userId}>
                    {m.name}
                  </option>
                ))}
              </select>
            )}
            <button type="submit" className="bw-btn bw-btn-obsidian text-xs">
              <Plus size={14} /> Add
            </button>
          </form>

          <div className="space-y-2 max-h-72 overflow-y-auto">
            {(data.myTasks ?? []).length === 0 ? (
              <div className="py-6 text-center text-xs text-[var(--bw-muted)]">No tasks assigned yet today.</div>
            ) : (
              data.myTasks.map((t: any) => (
                <div key={t.id} className="p-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-soft)]/70 flex items-center justify-between gap-2 text-xs">
                  <button type="button" onClick={() => void toggleDone(t)} className="flex items-center gap-2.5 text-start cursor-pointer">
                    <CheckCircle2 size={17} className={t.status === 'Done' ? 'text-[#0e5a49]' : 'text-[var(--bw-muted)]'} />
                    <span className={t.status === 'Done' ? 'line-through text-[var(--bw-muted)]' : 'font-bold text-[var(--bw-ink)]'}>
                      {t.title}
                    </span>
                  </button>
                  <StatusPill label={t.priority} tone={t.priority === 'Critical' ? 'red' : t.priority === 'High' ? 'gold' : 'slate'} />
                </div>
              ))
            )}
          </div>
        </div>

        <div className="lg:col-span-6 bw-card p-5 space-y-3">
          <h3 className="font-display text-sm font-extrabold">Team Task Board</h3>
          <div className="divide-y divide-[var(--bw-line)]">
            {(data.teamTaskSummary ?? []).map((m: any) => (
              <div key={m.userId} className="py-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <StaffAvatar name={m.name} avatarUrl={m.avatarUrl} initials={m.initials} size="sm" />
                  <div>
                    <div className="font-extrabold text-[var(--bw-ink)]">{m.name}</div>
                    <div className="text-[11px] text-[var(--bw-muted)]">{m.designation}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {m.criticalCount > 0 && <StatusPill label={`${m.criticalCount} Urgent`} tone="red" />}
                  <StatusPill label={`${m.openCount} Open`} tone="blue" />
                  <StatusPill label={`${m.doneCount} Done`} tone="emerald" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Assigned Clients Table */}
      <section className="bw-card overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--bw-line)] flex items-center justify-between">
          <h3 className="font-display text-sm font-extrabold flex items-center gap-2">
            <UserCheck size={16} className="text-[#0e5a49]" /> Assigned Clients &amp; Referrals
          </h3>
          <Link href="/os/crm" className="text-xs font-extrabold text-[#0e5a49] hover:underline">
            Open All Leads →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs min-w-[680px]">
            <thead>
              <tr className="bg-[var(--bw-soft)] border-b border-[var(--bw-line)] text-[11px] font-bold text-[var(--bw-muted)]">
                <th className="py-3 px-4 text-start">Case Ref</th>
                <th className="py-3 px-4 text-start">Client Name</th>
                <th className="py-3 px-4 text-start">Phone (PDPL)</th>
                <th className="py-3 px-4 text-start">Source / Partner</th>
                <th className="py-3 px-4 text-end">Property Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--bw-line)]">
              {(data.assignedClients ?? []).length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-[var(--bw-muted)]">
                    No assigned clients yet. Log a new enquiry in Leads &amp; Vault.
                  </td>
                </tr>
              ) : (
                data.assignedClients.map((c: any) => (
                  <tr key={c.id} className="hover:bg-[var(--bw-hover)]">
                    <td className="py-3.5 px-4 font-mono-num font-extrabold text-[#0e5a49]">{c.referenceCode}</td>
                    <td className="py-3.5 px-4 font-bold text-[var(--bw-ink)]">{c.contactName}</td>
                    <td className="py-3.5 px-4 font-mono-num text-[var(--bw-body)]">{c.phoneDisplay}</td>
                    <td className="py-3.5 px-4 text-[var(--bw-body)]">{c.sourceChannel} · {c.referrerName}</td>
                    <td className="py-3.5 px-4 text-end font-mono-num font-extrabold text-[var(--bw-ink)]">
                      {fmtAed(c.propertyPriceAed, true)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
