import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/session';
import { MASTER_CATEGORIES, MASTER_REGISTRIES } from '@/lib/domain/masters';
import { getMasterRegistryCounts } from '@/lib/masters/service';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export async function GET() {
  const auth = await requireSession();
  if ('error' in auth) return auth.error;

  const counts = await getMasterRegistryCounts();
  const db = await getSupabaseAdmin();
  const { count: pendingProposals } = await db
    .from('master_change_requests')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'PENDING');

  return NextResponse.json({
    categories: MASTER_CATEGORIES,
    registries: MASTER_REGISTRIES.map((r) => ({ ...r, count: counts[r.key] ?? 0 })),
    pendingProposals: pendingProposals ?? 0,
    canWriteDirect: auth.user.role === 'OWNER',
    canPropose: auth.user.role === 'OWNER' || auth.user.role === 'OFFICE_ADMIN',
  });
}
