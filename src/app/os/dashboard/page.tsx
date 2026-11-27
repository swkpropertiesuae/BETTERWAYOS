'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowRight,
  Calculator,
  CheckCircle2,
  Crown,
  FileLock2,
  FileText,
  KanbanSquare,
  LayoutGrid,
  MapPin,
  Plus,
  UserCheck,
  UserPlus,
} from 'lucide-react';
import { useOs } from '@/components/os/OsProvider';
import { fmtAed, MetricTile, StaffAvatar, StatusPill, WalletLoanCard } from '@/components/os/UiKit';

export default function DashboardPage() {
  const { user, toast } = useOs();
  const [data, setData] = useState<any>(null);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskPriority, setTaskPriority] = useState<'Critical' | 'High' | 'Normal'>('High');
  const [taskAssignee, setTaskAssignee] = useState('');

  const load = useCallback(async () => {
    const r = await fetch('/api/v1/dashboard/overview');
    if (r.ok) {
      const d = await r.json();
      setData(d);
      if (!taskAssignee && d.user?.id) setTaskAssignee(d.user.id);
    }
  }, [taskAssignee]);

  useEffect(() => {
    void load();
  }, [load]);

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    const r = await fetch('/api/v1/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: taskTitle, priority: taskPriority, assignedTo: taskAssignee || user?.id }),
    });
    if (r.ok) {
      toast('Mortgage task added!');
      setTaskTitle('');
      await load();
    }
  };

  const toggleDone = async (task: any) => {
    const next = task.status === 'Done' ? 'Todo' : 'Done';
    await fetch(`/api/v1/tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next }),
    });
    await load();
  };

  const firstName = user?.name?.split(' ')[0];

  return (
    <div className="space-y-6">
      {/* Calm Control Welcome Header */}
      <header className="flex flex-wrap items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="font-display text-2xl sm:text-[32px] font-bold tracking-[-0.03em] text-[var(--bw-ink)]">
            Your UAE mortgage control desk
          </h1>
          <p className="text-[13.5px] text-[var(--bw-muted)] mt-1 max-w-[64ch]">
            {firstName ? `Hello, ${firstName}. ` : ''}See what needs attention, move mortgages through all 12 CBUAE stages, and stay on top of Bank DSA settlements.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 no-print">
          <Link href="/os/mortgage-desk" className="bw-btn bw-btn-outline">
            <Calculator size={15} /> 24-Bank Desk
          </Link>
          <Link href="/os/pipeline" className="bw-btn bw-btn-dark">
            <KanbanSquare size={15} /> 12-Step Pipeline
          </Link>
          {user?.isOwner && (
            <Link href="/os/executive" className="bw-btn bw-btn-primary">
              <Crown size={15} /> {user.executiveAppTitle || "Warda's Place"}
            </Link>
          )}
        </div>
      </header>

      {!data ? (
        <div className="bw-card p-10 text-center text-xs text-[var(--bw-muted)]">Loading live UAE mortgage ledger...</div>
      ) : (
        <>
          {/* 4-Column Calm Operating Wallet KPI Strip */}
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-3.5" aria-label="Mortgage figures at a glance">
            <MetricTile
              label="Active Loan Book"
              value={fmtAed(data.kpis.loanBookAed, true)}
              hint={`${data.kpis.activeCasesCount} active mortgage cases`}
              tone="navy"
            />
            <MetricTile
              label="Expected Bank DSA"
              value={fmtAed(data.kpis.expectedDsaAed, true)}
              hint="Corporate bank settlements"
              tone="emerald"
            />
            <MetricTile
              label="Today's Enquiries (GST)"
              value={data.kpis.todayEnquiriesCount}
              hint={`Total logged: ${data.kpis.totalLeadsCount}`}
              tone="gold"
            />
            <MetricTile
              label="3M CBUAE EIBOR"
              value={`${data.kpis.eibor3m.toFixed(3)}%`}
              hint="Live benchmark rate"
            />
          </section>

          {/* Collapsible Needs Attention Disclosure (Calm Operating Wallet Pattern) */}
          {data.criticalAlerts?.length > 0 && (
            <details className="bw-disclosure" open>
              <summary>
                <span>Needs attention</span>
                <span className="ms-auto px-2.5 py-0.5 rounded-full bg-[#fbe1e4] text-[#9b1424] text-xs font-bold">
                  {data.criticalAlerts.length}
                </span>
              </summary>
              <div className="grid md:grid-cols-2 border-t border-[var(--bw-line)] divide-y md:divide-y-0 md:divide-x divide-[var(--bw-line)]">
                {data.criticalAlerts.slice(0, 6).map((a: any) => (
                  <div key={a.id} className="flex items-start gap-3 px-5 py-3.5 hover:bg-[var(--bw-hover)] text-xs">
                    <AlertTriangle size={16} className="text-[#c32135] shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-[var(--bw-ink)]">{a.title}</div>
                      <div className="text-[var(--bw-muted)] mt-0.5">{a.body}</div>
                    </div>
                  </div>
                ))}
              </div>
            </details>
          )}

          {/* Signature 3-Column Calm Operating Wallet Overview */}
          <section className="grid lg:grid-cols-12 gap-5 items-start" aria-label="Mortgage wallet overview">
            {/* Left: Owner Financial & Pipeline Ledger */}
            <div className="lg:col-span-4 bw-card p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-sm font-bold text-[var(--bw-ink)]">Mortgage Portfolio Ledger</h2>
                <img src="/brand/icon-fullcolor.svg" alt="" aria-hidden className="size-8" />
              </div>
              <dl className="divide-y divide-[var(--bw-line)]">
                <div className="pb-4">
                  <dt className="text-xs text-[var(--bw-muted)]">Total Active Financed Volume</dt>
                  <dd className="font-display text-3xl font-bold font-mono-num tracking-[-0.03em] text-[var(--bw-ink)] mt-1">
                    {fmtAed(data.kpis.loanBookAed, true)}
                  </dd>
                </div>
                <div className="py-3 flex items-center justify-between gap-2 text-xs">
                  <dt className="text-[var(--bw-muted)]">Expected Bank DSA</dt>
                  <dd className="font-display text-base font-bold font-mono-num text-[var(--bw-emerald)]">
                    {fmtAed(data.kpis.expectedDsaAed, true)}
                  </dd>
                </div>
                <div className="py-3 flex items-center justify-between gap-2 text-xs">
                  <dt className="text-[var(--bw-muted)]">Active Mortgage Cases</dt>
                  <dd className="font-display text-base font-bold font-mono-num">{data.kpis.activeCasesCount}</dd>
                </div>
                <div className="pt-3 flex items-center justify-between gap-2 text-xs">
                  <dt className="text-[var(--bw-muted)]">Team Checked In Today</dt>
                  <dd className="font-display text-base font-bold font-mono-num">
                    {data.kpis.checkedInCount ?? 0} / {data.kpis.totalStaffCount ?? 9}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Center: 12-Stage Live Mortgage Desk Rail */}
            <div className="lg:col-span-4 bw-card overflow-hidden">
              <div className="px-5 py-4 border-b border-[var(--bw-line)] flex items-center justify-between">
                <div>
                  <h2 className="font-display text-sm font-bold text-[var(--bw-ink)]">12-Stage CBUAE Pipeline</h2>
                  <p className="text-[11px] text-[var(--bw-muted)]">Live counts from 01 Enquiry → 12 Rate Watch</p>
                </div>
                <Link href="/os/pipeline" className="text-xs font-bold text-[var(--bw-emerald)] hover:underline inline-flex items-center gap-1">
                  Open <ArrowRight size={13} />
                </Link>
              </div>
              <div className="p-4 grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto">
                {data.stageCounts.map((s: any) => (
                  <Link
                    key={s.code}
                    href="/os/pipeline"
                    className="p-3 rounded-xl bg-[var(--bw-bg)] hover:bg-[var(--bw-mint-soft)] border border-[var(--bw-line)] transition"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-[var(--bw-muted)]">Step {s.order}</span>
                      <span className="px-2 py-0.5 rounded-full bg-[var(--bw-mint)] text-[var(--bw-fold)] dark:text-[#b9dec9] font-mono-num font-bold">
                        {s.count}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-[var(--bw-ink)] mt-1 truncate">{s.label}</div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Right: 3D-Tilt Deep Fold Emerald Wallet Card + Quick Shortcuts */}
            <aside className="lg:col-span-4 space-y-4">
              <WalletLoanCard
                label="Bank DSA Commission Wallet"
                amount={fmtAed(data.kpis.expectedDsaAed, true)}
                subLabel="Corporate Bank Settlement · Zero Client Broker Fee"
                footerLeft="Betterway Mortgages LLC"
                footerHref={user?.isOwner ? '/os/executive?tab=commissions' : '/os/accounts'}
                footerLinkLabel="Settlements"
              />
              <section className="bw-card p-5 space-y-3">
                <h2 className="font-display text-sm font-bold text-[var(--bw-ink)]">Quick mortgage actions</h2>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: 'CRM', href: '/os/crm', icon: UserPlus },
                    { label: '24 Banks', href: '/os/mortgage-desk', icon: Calculator },
                    { label: 'Vault', href: '/os/vault', icon: FileLock2 },
                    { label: 'Forms', href: '/os/utilities', icon: FileText },
                    { label: 'Field GPS', href: '/os/field-gps', icon: MapPin },
                    { label: 'All Apps', href: '/os', icon: LayoutGrid },
                  ].map((s) => {
                    const Icon = s.icon;
                    return (
                      <Link
                        key={s.href}
                        href={s.href}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[var(--bw-soft)] hover:bg-[var(--bw-emerald)] text-[var(--bw-fold)] dark:text-[#b9dec9] hover:text-white text-xs font-semibold transition"
                      >
                        <Icon size={14} /> {s.label}
                      </Link>
                    );
                  })}
                </div>
              </section>
            </aside>
          </section>

          {/* Tasks Today + Team Task Monitor */}
          <div className="grid lg:grid-cols-12 gap-5">
            <div className="lg:col-span-6 bw-card p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-sm font-bold">
                  My Tasks Today ({data.myTasks.filter((t: any) => t.status !== 'Done').length} open)
                </h3>
              </div>
              <form onSubmit={addTask} className="flex flex-wrap gap-2">
                <input
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="Add borrower follow-up or bank RM deliverable..."
                  className="flex-1 min-w-[180px] h-10 px-3.5 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-bg)] text-xs outline-none focus:border-[var(--bw-emerald)]"
                />
                <select
                  value={taskPriority}
                  onChange={(e) => setTaskPriority(e.target.value as any)}
                  className="h-10 px-3 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-bg)] text-xs"
                >
                  <option value="Critical">Critical</option>
                  <option value="High">High</option>
                  <option value="Normal">Normal</option>
                </select>
                {(user?.isOwner || user?.role === 'TEAM_MANAGER' || user?.role === 'OPERATIONS_MANAGER') && (
                  <select
                    value={taskAssignee}
                    onChange={(e) => setTaskAssignee(e.target.value)}
                    className="h-10 px-3 rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-bg)] text-xs"
                  >
                    {data.teamTaskSummary.map((m: any) => (
                      <option key={m.userId} value={m.userId}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                )}
                <button type="submit" className="bw-btn bw-btn-primary text-xs">
                  <Plus size={14} /> Add
                </button>
              </form>

              <div className="space-y-2 max-h-72 overflow-y-auto">
                {data.myTasks.length === 0 ? (
                  <div className="py-6 text-center text-xs text-[var(--bw-muted)]">No tasks assigned yet today.</div>
                ) : (
                  data.myTasks.map((t: any) => (
                    <div key={t.id} className="p-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-bg)]/50 flex items-center justify-between gap-2 text-xs">
                      <button type="button" onClick={() => void toggleDone(t)} className="flex items-center gap-2.5 text-start cursor-pointer">
                        <CheckCircle2 size={17} className={t.status === 'Done' ? 'text-[var(--bw-emerald)]' : 'text-[var(--bw-muted)]'} />
                        <span className={t.status === 'Done' ? 'line-through text-[var(--bw-muted)]' : 'font-semibold text-[var(--bw-ink)]'}>
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
              <h3 className="font-display text-sm font-bold">Team &amp; Advisor Task Monitor</h3>
              <div className="divide-y divide-[var(--bw-line)]">
                {data.teamTaskSummary.map((m: any) => (
                  <div key={m.userId} className="py-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <StaffAvatar name={m.name} avatarUrl={m.avatarUrl} initials={m.initials} size="sm" />
                      <div>
                        <div className="font-bold text-[var(--bw-ink)]">{m.name}</div>
                        <div className="text-[11px] text-[var(--bw-muted)]">{m.designation}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {m.criticalCount > 0 && <StatusPill label={`${m.criticalCount} Critical`} tone="red" />}
                      <StatusPill label={`${m.openCount} Open`} tone="blue" />
                      <StatusPill label={`${m.doneCount} Done`} tone="emerald" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Assigned Borrowers Operating Table */}
          <section className="bw-card overflow-hidden">
            <div className="px-5 py-4 border-b border-[var(--bw-line)] flex items-center justify-between">
              <h3 className="font-display text-sm font-bold flex items-center gap-2">
                <UserCheck size={16} className="text-[var(--bw-emerald)]" /> Assigned Borrowers (Referrals, Channels &amp; Advisors)
              </h3>
              <Link href="/os/crm" className="text-xs font-bold text-[var(--bw-emerald)] hover:underline">
                Open CRM →
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs min-w-[680px]">
                <thead>
                  <tr className="bg-[var(--bw-bg)] border-b border-[var(--bw-line)] text-[11px] font-semibold text-[var(--bw-muted)]">
                    <th className="py-3 px-4 text-start">Case Ref</th>
                    <th className="py-3 px-4 text-start">Borrower</th>
                    <th className="py-3 px-4 text-start">Phone (PDPL)</th>
                    <th className="py-3 px-4 text-start">Channel / Referrer</th>
                    <th className="py-3 px-4 text-end">Property Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--bw-line)]">
                  {data.assignedClients.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-[var(--bw-muted)]">
                        No assigned borrower enquiries yet. Log enquiries in CRM or via betterwaymortgages.com.
                      </td>
                    </tr>
                  ) : (
                    data.assignedClients.map((c: any) => (
                      <tr key={c.id} className="hover:bg-[var(--bw-hover)]">
                        <td className="py-3.5 px-4 font-mono-num font-bold text-[var(--bw-emerald)]">{c.referenceCode}</td>
                        <td className="py-3.5 px-4 font-bold text-[var(--bw-ink)]">{c.contactName}</td>
                        <td className="py-3.5 px-4 font-mono-num text-[var(--bw-body)]">{c.phoneDisplay}</td>
                        <td className="py-3.5 px-4 text-[var(--bw-body)]">{c.sourceChannel} · {c.referrerName}</td>
                        <td className="py-3.5 px-4 text-end font-mono-num font-bold text-[var(--bw-ink)]">
                          {fmtAed(c.propertyPriceAed, true)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
