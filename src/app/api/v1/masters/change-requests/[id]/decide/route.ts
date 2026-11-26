import { NextResponse } from 'next/server';
import { requireOwner } from '@/lib/auth/session';
import { decideMasterChangeRequest } from '@/lib/masters/service';

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireOwner();
  if ('error' in auth) return auth.error;

  const { id } = await ctx.params;
  try {
    const body = (await req.json()) as { decision?: 'APPROVED' | 'REJECTED'; note?: string };
    const decision = body.decision === 'REJECTED' ? 'REJECTED' : 'APPROVED';
    const result = await decideMasterChangeRequest(id, auth.user, decision, body.note || '');
    return NextResponse.json({ ok: true, request: result });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Decision failed' }, { status: 400 });
  }
}
