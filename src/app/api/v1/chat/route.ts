import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/session';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

const ALLOWED_KINDS = new Set(['TEXT', 'CHECKIN_CARD', 'ALERT', 'SOS']);

function isOwnerPrivateChannel(channel: string): boolean {
  return channel === 'owners-private';
}

export async function GET(req: Request) {
  const auth = await requireSession();
  if ('error' in auth) return auth.error;
  const url = new URL(req.url);
  const summary = url.searchParams.get('summary') === '1';
  const db = await getSupabaseAdmin();

  if (summary) {
    const { data } = await db
      .from('chat_messages')
      .select('id,channel,sender_name,body,message_kind,created_at')
      .order('created_at', { ascending: false })
      .limit(250);

    const latestByChannel: Record<
      string,
      { id: string; sender_name: string; body: string; message_kind: string; created_at: string; count: number }
    > = {};

    for (const row of data ?? []) {
      const ch = String(row.channel || 'general');
      if (isOwnerPrivateChannel(ch) && !auth.user.isOwner) continue;
      if (ch.startsWith('dm:') && !ch.includes(auth.user.id)) continue;
      if (!latestByChannel[ch]) {
        latestByChannel[ch] = {
          id: row.id,
          sender_name: row.sender_name,
          body: row.body,
          message_kind: row.message_kind,
          created_at: row.created_at,
          count: 1,
        };
      } else {
        latestByChannel[ch].count += 1;
      }
    }

    return NextResponse.json({ channels: latestByChannel });
  }

  const channel = url.searchParams.get('channel') || 'attendance-checkin';
  if (isOwnerPrivateChannel(channel) && !auth.user.isOwner) {
    return NextResponse.json({ error: 'Owners-only private channel' }, { status: 403 });
  }
  if (channel.startsWith('dm:') && !channel.includes(auth.user.id)) {
    return NextResponse.json({ error: 'Direct message thread restricted to participants' }, { status: 403 });
  }

  const { data } = await db
    .from('chat_messages')
    .select('*')
    .eq('channel', channel)
    .order('created_at', { ascending: false })
    .limit(120);

  return NextResponse.json({ channel, messages: (data ?? []).reverse() });
}

export async function POST(req: Request) {
  const auth = await requireSession();
  if ('error' in auth) return auth.error;
  try {
    const body = (await req.json()) as {
      channel?: string;
      body?: string;
      messageKind?: string;
      metadata?: Record<string, unknown>;
    };
    const channel = (body.channel || 'general').trim();
    if (!body.body?.trim()) {
      return NextResponse.json({ error: 'Message body required' }, { status: 400 });
    }
    if (isOwnerPrivateChannel(channel) && !auth.user.isOwner) {
      return NextResponse.json({ error: 'Owners-only private channel' }, { status: 403 });
    }
    if (channel.startsWith('dm:') && !channel.includes(auth.user.id)) {
      return NextResponse.json({ error: 'Direct message thread restricted to participants' }, { status: 403 });
    }

    const safeKind = body.messageKind && ALLOWED_KINDS.has(body.messageKind) ? body.messageKind : 'TEXT';
    const safeMetadata = body.metadata && typeof body.metadata === 'object' ? body.metadata : {};

    const db = await getSupabaseAdmin();
    const { data, error } = await db
      .from('chat_messages')
      .insert({
        channel,
        sender_id: auth.user.id,
        sender_name: auth.user.name,
        sender_role: auth.user.role,
        sender_avatar: auth.user.avatarUrl || '',
        message_kind: safeKind,
        body: body.body.trim(),
        metadata: safeMetadata,
      })
      .select('*')
      .single();

    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true, message: data }, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Message send failed' }, { status: 400 });
  }
}

export async function PATCH(req: Request) {
  const auth = await requireSession();
  if ('error' in auth) return auth.error;
  try {
    const body = (await req.json()) as { messageId?: string; emoji?: string };
    if (!body.messageId || !body.emoji) {
      return NextResponse.json({ error: 'messageId and emoji are required' }, { status: 400 });
    }

    const db = await getSupabaseAdmin();
    const { data: existing, error: fetchErr } = await db
      .from('chat_messages')
      .select('id,channel,metadata')
      .eq('id', body.messageId)
      .single();

    if (fetchErr || !existing) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    const meta = (existing.metadata && typeof existing.metadata === 'object' ? existing.metadata : {}) as Record<
      string,
      unknown
    >;
    const reactions = {
      ...((meta.reactions && typeof meta.reactions === 'object' ? meta.reactions : {}) as Record<string, string[]>),
    };
    const currentUsers = Array.isArray(reactions[body.emoji]) ? [...reactions[body.emoji]] : [];
    const idx = currentUsers.indexOf(auth.user.id);
    if (idx >= 0) {
      currentUsers.splice(idx, 1);
    } else {
      currentUsers.push(auth.user.id);
    }
    if (currentUsers.length === 0) {
      delete reactions[body.emoji];
    } else {
      reactions[body.emoji] = currentUsers;
    }

    const nextMeta = { ...meta, reactions };
    const { data: updated, error: updErr } = await db
      .from('chat_messages')
      .update({ metadata: nextMeta })
      .eq('id', body.messageId)
      .select('*')
      .single();

    if (updErr) throw new Error(updErr.message);
    return NextResponse.json({ ok: true, message: updated });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Reaction failed' }, { status: 400 });
  }
}
