import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/session';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export async function GET(req: Request) {
  const auth = await requireSession();
  if ('error' in auth) return auth.error;
  const url = new URL(req.url);
  const channel = url.searchParams.get('channel') || 'attendance-checkin';
  const db = await getSupabaseAdmin();
  const { data } = await db
    .from('chat_messages')
    .select('*')
    .eq('channel', channel)
    .order('created_at', { ascending: false })
    .limit(100);
  return NextResponse.json({ channel, messages: (data ?? []).reverse() });
}

export async function POST(req: Request) {
  const auth = await requireSession();
  if ('error' in auth) return auth.error;
  try {
    const body = (await req.json()) as { channel: string; body: string };
    if (!body.body?.trim()) return NextResponse.json({ error: 'Message body required' }, { status: 400 });
    const db = await getSupabaseAdmin();
    const { data, error } = await db
      .from('chat_messages')
      .insert({
        channel: body.channel || 'general',
        sender_id: auth.user.id,
        sender_name: auth.user.name,
        sender_role: auth.user.role,
        sender_avatar: auth.user.avatarUrl || '',
        message_kind: 'TEXT',
        body: body.body.trim(),
      })
      .select('*')
      .single();
    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true, message: data }, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Message send failed' }, { status: 400 });
  }
}
