import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import { ingestDailyEnquiry } from '@/lib/pipeline/service';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');
  if (mode === 'subscribe' && token && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(challenge || '', { status: 200 });
  }
  return NextResponse.json({ error: 'Verification failed' }, { status: 403 });
}

export async function POST(req: Request) {
  try {
    const rawText = await req.text();
    const secret = process.env.WHATSAPP_APP_SECRET?.trim() || process.env.BW_INTAKE_HMAC_SECRET?.trim();
    const sigHeader = req.headers.get('x-hub-signature-256') || req.headers.get('x-betterway-signature');
    if (secret) {
      if (!sigHeader) {
        return NextResponse.json({ error: 'Missing WhatsApp webhook HMAC signature' }, { status: 401 });
      }
      const expected = `sha256=${crypto.createHmac('sha256', secret).update(rawText).digest('hex')}`;
      const a = Buffer.from(sigHeader);
      const b = Buffer.from(expected);
      if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
        return NextResponse.json({ error: 'Invalid WhatsApp HMAC signature' }, { status: 401 });
      }
    }

    const body = JSON.parse(rawText || '{}') as { from?: string; name?: string; text?: string };
    const lead = await ingestDailyEnquiry({
      contactName: body.name || 'WhatsApp Enquiry',
      contactPhone: body.from || '+971500000000',
      sourceChannel: 'WhatsApp',
      notes: body.text || 'Inbound WhatsApp message',
    });
    return NextResponse.json({ ok: true, leadId: lead.id, referenceCode: lead.reference_code }, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'WhatsApp intake failed' }, { status: 400 });
  }
}
