// Official 9 Betterway Mortgages LLC Staff Roster & SWK-Parity Governance Hierarchy

export type StaffRole =
  | 'OWNER'
  | 'EXECUTIVE_DIRECTOR'
  | 'ADMIN'
  | 'TEAM_MANAGER'
  | 'MORTGAGE_ADVISOR'
  | 'TELESALES_ADVISOR'
  | 'COORDINATOR'
  | 'DIGITAL_MARKETING'
  | 'HR_MANAGER';

export interface StaffMember {
  id: string;
  empCode: string;
  slug: string;
  name: string;
  nameAr: string;
  email: string;
  phone: string;
  role: StaffRole;
  tier: 'Owner' | 'Executive Leadership' | 'Management' | 'Specialist';
  designation: string;
  department: string;
  avatar: string | null;
  portrait: string | null;
  initials: string;
  isElevated: boolean; // Owner / Executive Director / Admin / Team Manager
  canApproveDeletions: boolean;
  canApprovePayouts: boolean;
  canLockOfficeWifi: boolean;
  canPrintReceptionQr: boolean;
  canApproveRates: boolean;
  specialties: string[];
  monthlyTargetAed: number;
}

export const BETTERWAY_STAFF: StaffMember[] = [
  {
    id: 'USR-01', empCode: 'BW-001', slug: 'shabib-siraj',
    name: 'Shabib Siraj', nameAr: 'شبيب سراج',
    email: 'shabib@betterwaymortgages.com', phone: '+971551554680',
    role: 'OWNER', tier: 'Owner',
    designation: 'Founder & Managing Director', department: 'Executive Leadership & Governance',
    avatar: null, portrait: null, initials: 'SS',
    isElevated: true, canApproveDeletions: true, canApprovePayouts: true,
    canLockOfficeWifi: true, canPrintReceptionQr: true, canApproveRates: true,
    specialties: ['Institutional Lender Partnerships', 'CBUAE Governance', 'HNW & SWK Dual-Relay Strategy'],
    monthlyTargetAed: 25_000_000,
  },
  {
    id: 'USR-02', empCode: 'BW-002', slug: 'warda',
    name: 'Warda', nameAr: 'وردة',
    email: 'warda@betterwaymortgages.com', phone: '+971501000002',
    role: 'EXECUTIVE_DIRECTOR', tier: 'Executive Leadership',
    designation: 'Executive Director', department: 'Executive Leadership',
    avatar: null, portrait: null, initials: 'WA',
    isElevated: true, canApproveDeletions: true, canApprovePayouts: true,
    canLockOfficeWifi: true, canPrintReceptionQr: true, canApproveRates: true,
    specialties: ['Executive Governance', 'Client Quality Standards', 'Operational Controls'],
    monthlyTargetAed: 15_000_000,
  },
  {
    id: 'USR-03', empCode: 'BW-000', slug: 'betterway-admin',
    name: 'Betterway Admin', nameAr: 'مسؤول النظام',
    email: 'admin@betterwaymortgages.com', phone: '+971501000000',
    role: 'ADMIN', tier: 'Executive Leadership',
    designation: 'System & Security Administrator', department: 'IT, Security & Compliance',
    avatar: null, portrait: null, initials: 'BA',
    isElevated: true, canApproveDeletions: false, canApprovePayouts: false,
    canLockOfficeWifi: true, canPrintReceptionQr: true, canApproveRates: true,
    specialties: ['Office Wi-Fi Lock', 'RBAC & Audit Governance', 'Website/OS Interconnect'],
    monthlyTargetAed: 0,
  },
  {
    id: 'USR-04', empCode: 'BW-003', slug: 'daniel-xavier',
    name: 'Daniel Xavier', nameAr: 'دانيال خافيير',
    email: 'daniel@betterwaymortgages.com', phone: '+971501000003',
    role: 'TEAM_MANAGER', tier: 'Management',
    designation: 'Team Manager & Mortgage Advisor', department: 'Leadership & Mortgage Advisory',
    avatar: '/staff/daniel-xavier.jpg', portrait: '/staff/daniel-xavier-portrait-1080.webp', initials: 'DX',
    isElevated: true, canApproveDeletions: false, canApprovePayouts: false,
    canLockOfficeWifi: false, canPrintReceptionQr: true, canApproveRates: true,
    specialties: ['Residential & Villa Structuring', 'Multi-Bank Offer Comparison', 'Self-Employed & Non-Resident'],
    monthlyTargetAed: 18_000_000,
  },
  {
    id: 'USR-05', empCode: 'BW-004', slug: 'asif-khan',
    name: 'Asif Khan', nameAr: 'آصف خان',
    email: 'asif@betterwaymortgages.com', phone: '+971501000007',
    role: 'MORTGAGE_ADVISOR', tier: 'Specialist',
    designation: 'Mortgage Advisor', department: 'Mortgage Advisory',
    avatar: '/staff/asif-khan.jpg', portrait: '/staff/asif-khan-portrait-1080.webp', initials: 'AK',
    isElevated: false, canApproveDeletions: false, canApprovePayouts: false,
    canLockOfficeWifi: false, canPrintReceptionQr: false, canApproveRates: false,
    specialties: ['First-Home Resident Mortgages', 'Buyout & Refinance Modelling', 'Islamic & Conventional'],
    monthlyTargetAed: 14_000_000,
  },
  {
    id: 'USR-06', empCode: 'BW-005', slug: 'reshma-rajan',
    name: 'Reshma Rajan', nameAr: 'ريشما راجان',
    email: 'reshma@betterwaymortgages.com', phone: '+971501000008',
    role: 'TELESALES_ADVISOR', tier: 'Specialist',
    designation: 'Telesales cum Mortgage Advisor', department: 'Telesales & Mortgage Advisory',
    avatar: '/staff/reshma-rajan.jpg', portrait: '/staff/reshma-rajan-portrait-1080.webp', initials: 'RR',
    isElevated: false, canApproveDeletions: false, canApprovePayouts: false,
    canLockOfficeWifi: false, canPrintReceptionQr: false, canApproveRates: false,
    specialties: ['Initial DBR & LTV Discovery', 'Document Readiness Checklists', 'Consultation Scheduling'],
    monthlyTargetAed: 10_000_000,
  },
  {
    id: 'USR-07', empCode: 'BW-006', slug: 'elton-frank',
    name: 'Elton Frank', nameAr: 'إلتون فرانك',
    email: 'elton@betterwaymortgages.com', phone: '+971501000006',
    role: 'COORDINATOR', tier: 'Specialist',
    designation: 'Coordinator', department: 'Operations & Conveyancing Coordination',
    avatar: '/staff/elton-frank.jpg', portrait: '/staff/elton-frank-portrait-1080.webp', initials: 'EF',
    isElevated: false, canApproveDeletions: false, canApprovePayouts: false,
    canLockOfficeWifi: false, canPrintReceptionQr: false, canApproveRates: false,
    specialties: ['Bank Valuation & FOL Tracking', 'Developer NOC Coordination', 'DLD Trustee Transfer Packs'],
    monthlyTargetAed: 0,
  },
  {
    id: 'USR-08', empCode: 'BW-007', slug: 'mohammad-nusrik',
    name: 'Mohammad Nusrik', nameAr: 'محمد نصريك',
    email: 'nusrik@betterwaymortgages.com', phone: '+971501000005',
    role: 'DIGITAL_MARKETING', tier: 'Specialist',
    designation: 'Digital Marketing', department: 'Digital Marketing & Lead Attribution',
    avatar: '/staff/mohammad-nusrik.jpg', portrait: '/staff/mohammad-nusrik-portrait-1080.webp', initials: 'MN',
    isElevated: false, canApproveDeletions: false, canApprovePayouts: false,
    canLockOfficeWifi: false, canPrintReceptionQr: false, canApproveRates: false,
    specialties: ['Digital Acquisition & SEO/AEO', 'RERA Partner Attribution', 'Brand & Campaign Architecture'],
    monthlyTargetAed: 0,
  },
  {
    id: 'USR-09', empCode: 'BW-008', slug: 'rahaba-azeez',
    name: 'Rahaba Azeez', nameAr: 'رحبة عزيز',
    email: 'rahaba@betterwaymortgages.com', phone: '+971501000004',
    role: 'HR_MANAGER', tier: 'Specialist',
    designation: 'HR Manager', department: 'Human Resources & MOHRE WPS',
    avatar: '/staff/rahaba-azeez.jpg', portrait: '/staff/rahaba-azeez-portrait-1080.webp', initials: 'RA',
    isElevated: false, canApproveDeletions: false, canApprovePayouts: false,
    canLockOfficeWifi: false, canPrintReceptionQr: false, canApproveRates: false,
    specialties: ['People Operations & Onboarding', 'UAE MOHRE & WPS Governance', 'Team Standards & Training'],
    monthlyTargetAed: 0,
  },
];

export const staffByEmail = (email: string) =>
  BETTERWAY_STAFF.find((s) => s.email.toLowerCase() === email.toLowerCase());
export const staffById = (id: string) => BETTERWAY_STAFF.find((s) => s.id === id);
