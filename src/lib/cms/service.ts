import crypto from 'node:crypto';
import type { SessionUser } from '@/lib/domain/types';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { EIBOR_SNAPSHOT } from '@/lib/domain/banks';
import { PIPELINE_STAGES } from '@/lib/domain/workflow';

function sanitizePublicText(val: unknown): string {
  return String(val ?? '')
    .replace(/\bswk\s*properties(?:\s*llc)?\b/gi, 'Betterway Partner Network')
    .replace(/\bswk\b/gi, 'Betterway')
    .trim();
}

function sanitizeDeep<T>(value: T): T {
  if (typeof value === 'string') return sanitizePublicText(value) as T;
  if (Array.isArray(value)) return value.map((v) => sanitizeDeep(v)) as T;
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = sanitizeDeep(v);
    }
    return out as T;
  }
  return value;
}

export function getCmsWebhookSecret(): string {
  return process.env.BW_CMS_REVALIDATE_SECRET || process.env.BW_INTAKE_HMAC_SECRET || 'betterway-dev-cms-secret';
}

export function signCmsWebhookBody(rawBody: string): string {
  const sig = crypto.createHmac('sha256', getCmsWebhookSecret()).update(rawBody).digest('hex');
  return `sha256=${sig}`;
}

export function verifyCmsWebhookSignature(rawBody: string, headerSig: string | null): boolean {
  if (!headerSig) return false;
  const expected = signCmsWebhookBody(rawBody);
  const a = Buffer.from(headerSig);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export async function triggerWebsiteRevalidate(tag = 'betterway-cms'): Promise<{ triggered: boolean; status?: number }> {
  const base = (process.env.BW_WEBSITE_URL || '').trim().replace(/\/$/, '');
  if (!base || base.includes('example.com')) {
    return { triggered: false };
  }
  const body = JSON.stringify({ tag, updatedAt: new Date().toISOString() });
  try {
    const res = await fetch(`${base}/api/cms/revalidate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-betterway-signature': signCmsWebhookBody(body),
      },
      body,
      signal: AbortSignal.timeout(4000),
    });
    return { triggered: res.ok, status: res.status };
  } catch {
    return { triggered: false };
  }
}

export async function getPublicCmsPayload() {
  const db = await getSupabaseAdmin();
  const [offersRes, bannersRes, ratesRes, teamRes] = await Promise.all([
    db.from('website_offers').select('*').eq('published', true).order('sort_order', { ascending: true }),
    db.from('website_banners').select('*').eq('active', true).order('updated_at', { ascending: false }),
    db.from('website_bank_rates').select('*').eq('published', true).order('rate_pct', { ascending: true }),
    db.from('website_team_sync').select('*').eq('published', true).order('sort_order', { ascending: true }),
  ]);

  return sanitizeDeep({
    brand: 'Betterway Mortgages LLC',
    office: 'Al Nasr Plaza, Plot 319-310, Oud Metha Road, Dubai, UAE',
    syncedAt: new Date().toISOString(),
    eibor: EIBOR_SNAPSHOT,
    offers: (offersRes.data ?? []).map((o) => ({
      id: o.id,
      slug: o.slug,
      tab: o.tab_label,
      badge: o.badge,
      title: o.headline,
      summary: o.summary,
      highlights: Array.isArray(o.highlights) ? o.highlights : [],
      bankKey: o.bank_key,
      rateBadge: o.rate_badge,
      ctaHref: o.cta_href,
      ctaLabel: o.cta_label,
      spotlight: Boolean(o.spotlight),
    })),
    banners: (bannersRes.data ?? []).map((b) => ({
      id: b.id,
      placement: b.placement,
      badge: b.badge,
      message: b.message,
      ctaLabel: b.cta_label,
      ctaHref: b.cta_href,
    })),
    rates: (ratesRes.data ?? []).map((r) => ({
      id: r.id,
      bankKey: r.bank_key,
      bankName: r.bank_name,
      productName: r.product_name,
      ratePct: Number(r.rate_pct),
      fixedYears: Number(r.fixed_years),
      revertMarginPct: Number(r.revert_margin_pct),
      maxLtvPct: Number(r.max_ltv_pct),
      islamic: Boolean(r.islamic),
      featured: Boolean(r.featured),
      verifiedAt: r.verified_at,
    })),
    team: (teamRes.data ?? []).map((t) => ({
      id: t.id,
      slug: t.slug,
      name: t.name,
      nameAr: t.name_ar,
      designation: t.designation,
      department: t.department,
      category: t.category,
      email: t.email,
      portraitUrl: t.portrait_url,
      summary: t.summary,
      specialties: Array.isArray(t.specialties) ? t.specialties : [],
    })),
  });
}

export async function upsertWebsiteOffer(
  input: {
    id?: string;
    slug: string;
    tab_label: string;
    badge: string;
    headline: string;
    summary: string;
    highlights: string[];
    bank_key?: string;
    rate_badge?: string;
    cta_href?: string;
    cta_label?: string;
    spotlight?: boolean;
    published?: boolean;
    sort_order?: number;
  },
  actor: SessionUser,
) {
  const db = await getSupabaseAdmin();
  const id = input.id || `OFF-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
  const cleanRow = {
    id,
    slug: sanitizePublicText(input.slug).toLowerCase().replace(/[^a-z0-9-]+/g, '-'),
    tab_label: sanitizePublicText(input.tab_label),
    badge: sanitizePublicText(input.badge),
    headline: sanitizePublicText(input.headline),
    summary: sanitizePublicText(input.summary),
    highlights: (input.highlights || []).map((h) => sanitizePublicText(h)).filter(Boolean),
    bank_key: input.bank_key || 'emirates-nbd',
    rate_badge: sanitizePublicText(input.rate_badge || '3.89% Fixed'),
    cta_href: input.cta_href || '/get-started',
    cta_label: sanitizePublicText(input.cta_label || 'Check Eligibility'),
    spotlight: Boolean(input.spotlight),
    published: input.published !== false,
    sort_order: Number(input.sort_order ?? 10),
    updated_by: actor.id,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await db.from('website_offers').upsert(cleanRow, { onConflict: 'id' }).select('*').single();
  if (error || !data) throw new Error(`Offer save failed: ${error?.message}`);

  const revalidate = await triggerWebsiteRevalidate();
  return { offer: data, revalidate };
}

export async function upsertWebsiteBanner(
  input: {
    id?: string;
    placement?: string;
    badge: string;
    message: string;
    cta_label?: string;
    cta_href?: string;
    active?: boolean;
  },
  actor: SessionUser,
) {
  const db = await getSupabaseAdmin();
  const id = input.id || 'BNR-TOP-01';
  const { data, error } = await db
    .from('website_banners')
    .upsert(
      {
        id,
        placement: input.placement || 'top_bar',
        badge: sanitizePublicText(input.badge),
        message: sanitizePublicText(input.message),
        cta_label: sanitizePublicText(input.cta_label || 'Compare Rates'),
        cta_href: input.cta_href || '/hot-offers',
        active: input.active !== false,
        updated_by: actor.id,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' },
    )
    .select('*')
    .single();
  if (error || !data) throw new Error(`Banner save failed: ${error?.message}`);
  const revalidate = await triggerWebsiteRevalidate();
  return { banner: data, revalidate };
}

export async function upsertWebsiteBankRate(
  input: {
    id?: string;
    bank_key: string;
    bank_name: string;
    product_name: string;
    rate_pct: number;
    fixed_years?: number;
    revert_margin_pct?: number;
    max_ltv_pct?: number;
    islamic?: boolean;
    featured?: boolean;
    published?: boolean;
  },
  actor: SessionUser,
) {
  const db = await getSupabaseAdmin();
  const id = input.id || `RATE-${input.bank_key.toUpperCase().slice(0, 12)}`;
  const { data, error } = await db
    .from('website_bank_rates')
    .upsert(
      {
        id,
        bank_key: input.bank_key,
        bank_name: sanitizePublicText(input.bank_name),
        product_name: sanitizePublicText(input.product_name),
        rate_pct: Number(input.rate_pct),
        fixed_years: Number(input.fixed_years ?? 3),
        revert_margin_pct: Number(input.revert_margin_pct ?? 1.49),
        max_ltv_pct: Number(input.max_ltv_pct ?? 80),
        islamic: Boolean(input.islamic),
        featured: Boolean(input.featured),
        published: input.published !== false,
        updated_by: actor.id,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'bank_key' },
    )
    .select('*')
    .single();
  if (error || !data) throw new Error(`Bank rate save failed: ${error?.message}`);
  const revalidate = await triggerWebsiteRevalidate();
  return { rate: data, revalidate };
}

export async function createSocialCampaign(
  input: {
    title: string;
    platform: string;
    campaign_utm: string;
    target_url?: string;
    status?: string;
    budget_aed?: number;
    caption?: string;
  },
  actor: SessionUser,
) {
  const db = await getSupabaseAdmin();
  const { data, error } = await db
    .from('social_campaigns')
    .insert({
      title: sanitizePublicText(input.title),
      platform: input.platform || 'Instagram',
      campaign_utm: input.campaign_utm.trim(),
      target_url: input.target_url || 'https://betterwaymortgages.com/hot-offers',
      status: input.status || 'Live',
      budget_aed: Number(input.budget_aed || 0),
      caption: sanitizePublicText(input.caption || ''),
      owner_id: actor.id,
    })
    .select('*')
    .single();
  if (error || !data) throw new Error(`Campaign create failed: ${error?.message}`);
  return data;
}

export async function signPortalUploadUrl(input: {
  portalToken: string;
  docType: string;
  fileName: string;
}) {
  const token = String(input.portalToken || '').trim();
  if (!token || token.length < 12) {
    throw new Error('INVALID_PORTAL_TOKEN: Valid borrower portal token is required.');
  }

  const db = await getSupabaseAdmin();
  const { data: caseRow } = await db
    .from('mortgage_cases')
    .select('id,case_code,borrower_name')
    .eq('portal_token', token)
    .eq('deleted_soft', false)
    .maybeSingle();

  if (!caseRow) {
    throw new Error('INVALID_PORTAL_TOKEN: Borrower portal session not found.');
  }

  const safeName = String(input.fileName || 'document.pdf')
    .replace(/[^a-zA-Z0-9._-]+/g, '_')
    .slice(0, 80);
  const storagePath = `cases/${caseRow.id}/portal-${Date.now()}-${safeName}`;

  const { data: signed, error } = await db.storage.from('client-vault').createSignedUploadUrl(storagePath);
  if (error || !signed) {
    throw new Error(`Storage upload signing failed: ${error?.message}`);
  }

  await db
    .from('case_documents')
    .update({ status: 'Uploaded', storage_path: storagePath, updated_at: new Date().toISOString() })
    .eq('case_id', caseRow.id)
    .ilike('doc_type', `%${input.docType}%`);

  return {
    caseCode: caseRow.case_code,
    storagePath,
    signedUrl: signed.signedUrl,
    token: signed.token,
  };
}

export async function getPublicCaseStatus(queryRef: string) {
  const ref = String(queryRef || '').trim();
  if (!ref) return null;
  const db = await getSupabaseAdmin();

  const { data: c } = await db
    .from('mortgage_cases')
    .select('case_code,borrower_name,stage_code,community,property_price_aed,requested_loan_aed,updated_at')
    .or(`case_code.eq.${ref},portal_token.eq.${ref}`)
    .eq('deleted_soft', false)
    .maybeSingle();

  if (!c) return null;
  const stageIdx = PIPELINE_STAGES.findIndex((s) => s.code === c.stage_code);
  const stage = PIPELINE_STAGES[stageIdx] ?? PIPELINE_STAGES[0];
  return {
    caseCode: c.case_code,
    borrowerFirstName: String(c.borrower_name || '').split(' ')[0],
    stageStep: stage.order,
    stageCode: stage.code,
    stageTitle: stage.label,
    progressPct: Math.round((stage.order / PIPELINE_STAGES.length) * 100),
    community: c.community,
    updatedAt: c.updated_at,
  };
}
