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
    const body = (await req.json()) as { from?: string; name?: string; text?: string };
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
