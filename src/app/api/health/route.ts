import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const db = await getSupabaseAdmin();
    const { count } = await db.from('users').select('*', { count: 'exact', head: true });
    return NextResponse.json({
      ok: true,
      service: 'Betterway Mortgages OS v3',
      database: 'Supabase Postgres (ap-south-1)',
      staffCount: count ?? 0,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : 'Health failed' }, { status: 500 });
  }
}
