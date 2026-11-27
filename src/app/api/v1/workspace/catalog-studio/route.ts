import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import { requireOwner } from '@/lib/auth/session';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { logAudit } from '@/lib/auth/approvals';
import {
  assertCleanBetterwayPublicText,
  DEFAULT_BROCHURE_THEME,
  normalizeBrochureTheme,
} from '@/lib/workspace/domain';

export async function GET() {
  const auth = await requireOwner();
  if ('error' in auth) return auth.error;

  const db = await getSupabaseAdmin();
  const [commRes, devRes, propRes, unitRes, themeRes] = await Promise.all([
    db.from('communities').select('*').order('name', { ascending: true }).limit(120),
    db.from('developers').select('*').order('name', { ascending: true }).limit(120),
    db.from('master_properties').select('*').order('created_at', { ascending: false }).limit(120),
    db.from('property_units').select('*').order('created_at', { ascending: false }).limit(120),
    db.from('app_settings').select('value').eq('key', 'catalog:default_brochure_theme').maybeSingle(),
  ]);

  const defaultTheme = normalizeBrochureTheme((themeRes.data?.value as Record<string, unknown>) ?? DEFAULT_BROCHURE_THEME);

  return NextResponse.json({
    communities: commRes.data ?? [],
    developers: devRes.data ?? [],
    properties: propRes.data ?? [],
    units: unitRes.data ?? [],
    defaultTheme,
  });
}

export async function POST(req: Request) {
  const auth = await requireOwner();
  if ('error' in auth) return auth.error;

  try {
    const body = await req.json();
    const db = await getSupabaseAdmin();

    if (body.action === 'save_default_theme') {
      const theme = normalizeBrochureTheme(body.theme);
      assertCleanBetterwayPublicText(theme);
      const { error } = await db
        .from('app_settings')
        .upsert({ key: 'catalog:default_brochure_theme', value: theme, updated_by: auth.user.id, updated_at: new Date().toISOString() });
      if (error) throw new Error(error.message);
      await logAudit(auth.user, 'app_settings', 'catalog:default_brochure_theme', 'BROCHURE_DEFAULT_THEME_UPDATED', { preset: theme.preset });
      return NextResponse.json({ ok: true, defaultTheme: theme });
    }

    if (body.action === 'save_theme') {
      const entity = String(body.entity || '');
      const id = String(body.id || '');
      const tableMap: Record<string, string> = {
        community: 'communities',
        developer: 'developers',
        property: 'master_properties',
        unit: 'property_units',
      };
      const table = tableMap[entity];
      if (!table || !id) return NextResponse.json({ error: 'Invalid entity or id' }, { status: 400 });
      const theme = normalizeBrochureTheme(body.theme);
      assertCleanBetterwayPublicText(theme);
      const { data, error } = await db
        .from(table)
        .update({ brochure_theme_json: theme, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select('*')
        .single();
      if (error) throw new Error(error.message);
      await logAudit(auth.user, table, id, 'BROCHURE_THEME_SAVED', { preset: theme.preset });
      return NextResponse.json({ ok: true, record: data });
    }

    // Unified 4-Entity Creator (Community / Developer / Project / Unit) with full details, materials & brochure theme
    const entity = String(body.entity || 'property');
    const theme = normalizeBrochureTheme(body.brochureTheme);
    const materialsSpec = body.materialsSpec ?? {};
    const marketingDetails = body.marketingDetails ?? {};
    assertCleanBetterwayPublicText({ name: body.name, description: body.description, theme, materialsSpec, marketingDetails });

    const uid = crypto.randomBytes(3).toString('hex').toUpperCase();
    const cleanCode = String(body.code || `${entity.slice(0, 3).toUpperCase()}-${uid}`).toUpperCase();

    if (entity === 'community') {
      const id = `COM-${uid}`;
      const { data, error } = await db
        .from('communities')
        .insert({
          id,
          code: cleanCode,
          name: String(body.name || '').trim(),
          name_ar: String(body.nameAr || '').trim(),
          emirate: body.emirate || 'Dubai',
          area_zone: String(body.areaZone || '').trim(),
          rera_code: String(body.reraCode || '').trim(),
          avg_sqft_aed: Number(body.avgSqftAed || 0),
          gross_yield_pct: Number(body.grossYieldPct || 0),
          mortgage_demand: body.mortgageDemand || 'High',
          stock_type: String(body.stockType || 'Apartments & Villas'),
          major_developers: String(body.majorDevelopers || ''),
          image_url: String(body.coverImageUrl || ''),
          description: String(body.description || ''),
          brochure_theme_json: theme,
          materials_spec_json: materialsSpec,
          marketing_details_json: marketingDetails,
        })
        .select('*')
        .single();
      if (error) throw new Error(error.message);
      await logAudit(auth.user, 'communities', id, 'CATALOG_COMMUNITY_CREATED', { code: cleanCode, name: data.name });
      return NextResponse.json({ ok: true, record: data }, { status: 201 });
    }

    if (entity === 'developer') {
      const id = `DEV-${uid}`;
      const { data, error } = await db
        .from('developers')
        .insert({
          id,
          code: cleanCode,
          name: String(body.name || '').trim(),
          emirate: body.emirate || 'Dubai',
          rera_dev_no: String(body.reraDevNo || '').trim(),
          apl_tier: String(body.aplTier || 'Tier 1 — All 24 Banks'),
          noc_portal: String(body.nocPortal || ''),
          escrow_banks: String(body.escrowBanks || ''),
          website: String(body.website || ''),
          logo_url: String(body.coverImageUrl || ''),
          description: String(body.description || ''),
          brochure_theme_json: theme,
          materials_spec_json: materialsSpec,
          marketing_details_json: marketingDetails,
        })
        .select('*')
        .single();
      if (error) throw new Error(error.message);
      await logAudit(auth.user, 'developers', id, 'CATALOG_DEVELOPER_CREATED', { code: cleanCode, name: data.name });
      return NextResponse.json({ ok: true, record: data }, { status: 201 });
    }

    if (entity === 'unit') {
      const id = `UNT-${uid}`;
      const { data, error } = await db
        .from('property_units')
        .insert({
          id,
          code: cleanCode,
          property_id: body.propertyId || null,
          unit_number: String(body.unitNumber || body.name || '').trim(),
          floor_no: String(body.floorNo || '').trim(),
          bedrooms: String(body.bedrooms || '2BR').trim(),
          area_sqft: Number(body.areaSqft || 0),
          title_deed_no: String(body.titleDeedNo || '').trim(),
          oqood_no: String(body.oqoodNo || '').trim(),
          asking_price_aed: Number(body.askingPriceAed || 0),
          yearly_rent_aed: Number(body.yearlyRentAed || 0),
          unit_type: String(body.unitType || 'Apartment'),
          view_label: String(body.viewLabel || ''),
          cover_image_url: String(body.coverImageUrl || ''),
          description: String(body.description || ''),
          brochure_theme_json: theme,
          materials_spec_json: materialsSpec,
          marketing_details_json: marketingDetails,
        })
        .select('*')
        .single();
      if (error) throw new Error(error.message);
      await logAudit(auth.user, 'property_units', id, 'CATALOG_UNIT_CREATED', { code: cleanCode, unitNumber: data.unit_number });
      return NextResponse.json({ ok: true, record: data }, { status: 201 });
    }

    // Default: Project / Building (`master_properties`)
    const id = `PRJ-${uid}`;
    const { data, error } = await db
      .from('master_properties')
      .insert({
        id,
        code: cleanCode,
        name: String(body.name || '').trim(),
        community_id: body.communityId || null,
        developer_id: body.developerId || null,
        emirate: body.emirate || 'Dubai',
        plot_dm_number: String(body.plotDmNumber || '').trim(),
        property_class: String(body.propertyClass || 'Residential Tower'),
        completion_status: body.completionStatus || 'Off-Plan',
        bank_apl_approved: body.bankAplApproved !== false,
        starting_price_aed: Number(body.startingPriceAed || 0),
        handover_quarter: String(body.handoverQuarter || '').trim(),
        payment_plan_summary: String(body.paymentPlanSummary || '').trim(),
        cover_image_url: String(body.coverImageUrl || ''),
        description: String(body.description || ''),
        brochure_theme_json: theme,
        materials_spec_json: materialsSpec,
        marketing_details_json: marketingDetails,
      })
      .select('*')
      .single();
    if (error) throw new Error(error.message);
    await logAudit(auth.user, 'master_properties', id, 'CATALOG_PROJECT_CREATED', { code: cleanCode, name: data.name });
    return NextResponse.json({ ok: true, record: data }, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Catalog Studio error' }, { status: 400 });
  }
}
