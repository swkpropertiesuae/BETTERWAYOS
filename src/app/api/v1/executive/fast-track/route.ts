import { NextResponse } from 'next/server';
import { requireOwner } from '@/lib/auth/session';
import { createFastTrackDoc, createFastTrackJob, listFastTrackJobs } from '@/lib/executive/service';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export async function GET() {
  const auth = await requireOwner();
  if ('error' in auth) return auth.error;
  const jobs = await listFastTrackJobs(auth.user);
  return NextResponse.json({ jobs });
}

export async function POST(req: Request) {
  const auth = await requireOwner();
  if ('error' in auth) return auth.error;
  try {
    const body = await req.json();
    if (body.kind === 'doc') {
      const doc = await createFastTrackDoc(body, auth.user);
      return NextResponse.json({ ok: true, doc }, { status: 201 });
    }
    const job = await createFastTrackJob(body, auth.user);
    return NextResponse.json({ ok: true, job }, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Fast-Track create failed' }, { status: 400 });
  }
}

export async function PATCH(req: Request) {
  const auth = await requireOwner();
  if ('error' in auth) return auth.error;
  try {
    const body = (await req.json()) as { id: string; stage_code?: string; cash_status?: string; notes?: string };
    const db = await getSupabaseAdmin();
    const { data, error } = await db
      .from('privacy_fast_track_jobs')
      .update({
        ...(body.stage_code ? { stage_code: body.stage_code } : {}),
        ...(body.cash_status ? { cash_status: body.cash_status } : {}),
        ...(body.notes !== undefined ? { notes: body.notes } : {}),
        updated_at: new Date().toISOString(),
      })
      .eq('id', body.id)
      .select('*')
      .single();
    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true, job: data });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Fast-Track update failed' }, { status: 400 });
  }
}
