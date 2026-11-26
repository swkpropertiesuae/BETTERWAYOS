import type { StageCode } from './types';

export interface PipelineStageDef {
  order: number;
  code: StageCode;
  label: string;
  shortLabel: string;
  labelAr: string;
  ownerDesk: string;
  slaHours: number;
  requiredEvidence: string;
  accentHex: string;
}

export const PIPELINE_STAGES: readonly PipelineStageDef[] = [
  { order: 1, code: '01_ENQUIRY', label: 'Enquiry', shortLabel: '01 Enquiry', labelAr: 'استفسار جديد', ownerDesk: 'Advisory / CRM', slaHours: 1, requiredEvidence: 'Source attributed, duplicate checked & PDPL consent logged', accentHex: '#0A1128' },
  { order: 2, code: '02_ELIGIBILITY', label: 'Eligibility & Fact-Find', shortLabel: '02 Eligibility', labelAr: 'الأهلية والتقييم', ownerDesk: 'Advisory', slaHours: 12, requiredEvidence: 'CBUAE 50% DBR stress test, LTV & age cap verified', accentHex: '#1D4ED8' },
  { order: 3, code: '03_PICK_BANKS', label: 'Pick Banks', shortLabel: '03 Pick Banks', labelAr: 'اختيار البنوك', ownerDesk: 'Advisory', slaHours: 24, requiredEvidence: '1–3 partner banks shortlisted & comparison quote sent', accentHex: '#0369A1' },
  { order: 4, code: '04_COLLECT_PAPERS', label: 'Collect Papers', shortLabel: '04 Papers', labelAr: 'جمع المستندات', ownerDesk: 'Advisory / Docs', slaHours: 48, requiredEvidence: 'All mandatory Vault documents uploaded & recency verified', accentHex: '#0F766E' },
  { order: 5, code: '05_SUBMIT', label: 'Submit to Bank', shortLabel: '05 Submit', labelAr: 'التقديم للبنك', ownerDesk: 'Operations', slaHours: 24, requiredEvidence: 'Bank application submitted & lender reference logged', accentHex: '#0D8A6A' },
  { order: 6, code: '06_PRE_APPROVAL', label: 'Get Pre-Approval', shortLabel: '06 Pre-Approval', labelAr: 'الموافقة المبدئية', ownerDesk: 'Operations', slaHours: 96, requiredEvidence: 'Written Pre-Approval (AIP) uploaded & expiry date set', accentHex: '#059669' },
  { order: 7, code: '07_VALUATION', label: 'Property Valuation', shortLabel: '07 Valuation', labelAr: 'تقييم العقار', ownerDesk: 'Mortgage Desk', slaHours: 72, requiredEvidence: 'Bank valuation booked, inspected & valuation value logged', accentHex: '#B45309' },
  { order: 8, code: '08_FOL', label: 'Final Offer (FOL)', shortLabel: '08 FOL', labelAr: 'العرض النهائي', ownerDesk: 'Operations', slaHours: 72, requiredEvidence: 'Final Offer Letter signed, Joint KFS & Takaful confirmed', accentHex: '#C2410C' },
  { order: 9, code: '09_DEVELOPER_NOC', label: 'Developer NOC', shortLabel: '09 Dev NOC', labelAr: 'عدم ممانعة المطور', ownerDesk: 'Operations', slaHours: 96, requiredEvidence: 'Developer SOA settled / e-NOC issued (or Liability Letter)', accentHex: '#7C3AED' },
  { order: 10, code: '10_DISBURSAL', label: 'Transfer & Disbursal', shortLabel: '10 Disbursal', labelAr: 'التحويل والصرف', ownerDesk: 'Operations', slaHours: 48, requiredEvidence: 'DLD Trustee transfer completed & bank disbursal confirmed', accentHex: '#15803D' },
  { order: 11, code: '11_COMMISSION', label: 'Commission & Payout', shortLabel: '11 Commission', labelAr: 'العمولة والتسوية', ownerDesk: 'Accounts / Finance', slaHours: 72, requiredEvidence: 'Bank DSA invoice matched, 5% VAT booked & partner payout cleared', accentHex: '#D4AF37' },
  { order: 12, code: '12_CLIENT_CARE', label: 'Client Care & Rate-Reset', shortLabel: '12 Client Care', labelAr: 'رعاية العميل', ownerDesk: 'Advisory / Care', slaHours: 0, requiredEvidence: 'Handover care sent & 90-day pre-revert buyout watch scheduled', accentHex: '#0A4A3E' },
];

export const STAGE_ORDER_MAP: Record<StageCode, number> = Object.fromEntries(
  PIPELINE_STAGES.map((s) => [s.code, s.order]),
) as Record<StageCode, number>;

export const MORTGAGE_TYPES = [
  'Resale Purchase (Secondary)',
  'Handover Payment (SOA)',
  'Equity Refinance',
  'Buy-Out (Refinance)',
  'Buy-Out + Equity',
  'Off-Plan Finance',
  'Non-Resident Purchase',
] as const;

export const ENQUIRY_CHANNELS = [
  'Website',
  'Online Chat',
  'WhatsApp',
  'Bayut',
  'Property Finder',
  'Referral',
  'Phone Call',
  'Walk-in (Oud Metha)',
  'Social Media',
  'SWK Partner Relay',
] as const;

export type BorrowerProfileType =
  | 'salaried'
  | 'self_employed_full'
  | 'self_employed_low_doc'
  | 'non_resident';

export interface CoreDocRequirement {
  category: string;
  name: string;
  mandatory: boolean;
  recencyDays: number;
  profiles: BorrowerProfileType[];
}

/** Complete per-client Document Vault core checklist covering all user-specified + CBUAE/Betterway docs. */
export const CORE_DOCUMENT_CHECKLIST: readonly CoreDocRequirement[] = [
  { category: 'Identity', name: 'Passport Copy (Color — All Pages)', mandatory: true, recencyDays: 365, profiles: ['salaried', 'self_employed_full', 'self_employed_low_doc', 'non_resident'] },
  { category: 'Identity', name: 'Emirates ID (Front & Back)', mandatory: true, recencyDays: 365, profiles: ['salaried', 'self_employed_full', 'self_employed_low_doc'] },
  { category: 'Identity', name: 'UAE Residency Visa Page', mandatory: true, recencyDays: 365, profiles: ['salaried', 'self_employed_full', 'self_employed_low_doc'] },
  { category: 'Income', name: 'Latest Salary Certificate (Addressed to Bank)', mandatory: true, recencyDays: 30, profiles: ['salaried', 'non_resident'] },
  { category: 'Income', name: 'Last 6 Months Payslips', mandatory: true, recencyDays: 30, profiles: ['salaried', 'non_resident'] },
  { category: 'Banking', name: 'Last 6 Months Bank Statements (Salary / Personal Credits)', mandatory: true, recencyDays: 30, profiles: ['salaried', 'self_employed_full', 'self_employed_low_doc', 'non_resident'] },
  { category: 'Credit', name: 'AECB Credit Report (or Home Country Bureau)', mandatory: true, recencyDays: 30, profiles: ['salaried', 'self_employed_full', 'self_employed_low_doc', 'non_resident'] },
  { category: 'Bank Forms', name: 'Signed Bank Application Form', mandatory: true, recencyDays: 60, profiles: ['salaried', 'self_employed_full', 'self_employed_low_doc', 'non_resident'] },
  { category: 'Bank Forms', name: 'Signed Information Sheet & CBUAE KFS', mandatory: true, recencyDays: 60, profiles: ['salaried', 'self_employed_full', 'self_employed_low_doc', 'non_resident'] },
  { category: 'Property', name: 'Property Form F (MOU / Sale Contract)', mandatory: true, recencyDays: 90, profiles: ['salaried', 'self_employed_full', 'self_employed_low_doc', 'non_resident'] },
  { category: 'Property', name: 'Oqood (Off-Plan / Handover Registration)', mandatory: false, recencyDays: 365, profiles: ['salaried', 'self_employed_full', 'self_employed_low_doc', 'non_resident'] },
  { category: 'Property', name: 'Title Deed (Ready Property / Buyout / Equity)', mandatory: false, recencyDays: 365, profiles: ['salaried', 'self_employed_full', 'self_employed_low_doc', 'non_resident'] },
  { category: 'Property', name: 'Developer Statement of Account (SOA) & NOC', mandatory: true, recencyDays: 30, profiles: ['salaried', 'self_employed_full', 'self_employed_low_doc', 'non_resident'] },
  { category: 'Business', name: 'Trade License (Min 2 Years), MOA & Share Certificate', mandatory: true, recencyDays: 365, profiles: ['self_employed_full', 'self_employed_low_doc'] },
  { category: 'Business', name: 'Last 4 Quarters UAE VAT Returns & Office Ejari', mandatory: true, recencyDays: 90, profiles: ['self_employed_full', 'self_employed_low_doc'] },
  { category: 'Business', name: '2 Years Audited Financials & 12m Corporate Bank Statements', mandatory: true, recencyDays: 365, profiles: ['self_employed_full'] },
  { category: 'Business', name: 'Bank Pre-Approval Fee Cheque (AED 1,050) & Active Website Proof', mandatory: true, recencyDays: 30, profiles: ['self_employed_low_doc'] },
  { category: 'International', name: 'Home Country National ID, Utility Bill & HR Verification Email', mandatory: true, recencyDays: 90, profiles: ['non_resident'] },
];

export function getChecklistForProfile(profile: BorrowerProfileType): CoreDocRequirement[] {
  return CORE_DOCUMENT_CHECKLIST.filter((d) => d.profiles.includes(profile));
}

export const FORBIDDEN_PAYMENT_TERMS = [
  'personal',
  'advisor account',
  'agent personal',
  'cash in hand',
  'cash-in-hand',
  'personal iban',
  'private account',
  'individual account',
] as const;

export const LEGAL_UAE_PAYMENT_CHANNELS = [
  'Betterway Mortgages LLC Corporate Bank Account (AED)',
  'Lending Bank Direct DSA Settlement Wire (SWIFT/UAEFTS)',
  'DLD Trustee / Developer Escrow Account',
  "Manager's Cheque (Payable to Seller / Bank / DLD)",
  'Licensed UAE Exchange House (CBUAE Regulated)',
] as const;
