import { readFileSync } from 'node:fs';
import path from 'node:path';
import { NextResponse } from 'next/server';
import { getDb } from '@/server/db';
import { getCurrentUser } from '@/server/auth/request';
import { assertRole, writeAuditLog } from '@/server/auth';

interface EiborFixingInput {
  date: string;
  valueDate: string;
  overnight: number;
  oneMonth: number;
  threeMonth: number;
  sixMonth: number;
  oneYear: number;
}

function isPlausibleRate(n: number): boolean {
  return Number.isFinite(n) && n >= 0.25 && n <= 15.0;
}

async function fetchLiveCbuaeEibor(): Promise<EiborFixingInput | null> {
  const endpoint =
    process.env.CBUAE_EIBOR_API_URL || 'https://www.centralbank.ae/umbraco/surface/eibor/GetEiborData';
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch(endpoint, {
      method: 'GET',
      headers: { Accept: 'application/json', 'User-Agent': 'BetterwayOS/1.0' },
      signal: controller.signal,
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const raw = (await res.json()) as unknown;
    const rows = Array.isArray(raw) ? raw : Array.isArray((raw as { data?: unknown[] })?.data) ? (raw as { data: unknown[] }).data : [];
    const first = rows[0] as Record<string, unknown> | undefined;
    if (!first) return null;

    const overnight = Number(first.Overnight ?? first.overnight ?? first.ON);
    const oneMonth = Number(first.OneMonth ?? first.oneMonth ?? first['1M']);
    const threeMonth = Number(first.ThreeMonths ?? first.threeMonth ?? first['3M']);
    const sixMonth = Number(first.SixMonths ?? first.sixMonth ?? first['6M']);
    const oneYear = Number(first.OneYear ?? first.oneYear ?? first['1Y']);
    if (![overnight, oneMonth, threeMonth, sixMonth, oneYear].every(isPlausibleRate)) return null;

    const today = new Date().toISOString().slice(0, 10);
    const date = String(first.Date ?? first.date ?? today).slice(0, 10);
    const valueDate = String(first.ValueDate ?? first.valueDate ?? date).slice(0, 10);
    return { date, valueDate, overnight, oneMonth, threeMonth, sixMonth, oneYear };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  try {
    assertRole(user, ['SUPER_ADMIN', 'CREDIT_UNDERWRITER', 'SALES_ADVISOR', 'FINANCE_ADMIN']);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const db = getDb();
  let source = 'CBUAE_LIVE_SYNC';

  try {
    let fixing = await fetchLiveCbuaeEibor();
    if (!fixing) {
      source = 'SNAPSHOT_FALLBACK';
      const snapRaw = readFileSync(path.resolve(process.cwd(), 'src/data/eibor-snapshot.json'), 'utf8');
      const snap = JSON.parse(snapRaw) as { latest: EiborFixingInput };
      fixing = snap.latest;
    }

    db.prepare(
      `INSERT INTO eibor_fixings (
        fixing_date, value_date, overnight_micro, one_month_micro, three_month_micro, six_month_micro, one_year_micro, source_status, retrieved_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      ON CONFLICT(fixing_date) DO UPDATE SET
        overnight_micro = excluded.overnight_micro,
        one_month_micro = excluded.one_month_micro,
        three_month_micro = excluded.three_month_micro,
        six_month_micro = excluded.six_month_micro,
        one_year_micro = excluded.one_year_micro,
        retrieved_at = datetime('now'),
        source_status = excluded.source_status`,
    ).run(
      fixing.date,
      fixing.valueDate,
      Math.round(fixing.overnight * 100_000),
      Math.round(fixing.oneMonth * 100_000),
      Math.round(fixing.threeMonth * 100_000),
      Math.round(fixing.sixMonth * 100_000),
      Math.round(fixing.oneYear * 100_000),
      source,
    );
    writeAuditLog(db, user, 'eibor_fixings', fixing.date, 'SYNC_CBUAE_EIBOR', null, { source, threeMonth: fixing.threeMonth });
  } catch (err) {
    source = err instanceof Error ? err.message : 'SYNC_ERROR';
  }

  const accept = req.headers.get('accept') || '';
  if (accept.includes('text/html')) {
    return NextResponse.redirect(new URL(`/os/banks-apl?notice=${encodeURIComponent(`CBUAE EIBOR refreshed (${source})`)}`, req.url), 303);
  }
  return NextResponse.json({ ok: true, source });
}
