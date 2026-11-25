import crypto from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';
import { db } from './db.js';

const TOKEN_SECRET = process.env.BETTERWAY_SESSION_SECRET || 'betterway-mortgages-os-dubai-2026-hmac-secret-key';

export interface AuthUser {
  id: string;
  emp_code: string;
  slug: string;
  name: string;
  name_ar: string;
  email: string;
  phone: string;
  role: string;
  tier: string;
  designation: string;
  department: string;
  avatar: string | null;
  portrait: string | null;
  initials: string;
  is_elevated: number;
  can_approve_deletions: number;
  can_approve_payouts: number;
  can_lock_wifi: number;
  can_print_qr: number;
  can_approve_rates: number;
  monthly_target_aed: number;
}

export interface AuthedRequest extends Request {
  user?: AuthUser;
}

export function signSessionToken(userId: string): string {
  const exp = Date.now() + 7 * 24 * 3600 * 1000;
  const payload = Buffer.from(JSON.stringify({ uid: userId, exp })).toString('base64url');
  const sig = crypto.createHmac('sha256', TOKEN_SECRET).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

export function verifySessionToken(token: string): { uid: string; exp: number } | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payload, sig] = parts;
  const expected = crypto.createHmac('sha256', TOKEN_SECRET).update(payload!).digest('base64url');
  if (sig!.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(sig!), Buffer.from(expected))) return null;
  try {
    const parsed = JSON.parse(Buffer.from(payload!, 'base64url').toString('utf8'));
    if (!parsed.uid || Date.now() > Number(parsed.exp)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function getUserById(id: string): AuthUser | null {
  const row = db
    .prepare(
      `SELECT id, emp_code, slug, name, name_ar, email, phone, role, tier, designation, department,
              avatar, portrait, initials, is_elevated, can_approve_deletions, can_approve_payouts,
              can_lock_wifi, can_print_qr, can_approve_rates, monthly_target_aed
       FROM users WHERE id = ? AND active = 1`,
    )
    .get(id) as AuthUser | undefined;
  return row ?? null;
}

export function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }
  const cookie = req.headers.cookie;
  if (cookie) {
    const match = cookie.match(/bw_session=([^;]+)/);
    if (match) return decodeURIComponent(match[1]!);
  }
  const qToken = typeof req.query.token === 'string' ? req.query.token : null;
  return qToken;
}

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (!token) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  const parsed = verifySessionToken(token);
  if (!parsed) {
    res.status(401).json({ error: 'Session expired or invalid' });
    return;
  }
  const user = getUserById(parsed.uid);
  if (!user) {
    res.status(401).json({ error: 'Account inactive or not found' });
    return;
  }
  req.user = user;
  next();
}

export function requireOwner(req: AuthedRequest, res: Response, next: NextFunction) {
  if (!req.user || !req.user.can_approve_deletions) {
    res.status(403).json({
      error: 'Restricted to Owner Shabib Siraj or Executive Director Warda for final executive approval.',
    });
    return;
  }
  next();
}

/** 20-second rotating cryptographic HMAC QR token (exact SWKOS v3.8.0 reception parity). */
export function generateRotatingQrToken(nowMs = Date.now()) {
  const secretRow = db.prepare("SELECT value FROM settings WHERE key = 'qr_secret'").get() as { value: string } | undefined;
  const rotRow = db.prepare("SELECT value FROM settings WHERE key = 'qr_rotation_sec'").get() as { value: string } | undefined;
  const secret = secretRow?.value || TOKEN_SECRET;
  const periodSec = Math.max(10, Number(rotRow?.value || 20));
  const slot = Math.floor(nowMs / (periodSec * 1000));
  const code = crypto.createHmac('sha256', secret).update(`BETTERWAY-ALNASR-${slot}`).digest('hex').slice(0, 12).toUpperCase();
  const expiresInSec = periodSec - Math.floor((nowMs / 1000) % periodSec);
  return { code: `BWQR-${slot}-${code}`, slot, periodSec, expiresInSec };
}

export function verifyRotatingQrToken(token: string, nowMs = Date.now()): boolean {
  if (!token || !token.startsWith('BWQR-')) return false;
  const parts = token.split('-');
  if (parts.length !== 3) return false;
  const slot = Number(parts[1]);
  const secretRow = db.prepare("SELECT value FROM settings WHERE key = 'qr_secret'").get() as { value: string } | undefined;
  const rotRow = db.prepare("SELECT value FROM settings WHERE key = 'qr_rotation_sec'").get() as { value: string } | undefined;
  const secret = secretRow?.value || TOKEN_SECRET;
  const periodSec = Math.max(10, Number(rotRow?.value || 20));
  const currentSlot = Math.floor(nowMs / (periodSec * 1000));
  if (Math.abs(currentSlot - slot) > 2) return false; // allow ±2 window clock grace
  const expected = crypto.createHmac('sha256', secret).update(`BETTERWAY-ALNASR-${slot}`).digest('hex').slice(0, 12).toUpperCase();
  return parts[2] === expected;
}
