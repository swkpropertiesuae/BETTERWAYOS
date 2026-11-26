import { NextResponse } from 'next/server';
import { requireOwner } from '@/lib/auth/session';
import { getOwnerConsolidatedVatSummary } from '@/lib/executive/service';

export async function GET() {
  const auth = await requireOwner();
  if ('error' in auth) return auth.error;
  const summary = await getOwnerConsolidatedVatSummary(auth.user);
  return NextResponse.json(summary);
}
