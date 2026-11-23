import { NextResponse } from 'next/server';
import { getDb } from '@/server/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = getDb();
    const ping = db.prepare('SELECT 1 as ok').get() as { ok: number };
    const staffCount = (db.prepare("SELECT COUNT(*) as c FROM users WHERE status = 'ACTIVE'").get() as { c: number }).c;
    const latestEibor = db
      .prepare('SELECT fixing_date, three_month_micro, source_status FROM eibor_fixings ORDER BY fixing_date DESC LIMIT 1')
      .get() as { fixing_date: string; three_month_micro: number; source_status: string } | undefined;

    return NextResponse.json({
      ok: ping.ok === 1,
      service: 'betterway-os',
      timestamp: new Date().toISOString(),
      database: 'sqlite-ready',
      activeUsers: staffCount,
      eibor3mPct: latestEibor ? Number((latestEibor.three_month_micro / 100_000).toFixed(4)) : null,
      eiborDate: latestEibor?.fixing_date ?? null,
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        service: 'betterway-os',
        error: err instanceof Error ? err.message : 'Database probe failed',
      },
      { status: 503 },
    );
  }
}
