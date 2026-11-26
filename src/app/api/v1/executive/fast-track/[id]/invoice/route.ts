import { NextResponse } from 'next/server';
import { requireOwner } from '@/lib/auth/session';
import { createFastTrackInvoice } from '@/lib/executive/service';

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireOwner();
  if ('error' in auth) return auth.error;
  const { id } = await ctx.params;
  try {
    const body = (await req.json()) as { billToName: string; description: string; subtotalAed: number; dueDate?: string };
    const invoice = await createFastTrackInvoice({ jobId: id, ...body }, auth.user);
    return NextResponse.json({ ok: true, invoice }, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Invoice creation failed' }, { status: 400 });
  }
}
