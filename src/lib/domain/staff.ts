import type { SessionUser, UserRole } from './types';

export interface StaffProfileSeed {
  id: string;
  empCode: string;
  slug: string;
  name: string;
  nameAr: string;
  email: string;
  phone: string;
  role: UserRole;
  tier: 'Owner' | 'Management' | 'Specialist' | 'Administration';
  designation: string;
  department: string;
  category: 'Leadership' | 'Advisory' | 'Operations' | 'Growth & People' | 'Administration';
  avatarUrl: string | null;
  portraitUrl: string | null;
  initials: string;
  bio: string;
  specialties: string[];
  monthlyTargetAed: number;
  basicSalaryAed: number;
}

export const OFFICIAL_ROSTER: readonly StaffProfileSeed[] = [
  {
    id: 'USR-01',
    empCode: 'BW-001',
    slug: 'warda-kapadia',
    name: 'Warda Kapadia',
    nameAr: 'وردة كاباديا',
    email: 'warda@betterwaymortgages.com',
    phone: '+971501000001',
    role: 'OWNER',
    tier: 'Owner',
    designation: 'Founder & Managing Director',
    department: 'Management & Ownership',
    category: 'Leadership',
    avatarUrl: '/staff/warda-kapadia.jpg',
    portraitUrl: '/staff/warda-kapadia-portrait-1080.webp',
    initials: 'WK',
    bio: 'Founder & Managing Director of Betterway Mortgages LLC in Dubai, championing transparent, CBUAE-aligned borrower disclosures, multi-lender neutrality across 24 UAE banks, and disciplined one-on-one client advocacy.',
    specialties: ['Founder Vision & Strategy', 'CBUAE Governance & Standards', 'Institutional Bank Partnerships'],
    monthlyTargetAed: 25_000_000,
    basicSalaryAed: 0,
  },
  {
    id: 'USR-02',
    empCode: 'BW-002',
    slug: 'shabib-siraj',
    name: 'Shabib Siraj',
    nameAr: 'شبيب سراج',
    email: 'shabib@betterwaymortgages.com',
    phone: '+971551554680',
    role: 'OWNER',
    tier: 'Owner',
    designation: 'Executive Director',
    department: 'Management & Ownership',
    category: 'Leadership',
    avatarUrl: '/staff/shabib-siraj.jpg',
    portraitUrl: '/staff/shabib-siraj-portrait-1080.webp',
    initials: 'SS',
    bio: 'Brings 15+ years of in-house banking experience across world-class financial institutions alongside 8+ years as a Personal Investment Advisor handling High-Net-Worth Individuals (HNWI) in UAE Real Estate, structuring complex residential, commercial, and portfolio acquisitions.',
    specialties: ['15+ Years In-House Banking Experience', '8+ Years HNWI UAE Real Estate Advisory', 'Private Client & Portfolio Structuring'],
    monthlyTargetAed: 25_000_000,
    basicSalaryAed: 0,
  },
  {
    id: 'USR-03',
    empCode: 'BW-003',
    slug: 'daniel-xavier',
    name: 'Daniel Xavier',
    nameAr: 'دانيال خافيير',
    email: 'daniel@betterwaymortgages.com',
    phone: '+971501000003',
    role: 'TEAM_MANAGER',
    tier: 'Management',
    designation: 'Team Manager',
    department: 'Sales & Business Development',
    category: 'Advisory',
    avatarUrl: '/staff/daniel-xavier.jpg',
    portraitUrl: '/staff/daniel-xavier-portrait-1080.webp',
    initials: 'DX',
    bio: 'Leads the Dubai mortgage advisory desk, guiding UAE residents, investors, and business owners through lender policy comparison, stressed DBR planning, and structured pre-approval preparation.',
    specialties: ['Residential & Villa Structuring', 'Multi-Bank Offer Comparison', 'Self-Employed & Non-Resident Cases'],
    monthlyTargetAed: 18_000_000,
    basicSalaryAed: 18_000,
  },
  {
    id: 'USR-04',
    empCode: 'BW-004',
    slug: 'elton-frank',
    name: 'Elton Frank',
    nameAr: 'إلتون فرانك',
    email: 'elton@betterwaymortgages.com',
    phone: '+971501000004',
    role: 'OPERATIONS_MANAGER',
    tier: 'Management',
    designation: 'Operations Manager',
    department: 'Operations',
    category: 'Operations',
    avatarUrl: '/staff/elton-frank.jpg',
    portraitUrl: '/staff/elton-frank-portrait-1080.webp',
    initials: 'EF',
    bio: 'Oversees end-to-end mortgage operations across bank valuation panels, developer NOC portals, Final Offer Letter verification, and Dubai Land Department Trustee transfer milestones.',
    specialties: ['Operations & SLA Governance', 'Bank Valuation & FOL Coordination', 'DLD Trustee Transfer Execution'],
    monthlyTargetAed: 0,
    basicSalaryAed: 14_000,
  },
  {
    id: 'USR-05',
    empCode: 'BW-005',
    slug: 'rahaba-azeez',
    name: 'Rahaba Azeez',
    nameAr: 'رحبة عزيز',
    email: 'rahaba@betterwaymortgages.com',
    phone: '+971501000005',
    role: 'HR_MANAGER',
    tier: 'Specialist',
    designation: 'HR',
    department: 'HR',
    category: 'Growth & People',
    avatarUrl: '/staff/rahaba-azeez.jpg',
    portraitUrl: '/staff/rahaba-azeez-portrait-1080.webp',
    initials: 'RA',
    bio: 'Leads human resources, advisor onboarding, UAE MOHRE compliance, and team excellence standards across Betterway Mortgages LLC in Dubai.',
    specialties: ['People Operations & Onboarding', 'UAE MOHRE & WPS Governance', 'Team Standards & Training'],
    monthlyTargetAed: 0,
    basicSalaryAed: 12_000,
  },
  {
    id: 'USR-06',
    empCode: 'BW-006',
    slug: 'mohammad-nusrik',
    name: 'Nusrik',
    nameAr: 'نصريك',
    email: 'nusrik@betterwaymortgages.com',
    phone: '+971501000006',
    role: 'IT_MARKETING',
    tier: 'Specialist',
    designation: 'IT & Marketing',
    department: 'Digital Marketing',
    category: 'Growth & People',
    avatarUrl: '/staff/mohammad-nusrik.jpg',
    portraitUrl: '/staff/mohammad-nusrik-portrait-1080.webp',
    initials: 'MN',
    bio: "Leads Betterway's IT architecture, BetterHub & BetterCore digital ecosystem, multilingual web growth, and data-driven marketing connecting UAE property buyers to our advisors.",
    specialties: ['IT & Platform Engineering', 'Digital Growth & SEO/AEO', 'BetterHub & Campaign Architecture'],
    monthlyTargetAed: 0,
    basicSalaryAed: 12_000,
  },
  {
    id: 'USR-07',
    empCode: 'BW-007',
    slug: 'asif-khan',
    name: 'Asif Khan',
    nameAr: 'آصف خان',
    email: 'asif@betterwaymortgages.com',
    phone: '+971501000007',
    role: 'ADVISOR',
    tier: 'Specialist',
    designation: 'Advisor',
    department: 'Sales & Business Development',
    category: 'Advisory',
    avatarUrl: '/staff/asif-khan.jpg',
    portraitUrl: '/staff/asif-khan-portrait-1080.webp',
    initials: 'AK',
    bio: 'Advises homebuyers and existing UAE borrowers 1-on-1 on fixed-to-revert rate structures, buyout refinancing break-even analysis, and upfront Dubai Land Department closing budgets.',
    specialties: ['First-Home Resident Mortgages', 'Buyout & Refinance Modelling', 'Islamic & Conventional Comparison'],
    monthlyTargetAed: 14_000_000,
    basicSalaryAed: 12_000,
  },
  {
    id: 'USR-08',
    empCode: 'BW-008',
    slug: 'reshma-rajan',
    name: 'Reshma',
    nameAr: 'ريشما',
    email: 'reshma@betterwaymortgages.com',
    phone: '+971501000008',
    role: 'ADVISOR',
    tier: 'Specialist',
    designation: 'Advisor',
    department: 'Sales & Business Development',
    category: 'Advisory',
    avatarUrl: '/staff/reshma-rajan.jpg',
    portraitUrl: '/staff/reshma-rajan-portrait-1080.webp',
    initials: 'RR',
    bio: 'Guides prospective buyers 1-on-1 through initial eligibility discovery, CBUAE DBR checks, and tailored lender checklists so every client moves smoothly toward written approval.',
    specialties: ['Initial DBR & LTV Discovery', 'Document Readiness Checklists', '1-on-1 Buyer Education'],
    monthlyTargetAed: 12_000_000,
    basicSalaryAed: 10_000,
  },
  {
    id: 'USR-00',
    empCode: 'BW-000',
    slug: 'office-admin',
    name: 'Office Admin',
    nameAr: 'إدارة المكتب',
    email: 'admin@betterwaymortgages.com',
    phone: '+971501000000',
    role: 'OFFICE_ADMIN',
    tier: 'Administration',
    designation: 'Office & System Administrator',
    department: 'Operations',
    category: 'Administration',
    avatarUrl: null,
    portraitUrl: null,
    initials: 'OA',
    bio: 'Manages daily office coordination, reception QR attendance, standard accounting entries, and Master Log proposals subject to Owner approval.',
    specialties: ['Master Log Proposals', 'Office Operations', 'Standard Accounting & Reception'],
    monthlyTargetAed: 0,
    basicSalaryAed: 9_000,
  },
];

export function getExecutiveTitlesForUser(email: string, role: UserRole): {
  executiveAppTitle: string | null;
  privacyLaneTitle: string | null;
} {
  if (role !== 'OWNER') return { executiveAppTitle: null, privacyLaneTitle: null };
  const clean = email.toLowerCase();
  if (clean.includes('warda')) {
    return {
      executiveAppTitle: "Warda's Place",
      privacyLaneTitle: "Warda's Client — Privacy Fast Track",
    };
  }
  return {
    executiveAppTitle: "Shabib's Corner",
    privacyLaneTitle: "Shabib's Client — Privacy Fast Track",
  };
}

export function toSessionUser(row: {
  id: string;
  emp_code: string;
  slug: string;
  name: string;
  name_ar: string;
  email: string;
  phone: string;
  role: UserRole;
  tier: string;
  designation: string;
  department: string;
  avatar_url: string | null;
  portrait_url: string | null;
  initials: string;
}): SessionUser {
  const { executiveAppTitle, privacyLaneTitle } = getExecutiveTitlesForUser(row.email, row.role);
  return {
    id: row.id,
    empCode: row.emp_code,
    slug: row.slug,
    name: row.name,
    nameAr: row.name_ar,
    email: row.email,
    phone: row.phone,
    role: row.role,
    tier: row.tier,
    designation: row.designation,
    department: row.department,
    avatarUrl: row.avatar_url,
    portraitUrl: row.portrait_url,
    initials: row.initials,
    isOwner: row.role === 'OWNER',
    executiveAppTitle,
    privacyLaneTitle,
  };
}
