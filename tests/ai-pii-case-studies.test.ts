import { describe, it, expect } from 'vitest';
import { scrubPiiForLlm } from '@/lib/ai/pii-shield';
import { answerUnderwritingQuery, addTrainedCaseStudy } from '@/lib/ai/underwriting-engine';
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

describe('Task 11: PDPL PII Shield & Case-Study-Trained AI Underwriting Engine', () => {
  it('strips Emirates ID, UAE phone numbers, IBANs, and emails before any external LLM dispatch', () => {
    const raw =
      'Client EID 784-1988-1234567-1, phone +971 50 441 8821, IBAN AE070331234567890123456, email ceo@private.ae needs Low-Doc loan.';
    const out = scrubPiiForLlm(raw);
    expect(out.redactions).toBeGreaterThanOrEqual(4);
    expect(out.sanitized).not.toContain('784-1988-1234567-1');
    expect(out.sanitized).not.toContain('441 8821');
    expect(out.sanitized).not.toContain('AE070331234567890123456');
    expect(out.sanitized).toContain('[REDACTED_EID]');
    expect(out.sanitized).toContain('[REDACTED_PHONE]');
    expect(out.sanitized).toContain('[REDACTED_IBAN]');
  });

  it('retrieves Betterway 15-Year Underwriting Playbook case studies AND immediately learns newly trained scenarios', async () => {
    const warda = mockSession('warda@betterwaymortgages.com');
    const db = await getSupabaseAdmin();

    // Seeded case study query (Low-Doc Self-Employed)
    const res1 = await answerUnderwritingQuery('What are the Low-Doc self-employed rules for personal bank statements?', warda);
    expect(res1.matchedScenarios.some((s) => s.scenario_code === 'CS-003')).toBe(true);
    expect(res1.answer).toContain('40,000');

    // Train a brand-new bespoke scenario and verify AI immediately learns & cites it
    const uniqueKeyword = `PENTHOUSEX${Date.now().toString().slice(-4)}`;
    const created = await addTrainedCaseStudy(
      {
        title: `Custom Trained Scenario ${uniqueKeyword}`,
        category: 'Private Wealth',
        borrowerProfile: 'non_resident',
        mortgageType: 'Non-Resident Purchase',
        challenge: `Golden Visa buyer purchasing ${uniqueKeyword} with Swiss Franc salary.`,
        banksConsidered: ['HSBC UAE', 'Emirates NBD'],
        winningBank: 'Emirates NBD',
        structuringSolution: 'Applied 15% FX haircut on CHF income and secured 60% LTV.',
        outcomeLessons: 'Always obtain notarized Swiss tax assessment early.',
        tags: [uniqueKeyword.toLowerCase(), 'chf', 'non-resident'],
      },
      warda,
    );

    const res2 = await answerUnderwritingQuery(`How should we structure a ${uniqueKeyword} Swiss Franc non-resident mortgage?`, warda);
    expect(res2.matchedScenarios.some((s) => s.scenario_code === created.scenario_code)).toBe(true);
    expect(res2.answer).toContain('FX haircut');

    // Cleanup test scenario
    await db.from('case_study_scenarios').delete().eq('id', created.id);
  });
});
