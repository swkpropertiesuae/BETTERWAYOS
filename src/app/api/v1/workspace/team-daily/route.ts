import { NextResponse } from 'next/server';
import { requireOwner } from '@/lib/auth/session';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { logAudit } from '@/lib/auth/approvals';
import { getFieldVerifiers, type FieldVerifierEntry } from '@/lib/workspace/verifiers';

function dubaiToday(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dubai' }).format(new Date());
}

export async function GET(req: Request) {
  const auth = await requireOwner();
  if ('error' in auth) return auth.error;

  const url = new URL(req.url);
  const dateStr = url.searchParams.get('date') || dubaiToday();
  const db = await getSupabaseAdmin();

  const [{ data: users }, { data: tasks }, { data: attendance }, verifiers] = await Promise.all([
    db
      .from('users')
      .select('id,emp_code,name,name_ar,email,phone,role,designation,department,avatar_url,initials,monthly_target_aed,active')
      .eq('active', true)
      .order('emp_code', { ascending: true }),
    db.from('tasks').select('*').order('due_date', { ascending: true }).limit(400),
    db
      .from('attendance_events')
      .select('user_id,event_type,event_time,is_late,late_minutes,source')
      .eq('event_date_dubai', dateStr)
      .order('event_time', { ascending: true }),
    getFieldVerifiers(),
  ]);

  const verifierIds = new Set(verifiers.map((v) => v.user_id));
  const allTasks = tasks ?? [];
  const allAtt = attendance ?? [];

  const staffBoard = (users ?? []).map((u) => {
    const mine = allTasks.filter((t) => t.assigned_to === u.id);
    const doneToday = mine.filter(
      (t) => t.status === 'Done' && (!t.completed_at || String(t.completed_at).slice(0, 10) === dateStr || t.due_date === dateStr),
    );
    const openToday = mine.filter((t) => t.status !== 'Done' && t.due_date <= dateStr);
    const upcoming = mine.filter((t) => t.status !== 'Done' && t.due_date > dateStr);
    const overdue = mine.filter((t) => t.status !== 'Done' && t.due_date < dateStr);
    const checkIn = allAtt.find((a) => a.user_id === u.id && a.event_type === 'CHECK_IN');

    return {
      ...u,
      isVerifier: u.role === 'OWNER' || verifierIds.has(u.id),
      isAssignedVerifier: verifierIds.has(u.id),
      checkedIn: Boolean(checkIn),
      checkInTime: checkIn?.event_time ?? null,
      isLate: Boolean(checkIn?.is_late),
      tasksToDoCount: openToday.length,
      tasksDoneTodayCount: doneToday.length,
      overdueCount: overdue.length,
      upcomingCount: upcoming.length,
      tasksToDo: openToday,
      tasksDoneToday: doneToday,
      upcomingTasks: upcoming,
      allTasks: mine,
    };
  });

  const summary = {
    date: dateStr,
    totalStaff: staffBoard.length,
    checkedInCount: staffBoard.filter((s) => s.checkedIn).length,
    totalTasksOpen: allTasks.filter((t) => t.status !== 'Done').length,
    totalTasksDone: allTasks.filter((t) => t.status === 'Done').length,
    totalOverdue: allTasks.filter((t) => t.status !== 'Done' && t.due_date < dateStr).length,
    verifierCount: verifiers.length,
  };

  return NextResponse.json({
    date: dateStr,
    summary,
    staffBoard,
    teamTasks: allTasks,
    verifiers,
  });
}

export async function POST(req: Request) {
  const auth = await requireOwner();
  if ('error' in auth) return auth.error;

  try {
    const body = await req.json();
    const db = await getSupabaseAdmin();
    const today = dubaiToday();

    if (body.action === 'toggle_task') {
      const taskId = String(body.taskId || '');
      const nextStatus = body.status === 'Done' ? 'Done' : 'Pending';
      const { data, error } = await db
        .from('tasks')
        .update({
          status: nextStatus,
          completed_at: nextStatus === 'Done' ? new Date().toISOString() : null,
        })
        .eq('id', taskId)
        .select('*')
        .single();
      if (error) throw new Error(error.message);
      await logAudit(auth.user, 'tasks', taskId, 'OWNER_TASK_TOGGLE', { status: nextStatus });
      return NextResponse.json({ ok: true, task: data });
    }

    if (body.action === 'toggle_verifier') {
      const targetUserId = String(body.userId || '');
      const enable = Boolean(body.enable);
      const { data: targetUser } = await db
        .from('users')
        .select('id,name,email,designation,role')
        .eq('id', targetUserId)
        .maybeSingle();
      if (!targetUser) return NextResponse.json({ error: 'Staff member not found' }, { status: 404 });

      const current = await getFieldVerifiers();
      let next: FieldVerifierEntry[];
      if (enable) {
        if (current.some((v) => v.user_id === targetUser.id)) {
          next = current;
        } else {
          next = [
            ...current,
            {
              user_id: targetUser.id,
              name: targetUser.name,
              email: targetUser.email,
              designation: targetUser.designation,
              assigned_by: auth.user.name,
              assigned_at: new Date().toISOString(),
            },
          ];
        }
      } else {
        next = current.filter((v) => v.user_id !== targetUser.id);
      }

      const { error } = await db
        .from('app_settings')
        .upsert({ key: 'owner:field_verifiers', value: { verifiers: next }, updated_by: auth.user.id, updated_at: new Date().toISOString() });
      if (error) throw new Error(error.message);

      await db.from('notifications').insert({
        user_id: targetUser.id,
        title: enable ? 'Site-Visit Verification Authority Assigned' : 'Site-Visit Verification Authority Revoked',
        body: enable
          ? `${auth.user.name} assigned you as an authorised verifier for GPS-pinned Site Visit & Viewing forensic reports.`
          : `${auth.user.name} removed Site-Visit Verification Authority from your profile.`,
        severity: 'info',
        link_href: '/os/field-gps',
      });
      await logAudit(auth.user, 'app_settings', 'owner:field_verifiers', enable ? 'VERIFIER_ASSIGNED' : 'VERIFIER_REVOKED', {
        targetUserId: targetUser.id,
        targetName: targetUser.name,
      });

      return NextResponse.json({ ok: true, verifiers: next });
    }

    // Default: assign_task (supports individual OR entire team)
    const title = String(body.title || '').trim();
    if (!title) return NextResponse.json({ error: 'Task title is required' }, { status: 400 });

    const dueDate = String(body.dueDate || today);
    const priority = ['Critical', 'High', 'Normal', 'Low'].includes(body.priority) ? body.priority : 'High';
    const description = String(body.description || '');

    if (body.scope === 'team') {
      const { data: activeStaff } = await db.from('users').select('id').eq('active', true);
      const rows = (activeStaff ?? []).map((u) => ({
        title,
        description: description || 'Team-wide daily directive',
        priority,
        due_date: dueDate,
        assigned_to: u.id,
        created_by: auth.user.id,
        status: 'Pending',
      }));
      const { data, error } = await db.from('tasks').insert(rows).select('*');
      if (error) throw new Error(error.message);
      await logAudit(auth.user, 'tasks', 'TEAM_BROADCAST', 'OWNER_TEAM_TASK_ASSIGNED', { title, count: rows.length });
      return NextResponse.json({ ok: true, tasks: data ?? [], count: rows.length }, { status: 201 });
    }

    const assignedTo = String(body.assignedTo || auth.user.id);
    const { data, error } = await db
      .from('tasks')
      .insert({
        title,
        description,
        priority,
        due_date: dueDate,
        assigned_to: assignedTo,
        created_by: auth.user.id,
        status: 'Pending',
      })
      .select('*')
      .single();
    if (error) throw new Error(error.message);

    await db.from('notifications').insert({
      user_id: assignedTo,
      title: `New Executive Task (${priority})`,
      body: `${auth.user.name} assigned: ${title} (Due ${dueDate})`,
      severity: priority === 'Critical' ? 'warning' : 'info',
      link_href: '/os/dashboard',
    });
    await logAudit(auth.user, 'tasks', data.id, 'OWNER_TASK_ASSIGNED', { title, assignedTo });
    return NextResponse.json({ ok: true, task: data }, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Team daily error' }, { status: 400 });
  }
}
