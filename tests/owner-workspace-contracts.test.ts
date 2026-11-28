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
      'src/lib/ui-customizer.ts',
      'src/components/os/CustomiseUiDrawer.tsx',
    ]) {
      expect(fs.existsSync(path.join(process.cwd(), rel)), `Missing ${rel}`).toBe(true);
    }

    const { UI_PRESETS, DEFAULT_APP_ORDER, ALL_QUICK_SHORTCUTS } = await import('@/lib/ui-customizer');
    expect(UI_PRESETS.length).toBeGreaterThanOrEqual(6);
    expect(DEFAULT_APP_ORDER.length).toBe(22);
    expect(DEFAULT_APP_ORDER).toContain('inside');
    expect(DEFAULT_APP_ORDER).toContain('sip-calls');
    expect(ALL_QUICK_SHORTCUTS.length).toBeGreaterThanOrEqual(12);

    // 12-in-1 UAE Mortgage Calculators & Live Bank Marquee verification
    const calcs = await import('@/lib/domain/uae-calculators');
    const amort = calcs.calcAmortizationSummary({
      propertyPriceAed: 3_000_000,
      ltvPct: 80,
      fixedRatePct: 3.89,
      fixedYears: 3,
      reversionRatePct: 5.95,
      tenureYears: 25,
      lifeInsAnnualPct: 0.2,
      propInsAnnualPct: 0.04,
    });
    expect(amort.loanAed).toBe(2_400_000);
    expect(amort.fixedEmiAed).toBeGreaterThan(12_000);
    expect(amort.yearlySchedule.length).toBe(25);

    const cash = calcs.calcUpfrontCashToClose({
      emirate: 'Dubai (DLD)',
      propertyPriceAed: 3_000_000,
      ltvPct: 80,
      processingFeePct: 0.5,
      valuationFeeAed: 3150,
      agencyFeePct: 2,
      feeFinancePct: 0,
    });
    expect(cash.landDeptTransferFeeAed).toBe(120_580);
    expect(cash.netUpfrontCashAed).toBeGreaterThan(750_000);

    const buyout = calcs.calcBuyoutAndEquityRelease({
      currentBalanceAed: 2_000_000,
      currentRatePct: 6.15,
      remainingYears: 20,
      newRatePct: 3.89,
      newTenureYears: 20,
      equityReleaseAed: 0,
      valuationFeeAed: 2625,
      newProcessingFeePct: 0,
    });
    expect(buyout.earlySettlementFeeAed).toBe(10_500); // CBUAE cap 10k + 5% VAT
    expect(buyout.monthlyPureSavingAed).toBeGreaterThan(2_000);

    const prepay = calcs.calcPrepaymentSavings({
      loanAed: 2_500_000,
      annualRatePct: 4.19,
      tenureYears: 25,
      annualExtraPaymentAed: 100_000,
      oneTimeLumpSumAed: 200_000,
      lumpSumYear: 2,
    });
    expect(prepay.interestSavedAed).toBeGreaterThan(300_000);
    expect(prepay.monthsSaved).toBeGreaterThan(60);

    const yieldRes = calcs.calcBuyToLetYieldAndDscr({
      propertyPriceAed: 2_200_000,
      annualRentAed: 176_000,
      sizeSqft: 1200,
      serviceChargePerSqftAed: 18,
      vacancyAndMaintPct: 5,
      ltvPct: 75,
      interestRatePct: 3.99,
      tenureYears: 25,
    });
    expect(yieldRes.grossYieldPct).toBe(8);
    expect(yieldRes.dscr).toBeGreaterThan(1.2);

    const adv = calcs.calcAdvisorTools({
      propertyPriceAed: 2_500_000,
      loanAmountAed: 2_000_000,
      ageYears: 42,
      employment: 'Salaried',
      isUaeNational: false,
      bankDsaPct: 0.85,
      advisorSplitPct: 40,
      thirdPartySplitPct: 20,
    });
    expect(adv.goldenVisaEligible).toBe(true);
    expect(adv.maxTenureByAge).toBe(23);
    expect(adv.grossBankDsaAed).toBe(17_000);

    expect(fs.existsSync(path.join(process.cwd(), 'src/components/os/LiveBankMarquee.tsx'))).toBe(true);
    expect(fs.existsSync(path.join(process.cwd(), 'src/components/workspace/AllMortgageCalculatorsSuite.tsx'))).toBe(true);
    expect(fs.existsSync(path.join(process.cwd(), 'src/app/os/calculators/page.tsx'))).toBe(true);
    expect(fs.existsSync(path.join(process.cwd(), 'src/app/os/inside/page.tsx'))).toBe(true);
    expect(fs.existsSync(path.join(process.cwd(), 'src/app/os/sip-calls/page.tsx'))).toBe(true);
    expect(fs.existsSync(path.join(process.cwd(), 'src/components/os/SipSoftphoneDock.tsx'))).toBe(true);
    expect(fs.existsSync(path.join(process.cwd(), 'src/lib/sip-store.ts'))).toBe(true);
  });

  it('verifies Betterway Inside, SIP Softphone, calmer marquee speed & Zero Generic-AI UI craftsmanship', async () => {
    const sip = await import('@/lib/sip-store');
    expect(sip.BETTERWAY_EXTENSIONS.length).toBeGreaterThanOrEqual(9);
    expect(sip.SIP_TRUNK_PRESETS.length).toBeGreaterThanOrEqual(4);
    expect(sip.formatCallDuration(125)).toBe('02:05');
    expect(sip.formatPhoneForDisplay('+971551554680', true)).toContain('•••');

    const insideSrc = fs.readFileSync(path.join(process.cwd(), 'src/app/os/inside/page.tsx'), 'utf8');
    expect(insideSrc).toContain('Betterway');
    expect(insideSrc).toContain('Inside');
    expect(insideSrc).toContain('dialViaSip');

    // Calm luxury marquee speeds (>= 75s)
    const cssSrc = fs.readFileSync(path.join(process.cwd(), 'src/app/globals.css'), 'utf8');
    const marqueeSrc = fs.readFileSync(path.join(process.cwd(), 'src/components/os/LiveBankMarquee.tsx'), 'utf8');
    const loginSrc = fs.readFileSync(path.join(process.cwd(), 'src/app/login/page.tsx'), 'utf8');
    expect(cssSrc).toContain('82s linear infinite');
    expect(marqueeSrc).toContain("animationDuration: '92s'");
    expect(marqueeSrc).toContain("animationDuration: '104s'");
    expect(loginSrc).toContain("animationDuration: '76s'");

    // Human-agency craftsmanship guard — zero generic AI clichés or Sparkles icon in UI
    const humanCraftFiles = [
      'src/app/login/page.tsx',
      'src/app/os/page.tsx',
      'src/app/os/ai/page.tsx',
      'src/app/os/inside/page.tsx',
      'src/app/os/sip-calls/page.tsx',
      'src/app/os/mortgage-desk/page.tsx',
      'src/app/os/calculators/page.tsx',
      'src/app/os/master-log/page.tsx',
      'src/app/os/sales/page.tsx',
      'src/app/os/utilities/page.tsx',
      'src/components/os/OsShell.tsx',
      'src/components/os/LiveBankMarquee.tsx',
      'src/components/os/CustomiseUiDrawer.tsx',
      'src/components/os/AttachmentPicker.tsx',
      'src/components/os/TaskFollowUpDrawer.tsx',
      'src/components/workspace/BankRmAndPolicyTab.tsx',
      'src/components/workspace/OwnerSectionView.tsx',
      'src/components/workspace/ProposalStudioTab.tsx',
    ];
    const bannedGenericAiPatterns = [
      /\bSparkles\b/,
      /\bBrainCircuit\b/,
      /Super-Hub/i,
      /\bAI Case-Study\b/i,
      /\bAI Underwriting Copilot\b/i,
      /\bAI Desk\b/i,
      /\bBulk AI\b/i,
      /\bInstant AI\b/i,
      /\bOS v3 Live\b/i,
    ];
    for (const rel of humanCraftFiles) {
      const text = fs.readFileSync(path.join(process.cwd(), rel), 'utf8');
      for (const pat of bannedGenericAiPatterns) {
        expect(text, `Generic AI cliché ${pat} found in ${rel}`).not.toMatch(pat);
      }
    }

    // Verify upgraded horizontal header logo visibility, 21st.dev animated icons, highlighted Inside/SIP zone, and all 7 numbered sub-feature suites
    const lightLogoSvg = fs.readFileSync(path.join(process.cwd(), 'public/brand/betterway-logo-horizontal-light-transparent.svg'), 'utf8');
    const darkLogoSvg = fs.readFileSync(path.join(process.cwd(), 'public/brand/betterway-logo-horizontal-dark-transparent.svg'), 'utf8');
    expect(lightLogoSvg).toContain('bw-mortgages-light');
    expect(lightLogoSvg).toContain('scale(1.44, 1.5)');
    expect(darkLogoSvg).toContain('bw-mortgages-dark');

    expect(fs.existsSync(path.join(process.cwd(), 'src/components/os/AnimatedIcons.tsx'))).toBe(true);
    expect(fs.existsSync(path.join(process.cwd(), 'src/components/os/SubFeatureTabs.tsx'))).toBe(true);

    const homeSrc = fs.readFileSync(path.join(process.cwd(), 'src/app/os/page.tsx'), 'utf8');
    expect(homeSrc).toContain('Betterway Live Communications Suite');
    expect(homeSrc).toContain('AnimatedAppIcon');

    const subFeatureFiles: Array<[string, number]> = [
      ['src/app/os/crm/page.tsx', 9],
      ['src/app/os/command-center/page.tsx', 5],
      ['src/app/os/accounts/page.tsx', 7],
      ['src/app/os/utilities/page.tsx', 9],
      ['src/app/os/sales/page.tsx', 12],
      ['src/app/os/compliance/page.tsx', 6],
      ['src/app/os/employees/page.tsx', 8],
    ];
    for (const [rel, expectedNum] of subFeatureFiles) {
      const src = fs.readFileSync(path.join(process.cwd(), rel), 'utf8');
      expect(src, `${rel} missing SubFeatureTabs`).toContain('SubFeatureTabs');
      expect(src, `${rel} missing numbered sub-module ${String(expectedNum).padStart(2, '0')}`).toContain(
        `num: '${String(expectedNum).padStart(2, '0')}'`,
      );
    }

    // Also guard accounts/page.tsx & sales/page.tsx for Zero-SWK and Zero real-estate leasing/viewing jargon
    const accountsSrc = fs.readFileSync(path.join(process.cwd(), 'src/app/os/accounts/page.tsx'), 'utf8');
    expect(accountsSrc).not.toMatch(/\bswk\b/i);
    const salesSrcCheck = fs.readFileSync(path.join(process.cwd(), 'src/app/os/sales/page.tsx'), 'utf8');
    for (const forbidden of ['Viewings', 'Leases & Ejari', 'Rent Schedules', 'Rent Cheques', 'Landlord Hub']) {
      expect(salesSrcCheck).not.toContain(forbidden);
    }

    // Sovereign Private-Banking Corporate Palette guard — zero neon mint/cyan, loud yellow, or generic SaaS rainbow hexes
    const { DEFAULT_UI_CONFIG } = await import('@/lib/ui-customizer');
    expect(DEFAULT_UI_CONFIG.presetId).toBe('sovereign-corporate');
    expect(DEFAULT_UI_CONFIG.bgColor).toBe('#f3f5f8');
    expect(DEFAULT_UI_CONFIG.heroBgColor).toBe('#0b192c');
    expect(DEFAULT_UI_CONFIG.highlightColor).toBe('#0e5a49');
    expect(DEFAULT_UI_CONFIG.goldColor).toBe('#c49a45');

    const paletteGuardFiles = [
      'src/app/globals.css',
      'src/lib/ui-customizer.ts',
      'src/app/login/page.tsx',
      'src/app/os/page.tsx',
      'src/components/os/OsShell.tsx',
      'src/components/os/LiveBankMarquee.tsx',
      'src/components/os/UiKit.tsx',
      'src/components/os/AnimatedIcons.tsx',
      'src/app/os/vault/page.tsx',
      'src/app/os/website-studio/page.tsx',
      'src/components/os/AttachmentPicker.tsx',
      'src/components/os/TaskFollowUpDrawer.tsx',
    ];
    const forbiddenNeonHexes = ['#34f0bc', '#22e2ad', '#34dfac', '#e1b84c', '#fbf6e6', '#fbe8a4', '#0284c7', '#6d28d9'];
    for (const rel of paletteGuardFiles) {
      const lower = fs.readFileSync(path.join(process.cwd(), rel), 'utf8').toLowerCase();
      for (const hex of forbiddenNeonHexes) {
        expect(lower, `Generic/neon hex ${hex} found in ${rel}`).not.toContain(hex);
      }
    }
  });

  it('verifies universal form attachments & detailed Task Follow-Up workflow across all task lists and forms', async () => {
    const attTypes = await import('@/lib/workspace/attachments-types');
    expect(attTypes.TASK_FOLLOWUP_CHANNELS).toContain('SIP Call');
    expect(attTypes.TASK_FOLLOWUP_CHANNELS).toContain('WhatsApp');
    expect(attTypes.TASK_FOLLOWUP_CHANNELS).toContain('Bank RM');
    expect(attTypes.TASK_FOLLOWUP_STAGES).toEqual([
      'New',
      'In Progress',
      'Waiting Client',
      'Waiting Bank',
      'Escalated',
      'Done',
    ]);
    expect(attTypes.QUICK_FOLLOWUP_TEMPLATES.length).toBeGreaterThanOrEqual(4);
    expect(attTypes.formatFileSize(1536)).toBe('1.5 KB');
    expect(attTypes.formatFileSize(2 * 1024 * 1024)).toBe('2.00 MB');

    for (const requiredRoute of [
      'src/app/api/v1/attachments/route.ts',
      'src/app/api/v1/tasks/[id]/followups/route.ts',
      'src/lib/workspace/task-followups-server.ts',
      'src/components/os/AttachmentPicker.tsx',
      'src/components/os/TaskFollowUpDrawer.tsx',
    ]) {
      expect(fs.existsSync(path.join(process.cwd(), requiredRoute)), `Missing ${requiredRoute}`).toBe(true);
    }

    // Confirm TaskFollowUpDrawer wired into all task / follow-up views
    for (const taskScreen of [
      'src/app/os/dashboard/page.tsx',
      'src/components/workspace/TeamDailyWorkspaceTab.tsx',
      'src/app/os/crm/page.tsx',
    ]) {
      const src = fs.readFileSync(path.join(process.cwd(), taskScreen), 'utf8');
      expect(src, `${taskScreen} missing TaskFollowUpDrawer`).toContain('TaskFollowUpDrawer');
      expect(src, `${taskScreen} missing AttachmentPicker`).toContain('AttachmentPicker');
    }

    // Confirm AttachmentPicker wired across all operational forms
    for (const formScreen of [
      'src/app/os/pipeline/page.tsx',
      'src/app/os/coordinator/page.tsx',
      'src/components/workspace/DailyPlanAndReportTab.tsx',
      'src/components/workspace/OwnerSectionView.tsx',
      'src/app/os/accounts/page.tsx',
      'src/app/os/compliance/page.tsx',
      'src/app/os/employees/page.tsx',
      'src/app/os/sales/page.tsx',
      'src/app/os/field-gps/page.tsx',
      'src/app/os/mortgage-desk/page.tsx',
      'src/app/os/inside/page.tsx',
      'src/components/workspace/ForensicVisitsTab.tsx',
      'src/components/workspace/PinToPinClosingsTab.tsx',
      'src/components/workspace/CommissionsExpensesTab.tsx',
      'src/components/workspace/CatalogBrochureStudioTab.tsx',
    ]) {
      const src = fs.readFileSync(path.join(process.cwd(), formScreen), 'utf8');
      expect(src, `${formScreen} missing AttachmentPicker`).toContain('AttachmentPicker');
    }
  });
});
