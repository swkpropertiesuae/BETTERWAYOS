import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/session';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { addTrainedCaseStudy } from '@/lib/ai/underwriting-engine';

export async function GET() {
  const auth = await requireSession();
  if ('error' in auth) return auth.error;
  const db = await getSupabaseAdmin();
  const { data } = await db.from('case_study_scenarios').select('*').order('created_at', { ascending: false });
  return NextResponse.json({ scenarios: data ?? [] });
}

export async function POST(req: Request) {
  const auth = await requireSession();
  if ('error' in auth) return auth.error;
  if (auth.user.role !== 'OWNER' && auth.user.role !== 'TEAM_MANAGER' && auth.user.role !== 'OPERATIONS_MANAGER') {
    return NextResponse.json({ error: 'Only Owners & Managers can train new AI Case Studies' }, { status: 403 });
  }
  try {
    const body = await req.json();
    const scenario = await addTrainedCaseStudy(body, auth.user);
    return NextResponse.json({ ok: true, scenario }, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Case study training failed' }, { status: 400 });
  }
}
