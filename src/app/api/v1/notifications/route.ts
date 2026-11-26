import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/session';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export async function GET() {
  const auth = await requireSession();
  if ('error' in auth) return auth.error;
  const db = await getSupabaseAdmin();
  const { data } = await db
    .from('notifications')
    .select('*')
    .eq('recipient_user_id', auth.user.id)
    .order('created_at', { ascending: false })
    .limit(40);
  return NextResponse.json({ notifications: data ?? [] });
}

export async function POST() {
  const auth = await requireSession();
  if ('error' in auth) return auth.error;
  const db = await getSupabaseAdmin();
  await db.from('notifications').update({ is_read: true }).eq('recipient_user_id', auth.user.id);
  return NextResponse.json({ ok: true });
}
