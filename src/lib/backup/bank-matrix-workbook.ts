import ExcelJS from 'exceljs';
import { UAE_BANK_POLICIES, UAE_BANK_RMS } from '@/lib/domain/bank-intelligence';
import { EIBOR_SNAPSHOT } from '@/lib/domain/banks';

function styleHeaderRow(row: ExcelJS.Row, fillHex = 'FF080C12', fontHex = 'FF34F0BC') {
  row.font = { bold: true, size: 10.5, color: { argb: fontHex } };
  row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fillHex } };
  row.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
  row.height = 26;
}

function autoSizeSheet(ws: ExcelJS.Worksheet, maxW = 46) {
  ws.columns.forEach((col) => {
    let best = 14;
    col.eachCell?.({ includeEmpty: false }, (cell) => {
      const s = String(cell.value ?? '');
      const firstLine = s.split('\n')[0] || s;
      best = Math.max(best, Math.min(maxW, firstLine.length + 4));
    });
    col.width = best;
  });
}

export async function buildUpdated2026BankMatrixWorkbook(): Promise<{
  buffer: Buffer;
  filename: string;
  sheetCount: number;
  bankCount: number;
  rmCount: number;
}> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Betterway Mortgages LLC — Dubai OS v3';
  wb.created = new Date();
  const todayDubai = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dubai' }).format(new Date());

  // =========================================================================
  // SHEET 1: 2026 RATES SUMMARY (All 18 UAE Banks — Live Benchmarks)
  // =========================================================================
  const s1 = wb.addWorksheet('2026 Rates Summary', { views: [{ state: 'frozen', ySplit: 3, xSplit: 1 }] });
  s1.mergeCells('A1:P1');
  s1.getCell('A1').value = `BETTERWAY MORTGAGES LLC — UPDATED UAE MORTGAGE BANK MATRIX (${todayDubai} · 3M EIBOR ${EIBOR_SNAPSHOT.latest.threeMonth.toFixed(3)}% · CBUAE Base 3.90%)`;
  s1.getCell('A1').font = { bold: true, size: 13, color: { argb: 'FFFBE8A4' } };
  s1.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF070A0F' } };
  s1.getRow(1).height = 30;

  s1.mergeCells('A2:P2');
  s1.getCell('A2').value = 'Cross-checked & reconciled against Updated_Bank_Rates_(1).xlsx, Bank_Matrixx..xlsx, matrix_sheet_Betterway.xlsx & late-2026 UAE CBUAE benchmarks.';
  s1.getCell('A2').font = { italic: true, size: 9.5, color: { argb: 'FF334155' } };
  s1.getCell('A2').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFBF6E6' } };
  s1.getRow(2).height = 20;

  const h1 = s1.addRow([
    'Bank Name',
    'Loan Type',
    'Best 2026 Rate %',
    'STL Fixed (2026)',
    'NSTL Fixed (2026)',
    'Self-Employed (2026)',
    'Non-Resident (2026)',
    'Post-Fixed Variable Margin',
    'Day-1 Variable',
    'Max LTV Local / Expat / NR',
    'Processing Fee',
    'Valuation Fee',
    'Min Salary (AED)',
    'Total TAT (Days)',
    '14-Day Fast-Pass',
    'Last Verified',
  ]);
  styleHeaderRow(h1);

  for (const b of UAE_BANK_POLICIES) {
    const r = s1.addRow([
      b.name,
      b.loanType,
      `${b.indicativeBestRatePct.toFixed(2)}%`,
      b.stlFixedSummary,
      b.nstlFixedSummary,
      b.selfEmployedFixedSummary,
      b.nonResidentFixedSummary,
      b.postFixedMargin,
      b.day1Variable,
      `${b.maxLtvLocalPct}% / ${b.maxLtvExpatPct}% / ${b.maxLtvNonResPct}%`,
      b.processingFee,
      b.valuationFee,
      b.minSalaryExpatAed,
      b.totalTatDays,
      b.fastPass14Day ? 'YES' : 'Standard',
      todayDubai,
    ]);
    r.alignment = { vertical: 'top', wrapText: true };
  }
  autoSizeSheet(s1, 38);

  // =========================================================================
  // SHEET 2: SALARIED (2026 UPDATED) — Transposed Bank_Matrixx Layout
  // =========================================================================
  const s2 = wb.addWorksheet('Salaried (2026 Updated)', { views: [{ state: 'frozen', ySplit: 2, xSplit: 2 }] });
  s2.mergeCells(1, 1, 1, UAE_BANK_POLICIES.length + 2);
  s2.getCell(1, 1).value = `SALARIED RESIDENT UAE MORTGAGE POLICY MATRIX — UPDATED ${todayDubai}`;
  s2.getCell(1, 1).font = { bold: true, size: 12, color: { argb: 'FFFBE8A4' } };
  s2.getCell(1, 1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF080C12' } };
  s2.getRow(1).height = 28;

  const s2Head = s2.addRow(['Policy Parameter', 'Description', ...UAE_BANK_POLICIES.map((b) => b.name)]);
  styleHeaderRow(s2Head);

  const salariedRows: Array<[string, string, (b: (typeof UAE_BANK_POLICIES)[number]) => string | number]> = [
    ['Loan Type', 'Islamic / Conventional availability', (b) => b.loanType],
    ['2026 Fixed Rate (STL)', 'Updated 2026 promotional salary transfer fixed rate', (b) => b.stlFixedSummary],
    ['2026 Fixed Rate (NSTL)', 'Updated 2026 non-salary transfer fixed rate', (b) => b.nstlFixedSummary],
    ['Variable Rate Post-Fixed', 'Follow-on bank margin + EIBOR after fixed period', (b) => b.postFixedMargin],
    ['Variable Day 1', 'Variable margin starting from Day 1', (b) => b.day1Variable],
    ['Stress Test Rate (DBR)', 'Rate used to stress test CBUAE 50% DBR', (b) => b.stressTestRule],
    ['Fee Finance', 'Financing of DLD 4% + Broker 2% + Trustee fees', (b) => b.feeFinance],
    ['Early Settlement Fee', 'CBUAE capped early buyout/settlement charge', (b) => b.earlySettlement],
    ['Partial Settlement', 'Annual free partial prepayment allowance', (b) => b.partialSettlement],
    ['Life Insurance', 'Reducing balance life / takaful cover', (b) => b.lifeInsuranceNote],
    ['Property Insurance', 'Annual building insurance cost', (b) => b.propertyInsuranceNote],
    ['Processing Fee', 'Bank arrangement / processing fee', (b) => b.processingFee],
    ['Pre-Approval Fee', 'Upfront pre-approval / AIP fee', (b) => b.preApprovalFee],
    ['Valuation Fee', 'Property valuation cost incl. VAT', (b) => b.valuationFee],
    ['Max LTV (Locals / Expats)', 'CBUAE max financing ratio', (b) => `Locals ${b.maxLtvLocalPct}% · Expats ${b.maxLtvExpatPct}%`],
    ['Max Loan Tenure', 'Maximum repayment period (years)', (b) => `${b.maxTenureYears} Years`],
    ['Min / Max Loan Amount', 'Minimum and maximum financing size (AED)', (b) => `AED ${b.minLoanAed.toLocaleString()} – AED ${b.maxLoanAed.toLocaleString()}`],
    ['Minimum Salary', 'Minimum monthly salary for Expats / Locals', (b) => `Expat AED ${b.minSalaryExpatAed.toLocaleString()} · Local AED ${b.minSalaryLocalAed.toLocaleString()}`],
    ['Minimum Length of Service', 'Minimum employment duration / probation policy', (b) => b.minLosRule],
    ['Bonus Policy', 'How annual/guaranteed bonuses count toward DBR', (b) => b.bonusRule],
    ['Rental Income Policy', 'Percentage of verified Ejari rent accepted', (b) => b.rentalIncomeRule],
    ['Airlines & Variable Pay', 'Emirates/Etihad allowances & sales commissions', (b) => b.airlineRule],
    ['Buyout Supported', 'Mortgage transfer from another UAE bank', (b) => (b.buyoutSupported ? 'Yes — Standard 2026 Rates' : 'Restricted')],
    ['Equity Release', 'Cash-out / refinancing against paid property', (b) => b.equityReleaseSummary],
    ['Eligible Emirates', 'UAE Emirates covered by lender', (b) => b.emirates],
    ['PA TAT (Working Days)', 'Pre-approval turnaround time', (b) => b.paTatDays],
    ['Valuation TAT (Days)', 'Valuation inspection & report TAT', (b) => b.valuationTatDays],
    ['FOL TAT (Working Days)', 'Final Offer Letter issuance turnaround', (b) => b.folTatDays],
    ['Total Expected TAT (Days)', 'End-to-end disbursal timeline', (b) => b.totalTatDays],
    ['Key Policy Notes (2026)', 'Special tiers, exceptions & restrictions', (b) => b.keyNotes],
  ];

  for (const [param, desc, getter] of salariedRows) {
    const r = s2.addRow([param, desc, ...UAE_BANK_POLICIES.map(getter)]);
    r.getCell(1).font = { bold: true, size: 10 };
    r.alignment = { vertical: 'top', wrapText: true };
  }
  autoSizeSheet(s2, 34);

  // =========================================================================
  // SHEET 3: SELF EMPLOYED (2026 UPDATED)
  // =========================================================================
  const s3 = wb.addWorksheet('Self Employed (2026 Updated)', { views: [{ state: 'frozen', ySplit: 2, xSplit: 1 }] });
  s3.mergeCells('A1:K1');
  s3.getCell('A1').value = `SELF-EMPLOYED RESIDENT UAE MORTGAGE MATRIX — UPDATED ${todayDubai}`;
  s3.getCell('A1').font = { bold: true, size: 12, color: { argb: 'FFFBE8A4' } };
  s3.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF080C12' } };
  s3.getRow(1).height = 28;

  const h3 = s3.addRow([
    'Bank Name',
    'SE Friendly',
    '2026 Self-Employed Fixed Rates',
    'Post-Fixed Variable',
    'Max LTV (Expat / Local)',
    'Audited Financials / Low-Doc Policy',
    'Rental Income Credit',
    'Processing Fee',
    'Valuation Fee',
    'Emirates',
    'Key Self-Employed Notes',
  ]);
  styleHeaderRow(h3);

  for (const b of UAE_BANK_POLICIES) {
    const r = s3.addRow([
      b.name,
      b.selfEmployedFriendly,
      b.selfEmployedFixedSummary,
      b.postFixedMargin,
      `${b.maxLtvExpatPct}% / ${b.maxLtvLocalPct}%`,
      b.selfEmployedFriendly === 'Low-Doc 60%'
        ? 'Low-Doc 60% LTV (6m statements, no audit) · Full Doc 2 yrs AFS >60%'
        : b.selfEmployedFriendly === 'Yes'
          ? '2 yrs LOB · VAT Returns + 6-12m Company Statements · Audit for >AED 2.5M-6M'
          : '2-3 yrs LOB · Listed Auditor 2 yrs AFS + 4 Qtrs VAT + 12m Company Bank Statements',
      b.rentalIncomeRule,
      b.processingFee,
      b.valuationFee,
      b.emirates,
      b.keyNotes,
    ]);
    r.alignment = { vertical: 'top', wrapText: true };
  }
  autoSizeSheet(s3, 38);

  // =========================================================================
  // SHEET 4: COMMERCIAL PROPERTIES (2026 UPDATED)
  // =========================================================================
  const s4 = wb.addWorksheet('Commercial Properties (2026)', { views: [{ state: 'frozen', ySplit: 2, xSplit: 1 }] });
  s4.mergeCells('A1:H1');
  s4.getCell('A1').value = `COMMERCIAL, RETAIL, OFFICE & LAND FINANCE MATRIX — UPDATED ${todayDubai}`;
  s4.getCell('A1').font = { bold: true, size: 12, color: { argb: 'FFFBE8A4' } };
  s4.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF080C12' } };
  s4.getRow(1).height = 28;

  const h4 = s4.addRow([
    'Bank Name',
    'Loan Type',
    '2026 Commercial Rates',
    'Max LTV',
    'Max Tenure',
    'Processing Fee',
    'Eligible Assets',
    'Underwriting Notes',
  ]);
  styleHeaderRow(h4);

  const commercialRows = [
    ['Dubai Islamic Bank (DIB)', 'Islamic Only', '3M EIBOR + 2.25% to 2.75% (Salaried) / +2.75% to 3.75% (SE)', 'Up to 70% (with AFS) / 50% (no audit)', '15 Years', '1.05% incl. VAT', 'Offices, Shops, Commercial Buildings (incl. Ajman)', 'Min 4 yrs LOB for Self-Employed; approved auditor AFS required for 70% LTV.'],
    ['Emirates Islamic (EIB)', 'Islamic Only', '5.49% Fixed 2Y · Reverting 3M EIBOR + 3.15% (STL) / +3.95% (NSTL/SE)', 'Up to 60%', '15 Years', '1.00% + VAT', 'Commercial Offices, Retail & Land', 'Freehold only (no leasehold); minimum floor rate applies.'],
    ['Emirates NBD (ENBD)', 'Conventional', '5.75%–5.99% Fixed 3Y (1% PF) · Variable 1M EIBOR + 2.24%', 'Up to 60% (Audit Mandatory)', '15 Years', '1.00% + VAT', 'Offices, Retail, Commercial Units (up to 3 units)', 'Min AED 50k monthly salary for salaried commercial; +1% margin for building finance.'],
    ['Mashreq Bank', 'Islamic & Conventional', 'Variable 3M EIBOR + 3.25% to 3.50% (Floor 5.75%)', 'Up to 60% (Audit Mandatory)', '15 Years', '1.00% + VAT', 'Commercial Offices & Retail (Dubai & AUH)', 'Self-Employed & Corporate commercial desks (Sabeel / Pramod teams).'],
    ['First Abu Dhabi Bank (FAB)', 'Islamic & Conventional', 'Commercial CMS Desk · Case-by-case EIBOR + 2.50%–3.25%', 'Up to 60%', '15 Years', '1.00% + VAT', 'Commercial Buildings, Warehouses, Offices', 'Submit via FAB CMS Commercial Team (CMBReferral@bankfab.com).'],
    ['ADCB', 'Islamic & Conventional', 'Commercial Banking Desk · 3M EIBOR + 2.50%–3.00%', 'Up to 60% (Land/Commercial)', '15 Years', '0.75%–1.00% + VAT', 'Commercial & Investment Properties (DXB & AUH)', 'Dedicated ADCB Commercial Banking RMs available in Sheet 6.'],
    ['Sharjah Islamic Bank (SIB)', 'Islamic Only', '6M EIBOR + 4.00% (STL) / +4.50% (NSTL) / +5.25% (SE)', 'Up to 60%', '15 Years', '1.00% + VAT', 'Serviced Offices, Retail Shops & Non-Res Land', 'Available across approved Emirates; internal ASAS valuation.'],
  ];
  for (const row of commercialRows) {
    const r = s4.addRow(row);
    r.alignment = { vertical: 'top', wrapText: true };
  }
  autoSizeSheet(s4, 42);

  // =========================================================================
  // SHEET 5: NON-RESIDENT (2026 UPDATED)
  // =========================================================================
  const s5 = wb.addWorksheet('Non-Resident (2026 Updated)', { views: [{ state: 'frozen', ySplit: 2, xSplit: 1 }] });
  s5.mergeCells('A1:J1');
  s5.getCell('A1').value = `NON-RESIDENT UAE MORTGAGE POLICY MATRIX — UPDATED ${todayDubai}`;
  s5.getCell('A1').font = { bold: true, size: 12, color: { argb: 'FFFBE8A4' } };
  s5.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF080C12' } };
  s5.getRow(1).height = 28;

  const h5 = s5.addRow([
    'Bank Name',
    'Loan Type',
    '2026 NR Fixed Rates',
    'Post-Fixed / Variable',
    'Max NR LTV',
    'Max Loan (AED)',
    'Processing Fee',
    'Valuation Fee',
    'Total TAT (Days)',
    'Eligibility, Countries & Credit Bureau Rules',
  ]);
  styleHeaderRow(h5);

  for (const b of UAE_BANK_POLICIES.filter((x) => x.nonResidentSupported)) {
    const r = s5.addRow([
      b.name,
      b.loanType,
      b.nonResidentFixedSummary,
      b.postFixedMargin,
      `${b.maxLtvNonResPct}%`,
      `AED ${b.maxLoanAed.toLocaleString()}`,
      b.processingFee,
      b.valuationFee,
      b.totalTatDays,
      `${b.emirates} · ${b.keyNotes}`,
    ]);
    r.alignment = { vertical: 'top', wrapText: true };
  }
  autoSizeSheet(s5, 42);

  // =========================================================================
  // SHEET 6: BANK POINT OF CONTACT (159 DIRECT BANK RMs — BETTERWAY CLEAN)
  // =========================================================================
  const s6 = wb.addWorksheet('Bank Point of Contact (159 RMs)', { views: [{ state: 'frozen', ySplit: 2, xSplit: 1 }] });
  s6.mergeCells('A1:H1');
  s6.getCell('A1').value = `BETTERWAY MORTGAGES LLC — DIRECT BANK RM & ESCALATION DIRECTORY (${UAE_BANK_RMS.length} VERIFIED CONTACTS · ${todayDubai})`;
  s6.getCell('A1').font = { bold: true, size: 12, color: { argb: 'FFFBE8A4' } };
  s6.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF080C12' } };
  s6.getRow(1).height = 28;

  const h6 = s6.addRow([
    'Bank Name',
    'Desk / Segment',
    'RM Name',
    'Direct Phone',
    'Direct Email',
    'Escalation POC',
    'Escalation Phone',
    'Escalation Email',
  ]);
  styleHeaderRow(h6);

  for (const rm of UAE_BANK_RMS) {
    const r = s6.addRow([
      rm.bank,
      rm.desk,
      rm.rmName,
      rm.phone,
      rm.email,
      rm.escalationName || '',
      rm.escalationPhone || '',
      rm.escalationEmail || '',
    ]);
    r.alignment = { vertical: 'middle' };
  }
  autoSizeSheet(s6, 36);

  const arrBuf = await wb.xlsx.writeBuffer();
  return {
    buffer: Buffer.from(arrBuf),
    filename: `Betterway_UAE_Mortgage_Bank_Matrix_2026_Updated.xlsx`,
    sheetCount: wb.worksheets.length,
    bankCount: UAE_BANK_POLICIES.length,
    rmCount: UAE_BANK_RMS.length,
  };
}
