import { describe, it, expect } from 'vitest';
import { parseBulkLeadText } from '@/lib/ai/bulk-parser';
import {
  createFastTrackJob,
  createFastTrackInvoice,
  listFastTrackJobs,
  getOwnerConsolidatedVatSummary,
} from '@/lib/executive/service';
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

describe('Task 5 & 6: Warda Place / Shabib Corner, Privacy Fast Track, Owner Consolidated VAT & Bulk AI Parser', () => {
  it('parses messy CSV/WhatsApp lines into deduplicated structured mortgage enquiries', () => {
    const raw = `
      Tariq Al Naimi, +971 50 441 8821, Dubai Hills Estate, Sidra Villa 44, 4800000
      Tariq Duplicate, +971504418821, Dubai Hills, 4800000
      Lisa Hartmann | +971 58 912 3304 | Palm Jumeirah | Shoreline 4 | 3450000 | lisa@example.com
    `;
    const parsed = parseBulkLeadText(raw);
    expect(parsed.items).toHaveLength(2);
    expect(parsed.duplicatesSkipped).toBe(1);
    expect(parsed.items[0].contactName).toBe('Tariq Al Naimi');
    expect(parsed.items[0].propertyPriceAed).toBe(4_800_000);
    expect(parsed.items[1].contactEmail).toBe('lisa@example.com');
  });

  it('bypasses Master Log for Privacy Fast Track jobs/invoices, enforces single-owner lock, and blocks all non-Owners', async () => {
    const warda = mockSession('warda@betterwaymortgages.com');
    const shabib = mockSession('shabib@betterwaymortgages.com');
    const admin = mockSession('admin@betterwaymortgages.com');
    const daniel = mockSession('daniel@betterwaymortgages.com');
    const db = await getSupabaseAdmin();

    // Non-Owners are strictly blocked
    await expect(listFastTrackJobs(admin)).rejects.toThrow(/OWNER_ONLY/);
    await expect(listFastTrackJobs(daniel)).rejects.toThrow(/OWNER_ONLY/);
    await expect(getOwnerConsolidatedVatSummary(admin)).rejects.toThrow(/OWNER_ONLY/);

    // Warda creates a shared Co-Owner Privacy Fast Track job WITHOUT any Master Log developer/community FK
    const sharedJob = await createFastTrackJob(
      {
        clientName: 'VIP Cash Client Shared',
        clientPhone: '+971 50 900 1111',
        communityFreeform: 'Private Off-Market Villa',
        developerFreeform: 'Unlisted Private Developer',
        propertyPriceAed: 12_000_000,
        loanAmountAed: 8_400_000,
        expectedFeeAed: 84_000,
        urgency: 'IMMEDIATE_CASH',
        privateToMeOnly: false,
      },
      warda,
    );

    // Warda creates a private-to-me-only job (hidden even from Shabib)
    const privateJob = await createFastTrackJob(
      {
        clientName: 'Warda Private Only Client',
        clientPhone: '+971 50 900 2222',
        propertyPriceAed: 5_000_000,
        loanAmountAed: 3_500_000,
        expectedFeeAed: 35_000,
        urgency: 'VIP_PRIVATE',
        privateToMeOnly: true,
      },
      warda,
    );

    // Warda issues custom 5% VAT Fast-Track Invoice (Option A: segregated from standard Accounts invoices!)
    const ftInvoice = await createFastTrackInvoice(
      {
        jobId: sharedJob.id,
        billToName: 'VIP Cash Client Shared',
        description: 'Priority Structuring & Executive Fast-Track Advisory',
        subtotalAed: 50_000,
      },
      warda,
    );
    expect(Number(ftInvoice.vat_amount_aed)).toBe(2_500);
    expect(Number(ftInvoice.total_aed)).toBe(52_500);

    // Confirm Fast-Track Invoice is NOT in standard `invoices` table visible to Admin/Accounts!
    const { data: stdLeak } = await db.from('invoices').select('*').eq('invoice_no', ftInvoice.invoice_no);
    expect(stdLeak ?? []).toHaveLength(0);

    // Shabib sees sharedJob, does NOT see Warda's privateToMeOnly job
    const shabibJobs = await listFastTrackJobs(shabib);
    expect(shabibJobs.some((j) => j.id === sharedJob.id)).toBe(true);
    expect(shabibJobs.some((j) => j.id === privateJob.id)).toBe(false);

    // Warda sees BOTH jobs and Owner Consolidated VAT includes Fast-Track VAT
    const wardaJobs = await listFastTrackJobs(warda);
    expect(wardaJobs.some((j) => j.id === privateJob.id)).toBe(true);
    const vat = await getOwnerConsolidatedVatSummary(warda);
    expect(vat.fastTrackOutputVatAed).toBeGreaterThanOrEqual(2_500);

    // Cleanup test rows
    await db.from('privacy_fast_track_jobs').delete().in('id', [sharedJob.id, privateJob.id]);
  });
});
