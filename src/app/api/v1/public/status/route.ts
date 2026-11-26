import { NextResponse } from 'next/server';
import { getPublicCaseStatus } from '@/lib/cms/service';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const ref = url.searchParams.get('ref') || url.searchParams.get('token') || '';
  if (!ref) {
    return NextResponse.json({ error: 'Provide ?ref=BW-CASE-... or ?token=...' }, { status: 400 });
  }
  const status = await getPublicCaseStatus(ref);
  if (!status) {
    return NextResponse.json({ error: 'Case reference not found' }, { status: 404 });
  }
  return NextResponse.json(status, {
    headers: { 'Access-Control-Allow-Origin': '*' },
  });
}
