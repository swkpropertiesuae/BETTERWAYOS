export type BrochurePresetKey =
  | 'navy_gold'
  | 'emerald_heritage'
  | 'warm_pearl'
  | 'obsidian_private'
  | 'royal_champagne'
  | 'custom';

export type BrochureCoverLayout = 'executive_band' | 'editorial_split' | 'minimal_frame';

export interface BrochureThemeConfig {
  preset: BrochurePresetKey;
  primaryHex: string;
  accentHex: string;
  surfaceHex: string;
  inkHex: string;
  coverLayout: BrochureCoverLayout;
  headerTagline: string;
  footerNote: string;
  showPaymentPlan: boolean;
  showAmenities: boolean;
  showMortgageStrip: boolean;
}

export const BROCHURE_THEME_PRESETS: Record<
  Exclude<BrochurePresetKey, 'custom'>,
  Omit<BrochureThemeConfig, 'headerTagline' | 'footerNote' | 'showPaymentPlan' | 'showAmenities' | 'showMortgageStrip'>
> = {
  navy_gold: {
    preset: 'navy_gold',
    primaryHex: '#0A1128',
    accentHex: '#D4AF37',
    surfaceHex: '#F8F7F4',
    inkHex: '#0A1128',
    coverLayout: 'executive_band',
  },
  emerald_heritage: {
    preset: 'emerald_heritage',
    primaryHex: '#0A4A3E',
    accentHex: '#34DFAC',
    surfaceHex: '#F4FBF8',
    inkHex: '#071F1A',
    coverLayout: 'editorial_split',
  },
  warm_pearl: {
    preset: 'warm_pearl',
    primaryHex: '#1F2937',
    accentHex: '#BA8D36',
    surfaceHex: '#FBF9F5',
    inkHex: '#111827',
    coverLayout: 'minimal_frame',
  },
  obsidian_private: {
    preset: 'obsidian_private',
    primaryHex: '#070E1A',
    accentHex: '#FCF1B7',
    surfaceHex: '#111A2E',
    inkHex: '#F8FAFC',
    coverLayout: 'executive_band',
  },
  royal_champagne: {
    preset: 'royal_champagne',
    primaryHex: '#1B2A4A',
    accentHex: '#D7B158',
    surfaceHex: '#FCFBF7',
    inkHex: '#0A1128',
    coverLayout: 'editorial_split',
  },
};

export const DEFAULT_BROCHURE_THEME: BrochureThemeConfig = {
  ...BROCHURE_THEME_PRESETS.navy_gold,
  headerTagline: 'Independent UAE Mortgage Advisory · 24 Conventional & Islamic Partner Banks · Zero Client Broker Fee',
  footerNote: 'Betterway Mortgages LLC · Al Nasr Plaza, Oud Metha, Dubai, UAE · betterwaymortgages.com',
  showPaymentPlan: true,
  showAmenities: true,
  showMortgageStrip: true,
};

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

export function normalizeBrochureTheme(input?: Partial<BrochureThemeConfig> | null): BrochureThemeConfig {
  const base =
    input?.preset && input.preset !== 'custom' && BROCHURE_THEME_PRESETS[input.preset]
      ? { ...DEFAULT_BROCHURE_THEME, ...BROCHURE_THEME_PRESETS[input.preset] }
      : { ...DEFAULT_BROCHURE_THEME };

  const layout =
    input?.coverLayout === 'editorial_split' || input?.coverLayout === 'minimal_frame' || input?.coverLayout === 'executive_band'
      ? input.coverLayout
      : base.coverLayout;

  return {
    preset: input?.preset || base.preset,
    primaryHex: input?.primaryHex && HEX_RE.test(input.primaryHex) ? input.primaryHex : base.primaryHex,
    accentHex: input?.accentHex && HEX_RE.test(input.accentHex) ? input.accentHex : base.accentHex,
    surfaceHex: input?.surfaceHex && HEX_RE.test(input.surfaceHex) ? input.surfaceHex : base.surfaceHex,
    inkHex: input?.inkHex && HEX_RE.test(input.inkHex) ? input.inkHex : base.inkHex,
    coverLayout: layout,
    headerTagline: String(input?.headerTagline || base.headerTagline).slice(0, 140),
    footerNote: String(input?.footerNote || base.footerNote).slice(0, 180),
    showPaymentPlan: input?.showPaymentPlan ?? base.showPaymentPlan,
    showAmenities: input?.showAmenities ?? base.showAmenities,
    showMortgageStrip: input?.showMortgageStrip ?? base.showMortgageStrip,
  };
}

/** Zero-SWK public brochure & client export safety guard (consistent with Task 12 CMS guard). */
export function assertCleanBetterwayPublicText(payload: unknown): void {
  const serialized = JSON.stringify(payload ?? '').toLowerCase();
  if (/\bswk\b|swkproperties/i.test(serialized)) {
    throw new Error('ZERO_SWK_GUARD: Public Betterway brochures and exports must only use Betterway Mortgages LLC branding.');
  }
}

// ---------- 100% UAE Mortgage Field Meeting Constants ----------

export const MORTGAGE_FIELD_MEETING_TYPES = [
  'Client Consultation',
  'Bank RM & FOL Signing',
  'Valuation Inspection',
  'Developer SOA & NOC',
  'DLD Trustee Transfer',
] as const;

export type MortgageFieldMeetingType = (typeof MORTGAGE_FIELD_MEETING_TYPES)[number];

export const MORTGAGE_DEAL_CATEGORIES = [
  'Ready Home Purchase',
  'Off-Plan Handover Finance',
  'Buyout & Refinance',
  'Equity Release',
  'Non-Resident Mortgage',
  'Commercial & SME Finance',
] as const;

export const MORTGAGE_MET_ROLES = [
  'Borrower / Applicant',
  'Co-Borrower / Spouse',
  'Bank RM / Credit Officer',
  'Bank Valuer',
  'Developer NOC Officer',
  'DLD Trustee Officer',
  'RERA Introducer / Referrer',
  'Other',
] as const;

// ---------- Pin-to-Pin UAE Mortgage Closing Tracks (Scratch -> Bank Disbursal & DSA) ----------

export type ClosingTrack =
  | 'Ready Purchase Mortgage'
  | 'Off-Plan Handover Finance'
  | 'Buyout & Refinance'
  | 'Equity Release'
  | 'Non-Resident & Commercial';

export const CLOSING_TRACKS: readonly ClosingTrack[] = [
  'Ready Purchase Mortgage',
  'Off-Plan Handover Finance',
  'Buyout & Refinance',
  'Equity Release',
  'Non-Resident & Commercial',
];

export interface ClosingStageItem {
  step: number;
  label: string;
  status: 'Pending' | 'In Progress' | 'Done';
  completedAt: string;
  ownerName: string;
  notes: string;
}

const TRACK_STAGE_LABELS: Record<ClosingTrack, string[]> = {
  'Ready Purchase Mortgage': [
    'Borrower Intake, CBUAE 50% DBR & LTV Stress Test',
    'AECB Credit Report, KYC, AML & Income Verification',
    '24-Bank Shortlist & Written Cash-to-Close Proposal',
    'CBUAE Joint Key Facts Statement (KFS) & Mandate Signed',
    'Bank Pre-Approval (DIP) Issued (Valid 60 Days)',
    'Signed Form F (MOU) & Independent Bank Valuation',
    'Final Offer Letter (FOL), Life & Property Insurance Assigned',
    'Developer e-NOC & Service Charge Clearance',
    'DLD Trustee Transfer, Manager Cheques & 0.25% Mortgage Reg',
    'New Title Deed Issued, Loan Disbursed & Bank DSA Settled',
  ],
  'Off-Plan Handover Finance': [
    'Developer Completion Notice, SPA & Oqood Audit',
    'Updated Developer Final Statement of Account (SOA)',
    'Borrower KYC, AECB & CBUAE 50% DBR / LTV Structuring',
    '24-Bank APL Check & Handover Pre-Approval (DIP)',
    'Bank Property Valuation at Handover Completion',
    'Final Offer Letter (FOL) & Takaful / Life Policy Assignment',
    'Bank Manager Cheque / Escrow Balance Disbursal to Developer',
    'Developer Payment Clearance Receipt & Handover e-NOC',
    'DLD Mortgage Charge Registration (0.25%) & Title Deed Issued',
    'Bank DSA Commission Invoiced & Post-Disbursal Rate Watch',
  ],
  'Buyout & Refinance': [
    'Existing Mortgage Audit & Post-Fixed EIBOR Revert Check',
    '1% / AED 10,000 CBUAE Exit Fee & Break-Even Savings Calc',
    'Borrower Updated KYC, AECB & 6-Month Bank Statements',
    'New Lending Bank Pre-Approval (DIP) Secured',
    'Independent Bank Property Valuation & Final Credit Approval',
    'Existing Lender Liability Letter Issued & Verified',
    'New Bank Final Offer Letter (FOL) & Insurance Re-Assignment',
    'Bank-to-Bank Settlement Manager Cheque Cleared',
    'DLD Old Mortgage Release & New Mortgage Charge Registered',
    'Bank DSA Commission Settled & New Fixed-Period Alert Set',
  ],
  'Equity Release': [
    'Title Deed Verification (Unencumbered / Low-LTV Assessment)',
    'Purpose of Funds, AML Screening & CBUAE Cash-Out LTV Check',
    'AECB Credit Bureau, Income & Rental Statement Verification',
    '24-Bank Cash-Out Rate Shortlist & KFS Mandate Signed',
    'Lending Bank Pre-Approval (DIP) Issued',
    'Independent Bank Valuation & Credit Underwriting Sign-Off',
    'Final Offer Letter (FOL), Life & Property Insurance Signed',
    'DLD Mortgage Registration (0.25% of Facility) Completed',
    'Equity Release Cash Proceeds Disbursed to Borrower IBAN',
    'Bank DSA Commission Invoiced & Settled',
  ],
  'Non-Resident & Commercial': [
    'Overseas / Corporate KYC, Passport & Source of Funds Audit',
    'Home-Country Credit Bureau & 6–12m Bank Statement Review',
    'Non-Resident (Max 60% LTV) / Commercial Lender Shortlist',
    'Bank Pre-Approval (DIP) & Remote POA / Attestation Setup',
    'Independent Bank Property Valuation & Underwriting Approval',
    'Final Offer Letter (FOL) & Cross-Border FX Equity Plan',
    'Developer e-NOC & DLD Trustee Appointment Confirmation',
    'DLD Trustee Settlement, Manager Cheques & Mortgage Registration',
    'Title Deed Issued, Golden Visa Bank NOC & DSA Commission Settled',
  ],
};

export function buildDefaultStagesForTrack(track: ClosingTrack): ClosingStageItem[] {
  const labels = TRACK_STAGE_LABELS[track] ?? TRACK_STAGE_LABELS['Ready Purchase Mortgage'];
  return labels.map((label, idx) => ({
    step: idx + 1,
    label,
    status: idx === 0 ? 'In Progress' : 'Pending',
    completedAt: '',
    ownerName: '',
    notes: '',
  }));
}

export interface ChequeLedgerRow {
  amount_aed: number;
  status: string;
}

export function summarizeChequeLedger(cheques: ChequeLedgerRow[]) {
  let totalAmountAed = 0;
  let clearedAed = 0;
  let receivedAed = 0;
  let pendingAed = 0;
  let bouncedAed = 0;

  for (const c of cheques) {
    const amt = Number(c.amount_aed || 0);
    totalAmountAed += amt;
    if (c.status === 'Cleared' || c.status === 'Paid') clearedAed += amt;
    else if (c.status === 'Received' || c.status === 'Deposited') receivedAed += amt;
    else if (c.status === 'Bounced') bouncedAed += amt;
    else pendingAed += amt;
  }

  return {
    totalCheques: cheques.length,
    totalAmountAed: Math.round(totalAmountAed * 100) / 100,
    clearedAed: Math.round(clearedAed * 100) / 100,
    receivedAed: Math.round(receivedAed * 100) / 100,
    pendingAed: Math.round(pendingAed * 100) / 100,
    bouncedAed: Math.round(bouncedAed * 100) / 100,
  };
}

// ---------- Mortgage Legal Form Placeholder Extractor & Live Template Filler ----------

export interface TemplateFieldDef {
  token: string;
  label: string;
  inputType: 'text' | 'date' | 'number' | 'email';
}

export function extractTemplatePlaceholders(templateBody: string): TemplateFieldDef[] {
  const matches = templateBody.matchAll(/\[([A-Za-z0-9_]+)\]/g);
  const seen = new Set<string>();
  const fields: TemplateFieldDef[] = [];
  for (const m of matches) {
    const token = m[1];
    if (!token || token.toLowerCase() === 'x' || seen.has(token)) continue;
    seen.add(token);
    const label = token.replace(/_/g, ' ');
    const lower = token.toLowerCase();
    const inputType: TemplateFieldDef['inputType'] = lower.includes('date')
      ? 'date'
      : lower.includes('email')
        ? 'email'
        : lower.includes('aed') || lower.includes('pct') || lower.includes('count') || lower.includes('days') || lower.includes('years')
          ? 'number'
          : 'text';
    fields.push({ token, label, inputType });
  }
  return fields;
}

export function fillTemplateText(templateBody: string, values: Record<string, string>): string {
  return templateBody.replace(/\[([A-Za-z0-9_]+)\]/g, (full, token: string) => {
    if (token.toLowerCase() === 'x') return full;
    const val = values[token];
    return val !== undefined && val.trim() !== '' ? val.trim() : full;
  });
}

// ---------- Advisor DSA Commission, Expense & RERA Partner Referral Settlement Math ----------

export const COMMISSION_PAYMENT_MODES = [
  'Cash',
  'Bank Transfer (BT)',
  'Botim',
  'Cheque / PDC',
  'Manager Cheque',
  'Other',
] as const;

export const COMMISSION_STATUSES = ['Pending', 'Received', 'Paid'] as const;

export const COMMISSION_ENTRY_TYPES = [
  'Advisor DSA Commission',
  'Advisor Case Expense',
  'Advisor Draw / Advance',
  'RERA Partner Referral Split',
] as const;

export type CommissionEntryType = (typeof COMMISSION_ENTRY_TYPES)[number];

export interface CommissionExpenseEntry {
  agent_name: string;
  agent_user_id?: string | null;
  entry_type: CommissionEntryType;
  gross_amount_aed: number;
  split_pct: number;
  net_amount_aed: number;
  status: 'Pending' | 'Received' | 'Paid';
  payment_mode: string;
  is_third_party: boolean;
}

export function computeAgentSettlementSummary(entries: CommissionExpenseEntry[]) {
  let totalReceivedAed = 0;
  let totalPaidAed = 0;
  let totalPendingAed = 0;
  let totalExpensesAed = 0;
  let totalThirdPartyAed = 0;

  const byAgent = new Map<
    string,
    {
      agentName: string;
      commissionReceivedAed: number;
      commissionPaidAed: number;
      commissionPendingAed: number;
      expensesByAgentAed: number;
      advancesAed: number;
      thirdPartySplitAed: number;
      netBalanceDueAed: number;
      count: number;
    }
  >();

  for (const e of entries) {
    const net = Number(e.net_amount_aed || 0);
    if (e.status === 'Received') totalReceivedAed += net;
    if (e.status === 'Paid') totalPaidAed += net;
    if (e.status === 'Pending') totalPendingAed += net;
    if (e.entry_type === 'Advisor Case Expense') totalExpensesAed += net;
    if (e.entry_type === 'RERA Partner Referral Split' || e.is_third_party) totalThirdPartyAed += net;

    const key = e.agent_name || 'Unassigned';
    const cur = byAgent.get(key) ?? {
      agentName: key,
      commissionReceivedAed: 0,
      commissionPaidAed: 0,
      commissionPendingAed: 0,
      expensesByAgentAed: 0,
      advancesAed: 0,
      thirdPartySplitAed: 0,
      netBalanceDueAed: 0,
      count: 0,
    };
    cur.count += 1;

    if (e.entry_type === 'Advisor DSA Commission') {
      if (e.status === 'Received') cur.commissionReceivedAed += net;
      else if (e.status === 'Paid') cur.commissionPaidAed += net;
      else cur.commissionPendingAed += net;
    } else if (e.entry_type === 'Advisor Case Expense') {
      cur.expensesByAgentAed += net;
    } else if (e.entry_type === 'Advisor Draw / Advance') {
      cur.advancesAed += net;
    } else if (e.entry_type === 'RERA Partner Referral Split') {
      cur.thirdPartySplitAed += net;
    }

    // Net Due to Advisor = Pending/Received DSA Commissions + Approved Case Expenses - Draws/Advances
    cur.netBalanceDueAed = Number(
      (cur.commissionPendingAed + cur.commissionReceivedAed + cur.expensesByAgentAed - cur.advancesAed).toFixed(2),
    );
    byAgent.set(key, cur);
  }

  return {
    totals: {
      totalReceivedAed: Math.round(totalReceivedAed * 100) / 100,
      totalPaidAed: Math.round(totalPaidAed * 100) / 100,
      totalPendingAed: Math.round(totalPendingAed * 100) / 100,
      totalExpensesAed: Math.round(totalExpensesAed * 100) / 100,
      totalThirdPartyAed: Math.round(totalThirdPartyAed * 100) / 100,
    },
    agents: Array.from(byAgent.values()).sort((a, b) => b.netBalanceDueAed - a.netBalanceDueAed),
  };
}
