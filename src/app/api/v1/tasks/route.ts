import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/session';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export async function GET(req: Request) {
  const auth = await requireSession();
  if ('error' in auth) return auth.error;

  const url = new URL(req.url);
  const scope = url.searchParams.get('scope') || 'all';
  const db = await getSupabaseAdmin();
  let q = db.from('tasks').select('*').order('due_date', { ascending: true });
  if (scope === 'mine' || auth.user.role === 'ADVISOR') {
    q = q.eq('assigned_to', auth.user.id);
  }
  const { data, error } = await q.limit(200);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ tasks: data ?? [] });
}

export async function POST(req: Request) {
  const auth = await requireSession();
  if ('error' in auth) return auth.error;
  try {
    const body = (await req.json()) as {
      title: string;
      description?: string;
      priority?: 'Critical' | 'High' | 'Normal' | 'Low';
      dueDate?: string;
      assignedTo?: string;
      caseId?: string;
    };
    const db = await getSupabaseAdmin();
    const { data, error } = await db
      .from('tasks')
      .insert({
        title: body.title.trim(),
        description: body.description || '',
        priority: body.priority || 'Normal',
        due_date: body.dueDate || new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dubai' }).format(new Date()),
        assigned_to: body.assignedTo || auth.user.id,
        created_by: auth.user.id,
        case_id: body.caseId || null,
      })
      .select('*')
      .single();
    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true, task: data }, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Task create failed' }, { status: 400 });
  }
}
