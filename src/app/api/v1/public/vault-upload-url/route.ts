import { NextResponse } from 'next/server';
import { signPortalUploadUrl } from '@/lib/cms/service';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const res = await signPortalUploadUrl({
      portalToken: String(body.portalToken || ''),
      docType: String(body.docType || 'Passport'),
      fileName: String(body.fileName || 'document.pdf'),
    });
    return NextResponse.json({ ok: true, ...res }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Upload URL error';
    const status = msg.includes('INVALID_PORTAL_TOKEN') ? 401 : 400;
    return NextResponse.json({ error: msg }, { status });
  }
}
