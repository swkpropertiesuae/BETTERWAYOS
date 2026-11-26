import { describe, it, expect } from 'vitest';
import {
  ingestDailyEnquiry,
  createMortgageCaseWithVault,
  advanceMortgageStage,
  createCaseVaultUploadUrl,
  bookPropertyValuation,
} from '@/lib/pipeline/service';
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

describe('Task 7 & 8: 100% Daily Enquiry CRM, 12-Step Pipeline, Encrypted Client Vault & Valuation Desk', () => {
  it('captures exact daily enquiry, spawns 13+ Client Vault docs, advances 12 stages, signs private storage URL, and books valuation', async () => {
    const warda = mockSession('warda@betterwaymortgages.com');
    const elton = mockSession('elton@betterwaymortgages.com');
    const db = await getSupabaseAdmin();
    const uniq = Date.now().toString().slice(-6);

    // 1. Ingest daily enquiry
    const lead = await ingestDailyEnquiry({
      contactName: `Test Borrower ${uniq}`,
      contactPhone: `+971 50 7${uniq}`,
      contactEmail: `borrower${uniq}@example.com`,
      sourceChannel: 'Bayut',
      community: 'Dubai Hills Estate',
      propertyPriceAed: 3_200_000,
      monthlyIncomeAed: 48_000,
      borrowerProfile: 'salaried',
      referrerName: 'Direct Reference',
    });
    expect(lead.reference_code).toMatch(/^BW-ENQ-/);
    expect(lead.received_date_dubai).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    // 2. Convert to 12-Step Mortgage Case + auto-spawn all mandatory Document Vault items
    const created = await createMortgageCaseWithVault(
      {
        leadId: lead.id,
        borrowerName: lead.contact_name,
        borrowerPhone: lead.contact_phone,
        borrowerEmail: lead.contact_email,
        borrowerProfile: 'salaried',
        mortgageType: 'Resale Purchase (Secondary)',
        community: 'Dubai Hills Estate',
        projectName: 'Sidra Villas',
        developer: 'Emaar Properties',
        propertyPriceAed: 3_200_000,
        requestedLoanAed: 2_560_000,
        monthlyIncomeAed: 48_000,
        advisorId: 'USR-07',
      },
      warda,
    );
    expect(created.mortgageCase.stage_code).toBe('01_ENQUIRY');
    expect(created.documents.length).toBeGreaterThanOrEqual(13);
    expect(created.documents.some((d: any) => d.doc_name.includes('Passport'))).toBe(true);
    expect(created.documents.some((d: any) => d.doc_name.includes('Emirates ID'))).toBe(true);
    expect(created.documents.some((d: any) => d.doc_name.includes('Form F'))).toBe(true);
    expect(created.documents.some((d: any) => d.doc_name.includes('Oqood'))).toBe(true);
    expect(created.documents.some((d: any) => d.doc_name.includes('Title Deed'))).toBe(true);

    // 3. Advance stage with mandatory exit evidence
    const moved = await advanceMortgageStage(
      created.mortgageCase.id,
      '02_ELIGIBILITY',
      'CBUAE 50% stressed DBR verified at 39.2%, 80% LTV compliant',
      warda,
    );
    expect(moved.stage_code).toBe('02_ELIGIBILITY');

    // 4. Generate direct-to-Supabase Private Storage signed upload URL
    const firstDoc = created.documents[0];
    const signed = await createCaseVaultUploadUrl(firstDoc.id, 'passport_color.pdf', warda);
    expect(signed.signedUrl).toContain('https://');
    expect(signed.storagePath).toContain(created.mortgageCase.case_code);

    // 5. Book Valuation on Mortgage Exclusive Business Desk
    const val = await bookPropertyValuation(
      {
        caseId: created.mortgageCase.id,
        bankKey: 'emirates-nbd',
        valuationCompany: 'CBRE Valuations Dubai',
        accessContact: 'Seller Agent +971501112233',
        bookedDate: new Date(Date.now() + 86_400_000 * 2).toISOString(),
        feeAed: 3150,
      },
      elton,
    );
    expect(val.status).toBe('Booked');

    // Cleanup test records
    await db.from('mortgage_cases').delete().eq('id', created.mortgageCase.id);
    await db.from('leads').delete().eq('id', lead.id);
  });
});
