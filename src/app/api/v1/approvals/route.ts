import { NextResponse } from 'next/server';
import { requireOwner } from '@/lib/auth/session';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export async function GET() {
  const auth = await requireOwner();
  if ('error' in auth) return auth.error;

  const db = await getSupabaseAdmin();
  const { data: approvals } = await db
    .from('owner_approvals')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);
  const { data: masterRequests } = await db
    .from('master_change_requests')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  return NextResponse.json({
    approvals: approvals ?? [],
    masterRequests: masterRequests ?? [],
  });
}
