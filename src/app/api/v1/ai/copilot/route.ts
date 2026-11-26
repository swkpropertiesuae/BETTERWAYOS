import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/session';
import { answerUnderwritingQuery } from '@/lib/ai/underwriting-engine';

export async function POST(req: Request) {
  const auth = await requireSession();
  if ('error' in auth) return auth.error;
  try {
    const body = (await req.json()) as { prompt?: string };
    if (!body.prompt?.trim()) return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    const res = await answerUnderwritingQuery(body.prompt, auth.user);
    return NextResponse.json(res);
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'AI copilot error' }, { status: 500 });
  }
}
