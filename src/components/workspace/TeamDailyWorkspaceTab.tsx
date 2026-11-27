'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, Circle, Plus, ShieldCheck, Users } from 'lucide-react';
import { useOs } from '@/components/os/OsProvider';
import { MetricTile, StaffAvatar, StatusPill } from '@/components/os/UiKit';

export function TeamDailyWorkspaceTab() {
  const { toast } = useOs();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedStaffId, setSelectedStaffId] = useState<string>('ALL');
  const [date, setDate] = useState(() => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dubai' }).format(new Date()));

  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskPriority, setTaskPriority] = useState<'Critical' | 'High' | 'Normal' | 'Low'>('High');
  const [taskScope, setTaskScope] = useState<'individual' | 'team'>('individual');
  const [assignToId, setAssignToId] = useState('USR-07');
  const [taskDue, setTaskDue] = useState(() => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dubai' }).format(new Date()));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/v1/workspace/team-daily?date=${encodeURIComponent(date)}`, { cache: 'no-store' });
      if (r.ok) setData(await r.json());
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    void load();
  }, [load]);

  const assignTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    const r = await fetch('/api/v1/workspace/team-daily', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'assign_task',
        scope: taskScope,
        assignedTo: assignToId,
        title: taskTitle,
        description: taskDesc,
        priority: taskPriority,
        dueDate: taskDue,
      }),
    });
    const out = await r.json();
    if (!r.ok) {
      toast(out.error || 'Failed to assign task', 'err');
      return;
    }
    toast(taskScope === 'team' ? `Assigned to all ${out.count} team members!` : 'Task assigned cleanly!');
    setTaskTitle('');
    setTaskDesc('');
    await load();
  };

  const toggleTask = async (taskId: string, currentStatus: string) => {
    const next = currentStatus === 'Done' ? 'Todo' : 'Done';
    const r = await fetch('/api/v1/workspace/team-daily', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'toggle_task', taskId, status: next }),
    });
    if (r.ok) {
      toast(next === 'Done' ? 'Task marked Done for the day!' : 'Task reopened');
      await load();
    } else {
      const out = await r.json().catch(() => ({}));
      toast(out.error || 'Failed to update task status', 'err');
    }
  };

  const toggleVerifier = async (userId: string, currentlyEnabled: boolean) => {
    const r = await fetch('/api/v1/workspace/team-daily', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'toggle_verifier', userId, enable: !currentlyEnabled }),
    });
    const out = await r.json();
    if (!r.ok) {
      toast(out.error || 'Failed to update verifier authority', 'err');
      return;
    }
    toast(!currentlyEnabled ? 'Assigned as Site-Visit Verification Authority!' : 'Verification Authority removed');
    await load();
  };

  if (loading && !data) {
    return <div className="bw-card p-8 text-center text-xs text-[var(--bw-muted)]">Loading Team &amp; Daily To-Do Board...</div>;
  }

  const staffBoard: any[] = data?.staffBoard ?? [];
  const selectedStaff = staffBoard.find((s) => s.id === selectedStaffId);
  const displayedTasks: any[] = selectedStaff ? selectedStaff.allTasks : data?.teamTasks ?? [];

  return (
    <div className="space-y-5">
      {/* Top KPI Summary & Date Picker */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-extrabold flex items-center gap-2">
            <Users size={16} className="text-[#0D8A6A]" /> Team Directory, Job Roles, Daily To-Do &amp; Verification Authority
          </h2>
          <p className="text-xs text-[var(--bw-muted)]">
            Review every staff member&apos;s exact role, tasks to do vs. tasks completed today, assign individual/team directives, and delegate Site-Visit Verification Authority.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <label className="font-bold text-[var(--bw-muted)]">Dubai Date:</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="h-9 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-card)] font-mono-num"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <MetricTile label="Active Team Roster" value={data?.summary?.totalStaff ?? 9} hint="Official Betterway staff" tone="navy" />
        <MetricTile label="Checked In Today" value={`${data?.summary?.checkedInCount ?? 0} / ${data?.summary?.totalStaff ?? 9}`} hint="Oud Metha QR attendance" tone="emerald" />
        <MetricTile label="Tasks To Be Done" value={data?.summary?.totalTasksOpen ?? 0} hint={`${data?.summary?.totalOverdue ?? 0} overdue`} tone="gold" />
        <MetricTile label="Tasks Done Today" value={data?.summary?.totalTasksDone ?? 0} hint="Completed checklist items" tone="emerald" />
        <MetricTile label="Assigned Verifiers" value={data?.summary?.verifierCount ?? 0} hint="Plus Warda & Shabib" tone="navy" />
      </div>

      {/* Staff Roster Matrix with Job Roles, Daily Progress & Verification Authority Toggle */}
      <div className="bw-card p-5 space-y-3 overflow-x-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-extrabold">Betterway Staff Performance &amp; Site-Visit Verification Authority</h3>
          <span className="text-[11px] text-[var(--bw-muted)]">Click any row to filter their personal To-Do list below</span>
        </div>
        <table className="w-full text-xs text-start min-w-[780px]">
          <thead>
            <tr className="border-b border-[var(--bw-line)] text-[10.5px] uppercase tracking-wider text-[var(--bw-muted)]">
              <th className="py-2.5 text-start">Staff &amp; Job Role</th>
              <th className="py-2.5 text-start">Department</th>
              <th className="py-2.5 text-center">Office Check-In</th>
              <th className="py-2.5 text-center">To Do Today</th>
              <th className="py-2.5 text-center">Done Today</th>
              <th className="py-2.5 text-end">Site-Visit Verifier Authority</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--bw-line)]">
            {staffBoard.map((s) => (
              <tr
                key={s.id}
                onClick={() => setSelectedStaffId(selectedStaffId === s.id ? 'ALL' : s.id)}
                className={`cursor-pointer transition ${
                  selectedStaffId === s.id ? 'bg-[#0D8A6A]/10' : 'hover:bg-[var(--bw-bg)]/70'
                }`}
              >
                <td className="py-3 pe-3">
                  <div className="flex items-center gap-2.5">
                    <StaffAvatar name={s.name} avatarUrl={s.avatar_url} initials={s.initials} size="sm" />
                    <div>
                      <div className="font-bold flex items-center gap-1.5">
                        {s.name} <span className="font-mono-num text-[10px] text-[var(--bw-muted)]">{s.emp_code}</span>
                      </div>
                      <div className="text-[11px] text-[#0D8A6A] font-semibold">{s.designation}</div>
                    </div>
                  </div>
                </td>
                <td className="py-3 text-[var(--bw-muted)]">{s.department}</td>
                <td className="py-3 text-center">
                  {s.checkedIn ? (
                    <StatusPill label={s.isLate ? 'Checked In (Late)' : 'Present'} tone={s.isLate ? 'gold' : 'emerald'} />
                  ) : (
                    <StatusPill label="Not Checked In" tone="slate" />
                  )}
                </td>
                <td className="py-3 text-center font-mono-num font-bold text-amber-600">{s.tasksToDoCount}</td>
                <td className="py-3 text-center font-mono-num font-bold text-[#0D8A6A]">{s.tasksDoneTodayCount}</td>
                <td className="py-3 text-end" onClick={(e) => e.stopPropagation()}>
                  {s.role === 'OWNER' ? (
                    <StatusPill label="Owner Authority (Permanent)" tone="gold" />
                  ) : (
                    <button
                      type="button"
                      onClick={() => void toggleVerifier(s.id, Boolean(s.isAssignedVerifier))}
                      className={`px-3 py-1.5 rounded-full text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer transition ${
                        s.isAssignedVerifier
                          ? 'bg-[#0D8A6A] text-white'
                          : 'border border-[var(--bw-line)] bg-[var(--bw-bg)] hover:border-[#0D8A6A]'
                      }`}
                    >
                      <ShieldCheck size={12} />
                      {s.isAssignedVerifier ? 'Authorised Verifier ✓' : 'Assign Authority'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Individual & Team To-Do List + Quick Assign Form */}
      <div className="grid lg:grid-cols-12 gap-5">
        <form onSubmit={assignTask} className="lg:col-span-4 bw-card p-5 space-y-3 text-xs">
          <h3 className="text-sm font-extrabold flex items-center gap-1.5">
            <Plus size={15} className="text-[#0D8A6A]" /> Assign Daily Task (Individual or Team)
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setTaskScope('individual')}
              className={`py-2 rounded-xl font-bold border cursor-pointer ${
                taskScope === 'individual' ? 'bg-[#0A1128] text-[#FCF1B7] border-[#0A1128]' : 'border-[var(--bw-line)]'
              }`}
            >
              Individual Staff
            </button>
            <button
              type="button"
              onClick={() => setTaskScope('team')}
              className={`py-2 rounded-xl font-bold border cursor-pointer ${
                taskScope === 'team' ? 'bg-[#0A1128] text-[#FCF1B7] border-[#0A1128]' : 'border-[var(--bw-line)]'
              }`}
            >
              Entire Team
            </button>
          </div>

          {taskScope === 'individual' && (
            <div>
              <label className="font-bold block mb-1">Assign To</label>
              <select
                value={assignToId}
                onChange={(e) => setAssignToId(e.target.value)}
                className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-bg)]"
              >
                {staffBoard.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} — {s.designation}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="font-bold block mb-1">Task Title *</label>
            <input
              required
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              placeholder="e.g. Collect signed FOL & valuation receipt before 4 PM"
              className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-bg)]"
            />
          </div>
          <div>
            <label className="font-bold block mb-1">Instructions / Details</label>
            <textarea
              rows={2}
              value={taskDesc}
              onChange={(e) => setTaskDesc(e.target.value)}
              placeholder="Client name, bank RM, or target deliverable..."
              className="w-full p-2.5 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-bg)]"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-bold block mb-1">Priority</label>
              <select
                value={taskPriority}
                onChange={(e) => setTaskPriority(e.target.value as any)}
                className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-bg)]"
              >
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Normal">Normal</option>
                <option value="Low">Low</option>
              </select>
            </div>
            <div>
              <label className="font-bold block mb-1">Due Date</label>
              <input
                type="date"
                value={taskDue}
                onChange={(e) => setTaskDue(e.target.value)}
                className="w-full h-9 px-3 rounded-xl border border-[var(--bw-line)] bg-[var(--bw-bg)] font-mono-num"
              />
            </div>
          </div>
          <button type="submit" className="w-full h-10 rounded-full bg-[#0D8A6A] hover:bg-[#10a17c] text-white font-extrabold cursor-pointer">
            {taskScope === 'team' ? 'Assign To All Active Staff' : 'Add to Individual To-Do List'}
          </button>
        </form>

        <div className="lg:col-span-8 bw-card p-5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-extrabold">
                {selectedStaff ? `${selectedStaff.name}'s Personal To-Do List (${displayedTasks.length})` : `Company-Wide Team To-Do List (${displayedTasks.length})`}
              </h3>
              <p className="text-[11px] text-[var(--bw-muted)]">Click the checkmark circle to toggle Done / Pending live.</p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setSelectedStaffId('ALL')}
                className={`px-3 py-1 rounded-full text-[11px] font-bold cursor-pointer ${
                  selectedStaffId === 'ALL' ? 'bg-[#0A1128] text-[#FCF1B7]' : 'border border-[var(--bw-line)]'
                }`}
              >
                All Team
              </button>
              {staffBoard.slice(0, 6).map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSelectedStaffId(s.id)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer ${
                    selectedStaffId === s.id ? 'bg-[#0D8A6A] text-white' : 'border border-[var(--bw-line)]'
                  }`}
                >
                  {s.name.split(' ')[0]} ({s.tasksToDoCount})
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2 max-h-[420px] overflow-y-auto pe-1">
            {displayedTasks.length === 0 ? (
              <div className="py-10 text-center text-xs text-[var(--bw-muted)]">
                No tasks logged yet for this selection. Use the quick form on the left to assign today&apos;s priorities.
              </div>
            ) : (
              displayedTasks.map((t) => {
                const assignee = staffBoard.find((s) => s.id === t.assigned_to);
                const isDone = t.status === 'Done';
                return (
                  <div
                    key={t.id}
                    className={`p-3.5 rounded-2xl border flex items-start justify-between gap-3 text-xs ${
                      isDone ? 'bg-emerald-50/40 dark:bg-emerald-950/15 border-emerald-400/35 opacity-80' : 'bg-[var(--bw-bg)]/60 border-[var(--bw-line)]'
                    }`}
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <button
                        type="button"
                        onClick={() => void toggleTask(t.id, t.status)}
                        className="mt-0.5 text-[#0D8A6A] cursor-pointer shrink-0"
                        title="Toggle Done"
                      >
                        {isDone ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                      </button>
                      <div className="min-w-0">
                        <div className={`font-bold ${isDone ? 'line-through text-[var(--bw-muted)]' : ''}`}>{t.title}</div>
                        {t.description && <div className="text-[11px] text-[var(--bw-muted)] mt-0.5">{t.description}</div>}
                        <div className="text-[10.5px] text-[var(--bw-muted)] mt-1">
                          Assigned to <strong className="text-[var(--bw-ink)]">{assignee?.name || t.assigned_to}</strong> ({assignee?.designation || 'Staff'}) · Due{' '}
                          <span className="font-mono-num">{t.due_date}</span>
                        </div>
                      </div>
                    </div>
                    <StatusPill
                      label={isDone ? 'Done' : t.priority}
                      tone={isDone ? 'emerald' : t.priority === 'Critical' ? 'red' : t.priority === 'High' ? 'gold' : 'slate'}
                    />
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
