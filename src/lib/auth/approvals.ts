import type { ApprovalKind, ApprovalMode, SessionUser } from '@/lib/domain/types';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

const DUAL_APPROVAL_KINDS: readonly ApprovalKind[] = ['DELETE_PURGE', 'PAYOUT_RELEASE'];

export function approvalModeForKind(kind: ApprovalKind): ApprovalMode {
  return DUAL_APPROVAL_KINDS.includes(kind) ? '2_OF_2' : '1_OF_2';
}

export async function logAudit(
  actor: Pick<SessionUser, 'id' | 'name' | 'role'>,
  entityTable: string,
  entityId: string,
  action: string,
  details: Record<string, unknown> = {},
) {
  const db = await getSupabaseAdmin();
  await db.from('audit_events').insert({
    actor_id: actor.id,
    actor_name: actor.name,
    actor_role: actor.role,
    entity_table: entityTable,
    entity_id: entityId,
    action,
    details,
  });
}

export async function notifyOwners(
  title: string,
  body: string,
  href = '/os/executive',
  severity: 'info' | 'warning' | 'critical' = 'warning',
) {
  const db = await getSupabaseAdmin();
  await db.from('notifications').insert([
    { recipient_user_id: 'USR-01', severity, title, body, href },
    { recipient_user_id: 'USR-02', severity, title, body, href },
  ]);
}

export async function createOwnerApproval(params: {
  approvalKind: ApprovalKind;
  referenceTable: string;
  referenceId: string;
  title: string;
  summary: string;
  amountAed?: number;
  requestedBy: string;
}) {
  const db = await getSupabaseAdmin();
  const mode = approvalModeForKind(params.approvalKind);
  const { data, error } = await db
    .from('owner_approvals')
    .insert({
      approval_kind: params.approvalKind,
      approval_mode: mode,
      reference_table: params.referenceTable,
      reference_id: params.referenceId,
      title: params.title,
      summary: params.summary,
      amount_aed: params.amountAed ?? 0,
      requested_by: params.requestedBy,
      status: 'PENDING',
    })
    .select('*')
    .single();

  if (error || !data) throw new Error(`Failed to create approval: ${error?.message}`);

  await notifyOwners(
    `${mode === '2_OF_2' ? '[2-of-2 Dual Sign-Off]' : '[Owner Approval]'} ${params.title}`,
    params.summary,
    '/os/executive',
    mode === '2_OF_2' ? 'critical' : 'warning',
  );

  return data;
}

export async function decideOwnerApproval(
  approvalId: string,
  actor: SessionUser,
  decision: 'APPROVED' | 'REJECTED',
  note = '',
) {
  if (actor.role !== 'OWNER') {
    throw new Error('FORBIDDEN: Only Owners (Warda Kapadia or Shabib Siraj) can decide approvals.');
  }
  const db = await getSupabaseAdmin();
  const { data: existing, error: fetchErr } = await db
    .from('owner_approvals')
    .select('*')
    .eq('id', approvalId)
    .single();

  if (fetchErr || !existing) throw new Error('Approval record not found.');
  if (existing.status === 'APPROVED' || existing.status === 'REJECTED') {
    throw new Error(`Approval already finalized (${existing.status}).`);
  }

  const now = new Date().toISOString();

  if (decision === 'REJECTED') {
    const { data: updated, error } = await db
      .from('owner_approvals')
      .update({
        status: 'REJECTED',
        rejected_by: actor.id,
        rejected_at: now,
        rejection_note: note,
        updated_at: now,
      })
      .eq('id', approvalId)
      .eq('status', existing.status)
      .select('*')
      .single();
    if (error || !updated) throw new Error(error?.message || 'Approval state changed concurrently; refresh and retry.');
    await logAudit(actor, 'owner_approvals', approvalId, 'REJECTED', { note, kind: existing.approval_kind });
    return updated;
  }

  // APPROVED path
  if (existing.approval_mode === '1_OF_2') {
    const { data: updated, error } = await db
      .from('owner_approvals')
      .update({
        status: 'APPROVED',
        approver_1_id: actor.id,
        approver_1_at: now,
        approver_1_note: note,
        updated_at: now,
      })
      .eq('id', approvalId)
      .eq('status', existing.status)
      .select('*')
      .single();
    if (error || !updated) throw new Error(error?.message || 'Approval state changed concurrently; refresh and retry.');
    await logAudit(actor, 'owner_approvals', approvalId, 'APPROVED_1_OF_2', { note, kind: existing.approval_kind });
    return updated;
  }

  // Strict 2-of-2 Distinct Owner Sign-Off (Warda AND Shabib)
  if (!existing.approver_1_id) {
    const { data: updated, error } = await db
      .from('owner_approvals')
      .update({
        status: 'OWNER_1_APPROVED',
        approver_1_id: actor.id,
        approver_1_at: now,
        approver_1_note: note,
        updated_at: now,
      })
      .eq('id', approvalId)
      .eq('status', existing.status)
      .select('*')
      .single();
    if (error || !updated) throw new Error(error?.message || 'Approval state changed concurrently; refresh and retry.');
    await logAudit(actor, 'owner_approvals', approvalId, 'OWNER_1_APPROVED', { note, kind: existing.approval_kind });

    const otherOwnerId = actor.id === 'USR-01' ? 'USR-02' : 'USR-01';
    await db.from('notifications').insert({
      recipient_user_id: otherOwnerId,
      severity: 'critical',
      title: `[2nd Sign-Off Needed] ${existing.title}`,
      body: `${actor.name} completed 1st Owner sign-off. Your 2nd Owner approval is required to release.`,
      href: '/os/executive',
    });

    return updated;
  }

  if (existing.approver_1_id === actor.id) {
    throw new Error(
      'DUPLICATE_OWNER_APPROVAL: 2-of-2 approval requires the second co-owner (both Warda Kapadia and Shabib Siraj must sign off).',
    );
  }

  const { data: updated, error } = await db
    .from('owner_approvals')
    .update({
      status: 'APPROVED',
      approver_2_id: actor.id,
      approver_2_at: now,
      approver_2_note: note,
      updated_at: now,
    })
    .eq('id', approvalId)
    .eq('status', existing.status)
    .select('*')
    .single();
  if (error || !updated) throw new Error(error?.message || 'Approval state changed concurrently; refresh and retry.');
  await logAudit(actor, 'owner_approvals', approvalId, 'APPROVED_2_OF_2', { note, kind: existing.approval_kind });
  return updated;
}
