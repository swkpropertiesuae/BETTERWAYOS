import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';
import { OFFICIAL_ROSTER, getExecutiveTitlesForUser, toSessionUser } from '@/lib/domain/staff';
import { getCapabilitiesForRole, canAccessExecutive, canViewRecord } from '@/lib/auth/rbac';
import { signSessionToken, verifySessionToken } from '@/lib/auth/session';
import { hashPassword, verifyPassword } from '@/lib/auth/password';
import { maskPhoneNumber, maskPhoneForRole } from '@/lib/auth/masking';
import { scrubPiiForLlm } from '@/lib/ai/pii-shield';
import { sanitizePostgrestQuery } from '@/lib/utilities/search';
import {
  ipMatchesCidrList,
  generateRotatingQrToken,
  verifyRotatingQrToken,
  haversineDistanceMeters,
} from '@/lib/attendance/hikvision';
import { signCmsWebhookBody, verifyCmsWebhookSignature } from '@/lib/cms/service';

function makeSessionUser(email: string) {
  const seed = OFFICIAL_ROSTER.find((u) => u.email === email);
  if (!seed) throw new Error(`Missing staff seed for ${email}`);
  return toSessionUser({
    id: seed.id,
    emp_code: seed.empCode,
    slug: seed.slug,
    name: seed.name,
    name_ar: seed.nameAr,
    email: seed.email,
    phone: seed.phone,
    role: seed.role,
    tier: seed.tier,
    designation: seed.designation,
    department: seed.department,
    avatar_url: seed.avatarUrl,
    portrait_url: seed.portraitUrl,
    initials: seed.initials,
  });
}

describe('CI Offline Contracts: Auth, RBAC, PDPL, Crypto & Repo Integrity', () => {
  it('signs and verifies HMAC session tokens and rejects tampered or expired tokens', () => {
    const token = signSessionToken({
      userId: 'USR-01',
      role: 'OWNER',
      email: 'warda@betterwaymortgages.com',
    });

    const verified = verifySessionToken(token);
    expect(verified).not.toBeNull();
    expect(verified?.userId).toBe('USR-01');
    expect(verified?.role).toBe('OWNER');

    const [payloadPart, sigPart] = token.split('.');
    const tamperedSig = `${payloadPart}.${sigPart.slice(0, -2)}AA`;
    expect(verifySessionToken(tamperedSig)).toBeNull();

    const forgedPayload = Buffer.from(
      JSON.stringify({ userId: 'USR-07', role: 'OWNER', email: 'asif@betterwaymortgages.com' }),
      'utf8',
    ).toString('base64url');
    expect(verifySessionToken(`${forgedPayload}.${sigPart}`)).toBeNull();

    const expired = signSessionToken({
      userId: 'USR-01',
      role: 'OWNER',
      email: 'warda@betterwaymortgages.com',
      exp: Math.floor(Date.now() / 1000) - 60,
    });
    expect(verifySessionToken(expired)).toBeNull();
    expect(verifySessionToken('')).toBeNull();
    expect(verifySessionToken(null)).toBeNull();
  });

  it('hashes and verifies scrypt passwords safely', () => {
    const stored = hashPassword('Betterway@2026');
    expect(stored).toContain(':');
    expect(verifyPassword('Betterway@2026', stored)).toBe(true);
    expect(verifyPassword('WrongPassword!', stored)).toBe(false);
    expect(verifyPassword('Betterway@2026', 'malformed-hash')).toBe(false);
  });

  it('enforces strict RBAC capabilities, Co-Owner parity, and Privacy Fast Track isolation', () => {
    const warda = makeSessionUser('warda@betterwaymortgages.com');
    const shabib = makeSessionUser('shabib@betterwaymortgages.com');
    const hr = makeSessionUser('rahaba@betterwaymortgages.com');
    const it = makeSessionUser('nusrik@betterwaymortgages.com');
    const advisor = makeSessionUser('asif@betterwaymortgages.com');
    const admin = makeSessionUser('admin@betterwaymortgages.com');

    expect(getExecutiveTitlesForUser(warda.email, warda.role).executiveAppTitle).toBe("Warda's Place");
    expect(getExecutiveTitlesForUser(shabib.email, shabib.role).executiveAppTitle).toBe("Shabib's Corner");
    expect(getExecutiveTitlesForUser(advisor.email, advisor.role).executiveAppTitle).toBeNull();

    expect(canAccessExecutive(warda)).toBe(true);
    expect(canAccessExecutive(shabib)).toBe(true);
    expect(canAccessExecutive(admin)).toBe(false);
    expect(canAccessExecutive(advisor)).toBe(false);

    // Privacy Fast Track isolation: only Owners, and private lane stays private to owning Co-Owner
    expect(canViewRecord(warda, 'privacy_fast_track_jobs', null, warda.id)).toBe(true);
    expect(canViewRecord(shabib, 'privacy_fast_track_jobs', null, warda.id)).toBe(false);
    expect(canViewRecord(shabib, 'privacy_fast_track_jobs', null, null)).toBe(true);
    expect(canViewRecord(advisor, 'privacy_fast_track_jobs', advisor.id, null)).toBe(false);
    expect(canViewRecord(admin, 'privacy_fast_track_invoices', null, null)).toBe(false);

    // HR and IT/Marketing have zero pipeline visibility
    expect(getCapabilitiesForRole('HR_MANAGER').pipelineScope).toBe('NONE');
    expect(getCapabilitiesForRole('IT_MARKETING').pipelineScope).toBe('NONE');
    expect(canViewRecord(hr, 'mortgage_cases', hr.id)).toBe(false);
    expect(canViewRecord(it, 'leads', it.id)).toBe(false);

    // Advisors only view their own assigned cases
    expect(getCapabilitiesForRole('ADVISOR').pipelineScope).toBe('OWN');
    expect(canViewRecord(advisor, 'mortgage_cases', advisor.id)).toBe(true);
    expect(canViewRecord(advisor, 'mortgage_cases', 'USR-08')).toBe(false);

    // Office Admin can propose Master Log changes but cannot write directly or approve owner queues
    const adminCaps = getCapabilitiesForRole('OFFICE_ADMIN');
    expect(adminCaps.canProposeMasterChange).toBe(true);
    expect(adminCaps.canWriteMasterDirect).toBe(false);
    expect(adminCaps.canApproveOwnerQueues).toBe(false);
  });

  it('masks borrower phone numbers for non-Owners and scrubs PII before external LLM calls', () => {
    const warda = makeSessionUser('warda@betterwaymortgages.com');
    const advisor = makeSessionUser('asif@betterwaymortgages.com');

    expect(maskPhoneNumber('+971501234821')).toBe('+971 50 ••• •821');
    expect(maskPhoneForRole('+971501234821', warda)).toBe('+971501234821');
    expect(maskPhoneForRole('+971501234821', advisor)).toBe('+971 50 ••• •821');
    expect(maskPhoneForRole('+971501234821', advisor, true)).toBe('+971501234821');

    const prompt =
      'Client EID 784-1988-1234567-1, IBAN AE070331234567890123456, email buyer@example.com, mobile +971 50 999 8877, passport no: N9876543';
    const scrubbed = scrubPiiForLlm(prompt);
    expect(scrubbed.redactions).toBeGreaterThanOrEqual(5);
    expect(scrubbed.sanitized).not.toContain('784-1988-1234567-1');
    expect(scrubbed.sanitized).not.toContain('AE070331234567890123456');
    expect(scrubbed.sanitized).not.toContain('buyer@example.com');
    expect(scrubbed.sanitized).not.toContain('999 8877');
    expect(scrubbed.sanitized).not.toContain('N9876543');
  });

  it('sanitizes PostgREST filter injection characters and caps query length', () => {
    const malicious = "Downtown),id.eq.1,%*\\'\"`DROP";
    const clean = sanitizePostgrestQuery(malicious);
    expect(clean).not.toMatch(/[(),%*\\'"`]/);
    expect(clean).toContain('Downtown');
    expect(sanitizePostgrestQuery('A'.repeat(200)).length).toBeLessThanOrEqual(80);
  });

  it('validates CIDR matching, 20-second rotating QR tokens, Haversine distance, and CMS HMAC webhooks', () => {
    expect(ipMatchesCidrList('192.168.1.44', '192.168.1.0/24')).toBe(true);
    expect(ipMatchesCidrList('::ffff:10.0.5.9', '10.0.5.0/24')).toBe(true);
    expect(ipMatchesCidrList('172.16.0.10', '192.168.1.0/24')).toBe(false);

    const now = Date.now();
    const { token } = generateRotatingQrToken(now);
    expect(verifyRotatingQrToken(token, now)).toBe(true);
    expect(verifyRotatingQrToken(token, now + 15_000)).toBe(true);
    expect(verifyRotatingQrToken(token, now + 90_000)).toBe(false);
    expect(verifyRotatingQrToken(`${token}x`, now)).toBe(false);

    // Al Nasr Plaza, Oud Metha coordinates
    expect(haversineDistanceMeters(25.2371, 55.3112, 25.2371, 55.3112)).toBe(0);
    expect(haversineDistanceMeters(25.2371, 55.3112, 25.1972, 55.2744)).toBeGreaterThan(4000);

    const body = JSON.stringify({ tag: 'betterway-cms', updatedAt: '2026-11-26T00:00:00.000Z' });
    const sig = signCmsWebhookBody(body);
    expect(verifyCmsWebhookSignature(body, sig)).toBe(true);
    expect(verifyCmsWebhookSignature(`${body} `, sig)).toBe(false);
    expect(verifyCmsWebhookSignature(body, 'sha256=deadbeef')).toBe(false);
    expect(verifyCmsWebhookSignature(body, null)).toBe(false);
  });

  it('verifies all 5 Supabase SQL migrations and all official staff portraits exist on disk', () => {
    const root = process.cwd();
    const expectedMigrations = [
      '001_core_auth_and_masters.sql',
      '002_pipeline_crm_and_vault.sql',
      '003_executive_fast_track_and_approvals.sql',
      '004_finance_compliance_hr_attendance_gps.sql',
      '005_website_cms_ai_and_rls.sql',
    ];
    for (const file of expectedMigrations) {
      const fullPath = path.join(root, 'supabase', 'migrations', file);
      expect(fs.existsSync(fullPath), `Missing migration ${file}`).toBe(true);
      expect(fs.statSync(fullPath).size).toBeGreaterThan(500);
    }

    const portraitStaff = OFFICIAL_ROSTER.filter((u) => u.avatarUrl && u.portraitUrl);
    expect(portraitStaff).toHaveLength(8);
    for (const member of portraitStaff) {
      const avatarPath = path.join(root, 'public', member.avatarUrl!.replace(/^\//, ''));
      const portraitPath = path.join(root, 'public', member.portraitUrl!.replace(/^\//, ''));
      expect(fs.existsSync(avatarPath), `Missing avatar ${member.avatarUrl}`).toBe(true);
      expect(fs.existsSync(portraitPath), `Missing portrait ${member.portraitUrl}`).toBe(true);
    }
  });
});
