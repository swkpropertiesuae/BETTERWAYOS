import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/session';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { buildMasterBackupWorkbook } from '@/lib/backup/master-workbook';

export async function GET() {
  const auth = await requireSession();
  if ('error' in auth) return auth.error;

  const db = await getSupabaseAdmin();
  const result = await buildMasterBackupWorkbook(db, auth.user);

  return new NextResponse(new Uint8Array(result.buffer), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${result.filename}"`,
      'X-Backup-Sheets': String(result.sheetCount),
      'X-Backup-Rows': String(result.totalRows),
      'X-Backup-SHA256': result.sha256,
    },
  });
}
