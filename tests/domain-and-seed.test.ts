import { describe, it, expect } from 'vitest';
import { OFFICIAL_ROSTER } from '@/lib/domain/staff';
import { MASTER_REGISTRIES } from '@/lib/domain/masters';
import { PIPELINE_STAGES, CORE_DOCUMENT_CHECKLIST } from '@/lib/domain/workflow';
import { calculateCbuaeEligibility, calculateCtoAndAvgBalance } from '@/lib/domain/cbuae-math';
import { SEED_CASE_STUDIES } from '@/lib/domain/case-studies';

describe('Task 2: Domain Models, Co-Owner Equality, 22 Masters, 12 Stages & CBUAE Math', () => {
  it('gives Warda Kapadia and Shabib Siraj 100% identical OWNER authority with distinct personal titles', () => {
    const warda = OFFICIAL_ROSTER.find((u) => u.email === 'warda@betterwaymortgages.com');
    const shabib = OFFICIAL_ROSTER.find((u) => u.email === 'shabib@betterwaymortgages.com');
    expect(warda).toBeDefined();
    expect(shabib).toBeDefined();
    expect(warda!.role).toBe('OWNER');
    expect(shabib!.role).toBe('OWNER');
    expect(warda!.designation).toBe('Founder & Managing Director');
    expect(shabib!.designation).toBe('Executive Director');
    expect(warda!.portraitUrl).toContain('warda-kapadia');
    expect(shabib!.portraitUrl).toContain('shabib-siraj');
    expect(OFFICIAL_ROSTER).toHaveLength(9); // 8 specialists + Office Admin
    expect(OFFICIAL_ROSTER.find((u) => u.email === 'elton@betterwaymortgages.com')?.designation).toBe('Operations Manager');
    expect(OFFICIAL_ROSTER.find((u) => u.email === 'nusrik@betterwaymortgages.com')?.designation).toBe('IT & Marketing');
    expect(OFFICIAL_ROSTER.find((u) => u.email === 'reshma@betterwaymortgages.com')?.designation).toBe('Advisor');
  });

  it('defines all 22 CORE Master Log registries with strict security write policies', () => {
    expect(MASTER_REGISTRIES).toHaveLength(22);
    const byKey = Object.fromEntries(MASTER_REGISTRIES.map((m) => [m.key, m]));
    expect(byKey.communities.writePolicy).toBe('ADMIN_APPROVAL_REQUIRED');
    expect(byKey.developers.writePolicy).toBe('ADMIN_APPROVAL_REQUIRED');
    expect(byKey.office_branches.writePolicy).toBe('OWNER_ONLY');
    expect(byKey.roles_permissions.writePolicy).toBe('OWNER_ONLY');
    expect(byKey.employees.writePolicy).toBe('OWNER_ONLY_SALARY_ROLE');
    expect(byKey.contacts.writePolicy).toBe('OPERATIONAL_FREE_CREATE');
  });

  it('defines the exact 12 pipeline stages and 13+ mandatory core client documents', () => {
    expect(PIPELINE_STAGES).toHaveLength(12);
    expect(PIPELINE_STAGES[0].code).toBe('01_ENQUIRY');
    expect(PIPELINE_STAGES[5].code).toBe('06_PRE_APPROVAL');
    expect(PIPELINE_STAGES[8].code).toBe('09_DEVELOPER_NOC');
    expect(PIPELINE_STAGES[10].code).toBe('11_COMMISSION');
    expect(PIPELINE_STAGES[11].code).toBe('12_CLIENT_CARE');
    expect(CORE_DOCUMENT_CHECKLIST.length).toBeGreaterThanOrEqual(13);
  });

  it('calculates CBUAE 50% stressed DBR, LTV tiers, age caps, and CTO/Avg Balance Low-Doc eligibility', () => {
    const res = calculateCbuaeEligibility({
      propertyPriceAed: 3_000_000,
      monthlyIncomeAed: 45_000,
      existingEmisAed: 2_000,
      creditCardLimitsAed: 40_000, // 5% = 2,000/mo
      residency: 'expat_resident',
      borrowerProfile: 'salaried',
      ageYears: 38,
      isFirstHome: true,
      interestRatePct: 3.99,
      stressRatePct: 6.5,
    });
    expect(res.maxLtvPct).toBe(80);
    expect(res.maxTenureYears).toBe(25);
    expect(res.stressedDbrPct).toBeLessThanOrEqual(50);
    expect(res.eligible).toBe(true);

    const cto = calculateCtoAndAvgBalance([
      { month: 'Apr', creditsAed: 48_000, minBalanceAed: 18_000, avgBalanceAed: 29_000 },
      { month: 'May', creditsAed: 52_000, minBalanceAed: 21_000, avgBalanceAed: 32_000 },
      { month: 'Jun', creditsAed: 44_000, minBalanceAed: 16_500, avgBalanceAed: 27_500 },
      { month: 'Jul', creditsAed: 51_000, minBalanceAed: 19_000, avgBalanceAed: 31_000 },
      { month: 'Aug', creditsAed: 46_000, minBalanceAed: 17_000, avgBalanceAed: 28_000 },
      { month: 'Sep', creditsAed: 53_000, minBalanceAed: 22_000, avgBalanceAed: 34_000 },
    ]);
    expect(cto.avgMonthlyCreditsAed).toBe(49_000);
    expect(cto.qualifiesLowDocSelfEmployed).toBe(true);
    expect(cto.qualifiesNonResident).toBe(true);
    expect(SEED_CASE_STUDIES.length).toBeGreaterThanOrEqual(10);
  });
});
