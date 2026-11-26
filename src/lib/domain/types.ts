export type UserRole =
  | 'OWNER'
  | 'TEAM_MANAGER'
  | 'OPERATIONS_MANAGER'
  | 'HR_MANAGER'
  | 'IT_MARKETING'
  | 'ADVISOR'
  | 'OFFICE_ADMIN';

export interface SessionUser {
  id: string;
  empCode: string;
  slug: string;
  name: string;
  nameAr: string;
  email: string;
  phone: string;
  role: UserRole;
  tier: string;
  designation: string;
  department: string;
  avatarUrl: string | null;
  portraitUrl: string | null;
  initials: string;
  isOwner: boolean;
  executiveAppTitle: string | null;
  privacyLaneTitle: string | null;
}

export type StageCode =
  | '01_ENQUIRY'
  | '02_ELIGIBILITY'
  | '03_PICK_BANKS'
  | '04_COLLECT_PAPERS'
  | '05_SUBMIT'
  | '06_PRE_APPROVAL'
  | '07_VALUATION'
  | '08_FOL'
  | '09_DEVELOPER_NOC'
  | '10_DISBURSAL'
  | '11_COMMISSION'
  | '12_CLIENT_CARE';

export type ApprovalKind =
  | 'MASTER_CHANGE'
  | 'CORPORATE_SEAL'
  | 'HR_LEAVE'
  | 'WEBSITE_PUBLISH'
  | 'DELETE_PURGE'
  | 'PAYOUT_RELEASE';

export type ApprovalMode = '1_OF_2' | '2_OF_2';

export type MasterCategory =
  | 'Core Masters'
  | 'Finance & Compliance'
  | 'People & Access'
  | 'Real Estate & Mortgage Ops'
  | 'Platform & Automation';

export type MasterWritePolicy =
  | 'ADMIN_APPROVAL_REQUIRED'
  | 'OWNER_ONLY'
  | 'OWNER_ONLY_SALARY_ROLE'
  | 'OPERATIONAL_FREE_CREATE';

export type MasterRegistryKey =
  | 'communities'
  | 'developers'
  | 'office_branches'
  | 'departments'
  | 'currencies'
  | 'vat_codes'
  | 'chart_of_accounts'
  | 'payment_terms'
  | 'employees'
  | 'rera_brokers'
  | 'roles_permissions'
  | 'banks'
  | 'master_properties'
  | 'property_units'
  | 'contacts'
  | 'document_checklists'
  | 'offplan_payment_plans'
  | 'lead_routing_rules'
  | 'custom_fields'
  | 'document_templates'
  | 'master_vault_index'
  | 'case_study_scenarios';

export interface HikvisionEventPayload {
  employeeNoString: string;
  eventTime: string;
  deviceSerial: string;
  readerDirection?: 'ENTRY' | 'EXIT';
  verifyMode?: string;
}

export interface CmsPayload {
  generatedAt: string;
  source: string;
  offers: Array<{
    id: string;
    slug: string;
    tabLabel: string;
    badge: string;
    headline: string;
    summary: string;
    highlights: string[];
    bankKey: string;
    rateBadge: string;
    ctaHref: string;
    ctaLabel: string;
    spotlight: boolean;
  }>;
  banners: Array<{
    id: string;
    placement: string;
    badge: string;
    message: string;
    ctaLabel: string;
    ctaHref: string;
  }>;
  bankRates: Array<{
    bankKey: string;
    bankName: string;
    productName: string;
    ratePct: number;
    fixedYears: number;
    revertMarginPct: number;
    maxLtvPct: number;
    islamic: boolean;
    featured: boolean;
    verifiedAt: string;
  }>;
  team: Array<{
    slug: string;
    name: string;
    nameAr: string;
    designation: string;
    department: string;
    category: string;
    email: string;
    portraitUrl: string;
    summary: string;
    specialties: string[];
  }>;
}
