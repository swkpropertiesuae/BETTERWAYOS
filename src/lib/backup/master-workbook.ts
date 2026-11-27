import crypto from 'node:crypto';
import ExcelJS from 'exceljs';
import type { SupabaseClient } from '@supabase/supabase-js';
import { EIBOR_SNAPSHOT } from '@/lib/domain/banks';
import {
  calculateProposalOption,
  PROPOSAL_DOCUMENT_CHECKLISTS,
  UAE_BANK_POLICIES,
  UAE_BANK_RMS,
} from '@/lib/domain/bank-intelligence';
import { maskPhoneForRole } from '@/lib/auth/masking';
import type { SessionUser } from '@/lib/domain/types';

function styleHeaderRow(ws: ExcelJS.Worksheet, columns: string[]) {
  ws.addRow(columns);
  const row = ws.getRow(1);
  row.height = 24;
  row.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FF34F0BC' }, size: 11 };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0A0E14' } };
    cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
    cell.border = { bottom: { style: 'medium', color: { argb: 'FF119C78' } } };
  });
  ws.views = [{ state: 'frozen', ySplit: 1 }];
  columns.forEach((col, i) => {
    ws.getColumn(i + 1).width = Math.min(44, Math.max(15, col.length + 6));
  });
}

async function safeSelect(db: SupabaseClient, table: string, limit = 1000): Promise<any[]> {
  try {
    const { data, error } = await db.from(table).select('*').limit(limit);
    if (error || !Array.isArray(data)) return [];
    return data;
  } catch {
    return [];
  }
}

export interface MasterBackupResult {
  filename: string;
  generatedAtDubai: string;
  sha256: string;
  sheetCount: number;
  totalRows: number;
  counts: Record<string, number>;
  buffer: Buffer;
  snapshotJson: Record<string, unknown>;
}

/**
 * Generates the complete 17-Sheet Betterway Mortgages OS Master Excel Workbook (.xlsx)
 * covering ALL operational tables + 18-Bank Policy Matrix + 140+ Direct Bank RM Contacts.
 */
export async function buildMasterBackupWorkbook(
  db: SupabaseClient,
  viewer?: SessionUser | null,
): Promise<MasterBackupResult> {
  const isOwner = !viewer || viewer.role === 'OWNER';
  const isOwnerOrAdmin = !viewer || viewer.role === 'OWNER' || viewer.role === 'OFFICE_ADMIN';

  const [
    users,
    leads,
    cases,
    submissions,
    valuations,
    scheduleEvents,
    fieldReports,
    closings,
    cheques,
    commissions,
    tasks,
    invoices,
    reraBrokers,
    communities,
    developers,
    properties,
    units,
    complianceChecks,
    auditEvents,
  ] = await Promise.all([
    safeSelect(db, 'users', 200),
    safeSelect(db, 'leads', 1500),
    safeSelect(db, 'mortgage_cases', 1500),
    safeSelect(db, 'bank_submissions', 1500),
    safeSelect(db, 'valuations', 1000),
    safeSelect(db, 'schedule_events', 1000),
    safeSelect(db, 'forensic_field_reports', 1000),
    safeSelect(db, 'closing_forensic_dossiers', 1000),
    safeSelect(db, 'closing_cheque_ledger', 1500),
    isOwner ? safeSelect(db, 'owner_commission_expenses', 1500) : Promise.resolve([]),
    safeSelect(db, 'tasks', 1500),
    isOwnerOrAdmin ? safeSelect(db, 'invoices', 1500) : Promise.resolve([]),
    safeSelect(db, 'rera_brokers', 500),
    safeSelect(db, 'communities', 500),
    safeSelect(db, 'developers', 500),
    safeSelect(db, 'properties', 500),
    safeSelect(db, 'units', 1000),
    isOwnerOrAdmin ? safeSelect(db, 'compliance_checks', 1000) : Promise.resolve([]),
    isOwnerOrAdmin ? safeSelect(db, 'audit_events', 1000) : Promise.resolve([]),
  ]);

  const dubaiDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dubai' }).format(new Date());
  const generatedAtDubai = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Dubai',
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date());

  const wb = new ExcelJS.Workbook();
  wb.creator = 'Betterway Mortgages OS v3';
  wb.created = new Date();

  const counts: Record<string, number> = {
    Staff: users.length,
    Daily_Leads: leads.length,
    Mortgage_Cases: cases.length,
    Bank_Submissions: submissions.length,
    Valuations_Schedule: valuations.length + scheduleEvents.length,
    Field_Meetings: fieldReports.length,
    PinToPin_Disbursals: closings.length,
    Manager_Cheques: cheques.length,
    Advisor_DSA_Expenses: commissions.length,
    Daily_Tasks: tasks.length,
    Invoices_VAT: invoices.length,
    RERA_Partners: reraBrokers.length,
    APL_Catalog: communities.length + developers.length + properties.length + units.length,
    Bank_Policies: UAE_BANK_POLICIES.length,
    Bank_RMs: UAE_BANK_RMS.length,
    Compliance_Audit: complianceChecks.length + auditEvents.length,
  };

  // 01 Executive Summary
  const ws01 = wb.addWorksheet('01_Executive_Summary');
  styleHeaderRow(ws01, ['Betterway Mortgages OS v3 — Master Backup Section', 'Live Record Count', 'Notes']);
  ws01.addRow(['Backup Generated (Asia/Dubai GST)', generatedAtDubai, 'Al Nasr Plaza, Oud Metha, Dubai, UAE']);
  ws01.addRow(['CBUAE 3M EIBOR Benchmark', `${EIBOR_SNAPSHOT.latest.threeMonth}%`, `As of ${EIBOR_SNAPSHOT.asOfDate}`]);
  for (const [k, v] of Object.entries(counts)) {
    ws01.addRow([k.replace(/_/g, ' '), v, 'Live synced snapshot']);
  }

  // 02 Staff
  const ws02 = wb.addWorksheet('02_Staff_and_Roles');
  styleHeaderRow(ws02, ['Emp Code', 'Name', 'Email', 'Role', 'Designation', 'Department', 'Field Verifier']);
  for (const u of users) {
    ws02.addRow([u.emp_code, u.name, u.email, u.role, u.designation, u.department, u.is_field_verifier ? 'Yes' : 'No']);
  }

  // 03 Daily Leads CRM
  const ws03 = wb.addWorksheet('03_Daily_Leads_CRM');
  styleHeaderRow(ws03, ['Ref Code', 'Client Name', 'Phone', 'Email', 'Source', 'Community', 'Property Value AED', 'Status', 'Received Date']);
  for (const l of leads) {
    const phone = viewer ? maskPhoneForRole(l.contact_phone, viewer, false) : l.contact_phone;
    ws03.addRow([l.reference_code, l.contact_name, phone, l.contact_email || '', l.source_channel, l.community || '', l.property_price_aed || 0, l.status, l.received_date_dubai || '']);
  }

  // 04 12-Step Mortgage Cases
  const ws04 = wb.addWorksheet('04_12Step_Mortgage_Cases');
  styleHeaderRow(ws04, ['Case Code', 'Borrower', 'Type', 'Stage', 'Community', 'Property AED', 'Requested Loan AED', 'LTV %', 'DBR %', 'Next Action']);
  for (const c of cases) {
    ws04.addRow([c.case_code, c.borrower_name, c.mortgage_type, c.stage_code, c.community, c.property_price_aed || 0, c.requested_loan_aed || 0, c.ltv_pct || 0, c.dbr_pct || 0, c.next_action || '']);
  }

  // 05 Bank Submissions
  const ws05 = wb.addWorksheet('05_Bank_Submissions');
  styleHeaderRow(ws05, ['Submission ID', 'Case ID', 'Bank Key', 'Product Type', 'Rate %', 'Status', 'Submitted At']);
  for (const s of submissions) {
    ws05.addRow([s.id, s.case_id, s.bank_key, s.product_type || '', s.offered_rate_pct || '', s.status, s.created_at || '']);
  }

  // 06 Valuations & Schedule
  const ws06 = wb.addWorksheet('06_Valuations_Schedule');
  styleHeaderRow(ws06, ['Record Kind', 'Bank / Event Type', 'Company / Title', 'Contact / Location', 'Fee AED', 'Status', 'Date']);
  for (const v of valuations) {
    ws06.addRow(['Valuation', v.bank_key, v.valuation_company, v.access_contact, v.fee_aed || 0, v.status, v.booked_date || '']);
  }
  for (const e of scheduleEvents) {
    ws06.addRow(['Schedule', e.event_type, e.title, e.location || '', 0, 'Scheduled', e.starts_at || '']);
  }

  // 07 Mortgage Field Meetings
  const ws07 = wb.addWorksheet('07_Mortgage_Field_Meetings');
  styleHeaderRow(ws07, ['Report No', 'Date', 'Advisor', 'Meeting Type', 'Facility', 'Location', 'Person Met', 'Valuation AED', 'Loan AED', 'Outcome', 'Verification']);
  for (const f of fieldReports) {
    ws07.addRow([f.report_no, f.visit_date, f.submitted_by_name, f.report_type, f.deal_category, `${f.community || ''} / ${f.building_or_project || ''}`, `${f.met_person_name || ''} (${f.met_person_role || ''})`, f.asking_price_aed || 0, f.final_price_aed || 0, f.outcome, f.verification_status]);
  }

  // 08 Pin-to-Pin Disbursals
  const ws08 = wb.addWorksheet('08_PinToPin_Disbursals');
  styleHeaderRow(ws08, ['Dossier No', 'Track', 'Borrower', 'Community / Project', 'Valuation AED', 'Loan AED', 'Bank DSA AED', 'Status', 'Disbursal Date']);
  for (const d of closings) {
    ws08.addRow([d.dossier_no, d.track, d.client_name, `${d.community || ''} / ${d.project_name || ''}`, d.asking_price_aed || 0, d.agreed_price_aed || 0, d.agency_commission_aed || 0, d.status, d.handover_date || '']);
  }

  // 09 Manager Cheques Ledger
  const ws09 = wb.addWorksheet('09_Manager_Cheques_Ledger');
  styleHeaderRow(ws09, ['Dossier ID', 'Purpose', 'Method', 'Cheque / Ref #', 'Bank', 'Amount AED', 'Date', 'Status']);
  for (const ch of cheques) {
    ws09.addRow([ch.dossier_id, ch.purpose, ch.payment_method, ch.cheque_no || '', ch.bank_name || '', ch.amount_aed || 0, ch.cheque_date || '', ch.status]);
  }

  // 10 Advisor DSA & Expenses
  const ws10 = wb.addWorksheet('10_Advisor_DSA_Expenses');
  styleHeaderRow(ws10, ['Entry No', 'Date', 'Type', 'Advisor', 'Case Ref', 'Track', 'Gross AED', 'Split %', 'Net AED', 'Mode', 'Status', 'Partner ORN']);
  for (const cm of commissions) {
    ws10.addRow([cm.entry_no, cm.entry_date, cm.entry_type, cm.agent_name, cm.deal_ref || '', cm.track || '', cm.gross_amount_aed || 0, cm.split_pct || 0, cm.net_amount_aed || 0, cm.payment_mode, cm.status, cm.third_party_agency || '']);
  }

  // 11 Tasks Daily To-Do
  const ws11 = wb.addWorksheet('11_Tasks_Daily_ToDo');
  styleHeaderRow(ws11, ['Task ID', 'Title', 'Assigned To', 'Priority', 'Status', 'Due Date']);
  for (const t of tasks) {
    ws11.addRow([t.id, t.title, t.assigned_to, t.priority, t.status, t.due_date || '']);
  }

  // 12 Accounts & VAT Invoices
  const ws12 = wb.addWorksheet('12_Accounts_Invoices_VAT');
  styleHeaderRow(ws12, ['Invoice No', 'Counterparty', 'Subtotal AED', 'VAT 5% AED', 'Total AED', 'Status', 'Created At']);
  for (const inv of invoices) {
    ws12.addRow([inv.invoice_no, inv.counterparty_name, inv.subtotal_aed || 0, inv.vat_amount_aed || 0, inv.total_aed || 0, inv.status, inv.created_at || '']);
  }

  // 13 RERA Partners
  const ws13 = wb.addWorksheet('13_RERA_Partners_ORN');
  styleHeaderRow(ws13, ['Agency Name', 'RERA ORN', 'Commission Split %', 'Corporate Bank Verified', 'Status']);
  for (const r of reraBrokers) {
    ws13.addRow([r.agency_name, r.orn_number, r.commission_share_pct || 0, r.corporate_bank_verified ? 'Yes' : 'No', r.status]);
  }

  // 14 Bank APL Catalog
  const ws14 = wb.addWorksheet('14_Bank_APL_Catalog');
  styleHeaderRow(ws14, ['Entity Type', 'Code', 'Name / Unit', 'Emirate', 'Stage / Details']);
  for (const c of communities) ws14.addRow(['Community', c.code, c.name, c.emirate, `Avg ${c.avg_sqft_aed || 0}/sqft`]);
  for (const d of developers) ws14.addRow(['Developer', d.code, d.name, d.emirate, `RERA ${d.rera_no || ''} · Escrow ${d.escrow_bank || ''}`]);
  for (const p of properties) ws14.addRow(['Project', p.code, p.name, p.emirate, p.completion_status || '']);
  for (const u of units) ws14.addRow(['Unit', u.code, u.unit_number, u.bedrooms || '', `AED ${u.asking_price_aed || 0}`]);

  // 15 18-Bank Policy & Live 2026 Rates
  const ws15 = wb.addWorksheet('15_18Bank_Policy_Rates');
  styleHeaderRow(ws15, ['Bank', 'Loan Type', 'From Rate %', 'STL Fixed (2026)', 'NSTL Fixed', 'Self-Employed Fixed', 'Non-Resident', 'Post-Fixed Margin', 'Processing Fee', 'Valuation Fee', 'Partial Settlement', 'Life Ins %', 'Max LTV Local/Expat/NR', 'Total TAT (d)']);
  for (const b of UAE_BANK_POLICIES) {
    ws15.addRow([b.name, b.loanType, b.indicativeBestRatePct, b.stlFixedSummary, b.nstlFixedSummary, b.selfEmployedFixedSummary, b.nonResidentFixedSummary, b.postFixedMargin, b.processingFee, b.valuationFee, b.partialSettlement, b.lifeInsurancePaPct, `${b.maxLtvLocalPct}/${b.maxLtvExpatPct}/${b.maxLtvNonResPct}%`, b.totalTatDays]);
  }

  // 16 140+ Direct Bank RM Directory
  const ws16 = wb.addWorksheet('16_Bank_RM_Directory');
  styleHeaderRow(ws16, ['Bank', 'Desk', 'RM Name', 'Phone', 'Email', 'Escalation POC', 'Escalation Phone', 'Direct Submission']);
  for (const rm of UAE_BANK_RMS) {
    ws16.addRow([rm.bank, rm.desk, rm.rmName, rm.phone, rm.email, rm.escalationName || '', rm.escalationPhone || '', rm.directSubmissionAllowed ? 'Yes' : 'No']);
  }

  // 17 Audit & Compliance
  const ws17 = wb.addWorksheet('17_Audit_Compliance');
  styleHeaderRow(ws17, ['Kind', 'Actor / Type', 'Action / Subject', 'Table / Status', 'Timestamp']);
  for (const cc of complianceChecks) {
    ws17.addRow(['Compliance', cc.check_type, cc.subject_name, cc.status, cc.created_at || '']);
  }
  for (const ae of auditEvents) {
    if (!isOwner && (String(ae.entity_table || '').startsWith('privacy_fast_track') || String(ae.action || '').includes('FAST_TRACK'))) continue;
    ws17.addRow(['Audit', ae.actor_role, ae.action, ae.entity_table || '', ae.created_at || '']);
  }

  const rawBuf = await wb.xlsx.writeBuffer();
  const buffer = Buffer.from(rawBuf);
  const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');
  const totalRows = Object.values(counts).reduce((s, n) => s + n, 0);

  return {
    filename: `Betterway_OS_Full_Master_Backup_${dubaiDate}.xlsx`,
    generatedAtDubai,
    sha256,
    sheetCount: wb.worksheets.length,
    totalRows,
    counts,
    buffer,
    snapshotJson: {
      company: 'Betterway Mortgages LLC',
      office: 'Al Nasr Plaza, Oud Metha, Dubai, UAE',
      dubaiDate,
      generatedAtDubai,
      sha256,
      sheetCount: wb.worksheets.length,
      totalRows,
      counts,
      eibor: EIBOR_SNAPSHOT.latest,
    },
  };
}

/** Builds a branded 3-Bank Betterway Proposal Excel Workbook (matching Proposal_Sheet_Auto_Eco_Mode.xlsm) */
export async function buildProposalExcelBuffer(payload: {
  clientName: string;
  advisorName: string;
  emirate: string;
  profile: string;
  txType: string;
  mortgageType: string;
  propertyValueAed: number;
  loanAmountAed: number;
  ltvPct: number;
  tenorMonths: number;
  personalLoanAed?: number;
  lumpSumMonth12Aed?: number;
  options: Array<{
    bankCode: string;
    fixedRatePct: number;
    fixedMonths: number;
    variableRatePct: number;
    lifeInsurancePaPct: number;
    processingFeePct: number;
    valuationFeeAed: number;
  }>;
}): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Betterway Mortgages LLC — Proposal Auto-Eco Studio';
  wb.created = new Date();

  const computed = payload.options.map((opt) =>
    calculateProposalOption({
      ...opt,
      propertyValueAed: payload.propertyValueAed,
      loanAmountAed: payload.loanAmountAed,
      tenorMonths: payload.tenorMonths,
      personalLoanAmountAed: payload.personalLoanAed,
      personalLoanMonths: 48,
      lumpSumAtMonth12Aed: payload.lumpSumMonth12Aed,
    }),
  );

  // Sheet 1: Proposal Comparison
  const ws = wb.addWorksheet('Proposal_Comparison');
  styleHeaderRow(ws, ['Betterway Mortgages LLC — Field', 'Option A', 'Option B', 'Option C']);
  ws.addRow(['Client Name', payload.clientName, `Profile: ${payload.profile}`, `Emirate: ${payload.emirate}`]);
  ws.addRow(['Advisor', payload.advisorName, `Transaction: ${payload.txType}`, `Type: ${payload.mortgageType}`]);
  ws.addRow(['Property Value (AED)', payload.propertyValueAed, payload.propertyValueAed, payload.propertyValueAed]);
  ws.addRow(['Loan Amount (AED)', payload.loanAmountAed, payload.loanAmountAed, payload.loanAmountAed]);
  ws.addRow(['LTV % & Tenor', `${payload.ltvPct}% · ${payload.tenorMonths}m`, `${payload.ltvPct}% · ${payload.tenorMonths}m`, `${payload.ltvPct}% · ${payload.tenorMonths}m`]);
  ws.addRow(['Lending Bank', ...computed.map((c) => c.bankName)]);
  ws.addRow(['Fixed Rate %', ...computed.map((c) => `${c.fixedRatePct}% (${c.fixedMonths}m)`)]);
  ws.addRow(['Post-Fixed Rate %', ...computed.map((c) => `${c.variableRatePct}%`)]);
  ws.addRow(['Monthly EMI (Fixed)', ...computed.map((c) => c.fixedPeriodEmiAed)]);
  ws.addRow(['Monthly EMI + Life Insurance', ...computed.map((c) => c.fixedPeriodTotalMonthlyAed)]);
  ws.addRow(['Post-Fixed Monthly EMI', ...computed.map((c) => c.postFixedEmiAed)]);
  ws.addRow(['Life Insurance (% p.a.)', ...computed.map((c) => `${c.lifeInsurancePaPct}%`)]);
  ws.addRow(['Valuation Fee (AED)', ...computed.map((c) => c.valuationFeeAed)]);
  ws.addRow(['Est. Processing Fee (incl. VAT)', ...computed.map((c) => c.processingFeeEstAed)]);
  ws.addRow(['DLD Transfer + Mortgage Reg (AED)', ...computed.map((c) => c.dldTransferFeeAed + c.dldMortgageRegAed)]);
  ws.addRow(['Total Cash to Close (AED)', ...computed.map((c) => c.cashToCloseAed)]);
  ws.addRow(['Betterway Broker Fee', 'AED 0', 'AED 0', 'AED 0']);

  // Sheets 2-4: Amortization schedules per Bank Option
  computed.forEach((opt, idx) => {
    const label = `Bank_${String.fromCharCode(65 + idx)}_${opt.bankCode}`.slice(0, 28);
    const sws = wb.addWorksheet(label);
    styleHeaderRow(sws, ['Month', 'Rate %', 'EMI (AED)', 'Life Ins (AED)', 'Total Monthly (AED)', 'Interest (AED)', 'Principal (AED)', 'Closing Balance (AED)']);
    for (const r of opt.schedulePreview) {
      sws.addRow([r.month, r.ratePct, r.emiAed, r.lifeInsuranceAed, r.totalMonthlyAed, r.interestAed, r.principalAed, r.closingBalanceAed]);
    }
  });

  // Sheet 5: Document Checklist
  const dws = wb.addWorksheet('Document_Checklist');
  styleHeaderRow(dws, ['Borrower Profile', 'Required Document']);
  const docs = PROPOSAL_DOCUMENT_CHECKLISTS[payload.profile] ?? PROPOSAL_DOCUMENT_CHECKLISTS.Salaried;
  for (const d of docs) dws.addRow([payload.profile, d]);

  const raw = await wb.xlsx.writeBuffer();
  return Buffer.from(raw);
}
