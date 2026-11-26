import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/session';
import { getCapabilitiesForRole } from '@/lib/auth/rbac';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { ingestDailyEnquiry } from '@/lib/pipeline/service';

export async function GET() {
  const auth = await requireSession();
  if ('error' in auth) return auth.error;
  const caps = getCapabilitiesForRole(auth.user.role);
  if (caps.pipelineScope === 'NONE') {
    return NextResponse.json({ error: 'FORBIDDEN: Sales & Partner Hub is restricted from your role.' }, { status: 403 });
  }
  const db = await getSupabaseAdmin();
  let casesQ = db
    .from('mortgage_cases')
    .select('id,case_code,borrower_name,community,property_price_aed,requested_loan_aed,stage_code,partner_agency,is_swk_relay')
    .eq('deleted_soft', false);
  let refQ = db
    .from('leads')
    .select('id,reference_code,contact_name,partner_agency,partner_brn,property_price_aed,status,created_at')
    .neq('partner_agency', '')
    .order('created_at', { ascending: false });
  if (caps.pipelineScope === 'OWN') {
    casesQ = casesQ.eq('advisor_id', auth.user.id);
    refQ = refQ.eq('assigned_to', auth.user.id);
  }
  const [{ data: brokers }, { data: cases }, { data: referrals }] = await Promise.all([
    db.from('rera_brokers').select('id,agency_name,orn_number,contact_name,commission_share_pct,corporate_bank_verified').order('agency_name', { ascending: true }),
    casesQ.limit(100),
    refQ.limit(50),
  ]);
  return NextResponse.json({ brokers: brokers ?? [], cases: cases ?? [], referrals: referrals ?? [] });
}

export async function POST(req: Request) {
  const auth = await requireSession();
  if ('error' in auth) return auth.error;
  if (getCapabilitiesForRole(auth.user.role).pipelineScope === 'NONE') {
    return NextResponse.json({ error: 'FORBIDDEN: Sales referrals are restricted from your role.' }, { status: 403 });
  }
  try {
    const body = await req.json();
    const lead = await ingestDailyEnquiry({
      contactName: body.contactName,
      contactPhone: body.contactPhone,
      contactEmail: body.contactEmail,
      propertyPriceAed: Number(body.propertyPriceAed || 2_500_000),
      community: body.community || 'Dubai',
      sourceChannel: 'Referral',
      partnerAgency: body.partnerAgency || 'SWK Properties LLC',
      partnerBrn: body.partnerBrn || '',
      referrerName: body.referrerName || auth.user.name,
      notes: body.notes || 'Partner Hub Referral Attribution Lock',
    });
    return NextResponse.json({ ok: true, lead }, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Referral create failed' }, { status: 400 });
  }
}
