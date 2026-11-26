import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import { ingestDailyEnquiry } from '@/lib/pipeline/service';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

/**
 * 100% backwards-compatible public website intake endpoint for betterwaymortgages.com (/api/os/leads).
 * Verifies optional HMAC-SHA256 signature if BW_INTAKE_HMAC_SECRET is configured.
 */
export async function POST(req: Request) {
  try {
    const rawText = await req.text();
    const secret = process.env.BW_INTAKE_HMAC_SECRET?.trim();
    const sigHeader = req.headers.get('x-betterway-signature');
    if (secret) {
      if (!sigHeader) {
        return NextResponse.json({ error: 'Missing x-betterway-signature HMAC header' }, { status: 401 });
      }
      const expected = `sha256=${crypto.createHmac('sha256', secret).update(rawText).digest('hex')}`;
      const a = Buffer.from(sigHeader);
      const b = Buffer.from(expected);
      if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
        return NextResponse.json({ error: 'Invalid HMAC signature' }, { status: 401 });
      }
    }

    const b = JSON.parse(rawText || '{}') as Record<string, unknown>;
    const contactName = String(b.contactName ?? b.name ?? '').trim();
    const contactPhone = String(b.contactPhone ?? b.phone ?? '').trim();
    if (!contactName || !contactPhone) {
      return NextResponse.json({ error: 'contactName and contactPhone are required.' }, { status: 400 });
    }

    const lead = await ingestDailyEnquiry({
      contactName,
      contactPhone,
      contactEmail: String(b.contactEmail ?? b.email ?? ''),
      residency: String(b.residency ?? 'Expat resident'),
      goal: String(b.goal ?? b.topic ?? 'Resale Purchase (Secondary)'),
      propertyPriceAed: Number(b.propertyPriceAed ?? b.price ?? 2_500_000),
      downPaymentPct: Number(b.downPaymentPct ?? 20),
      monthlyIncomeAed: Number(b.monthlyIncomeAed ?? b.income ?? 45_000),
      community: String(b.community ?? ''),
      sourceChannel: b.agencyName ? 'Partner Hub' : String(b.source ?? 'Website'),
      sourcePage: String(b.sourcePage ?? '/contact'),
      partnerAgency: String(b.agencyName ?? ''),
      partnerBrn: String(b.reraBrn ?? ''),
      notes: String(b.notes ?? b.topic ?? ''),
    });

    const db = await getSupabaseAdmin();
    const { data: adv } = await db
      .from('users')
      .select('name,designation,email')
      .eq('id', lead.assigned_to)
      .maybeSingle();

    return NextResponse.json(
      {
        ok: true,
        syncedToOs: true,
        leadId: lead.id,
        referenceCode: lead.reference_code,
        assignedAdvisor: adv || {
          name: 'Betterway Advisory Desk',
          designation: 'Mortgage Advisor',
          email: 'hello@betterwaymortgages.com',
        },
      },
      { status: 201 },
    );
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Intake error' }, { status: 400 });
  }
}
