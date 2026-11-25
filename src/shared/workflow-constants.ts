// 12-Milestone Case Workflow, 7 Mortgage Types, Per-Profile Document Checklists & Strictly Legal UAE Payment Modes

export interface MilestoneSpec {
  code: string;
  order: number;
  label: string;
  labelAr: string;
  ownerRole: string;
  slaHours: number;
  requiredEvidence: string;
  color: string;
}

export const CASE_MILESTONES: MilestoneSpec[] = [
  { code: '01_NEW_ENQUIRY', order: 1, label: 'New Enquiry', labelAr: 'استفسار جديد', ownerRole: 'Sales', slaHours: 4, requiredEvidence: 'Consent & source logged', color: '#64748b' },
  { code: '02_FACT_FIND', order: 2, label: 'Fact-Find', labelAr: 'جمع البيانات', ownerRole: 'Advisor', slaHours: 24, requiredEvidence: 'Income, liabilities & property intent', color: '#0284c7' },
  { code: '03_SHORTLIST', order: 3, label: 'Indicative Shortlist', labelAr: 'القائمة المختصرة', ownerRole: 'Advisor', slaHours: 24, requiredEvidence: 'Versioned KFS quote & CBUAE DBR check', color: '#2563eb' },
  { code: '04_DOC_REVIEW', order: 4, label: 'Document Review', labelAr: 'مراجعة المستندات', ownerRole: 'Operations', slaHours: 48, requiredEvidence: 'Mandatory KYC & bank statements verified', color: '#7c3aed' },
  { code: '05_BANK_SUBMISSION', order: 5, label: 'Bank Submission', labelAr: 'تقديم للبنك', ownerRole: 'Bank Desk', slaHours: 24, requiredEvidence: 'Lender reference & submission timestamp', color: '#9333ea' },
  { code: '06_PRE_APPROVAL', order: 6, label: 'Pre-Approval (DIP)', labelAr: 'الموافقة المبدئية', ownerRole: 'Bank Desk', slaHours: 96, requiredEvidence: 'Bank DIP letter, conditions & expiry date', color: '#0891b2' },
  { code: '07_VALUATION', order: 7, label: 'Property & Valuation', labelAr: 'التقييم العقاري', ownerRole: 'Progression', slaHours: 120, requiredEvidence: 'Bank valuation report & shortfall review', color: '#d97706' },
  { code: '08_FINAL_OFFER', order: 8, label: 'Final Offer (FOL)', labelAr: 'العرض النهائي', ownerRole: 'Bank Desk', slaHours: 120, requiredEvidence: 'Signed FOL & life/property insurance bound', color: '#ea580c' },
  { code: '09_TRANSFER_NOC', order: 9, label: 'NOC & DLD Transfer', labelAr: 'شهادة عدم ممانعة ونقل الملكية', ownerRole: 'Progression', slaHours: 168, requiredEvidence: 'Developer NOC, Form F & Trustee booking', color: '#b45309' },
  { code: '10_DISBURSAL', order: 10, label: 'Bank Disbursal', labelAr: 'صرف التمويل', ownerRole: 'Progression', slaHours: 48, requiredEvidence: 'Title Deed / Mortgage Reg & bank funding confirmation', color: '#059669' },
  { code: '11_SETTLEMENT', order: 11, label: 'Financial Settlement', labelAr: 'التسوية المالية', ownerRole: 'Finance', slaHours: 72, requiredEvidence: 'Bank DSA invoice matched & partner payout approved', color: '#179373' },
  { code: '12_CLOSED', order: 12, label: 'Closed & Rate-Reset Watch', labelAr: 'مغلق ومتابعة التجديد', ownerRole: 'Operations', slaHours: 0, requiredEvidence: 'Post-close retention & fixed-expiry reminder scheduled', color: '#0A4A3E' },
];

export const MORTGAGE_TYPES = [
  'Handover Payment (SOA)',
  'Resale Purchase (Secondary)',
  'Equity Refinance',
  'Buy-Out (Refinance)',
  'Buy-Out + Equity',
  'Off-Plan Finance',
  'Non-Resident Purchase',
] as const;

export type BorrowerProfileType = 'salaried' | 'self_employed_full' | 'self_employed_low_doc' | 'non_resident';

/** Auto-generated document checklists directly from Betterway Mortgage presentation-Landscape.pdf */
export const DOCUMENT_CHECKLIST_BY_PROFILE: Record<BorrowerProfileType, { name: string; mandatory: boolean; recencyDays: number }[]> = {
  salaried: [
    { name: 'Passport Copy (Color)', mandatory: true, recencyDays: 365 },
    { name: 'UAE Residency Visa Page', mandatory: true, recencyDays: 365 },
    { name: 'Emirates ID (Front & Back)', mandatory: true, recencyDays: 365 },
    { name: 'Latest Salary Certificate (Addressed to Bank)', mandatory: true, recencyDays: 30 },
    { name: 'Last 6 Months Payslips', mandatory: true, recencyDays: 30 },
    { name: 'Last 6 Months UAE Bank Statements (Salary Credits)', mandatory: true, recencyDays: 30 },
    { name: 'Al Etihad Credit Bureau (AECB) Credit Report', mandatory: true, recencyDays: 30 },
    { name: 'Signed Bank Application & Information Sheet', mandatory: true, recencyDays: 60 },
    { name: 'Property Form F / Oqood / Title Deed & Developer SOA', mandatory: true, recencyDays: 90 },
  ],
  self_employed_full: [
    { name: 'Passport, UAE Visa & Emirates ID', mandatory: true, recencyDays: 365 },
    { name: 'Valid Trade License (Min 2 Years) & MOA / Share Certificate', mandatory: true, recencyDays: 365 },
    { name: '2 Years Audited Financial Statements', mandatory: true, recencyDays: 365 },
    { name: 'Last 12 Months Corporate Bank Statements (Min AED 2M Turnover)', mandatory: true, recencyDays: 30 },
    { name: 'Last 6 Months Personal Bank Statements', mandatory: true, recencyDays: 30 },
    { name: 'Last 4 Quarters UAE VAT Returns & Office Ejari', mandatory: true, recencyDays: 90 },
    { name: 'Personal & Corporate AECB Credit Reports', mandatory: true, recencyDays: 30 },
    { name: 'Signed Bank Forms & Property Documents', mandatory: true, recencyDays: 60 },
  ],
  self_employed_low_doc: [
    { name: 'Passport Copy, UAE Visa Page & Emirates ID', mandatory: true, recencyDays: 365 },
    { name: 'Last 6 Months Personal Bank Statements (>AED 40k/mo credits, AED 15k min bal)', mandatory: true, recencyDays: 30 },
    { name: 'Trade License, MOA & Amendments', mandatory: true, recencyDays: 365 },
    { name: 'Last 4 Quarters VAT Returns', mandatory: true, recencyDays: 90 },
    { name: 'Company Office Ejari & Active Website Proof', mandatory: true, recencyDays: 365 },
    { name: 'AECB Credit Report', mandatory: true, recencyDays: 30 },
    { name: 'Bank Pre-Approval Fee Cheque (AED 1,050 Payable to Bank)', mandatory: true, recencyDays: 30 },
    { name: 'Signed Bank Application & Information Sheet', mandatory: true, recencyDays: 60 },
  ],
  non_resident: [
    { name: 'Passport Copy (All Color Pages)', mandatory: true, recencyDays: 365 },
    { name: 'Home Country National ID (Front & Back)', mandatory: true, recencyDays: 365 },
    { name: 'Valid Salary Certificate / Company Registration Docs', mandatory: true, recencyDays: 30 },
    { name: 'Last 6 Months Bank Statements (≥AED 40k in 4 txns, AED 15k min / 25k avg)', mandatory: true, recencyDays: 30 },
    { name: 'Last 6 Months Salary Slips & HR Official Verification Email', mandatory: true, recencyDays: 30 },
    { name: 'Home Country Credit Bureau Report & Liabilities Declaration', mandatory: true, recencyDays: 30 },
    { name: 'Residential Proof (Utility / Electric Bill)', mandatory: true, recencyDays: 90 },
    { name: 'Marriage Certificate (If Joint Application)', mandatory: false, recencyDays: 365 },
  ],
};

/** Strictly Legal UAE Corporate Payment Channels — Zero Tolerance for Advisor Personal Accounts (SWKOS parity). */
export const LEGAL_UAE_PAYMENT_CHANNELS = [
  'Betterway Mortgages LLC Corporate Bank Account (AED)',
  'Lending Bank Direct DSA Settlement Wire (SWIFT/UAEFTS)',
  'DLD Trustee / Developer Escrow Account',
  "Manager's Cheque (Payable to Seller / Bank / DLD)",
  'Licensed UAE Exchange House (CBUAE Regulated)',
] as const;

export const FORBIDDEN_PAYMENT_TERMS = [
  'personal',
  'advisor account',
  'agent personal',
  'cash in hand',
  'personal iban',
  'private account',
];
