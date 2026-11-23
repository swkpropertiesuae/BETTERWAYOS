import { createHash, createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';

export type UserRole =
  | 'SUPER_ADMIN'
  | 'SALES_ADVISOR'
  | 'CREDIT_UNDERWRITER'
  | 'PROGRESSION_MANAGER'
  | 'COMPLIANCE_MLRO'
  | 'FINANCE_ADMIN'
  | 'HR_MANAGER'
  | 'PARTNER_AGENCY_ADMIN'
  | 'PARTNER_AGENT'
  | 'CLIENT';

export type UserRecord = {
  id: number;
  email: string;
  phone: string;
  full_name_en: string;
  full_name_ar: string;
  role: UserRole;
  is_mlro: number;
  can_approve_rates: number;
  preferred_lang: 'en' | 'ar';
  status: 'ACTIVE' | 'SUSPENDED';
};

export class ForbiddenError extends Error {
  statusCode = 403;
  constructor(message: string) {
    super(message);
    this.name = 'ForbiddenError';
  }
}

export class UnauthorizedError extends Error {
  statusCode = 401;
  constructor(message = 'Authentication required') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export const SESSION_COOKIE_NAME = 'bw_os_session';

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const derived = scryptSync(password, salt, 64).toString('hex');
  return `scrypt$${salt}$${derived}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split('$');
  if (parts.length !== 3 || parts[0] !== 'scrypt') return false;
  const [, salt, expectedHex] = parts;
  const derived = scryptSync(password, salt, 64);
  const expected = Buffer.from(expectedHex, 'hex');
  if (derived.length !== expected.length) return false;
  return timingSafeEqual(derived, expected);
}

const sha256Hex = (input: string) => createHash('sha256').update(input).digest('hex');

export const MAX_FAILED_LOGINS = 5;
export const LOCKOUT_MINUTES = 15;

let ephemeralSessionKey: string | null = null;

function getSessionSecret(): string {
  const configured = process.env.BW_SESSION_SECRET?.trim();
  if (configured && configured.length >= 24) return configured;
  if (process.env.VERCEL && process.env.NODE_ENV === 'production') {
    // Derive a domain-separated key from BW_VAULT_MASTER_KEY only if explicitly provisioned; never fall back to a literal string.
    const vaultKey = process.env.BW_VAULT_MASTER_KEY?.trim();
    if (vaultKey && vaultKey.length >= 32) {
      return createHmac('sha256', vaultKey).update('betterway-os-session-signing-v2').digest('hex');
    }
    throw new Error('BW_SESSION_SECRET (min 24 chars) must be configured in production');
  }
  if (!ephemeralSessionKey) {
    ephemeralSessionKey = randomBytes(32).toString('hex');
  }
  return ephemeralSessionKey;
}

const signSession = (userId: number, exp: number) =>
  createHmac('sha256', getSessionSecret()).update(`${userId}.${exp}`).digest('hex');

export function extractClientIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0]!.trim();
  const realIp = req.headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  return '127.0.0.1';
}

export function validatePasswordStrength(password: string): string | null {
  if (password.length < 10) return 'Password must be at least 10 characters long.';
  if (!/[A-Z]/.test(password)) return 'Password must include at least one uppercase letter.';
  if (!/[a-z]/.test(password)) return 'Password must include at least one lowercase letter.';
  if (!/\d/.test(password)) return 'Password must include at least one digit.';
  return null;
}

export type LoginEventOutcome =
  | 'SUCCESS'
  | 'BAD_PASSWORD'
  | 'LOCKED'
  | 'MFA_REQUIRED'
  | 'MFA_FAILED'
  | 'SUSPENDED'
  | 'NOT_FOUND';

export function recordLoginEvent(
  db: DatabaseSync,
  params: {
    userId?: number | null;
    email: string;
    outcome: LoginEventOutcome;
    ip?: string;
    userAgent?: string;
  },
): void {
  try {
    db.prepare(
      `INSERT INTO login_events (user_id, email, outcome, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?)`,
    ).run(
      params.userId ?? null,
      params.email.trim().toLowerCase(),
      params.outcome,
      params.ip || '127.0.0.1',
      (params.userAgent || '').slice(0, 240),
    );
  } catch {
    // Non-fatal on older schemas without login_events
  }
}

export function checkAccountLockout(
  db: DatabaseSync,
  userId: number,
): { locked: boolean; lockedUntil: string | null; remainingSeconds: number } {
  const row = db
    .prepare('SELECT locked_until FROM users WHERE id = ?')
    .get(userId) as { locked_until: string | null } | undefined;
  if (!row?.locked_until) return { locked: false, lockedUntil: null, remainingSeconds: 0 };
  const untilMs = Date.parse(row.locked_until);
  if (!Number.isFinite(untilMs) || untilMs <= Date.now()) {
    db.prepare('UPDATE users SET failed_logins = 0, locked_until = NULL WHERE id = ?').run(userId);
    return { locked: false, lockedUntil: null, remainingSeconds: 0 };
  }
  return {
    locked: true,
    lockedUntil: row.locked_until,
    remainingSeconds: Math.max(1, Math.ceil((untilMs - Date.now()) / 1000)),
  };
}

export function recordFailedLoginAttempt(
  db: DatabaseSync,
  userId: number,
): { failedLogins: number; locked: boolean; lockedUntil: string | null } {
  const row = db
    .prepare('SELECT failed_logins FROM users WHERE id = ?')
    .get(userId) as { failed_logins: number } | undefined;
  const nextCount = Number(row?.failed_logins || 0) + 1;
  if (nextCount >= MAX_FAILED_LOGINS) {
    const lockedUntil = new Date(Date.now() + LOCKOUT_MINUTES * 60_000).toISOString();
    db.prepare('UPDATE users SET failed_logins = ?, locked_until = ? WHERE id = ?').run(nextCount, lockedUntil, userId);
    return { failedLogins: nextCount, locked: true, lockedUntil };
  }
  db.prepare('UPDATE users SET failed_logins = ? WHERE id = ?').run(nextCount, userId);
  return { failedLogins: nextCount, locked: false, lockedUntil: null };
}

export function clearFailedLogins(db: DatabaseSync, userId: number): void {
  db.prepare("UPDATE users SET failed_logins = 0, locked_until = NULL, last_login_at = datetime('now') WHERE id = ?").run(userId);
}

export function createSession(db: DatabaseSync, userId: number, ip = '127.0.0.1', userAgent = ''): string {
  if (process.env.VERCEL) {
    const exp = Date.now() + 14 * 86_400_000;
    return `v1.${userId}.${exp}.${signSession(userId, exp)}`;
  }
  const rawToken = randomBytes(32).toString('hex');
  const tokenHash = sha256Hex(rawToken);
  const expiresAt = new Date(Date.now() + 14 * 86_400_000).toISOString();
  db.prepare(
    `INSERT INTO sessions (user_id, token_hash, ip_address, user_agent, expires_at)
     VALUES (?, ?, ?, ?, ?)`,
  ).run(userId, tokenHash, ip, userAgent, expiresAt);
  return rawToken;
}

export function resolveSession(db: DatabaseSync, rawToken?: string | null): UserRecord | null {
  if (!rawToken) return null;
  if (process.env.VERCEL) {
    const [v, id, exp, sig] = rawToken.split('.');
    if (v !== 'v1' || !sig || Number(exp) <= Date.now()) return null;
    const good = Buffer.from(signSession(Number(id), Number(exp)));
    const got = Buffer.from(sig);
    if (good.length !== got.length || !timingSafeEqual(good, got)) return null;
    const u = db
      .prepare(
        `SELECT id, email, phone, full_name_en, full_name_ar, role, is_mlro, can_approve_rates, preferred_lang, status
         FROM users WHERE id = ? AND status = 'ACTIVE'`,
      )
      .get(Number(id)) as UserRecord | undefined;
    return u ? { ...u } : null;
  }
  const tokenHash = sha256Hex(rawToken);
  const row = db
    .prepare(
      `SELECT u.id, u.email, u.phone, u.full_name_en, u.full_name_ar, u.role,
              u.is_mlro, u.can_approve_rates, u.preferred_lang, u.status,
              s.expires_at, s.revoked_at
       FROM sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = ?`,
    )
    .get(tokenHash) as (UserRecord & { expires_at: string; revoked_at: string | null }) | undefined;

  if (!row) return null;
  if (row.revoked_at || row.status !== 'ACTIVE') return null;
  if (Date.parse(row.expires_at) <= Date.now()) return null;

  return {
    id: row.id,
    email: row.email,
    phone: row.phone,
    full_name_en: row.full_name_en,
    full_name_ar: row.full_name_ar,
    role: row.role,
    is_mlro: row.is_mlro,
    can_approve_rates: row.can_approve_rates,
    preferred_lang: row.preferred_lang,
    status: row.status,
  };
}

export function revokeSession(db: DatabaseSync, rawToken: string): void {
  const tokenHash = sha256Hex(rawToken);
  db.prepare(`UPDATE sessions SET revoked_at = datetime('now') WHERE token_hash = ?`).run(tokenHash);
}

export function assertRole(user: UserRecord | null, allowedRoles: UserRole[]): UserRecord {
  if (!user) throw new UnauthorizedError();
  if (!allowedRoles.includes(user.role)) {
    throw new ForbiddenError(`Role ${user.role} is not permitted for this operation`);
  }
  return user;
}

export function assertMlroAccess(user: UserRecord | null): UserRecord {
  if (!user) throw new UnauthorizedError();
  if (user.is_mlro !== 1) {
    throw new ForbiddenError(
      'Chinese-wall restriction: UAE FIU goAML STR/SAR vault is strictly isolated to designated MLRO officers.',
    );
  }
  return user;
}

export type MaskedPartnerDeal = {
  deal_id: number;
  deal_ref: string;
  client_display_name: string;
  community_name: string;
  transaction_type: string;
  target_loan_fils: number;
  stage: string;
  pre_qual_cert_enabled: number;
  agent_brn: string;
  agent_name: string;
  created_at: string;
};

export function getPartnerVisibleDeals(db: DatabaseSync, user: UserRecord) {
  assertRole(user, ['PARTNER_AGENCY_ADMIN', 'PARTNER_AGENT']);

  const agentRow = db
    .prepare(
      `SELECT pa.id as partner_agent_id, pa.agency_id, pa.rera_brn, pa.brn_expiry_date, pa.referral_code, pa.is_agency_admin,
              ag.company_name, ag.rera_orn, ag.vat_trn_15, ag.bank_name, ag.iban, ag.tier, ag.default_split_bps,
              ag.verification_status, ag.agreement_status, ag.clawback_debit_balance_fils
       FROM partner_agents pa
       JOIN partner_agencies ag ON ag.id = pa.agency_id
       WHERE pa.user_id = ?`,
    )
    .get(user.id) as
    | {
        partner_agent_id: number;
        agency_id: number;
        rera_brn: string;
        brn_expiry_date: string;
        referral_code: string;
        is_agency_admin: number;
        company_name: string;
        rera_orn: string;
        vat_trn_15: string;
        bank_name: string;
        iban: string;
        tier: string;
        default_split_bps: number;
        verification_status: string;
        agreement_status: string;
        clawback_debit_balance_fils: number;
      }
    | undefined;

  if (!agentRow) {
    throw new ForbiddenError('No RERA partner profile linked to this account');
  }

  const isAgencyAdmin = user.role === 'PARTNER_AGENCY_ADMIN' && agentRow.is_agency_admin === 1;

  const deals = (
    isAgencyAdmin
      ? db
          .prepare(
            `SELECT d.id as deal_id, d.deal_ref, h.primary_name as client_display_name,
                    d.community_name, d.transaction_type, d.target_loan_fils, d.stage,
                    d.pre_qual_cert_enabled, pa.rera_brn as agent_brn, u.full_name_en as agent_name, d.created_at
             FROM deals d
             JOIN households h ON h.id = d.household_id
             JOIN partner_agents pa ON pa.id = d.partner_agent_id
             JOIN users u ON u.id = pa.user_id
             WHERE pa.agency_id = ?
             ORDER BY d.id DESC`,
          )
          .all(agentRow.agency_id)
      : db
          .prepare(
            `SELECT d.id as deal_id, d.deal_ref, h.primary_name as client_display_name,
                    d.community_name, d.transaction_type, d.target_loan_fils, d.stage,
                    d.pre_qual_cert_enabled, pa.rera_brn as agent_brn, u.full_name_en as agent_name, d.created_at
             FROM deals d
             JOIN households h ON h.id = d.household_id
             JOIN partner_agents pa ON pa.id = d.partner_agent_id
             JOIN users u ON u.id = pa.user_id
             WHERE d.partner_agent_id = ?
             ORDER BY d.id DESC`,
          )
          .all(agentRow.partner_agent_id)
  ) as MaskedPartnerDeal[];

  const invoices = isAgencyAdmin
    ? db
        .prepare(
          `SELECT ti.id, ti.invoice_number, ti.issue_date, ti.subtotal_fils, ti.vat_fils, ti.total_fils, ti.peppol_status
           FROM tax_invoices ti
           JOIN commission_settlements cs ON cs.deal_id = ti.deal_id
           WHERE ti.invoice_type = 'SELF_BILLED_PARTNER' AND cs.partner_agency_id = ?
           ORDER BY ti.id DESC`,
        )
        .all(agentRow.agency_id)
    : [];

  return {
    agentProfile: {
      partner_agent_id: agentRow.partner_agent_id,
      agency_id: agentRow.agency_id,
      company_name: agentRow.company_name,
      rera_orn: agentRow.rera_orn,
      rera_brn: agentRow.rera_brn,
      brn_expiry_date: agentRow.brn_expiry_date,
      referral_code: agentRow.referral_code,
      is_agency_admin: isAgencyAdmin,
      verification_status: agentRow.verification_status,
      agreement_status: agentRow.agreement_status,
    },
    deals,
    agencyFinancials: isAgencyAdmin
      ? {
          vat_trn_15: agentRow.vat_trn_15,
          bank_name: agentRow.bank_name,
          iban: agentRow.iban,
          tier: agentRow.tier,
          default_split_bps: agentRow.default_split_bps,
          clawback_debit_balance_fils: agentRow.clawback_debit_balance_fils,
          invoices,
        }
      : null,
  };
}

export function getClientVisibleDeals(db: DatabaseSync, user: UserRecord) {
  assertRole(user, ['CLIENT']);
  return db
    .prepare(
      `SELECT DISTINCT d.id, d.deal_ref, d.household_id, d.transaction_type, d.emirate,
              d.community_name, d.purchase_price_fils, d.target_loan_fils, d.tenure_months,
              d.stage, d.cdd_status, d.disbursed_loan_fils, d.disbursed_at, d.created_at
       FROM deals d
       JOIN applicants a ON a.household_id = d.household_id
       WHERE a.user_id = ?
       ORDER BY d.id DESC`,
    )
    .all(user.id) as {
    id: number;
    deal_ref: string;
    household_id: number;
    transaction_type: string;
    emirate: string;
    community_name: string;
    purchase_price_fils: number;
    target_loan_fils: number;
    tenure_months: number;
    stage: string;
    cdd_status: string;
    disbursed_loan_fils: number;
    disbursed_at: string | null;
    created_at: string;
  }[];
}

export function writeAuditLog(
  db: DatabaseSync,
  actor: Pick<UserRecord, 'id' | 'role'> | null,
  entityType: string,
  entityId: string | number,
  action: string,
  beforeObj: unknown = null,
  afterObj: unknown = null,
  ip = '127.0.0.1',
) {
  db.prepare(
    `INSERT INTO audit_logs (actor_user_id, actor_role, entity_type, entity_id, action, before_json, after_json, ip_address)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    actor?.id ?? null,
    actor?.role ?? 'SYSTEM',
    entityType,
    String(entityId),
    action,
    beforeObj ? JSON.stringify(beforeObj) : null,
    afterObj ? JSON.stringify(afterObj) : null,
    ip,
  );
}
