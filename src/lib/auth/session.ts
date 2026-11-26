import crypto from 'node:crypto';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { SessionUser, UserRole } from '@/lib/domain/types';
import { toSessionUser } from '@/lib/domain/staff';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const SESSION_COOKIE_NAME = 'bw_os_session';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

export interface SessionTokenPayload {
  userId: string;
  role: UserRole;
  email: string;
  exp?: number;
}

function getSecret(): string {
  return process.env.BW_SESSION_SECRET || 'dev-betterway-session-secret-change-in-prod';
}

export function signSessionToken(payload: SessionTokenPayload): string {
  const body = {
    userId: payload.userId,
    role: payload.role,
    email: payload.email,
    exp: payload.exp ?? Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  };
  const encoded = Buffer.from(JSON.stringify(body), 'utf8').toString('base64url');
  const sig = crypto.createHmac('sha256', getSecret()).update(encoded).digest('base64url');
  return `${encoded}.${sig}`;
}

export function verifySessionToken(token: string | null | undefined): SessionTokenPayload | null {
  if (!token || !token.includes('.')) return null;
  const [encoded, sig] = token.split('.');
  if (!encoded || !sig) return null;
  const expected = crypto.createHmac('sha256', getSecret()).update(encoded).digest('base64url');
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as SessionTokenPayload;
    if (!parsed.userId || !parsed.role || !parsed.email) return null;
    if (parsed.exp && parsed.exp < Math.floor(Date.now() / 1000)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function getCurrentSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const payload = verifySessionToken(raw);
  if (!payload) return null;

  const db = await getSupabaseAdmin();
  const { data } = await db
    .from('users')
    .select('id,emp_code,slug,name,name_ar,email,phone,role,tier,designation,department,avatar_url,portrait_url,initials,active')
    .eq('id', payload.userId)
    .eq('active', true)
    .maybeSingle();

  if (!data) return null;
  return toSessionUser(data);
}

export async function requireSession(): Promise<{ user: SessionUser } | { error: NextResponse }> {
  const user = await getCurrentSessionUser();
  if (!user) {
    return { error: NextResponse.json({ error: 'Authentication required' }, { status: 401 }) };
  }
  return { user };
}

export async function requireOwner(): Promise<{ user: SessionUser } | { error: NextResponse }> {
  const res = await requireSession();
  if ('error' in res) return res;
  if (res.user.role !== 'OWNER') {
    return {
      error: NextResponse.json(
        { error: 'OWNER_ONLY: Restricted strictly to Warda Kapadia & Shabib Siraj' },
        { status: 403 },
      ),
    };
  }
  return res;
}

export function attachSessionCookie(res: NextResponse, token: string): NextResponse {
  res.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  });
  return res;
}

export function clearSessionCookie(res: NextResponse): NextResponse {
  res.cookies.set(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return res;
}
