import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { verifyPassword } from '@/lib/auth/password';
import { attachSessionCookie, signSessionToken } from '@/lib/auth/session';
import { toSessionUser } from '@/lib/domain/staff';
import { logAudit } from '@/lib/auth/approvals';

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { email?: string; password?: string };
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    const db = await getSupabaseAdmin();
    const { data: user } = await db
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('active', true)
      .maybeSingle();

    if (!user || !verifyPassword(password, user.password_hash)) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    const sessionUser = toSessionUser(user);
    const token = signSessionToken({ userId: sessionUser.id, role: sessionUser.role, email: sessionUser.email });
    await logAudit(sessionUser, 'users', sessionUser.id, 'LOGIN_SUCCESS', { email });

    const res = NextResponse.json({ ok: true, user: sessionUser });
    return attachSessionCookie(res, token);
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Login failed' }, { status: 500 });
  }
}
