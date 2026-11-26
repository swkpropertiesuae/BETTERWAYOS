import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/session';
import { getCapabilitiesForRole } from '@/lib/auth/rbac';
import { maskPhoneForRole } from '@/lib/auth/masking';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { ingestDailyEnquiry, todayDubaiIso } from '@/lib/pipeline/service';

export async function GET(req: Request) {
  const auth = await requireSession();
  if ('error' in auth) return auth.error;

  const url = new URL(req.url);
  const dateFilter = url.searchParams.get('date') || '';
  const caps = getCapabilitiesForRole(auth.user.role);
  if (caps.pipelineScope === 'NONE') {
    return NextResponse.json({ error: 'FORBIDDEN: Client CRM is restricted from your role.' }, { status: 403 });
  }
  const db = await getSupabaseAdmin();

  let q = db.from('leads').select('*').eq('deleted_soft', false).order('created_at', { ascending: false }).limit(250);
  if (caps.pipelineScope === 'OWN') q = q.eq('assigned_to', auth.user.id);
  if (dateFilter) q = q.eq('received_date_dubai', dateFilter);

  const [{ data: leads }, { data: vaultLeads }] = await Promise.all([
    q,
    caps.pipelineScope === 'OWN'
      ? db.from('vault_leads').select('*').eq('assigned_to', auth.user.id).order('created_at', { ascending: false })
      : db.from('vault_leads').select('*').order('created_at', { ascending: false }).limit(150),
  ]);

  const today = todayDubaiIso();
  const safeLeads = (leads ?? []).map((l) => ({
    ...l,
    contact_phone_masked: maskPhoneForRole(l.contact_phone, auth.user, false),
    contact_phone: auth.user.isOwner ? l.contact_phone : maskPhoneForRole(l.contact_phone, auth.user, false),
  }));

  const safeVault = (vaultLeads ?? []).map((v) => ({
    ...v,
    phone_display: maskPhoneForRole(v.raw_phone, auth.user, false),
    raw_phone: auth.user.isOwner ? v.raw_phone : undefined,
  }));

  return NextResponse.json({
    todayDubai: today,
    todayCount: safeLeads.filter((l) => l.received_date_dubai === today).length,
    leads: safeLeads,
    vaultLeads: safeVault,
  });
}

export async function POST(req: Request) {
  const auth = await requireSession();
  if ('error' in auth) return auth.error;
  if (getCapabilitiesForRole(auth.user.role).pipelineScope === 'NONE') {
    return NextResponse.json({ error: 'FORBIDDEN: Client CRM writes are restricted from your role.' }, { status: 403 });
  }
  try {
    const body = await req.json();
    const lead = await ingestDailyEnquiry({
      ...body,
      assignedTo: body.assignedTo || (auth.user.role === 'ADVISOR' ? auth.user.id : undefined),
    });
    return NextResponse.json({ ok: true, lead }, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Lead log failed' }, { status: 400 });
  }
}
