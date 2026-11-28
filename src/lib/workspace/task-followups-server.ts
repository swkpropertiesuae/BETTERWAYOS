import crypto from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { SessionUser } from '@/lib/domain/types';
import type {
  AttachmentItem,
  TaskFollowUpChannel,
  TaskFollowUpEntry,
  TaskFollowUpOutcome,
  TaskFollowUpStage,
  TaskMetaRecord,
} from './attachments-types';

const TASK_META_PREFIX = 'task_meta:';
const SCOPE_ATT_PREFIX = 'bw_attachments:';

export function taskMetaKey(taskId: string): string {
  return `${TASK_META_PREFIX}${taskId}`;
}

export function scopeAttachmentsKey(scope: string, entityId: string): string {
  const safeScope = scope.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 48) || 'general';
  const safeEntity = entityId.replace(/[^a-zA-Z0-9_.:-]/g, '_').slice(0, 96) || 'default';
  return `${SCOPE_ATT_PREFIX}${safeScope}:${safeEntity}`;
}

export function defaultTaskMeta(taskId: string, status?: string): TaskMetaRecord {
  return {
    taskId,
    followUpStage: status === 'Done' ? 'Done' : status === 'In Progress' ? 'In Progress' : 'New',
    nextFollowUpDate: null,
    nextFollowUpTime: null,
    lastFollowUpAt: null,
    attachments: [],
    followUps: [],
  };
}

export async function getTaskMeta(
  db: SupabaseClient,
  taskId: string,
  fallbackStatus?: string,
): Promise<TaskMetaRecord> {
  const { data } = await db
    .from('app_settings')
    .select('value')
    .eq('key', taskMetaKey(taskId))
    .maybeSingle();

  const base = defaultTaskMeta(taskId, fallbackStatus);
  if (!data?.value || typeof data.value !== 'object') return base;
  const raw = data.value as Partial<TaskMetaRecord>;
  return {
    ...base,
    ...raw,
    taskId,
    attachments: Array.isArray(raw.attachments) ? raw.attachments : [],
    followUps: Array.isArray(raw.followUps) ? raw.followUps : [],
  };
}

export async function saveTaskMeta(
  db: SupabaseClient,
  meta: TaskMetaRecord,
  updatedBy: string,
): Promise<TaskMetaRecord> {
  const { error } = await db.from('app_settings').upsert({
    key: taskMetaKey(meta.taskId),
    value: meta,
    updated_by: updatedBy,
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
  return meta;
}

export async function hydrateTasksWithMeta<T extends { id: string; status?: string }>(
  db: SupabaseClient,
  tasks: T[],
): Promise<Array<T & {
  followUpStage: TaskFollowUpStage;
  nextFollowUpDate: string | null;
  nextFollowUpTime: string | null;
  lastFollowUpAt: string | null;
  contactName: string;
  contactPhone: string;
  bankName: string;
  attachments: AttachmentItem[];
  followUps: TaskFollowUpEntry[];
  followUpCount: number;
  attachmentCount: number;
}>> {
  if (!tasks || tasks.length === 0) return [];
  const keys = tasks.map((t) => taskMetaKey(t.id));
  const { data } = await db
    .from('app_settings')
    .select('key,value')
    .in('key', keys);

  const metaByKey = new Map<string, Partial<TaskMetaRecord>>();
  for (const row of data ?? []) {
    if (row?.key && row?.value && typeof row.value === 'object') {
      metaByKey.set(String(row.key), row.value as Partial<TaskMetaRecord>);
    }
  }

  return tasks.map((t) => {
    const raw = metaByKey.get(taskMetaKey(t.id));
    const base = defaultTaskMeta(t.id, t.status);
    const attachments = Array.isArray(raw?.attachments) ? raw.attachments : [];
    const followUps = Array.isArray(raw?.followUps) ? raw.followUps : [];
    const followUpStage: TaskFollowUpStage =
      t.status === 'Done'
        ? 'Done'
        : raw?.followUpStage && raw.followUpStage !== 'Done'
          ? raw.followUpStage
          : base.followUpStage;

    const totalAttachments =
      attachments.length + followUps.reduce((s, f) => s + (Array.isArray(f.attachments) ? f.attachments.length : 0), 0);

    return {
      ...t,
      followUpStage,
      nextFollowUpDate: raw?.nextFollowUpDate ?? null,
      nextFollowUpTime: raw?.nextFollowUpTime ?? null,
      lastFollowUpAt: raw?.lastFollowUpAt ?? null,
      contactName: raw?.contactName ?? '',
      contactPhone: raw?.contactPhone ?? '',
      bankName: raw?.bankName ?? '',
      attachments,
      followUps,
      followUpCount: followUps.length,
      attachmentCount: totalAttachments,
    };
  });
}

export async function appendTaskFollowUp(
  db: SupabaseClient,
  taskId: string,
  user: SessionUser,
  input: {
    channel: TaskFollowUpChannel;
    outcome: TaskFollowUpOutcome;
    note: string;
    nextFollowUpDate?: string | null;
    nextFollowUpTime?: string | null;
    nextStage: TaskFollowUpStage;
    attachments?: AttachmentItem[];
    contactName?: string;
    contactPhone?: string;
    bankName?: string;
  },
): Promise<{ meta: TaskMetaRecord; entry: TaskFollowUpEntry }> {
  const existing = await getTaskMeta(db, taskId);
  const nowIso = new Date().toISOString();
  const entry: TaskFollowUpEntry = {
    id: `fu-${crypto.randomBytes(4).toString('hex')}`,
    createdAt: nowIso,
    authorId: user.id,
    authorName: user.name,
    authorInitials: user.initials || user.name.slice(0, 2).toUpperCase(),
    channel: input.channel,
    outcome: input.outcome,
    note: input.note.trim(),
    nextFollowUpDate: input.nextFollowUpDate || null,
    nextFollowUpTime: input.nextFollowUpTime || null,
    nextStage: input.nextStage,
    attachments: input.attachments ?? [],
  };

  const updated: TaskMetaRecord = {
    ...existing,
    followUpStage: input.nextStage,
    nextFollowUpDate: input.nextStage === 'Done' ? null : (input.nextFollowUpDate ?? existing.nextFollowUpDate ?? null),
    nextFollowUpTime: input.nextStage === 'Done' ? null : (input.nextFollowUpTime ?? existing.nextFollowUpTime ?? null),
    lastFollowUpAt: nowIso,
    contactName: input.contactName !== undefined ? input.contactName : existing.contactName,
    contactPhone: input.contactPhone !== undefined ? input.contactPhone : existing.contactPhone,
    bankName: input.bankName !== undefined ? input.bankName : existing.bankName,
    followUps: [entry, ...existing.followUps].slice(0, 100),
  };

  await saveTaskMeta(db, updated, user.id);
  return { meta: updated, entry };
}

export async function listScopeAttachments(
  db: SupabaseClient,
  scope: string,
  entityId: string,
): Promise<AttachmentItem[]> {
  if (scope === 'task') {
    const meta = await getTaskMeta(db, entityId);
    return meta.attachments;
  }
  const { data } = await db
    .from('app_settings')
    .select('value')
    .eq('key', scopeAttachmentsKey(scope, entityId))
    .maybeSingle();
  const val = data?.value as { attachments?: AttachmentItem[] } | null;
  return Array.isArray(val?.attachments) ? val.attachments : [];
}

export async function saveScopeAttachments(
  db: SupabaseClient,
  scope: string,
  entityId: string,
  newItems: AttachmentItem[],
  userId: string,
): Promise<AttachmentItem[]> {
  if (scope === 'task') {
    const meta = await getTaskMeta(db, entityId);
    const merged = [...newItems, ...meta.attachments].slice(0, 50);
    await saveTaskMeta(db, { ...meta, attachments: merged }, userId);
    return merged;
  }
  const existing = await listScopeAttachments(db, scope, entityId);
  const merged = [...newItems, ...existing].slice(0, 50);
  const { error } = await db.from('app_settings').upsert({
    key: scopeAttachmentsKey(scope, entityId),
    value: { scope, entityId, attachments: merged },
    updated_by: userId,
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
  return merged;
}

export async function deleteScopeAttachment(
  db: SupabaseClient,
  scope: string,
  entityId: string,
  attachmentId: string,
  userId: string,
): Promise<AttachmentItem[]> {
  if (scope === 'task') {
    const meta = await getTaskMeta(db, entityId);
    const next = meta.attachments.filter((a) => a.id !== attachmentId);
    await saveTaskMeta(db, { ...meta, attachments: next }, userId);
    return next;
  }
  const existing = await listScopeAttachments(db, scope, entityId);
  const next = existing.filter((a) => a.id !== attachmentId);
  const { error } = await db.from('app_settings').upsert({
    key: scopeAttachmentsKey(scope, entityId),
    value: { scope, entityId, attachments: next },
    updated_by: userId,
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
  return next;
}
