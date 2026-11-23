import { createHmac, timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { getDb } from '@/server/db';
import { extractClientIp } from '@/server/auth';
import { ingestWebsiteLeadToOs } from '@/server/engines/swk-enterprise-engine';

const RATE_WINDOW_MS = 10 * 60_000;
const RATE_MAX_REQUESTS = 30;
const ipHits = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (ipHits.get(ip) || []).filter((ts) => now - ts < RATE_WINDOW_MS);
  if (recent.length >= RATE_MAX_REQUESTS) {
    ipHits.set(ip, recent);
    return true;
  }
  recent.push(now);
  ipHits.set(ip, recent);
  return false;
}

function buildCorsHeaders(req: Request): Record<string, string> {
  const configuredOrigin = process.env.BW_PUBLIC_SITE_ORIGIN?.trim();
  const reqOrigin = req.headers.get('origin') || '';
  let allowOrigin = configuredOrigin || 'https://betterwaymortgages.vercel.app';
  if (process.env.NODE_ENV !== 'production' && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(reqOrigin)) {
    allowOrigin = reqOrigin;
  }
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Betterway-Signature',
    Vary: 'Origin',
  };
}

export async function OPTIONS(req: Request) {
  return new NextResponse(null, { status: 204, headers: buildCorsHeaders(req) });
}

export async function POST(req: Request) {
  const corsHeaders = buildCorsHeaders(req);
  const clientIp = extractClientIp(req);
  if (isRateLimited(clientIp)) {
    return NextResponse.json(
      { error: 'Too many enquiries from this address. Please wait a few minutes and retry.' },
      { status: 429, headers: corsHeaders },
    );
  }

  try {
    const rawBody = await req.text();
    const hmacSecret = process.env.BW_INTAKE_HMAC_SECRET?.trim();
    const sigHeader = req.headers.get('x-betterway-signature');

    // Mandatory HMAC verification whenever BW_INTAKE_HMAC_SECRET is configured (no unsigned bypass)
    if (hmacSecret) {
      if (!sigHeader) {
        return NextResponse.json(
          { error: 'Missing required X-Betterway-Signature HMAC header' },
          { status: 401, headers: corsHeaders },
        );
      }
      const provided = sigHeader.replace(/^sha256=/i, '').trim();
      const expected = createHmac('sha256', hmacSecret).update(rawBody).digest('hex');
      const provBuf = Buffer.from(provided, 'hex');
      const expBuf = Buffer.from(expected, 'hex');
      if (provBuf.length === 0 || provBuf.length !== expBuf.length || !timingSafeEqual(provBuf, expBuf)) {
        return NextResponse.json({ error: 'Invalid webhook HMAC signature' }, { status: 401, headers: corsHeaders });
      }
    }

    const payload = JSON.parse(rawBody);
    const contactName = String(payload.contactName || payload.fullName || payload.name || '').trim();
    const contactPhone = String(payload.contactPhone || payload.phone || '').trim();
    if (!contactName || !contactPhone) {
      return NextResponse.json(
        { error: 'contactName and contactPhone are required' },
        { status: 400, headers: corsHeaders },
      );
    }

    const partnerSuffix = payload.partnerRef ? ` [Partner Ref: ${String(payload.partnerRef).trim()}]` : '';
    const result = ingestWebsiteLeadToOs(getDb(), {
      fullName: contactName,
      phone: contactPhone,
      email: String(payload.contactEmail || payload.email || ''),
      residency: String(payload.residency || 'Expat resident'),
      goal: String(payload.goal || payload.transactionType || 'Buy a ready home'),
      propertyValueAed: Number(payload.propertyPriceAed || payload.propertyValueAed || payload.price || 2_500_000),
      downPaymentPct: Number(payload.downPaymentPct || 20),
      monthlyIncomeAed: Number(payload.monthlyIncomeAed || 45_000),
      topic: `${String(payload.topic || 'Website Mortgage Enquiry')}${partnerSuffix}`,
      preferredSlot: payload.preferredSlot ? String(payload.preferredSlot) : undefined,
      sourcePage: payload.sourcePage ? String(payload.sourcePage) : undefined,
      agencyName: payload.agencyName ? String(payload.agencyName) : undefined,
      reraOrn: payload.reraOrn ? String(payload.reraOrn) : undefined,
      reraBrn: payload.reraBrn ? String(payload.reraBrn) : undefined,
    });

    return NextResponse.json(
      {
        ok: true,
        leadId: result.leadId,
        referenceCode: result.referenceCode,
        assignedAdvisor: {
          name: result.assignedAdvisor.fullNameEn,
          designation: result.assignedAdvisor.designation,
          email: result.assignedAdvisor.email,
        },
      },
      { status: 201, headers: corsHeaders },
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Lead intake failed' },
      { status: 400, headers: corsHeaders },
    );
  }
}
