'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Plus, UserCheck } from 'lucide-react';
import { useOs } from '@/components/os/OsProvider';
import { fmtAed, MetricTile, PageHeader, StaffAvatar, StatusPill } from '@/components/os/UiKit';

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
      toast('Task added!');
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

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Betterway Mortgages · Business & Execution Dashboard"
        title="Dashboard &"
        accent="Daily Task Monitor"
        subtitle="12-stage live lead counts, My Tasks Today, Team & Individual task monitoring, Assigned Clients from referrals & staff, and critical deadline alerts."
      />

      {data && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            <MetricTile label="Loan Book (Scoped)" value={fmtAed(data.kpis.loanBookAed, true)} hint={`${data.kpis.activeCasesCount} active cases`} tone="navy" />
            <MetricTile label="Expected Bank DSA" value={fmtAed(data.kpis.expectedDsaAed, true)} hint="Corporate account settlements" tone="gold" />
            <MetricTile label="Today's Enquiries" value={data.kpis.todayEnquiriesCount} hint={`Total logged: ${data.kpis.totalLeadsCount}`} tone="emerald" />
            <MetricTile label="3M CBUAE EIBOR" value={`${data.kpis.eibor3m.toFixed(3)}%`} hint="Live benchmark reference" />
          </div>

          {/* 12 Stages Lead Count Bar */}
          <div className="bw-card p-5 space-y-3">
            <h2 className="text-sm font-extrabold">12 Stages — Live Lead Count Per Stage</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5">
              {data.stageCounts.map((s: any) => (
                <div key={s.code} className="p-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-bg)]/60">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="font-bold text-[var(--bw-muted)]">#{s.order}</span>
                    <span className="px-2 py-0.5 rounded-full bg-[#0D8A6A]/15 text-[#0D8A6A] font-mono-num font-extrabold">
                      {s.count}
                    </span>
                  </div>
                  <div className="text-xs font-bold mt-1 truncate">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid lg:grid-cols-12 gap-5">
            {/* My Tasks Today + Quick Add */}
            <div className="lg:col-span-6 bw-card p-5 space-y-4">
              <h3 className="text-sm font-extrabold">My Tasks Today ({data.myTasks.filter((t: any) => t.status !== 'Done').length} open)</h3>
              <form onSubmit={addTask} className="flex flex-wrap gap-2">
                <input
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="Add task or client follow-up..."
                  className="flex-1 min-w-[180px] h-9 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-bg)] text-xs"
                />
                <select
                  value={taskPriority}
                  onChange={(e) => setTaskPriority(e.target.value as any)}
                  className="h-9 px-2.5 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-bg)] text-xs"
                >
                  <option value="Critical">Critical</option>
                  <option value="High">High</option>
                  <option value="Normal">Normal</option>
                </select>
                {(user?.isOwner || user?.role === 'TEAM_MANAGER' || user?.role === 'OPERATIONS_MANAGER') && (
                  <select
                    value={taskAssignee}
                    onChange={(e) => setTaskAssignee(e.target.value)}
                    className="h-9 px-2.5 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-bg)] text-xs"
                  >
                    {data.teamTaskSummary.map((m: any) => (
                      <option key={m.userId} value={m.userId}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                )}
                <button type="submit" className="h-9 px-3.5 rounded-xl bg-[#0D8A6A] text-white text-xs font-bold inline-flex items-center gap-1 cursor-pointer">
                  <Plus size={13} /> Add
                </button>
              </form>

              <div className="space-y-2 max-h-72 overflow-y-auto">
                {data.myTasks.length === 0 ? (
                  <div className="py-6 text-center text-xs text-[var(--bw-muted)]">No tasks assigned yet today.</div>
                ) : (
                  data.myTasks.map((t: any) => (
                    <div key={t.id} className="p-3 rounded-xl border border-[var(--bw-line)] flex items-center justify-between gap-2 text-xs">
                      <button type="button" onClick={() => void toggleDone(t)} className="flex items-center gap-2 text-start cursor-pointer">
                        <CheckCircle2 size={16} className={t.status === 'Done' ? 'text-[#0D8A6A]' : 'text-[var(--bw-muted)]'} />
                        <span className={t.status === 'Done' ? 'line-through text-[var(--bw-muted)]' : 'font-semibold'}>{t.title}</span>
                      </button>
                      <StatusPill label={t.priority} tone={t.priority === 'Critical' ? 'red' : t.priority === 'High' ? 'gold' : 'slate'} />
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Team & Individual Task Monitoring */}
            <div className="lg:col-span-6 bw-card p-5 space-y-3">
              <h3 className="text-sm font-extrabold">Team &amp; Individual Task Monitor</h3>
              <div className="divide-y divide-[var(--bw-line)]">
                {data.teamTaskSummary.map((m: any) => (
                  <div key={m.userId} className="py-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <StaffAvatar name={m.name} avatarUrl={m.avatarUrl} initials={m.initials} size="sm" />
                      <div>
                        <div className="font-bold">{m.name}</div>
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

          {/* Assigned Clients (From References & Staff) + Critical Alerts */}
          <div className="grid lg:grid-cols-12 gap-5">
            <div className="lg:col-span-8 bw-card p-5 space-y-3">
              <h3 className="text-sm font-extrabold flex items-center gap-2">
                <UserCheck size={15} className="text-[#0D8A6A]" /> Assigned Clients (References, Channels &amp; Staff)
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-[var(--bw-line)] text-[10.5px] uppercase text-[var(--bw-muted)]">
                      <th className="py-2 text-start">Ref</th>
                      <th className="py-2 text-start">Client</th>
                      <th className="py-2 text-start">Phone (PDPL)</th>
                      <th className="py-2 text-start">Source / Reference</th>
                      <th className="py-2 text-end">Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--bw-line)]">
                    {data.assignedClients.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-[var(--bw-muted)]">
                          No assigned enquiries yet. Log enquiries in CRM or via betterwaymortgages.com.
                        </td>
                      </tr>
                    ) : (
                      data.assignedClients.map((c: any) => (
                        <tr key={c.id}>
                          <td className="py-2 font-mono-num font-bold text-[#0D8A6A]">{c.referenceCode}</td>
                          <td className="py-2 font-bold">{c.contactName}</td>
                          <td className="py-2 font-mono-num">{c.phoneDisplay}</td>
                          <td className="py-2">{c.sourceChannel} · {c.referrerName}</td>
                          <td className="py-2 text-end font-mono-num font-bold">{fmtAed(c.propertyPriceAed, true)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="lg:col-span-4 bw-card p-5 space-y-3">
              <h3 className="text-sm font-extrabold flex items-center gap-2">
                <AlertTriangle size={15} className="text-amber-500" /> Critical Alerts
              </h3>
              {data.criticalAlerts.length === 0 ? (
                <div className="text-xs text-[var(--bw-muted)] py-4">Zero unresolved critical alerts.</div>
              ) : (
                data.criticalAlerts.slice(0, 6).map((a: any) => (
                  <div key={a.id} className="p-3 rounded-xl border border-[var(--bw-line)] text-xs">
                    <div className="font-bold">{a.title}</div>
                    <div className="text-[11px] text-[var(--bw-muted)]">{a.body}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
