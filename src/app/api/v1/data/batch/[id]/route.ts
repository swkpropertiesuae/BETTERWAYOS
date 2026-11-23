import { NextResponse } from 'next/server';
import { getDb } from '@/server/db';
import { getCurrentUser } from '@/server/auth/request';
import { assertRole, ForbiddenError, UnauthorizedError, writeAuditLog } from '@/server/auth';
import { rolesFor, specByNo } from '@/server/data-hub/specs';

/** The stored CSV of an import batch. */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new UnauthorizedError();
    const db = getDb();
    const b = db.prepare('SELECT id, spec_no, file_name, csv_content FROM data_batches WHERE id = ?').get(Number((await ctx.params).id)) as { id: number; spec_no: number; file_name: string; csv_content: string } | undefined;
    if (!b) return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
    assertRole(user, rolesFor(specByNo(b.spec_no)!));
    writeAuditLog(db, user, 'data_batches', b.id, 'DATA_BATCH_CSV_DOWNLOAD');
    const safeStem = b.file_name.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 80) || 'export';
    return new NextResponse(b.csv_content, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="batch-${b.id}-${safeStem}.csv"`,
      },
    });
  } catch (e) {
    const status = e instanceof UnauthorizedError ? 401 : e instanceof ForbiddenError ? 403 : 400;
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed' }, { status });
  }
}
