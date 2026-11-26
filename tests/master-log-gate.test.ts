import { describe, it, expect } from 'vitest';
import { writeMasterRecord, decideMasterChangeRequest } from '@/lib/masters/service';
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

describe('Task 4: 22-Registry CORE Master Log & Admin-to-Owner Approval Gate', () => {
  it('allows OWNER to write immediately, forces OFFICE_ADMIN through Owner approval queue, and hard-blocks Admin on security tables', async () => {
    const warda = mockSession('warda@betterwaymortgages.com');
    const shabib = mockSession('shabib@betterwaymortgages.com');
    const admin = mockSession('admin@betterwaymortgages.com');
    const asif = mockSession('asif@betterwaymortgages.com');
    const db = await getSupabaseAdmin();

    const codeOwner = `TEST-COM-${Date.now()}`;
    const codeAdmin = `TEST-DEV-${Date.now()}`;

    // 1. Advisor cannot write to Master Log reference registries
    await expect(
      writeMasterRecord('developers', 'CREATE', { code: codeAdmin, name: 'Unauthorized Dev' }, asif),
    ).rejects.toThrow(/FORBIDDEN/);

    // 2. Office Admin is HARD-BLOCKED from security-critical tables (roles, geofence/office_branches, salaries)
    await expect(
      writeMasterRecord('office_branches', 'UPDATE', { wifi_lock_enabled: false }, admin, 'BR-OUDMETHA'),
    ).rejects.toThrow(/OWNER_ONLY_SECURITY_MASTER/);

    await expect(
      writeMasterRecord('roles_permissions', 'UPDATE', { label: 'Hacked' }, admin, 'ROL-ADM'),
    ).rejects.toThrow(/OWNER_ONLY_SECURITY_MASTER/);

    await expect(
      writeMasterRecord('employees', 'UPDATE', { basic_salary_aed: 99999 }, admin, 'USR-07'),
    ).rejects.toThrow(/OWNER_ONLY_SECURITY_MASTER/);

    // 3. Owner (Warda) creates a Community directly -> immediate commit
    const ownerRes = await writeMasterRecord(
      'communities',
      'CREATE',
      { code: codeOwner, name: 'Test Community Master', emirate: 'Dubai', avg_sqft_aed: 2100 },
      warda,
    );
    expect(ownerRes.mode).toBe('COMMITTED');
    const { data: comRow } = await db.from('communities').select('*').eq('code', codeOwner).maybeSingle();
    expect(comRow?.name).toBe('Test Community Master');

    // 4. Office Admin creates a Developer -> queued in master_change_requests, NOT in developers yet!
    const adminRes = await writeMasterRecord(
      'developers',
      'CREATE',
      { code: codeAdmin, name: 'Pending Approval Developer', emirate: 'Dubai' },
      admin,
      undefined,
      'Requested by BDM desk',
    );
    expect(adminRes.mode).toBe('QUEUED_FOR_OWNER_APPROVAL');
    expect(adminRes.changeRequestId).toBeDefined();

    const { data: beforeApprove } = await db.from('developers').select('*').eq('code', codeAdmin).maybeSingle();
    expect(beforeApprove).toBeNull();

    // 5. Shabib (Co-Owner) approves -> commits directly into developers!
    const decision = await decideMasterChangeRequest(adminRes.changeRequestId!, shabib, 'APPROVED', 'Verified RERA dev');
    expect(decision.status).toBe('APPROVED');
    const { data: afterApprove } = await db.from('developers').select('*').eq('code', codeAdmin).maybeSingle();
    expect(afterApprove?.name).toBe('Pending Approval Developer');

    // Cleanup test rows
    await db.from('communities').delete().eq('code', codeOwner);
    await db.from('developers').delete().eq('code', codeAdmin);
    await db.from('master_change_requests').delete().eq('id', adminRes.changeRequestId!);
  });
});
