import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/session';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireSession();
  if ('error' in auth) return auth.error;
  const { id } = await ctx.params;
  const body = (await req.json()) as { status?: 'Todo' | 'In Progress' | 'Done'; priority?: string };
  const db = await getSupabaseAdmin();
  const { data, error } = await db
    .from('tasks')
    .update({
      ...(body.status ? { status: body.status, completed_at: body.status === 'Done' ? new Date().toISOString() : null } : {}),
      ...(body.priority ? { priority: body.priority } : {}),
    })
    .eq('id', id)
    .select('*')
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, task: data });
}
