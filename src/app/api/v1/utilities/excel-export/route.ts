import ExcelJS from 'exceljs';
import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/session';
import { getCapabilitiesForRole } from '@/lib/auth/rbac';
import { maskPhoneForRole } from '@/lib/auth/masking';
import { EXCEL_SPECS } from '@/lib/domain/excel-specs';
import { EIBOR_SNAPSHOT } from '@/lib/domain/banks';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export async function GET(req: Request) {
  const auth = await requireSession();
  if ('error' in auth) return auth.error;
  const caps = getCapabilitiesForRole(auth.user.role);
  const url = new URL(req.url);
  const num = url.searchParams.get('num') || '01';
  const spec = EXCEL_SPECS.find((s) => s.num === num) || EXCEL_SPECS[0];

  // Role gates per entity type
  const pipelineEntities = new Set(['leads', 'cases', 'documents', 'quotes', 'submissions']);
  const adminEntities = new Set(['finance', 'compliance', 'audit']);
  if (spec.exportEntity && pipelineEntities.has(spec.exportEntity) && caps.pipelineScope === 'NONE') {
    return NextResponse.json({ error: 'FORBIDDEN: Client pipeline exports are restricted from your role.' }, { status: 403 });
  }
  if (spec.exportEntity && adminEntities.has(spec.exportEntity) && auth.user.role !== 'OWNER' && auth.user.role !== 'OFFICE_ADMIN') {
    return NextResponse.json({ error: 'FORBIDDEN: Financial & compliance exports are restricted to Owners & Office Admin.' }, { status: 403 });
  }

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
  } else if (spec.exportEntity === 'cases' || spec.exportEntity === 'quotes') {
    let q = db.from('mortgage_cases').select('case_code,mortgage_type,stage_code,updated_at,advisor_id,next_action,ltv_pct,dbr_pct,requested_loan_aed').eq('deleted_soft', false);
    if (caps.pipelineScope === 'OWN') q = q.eq('advisor_id', auth.user.id);
    const { data } = await q.limit(300);
    for (const c of data ?? []) ws.addRow([c.case_code, c.mortgage_type, c.stage_code, c.updated_at, c.advisor_id, c.next_action, c.ltv_pct, c.dbr_pct, c.requested_loan_aed]);
  } else if (spec.exportEntity === 'leads') {
    let q = db.from('leads').select('reference_code,contact_name,contact_phone,source_channel,assigned_to,status,received_date_dubai').eq('deleted_soft', false);
    if (caps.pipelineScope === 'OWN') q = q.eq('assigned_to', auth.user.id);
    const { data } = await q.limit(300);
    for (const l of data ?? []) {
      ws.addRow([l.reference_code, l.contact_name, maskPhoneForRole(l.contact_phone, auth.user, false), l.source_channel, l.assigned_to, l.status, l.received_date_dubai]);
    }
  } else if (spec.exportEntity === 'documents') {
    let caseIds: string[] | null = null;
    if (caps.pipelineScope === 'OWN') {
      const { data: myCases } = await db.from('mortgage_cases').select('id').eq('advisor_id', auth.user.id);
      caseIds = (myCases ?? []).map((c) => c.id);
    }
    if (!caseIds || caseIds.length > 0) {
      let q = db.from('case_documents').select('case_id,doc_name,doc_category,status,mandatory,expiry_date,updated_at');
      if (caseIds) q = q.in('case_id', caseIds);
      const { data } = await q.limit(300);
      for (const d of data ?? []) ws.addRow([d.case_id, d.doc_name, d.doc_category, d.status, d.mandatory, d.expiry_date, d.updated_at]);
    }
  } else if (spec.exportEntity === 'finance') {
    const { data } = await db.from('invoices').select('invoice_no,counterparty_name,subtotal_aed,vat_amount_aed,total_aed,status,created_at').limit(300);
    for (const i of data ?? []) ws.addRow([i.invoice_no, i.counterparty_name, i.subtotal_aed, i.vat_amount_aed, i.total_aed, i.status, i.created_at]);
  } else if (spec.exportEntity === 'partners') {
    const { data } = await db.from('rera_brokers').select('id,agency_name,orn_number,commission_share_pct,corporate_bank_verified,status');
    for (const b of data ?? []) ws.addRow([b.id, b.agency_name, b.orn_number, b.commission_share_pct, b.corporate_bank_verified, b.status]);
  } else if (spec.exportEntity === 'compliance') {
    const { data } = await db.from('compliance_checks').select('id,check_type,subject_name,status,evidence_note,created_at').limit(300);
    for (const c of data ?? []) ws.addRow([c.id, c.check_type, c.subject_name, c.status, c.evidence_note, c.created_at]);
  } else if (spec.exportEntity === 'audit') {
    const { data } = await db.from('audit_events').select('id,actor_role,action,entity_table,entity_id,created_at').limit(300);
    for (const a of data ?? []) {
      if (auth.user.role !== 'OWNER' && (String(a.entity_table).startsWith('privacy_fast_track') || String(a.action).includes('FAST_TRACK'))) continue;
      ws.addRow([a.id, a.actor_role, a.action, a.entity_table, a.entity_id, a.created_at]);
    }
  } else if (spec.exportEntity === 'apl') {
    const { data } = await db.from('developers').select('code,name,emirate,rera_no,escrow_bank');
    for (const d of data ?? []) ws.addRow([d.code, d.name, d.emirate, d.rera_no, d.escrow_bank]);
  } else if (spec.exportEntity === 'eibor') {
    const asOf = new Date().toISOString().slice(0, 10);
    ws.addRow([asOf, '1M', EIBOR_SNAPSHOT.latest.oneMonth, 'CBUAE Official']);
    ws.addRow([asOf, '3M', EIBOR_SNAPSHOT.latest.threeMonth, 'CBUAE Official']);
    ws.addRow([asOf, '6M', EIBOR_SNAPSHOT.latest.sixMonth, 'CBUAE Official']);
  }

  const buffer = await wb.xlsx.writeBuffer();
  return new NextResponse(Buffer.from(buffer), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${spec.filename}"`,
    },
  });
}
