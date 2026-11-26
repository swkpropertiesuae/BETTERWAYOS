import crypto from 'node:crypto';
import type { MasterRegistryKey, SessionUser } from '@/lib/domain/types';
import { getMasterRegistry, MASTER_REGISTRIES } from '@/lib/domain/masters';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { createOwnerApproval, decideOwnerApproval, logAudit } from '@/lib/auth/approvals';
import { getCapabilitiesForRole } from '@/lib/auth/rbac';
import { maskPhoneForRole } from '@/lib/auth/masking';

const PROTECTED_EMPLOYEE_FIELDS = new Set(['role', 'basic_salary_aed', 'monthly_target_aed', 'password_hash']);

export interface MasterWriteResult {
  mode: 'COMMITTED' | 'QUEUED_FOR_OWNER_APPROVAL';
  record?: Record<string, unknown>;
  changeRequestId?: string;
}

export async function getMasterRegistryCounts(): Promise<Record<string, number>> {
  const db = await getSupabaseAdmin();
  const entries = await Promise.all(
    MASTER_REGISTRIES.map(async (reg) => {
      const { count } = await db.from(reg.table).select('*', { count: 'exact', head: true });
      return [reg.key, count ?? 0] as const;
    }),
  );
  return Object.fromEntries(entries);
}

export async function listMasterRecords(registryKey: MasterRegistryKey, user: SessionUser) {
  const def = getMasterRegistry(registryKey);
  if (!def) throw new Error(`Unknown master registry: ${registryKey}`);
  const caps = getCapabilitiesForRole(user.role);

  // Security & admin-only master registries
  const adminReadOnly = new Set(['office_branches', 'roles_permissions', 'lead_routing_rules', 'rera_brokers', 'chart_of_accounts']);
  if (adminReadOnly.has(registryKey) && user.role !== 'OWNER' && user.role !== 'OFFICE_ADMIN') {
    throw new Error(`FORBIDDEN: Master registry ${def.label} is restricted to Owners & Office Admin.`);
  }
  if ((registryKey === 'contacts' || registryKey === 'master_vault_index') && caps.pipelineScope === 'NONE') {
    throw new Error(`FORBIDDEN: ${def.label} is restricted to client advisory, operations & leadership.`);
  }

  const db = await getSupabaseAdmin();
  const selectCols =
    registryKey === 'employees'
      ? user.role === 'OWNER'
        ? 'id,emp_code,slug,name,name_ar,email,phone,role,tier,designation,department,avatar_url,portrait_url,initials,monthly_target_aed,basic_salary_aed,active'
        : 'id,emp_code,slug,name,name_ar,email,phone,role,tier,designation,department,avatar_url,portrait_url,initials,active'
      : '*';

  let q = db.from(def.table).select(selectCols);
  if (registryKey === 'contacts' && caps.pipelineScope === 'OWN') {
    q = q.eq('assigned_to', user.id);
  } else if (registryKey === 'master_vault_index' && caps.pipelineScope === 'OWN') {
    q = q.eq('uploaded_by', user.id);
  }

  const { data, error } = await q.limit(500);
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as unknown as Array<Record<string, unknown>>;

  if (registryKey === 'contacts' && !user.isOwner) {
    return rows.map((r) => ({
      ...r,
      phone: maskPhoneForRole(String(r.phone || ''), user, false),
    }));
  }
  return rows;
}

function sanitizePayloadForTable(registryKey: MasterRegistryKey, payload: Record<string, unknown>) {
  const clean: Record<string, unknown> = { ...payload };
  delete clean.password_hash;
  if (registryKey === 'employees') {
    delete clean.totp_secret;
  }
  return clean;
}

export async function writeMasterRecord(
  registryKey: MasterRegistryKey,
  action: 'CREATE' | 'UPDATE' | 'ARCHIVE',
  rawPayload: Record<string, unknown>,
  actor: SessionUser,
  recordId?: string,
  reason = '',
): Promise<MasterWriteResult> {
  const def = getMasterRegistry(registryKey);
  if (!def) throw new Error(`Unknown master registry: ${registryKey}`);

  const payload = sanitizePayloadForTable(registryKey, rawPayload);

  // Enforce strict RBAC + Security-Critical Master Protection
  if (actor.role !== 'OWNER') {
    if (def.writePolicy === 'OPERATIONAL_FREE_CREATE' && action === 'CREATE') {
      const caps = getCapabilitiesForRole(actor.role);
      if (caps.pipelineScope === 'NONE') {
        throw new Error(`FORBIDDEN: Your role cannot create ${def.label} records.`);
      }
      if (registryKey === 'master_vault_index') {
        payload.verified = false;
        payload.uploaded_by = actor.id;
      }
    } else if (actor.role !== 'OFFICE_ADMIN') {
      throw new Error(`FORBIDDEN: Only Owners (Warda & Shabib) or approval-gated Office Admin can modify Master Log (${registryKey}).`);
    } else {
      // Office Admin rules
      if (def.writePolicy === 'OWNER_ONLY') {
        throw new Error(
          `OWNER_ONLY_SECURITY_MASTER: Office Admin cannot alter ${def.label}. Strictly restricted to Warda Kapadia & Shabib Siraj.`,
        );
      }
      if (def.writePolicy === 'OWNER_ONLY_SALARY_ROLE') {
        const touchesProtected = Object.keys(payload).some((k) => PROTECTED_EMPLOYEE_FIELDS.has(k));
        if (touchesProtected || action === 'CREATE') {
          throw new Error(
            'OWNER_ONLY_SECURITY_MASTER: Office Admin cannot edit employee roles, targets, or salaries. Strictly restricted to Owners.',
          );
        }
      }

      // Queue Admin proposal in master_change_requests (NEVER mutate live table until Owner approves!)
      const db = await getSupabaseAdmin();
      let beforePayload: Record<string, unknown> | null = null;
      if (recordId) {
        const { data: before } = await db.from(def.table).select('*').eq('id', recordId).maybeSingle();
        beforePayload = (before as Record<string, unknown>) ?? null;
      }

      const { data: reqRow, error: reqErr } = await db
        .from('master_change_requests')
        .insert({
          registry_key: registryKey,
          action,
          record_id: recordId ?? null,
          before_payload: beforePayload,
          after_payload: payload,
          reason: reason || `Admin ${action} proposal on ${def.label}`,
          requested_by: actor.id,
          status: 'PENDING',
        })
        .select('*')
        .single();

      if (reqErr || !reqRow) throw new Error(`Failed to queue Master Log change: ${reqErr?.message}`);

      await createOwnerApproval({
        approvalKind: 'MASTER_CHANGE',
        referenceTable: 'master_change_requests',
        referenceId: reqRow.id,
        title: `Master Log ${action}: ${def.label}`,
        summary: `${actor.name} requested ${action} on ${def.label} (${String(payload.name || payload.code || recordId || '')}). Reason: ${reason || 'Master data update'}`,
        requestedBy: actor.id,
      });

      await logAudit(actor, 'master_change_requests', reqRow.id, 'ADMIN_MASTER_PROPOSAL', {
        registryKey,
        action,
        recordId,
      });

      return { mode: 'QUEUED_FOR_OWNER_APPROVAL', changeRequestId: reqRow.id };
    }
  }

  // Direct commit (OWNER, or OPERATIONAL_FREE_CREATE)
  const record = await commitMasterMutation(def.table, registryKey, action, payload, recordId);
  await logAudit(actor, def.table, String(record?.id ?? recordId ?? 'unknown'), `MASTER_${action}`, {
    registryKey,
  });
  return { mode: 'COMMITTED', record };
}

async function commitMasterMutation(
  table: string,
  registryKey: MasterRegistryKey,
  action: 'CREATE' | 'UPDATE' | 'ARCHIVE',
  payload: Record<string, unknown>,
  recordId?: string,
) {
  const db = await getSupabaseAdmin();
  if (action === 'CREATE') {
    const needsTextId = table !== 'case_study_scenarios';
    const row = {
      ...(needsTextId && !payload.id
        ? { id: `${registryKey.slice(0, 3).toUpperCase()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}` }
        : {}),
      ...payload,
    };
    const { data, error } = await db.from(table).insert(row).select('*').single();
    if (error) throw new Error(`Master CREATE failed on ${table}: ${error.message}`);
    return data as Record<string, unknown>;
  }

  if (!recordId) throw new Error('recordId is required for UPDATE or ARCHIVE');

  const patch = action === 'ARCHIVE' ? { status: 'Archived' } : payload;
  const { data, error } = await db.from(table).update(patch).eq('id', recordId).select('*').single();
  if (error) throw new Error(`Master ${action} failed on ${table}: ${error.message}`);
  return data as Record<string, unknown>;
}

export async function decideMasterChangeRequest(
  changeRequestId: string,
  owner: SessionUser,
  decision: 'APPROVED' | 'REJECTED',
  note = '',
) {
  if (owner.role !== 'OWNER') {
    throw new Error('FORBIDDEN: Only Owners (Warda Kapadia or Shabib Siraj) can approve Master Log changes.');
  }
  const db = await getSupabaseAdmin();
  const { data: reqRow, error: fetchErr } = await db
    .from('master_change_requests')
    .select('*')
    .eq('id', changeRequestId)
    .single();
  if (fetchErr || !reqRow) throw new Error('Master change request not found.');
  if (reqRow.status !== 'PENDING') throw new Error(`Change request already ${reqRow.status}.`);

  const def = getMasterRegistry(reqRow.registry_key);
  if (!def) throw new Error(`Invalid registry key: ${reqRow.registry_key}`);

  let committedRecord: Record<string, unknown> | null = null;
  if (decision === 'APPROVED') {
    committedRecord = await commitMasterMutation(
      def.table,
      def.key,
      reqRow.action,
      reqRow.after_payload as Record<string, unknown>,
      reqRow.record_id ?? undefined,
    );
  }

  const now = new Date().toISOString();
  const { data: updated, error: updErr } = await db
    .from('master_change_requests')
    .update({
      status: decision,
      decided_by: owner.id,
      decision_note: note,
      decided_at: now,
    })
    .eq('id', changeRequestId)
    .select('*')
    .single();
  if (updErr) throw new Error(updErr.message);

  // Sync linked owner_approvals row if present
  const { data: linkedApproval } = await db
    .from('owner_approvals')
    .select('id,status')
    .eq('reference_table', 'master_change_requests')
    .eq('reference_id', changeRequestId)
    .eq('status', 'PENDING')
    .maybeSingle();

  if (linkedApproval) {
    await decideOwnerApproval(linkedApproval.id, owner, decision, note);
  }

  await logAudit(owner, 'master_change_requests', changeRequestId, `MASTER_PROPOSAL_${decision}`, {
    registryKey: reqRow.registry_key,
    note,
  });

  return { ...updated, committedRecord };
}
