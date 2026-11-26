import dotenv from 'dotenv';
import path from 'node:path';
import crypto from 'node:crypto';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { getSupabaseAdmin } from '../src/lib/supabase/admin';
import { OFFICIAL_ROSTER } from '../src/lib/domain/staff';
import { UAE_BANKS } from '../src/lib/domain/banks';
import { UAE_COMMUNITIES } from '../src/lib/domain/communities';
import { CORE_DOCUMENT_CHECKLIST } from '../src/lib/domain/workflow';
import { SEED_CASE_STUDIES } from '../src/lib/domain/case-studies';

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 32).toString('hex');
  return `${salt}:${hash}`;
}

const DEPARTMENTS = [
  { id: 'DEP-01', code: 'MGMT', name: 'Management & Ownership', head_user_id: 'USR-01', category: 'Leadership', description: 'Warda Kapadia (Founder & MD) & Shabib Siraj (Executive Director) — 15+ years banking & HNWI executive governance.' },
  { id: 'DEP-02', code: 'BDM', name: 'BDM', head_user_id: 'USR-03', category: 'Revenue', description: 'Business Development Management — developer partnerships, agency desks & institutional B2B sourcing.' },
  { id: 'DEP-03', code: 'DMKT', name: 'Digital Marketing', head_user_id: 'USR-06', category: 'Revenue', description: 'Multilingual web growth, SEO/AEO, Betterway website CMS, paid campaigns & UTM attribution.' },
  { id: 'DEP-04', code: 'HR', name: 'HR', head_user_id: 'USR-05', category: 'Corporate', description: 'Hiring, advisor onboarding, Emirates ID/Visa compliance, attendance governance & MOHRE WPS.' },
  { id: 'DEP-05', code: 'DOCS', name: 'Documentation', head_user_id: 'USR-04', category: 'Operations', description: 'Client Document Vault verification, AECB, salary certs, Form F, Oqood, Title Deed & bank packs.' },
  { id: 'DEP-06', code: 'ACCT', name: 'Accounts', head_user_id: 'USR-00', category: 'Finance', description: 'Double-entry GL bookkeeping, bank DSA invoicing, receivables & FTA UAE 5% VAT 201.' },
  { id: 'DEP-07', code: 'FIN', name: 'Finance', head_user_id: 'USR-01', category: 'Finance', description: 'Treasury, corporate-account-only payout controls, cash flow forecasting & Owner dual sign-off.' },
  { id: 'DEP-08', code: 'PMGT', name: 'Property Management', head_user_id: 'USR-02', category: 'Operations', description: 'Landlord portfolio advisory, rental yield tracking, handover snagging & equity release desk.' },
  { id: 'DEP-09', code: 'SBD', name: 'Sales & Business Development', head_user_id: 'USR-03', category: 'Revenue', description: 'Direct mortgage advisory desk (Daniel, Asif, Reshma) across resident, buyout & non-resident segments.' },
  { id: 'DEP-10', code: 'OPS', name: 'Operations', head_user_id: 'USR-04', category: 'Operations', description: 'Bank submissions, valuations, FOL signing, Developer NOC & DLD Trustee transfers.' },
  { id: 'DEP-11', code: 'IT', name: 'IT & Digital Platforms', head_user_id: 'USR-06', category: 'Corporate', description: 'Betterway OS, website interconnect, Hikvision door attendance bridge & AI knowledge systems.' },
  { id: 'DEP-12', code: 'COMP', name: 'Compliance & MLRO', head_user_id: 'USR-01', category: 'Corporate', description: 'CBUAE KFS governance, AML/goAML screening, UAE PDPL Decree-Law 45/2021 & audit trails.' },
];

const DEVELOPERS = [
  { id: 'DEV-01', code: 'EMAAR', name: 'Emaar Properties', emirate: 'Dubai', rera_dev_no: 'DEV-001', apl_tier: 'Tier 1 — All 24 Banks', noc_portal: 'https://portal.emaar.com', escrow_banks: 'ENBD, FAB, DIB, ADCB', website: 'https://www.emaar.com', logo_url: '/projects/emaar.svg', description: 'Master developer of Downtown Dubai, Dubai Hills Estate, Dubai Creek Harbour, Arabian Ranches & The Oasis.' },
  { id: 'DEV-02', code: 'DAMAC', name: 'DAMAC Properties', emirate: 'Dubai', rera_dev_no: 'DEV-002', apl_tier: 'Tier 1 — Major Banks', noc_portal: 'https://living.damacproperties.com', escrow_banks: 'ENBD, DIB, Mashreq, CBD', website: 'https://www.damacproperties.com', logo_url: '/projects/damac.png', description: 'DAMAC Hills 1 & 2, DAMAC Lagoons, DAMAC Islands & Business Bay residential towers.' },
  { id: 'DEV-03', code: 'SOBHA', name: 'Sobha Realty', emirate: 'Dubai', rera_dev_no: 'DEV-003', apl_tier: 'Tier 1 — All 24 Banks', noc_portal: 'https://portal.sobharealty.com', escrow_banks: 'ENBD, FAB, ADCB, Mashreq', website: 'https://www.sobharealty.com', logo_url: '/projects/sobha.png', description: 'Sobha Hartland, Sobha Hartland II, Sobha One & Sobha Siniya Island.' },
  { id: 'DEV-04', code: 'NAKHEEL', name: 'Nakheel (Dubai Holding)', emirate: 'Dubai', rera_dev_no: 'DEV-004', apl_tier: 'Tier 1 — All 24 Banks', noc_portal: 'https://my.nakheel.com', escrow_banks: 'ENBD, DIB, ADCB', website: 'https://www.nakheel.com', logo_url: '', description: 'Palm Jumeirah, Palm Jebel Ali, Dubai Islands, JVC, JVT & Al Furjan master communities.' },
  { id: 'DEV-05', code: 'MERAAS', name: 'Meraas (Dubai Holding)', emirate: 'Dubai', rera_dev_no: 'DEV-005', apl_tier: 'Tier 1 — All 24 Banks', noc_portal: 'https://portal.dubaiholding.com', escrow_banks: 'ENBD, FAB, DIB', website: 'https://www.meraas.com', logo_url: '', description: 'City Walk, Bluewaters Island, Madinat Jumeirah Living & Nad Al Sheba Gardens.' },
  { id: 'DEV-06', code: 'ALDAR', name: 'Aldar Properties', emirate: 'Abu Dhabi', rera_dev_no: 'AD-001', apl_tier: 'Tier 1 — UAE Wide', noc_portal: 'https://livealdar.com', escrow_banks: 'FAB, ADCB, ADIB, ENBD', website: 'https://www.aldar.com', logo_url: '', description: 'Yas Island, Saadiyat Island, Al Reem Island, Haven & Athlon Dubai.' },
  { id: 'DEV-07', code: 'AZIZI', name: 'Azizi Developments', emirate: 'Dubai', rera_dev_no: 'DEV-007', apl_tier: 'Tier 2 — 16+ Banks', noc_portal: 'https://myazizi.com', escrow_banks: 'ENBD, DIB, Mashreq, RAKBANK', website: 'https://www.azizidevelopments.com', logo_url: '', description: 'Azizi Riviera (MBR City), Azizi Venice (Dubai South) & Al Furjan.' },
  { id: 'DEV-08', code: 'BINGHATTI', name: 'Binghatti Developers', emirate: 'Dubai', rera_dev_no: 'DEV-008', apl_tier: 'Tier 2 — 16+ Banks', noc_portal: 'https://portal.binghatti.com', escrow_banks: 'ENBD, Mashreq, CBD, DIB', website: 'https://www.binghatti.com', logo_url: '', description: 'Business Bay, JVC, Al Jaddaf & branded luxury towers.' },
  { id: 'DEV-09', code: 'ELLINGTON', name: 'Ellington Properties', emirate: 'Dubai', rera_dev_no: 'DEV-009', apl_tier: 'Tier 1 — Major Banks', noc_portal: 'https://ellingtonproperties.ae', escrow_banks: 'ENBD, Mashreq, ADCB, CBD', website: 'https://ellingtonproperties.ae', logo_url: '', description: 'Design-led residences across JVC, Business Bay, MBR City, Palm Jumeirah & RAK.' },
  { id: 'DEV-10', code: 'MAF', name: 'Majid Al Futtaim', emirate: 'Dubai', rera_dev_no: 'DEV-010', apl_tier: 'Tier 1 — All 24 Banks', noc_portal: 'https://tilalalghaf.com', escrow_banks: 'ENBD, FAB, ADCB, HSBC', website: 'https://www.majidalfuttaim.com', logo_url: '', description: 'Tilal Al Ghaf master luxury lagoon villa community.' },
  { id: 'DEV-11', code: 'DANUBE', name: 'Danube Properties', emirate: 'Dubai', rera_dev_no: 'DEV-011', apl_tier: 'Tier 2 — 14+ Banks', noc_portal: 'https://danubeproperties.com', escrow_banks: 'ENBD, Mashreq, RAKBANK, CBD', website: 'https://danubeproperties.com', logo_url: '', description: 'High-velocity 1% payment plan towers across Dubai Maritime City, JVT & Business Bay.' },
  { id: 'DEV-12', code: 'NSHAMA', name: 'Nshama', emirate: 'Dubai', rera_dev_no: 'DEV-012', apl_tier: 'Tier 1 — Major Banks', noc_portal: 'https://nshama.ae', escrow_banks: 'ENBD, DIB, ADCB', website: 'https://nshama.ae', logo_url: '', description: 'Town Square Dubai family townhouses & apartments.' },
  { id: 'DEV-13', code: 'OMNIYAT', name: 'Omniyat', emirate: 'Dubai', rera_dev_no: 'DEV-013', apl_tier: 'Tier 1 — Private Wealth', noc_portal: 'https://omniyat.com', escrow_banks: 'ENBD, FAB, Standard Chartered', website: 'https://omniyat.com', logo_url: '', description: 'Ultra-prime residences in Palm Jumeirah, Marasi Bay & Business Bay.' },
  { id: 'DEV-14', code: 'SELECT', name: 'Select Group', emirate: 'Dubai', rera_dev_no: 'DEV-014', apl_tier: 'Tier 1 — Major Banks', noc_portal: 'https://select-group.ae', escrow_banks: 'ENBD, Mashreq, FAB', website: 'https://select-group.ae', logo_url: '', description: 'Dubai Marina, Peninsula Business Bay & Six Senses residences.' },
  { id: 'DEV-15', code: 'ARADA', name: 'Arada', emirate: 'Sharjah', rera_dev_no: 'SHJ-001', apl_tier: 'Tier 1 — Sharjah & Dubai', noc_portal: 'https://arada.com', escrow_banks: 'SIB, DIB, ADCB, FAB', website: 'https://arada.com', logo_url: '', description: 'Aljada, Masaar (Sharjah) & Armani Beach Residences (Palm Jumeirah).' },
];

const CURRENCIES = [
  { id: 'CUR-AED', code: 'AED', name: 'UAE Dirham', symbol: 'AED', rate_to_aed: 1.0, is_base: true },
  { id: 'CUR-USD', code: 'USD', name: 'US Dollar', symbol: '$', rate_to_aed: 3.6725, is_base: false },
  { id: 'CUR-EUR', code: 'EUR', name: 'Euro', symbol: '€', rate_to_aed: 3.98, is_base: false },
  { id: 'CUR-GBP', code: 'GBP', name: 'British Pound', symbol: '£', rate_to_aed: 4.68, is_base: false },
  { id: 'CUR-INR', code: 'INR', name: 'Indian Rupee', symbol: '₹', rate_to_aed: 0.0435, is_base: false },
  { id: 'CUR-SAR', code: 'SAR', name: 'Saudi Riyal', symbol: 'SAR', rate_to_aed: 0.9793, is_base: false },
  { id: 'CUR-QAR', code: 'QAR', name: 'Qatari Riyal', symbol: 'QAR', rate_to_aed: 1.0089, is_base: false },
  { id: 'CUR-KWD', code: 'KWD', name: 'Kuwaiti Dinar', symbol: 'KD', rate_to_aed: 11.98, is_base: false },
  { id: 'CUR-OMR', code: 'OMR', name: 'Omani Rial', symbol: 'OMR', rate_to_aed: 9.54, is_base: false },
  { id: 'CUR-BHD', code: 'BHD', name: 'Bahraini Dinar', symbol: 'BD', rate_to_aed: 9.74, is_base: false },
  { id: 'CUR-CAD', code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', rate_to_aed: 2.64, is_base: false },
  { id: 'CUR-AUD', code: 'AUD', name: 'Australian Dollar', symbol: 'A$', rate_to_aed: 2.41, is_base: false },
  { id: 'CUR-CHF', code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', rate_to_aed: 4.18, is_base: false },
  { id: 'CUR-CNY', code: 'CNY', name: 'Chinese Yuan', symbol: '¥', rate_to_aed: 0.508, is_base: false },
  { id: 'CUR-SGD', code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', rate_to_aed: 2.75, is_base: false },
];

const VAT_CODES = [
  { id: 'VAT-STD5', code: 'STD-5', name: 'UAE Standard Rated (5%)', rate_pct: 5.0, fta_box: 'Box 1a (Dubai)', description: 'Standard 5% VAT on UAE mortgage brokerage DSA commissions & advisory fees.' },
  { id: 'VAT-ZERO', code: 'ZERO-0', name: 'UAE Zero-Rated (0%)', rate_pct: 0.0, fta_box: 'Box 4', description: 'Exported services outside GCC qualifying for 0% VAT under FTA rules.' },
  { id: 'VAT-EXEMPT', code: 'EXEMPT', name: 'Exempt Financial Services', rate_pct: 0.0, fta_box: 'Box 5', description: 'Interest/profit margin financing exempt from VAT.' },
  { id: 'VAT-RC', code: 'REV-5', name: 'Reverse Charge Mechanism (5%)', rate_pct: 5.0, fta_box: 'Box 3 / 6', description: 'Imported software, cloud & overseas professional services.' },
  { id: 'VAT-OOS', code: 'OOS-0', name: 'Out of Scope (Pass-Through)', rate_pct: 0.0, fta_box: 'Non-VAT', description: 'Government DLD transfer fees, Trustee pass-throughs & statutory charges.' },
];

const PAYMENT_TERMS = [
  { id: 'PT-01', code: 'IMMEDIATE', name: 'Immediate / Same Day', due_days: 0, trigger_event: 'Invoice Date', description: 'Immediate settlement on invoice presentation.' },
  { id: 'PT-02', code: 'DISBURSAL', name: 'Upon Bank Disbursal', due_days: 3, trigger_event: 'Step 10 Disbursal', description: 'Payable within 3 business days of bank loan disbursal confirmation.' },
  { id: 'PT-03', code: 'NET7', name: 'Net 7 Days', due_days: 7, trigger_event: 'Invoice Date', description: 'Partner referral payout window after bank DSA receipt clears.' },
  { id: 'PT-04', code: 'NET15', name: 'Net 15 Days', due_days: 15, trigger_event: 'Invoice Date', description: 'Standard corporate advisory fee invoice settlement.' },
  { id: 'PT-05', code: 'NET30', name: 'Net 30 Days (Bank DSA)', due_days: 30, trigger_event: 'Bank Disbursal Month-End', description: 'Standard UAE bank DSA commission settlement cycle.' },
  { id: 'PT-06', code: 'DSA45', name: 'Bank DSA 45 Days', due_days: 45, trigger_event: 'Bank Disbursal Month-End', description: 'Extended institutional bank commission cycle.' },
  { id: 'PT-07', code: 'TRUSTEE', name: "DLD Trustee Manager's Cheque", due_days: 0, trigger_event: 'Transfer Appointment', description: 'Cleared bank manager cheque exchanged at Dubai Land Department Trustee.' },
];

const COA_SEED: Array<{ code: string; name: string; account_type: 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense'; sub_type: string; vat_code: string }> = [
  { code: '1000', name: 'Betterway Corporate Bank — Main Operating (AED)', account_type: 'Asset', sub_type: 'Cash & Bank', vat_code: 'OOS-0' },
  { code: '1010', name: 'Betterway Corporate Bank — Commission Clearing (AED)', account_type: 'Asset', sub_type: 'Cash & Bank', vat_code: 'OOS-0' },
  { code: '1020', name: 'Betterway Corporate Bank — VAT & Tax Reserve', account_type: 'Asset', sub_type: 'Cash & Bank', vat_code: 'OOS-0' },
  { code: '1030', name: 'Petty Cash — Oud Metha Office', account_type: 'Asset', sub_type: 'Cash & Bank', vat_code: 'OOS-0' },
  { code: '1100', name: 'Accounts Receivable — UAE Partner Banks (DSA)', account_type: 'Asset', sub_type: 'Receivables', vat_code: 'STD-5' },
  { code: '1110', name: 'Accounts Receivable — Client Advisory Fees', account_type: 'Asset', sub_type: 'Receivables', vat_code: 'STD-5' },
  { code: '1120', name: 'Accrued Bank DSA Commissions (Disbursed Unbilled)', account_type: 'Asset', sub_type: 'Receivables', vat_code: 'STD-5' },
  { code: '1200', name: 'Prepaid Office Rent — Al Nasr Plaza Oud Metha', account_type: 'Asset', sub_type: 'Prepayments', vat_code: 'STD-5' },
  { code: '1210', name: 'Prepaid DED / CBUAE License & Insurance', account_type: 'Asset', sub_type: 'Prepayments', vat_code: 'OOS-0' },
  { code: '1220', name: 'Refundable Security Deposits (DEWA / Landlord)', account_type: 'Asset', sub_type: 'Deposits', vat_code: 'OOS-0' },
  { code: '1300', name: 'Input VAT Recoverable (5%)', account_type: 'Asset', sub_type: 'Tax Asset', vat_code: 'STD-5' },
  { code: '1500', name: 'Office IT Hardware & Hikvision Biometric Systems', account_type: 'Asset', sub_type: 'Fixed Assets', vat_code: 'STD-5' },
  { code: '1510', name: 'Office Furniture & Oud Metha Fit-Out', account_type: 'Asset', sub_type: 'Fixed Assets', vat_code: 'STD-5' },
  { code: '1590', name: 'Accumulated Depreciation', account_type: 'Asset', sub_type: 'Fixed Assets', vat_code: 'OOS-0' },
  { code: '2000', name: 'Accounts Payable — Vendors & Portals', account_type: 'Liability', sub_type: 'Payables', vat_code: 'STD-5' },
  { code: '2010', name: 'RERA Broker Referral Commissions Payable', account_type: 'Liability', sub_type: 'Payables', vat_code: 'STD-5' },
  { code: '2020', name: 'Advisor Commission Incentives Payable', account_type: 'Liability', sub_type: 'Payroll Liability', vat_code: 'OOS-0' },
  { code: '2100', name: 'Output VAT Payable — UAE FTA (5%)', account_type: 'Liability', sub_type: 'Tax Liability', vat_code: 'STD-5' },
  { code: '2110', name: 'UAE Corporate Tax Provision (9% > AED 375k)', account_type: 'Liability', sub_type: 'Tax Liability', vat_code: 'OOS-0' },
  { code: '2200', name: 'MOHRE WPS Salaries Payable', account_type: 'Liability', sub_type: 'Payroll Liability', vat_code: 'OOS-0' },
  { code: '2210', name: 'End-of-Service Gratuity (EOSB) Provision', account_type: 'Liability', sub_type: 'Employee Benefits', vat_code: 'OOS-0' },
  { code: '2220', name: 'Accrued Annual Leave & Air Ticket Provision', account_type: 'Liability', sub_type: 'Employee Benefits', vat_code: 'OOS-0' },
  { code: '2300', name: 'Deferred Bank Clawback Reserve (6-Month Window)', account_type: 'Liability', sub_type: 'Provisions', vat_code: 'OOS-0' },
  { code: '2400', name: 'Client Valuation & Pass-Through Escrow Clearing', account_type: 'Liability', sub_type: 'Clearing', vat_code: 'OOS-0' },
  { code: '3000', name: 'Share Capital — Betterway Mortgages LLC', account_type: 'Equity', sub_type: 'Capital', vat_code: 'OOS-0' },
  { code: '3100', name: 'Retained Earnings', account_type: 'Equity', sub_type: 'Retained Earnings', vat_code: 'OOS-0' },
  { code: '3200', name: 'Statutory Legal Reserve (UAE Commercial Law)', account_type: 'Equity', sub_type: 'Reserves', vat_code: 'OOS-0' },
  { code: '3300', name: 'Owner Current Account', account_type: 'Equity', sub_type: 'Owner Equity', vat_code: 'OOS-0' },
  { code: '4000', name: 'Bank DSA Commission Income — Residential Ready', account_type: 'Revenue', sub_type: 'Core Brokerage', vat_code: 'STD-5' },
  { code: '4010', name: 'Bank DSA Commission Income — Off-Plan Handover SOA', account_type: 'Revenue', sub_type: 'Core Brokerage', vat_code: 'STD-5' },
  { code: '4020', name: 'Bank DSA Commission Income — Buy-Out & Equity Release', account_type: 'Revenue', sub_type: 'Core Brokerage', vat_code: 'STD-5' },
  { code: '4030', name: 'Bank DSA Commission Income — Non-Resident Desk', account_type: 'Revenue', sub_type: 'Core Brokerage', vat_code: 'STD-5' },
  { code: '4040', name: 'Commercial & SME Mortgage Advisory Income', account_type: 'Revenue', sub_type: 'Commercial', vat_code: 'STD-5' },
  { code: '4100', name: 'Cross-Sell Income — Life & Property Takaful Referrals', account_type: 'Revenue', sub_type: 'Ancillary', vat_code: 'STD-5' },
  { code: '4110', name: 'Cross-Sell Income — Golden Visa & UAE Wills Desk', account_type: 'Revenue', sub_type: 'Ancillary', vat_code: 'STD-5' },
  { code: '4200', name: 'Bank Volume Bonus & Tier Rebates', account_type: 'Revenue', sub_type: 'Incentives', vat_code: 'STD-5' },
  { code: '5000', name: 'RERA Broker Referral Payout Expense', account_type: 'Expense', sub_type: 'Direct Cost', vat_code: 'STD-5' },
  { code: '5010', name: 'Advisor Commission Payout Expense', account_type: 'Expense', sub_type: 'Direct Cost', vat_code: 'OOS-0' },
  { code: '5020', name: 'Bank Commission Clawback Adjustments', account_type: 'Expense', sub_type: 'Direct Cost', vat_code: 'STD-5' },
  { code: '5100', name: 'Staff Basic Salaries & Allowances (MOHRE WPS)', account_type: 'Expense', sub_type: 'Payroll', vat_code: 'OOS-0' },
  { code: '5110', name: 'Employee Visas, Emirates ID & Medical Insurance', account_type: 'Expense', sub_type: 'HR & People', vat_code: 'OOS-0' },
  { code: '5120', name: 'EOSB Gratuity & Leave Accrual Expense', account_type: 'Expense', sub_type: 'HR & People', vat_code: 'OOS-0' },
  { code: '5200', name: 'Office Rent — Al Nasr Plaza, Oud Metha', account_type: 'Expense', sub_type: 'Facilities', vat_code: 'STD-5' },
  { code: '5210', name: 'DEWA, Du/Etisalat Fiber Wi-Fi & Office Utilities', account_type: 'Expense', sub_type: 'Facilities', vat_code: 'STD-5' },
  { code: '5300', name: 'Digital Marketing — Google, Meta, Bayut & SEO', account_type: 'Expense', sub_type: 'Marketing', vat_code: 'STD-5' },
  { code: '5310', name: 'Events, Sponsorships & Client Hospitality', account_type: 'Expense', sub_type: 'Marketing', vat_code: 'STD-5' },
  { code: '5400', name: 'Cloud Infrastructure — Vercel, Supabase, AI & SaaS', account_type: 'Expense', sub_type: 'IT & Cloud', vat_code: 'REV-5' },
  { code: '5500', name: 'DED Trade License, CBUAE & Legal Compliance Fees', account_type: 'Expense', sub_type: 'Regulatory', vat_code: 'OOS-0' },
  { code: '5510', name: 'External Audit, FTA Tax & Professional Fees', account_type: 'Expense', sub_type: 'Professional', vat_code: 'STD-5' },
  { code: '5600', name: 'Bank Charges, WPS Processing & Exchange Variance', account_type: 'Expense', sub_type: 'Banking', vat_code: 'STD-5' },
];

const ROLES_SEED = [
  { id: 'ROL-OWNER', role_code: 'OWNER', label: 'Owner (Co-Equal: Warda Kapadia & Shabib Siraj)', description: '100% full OS authority, Warda Place / Shabib Corner, Privacy Fast Track, direct Master Log write, 1-of-2 & 2-of-2 approvals, Owner Consolidated VAT/P&L.', is_immutable: true, permissions: { all: true, executive: true, fastTrack: true, masterDirect: true, approvals: true } },
  { id: 'ROL-TM', role_code: 'TEAM_MANAGER', label: 'Team Manager (Advisory)', description: 'Views full standard team pipeline, assigns leads, monitors team tasks, zero Privacy Fast Track access.', is_immutable: false, permissions: { pipeline: 'team', vault: 'team', fastTrack: false, masterWrite: false } },
  { id: 'ROL-OPS', role_code: 'OPERATIONS_MANAGER', label: 'Operations Manager', description: 'Full standard pipeline progression, valuations, Developer NOC, DLD Trustee desk & Field GPS oversight.', is_immutable: false, permissions: { pipeline: 'team', mortgageDesk: true, fieldGps: 'team', fastTrack: false } },
  { id: 'ROL-HR', role_code: 'HR_MANAGER', label: 'HR Manager', description: 'Staff compliance, Visas/EID, Attendance console, Leave approvals & MOHRE WPS payroll exports.', is_immutable: false, permissions: { hr: true, attendance: true, fastTrack: false } },
  { id: 'ROL-ITM', role_code: 'IT_MARKETING', label: 'IT & Digital Marketing', description: 'Website & Social Media Studio, UTM campaign tracking, lead source analytics & system integrations.', is_immutable: false, permissions: { websiteStudio: true, analytics: true, fastTrack: false } },
  { id: 'ROL-ADV', role_code: 'ADVISOR', label: 'Mortgage Advisor', description: 'Strictly own assigned leads/cases/vaults, hard-masked phones with PDPL audit log, calculators & field GPS.', is_immutable: false, permissions: { pipeline: 'own', vault: 'own', maskedPhone: true, fastTrack: false } },
  { id: 'ROL-ADM', role_code: 'OFFICE_ADMIN', label: 'Office & System Administrator', description: 'Proposes Master Log reference changes (queued for Owner approval; blocked from RBAC/Geofence/Salaries), standard company Accounts & Reception QR.', is_immutable: false, permissions: { masterPropose: true, accountsStandard: true, fastTrack: false, securityMasterWrite: false } },
];

const DOC_TEMPLATES = [
  { id: 'TPL-01', code: 'BW-QUOTE', title: '24-Bank Mortgage Comparison Quote & Cash-to-Close', category: 'Mortgage Advisory', locale: 'en', requires_owner_seal: false, body_template: 'BETTERWAY MORTGAGES LLC — OFFICIAL BANK COMPARISON QUOTE\nClient: {{client_name}}\nProperty: {{property}} | Price: AED {{price}}\nRequested Loan: AED {{loan}} ({{ltv}}% LTV)\nShortlisted Bank: {{bank}} @ {{rate}}% Fixed\nCBUAE Disclosure: Planning estimate based on CBUAE rules; binding terms confirmed by lender.' },
  { id: 'TPL-02', code: 'BW-KFS', title: 'CBUAE Key Facts Statement (KFS) & Zero-Fee Brokerage Agreement', category: 'Compliance', locale: 'en', requires_owner_seal: true, body_template: 'KEY FACTS STATEMENT & ZERO-UPFRONT FEE AGREEMENT\nBetterway Mortgages LLC (Al Nasr Plaza, Oud Metha, Dubai, UAE)\nClient: {{client_name}}\nCBUAE Caps: Max 50% DBR | Early Settlement capped at 1% or AED 10,000 (+5% VAT).\nBroker remuneration is paid by the lending bank upon successful disbursal unless explicitly agreed in writing.' },
  { id: 'TPL-03', code: 'BW-SOA', title: 'Developer Statement of Account (SOA) & NOC Request Letter', category: 'Operations', locale: 'en', requires_owner_seal: true, body_template: 'TO: {{developer}} Customer Care / Escrow Department\nRE: Mortgage Handover SOA & e-NOC Request — {{property}} {{unit}}\nWe represent {{client_name}} for bank mortgage settlement with {{bank}}. Kindly issue updated SOA and NOC procedure.' },
  { id: 'TPL-04', code: 'BW-PARTNER', title: 'RERA Broker Referral & Corporate Commission Split Agreement', category: 'Partner Hub', locale: 'en', requires_owner_seal: true, body_template: 'REFERRAL COMMISSION AGREEMENT\nBetween Betterway Mortgages LLC and {{agency}} (ORN: {{orn}}, BRN: {{brn}}).\nStrict Compliance Clause: Commission is payable strictly to the verified corporate bank account of the ORN brokerage upon cleared bank DSA settlement.' },
  { id: 'TPL-05', code: 'BW-VIP-MANDATE', title: 'Executive Private Client Advisory Mandate', category: 'Executive Fast Track', locale: 'en', requires_owner_seal: true, body_template: 'CONFIDENTIAL PRIVATE CLIENT MANDATE\nPrepared by Executive Leadership — Betterway Mortgages LLC, Dubai.\nClient: {{client_name}} | Fast-Track Reference: {{job_code}}\nScope: Priority institutional bank structuring, valuation acceleration & confidential DLD closing coordination.' },
  { id: 'TPL-06', code: 'BW-AR-QUOTE', title: 'ملخص عرض التمويل العقاري — بيترواي للتمويل العقاري', category: 'Arabic Client Pack', locale: 'ar', requires_owner_seal: false, body_template: 'شركة بيترواي للتمويل العقاري ذ.م.م — دبي، عود ميثاء\nالعميل: {{client_name}}\nالعقار: {{property}} | قيمة التمويل: {{loan}} درهم\nوفق ضوابط مصرف الإمارات المركزي (الحد الأقصى للاستقطاع 50%).' },
];

async function main() {
  const db = await getSupabaseAdmin();
  const defaultPass = process.env.BW_DEFAULT_STAFF_PASSWORD || 'Betterway@2026';

  console.log('1. Seeding 9 official staff accounts (Warda & Shabib equal OWNER)...');
  for (const s of OFFICIAL_ROSTER) {
    const { data: existing } = await db.from('users').select('id').eq('id', s.id).maybeSingle();
    const row = {
      id: s.id,
      emp_code: s.empCode,
      slug: s.slug,
      name: s.name,
      name_ar: s.nameAr,
      email: s.email,
      phone: s.phone,
      ...(existing ? {} : { password_hash: hashPassword(defaultPass) }),
      role: s.role,
      tier: s.tier,
      designation: s.designation,
      department: s.department,
      avatar_url: s.avatarUrl,
      portrait_url: s.portraitUrl,
      initials: s.initials,
      bio: s.bio,
      specialties: s.specialties,
      monthly_target_aed: s.monthlyTargetAed,
      basic_salary_aed: s.basicSalaryAed,
      active: true,
    };
    const { error } = await db.from('users').upsert(row, { onConflict: 'id' });
    if (error) throw new Error(`users ${s.id}: ${error.message}`);
  }

  console.log('2. Seeding Al Nasr Plaza Oud Metha Office Branch, Departments, Roles...');
  await db.from('office_branches').upsert(
    {
      id: 'BR-OUDMETHA',
      code: 'DXB-OM-HQ',
      name: 'Betterway Mortgages HQ — Oud Metha',
      building: 'Al Nasr Plaza',
      plot_number: 'Plot 319-310',
      street: 'Oud Metha Road',
      district: 'Oud Metha',
      city: 'Dubai',
      country: 'United Arab Emirates',
      latitude: 25.2397,
      longitude: 55.3119,
      geofence_radius_m: 150,
      wifi_ssid: 'Betterway-OudMetha-5G',
      wifi_bssid: '',
      office_ip_cidr: '',
      wifi_lock_enabled: false,
      geofence_lock_enabled: false,
      hikvision_device_serial: 'DS-K1T342MFX-OUDMETHA',
      hikvision_local_ip: '192.168.1.64',
      hikvision_reader_mode: 'SINGLE_ENTRY_READER',
      shift_start_gst: '09:00',
      shift_end_gst: '19:00',
      grace_minutes: 15,
      status: 'Active',
    },
    { onConflict: 'id' },
  );

  await db.from('departments').upsert(DEPARTMENTS, { onConflict: 'id' });
  await db.from('roles_permissions').upsert(ROLES_SEED, { onConflict: 'id' });
  await db.from('developers').upsert(DEVELOPERS, { onConflict: 'id' });
  await db.from('currencies').upsert(CURRENCIES, { onConflict: 'id' });
  await db.from('vat_codes').upsert(VAT_CODES, { onConflict: 'id' });
  await db.from('payment_terms').upsert(PAYMENT_TERMS, { onConflict: 'id' });

  console.log('3. Seeding 50 IFRS/UAE Chart of Accounts & 60 UAE Communities...');
  await db.from('chart_of_accounts').upsert(
    COA_SEED.map((c) => ({ id: `COA-${c.code}`, ...c, is_system: true, status: 'Active' })),
    { onConflict: 'id' },
  );

  await db.from('communities').upsert(
    UAE_COMMUNITIES.map((c, idx) => ({
      id: `COM-${String(idx + 1).padStart(3, '0')}`,
      code: c.slug.toUpperCase().slice(0, 18),
      name: c.name,
      name_ar: c.nameAr,
      emirate: c.emirate === 'abu-dhabi' ? 'Abu Dhabi' : c.emirate === 'northern' ? 'Northern Emirates' : 'Dubai',
      area_zone: c.stock,
      rera_code: `RERA-${String(100 + idx)}`,
      description: `${c.name} (${c.stock}) — Key developers: ${c.devs}`,
      avg_sqft_aed: c.avgPsfAed,
      gross_yield_pct: c.grossYieldPct,
      mortgage_demand: c.mortgageDemand,
      stock_type: c.stock,
      major_developers: c.devs,
      image_url: c.image,
      status: 'Active',
    })),
    { onConflict: 'id' },
  );

  console.log('4. Seeding 24 Official UAE Partner Banks & Document Checklists...');
  await db.from('banks').upsert(
    UAE_BANKS.map((b) => ({
      id: b.id,
      bank_key: b.key,
      code: b.id,
      name: b.name,
      short_name: b.short,
      logo_url: b.logo,
      bank_type: b.type,
      fixed_3y_pct: b.indicativeFixed3Y,
      fixed_5y_pct: Number((b.indicativeFixed3Y + 0.2).toFixed(2)),
      variable_margin_pct: b.revertMarginOver3m,
      eibor_floor_pct: b.floorPct,
      max_ltv_resident_pct: b.maxLtvResident,
      max_ltv_nonres_pct: b.nonResidentSupported ? 60 : 0,
      supports_islamic: b.type !== 'Conventional',
      supports_low_doc: b.lowDocSupported,
      supports_non_resident: b.nonResidentSupported,
      dsa_commission_pct: b.dsaRatePct,
      sla_preapproval_days: b.slaDays,
      rm_name: `${b.short} Institutional Mortgage Desk`,
      rm_email: `mortgages@${b.key.replace(/-/g, '')}.ae`,
      apl_developers: ['Emaar', 'DAMAC', 'Sobha', 'Nakheel', 'Aldar'],
      status: 'Active',
    })),
    { onConflict: 'id' },
  );

  const checklistRows = CORE_DOCUMENT_CHECKLIST.flatMap((doc, idx) =>
    doc.profiles.map((prof) => ({
      id: `CHK-${prof.toUpperCase().slice(0, 4)}-${String(idx + 1).padStart(2, '0')}`,
      code: `DOC-${prof.toUpperCase().slice(0, 4)}-${String(idx + 1).padStart(2, '0')}`,
      borrower_profile: prof,
      document_name: doc.name,
      mandatory: doc.mandatory,
      recency_days: doc.recencyDays,
      stage_required: '04_COLLECT_PAPERS',
      description: `${doc.category} requirement — verify within ${doc.recencyDays} days.`,
      status: 'Active',
    })),
  );
  await db.from('document_checklists').upsert(checklistRows, { onConflict: 'id' });
  await db.from('document_templates').upsert(DOC_TEMPLATES, { onConflict: 'id' });

  console.log('5. Seeding Internal Partner Broker (SWK), Routing Rules, HR Compliance, Settings...');
  await db.from('rera_brokers').upsert(
    {
      id: 'BRK-SWK',
      code: 'PARTNER-SWK',
      broker_name: 'Muhammad Haseeb',
      agency_name: 'SWK Properties LLC',
      orn_number: 'ORN-SWK-INTERNAL',
      brn_number: 'BRN-SWK-01',
      phone: '+971500000000',
      email: 'desk@swkproperties.com',
      commission_split_pct: 30,
      corporate_bank_name: 'Wio Business UAE',
      corporate_iban: 'AE000000000000000000001',
      corporate_bank_verified: true,
      is_internal_sister_partner: true,
      status: 'Active',
    },
    { onConflict: 'id' },
  );

  await db.from('lead_routing_rules').upsert(
    [
      { id: 'RTE-01', code: 'VIP-5M', name: 'Jumbo > AED 5M → Executive & Team Manager', source_channel: 'ALL', emirate: 'ALL', min_loan_aed: 5_000_000, target_user_id: 'USR-03', priority: 1, active: true },
      { id: 'RTE-02', code: 'WEB-STD', name: 'Website Standard Leads → Asif Khan', source_channel: 'Website', emirate: 'Dubai', min_loan_aed: 0, target_user_id: 'USR-07', priority: 10, active: true },
      { id: 'RTE-03', code: 'CHAT-RES', name: 'WhatsApp / Chat / Bayut → Reshma', source_channel: 'WhatsApp', emirate: 'ALL', min_loan_aed: 0, target_user_id: 'USR-08', priority: 20, active: true },
    ],
    { onConflict: 'id' },
  );

  await db.from('hr_staff_compliance').upsert(
    OFFICIAL_ROSTER.map((s) => ({
      user_id: s.id,
      emirates_id_no: `784-1990-${s.empCode.replace(/\D/g, '').padStart(7, '0')}-1`,
      emirates_id_expiry: '2028-06-30',
      visa_expiry: '2028-06-30',
      passport_no: `P-${s.empCode}`,
      passport_expiry: '2030-12-31',
      mohre_labour_card: `MOL-${s.empCode}`,
      wps_routing_code: '026100101',
      wps_iban: `AE07026000${s.empCode.replace(/\D/g, '').padStart(13, '0')}`,
      join_date: '2024-01-15',
      basic_salary_aed: s.basicSalaryAed,
      allowances_aed: Math.round(s.basicSalaryAed * 0.25),
      annual_leave_balance: 30,
    })),
    { onConflict: 'user_id' },
  );

  await db.from('app_settings').upsert(
    [
      { key: 'company_trn', value: { trn: '100000000000003', legalName: 'Betterway Mortgages LLC', molEmployerId: '0000000000001' } },
      { key: 'corporate_ibans', value: { whitelisted: ['AE460260001015889900101', 'AE720330000019876543201'], bankName: 'Emirates NBD Corporate' } },
      { key: 'eibor_snapshot', value: { threeMonth: 4.20677, oneMonth: 4.1425, sixMonth: 4.68714, oneYear: 4.80361, asOfDate: '2026-11-06' } },
    ],
    { onConflict: 'key' },
  );

  console.log('6. Seeding Live Website CMS Tables (betterwaymortgages.com two-way sync)...');
  await db.from('website_offers').upsert(
    [
      {
        id: 'OFF-01',
        slug: 'first-home',
        tab_label: 'First-Home Desk',
        badge: 'Up to 80% / 85% CBUAE LTV',
        headline: 'Compare 24 UAE Banks Before Signing Form F',
        summary: 'Expat residents (up to 80% LTV) and UAE Nationals (up to 85% LTV) on first properties up to AED 5M — with full 4% DLD fee clarity and stressed 50% DBR verification upfront.',
        highlights: [
          'Conventional & Islamic (Ijara / Murabaha) options side by side',
          'Written post-fixed EIBOR revert margin & floor comparison',
          'Zero upfront advisory consultation fee from our Dubai desk',
        ],
        bank_key: 'emirates-nbd',
        rate_badge: 'From 3.89% Fixed',
        cta_href: '/get-started?goal=new-mortgage',
        cta_label: 'Review 24-Bank Eligibility',
        spotlight: true,
        published: true,
        sort_order: 1,
      },
      {
        id: 'OFF-02',
        slug: 'buyout',
        tab_label: 'Buyout & Refinance',
        badge: '1% / AED 10k Statutory Cap',
        headline: 'Audit Your Post-Fixed EIBOR Revert Rate',
        summary: 'Finished your introductory fixed term? Under CBUAE rules, early settlement exit fees are capped at 1% of remaining balance or AED 10,000 (+5% VAT), whichever is lower.',
        highlights: [
          'Full break-even month analysis against current CBUAE EIBOR',
          'Liability letter & mortgage-to-mortgage settlement coordination',
          'Equity release planning for UAE villas and apartments',
        ],
        bank_key: 'hsbc',
        rate_badge: 'From 3.84% Fixed',
        cta_href: '/calculators/buyout-refinance-savings',
        cta_label: 'Calculate Your Buyout Break-Even',
        spotlight: true,
        published: true,
        sort_order: 2,
      },
      {
        id: 'OFF-03',
        slug: 'golden-visa',
        tab_label: 'Non-Resident & Visa',
        badge: 'AED 2M+ Golden Visa Desk',
        headline: 'Overseas Buyers & 10-Year UAE Golden Visa Finance',
        summary: 'Dedicated international underwriting across 25 countries plus AED 2,000,000+ Title Deed & Oqood Golden Visa eligibility structuring with bank NOC coordination.',
        highlights: [
          'UK, India, USA, Canada, EU, GCC & Asia documentation desk',
          'Remote Power of Attorney & FX remittance milestone guidance',
          'Includes free 2026 UAE Mortgage & DLD PDF Buyer Pack',
        ],
        bank_key: 'mashreq',
        rate_badge: '48h Digital Pre-Approval',
        cta_href: '/mortgages/non-resident-dubai',
        cta_label: 'Explore Non-Resident Financing',
        spotlight: false,
        published: true,
        sort_order: 3,
      },
    ],
    { onConflict: 'id' },
  );

  await db.from('website_banners').upsert(
    {
      id: 'BNR-TOP',
      placement: 'top_bar',
      badge: 'LIVE 24-BANK DESK',
      message: 'Compare 24 UAE Conventional & Islamic Banks · Up to 80%/85% LTV & AED 10k Capped Buyout Audits — Live from our Oud Metha Advisory Desk.',
      cta_label: 'View Hot Offers',
      cta_href: '/hot-offers',
      active: true,
    },
    { onConflict: 'id' },
  );

  await db.from('website_bank_rates').upsert(
    UAE_BANKS.slice(0, 12).map((b, i) => ({
      id: `WBR-${String(i + 1).padStart(2, '0')}`,
      bank_key: b.key,
      bank_name: b.name,
      product_name: `${b.type} 3-Year Fixed`,
      rate_pct: b.indicativeFixed3Y,
      fixed_years: 3,
      revert_margin_pct: b.revertMarginOver3m,
      max_ltv_pct: b.maxLtvResident,
      islamic: b.type !== 'Conventional',
      featured: i < 6,
      published: true,
    })),
    { onConflict: 'id' },
  );

  await db.from('website_team_sync').upsert(
    OFFICIAL_ROSTER.filter((s) => s.role !== 'OFFICE_ADMIN').map((s, idx) => ({
      id: `WTM-${String(idx + 1).padStart(2, '0')}`,
      slug: s.slug,
      name: s.name,
      name_ar: s.nameAr,
      designation: s.designation,
      department: s.department,
      category: s.category,
      email: s.email,
      portrait_url: s.portraitUrl || s.avatarUrl || '',
      summary: s.bio,
      specialties: s.specialties,
      sort_order: idx + 1,
      published: true,
    })),
    { onConflict: 'id' },
  );

  console.log('7. Seeding 12 Betterway Underwriting Case Studies for AI Model...');
  for (const cs of SEED_CASE_STUDIES) {
    const { error } = await db.from('case_study_scenarios').upsert(
      {
        scenario_code: cs.scenarioCode,
        title: cs.title,
        category: cs.category,
        borrower_profile: cs.borrowerProfile,
        mortgage_type: cs.mortgageType,
        income_summary: cs.incomeSummary,
        property_summary: cs.propertySummary,
        challenge: cs.challenge,
        banks_considered: cs.banksConsidered,
        winning_bank: cs.winningBank,
        structuring_solution: cs.structuringSolution,
        cbuae_rules_applied: cs.cbuaeRulesApplied,
        outcome_lessons: cs.outcomeLessons,
        tags: cs.tags,
        source_ref: cs.sourceRef,
        verified: true,
        created_by: 'USR-01',
      },
      { onConflict: 'scenario_code' },
    );
    if (error) throw new Error(`case_study ${cs.scenarioCode}: ${error.message}`);
  }

  console.log('SEED_COMPLETE_SUCCESS: Clean Master Data & AI Case-Study Knowledge Base populated.');
}

main().catch((err) => {
  console.error('SEED_FAILED:', err);
  process.exit(1);
});
