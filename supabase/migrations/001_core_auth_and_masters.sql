-- Migration 001: Core Authentication, RBAC, 22 CORE Master Log Registries & Admin Approval Gate
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Staff & Users (9 accounts: 2 equal Owners + 6 Specialists + Office Admin)
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  emp_code TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  name_ar TEXT NOT NULL DEFAULT '',
  email TEXT UNIQUE NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN (
    'OWNER','TEAM_MANAGER','OPERATIONS_MANAGER','HR_MANAGER','IT_MARKETING','ADVISOR','OFFICE_ADMIN'
  )),
  tier TEXT NOT NULL DEFAULT 'Specialist',
  designation TEXT NOT NULL,
  department TEXT NOT NULL,
  avatar_url TEXT,
  portrait_url TEXT,
  initials TEXT NOT NULL,
  bio TEXT NOT NULL DEFAULT '',
  specialties JSONB NOT NULL DEFAULT '[]'::jsonb,
  monthly_target_aed NUMERIC(16,2) NOT NULL DEFAULT 0,
  basic_salary_aed NUMERIC(14,2) NOT NULL DEFAULT 0,
  totp_secret TEXT,
  totp_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  token_hash TEXT UNIQUE NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- CORE MASTERS (1-4)
CREATE TABLE IF NOT EXISTS public.communities (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  name_ar TEXT NOT NULL DEFAULT '',
  emirate TEXT NOT NULL DEFAULT 'Dubai',
  area_zone TEXT NOT NULL DEFAULT '',
  rera_code TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  avg_sqft_aed NUMERIC(12,2) NOT NULL DEFAULT 0,
  gross_yield_pct NUMERIC(5,2) NOT NULL DEFAULT 0,
  mortgage_demand TEXT NOT NULL DEFAULT 'High',
  stock_type TEXT NOT NULL DEFAULT 'Apartments & Villas',
  major_developers TEXT NOT NULL DEFAULT '',
  image_url TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.developers (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  emirate TEXT NOT NULL DEFAULT 'Dubai',
  rera_dev_no TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  apl_tier TEXT NOT NULL DEFAULT 'Tier 1 — All 24 Banks',
  noc_portal TEXT NOT NULL DEFAULT '',
  escrow_banks TEXT NOT NULL DEFAULT '',
  website TEXT NOT NULL DEFAULT '',
  logo_url TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.office_branches (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  building TEXT NOT NULL,
  plot_number TEXT NOT NULL DEFAULT '',
  street TEXT NOT NULL DEFAULT '',
  district TEXT NOT NULL DEFAULT 'Oud Metha',
  city TEXT NOT NULL DEFAULT 'Dubai',
  country TEXT NOT NULL DEFAULT 'United Arab Emirates',
  latitude DOUBLE PRECISION NOT NULL DEFAULT 25.2397,
  longitude DOUBLE PRECISION NOT NULL DEFAULT 55.3119,
  geofence_radius_m INTEGER NOT NULL DEFAULT 150,
  wifi_ssid TEXT NOT NULL DEFAULT 'Betterway-OudMetha-5G',
  wifi_bssid TEXT NOT NULL DEFAULT '',
  office_ip_cidr TEXT NOT NULL DEFAULT '',
  wifi_lock_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  geofence_lock_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  hikvision_device_serial TEXT NOT NULL DEFAULT '',
  hikvision_local_ip TEXT NOT NULL DEFAULT '',
  hikvision_reader_mode TEXT NOT NULL DEFAULT 'SINGLE_ENTRY_READER' CHECK (hikvision_reader_mode IN ('SINGLE_ENTRY_READER','DUAL_READER')),
  shift_start_gst TEXT NOT NULL DEFAULT '09:00',
  shift_end_gst TEXT NOT NULL DEFAULT '19:00',
  grace_minutes INTEGER NOT NULL DEFAULT 15,
  status TEXT NOT NULL DEFAULT 'Active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.departments (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  head_user_id TEXT REFERENCES public.users(id),
  category TEXT NOT NULL DEFAULT 'Operations',
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- FINANCE & COMPLIANCE MASTERS (5-8)
CREATE TABLE IF NOT EXISTS public.currencies (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  symbol TEXT NOT NULL DEFAULT '',
  rate_to_aed NUMERIC(14,6) NOT NULL DEFAULT 1,
  is_base BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'Active',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.vat_codes (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  rate_pct NUMERIC(5,2) NOT NULL DEFAULT 5.00,
  fta_box TEXT NOT NULL DEFAULT 'Box 1a',
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Active',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.chart_of_accounts (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  account_type TEXT NOT NULL CHECK (account_type IN ('Asset','Liability','Equity','Revenue','Expense')),
  sub_type TEXT NOT NULL DEFAULT '',
  vat_code TEXT DEFAULT 'STD-5',
  is_system BOOLEAN NOT NULL DEFAULT TRUE,
  status TEXT NOT NULL DEFAULT 'Active',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.payment_terms (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  due_days INTEGER NOT NULL DEFAULT 0,
  trigger_event TEXT NOT NULL DEFAULT 'Invoice Date',
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Active',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- PEOPLE & ACCESS MASTERS (9-11: employees maps to public.users)
CREATE TABLE IF NOT EXISTS public.rera_brokers (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  broker_name TEXT NOT NULL,
  agency_name TEXT NOT NULL,
  orn_number TEXT NOT NULL DEFAULT '',
  brn_number TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  commission_split_pct NUMERIC(5,2) NOT NULL DEFAULT 25.00,
  corporate_bank_name TEXT NOT NULL DEFAULT '',
  corporate_iban TEXT NOT NULL DEFAULT '',
  corporate_bank_verified BOOLEAN NOT NULL DEFAULT FALSE,
  bank_letter_vault_id TEXT DEFAULT '',
  trade_license_vault_id TEXT DEFAULT '',
  is_internal_sister_partner BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'Active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.roles_permissions (
  id TEXT PRIMARY KEY,
  role_code TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  is_immutable BOOLEAN NOT NULL DEFAULT FALSE,
  permissions JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- REAL ESTATE & MORTGAGE OPERATIONS MASTERS (12-17)
CREATE TABLE IF NOT EXISTS public.banks (
  id TEXT PRIMARY KEY,
  bank_key TEXT UNIQUE NOT NULL,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  short_name TEXT NOT NULL,
  logo_url TEXT NOT NULL DEFAULT '',
  bank_type TEXT NOT NULL DEFAULT 'Conventional',
  fixed_3y_pct NUMERIC(5,3) NOT NULL DEFAULT 3.99,
  fixed_5y_pct NUMERIC(5,3) NOT NULL DEFAULT 4.19,
  variable_margin_pct NUMERIC(5,3) NOT NULL DEFAULT 1.49,
  eibor_floor_pct NUMERIC(5,3) NOT NULL DEFAULT 3.50,
  max_ltv_resident_pct NUMERIC(5,2) NOT NULL DEFAULT 80,
  max_ltv_nonres_pct NUMERIC(5,2) NOT NULL DEFAULT 60,
  supports_islamic BOOLEAN NOT NULL DEFAULT FALSE,
  supports_low_doc BOOLEAN NOT NULL DEFAULT FALSE,
  supports_non_resident BOOLEAN NOT NULL DEFAULT FALSE,
  dsa_commission_pct NUMERIC(5,3) NOT NULL DEFAULT 0.85,
  sla_preapproval_days INTEGER NOT NULL DEFAULT 5,
  rm_name TEXT NOT NULL DEFAULT '',
  rm_email TEXT NOT NULL DEFAULT '',
  apl_developers JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'Active',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.master_properties (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  community_id TEXT REFERENCES public.communities(id),
  developer_id TEXT REFERENCES public.developers(id),
  emirate TEXT NOT NULL DEFAULT 'Dubai',
  plot_dm_number TEXT NOT NULL DEFAULT '',
  property_class TEXT NOT NULL DEFAULT 'Residential Tower',
  completion_status TEXT NOT NULL DEFAULT 'Ready',
  bank_apl_approved BOOLEAN NOT NULL DEFAULT TRUE,
  status TEXT NOT NULL DEFAULT 'Active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.property_units (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  property_id TEXT REFERENCES public.master_properties(id),
  unit_number TEXT NOT NULL,
  floor_no TEXT NOT NULL DEFAULT '',
  bedrooms TEXT NOT NULL DEFAULT '2BR',
  area_sqft NUMERIC(12,2) NOT NULL DEFAULT 0,
  title_deed_no TEXT NOT NULL DEFAULT '',
  oqood_no TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.contacts (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  party_type TEXT NOT NULL DEFAULT 'Borrower',
  phone TEXT NOT NULL,
  email TEXT NOT NULL DEFAULT '',
  nationality TEXT NOT NULL DEFAULT '',
  residency_status TEXT NOT NULL DEFAULT 'expat_resident',
  emirates_id_masked TEXT NOT NULL DEFAULT '',
  passport_masked TEXT NOT NULL DEFAULT '',
  pdpl_consent BOOLEAN NOT NULL DEFAULT TRUE,
  assigned_advisor_id TEXT REFERENCES public.users(id),
  status TEXT NOT NULL DEFAULT 'Active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.document_checklists (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  borrower_profile TEXT NOT NULL,
  document_name TEXT NOT NULL,
  mandatory BOOLEAN NOT NULL DEFAULT TRUE,
  recency_days INTEGER NOT NULL DEFAULT 30,
  stage_required TEXT NOT NULL DEFAULT '04_COLLECT_PAPERS',
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Active',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.offplan_payment_plans (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  developer_id TEXT REFERENCES public.developers(id),
  booking_pct NUMERIC(5,2) NOT NULL DEFAULT 10,
  construction_pct NUMERIC(5,2) NOT NULL DEFAULT 50,
  handover_pct NUMERIC(5,2) NOT NULL DEFAULT 40,
  post_handover_months INTEGER NOT NULL DEFAULT 0,
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Active',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- PLATFORM & AUTOMATION MASTERS (18-22)
CREATE TABLE IF NOT EXISTS public.lead_routing_rules (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  source_channel TEXT NOT NULL DEFAULT 'ALL',
  emirate TEXT NOT NULL DEFAULT 'ALL',
  min_loan_aed NUMERIC(16,2) NOT NULL DEFAULT 0,
  target_user_id TEXT REFERENCES public.users(id),
  priority INTEGER NOT NULL DEFAULT 10,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.custom_fields (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  target_entity TEXT NOT NULL,
  field_label TEXT NOT NULL,
  field_type TEXT NOT NULL DEFAULT 'text',
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  required BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'Active',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.document_templates (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Mortgage Advisory',
  locale TEXT NOT NULL DEFAULT 'en',
  requires_owner_seal BOOLEAN NOT NULL DEFAULT TRUE,
  body_template TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Active',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.master_vault_index (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  file_name TEXT NOT NULL,
  bucket TEXT NOT NULL DEFAULT 'client-vault',
  storage_path TEXT NOT NULL,
  mime_type TEXT NOT NULL DEFAULT 'application/pdf',
  size_bytes BIGINT NOT NULL DEFAULT 0,
  entity_type TEXT NOT NULL DEFAULT 'case',
  entity_id TEXT NOT NULL DEFAULT '',
  uploaded_by TEXT REFERENCES public.users(id),
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Admin-to-Owner Master Log Approval Gate
CREATE TABLE IF NOT EXISTS public.master_change_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registry_key TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('CREATE','UPDATE','ARCHIVE')),
  record_id TEXT,
  before_payload JSONB,
  after_payload JSONB NOT NULL,
  reason TEXT NOT NULL DEFAULT '',
  requested_by TEXT NOT NULL REFERENCES public.users(id),
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','APPROVED','REJECTED')),
  decided_by TEXT REFERENCES public.users(id),
  decision_note TEXT DEFAULT '',
  decided_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
