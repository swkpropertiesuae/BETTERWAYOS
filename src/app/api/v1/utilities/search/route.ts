import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/session';
import { runUnifiedSearch } from '@/lib/utilities/search';

export async function GET(req: Request) {
  const auth = await requireSession();
  if ('error' in auth) return auth.error;
  const url = new URL(req.url);
  const q = url.searchParams.get('q') || '';
  const results = await runUnifiedSearch(q, auth.user);
  return NextResponse.json({ results });
}
