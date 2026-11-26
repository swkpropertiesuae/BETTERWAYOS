import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/session';
import { getMasterRegistry } from '@/lib/domain/masters';
import { listMasterRecords, writeMasterRecord } from '@/lib/masters/service';

export async function GET(_req: Request, ctx: { params: Promise<{ registry: string }> }) {
  const auth = await requireSession();
  if ('error' in auth) return auth.error;

  const { registry } = await ctx.params;
  const def = getMasterRegistry(registry);
  if (!def) return NextResponse.json({ error: 'Unknown master registry' }, { status: 404 });

  try {
    const rows = await listMasterRecords(def.key, auth.user);
    return NextResponse.json({ registry: def, rows });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Master read failed';
    return NextResponse.json({ error: msg }, { status: msg.includes('FORBIDDEN') ? 403 : 400 });
  }
}

export async function POST(req: Request, ctx: { params: Promise<{ registry: string }> }) {
  const auth = await requireSession();
  if ('error' in auth) return auth.error;

  const { registry } = await ctx.params;
  const def = getMasterRegistry(registry);
  if (!def) return NextResponse.json({ error: 'Unknown master registry' }, { status: 404 });

  try {
    const body = (await req.json()) as { payload?: Record<string, unknown>; reason?: string };
    const payload = body.payload ?? (body as Record<string, unknown>);
    const res = await writeMasterRecord(def.key, 'CREATE', payload, auth.user, undefined, body.reason || '');
    return NextResponse.json({ ok: true, ...res }, { status: res.mode === 'COMMITTED' ? 201 : 202 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Master write failed';
    const status = msg.includes('FORBIDDEN') || msg.includes('OWNER_ONLY') ? 403 : 400;
    return NextResponse.json({ error: msg }, { status });
  }
}
