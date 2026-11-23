export interface BetterwayStaffProfile {
  email: string;
  phone: string;
  fullNameEn: string;
  fullNameAr: string;
  role:
    | 'SUPER_ADMIN'
    | 'SALES_ADVISOR'
    | 'CREDIT_UNDERWRITER'
    | 'PROGRESSION_MANAGER'
    | 'COMPLIANCE_MLRO'
    | 'FINANCE_ADMIN'
    | 'HR_MANAGER';
  tier: 'executive' | 'management' | 'specialist';
  isMlro: 0 | 1;
  canApproveRates: 0 | 1;
  empCode: string;
  department: string;
  designation: string;
  isNational: 0 | 1;
  basicSalaryFils: number;
  avatarUrl: string | null;
  portraitUrl: string | null;
  portrait8kUrl: string | null;
}

export const OFFICIAL_STAFF_DIRECTORY: readonly BetterwayStaffProfile[] = [
  {
    email: 'shabib@betterwaymortgages.com',
    phone: '+971501000001',
    fullNameEn: 'Shabib Siraj',
    fullNameAr: 'شبيب سراج',
    role: 'SUPER_ADMIN',
    tier: 'executive',
    isMlro: 1,
    canApproveRates: 1,
    empCode: 'EMP-SHABIB',
    department: 'Executive Leadership',
    designation: 'Founder & Managing Director',
    isNational: 0,
    basicSalaryFils: 0,
    avatarUrl: null,
    portraitUrl: null,
    portrait8kUrl: null,
  },
  {
    email: 'warda@betterwaymortgages.com',
    phone: '+971501000002',
    fullNameEn: 'Warda',
    fullNameAr: 'وردة',
    role: 'SUPER_ADMIN',
    tier: 'executive',
    isMlro: 1,
    canApproveRates: 1,
    empCode: 'EMP-WARDA',
    department: 'Executive Leadership',
    designation: 'Executive Director',
    isNational: 0,
    basicSalaryFils: 0,
    avatarUrl: null,
    portraitUrl: null,
    portrait8kUrl: null,
  },
  {
    email: 'admin@betterwaymortgages.com',
    phone: '+971501000000',
    fullNameEn: 'Betterway Admin',
    fullNameAr: 'مسؤول النظام',
    role: 'SUPER_ADMIN',
    tier: 'executive',
    isMlro: 1,
    canApproveRates: 1,
    empCode: 'EMP-ADMIN',
    department: 'System Administration',
    designation: 'System Administrator',
    isNational: 0,
    basicSalaryFils: 0,
    avatarUrl: null,
    portraitUrl: null,
    portrait8kUrl: null,
  },
  {
    email: 'daniel@betterwaymortgages.com',
    phone: '+971501000003',
    fullNameEn: 'Daniel Xavier',
    fullNameAr: 'دانيال خافيير',
    role: 'SUPER_ADMIN',
    tier: 'management',
    isMlro: 0,
    canApproveRates: 1,
    empCode: 'EMP-DANIEL',
    department: 'Leadership & Mortgage Advisory',
    designation: 'Team Manager & Mortgage Advisor',
    isNational: 0,
    basicSalaryFils: 1_800_000,
    avatarUrl: '/staff/daniel-xavier.jpg',
    portraitUrl: '/staff/daniel-xavier-portrait.webp',
    portrait8kUrl: '/staff/8k/daniel-xavier-8k.webp',
  },
  {
    email: 'rahaba@betterwaymortgages.com',
    phone: '+971501000004',
    fullNameEn: 'Rahaba Azeez',
    fullNameAr: 'رحبة عزيز',
    role: 'HR_MANAGER',
    tier: 'specialist',
    isMlro: 0,
    canApproveRates: 0,
    empCode: 'EMP-RAHABA',
    department: 'Human Resources & MOHRE WPS',
    designation: 'HR',
    isNational: 0,
    basicSalaryFils: 1_200_000,
    avatarUrl: '/staff/rahaba-azeez.jpg',
    portraitUrl: '/staff/rahaba-azeez-portrait.webp',
    portrait8kUrl: '/staff/8k/rahaba-azeez-8k.webp',
  },
  {
    email: 'nusrik@betterwaymortgages.com',
    phone: '+971501000005',
    fullNameEn: 'Mohammad Nusrik',
    fullNameAr: 'محمد نصريك',
    role: 'SALES_ADVISOR',
    tier: 'specialist',
    isMlro: 0,
    canApproveRates: 0,
    empCode: 'EMP-NUSRIK',
    department: 'Digital Marketing & Lead Attribution',
    designation: 'Digital Marketing',
    isNational: 0,
    basicSalaryFils: 1_100_000,
    avatarUrl: '/staff/mohammad-nusrik.jpg',
    portraitUrl: '/staff/mohammad-nusrik-portrait.webp',
    portrait8kUrl: '/staff/8k/mohammad-nusrik-8k.webp',
  },
  {
    email: 'elton@betterwaymortgages.com',
    phone: '+971501000006',
    fullNameEn: 'Elton Frank',
    fullNameAr: 'إلتون فرانك',
    role: 'PROGRESSION_MANAGER',
    tier: 'specialist',
    isMlro: 0,
    canApproveRates: 0,
    empCode: 'EMP-ELTON',
    department: 'Operations & Conveyancing Coordination',
    designation: 'Coordinator',
    isNational: 0,
    basicSalaryFils: 1_100_000,
    avatarUrl: '/staff/elton-frank.jpg',
    portraitUrl: '/staff/elton-frank-portrait.webp',
    portrait8kUrl: '/staff/8k/elton-frank-8k.webp',
  },
  {
    email: 'reshma@betterwaymortgages.com',
    phone: '+971501000007',
    fullNameEn: 'Reshma Rajan',
    fullNameAr: 'ريشما راجان',
    role: 'SALES_ADVISOR',
    tier: 'specialist',
    isMlro: 0,
    canApproveRates: 0,
    empCode: 'EMP-RESHMA',
    department: 'Telesales & Mortgage Advisory',
    designation: 'Telesales cum Mortgage Advisor',
    isNational: 0,
    basicSalaryFils: 1_000_000,
    avatarUrl: '/staff/reshma-rajan.jpg',
    portraitUrl: '/staff/reshma-rajan-portrait.webp',
    portrait8kUrl: '/staff/8k/reshma-rajan-8k.webp',
  },
  {
    email: 'asif@betterwaymortgages.com',
    phone: '+971501000008',
    fullNameEn: 'Asif Khan',
    fullNameAr: 'آصف خان',
    role: 'SALES_ADVISOR',
    tier: 'specialist',
    isMlro: 0,
    canApproveRates: 0,
    empCode: 'EMP-ASIF',
    department: 'Mortgage Advisory',
    designation: 'Mortgage Advisor',
    isNational: 0,
    basicSalaryFils: 1_200_000,
    avatarUrl: '/staff/asif-khan.jpg',
    portraitUrl: '/staff/asif-khan-portrait.webp',
    portrait8kUrl: '/staff/8k/asif-khan-8k.webp',
  },
] as const;

export function getStaffProfileByNameOrEmail(
  nameOrEmail: string | null | undefined,
): BetterwayStaffProfile | null {
  if (!nameOrEmail) return null;
  const q = String(nameOrEmail).trim().toLowerCase();
  if (!q) return null;

  for (const p of OFFICIAL_STAFF_DIRECTORY) {
    if (p.email.toLowerCase() === q || p.fullNameEn.toLowerCase() === q) {
      return p;
    }
  }

  for (const p of OFFICIAL_STAFF_DIRECTORY) {
    const parts = p.fullNameEn.toLowerCase().split(/\s+/);
    if (parts.some((part) => part.length >= 4 && q.includes(part))) {
      return p;
    }
  }

  return null;
}

export function getStaffAvatarUrl(nameOrEmail: string | null | undefined): string | null {
  return getStaffProfileByNameOrEmail(nameOrEmail)?.avatarUrl ?? null;
}

export function getStaffInitials(name: string | null | undefined): string {
  const clean = String(name || 'BW').trim();
  if (!clean) return 'BW';
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ''}${parts[parts.length - 1]![0] ?? ''}`.toUpperCase();
}
