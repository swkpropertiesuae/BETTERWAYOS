import type { SessionUser } from '@/lib/domain/types';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export interface FieldVerifierEntry {
  user_id: string;
  name: string;
  email: string;
  designation: string;
  assigned_by: string;
  assigned_at: string;
}

export async function getFieldVerifiers(): Promise<FieldVerifierEntry[]> {
  const db = await getSupabaseAdmin();
  const { data } = await db
    .from('app_settings')
    .select('value')
    .eq('key', 'owner:field_verifiers')
    .maybeSingle();
  const raw = (data?.value as { verifiers?: FieldVerifierEntry[] } | null)?.verifiers;
  return Array.isArray(raw) ? raw : [];
}

/**
 * Owners (Warda Kapadia & Shabib Siraj) are always Verification Authorities.
 * Any active staff member explicitly assigned by an Owner in `owner:field_verifiers`
 * also receives authority to verify/flag GPS-pinned Mortgage Field Meeting reports.
 */
export async function isFieldVerificationAuthority(user: SessionUser): Promise<boolean> {
  if (user.role === 'OWNER') return true;
  const list = await getFieldVerifiers();
  return list.some((v) => v.user_id === user.id);
}
