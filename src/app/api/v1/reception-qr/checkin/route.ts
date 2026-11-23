import { NextResponse } from 'next/server';
import { getDb } from '@/server/db';
import { extractClientIp } from '@/server/auth';
import {
  getOfficeWifiConfig,
  verifyAndRecordPublicQrCheckIn,
} from '@/server/engines/swk-enterprise-engine';

export async function GET(req: Request) {
  const db = getDb();
  const cfg = getOfficeWifiConfig(db);
  const clientIp = extractClientIp(req);
  const ipMatches = !cfg.strictIpLock || !cfg.officeIp || cfg.officeIp === clientIp;
  return NextResponse.json({
    ssid: cfg.ssid,
    office_ip: cfg.strictIpLock ? cfg.officeIp : '',
    detected_client_ip: clientIp,
    ip_matches_office: ipMatches,
    strict_ip: cfg.strictIpLock,
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const clientIp = extractClientIp(req);
    const res = verifyAndRecordPublicQrCheckIn(getDb(), {
      email: String(body.email || ''),
      password: String(body.password || ''),
      connectionType: String(body.connectionType || 'wifi'),
      networkSsid: String(body.networkSsid || 'Betterway-Office-5G'),
      qrStandCode: String(body.qrStandCode || 'BW-RECEPTION-STAND-DXB-1'),
      deviceId: String(body.deviceId || 'BW-MOBILE-SCAN'),
      clientIp,
      checkInTimeGst: body.checkInTimeGst ? String(body.checkInTimeGst) : undefined,
    });
    return NextResponse.json({ ok: true, ...res });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'Check-in failed' },
      { status: 400 },
    );
  }
}
