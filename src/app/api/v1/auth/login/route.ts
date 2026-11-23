import { NextResponse } from 'next/server';
import { getDb } from '@/server/db';
import {
  checkAccountLockout,
  clearFailedLogins,
  createSession,
  extractClientIp,
  recordFailedLoginAttempt,
  recordLoginEvent,
  SESSION_COOKIE_NAME,
  validatePasswordStrength,
  verifyPassword,
  writeAuditLog,
  type UserRole,
} from '@/server/auth';
import { defaultHomeForRole } from '@/server/auth/request';
import { verifyTotp } from '@/server/auth/totp';
import { registerPartnerAgent, registerPortalBorrower } from '@/server/services/os-service';
import { normalizeLoginAlias } from '@/server/engines/swk-enterprise-engine';

export async function POST(req: Request) {
  const db = getDb();
  const contentType = req.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const body = isJson ? await req.json() : Object.fromEntries((await req.formData()).entries());
  const mode = String(body.mode || 'login');
  const clientIp = extractClientIp(req);
  const userAgent = req.headers.get('user-agent') || '';

  try {
    let userId = 0;
    let role: UserRole = 'SUPER_ADMIN';

    if (mode === 'register_partner') {
      const password = String(body.password || '');
      const weak = validatePasswordStrength(password);
      if (weak) throw new Error(weak);

      const reg = registerPartnerAgent(db, {
        companyName: String(body.companyName || ''),
        tradeLicenceNo: String(body.tradeLicenceNo || 'DED-PENDING'),
        reraOrn: String(body.reraOrn || ''),
        vatTrn15: String(body.vatTrn15 || ''),
        fullNameEn: String(body.fullNameEn || ''),
        fullNameAr: String(body.fullNameAr || ''),
        email: String(body.email || ''),
        phone: String(body.phone || ''),
        password,
        reraBrn: String(body.reraBrn || ''),
        brnExpiryDate: String(body.brnExpiryDate || '2027-12-31'),
        isAgencyAdmin: body.isAgencyAdmin === '1' || body.isAgencyAdmin === true,
      });
      userId = reg.user.id;
      role = reg.user.role;
      recordLoginEvent(db, { userId, email: reg.user.email, outcome: 'SUCCESS', ip: clientIp, userAgent });
    } else if (mode === 'register_borrower') {
      const password = String(body.password || '');
      const weak = validatePasswordStrength(password);
      if (weak) throw new Error(weak);

      const reg = registerPortalBorrower(db, {
        fullNameEn: String(body.fullNameEn || ''),
        fullNameAr: String(body.fullNameAr || ''),
        email: String(body.email || ''),
        phone: String(body.phone || ''),
        password,
        residencyType: (body.residencyType as 'EXPAT_RESIDENT') || 'EXPAT_RESIDENT',
        monthlyIncomeFils: Math.round(Number(body.monthlyIncomeAed || 30_000) * 100),
        purchasePriceFils: Math.round(Number(body.purchasePriceAed || 2_500_000) * 100),
        targetLoanFils: Math.round(Number(body.targetLoanAed || 2_000_000) * 100),
        communityName: String(body.communityName || 'Dubai Hills Estate'),
      });
      userId = reg.user.id;
      role = reg.user.role;
      recordLoginEvent(db, { userId, email: reg.user.email, outcome: 'SUCCESS', ip: clientIp, userAgent });
    } else {
      const email = normalizeLoginAlias(String(body.email || ''));
      const password = String(body.password || '');
      const row = db
        .prepare('SELECT id, role, password_hash, status, mfa_enabled, totp_secret FROM users WHERE lower(email) = ?')
        .get(email) as
        | { id: number; role: UserRole; password_hash: string; status: string; mfa_enabled: number; totp_secret: string }
        | undefined;

      if (!row) {
        recordLoginEvent(db, { email, outcome: 'NOT_FOUND', ip: clientIp, userAgent });
        if (isJson) {
          return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
        }
        return NextResponse.redirect(new URL('/login?error=Invalid+email+or+password', req.url), 303);
      }

      if (row.status !== 'ACTIVE') {
        recordLoginEvent(db, { userId: row.id, email, outcome: 'SUSPENDED', ip: clientIp, userAgent });
        const msg = 'This account is suspended. Contact Owner Shabib Siraj for reactivation.';
        if (isJson) return NextResponse.json({ error: msg }, { status: 403 });
        return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(msg)}`, req.url), 303);
      }

      const lockState = checkAccountLockout(db, row.id);
      if (lockState.locked) {
        recordLoginEvent(db, { userId: row.id, email, outcome: 'LOCKED', ip: clientIp, userAgent });
        const mins = Math.ceil(lockState.remainingSeconds / 60);
        const msg = `Account locked for ${mins} minute(s) after repeated failed sign-in attempts.`;
        if (isJson) {
          return NextResponse.json({ error: msg, lockedUntil: lockState.lockedUntil }, { status: 423 });
        }
        return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(msg)}`, req.url), 303);
      }

      if (!verifyPassword(password, row.password_hash)) {
        const attempt = recordFailedLoginAttempt(db, row.id);
        recordLoginEvent(db, {
          userId: row.id,
          email,
          outcome: attempt.locked ? 'LOCKED' : 'BAD_PASSWORD',
          ip: clientIp,
          userAgent,
        });
        const status = attempt.locked ? 423 : 401;
        const msg = attempt.locked
          ? 'Account locked for 15 minutes after 5 failed attempts.'
          : 'Invalid email or password.';
        if (isJson) return NextResponse.json({ error: msg }, { status });
        return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(msg)}`, req.url), 303);
      }

      if (row.mfa_enabled === 1) {
        const otp = String(body.otp || '').trim();
        if (!otp) {
          recordLoginEvent(db, { userId: row.id, email, outcome: 'MFA_REQUIRED', ip: clientIp, userAgent });
          if (isJson) {
            return NextResponse.json(
              { needsTotp: true, error: 'Enter your 6-digit authenticator code to continue.' },
              { status: 401 },
            );
          }
          return NextResponse.redirect(new URL('/login?error=Authenticator+code+required', req.url), 303);
        }
        if (!verifyTotp(row.totp_secret, otp)) {
          recordLoginEvent(db, { userId: row.id, email, outcome: 'MFA_FAILED', ip: clientIp, userAgent });
          writeAuditLog(db, { id: row.id, role: row.role }, 'sessions', row.id, 'USER_LOGIN_MFA_FAILED', null, { email }, clientIp);
          if (isJson) {
            return NextResponse.json({ needsTotp: true, error: 'Invalid 6-digit authenticator code.' }, { status: 401 });
          }
          return NextResponse.redirect(new URL('/login?error=Authenticator+code+wrong', req.url), 303);
        }
      }

      clearFailedLogins(db, row.id);
      userId = row.id;
      role = row.role;
      recordLoginEvent(db, { userId, email, outcome: 'SUCCESS', ip: clientIp, userAgent });
      writeAuditLog(db, { id: userId, role }, 'sessions', userId, 'USER_LOGIN', null, { email, mfa: row.mfa_enabled === 1 }, clientIp);
    }

    const token = createSession(db, userId, clientIp, userAgent);
    const target = defaultHomeForRole(role);

    const res = isJson
      ? NextResponse.json({ ok: true, redirectTo: target })
      : NextResponse.redirect(new URL(target, req.url), 303);

    res.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 14 * 86_400,
    });
    return res;
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Authentication failed';
    if (isJson) return NextResponse.json({ error: msg }, { status: 400 });
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(msg)}`, req.url), 303);
  }
}
