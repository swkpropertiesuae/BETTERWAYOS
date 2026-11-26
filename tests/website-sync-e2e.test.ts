import { describe, it, expect } from 'vitest';
import {
  getPublicCmsPayload,
  upsertWebsiteOffer,
  signPortalUploadUrl,
  signCmsWebhookBody,
  verifyCmsWebhookSignature,
} from '@/lib/cms/service';
import { createMortgageCaseWithVault, ingestDailyEnquiry } from '@/lib/pipeline/service';
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

describe('Task 12: Two-Way Website & Social Studio Sync (Zero-SWK Guard + Portal Upload Token + HMAC)', () => {
  it('publishes live Hot Offers into Public CMS immediately and strictly enforces Zero-SWK public branding', async () => {
    const warda = mockSession('warda@betterwaymortgages.com');
    const db = await getSupabaseAdmin();
    const id = `OFF-TEST-${Date.now().toString().slice(-5)}`;

    await upsertWebsiteOffer(
      {
        id,
        slug: id.toLowerCase(),
        tab_label: 'Live Flash Desk',
        badge: '3.79% Fixed',
        headline: 'Exclusive Dubai Marina 3.79% Fixed Offer (Zero SWK Leak Test)',
        summary: 'Compare 24 UAE banks with Betterway Mortgages LLC and zero broker fee.',
        highlights: ['Up to 80% Expat LTV', 'Written FOL comparison upfront'],
        bank_key: 'emirates-nbd',
        rate_badge: '3.79% Fixed',
        cta_href: '/get-started?goal=new-mortgage',
        cta_label: 'Check Eligibility',
        published: true,
        spotlight: true,
        sort_order: 99,
      },
      warda,
    );

    const cms = await getPublicCmsPayload();
    const rawJson = JSON.stringify(cms).toLowerCase();

    expect(cms.offers.some((o) => o.id === id)).toBe(true);
    expect(cms.banners.length).toBeGreaterThanOrEqual(1);
    expect(cms.rates.length).toBeGreaterThanOrEqual(1);
    expect(cms.team.length).toBe(8);
    // Strict Zero-SWK public website guard
    expect(rawJson).not.toContain('swk');

    // Cleanup test offer
    await db.from('website_offers').delete().eq('id', id);
  });

  it('rejects invalid borrower portal_token and issues real Supabase Private Storage upload URL for valid token', async () => {
    const db = await getSupabaseAdmin();
    const warda = mockSession('warda@betterwaymortgages.com');

    await expect(
      signPortalUploadUrl({ portalToken: 'bad-token-000', docType: 'Passport', fileName: 'passport.pdf' }),
    ).rejects.toThrow(/INVALID_PORTAL_TOKEN/);

    const lead = await ingestDailyEnquiry({
      contactName: 'Portal Upload Borrower',
      contactPhone: '+971506667788',
      sourceChannel: 'Website',
      community: 'Dubai Marina',
      propertyPriceAed: 2_000_000,
    });
    const created = await createMortgageCaseWithVault(
      {
        leadId: lead.id,
        borrowerName: 'Portal Upload Borrower',
        borrowerPhone: '+971506667788',
        propertyPriceAed: 2_000_000,
        requestedLoanAed: 1_600_000,
        monthlyIncomeAed: 45_000,
        community: 'Dubai Marina',
      },
      warda,
    );
    const signed = await signPortalUploadUrl({
      portalToken: String(created.mortgageCase.portal_token),
      docType: 'Passport',
      fileName: 'passport-front.pdf',
    });

    expect(signed.signedUrl).toContain('supabase.co/storage');
    expect(signed.storagePath).toContain(created.mortgageCase.id);

    // Cleanup
    await db.from('mortgage_cases').delete().eq('id', created.mortgageCase.id);
    await db.from('leads').delete().eq('id', lead.id);
  });

  it('signs and verifies two-way CMS cache revalidation HMAC-SHA256 webhooks', () => {
    const payload = JSON.stringify({ tag: 'betterway-cms', ts: Date.now() });
    const sig = signCmsWebhookBody(payload);
    expect(verifyCmsWebhookSignature(payload, sig)).toBe(true);
    expect(verifyCmsWebhookSignature(payload, 'sha256=0000')).toBe(false);
  });
});
