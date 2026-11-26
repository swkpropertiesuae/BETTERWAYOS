import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/session';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import {
  createSocialCampaign,
  getPublicCmsPayload,
  triggerWebsiteRevalidate,
  upsertWebsiteBankRate,
  upsertWebsiteBanner,
  upsertWebsiteOffer,
} from '@/lib/cms/service';

export async function GET() {
  const auth = await requireSession();
  if ('error' in auth) return auth.error;
  const db = await getSupabaseAdmin();

  const [offersRes, bannersRes, ratesRes, teamRes, campaignsRes, publicPreview] = await Promise.all([
    db.from('website_offers').select('*').order('sort_order', { ascending: true }),
    db.from('website_banners').select('*').order('updated_at', { ascending: false }),
    db.from('website_bank_rates').select('*').order('rate_pct', { ascending: true }),
    db.from('website_team_sync').select('*').order('sort_order', { ascending: true }),
    db.from('social_campaigns').select('*').order('created_at', { ascending: false }).limit(50),
    getPublicCmsPayload(),
  ]);

  return NextResponse.json({
    offers: offersRes.data ?? [],
    banners: bannersRes.data ?? [],
    rates: ratesRes.data ?? [],
    team: teamRes.data ?? [],
    campaigns: campaignsRes.data ?? [],
    publicPreview,
    canPublishDirect: auth.user.role === 'OWNER' || auth.user.role === 'IT_MARKETING',
  });
}

export async function POST(req: Request) {
  const auth = await requireSession();
  if ('error' in auth) return auth.error;
  if (
    auth.user.role !== 'OWNER' &&
    auth.user.role !== 'IT_MARKETING' &&
    auth.user.role !== 'OFFICE_ADMIN'
  ) {
    return NextResponse.json({ error: 'Website & Social Studio publishing is restricted to Owners, IT/Marketing & Admin' }, { status: 403 });
  }

  try {
    const body = await req.json();
    if (body.kind === 'revalidate') {
      const res = await triggerWebsiteRevalidate();
      return NextResponse.json({ ok: true, revalidate: res });
    }
    if (body.kind === 'offer') {
      const res = await upsertWebsiteOffer(body.offer, auth.user);
      return NextResponse.json({ ok: true, ...res }, { status: 201 });
    }
    if (body.kind === 'banner') {
      const res = await upsertWebsiteBanner(body.banner, auth.user);
      return NextResponse.json({ ok: true, ...res }, { status: 201 });
    }
    if (body.kind === 'rate') {
      const res = await upsertWebsiteBankRate(body.rate, auth.user);
      return NextResponse.json({ ok: true, ...res }, { status: 201 });
    }
    if (body.kind === 'campaign') {
      const campaign = await createSocialCampaign(body.campaign, auth.user);
      return NextResponse.json({ ok: true, campaign }, { status: 201 });
    }
    return NextResponse.json({ error: 'Unknown website studio action' }, { status: 400 });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Website studio error' }, { status: 400 });
  }
}
