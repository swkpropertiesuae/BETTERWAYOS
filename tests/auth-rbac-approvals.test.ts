import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from '@/lib/auth/password';
import { signSessionToken, verifySessionToken } from '@/lib/auth/session';
import { canAccessExecutive, canViewRecord, getCapabilitiesForRole } from '@/lib/auth/rbac';
import { maskPhoneForRole } from '@/lib/auth/masking';
import { createOwnerApproval, decideOwnerApproval } from '@/lib/auth/approvals';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { OFFICIAL_ROSTER, toSessionUser } from '@/lib/domain/staff';

function mockSession(email: string) {
  const s = OFFICIAL_ROSTER.find((u) => u.email === email)!;
  return toSessionUser({
    id: s.id,
    emp_code: s.empCode,
    slug: s.slug,
    name: s.name,
    name_ar: s.nameAr,
    email: s.email,
    phone: s.phone,
    role: s.role,
    tier: s.tier,
    designation: s.designation,
    department: s.department,
    avatar_url: s.avatarUrl,
    portrait_url: s.portraitUrl,
    initials: s.initials,
  });
}

describe('Task 3: Auth, Co-Owner Equality, RBAC Isolation, Phone Masking & 1-of-2 / 2-of-2 Approvals', () => {
  it('hashes and verifies passwords with scrypt and signs/verifies session tokens', () => {
    const h = hashPassword('Betterway@2026');
    expect(verifyPassword('Betterway@2026', h)).toBe(true);
    expect(verifyPassword('WrongPass', h)).toBe(false);

    const warda = mockSession('warda@betterwaymortgages.com');
    const token = signSessionToken({ userId: warda.id, role: warda.role, email: warda.email });
    const parsed = verifySessionToken(token);
    expect(parsed?.userId).toBe('USR-01');
    expect(parsed?.role).toBe('OWNER');
    expect(verifySessionToken(token + 'tampered')).toBeNull();
  });

  it('gives Warda and Shabib 100% identical OWNER permissions and blocks all non-Owners from Executive & Privacy Fast Track', () => {
    const warda = mockSession('warda@betterwaymortgages.com');
    const shabib = mockSession('shabib@betterwaymortgages.com');
    const admin = mockSession('admin@betterwaymortgages.com');
    const daniel = mockSession('daniel@betterwaymortgages.com');
    const asif = mockSession('asif@betterwaymortgages.com');

    expect(getCapabilitiesForRole(warda.role)).toEqual(getCapabilitiesForRole(shabib.role));
    expect(warda.executiveAppTitle).toBe("Warda's Place");
    expect(warda.privacyLaneTitle).toBe("Warda's Client — Privacy Fast Track");
    expect(shabib.executiveAppTitle).toBe("Shabib's Corner");
    expect(shabib.privacyLaneTitle).toBe("Shabib's Client — Privacy Fast Track");

    expect(canAccessExecutive(warda)).toBe(true);
    expect(canAccessExecutive(shabib)).toBe(true);
    expect(canAccessExecutive(admin)).toBe(false);
    expect(canAccessExecutive(daniel)).toBe(false);
    expect(canAccessExecutive(asif)).toBe(false);

    // Row scoping: Advisors see only own assigned records; Daniel sees full standard team pipeline
    expect(canViewRecord(asif, 'mortgage_cases', 'USR-07')).toBe(true);
    expect(canViewRecord(asif, 'mortgage_cases', 'USR-08')).toBe(false);
    expect(canViewRecord(daniel, 'mortgage_cases', 'USR-08')).toBe(true);
    expect(canViewRecord(daniel, 'privacy_fast_track_jobs', 'USR-01')).toBe(false);
    expect(canViewRecord(admin, 'privacy_fast_track_jobs', 'USR-01')).toBe(false);
  });

  it('hard-masks phone numbers for Advisors & Admin while showing full numbers to Owners', () => {
    const warda = mockSession('warda@betterwaymortgages.com');
    const asif = mockSession('asif@betterwaymortgages.com');
    expect(maskPhoneForRole('+971 50 441 8821', warda, false)).toBe('+971 50 441 8821');
    const masked = maskPhoneForRole('+971 50 441 8821', asif, false);
    expect(masked).toContain('•••');
    expect(masked).not.toContain('441');
  });

  it('enforces 1-of-2 single Owner approval AND strict 2-of-2 distinct-Owner approval (Warda cannot approve twice)', async () => {
    const warda = mockSession('warda@betterwaymortgages.com');
    const shabib = mockSession('shabib@betterwaymortgages.com');
    const admin = mockSession('admin@betterwaymortgages.com');
    const db = await getSupabaseAdmin();

    // 1-of-2 test (Corporate Seal)
    const sealReq = await createOwnerApproval({
      approvalKind: 'CORPORATE_SEAL',
      referenceTable: 'word_documents',
      referenceId: `TEST-DOC-${Date.now()}`,
      title: 'Test Seal Approval',
      summary: 'Unit test 1-of-2',
      requestedBy: admin.id,
    });
    expect(sealReq.approval_mode).toBe('1_OF_2');
    const sealDone = await decideOwnerApproval(sealReq.id, warda, 'APPROVED', 'Approved by Warda');
    expect(sealDone.status).toBe('APPROVED');

    // 2-of-2 test (Delete Purge / Payout Release)
    const purgeReq = await createOwnerApproval({
      approvalKind: 'DELETE_PURGE',
      referenceTable: 'leads',
      referenceId: `TEST-PURGE-${Date.now()}`,
      title: 'Test Dual Delete Purge',
      summary: 'Requires BOTH Warda and Shabib',
      requestedBy: admin.id,
    });
    expect(purgeReq.approval_mode).toBe('2_OF_2');

    // Warda approves first -> OWNER_1_APPROVED
    const step1 = await decideOwnerApproval(purgeReq.id, warda, 'APPROVED', 'Warda 1st sign-off');
    expect(step1.status).toBe('OWNER_1_APPROVED');

    // Warda attempts second approval -> MUST reject with DUPLICATE_OWNER_APPROVAL!
    await expect(decideOwnerApproval(purgeReq.id, warda, 'APPROVED', 'Duplicate attempt')).rejects.toThrow(
      /DUPLICATE_OWNER_APPROVAL/,
    );

    // Shabib approves second -> APPROVED!
    const step2 = await decideOwnerApproval(purgeReq.id, shabib, 'APPROVED', 'Shabib 2nd sign-off');
    expect(step2.status).toBe('APPROVED');
    expect(step2.approver_1_id).toBe('USR-01');
    expect(step2.approver_2_id).toBe('USR-02');

    // Cleanup test approval rows
    await db.from('owner_approvals').delete().in('id', [sealReq.id, purgeReq.id]);
  });
});
