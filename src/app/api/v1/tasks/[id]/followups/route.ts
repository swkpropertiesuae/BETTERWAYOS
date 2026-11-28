import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/session';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { logAudit } from '@/lib/auth/approvals';
import {
  TASK_FOLLOWUP_CHANNELS,
  TASK_FOLLOWUP_OUTCOMES,
  TASK_FOLLOWUP_STAGES,
  type AttachmentItem,
  type TaskFollowUpChannel,
  type TaskFollowUpOutcome,
  type TaskFollowUpStage,
} from '@/lib/workspace/attachments-types';
import { appendTaskFollowUp, getTaskMeta } from '@/lib/workspace/task-followups-server';

function canManageTask(user: { id: string; role: string }, task: { assigned_to: string; created_by: string }): boolean {
  const isSupervisor =
    user.role === 'OWNER' ||
    user.role === 'OFFICE_ADMIN' ||
    user.role === 'TEAM_MANAGER' ||
    user.role === 'OPERATIONS_MANAGER';
  return isSupervisor || task.assigned_to === user.id || task.created_by === user.id;
}

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireSession();
  if ('error' in auth) return auth.error;

  const { id } = await ctx.params;
  const db = await getSupabaseAdmin();
  const { data: task } = await db.from('tasks').select('*').eq('id', id).maybeSingle();
  if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  if (!canManageTask(auth.user, task)) {
    return NextResponse.json({ error: 'FORBIDDEN: You do not have access to this task.' }, { status: 403 });
  }

  const meta = await getTaskMeta(db, id, task.status);
  return NextResponse.json({ task, meta });
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireSession();
  if ('error' in auth) return auth.error;

  const { id } = await ctx.params;
  const db = await getSupabaseAdmin();
  const { data: task } = await db.from('tasks').select('*').eq('id', id).maybeSingle();
  if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  if (!canManageTask(auth.user, task)) {
    return NextResponse.json({ error: 'FORBIDDEN: You do not have permission to follow up on this task.' }, { status: 403 });
  }

  try {
    const body = (await req.json()) as {
      channel?: TaskFollowUpChannel;
      outcome?: TaskFollowUpOutcome;
      note?: string;
      nextFollowUpDate?: string | null;
      nextFollowUpTime?: string | null;
      nextStage?: TaskFollowUpStage;
      attachments?: AttachmentItem[];
      contactName?: string;
      contactPhone?: string;
      bankName?: string;
      syncDueDate?: boolean;
    };

    const note = String(body.note || '').trim();
    if (!note) {
      return NextResponse.json({ error: 'Please write a short follow-up note first.' }, { status: 400 });
    }

    const channel: TaskFollowUpChannel =
      body.channel && TASK_FOLLOWUP_CHANNELS.includes(body.channel) ? body.channel : 'SIP Call';
    const outcome: TaskFollowUpOutcome =
      body.outcome && TASK_FOLLOWUP_OUTCOMES.includes(body.outcome)
        ? body.outcome
        : 'Reached — Moving Forward';
    const nextStage: TaskFollowUpStage =
      body.nextStage && TASK_FOLLOWUP_STAGES.includes(body.nextStage) ? body.nextStage : 'In Progress';

    const { meta, entry } = await appendTaskFollowUp(db, id, auth.user, {
      channel,
      outcome,
      note,
      nextFollowUpDate: body.nextFollowUpDate || null,
      nextFollowUpTime: body.nextFollowUpTime || null,
      nextStage,
      attachments: Array.isArray(body.attachments) ? body.attachments : [],
      contactName: body.contactName,
      contactPhone: body.contactPhone,
      bankName: body.bankName,
    });

    const nextStatus = nextStage === 'Done' ? 'Done' : nextStage === 'New' ? 'Todo' : 'In Progress';
    const taskPatch: Record<string, unknown> = {
      status: nextStatus,
      completed_at: nextStatus === 'Done' ? new Date().toISOString() : null,
    };
    if (body.syncDueDate && body.nextFollowUpDate && /^\d{4}-\d{2}-\d{2}$/.test(body.nextFollowUpDate)) {
      taskPatch.due_date = body.nextFollowUpDate;
    }

    const { data: updatedTask } = await db
      .from('tasks')
      .update(taskPatch)
      .eq('id', id)
      .select('*')
      .single();

    if (nextStage === 'Escalated') {
      const { data: owners } = await db.from('users').select('id').eq('role', 'OWNER').eq('active', true);
      const notifs = (owners ?? [])
        .filter((o) => o.id !== auth.user.id)
        .map((o) => ({
          recipient_user_id: o.id,
          severity: 'warning',
          title: `Task Escalated: ${task.title}`,
          body: `${auth.user.name} (${channel}): ${note}`,
          href: '/os/place',
        }));
      if (notifs.length > 0) {
        await db.from('notifications').insert(notifs);
      }
    }

    await logAudit(auth.user, 'tasks', id, 'TASK_FOLLOWUP_LOGGED', {
      channel,
      outcome,
      nextStage,
      nextFollowUpDate: meta.nextFollowUpDate,
      attachments: entry.attachments.length,
    });

    return NextResponse.json({ ok: true, task: updatedTask ?? task, meta, entry }, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Follow-up save failed' },
      { status: 400 },
    );
  }
}
