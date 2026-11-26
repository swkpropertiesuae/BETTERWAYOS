import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/session';
import { getMasterRegistry } from '@/lib/domain/masters';
import { writeMasterRecord } from '@/lib/masters/service';

export async function PATCH(req: Request, ctx: { params: Promise<{ registry: string; id: string }> }) {
  const auth = await requireSession();
  if ('error' in auth) return auth.error;

  const { registry, id } = await ctx.params;
  const def = getMasterRegistry(registry);
  if (!def) return NextResponse.json({ error: 'Unknown master registry' }, { status: 404 });

  try {
    const body = (await req.json()) as { payload?: Record<string, unknown>; reason?: string };
    const payload = body.payload ?? (body as Record<string, unknown>);
    const res = await writeMasterRecord(def.key, 'UPDATE', payload, auth.user, id, body.reason || '');
    return NextResponse.json({ ok: true, ...res }, { status: res.mode === 'COMMITTED' ? 200 : 202 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Master update failed';
    const status = msg.includes('FORBIDDEN') || msg.includes('OWNER_ONLY') ? 403 : 400;
    return NextResponse.json({ error: msg }, { status });
  }
}

export async function DELETE(req: Request, ctx: { params: Promise<{ registry: string; id: string }> }) {
  const auth = await requireSession();
  if ('error' in auth) return auth.error;

  const { registry, id } = await ctx.params;
  const def = getMasterRegistry(registry);
  if (!def) return NextResponse.json({ error: 'Unknown master registry' }, { status: 404 });

  try {
    const url = new URL(req.url);
    const reason = url.searchParams.get('reason') || 'Archive requested';
    const res = await writeMasterRecord(def.key, 'ARCHIVE', { status: 'Archived' }, auth.user, id, reason);
    return NextResponse.json({ ok: true, ...res }, { status: res.mode === 'COMMITTED' ? 200 : 202 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Master archive failed';
    const status = msg.includes('FORBIDDEN') || msg.includes('OWNER_ONLY') ? 403 : 400;
    return NextResponse.json({ error: msg }, { status });
  }
}
