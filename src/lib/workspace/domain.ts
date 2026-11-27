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

export const BROCHURE_THEME_PRESETS: Record<Exclude<BrochurePresetKey, 'custom'>, Omit<BrochureThemeConfig, 'headerTagline' | 'footerNote' | 'showPaymentPlan' | 'showAmenities' | 'showMortgageStrip'>> = {
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
  headerTagline: 'Independent UAE Mortgage & Real Estate Advisory · 24 Partner Banks',
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

// ---------- Pin-to-Pin Closing Tracks (Off-Plan, Secondary, Handover, Leasing, Property Management) ----------

export type ClosingTrack = 'Off-Plan' | 'Secondary' | 'Handover' | 'Leasing' | 'Property Management';

export const CLOSING_TRACKS: readonly ClosingTrack[] = [
  'Off-Plan',
  'Secondary',
  'Handover',
  'Leasing',
  'Property Management',
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
  'Off-Plan': [
    'EOI & Unit Booking Confirmation',
    'Client KYC, AML & Source of Funds Check',
    'Booking Deposit & 1st Instalment Receipt',
    'SPA Issuance & Buyer Signature',
    '4% DLD Registration & Oqood Certificate',
    'Escrow Construction Milestones & SOA Audit',
    'Pre-Handover UAE Bank Pre-Approval (DIP)',
    'Developer Final SOA & Bank Property Valuation',
    'Pre-Handover Snagging & Final Balance Disbursal',
    'Key Handover, DEWA Activation & Title Deed',
  ],
  Secondary: [
    'Lead Intake & Forensic Viewing Report',
    'Written Offer / Letter of Intent (LOI)',
    'RERA Form A / Form B / A2A (Form I) Signed',
    'Buyer & Seller KYC, AML & Liability Check',
    'Form F (MOU) Executed & 10% Security Cheque Held',
    'UAE Bank Mortgage Pre-Approval (DIP)',
    'Bank Property Valuation Report Issued',
    'Final Offer Letter (FOL) & Life Insurance Signed',
    'Developer NOC & Service Charge Clearance',
    'DLD Trustee Transfer & Manager Cheques Settled',
    'New Title Deed Issued, Keys & Commission Settled',
  ],
  Handover: [
    'Developer Handover Notice & Completion Certificate',
    'Technical Snagging Inspection & Defect Sign-Off',
    'Updated Developer Final Statement of Account (SOA)',
    'Handover Mortgage Pre-Approval (24-Bank Shortlist)',
    'Bank Valuation & Final Offer Letter (FOL)',
    'Manager Cheque / Escrow Disbursal to Developer',
    'Developer Clearance Receipt & Handover NOC',
    'DEWA, Chiller & Utility Account Activation',
    'Keys, Access Cards & Title Deed Issuance',
  ],
  Leasing: [
    'Forensic Viewing & Landlord Offer Approval',
    'Tenant KYC (Passport, Visa, Emirates ID)',
    'Dubai RERA Unified Tenancy Contract & Addendum',
    'Refundable Security Deposit Cheque / Receipt',
    'Yearly Rent PDC Cheques (1–12 Cheques) Logged',
    'Agency Leasing Fee & 5% VAT Receipt',
    'Ejari Certificate Registered at DLD',
    'DEWA, Chiller & Building Move-In Permit',
    'Key Handover & Unit Condition Photo Report',
  ],
  'Property Management': [
    'Owner Onboarding & Title Deed Verification',
    'Signed Property Management Agreement (PMA)',
    'Initial Snagging, Inventory & Readiness Inspection',
    'Marketing Listing, Brochure & Viewing Logs',
    'Tenant Placement, Deposit & Rent Cheque Schedule',
    'Ejari Registration & Tenant Move-In Handover',
    'Preventive Maintenance & Expense Escrow Log',
    'Owner Statement, Cheque Clearance & Renewal Watch',
  ],
};

export function buildDefaultStagesForTrack(track: ClosingTrack): ClosingStageItem[] {
  const labels = TRACK_STAGE_LABELS[track] ?? TRACK_STAGE_LABELS.Secondary;
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

// ---------- Legal Form Placeholder Extractor & Live Template Filler ----------

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
        : lower.includes('aed') || lower.includes('pct') || lower.includes('count') || lower.includes('days') || lower.includes('sqft')
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

// ---------- Agent Commission & Expense Settlement Math ----------

export const COMMISSION_PAYMENT_MODES = [
  'Cash',
  'Bank Transfer (BT)',
  'Botim',
  'Cheque / PDC',
  'Manager Cheque',
  'Other',
] as const;

export const COMMISSION_STATUSES = ['Pending', 'Received', 'Paid'] as const;

export interface CommissionExpenseEntry {
  agent_name: string;
  agent_user_id?: string | null;
  entry_type: 'Commission to Agent' | 'Expense by Agent' | 'Agent Advance' | '3rd-Party Split';
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
    if (e.entry_type === 'Expense by Agent') totalExpensesAed += net;
    if (e.entry_type === '3rd-Party Split' || e.is_third_party) totalThirdPartyAed += net;

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

    if (e.entry_type === 'Commission to Agent') {
      if (e.status === 'Received') cur.commissionReceivedAed += net;
      else if (e.status === 'Paid') cur.commissionPaidAed += net;
      else cur.commissionPendingAed += net;
    } else if (e.entry_type === 'Expense by Agent') {
      cur.expensesByAgentAed += net;
    } else if (e.entry_type === 'Agent Advance') {
      cur.advancesAed += net;
    } else if (e.entry_type === '3rd-Party Split') {
      cur.thirdPartySplitAed += net;
    }

    // Net Due to Agent = Pending/Received Commissions + Approved Agent Expenses - Advances already given
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
