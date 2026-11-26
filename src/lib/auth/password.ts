import crypto from 'node:crypto';

export function hashPassword(password: string, salt?: string): string {
  const s = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, s, 32).toString('hex');
  return `${s}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, orig] = String(stored || '').split(':');
  if (!salt || !orig) return false;
  const check = crypto.scryptSync(password, salt, 32).toString('hex');
  const a = Buffer.from(orig, 'hex');
  const b = Buffer.from(check, 'hex');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
