import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';
import {
  answerBankPolicyQuery,
  calculateProposalOption,
  computeCreditCardDbrImpact,
  evaluateAllBanksEligibility,
  PROPOSAL_DOCUMENT_CHECKLISTS,
  UAE_BANK_POLICIES,
  UAE_BANK_RMS,
} from '@/lib/domain/bank-intelligence';
import {
  assertCleanBetterwayPublicText,
  BROCHURE_THEME_PRESETS,
  buildDefaultStagesForTrack,
  CLOSING_TRACKS,
  COMMISSION_ENTRY_TYPES,
  COMMISSION_PAYMENT_MODES,
  computeAgentSettlementSummary,
  extractTemplatePlaceholders,
  fillTemplateText,
  MORTGAGE_DEAL_CATEGORIES,
  MORTGAGE_FIELD_MEETING_TYPES,
  normalizeBrochureTheme,
  summarizeChequeLedger,
} from '@/lib/workspace/domain';

describe('Warda & Shabib UAE Mortgage Command Suite — Offline Domain, Schema & Mortgage-Only Contracts', () => {
  it('verifies migrations 006 & 007 exist with all 4 workspace tables, RLS, and 6 UAE mortgage templates', () => {
    const mig006 = path.join(process.cwd(), 'supabase', 'migrations', '006_owner_workspace_command_suite.sql');
    const mig007 = path.join(process.cwd(), 'supabase', 'migrations', '007_mortgage_exclusive_operations.sql');
    expect(fs.existsSync(mig006)).toBe(true);
    expect(fs.existsSync(mig007)).toBe(true);
    const sql006 = fs.readFileSync(mig006, 'utf8');
    const sql007 = fs.readFileSync(mig007, 'utf8');

    for (const table of [
      'forensic_field_reports',
      'closing_forensic_dossiers',
      'closing_cheque_ledger',
      'owner_commission_expenses',
    ]) {
      expect(sql006).toContain(`CREATE TABLE IF NOT EXISTS public.${table}`);
      expect(sql006).toContain(`'${table}'`);
    }

    for (const tplCode of [
      'BW-MANDATE-KFS',
      'BW-PREAPP-PACK',
      'BW-REFERRAL-DSA',
      'BW-NOC-SOA',
      'BW-BUYOUT-LIAB',
      'BW-FOL-TRUSTEE',
    ]) {
      expect(sql007).toContain(tplCode);
    }
  });

  it('normalizes brochure themes, validates custom hexes, and enforces Zero-SWK public brochure guard', () => {
    expect(Object.keys(BROCHURE_THEME_PRESETS)).toHaveLength(5);
    const custom = normalizeBrochureTheme({
      preset: 'custom',
      primaryHex: '#123456',
      accentHex: 'bad-color',
      coverLayout: 'editorial_split',
    });
    expect(custom.primaryHex).toBe('#123456');
    expect(custom.accentHex).toBe('#D4AF37'); // fell back safely
    expect(custom.coverLayout).toBe('editorial_split');

    expect(() => assertCleanBetterwayPublicText({ title: 'Betterway Mortgages Dubai Hills APL Proposal' })).not.toThrow();
    expect(() => assertCleanBetterwayPublicText({ footer: 'Powered by SWK Properties' })).toThrow(/ZERO_SWK_GUARD/);
  });

  it('defines 100% UAE mortgage field meetings, 5 mortgage closing tracks, and accurate Manager Cheque summaries', () => {
    expect(MORTGAGE_FIELD_MEETING_TYPES).toEqual([
      'Client Consultation',
      'Bank RM & FOL Signing',
      'Valuation Inspection',
      'Developer SOA & NOC',
      'DLD Trustee Transfer',
    ]);
    expect(MORTGAGE_DEAL_CATEGORIES).toContain('Ready Home Purchase');
    expect(MORTGAGE_DEAL_CATEGORIES).toContain('Buyout & Refinance');
    expect(MORTGAGE_DEAL_CATEGORIES).toContain('Equity Release');

    expect(CLOSING_TRACKS).toEqual([
      'Ready Purchase Mortgage',
      'Off-Plan Handover Finance',
      'Buyout & Refinance',
      'Equity Release',
      'Non-Resident & Commercial',
    ]);
    for (const track of CLOSING_TRACKS) {
      const stages = buildDefaultStagesForTrack(track);
      expect(stages.length).toBeGreaterThanOrEqual(9);
      expect(stages[0].step).toBe(1);
      expect(stages[0].status).toBe('In Progress');
    }

    const summary = summarizeChequeLedger([
      { amount_aed: 250_000, status: 'Cleared' },
      { amount_aed: 50_000, status: 'Paid' },
      { amount_aed: 100_000, status: 'Received' },
      { amount_aed: 75_000, status: 'Pending' },
      { amount_aed: 25_000, status: 'Bounced' },
    ]);
    expect(summary.totalCheques).toBe(5);
    expect(summary.totalAmountAed).toBe(500_000);
    expect(summary.clearedAed).toBe(300_000);
    expect(summary.receivedAed).toBe(100_000);
    expect(summary.pendingAed).toBe(75_000);
    expect(summary.bouncedAed).toBe(25_000);
  });

  it('extracts fillable placeholders from UAE CBUAE mortgage forms and renders filled document text cleanly', () => {
    const sample =
      'Date: [Mandate_Date] | Borrower: [Borrower_Full_Name] | Email: [Borrower_Email] | Loan: AED [Requested_Loan_AED] | [x] Verified';
    const fields = extractTemplatePlaceholders(sample);
    expect(fields.map((f) => f.token)).toEqual(['Mandate_Date', 'Borrower_Full_Name', 'Borrower_Email', 'Requested_Loan_AED']);
    expect(fields.find((f) => f.token === 'Mandate_Date')?.inputType).toBe('date');
    expect(fields.find((f) => f.token === 'Borrower_Email')?.inputType).toBe('email');
    expect(fields.find((f) => f.token === 'Requested_Loan_AED')?.inputType).toBe('number');

    const filled = fillTemplateText(sample, {
      Mandate_Date: '2026-11-27',
      Borrower_Full_Name: 'Amina Hassan',
      Requested_Loan_AED: '3,200,000',
    });
    expect(filled).toContain('Date: 2026-11-27');
    expect(filled).toContain('Borrower: Amina Hassan');
    expect(filled).toContain('[Borrower_Email]'); // untouched if blank
    expect(filled).toContain('[x] Verified');
  });

  it('computes Advisor DSA Commission, Case Expense, Draw & RERA Partner Referral balances across Cash/BT/Botim', () => {
    expect(COMMISSION_PAYMENT_MODES).toContain('Cash');
    expect(COMMISSION_PAYMENT_MODES).toContain('Bank Transfer (BT)');
    expect(COMMISSION_PAYMENT_MODES).toContain('Botim');
    expect(COMMISSION_ENTRY_TYPES).toEqual([
      'Advisor DSA Commission',
      'Advisor Case Expense',
      'Advisor Draw / Advance',
      'RERA Partner Referral Split',
    ]);

    const res = computeAgentSettlementSummary([
      {
        agent_name: 'Asif Khan',
        entry_type: 'Advisor DSA Commission',
        gross_amount_aed: 40_000,
        split_pct: 50,
        net_amount_aed: 20_000,
        status: 'Received',
        payment_mode: 'Bank Transfer (BT)',
        is_third_party: false,
      },
      {
        agent_name: 'Asif Khan',
        entry_type: 'Advisor Case Expense',
        gross_amount_aed: 1_500,
        split_pct: 100,
        net_amount_aed: 1_500,
        status: 'Pending',
        payment_mode: 'Cash',
        is_third_party: false,
      },
      {
        agent_name: 'Asif Khan',
        entry_type: 'Advisor Draw / Advance',
        gross_amount_aed: 3_000,
        split_pct: 100,
        net_amount_aed: 3_000,
        status: 'Paid',
        payment_mode: 'Botim',
        is_third_party: false,
      },
      {
        agent_name: 'External ORN Partner',
        entry_type: 'RERA Partner Referral Split',
        gross_amount_aed: 40_000,
        split_pct: 25,
        net_amount_aed: 10_000,
        status: 'Paid',
        payment_mode: 'Bank Transfer (BT)',
        is_third_party: true,
      },
    ]);

    expect(res.totals.totalReceivedAed).toBe(20_000);
    expect(res.totals.totalPaidAed).toBe(13_000);
    expect(res.totals.totalPendingAed).toBe(1_500);
    expect(res.totals.totalExpensesAed).toBe(1_500);
    expect(res.totals.totalThirdPartyAed).toBe(10_000);

    const asif = res.agents.find((a) => a.agentName === 'Asif Khan');
    expect(asif?.netBalanceDueAed).toBe(18_500); // 20,000 + 1,500 - 3,000
  });

  it('guards live Supabase Postgres column & CHECK contracts in Team Daily and Field Reports API routes', () => {
    const teamDailySrc = fs.readFileSync(
      path.join(process.cwd(), 'src', 'app', 'api', 'v1', 'workspace', 'team-daily', 'route.ts'),
      'utf8',
    );
    const fieldReportsSrc = fs.readFileSync(
      path.join(process.cwd(), 'src', 'app', 'api', 'v1', 'field-reports', 'route.ts'),
      'utf8',
    );

    expect(teamDailySrc).toContain('attendance_date_dubai');
    expect(teamDailySrc).toContain('event_kind');
    expect(teamDailySrc).toContain('dubai_time_str');
    expect(teamDailySrc).not.toContain('event_date_dubai');

    expect(teamDailySrc).toContain("status: 'Todo'");
    expect(teamDailySrc).not.toContain("status: 'Pending'");
    expect(fieldReportsSrc).not.toContain("? 'Done' : 'Pending'");

    expect(teamDailySrc).toContain('recipient_user_id');
    expect(teamDailySrc).not.toContain('link_href');
    expect(fieldReportsSrc).toContain('recipient_user_id');
    expect(fieldReportsSrc).not.toContain('link_href');
  });

  it('strictly enforces 100% UAE Mortgage-Exclusive terminology (zero real-estate brokerage / leasing / viewing jargon)', () => {
    const filesToAudit = [
      'src/lib/workspace/domain.ts',
      'src/lib/workspace/verifiers.ts',
      'src/components/workspace/TeamDailyWorkspaceTab.tsx',
      'src/components/workspace/ForensicVisitsTab.tsx',
      'src/components/workspace/CatalogBrochureStudioTab.tsx',
      'src/components/workspace/LegalFormsStudioTab.tsx',
      'src/components/workspace/PinToPinClosingsTab.tsx',
      'src/components/workspace/CommissionsExpensesTab.tsx',
      'src/app/os/executive/page.tsx',
      'src/app/os/page.tsx',
      'src/app/os/field-gps/page.tsx',
      'src/app/os/utilities/page.tsx',
    ];

    const forbiddenTerms = [
      'Property Viewing',
      'Forensic Viewing',
      'Site Visit',
      'Site-Visit',
      'Tenancy Contract',
      'Property Management',
      'Yearly Rent',
      'Listing Agent',
      'Agent-to-Agent',
      'Form I',
      'BW-A2A',
      'BW-TENANCY',
      'BW-EJARI',
      'Rent Instalment',
      'Security Deposit',
      'Move-In Permit',
      'Snagging',
      'Leasing',
      'Tenant',
    ];

    for (const rel of filesToAudit) {
      const content = fs.readFileSync(path.join(process.cwd(), rel), 'utf8');
      for (const term of forbiddenTerms) {
        expect(content, `Forbidden real-estate term "${term}" found in ${rel}`).not.toMatch(
          new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'),
        );
      }
    }
  });

  it('enforces Zero-Elvora / Zero-Shipping branding guard across the Calm Operating Wallet UI', () => {
    const uiFilesToAudit = [
      'src/app/globals.css',
      'src/app/login/page.tsx',
      'src/app/os/page.tsx',
      'src/app/os/dashboard/page.tsx',
      'src/app/os/executive/page.tsx',
      'src/components/os/OsShell.tsx',
      'src/components/os/UiKit.tsx',
      'src/components/workspace/TeamDailyWorkspaceTab.tsx',
      'src/components/workspace/ForensicVisitsTab.tsx',
      'src/components/workspace/CatalogBrochureStudioTab.tsx',
      'src/components/workspace/LegalFormsStudioTab.tsx',
      'src/components/workspace/PinToPinClosingsTab.tsx',
      'src/components/workspace/CommissionsExpensesTab.tsx',
      'src/components/workspace/ProposalStudioTab.tsx',
      'src/components/workspace/BankRmAndPolicyTab.tsx',
      'src/app/os/mortgage-desk/page.tsx',
      'src/app/os/sales/page.tsx',
      'src/app/os/utilities/page.tsx',
      'src/lib/domain/bank-intelligence.ts',
    ];
    const forbiddenRefBrandTerms = ['elvora', 'elvorashipping', 'freight forwarding', 'bill of lading', 'container shipment', 'huspy'];
    for (const rel of uiFilesToAudit) {
      const content = fs.readFileSync(path.join(process.cwd(), rel), 'utf8');
      for (const term of forbiddenRefBrandTerms) {
        expect(content, `Forbidden reference/competitor brand term "${term}" found in ${rel}`).not.toMatch(
          new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'),
        );
      }
    }
  });

  it('verifies 18-Bank Policy Matrix, 120+ Direct Bank RM Contacts, 3-Bank Proposal math, Master Excel Daily Backup & Native Mobile App', () => {
    expect(UAE_BANK_POLICIES.length).toBeGreaterThanOrEqual(18);
    expect(UAE_BANK_RMS.length).toBeGreaterThanOrEqual(120);
    expect(Object.keys(PROPOSAL_DOCUMENT_CHECKLISTS)).toHaveLength(5);

    const opt = calculateProposalOption({
      bankCode: 'ENBD',
      propertyValueAed: 3_500_000,
      loanAmountAed: 2_800_000,
      tenorMonths: 300,
      fixedRatePct: 3.89,
      fixedMonths: 36,
      variableRatePct: 5.5,
      lifeInsurancePaPct: 0.2052,
      processingFeePct: 0.25,
      valuationFeeAed: 3150,
      personalLoanAmountAed: 100_000,
      personalLoanMonths: 48,
    });
    expect(opt.fixedPeriodEmiAed).toBeGreaterThan(14_000);
    expect(opt.fixedPeriodTotalMonthlyAed).toBeGreaterThan(opt.fixedPeriodEmiAed);
    expect(opt.personalLoanMonthlyAed).toBeGreaterThan(2_000);
    expect(opt.schedulePreview.length).toBeGreaterThanOrEqual(12);

    const matches = evaluateAllBanksEligibility({
      monthlyIncomeAed: 45_000,
      propertyValueAed: 3_000_000,
      existingEmisAed: 1_500,
      creditCardLimitsAed: 30_000,
      residency: 'expat_resident',
      employment: 'salaried',
      preference: 'all',
      tenorYears: 25,
    });
    expect(matches.length).toBe(UAE_BANK_POLICIES.length);
    expect(matches.some((m) => m.verdict === 'Eligible')).toBe(true);

    const aiReply = answerBankPolicyQuery('Non-Resident 60% LTV');
    expect(aiReply.matchedBanks.length).toBeGreaterThanOrEqual(5);

    const cc = computeCreditCardDbrImpact([{ bank: 'EIB', oldLimitAed: 70_000, newLimitAed: 20_000 }]);
    expect(cc.limitReduced).toBe(50_000);
    expect(cc.monthlyDbrFreedAed).toBe(2_500);
    expect(cc.extraMortgageCapacityAed).toBeGreaterThan(350_000);

    // Master Excel, Daily Backup Cron, GitHub Actions & Native Android/iOS Capacitor project presence
    const requiredFiles = [
      'src/lib/backup/master-workbook.ts',
      'src/app/api/v1/utilities/master-backup-excel/route.ts',
      'src/app/api/v1/utilities/proposal-excel/route.ts',
      'src/app/api/v1/utilities/daily-backup/route.ts',
      'scripts/daily-backup.ts',
      'vercel.json',
      '.github/workflows/daily-backup.yml',
      '.github/workflows/mobile-android-ios.yml',
      'mobile/capacitor.config.ts',
      'mobile/android/app/src/main/AndroidManifest.xml',
      'mobile/ios/App/App/Info.plist',
    ];
    for (const rel of requiredFiles) {
      expect(fs.existsSync(path.join(process.cwd(), rel)), `Missing required deliverable ${rel}`).toBe(true);
    }

    // Zero-SWK guard on Sales page
    const salesSrc = fs.readFileSync(path.join(process.cwd(), 'src/app/os/sales/page.tsx'), 'utf8');
    expect(salesSrc).not.toMatch(/\bswk\b/i);
  });

  it('verifies shining-black home SVG consistency, Place vs Corner routes, Coordinator workflow & recreated 6-sheet 2026 Bank Matrix workbook', async () => {
    const { buildUpdated2026BankMatrixWorkbook } = await import('@/lib/backup/bank-matrix-workbook');
    const matrix = await buildUpdated2026BankMatrixWorkbook();
    expect(matrix.sheetCount).toBe(6);
    expect(matrix.bankCount).toBe(18);
    expect(matrix.rmCount).toBeGreaterThanOrEqual(140);
    expect(matrix.buffer.subarray(0, 2).toString('utf8')).toBe('PK');

    for (const svg of [
      'public/brand/betterway-icon.svg',
      'public/brand/betterway-favicon.svg',
      'public/brand/betterway-logo-horizontal-light-transparent.svg',
      'public/brand/betterway-logo-horizontal-dark-transparent.svg',
    ]) {
      const content = fs.readFileSync(path.join(process.cwd(), svg), 'utf8');
      expect(content, `${svg} missing shining black home gradient`).toContain('bw-shining-black-home');
    }

    for (const rel of [
      'src/app/os/place/page.tsx',
      'src/app/os/corner/page.tsx',
      'src/app/os/coordinator/page.tsx',
      'src/components/workspace/OwnerSectionView.tsx',
      'src/components/workspace/DailyPlanAndReportTab.tsx',
      'src/app/api/v1/utilities/bank-matrix-excel/route.ts',
    ]) {
      expect(fs.existsSync(path.join(process.cwd(), rel)), `Missing ${rel}`).toBe(true);
    }
  });
});
