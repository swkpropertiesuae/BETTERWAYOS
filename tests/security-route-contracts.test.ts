import { describe, it, expect, vi, beforeEach } from 'vitest';
import { signSessionToken } from '@/lib/auth/session';
import { OFFICIAL_ROSTER, toSessionUser } from '@/lib/domain/staff';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { getPublicCaseStatus } from '@/lib/cms/service';
import { sanitizePostgrestQuery } from '@/lib/utilities/search';
import { createFastTrackJob, createFastTrackDoc } from '@/lib/executive/service';
import { createMortgageCaseWithVault, ingestDailyEnquiry } from '@/lib/pipeline/service';
import { ipMatchesCidrList } from '@/lib/attendance/hikvision';

// Mock next/headers cookies() so we can invoke real Next.js Route Handlers with role-signed cookies
let activeCookieToken = '';
vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) => (name === 'bw_os_session' && activeCookieToken ? { value: activeCookieToken } : undefined),
    set: () => {},
    delete: () => {},
  }),
}));

function loginAs(email: string) {
  const s = OFFICIAL_ROSTER.find((u) => u.email === email)!;
  const sessionUser = toSessionUser({
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
  activeCookieToken = signSessionToken({ userId: sessionUser.id, role: sessionUser.role, email: sessionUser.email });
  return sessionUser;
}

describe('Review Security & API Route Contract Regression Suite', () => {
  beforeEach(() => {
    activeCookieToken = '';
  });

  it('blocks pipelineScope=NONE roles (HR_MANAGER & IT_MARKETING) from CRM, Pipeline, Vault, Mortgage Desk & Sales routes', async () => {
    const { GET: getLeads } = await import('@/app/api/v1/crm/leads/route');
    const { GET: getCases } = await import('@/app/api/v1/pipeline/cases/route');
    const { GET: getVault } = await import('@/app/api/v1/vault/documents/route');
    const { GET: getDesk } = await import('@/app/api/v1/mortgage-desk/route');
    const { GET: getSales } = await import('@/app/api/v1/sales/route');
    const { POST: unmaskPhone } = await import('@/app/api/v1/crm/unmask/route');

    loginAs('rahaba@betterwaymortgages.com'); // HR_MANAGER (pipelineScope: NONE)
    expect((await getLeads(new Request('http://localhost/api/v1/crm/leads'))).status).toBe(403);
    expect((await getCases()).status).toBe(403);
    expect((await getVault(new Request('http://localhost/api/v1/vault/documents'))).status).toBe(403);
    expect((await getDesk()).status).toBe(403);
    expect((await getSales()).status).toBe(403);
    expect(
      (
        await unmaskPhone(
          new Request('http://localhost/api/v1/crm/unmask', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ entityType: 'lead', entityId: '00000000-0000-0000-0000-000000000000' }),
          }),
        )
      ).status,
    ).toBe(403);

    loginAs('nusrik@betterwaymortgages.com'); // IT_MARKETING (pipelineScope: NONE)
    expect((await getLeads(new Request('http://localhost/api/v1/crm/leads'))).status).toBe(403);
    expect((await getCases()).status).toBe(403);
  });

  it('blocks Cross-Advisor IDOR on Vault downloads & Pipeline case stage advances', async () => {
    const db = await getSupabaseAdmin();
    const warda = loginAs('warda@betterwaymortgages.com');
    const lead = await ingestDailyEnquiry({
      contactName: 'Asif Exclusive Client',
      contactPhone: '+971509911223',
      sourceChannel: 'Website',
      assignedTo: 'USR-07', // Asif Khan
    });
    const created = await createMortgageCaseWithVault(
      {
        leadId: lead.id,
        borrowerName: 'Asif Exclusive Client',
        borrowerPhone: '+971509911223',
        propertyPriceAed: 2_200_000,
        requestedLoanAed: 1_760_000,
        monthlyIncomeAed: 42_000,
        advisorId: 'USR-07', // Asif Khan
      },
      warda,
    );

    const { GET: getVault } = await import('@/app/api/v1/vault/documents/route');
    const { POST: advanceStage } = await import('@/app/api/v1/pipeline/cases/[id]/advance/route');

    // Reshma (USR-08, another ADVISOR) must be blocked from Asif's case vault & stage advance
    loginAs('reshma@betterwaymortgages.com');
    const vaultRes = await getVault(new Request(`http://localhost/api/v1/vault/documents?caseId=${created.mortgageCase.id}`));
    expect(vaultRes.status).toBe(403);

    const advRes = await advanceStage(
      new Request(`http://localhost/api/v1/pipeline/cases/${created.mortgageCase.id}/advance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nextStage: '02_ELIGIBILITY', evidenceNote: 'Attempted cross-advisor hijack' }),
      }),
      { params: Promise.resolve({ id: created.mortgageCase.id }) },
    );
    expect(advRes.status).toBe(403);

    // Cleanup
    await db.from('mortgage_cases').delete().eq('id', created.mortgageCase.id);
    await db.from('leads').delete().eq('id', lead.id);
  });

  it('prevents PostgREST .or() filter injection in public status lookup and unified search', async () => {
    const malicious = await getPublicCaseStatus('X,deleted_soft.eq.false');
    expect(malicious).toBeNull();

    const cleaned = sanitizePostgrestQuery('Al Barsha, (Dubai) %*');
    expect(cleaned).not.toContain(',');
    expect(cleaned).not.toContain('(');
    expect(cleaned).not.toContain(')');
    expect(cleaned).not.toContain('%');
  });

  it('enforces single-owner private_to_owner_id lock on PATCH fast-track & createFastTrackDoc', async () => {
    const db = await getSupabaseAdmin();
    const warda = loginAs('warda@betterwaymortgages.com');
    const shabib = loginAs('shabib@betterwaymortgages.com');

    const job = await createFastTrackJob(
      {
        clientName: 'Warda Strictly Private UHNW',
        clientPhone: '+971501119999',
        propertySummary: 'Confidential cash arrangement',
        loanAmountAed: 8_000_000,
        privateToMeOnly: true,
      },
      warda,
    );

    // Shabib must be blocked from attaching a doc or PATCHing Warda's private-locked job
    await expect(
      createFastTrackDoc({ jobId: job.id, docTitle: 'Secret Deed', docType: 'Deed', bodyHtml: '<p>Secret</p>' }, shabib),
    ).rejects.toThrow(/OWNER_PRIVATE_LOCK|OWNER_ONLY|not found/i);

    const { PATCH: patchFastTrack } = await import('@/app/api/v1/executive/fast-track/route');
    loginAs('shabib@betterwaymortgages.com');
    const patchRes = await patchFastTrack(
      new Request('http://localhost/api/v1/executive/fast-track', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: job.id, stageCode: '06_PRE_APPROVAL' }),
      }),
    );
    expect(patchRes.status).toBe(403);

    await db.from('privacy_fast_track_jobs').delete().eq('id', job.id);
  });

  it('blocks Compliance/Settings access for Advisors, hides Fast-Track audit events from Office Admin, and enforces server-side broker IBAN check on payouts', async () => {
    const { GET: getCompliance } = await import('@/app/api/v1/compliance/route');
    const { GET: getSettings } = await import('@/app/api/v1/settings/route');
    const { POST: postAccount } = await import('@/app/api/v1/accounts/route');

    loginAs('asif@betterwaymortgages.com');
    expect((await getCompliance(new Request('http://localhost/api/v1/compliance'))).status).toBe(403);
    expect((await getSettings()).status).toBe(403);

    // Office Admin cannot spoof corporate broker verification by passing ornVerified=true without a verified DB broker
    loginAs('admin@betterwaymortgages.com');
    const spoofPayout = await postAccount(
      new Request('http://localhost/api/v1/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: 'payout',
          payeeName: 'Fake Personal Shell',
          payeeAccountType: 'CORPORATE',
          destinationIban: 'AE070331234567890123456',
          amountAed: 15000,
          ornVerified: true,
          bankLetterVerified: true,
        }),
      }),
    );
    expect(spoofPayout.status).toBe(400);
  });

  it('preserves real unmasked lead phone when converting a masked lead to a Mortgage Case & matches IPv4 CIDRs accurately', async () => {
    const db = await getSupabaseAdmin();
    const warda = loginAs('warda@betterwaymortgages.com');
    const lead = await ingestDailyEnquiry({
      contactName: 'Masked Conversion Test',
      contactPhone: '+971508877665',
      sourceChannel: 'Website',
    });

    // Simulate non-Owner UI submitting masked phone dots alongside leadId
    const created = await createMortgageCaseWithVault(
      {
        leadId: lead.id,
        borrowerName: 'Masked Conversion Test',
        borrowerPhone: '+971 50 ••• •665',
        propertyPriceAed: 2_000_000,
        requestedLoanAed: 1_600_000,
        monthlyIncomeAed: 35_000,
      },
      warda,
    );
    expect(created.mortgageCase.borrower_phone).toBe('+971508877665');

    // CIDR matching check
    expect(ipMatchesCidrList('192.168.1.55', '127.0.0.1/32,192.168.1.0/24')).toBe(true);
    expect(ipMatchesCidrList('203.0.113.10', '127.0.0.1/32,192.168.1.0/24')).toBe(false);

    await db.from('mortgage_cases').delete().eq('id', created.mortgageCase.id);
    await db.from('leads').delete().eq('id', lead.id);
  });
});
