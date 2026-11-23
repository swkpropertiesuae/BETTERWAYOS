import { NextResponse } from 'next/server';
import { getDb } from '@/server/db';
import { createSession, extractClientIp, SESSION_COOKIE_NAME, writeAuditLog, type UserRole } from '@/server/auth';
import { defaultHomeForRole, getCurrentUser, LANG_COOKIE_NAME } from '@/server/auth/request';
import { normalizeLoginAlias } from '@/server/engines/swk-enterprise-engine';
import { getProductionSecurityStatus } from '@/server/engines/commercial-workflows-engine';

export async function POST(req: Request) {
  const db = getDb();
  const form = await req.formData();
  const action = String(form.get('action') || 'switch_role');
  const rawReturnTo = String(form.get('returnTo') || '');
  const safeReturnTo = rawReturnTo.startsWith('/') && !rawReturnTo.startsWith('//') ? rawReturnTo : '';

  if (action === 'set_lang') {
    const lang = String(form.get('lang') || 'en') === 'ar' ? 'ar' : 'en';
    const referer = req.headers.get('referer') || '';
    let fallbackDest = '/os';
    try {
      if (referer) {
        const refUrl = new URL(referer);
        const reqUrl = new URL(req.url);
        if (refUrl.origin === reqUrl.origin) {
          fallbackDest = refUrl.pathname + refUrl.search;
        }
      }
    } catch {
      fallbackDest = '/os';
    }
    const dest = safeReturnTo || fallbackDest;
    const res = NextResponse.redirect(new URL(dest, req.url), 303);
    res.cookies.set(LANG_COOKIE_NAME, lang, {
      path: '/',
      maxAge: 365 * 86_400,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });
    return res;
  }

  // Strictly block quick role switching in production; require explicit dev opt-in + authenticated SUPER_ADMIN.
  if (process.env.NODE_ENV === 'production' || process.env.BW_ENABLE_ROLE_SWITCHER !== '1') {
    return NextResponse.json(
      { error: 'Quick role switcher is disabled. Sign in with your account credentials.' },
      { status: 403 },
    );
  }

  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== 'SUPER_ADMIN') {
    return NextResponse.json(
      { error: 'Only an authenticated SUPER_ADMIN can use the development role switcher.' },
      { status: 403 },
    );
  }

  const prodStatus = getProductionSecurityStatus(db);
  if (prodStatus.productionLockEnabled) {
    return NextResponse.redirect(
      new URL('/os/security?error=Production+Security+Lock+is+active.+Role+switcher+is+disabled.', req.url),
      303,
    );
  }

  const email = normalizeLoginAlias(String(form.get('email') || ''));
  const user = db
    .prepare('SELECT id, role, preferred_lang FROM users WHERE lower(email) = ? AND status = ?')
    .get(email, 'ACTIVE') as { id: number; role: UserRole; preferred_lang: string } | undefined;

  if (!user) {
    return NextResponse.redirect(new URL('/login?error=Account+not+found', req.url), 303);
  }

  const ip = extractClientIp(req);
  const token = createSession(db, user.id, ip, 'dev-role-switcher');
  writeAuditLog(db, currentUser, 'sessions', user.id, 'DEV_ROLE_SWITCH', null, { targetEmail: email }, ip);
  const dest = safeReturnTo || defaultHomeForRole(user.role);
  const res = NextResponse.redirect(new URL(dest, req.url), 303);
  res.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
    path: '/',
    maxAge: 14 * 86_400,
  });
  return res;
}
