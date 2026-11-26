/**
 * Betterway Mortgages LLC — Oud Metha Office Hikvision Door Fingerprint LAN Relay
 * Polls the Al Nasr Plaza Hikvision Access Control Terminal via standard ISAPI AcsEvent
 * and forwards HMAC-SHA256 signed check-in events to Betterway OS on Vercel.
 *
 * Run on any always-on Windows PC on the Oud Metha office LAN:
 *   node tools/hikvision-relay/index.mjs
 */
import crypto from 'node:crypto';

const HIK_HOST = process.env.HIKVISION_HOST || 'http://192.168.1.64';
const HIK_USER = process.env.HIKVISION_USER || 'admin';
const HIK_PASS = process.env.HIKVISION_PASS || '';
const DEVICE_SERIAL = process.env.HIKVISION_SERIAL || 'DS-K1T342MFX-OUDMETHA';
const OS_WEBHOOK_URL = process.env.BW_OS_HIKVISION_URL || 'https://betterwayos.vercel.app/api/v1/attendance/hikvision';
const HMAC_SECRET = process.env.BW_HIKVISION_HMAC_SECRET || '';
const POLL_MS = Number(process.env.HIKVISION_POLL_MS || 15_000);

const seenEventIds = new Set();
let lastSyncIso = new Date(Date.now() - 5 * 60_000).toISOString();

async function pushToBetterwayOs(events) {
  const raw = JSON.stringify({ events });
  const sig = `sha256=${crypto.createHmac('sha256', HMAC_SECRET).update(raw).digest('hex')}`;
  const res = await fetch(OS_WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-betterway-hikvision-sig': sig,
    },
    body: raw,
  });
  const text = await res.text();
  console.log(`[${new Date().toISOString()}] Forwarded ${events.length} door event(s) -> HTTP ${res.status}: ${text.slice(0, 200)}`);
}

async function pollHikvision() {
  if (!HIK_PASS || !HMAC_SECRET) {
    console.log('[Hikvision Relay] Set HIKVISION_PASS and BW_HIKVISION_HMAC_SECRET before starting.');
    return;
  }
  const nowIso = new Date().toISOString();
  const body = JSON.stringify({
    AcsEventCond: {
      searchID: String(Date.now()),
      searchResultPosition: 0,
      maxResults: 30,
      major: 5, // Access control event
      minor: 38, // Fingerprint authentication passed (also captures card/face if minor omitted)
      startTime: lastSyncIso,
      endTime: nowIso,
    },
  });

  try {
    const auth = Buffer.from(`${HIK_USER}:${HIK_PASS}`).toString('base64');
    const res = await fetch(`${HIK_HOST}/ISAPI/AccessControl/AcsEvent?format=json`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body,
    });
    if (!res.ok) {
      console.error(`[Hikvision Relay] ISAPI HTTP ${res.status}`);
      return;
    }
    const json = await res.json();
    const list = json?.AcsEvent?.InfoList ?? [];
    const fresh = [];
    for (const item of list) {
      const uid = `${item.serialNo || item.time}-${item.employeeNoString}`;
      if (!item.employeeNoString || seenEventIds.has(uid)) continue;
      seenEventIds.add(uid);
      fresh.push({
        employeeNoString: item.employeeNoString,
        eventTime: item.time || nowIso,
        deviceSerial: DEVICE_SERIAL,
        verifyMode: item.currentVerifyMode || 'fingerprint',
      });
    }
    if (fresh.length > 0) await pushToBetterwayOs(fresh);
    lastSyncIso = nowIso;
  } catch (err) {
    console.error('[Hikvision Relay] Poll error:', err.message);
  }
}

console.log(`Betterway Oud Metha Hikvision Relay active -> ${OS_WEBHOOK_URL} (poll ${POLL_MS}ms)`);
setInterval(pollHikvision, POLL_MS);
void pollHikvision();
