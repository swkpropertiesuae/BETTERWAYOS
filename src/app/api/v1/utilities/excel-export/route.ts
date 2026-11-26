import ExcelJS from 'exceljs';
import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/session';
import { EXCEL_SPECS } from '@/lib/domain/excel-specs';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export async function GET(req: Request) {
  const auth = await requireSession();
  if ('error' in auth) return auth.error;
  const url = new URL(req.url);
  const num = url.searchParams.get('num') || '01';
  const spec = EXCEL_SPECS.find((s) => s.num === num) || EXCEL_SPECS[0];

  const wb = new ExcelJS.Workbook();
  wb.creator = 'Betterway Mortgages OS v3';
  const ws = wb.addWorksheet(spec.filename.replace('.xlsx', '').slice(0, 30));
  ws.addRow(spec.columns);
  ws.getRow(1).font = { bold: true };

  const db = await getSupabaseAdmin();
  if (spec.exportEntity === 'banks') {
    const { data } = await db.from('banks').select('*');
    for (const b of data ?? []) ws.addRow([b.code, b.name, b.status, 'Betterway Desk', b.rm_name, 'CBUAE Panel', b.updated_at]);
  } else if (spec.exportEntity === 'staff') {
    const { data } = await db.from('users').select('emp_code,name,role,department');
    for (const u of data ?? []) ws.addRow([u.emp_code, 'BR-OUDMETHA', u.role, u.department, 'Active']);
  } else if (spec.exportEntity === 'cases') {
    const { data } = await db.from('mortgage_cases').select('case_code,mortgage_type,stage_code,updated_at,advisor_id,next_action').limit(200);
    for (const c of data ?? []) ws.addRow([c.case_code, c.mortgage_type, c.stage_code, c.updated_at, c.advisor_id, c.next_action]);
  }

  const buffer = await wb.xlsx.writeBuffer();
  return new NextResponse(Buffer.from(buffer), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${spec.filename}"`,
    },
  });
}
