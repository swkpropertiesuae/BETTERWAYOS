import { NextResponse } from 'next/server';
import { getPublicCmsPayload } from '@/lib/cms/service';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const payload = await getPublicCmsPayload();
    return NextResponse.json(payload, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
      },
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unable to load public CMS' },
      { status: 500 },
    );
  }
}
