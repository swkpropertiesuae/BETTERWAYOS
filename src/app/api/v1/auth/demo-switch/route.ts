import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { attachSessionCookie, signSessionToken } from '@/lib/auth/session';
import { toSessionUser } from '@/lib/domain/staff';

export async function POST(req: Request) {
  if (process.env.NEXT_PUBLIC_DEMO_MODE !== 'true') {
    return NextResponse.json({ error: 'Demo switcher is disabled in production.' }, { status: 403 });
  }
  const body = (await req.json()) as { email?: string };
  const email = String(body.email || '').trim().toLowerCase();
  const db = await getSupabaseAdmin();
  const { data: user } = await db.from('users').select('*').eq('email', email).eq('active', true).maybeSingle();
  if (!user) return NextResponse.json({ error: 'Account not found.' }, { status: 404 });

  const sessionUser = toSessionUser(user);
  const token = signSessionToken({ userId: sessionUser.id, role: sessionUser.role, email: sessionUser.email });
  return attachSessionCookie(NextResponse.json({ ok: true, user: sessionUser }), token);
}
