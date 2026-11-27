import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/session';
import { buildUpdated2026BankMatrixWorkbook } from '@/lib/backup/bank-matrix-workbook';

export async function GET() {
  const auth = await requireSession();
  if ('error' in auth) return auth.error;

  const { buffer, filename } = await buildUpdated2026BankMatrixWorkbook();
  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}
