import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/session';
import { advanceMortgageStage } from '@/lib/pipeline/service';
import type { StageCode } from '@/lib/domain/types';

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireSession();
  if ('error' in auth) return auth.error;
  const { id } = await ctx.params;
  try {
    const body = (await req.json()) as { nextStage: StageCode; evidenceNote: string };
    const updated = await advanceMortgageStage(id, body.nextStage, body.evidenceNote, auth.user);
    return NextResponse.json({ ok: true, mortgageCase: updated });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Stage advance failed';
    return NextResponse.json({ error: msg }, { status: msg.startsWith('FORBIDDEN') ? 403 : msg.startsWith('NOT_FOUND') ? 404 : 400 });
  }
}
