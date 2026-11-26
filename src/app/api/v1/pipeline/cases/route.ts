import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/session';
import { getCapabilitiesForRole } from '@/lib/auth/rbac';
import { maskPhoneForRole } from '@/lib/auth/masking';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { createMortgageCaseWithVault } from '@/lib/pipeline/service';
import { PIPELINE_STAGES } from '@/lib/domain/workflow';

export async function GET() {
  const auth = await requireSession();
  if ('error' in auth) return auth.error;
  const caps = getCapabilitiesForRole(auth.user.role);
  if (caps.pipelineScope === 'NONE') {
    return NextResponse.json({ error: 'FORBIDDEN: Mortgage Pipeline is restricted from your role.' }, { status: 403 });
  }
  const db = await getSupabaseAdmin();

  let q = db
    .from('mortgage_cases')
    .select('*, bank_submissions(*), case_documents(id,doc_name,status,mandatory), case_valuations(*)')
    .eq('deleted_soft', false)
    .order('updated_at', { ascending: false });
  if (caps.pipelineScope === 'OWN') q = q.eq('advisor_id', auth.user.id);

  const { data: cases, error } = await q.limit(200);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const safeCases = (cases ?? []).map((c) => ({
    ...c,
    borrower_phone: maskPhoneForRole(c.borrower_phone, auth.user, false),
  }));

  return NextResponse.json({
    stages: PIPELINE_STAGES,
    cases: safeCases,
  });
}

export async function POST(req: Request) {
  const auth = await requireSession();
  if ('error' in auth) return auth.error;
  if (getCapabilitiesForRole(auth.user.role).pipelineScope === 'NONE') {
    return NextResponse.json({ error: 'FORBIDDEN: Pipeline writes are restricted from your role.' }, { status: 403 });
  }
  try {
    const body = await req.json();
    const res = await createMortgageCaseWithVault(body, auth.user);
    return NextResponse.json({ ok: true, ...res }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Case creation failed';
    return NextResponse.json({ error: msg }, { status: msg.startsWith('FORBIDDEN') ? 403 : 400 });
  }
}
