import { describe, it, expect } from 'vitest';
import {
  validateCorporateAccountChannel,
  generatePintAeXml,
  generateGoAmlXml,
  generateMohreWpsSif,
} from '@/lib/compliance/statutory';
import { runUnifiedSearch } from '@/lib/utilities/search';
import { createFastTrackJob } from '@/lib/executive/service';
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

describe('Task 10: Corporate-Account Guard, Statutory XML/SIF Exports & Zero-Leak Global Search', () => {
  it('hard-rejects personal / cash-in-hand accounts and unverified broker IBANs', () => {
    expect(() =>
      validateCorporateAccountChannel({
        payeeAccountType: 'PERSONAL',
        destinationIban: 'AE120330000012345678901',
        channelNote: 'Advisor personal account',
        ornVerified: true,
        bankLetterVerified: true,
      }),
    ).toThrow(/CORPORATE_ACCOUNT_REQUIRED/);

    expect(() =>
      validateCorporateAccountChannel({
        payeeAccountType: 'CORPORATE',
        destinationIban: 'AE120330000012345678901',
        channelNote: 'Corporate wire',
        ornVerified: false,
        bankLetterVerified: false,
      }),
    ).toThrow(/CORPORATE_ACCOUNT_REQUIRED/);

    expect(
      validateCorporateAccountChannel({
        payeeAccountType: 'CORPORATE',
        destinationIban: 'AE460260001015889900101',
        channelNote: 'Verified ORN Corporate Bank Transfer',
        ornVerified: true,
        bankLetterVerified: true,
      }),
    ).toBe(true);
  });

  it('generates valid PINT-AE UBL XML, UAE FIU goAML XML, and MOHRE WPS .SIF files', () => {
    const pint = generatePintAeXml({
      invoiceNo: 'BW-INV-2026-001',
      issueDate: '2026-11-26',
      sellerName: 'Betterway Mortgages LLC',
      sellerTrn: '100000000000003',
      buyerName: 'Emirates NBD Bank PJSC',
      subtotalAed: 25_000,
      vatAmountAed: 1_250,
      totalAed: 26_250,
    });
    expect(pint).toContain('<Invoice');
    expect(pint).toContain('BW-INV-2026-001');
    expect(pint).toContain('26250.00');

    const goaml = generateGoAmlXml({
      reportId: 'STR-2026-01',
      subjectName: 'Screened Subject',
      reason: 'Source of funds anomaly flagged during compliance review',
    });
    expect(goaml).toContain('<report>');
    expect(goaml).toContain('STR-2026-01');

    const sif = generateMohreWpsSif('0000000000001', '2026-11', [
      { molId: 'MOL-003', routingCode: '026100101', iban: 'AE070260000000000000003', fixedAed: 18000, variableAed: 4500 },
    ]);
    expect(sif).toContain('EDR,MOL-003');
    expect(sif).toContain('SCR,0000000000001');
  });

  it('strictly hides Owner Privacy Fast Track records from Office Admin & Advisors in Global Search', async () => {
    const warda = mockSession('warda@betterwaymortgages.com');
    const admin = mockSession('admin@betterwaymortgages.com');
    const db = await getSupabaseAdmin();
    const secretTag = `ZETA99${Date.now().toString().slice(-4)}`;

    const ft = await createFastTrackJob(
      {
        clientName: `Ultra Secret ${secretTag}`,
        expectedFeeAed: 90_000,
        urgency: 'IMMEDIATE_CASH',
      },
      warda,
    );

    const adminResults = await runUnifiedSearch(secretTag, admin);
    expect(adminResults.some((r) => r.title.includes(secretTag))).toBe(false);

    const wardaResults = await runUnifiedSearch(secretTag, warda);
    expect(wardaResults.some((r) => r.title.includes(secretTag))).toBe(true);

    await db.from('privacy_fast_track_jobs').delete().eq('id', ft.id);
  });
});
