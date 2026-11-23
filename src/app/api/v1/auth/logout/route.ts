import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getDb } from '@/server/db';
import { revokeSession, SESSION_COOKIE_NAME } from '@/server/auth';

/**
 * POST-only session sign-out to prevent cross-site GET logout CSRF.
 */
export async function POST(req: Request) {
  const jar = await cookies();
  const raw = jar.get(SESSION_COOKIE_NAME)?.value;
  if (raw) {
    revokeSession(getDb(), raw);
  }
  const accept = req.headers.get('accept') || '';
  const isJson = accept.includes('application/json') || (req.headers.get('content-type') || '').includes('application/json');
  const res = isJson
    ? NextResponse.json({ ok: true, redirectTo: '/login' })
    : NextResponse.redirect(new URL('/login', req.url), 303);
  res.cookies.set(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
  return res;
}
