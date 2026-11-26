import { NextResponse } from 'next/server';
import { processHikvisionDoorEvent, verifyHikvisionSignature } from '@/lib/attendance/hikvision';
import { getCurrentSessionUser } from '@/lib/auth/session';

/**
 * Accepts:
 * 1) Live HMAC-SHA256 signed events from the Oud Metha Hikvision LAN Relay (`tools/hikvision-relay/`)
 * 2) Authenticated Owner/Admin manual Hikvision test punch or CSV/JSON sync from OS UI.
 */
export async function POST(req: Request) {
  try {
    const rawText = await req.text();
    const sig = req.headers.get('x-betterway-hikvision-sig');

    if (sig) {
      if (!verifyHikvisionSignature(rawText, sig)) {
        return NextResponse.json({ error: 'Invalid Hikvision HMAC signature' }, { status: 401 });
      }
    } else {
      const session = await getCurrentSessionUser();
      if (!session || (session.role !== 'OWNER' && session.role !== 'OFFICE_ADMIN' && session.role !== 'HR_MANAGER')) {
        return NextResponse.json({ error: 'Signed Hikvision header or Owner/HR session required' }, { status: 401 });
      }
    }

    const body = JSON.parse(rawText || '{}');
    const events = Array.isArray(body.events) ? body.events : [body];
    const results = [];
    for (const ev of events) {
      const res = await processHikvisionDoorEvent({
        employeeNoString: String(ev.employeeNoString || ev.empCode || ''),
        eventTime: String(ev.eventTime || new Date().toISOString()),
        deviceSerial: String(ev.deviceSerial || 'DS-K1T342MFX-OUDMETHA'),
        readerDirection: ev.readerDirection,
        verifyMode: ev.verifyMode || 'fingerprint',
      });
      results.push(res);
    }

    return NextResponse.json({ ok: true, count: results.length, results }, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Hikvision event error' }, { status: 400 });
  }
}
