export interface AttachmentItem {
  id: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  scope: string;
  entityId: string;
  storagePath?: string | null;
  dataUrl?: string | null;
  downloadUrl?: string | null;
  uploadedBy?: string;
  uploadedByName?: string;
  uploadedAt: string;
}

export type TaskFollowUpChannel =
  | 'SIP Call'
  | 'WhatsApp'
  | 'Email'
  | 'Bank RM'
  | 'Client Meeting'
  | 'Internal Note';

export type TaskFollowUpStage =
  | 'New'
  | 'In Progress'
  | 'Waiting Client'
  | 'Waiting Bank'
  | 'Escalated'
  | 'Done';

export type TaskFollowUpOutcome =
  | 'Reached — Moving Forward'
  | 'Documents Requested'
  | 'Waiting on Bank RM'
  | 'No Answer — Retry Scheduled'
  | 'Rescheduled by Client'
  | 'Escalated to Owner'
  | 'Completed & Verified';

export interface TaskFollowUpEntry {
  id: string;
  createdAt: string;
  authorId: string;
  authorName: string;
  authorInitials: string;
  channel: TaskFollowUpChannel;
  outcome: TaskFollowUpOutcome;
  note: string;
  nextFollowUpDate?: string | null;
  nextFollowUpTime?: string | null;
  nextStage: TaskFollowUpStage;
  attachments: AttachmentItem[];
}

export interface TaskMetaRecord {
  taskId: string;
  followUpStage: TaskFollowUpStage;
  nextFollowUpDate?: string | null;
  nextFollowUpTime?: string | null;
  lastFollowUpAt?: string | null;
  contactName?: string;
  contactPhone?: string;
  bankName?: string;
  attachments: AttachmentItem[];
  followUps: TaskFollowUpEntry[];
}

export const TASK_FOLLOWUP_CHANNELS: readonly TaskFollowUpChannel[] = [
  'SIP Call',
  'WhatsApp',
  'Email',
  'Bank RM',
  'Client Meeting',
  'Internal Note',
];

export const TASK_FOLLOWUP_OUTCOMES: readonly TaskFollowUpOutcome[] = [
  'Reached — Moving Forward',
  'Documents Requested',
  'Waiting on Bank RM',
  'No Answer — Retry Scheduled',
  'Rescheduled by Client',
  'Escalated to Owner',
  'Completed & Verified',
];

export const TASK_FOLLOWUP_STAGES: readonly TaskFollowUpStage[] = [
  'New',
  'In Progress',
  'Waiting Client',
  'Waiting Bank',
  'Escalated',
  'Done',
];

export const QUICK_FOLLOWUP_TEMPLATES: ReadonlyArray<{
  label: string;
  channel: TaskFollowUpChannel;
  outcome: TaskFollowUpOutcome;
  nextStage: TaskFollowUpStage;
  note: string;
}> = [
  {
    label: 'Client promised docs today',
    channel: 'WhatsApp',
    outcome: 'Documents Requested',
    nextStage: 'Waiting Client',
    note: 'Sent document checklist on WhatsApp. Client confirmed they will send remaining papers today.',
  },
  {
    label: 'Chased Bank RM for update',
    channel: 'Bank RM',
    outcome: 'Waiting on Bank RM',
    nextStage: 'Waiting Bank',
    note: 'Followed up with Bank RM on credit underwriting / valuation queue. Awaiting written update.',
  },
  {
    label: 'No answer — retry next slot',
    channel: 'SIP Call',
    outcome: 'No Answer — Retry Scheduled',
    nextStage: 'In Progress',
    note: 'Called via Betterway SIP desk — no answer. Left a quick WhatsApp message and set next callback reminder.',
  },
  {
    label: 'Completed & verified',
    channel: 'Internal Note',
    outcome: 'Completed & Verified',
    nextStage: 'Done',
    note: 'All required items verified and logged cleanly. Task closed.',
  },
];

export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 KB';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function normalizeAttachmentUrl(att: AttachmentItem): string {
  if (att.dataUrl) return att.dataUrl;
  if (att.downloadUrl) return att.downloadUrl;
  return `/api/v1/attachments?scope=${encodeURIComponent(att.scope)}&entityId=${encodeURIComponent(att.entityId)}&id=${encodeURIComponent(att.id)}&download=1`;
}

/**
 * Uploads one or more File objects to `/api/v1/attachments` for a given scope + entityId.
 * Falls back gracefully to client-side metadata (with inline dataUrl for small files) if offline.
 */
export async function uploadFilesToScope(
  files: File[],
  scope: string,
  entityId: string,
): Promise<AttachmentItem[]> {
  if (!files || files.length === 0) return [];
  const formData = new FormData();
  formData.append('scope', scope);
  formData.append('entityId', entityId);
  for (const f of files) {
    formData.append('files', f, f.name);
  }
  const res = await fetch('/api/v1/attachments', {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const out = await res.json().catch(() => ({}));
    throw new Error(out.error || 'File upload failed');
  }
  const out = (await res.json()) as { attachments?: AttachmentItem[] };
  return out.attachments ?? [];
}

/**
 * Converts selected Files into instant local AttachmentItem objects (with Data URLs for files <= 2MB)
 * for local-state tables/forms that also optionally sync to `/api/v1/attachments`.
 */
export async function filesToLocalAttachments(
  files: File[],
  scope: string,
  entityId: string,
  uploadedByName?: string,
): Promise<AttachmentItem[]> {
  const results: AttachmentItem[] = [];
  for (const f of files) {
    let dataUrl: string | null = null;
    if (f.size <= 2 * 1024 * 1024 && typeof FileReader !== 'undefined') {
      dataUrl = await new Promise<string | null>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : null);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(f);
      });
    }
    results.push({
      id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: f.name,
      mimeType: f.type || 'application/octet-stream',
      sizeBytes: f.size,
      scope,
      entityId,
      dataUrl,
      uploadedByName: uploadedByName || 'Betterway Staff',
      uploadedAt: new Date().toISOString(),
    });
  }
  return results;
}
