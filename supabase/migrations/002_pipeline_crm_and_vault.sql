-- Migration 002: 100% Daily Enquiry CRM, 12-Step Mortgage Pipeline, Per-Client Vault, Tasks & Desk

CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_code TEXT UNIQUE NOT NULL,
  received_date_dubai DATE NOT NULL DEFAULT ((NOW() AT TIME ZONE 'Asia/Dubai')::date),
  contact_name TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  contact_email TEXT NOT NULL DEFAULT '',
  residency TEXT NOT NULL DEFAULT 'Expat resident',
  borrower_profile TEXT NOT NULL DEFAULT 'salaried' CHECK (borrower_profile IN ('salaried','self_employed_full','self_employed_low_doc','non_resident')),
  goal TEXT NOT NULL DEFAULT 'Resale Purchase (Secondary)',
  property_price_aed NUMERIC(16,2) NOT NULL DEFAULT 2500000,
  down_payment_pct NUMERIC(5,2) NOT NULL DEFAULT 20,
  monthly_income_aed NUMERIC(14,2) NOT NULL DEFAULT 45000,
  community TEXT NOT NULL DEFAULT '',
  source_channel TEXT NOT NULL DEFAULT 'Website',
  source_page TEXT NOT NULL DEFAULT '/contact',
  campaign_utm TEXT NOT NULL DEFAULT '',
  referrer_name TEXT NOT NULL DEFAULT '',
  partner_agency TEXT NOT NULL DEFAULT '',
  partner_brn TEXT NOT NULL DEFAULT '',
  is_swk_relay BOOLEAN NOT NULL DEFAULT FALSE,
  pdpl_consent BOOLEAN NOT NULL DEFAULT TRUE,
  status TEXT NOT NULL DEFAULT 'New' CHECK (status IN ('New','Contacted','Qualified','Converted','Lost')),
  lost_reason TEXT NOT NULL DEFAULT '',
  assigned_to TEXT REFERENCES public.users(id),
  first_response_at TIMESTAMPTZ,
  sla_due_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '5 minutes'),
  notes TEXT NOT NULL DEFAULT '',
  deleted_soft BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leads_dubai_date ON public.leads(received_date_dubai DESC);
CREATE INDEX IF NOT EXISTS idx_leads_assigned ON public.leads(assigned_to);

CREATE TABLE IF NOT EXISTS public.mortgage_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_code TEXT UNIQUE NOT NULL,
  lead_id UUID REFERENCES public.leads(id),
  contact_id TEXT REFERENCES public.contacts(id),
  borrower_name TEXT NOT NULL,
  borrower_phone TEXT NOT NULL,
  borrower_email TEXT NOT NULL DEFAULT '',
  nationality TEXT NOT NULL DEFAULT 'UAE Resident',
  residency_status TEXT NOT NULL DEFAULT 'expat_resident',
  borrower_profile TEXT NOT NULL DEFAULT 'salaried',
  mortgage_type TEXT NOT NULL DEFAULT 'Resale Purchase (Secondary)',
  stage_code TEXT NOT NULL DEFAULT '01_ENQUIRY' CHECK (stage_code IN (
    '01_ENQUIRY','02_ELIGIBILITY','03_PICK_BANKS','04_COLLECT_PAPERS',
    '05_SUBMIT','06_PRE_APPROVAL','07_VALUATION','08_FOL',
    '09_DEVELOPER_NOC','10_DISBURSAL','11_COMMISSION','12_CLIENT_CARE'
  )),
  emirate TEXT NOT NULL DEFAULT 'Dubai',
  community TEXT NOT NULL DEFAULT '',
  project_name TEXT NOT NULL DEFAULT '',
  unit_door TEXT NOT NULL DEFAULT '',
  developer TEXT NOT NULL DEFAULT '',
  property_price_aed NUMERIC(16,2) NOT NULL DEFAULT 0,
  requested_loan_aed NUMERIC(16,2) NOT NULL DEFAULT 0,
  valuation_aed NUMERIC(16,2) NOT NULL DEFAULT 0,
  monthly_income_aed NUMERIC(14,2) NOT NULL DEFAULT 0,
  existing_emis_aed NUMERIC(14,2) NOT NULL DEFAULT 0,
  card_limits_aed NUMERIC(14,2) NOT NULL DEFAULT 0,
  borrower_age INTEGER NOT NULL DEFAULT 35,
  ltv_pct NUMERIC(5,2) NOT NULL DEFAULT 80,
  dbr_pct NUMERIC(5,2) NOT NULL DEFAULT 0,
  primary_bank_key TEXT NOT NULL DEFAULT 'emirates-nbd',
  indicative_rate_pct NUMERIC(5,3) NOT NULL DEFAULT 3.99,
  dsa_rate_pct NUMERIC(5,3) NOT NULL DEFAULT 0.85,
  partner_agency TEXT NOT NULL DEFAULT '',
  referrer_name TEXT NOT NULL DEFAULT '',
  is_swk_relay BOOLEAN NOT NULL DEFAULT FALSE,
  advisor_id TEXT REFERENCES public.users(id),
  operations_id TEXT REFERENCES public.users(id),
  form_f_expiry DATE,
  pre_approval_expiry DATE,
  fol_signing_date DATE,
  noc_status TEXT NOT NULL DEFAULT 'Pending',
  transfer_date DATE,
  fixed_expiry_date DATE,
  portal_token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  next_action TEXT NOT NULL DEFAULT 'Complete eligibility & CBUAE DBR check',
  stage_evidence_log JSONB NOT NULL DEFAULT '[]'::jsonb,
  sla_due_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
  deleted_soft BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cases_stage ON public.mortgage_cases(stage_code);
CREATE INDEX IF NOT EXISTS idx_cases_advisor ON public.mortgage_cases(advisor_id);

CREATE TABLE IF NOT EXISTS public.bank_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.mortgage_cases(id) ON DELETE CASCADE,
  bank_key TEXT NOT NULL,
  bank_name TEXT NOT NULL,
  lender_ref TEXT NOT NULL DEFAULT '',
  product_type TEXT NOT NULL DEFAULT '3Y Fixed',
  rate_pct NUMERIC(5,3) NOT NULL DEFAULT 3.99,
  loan_amount_aed NUMERIC(16,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Submitted' CHECK (status IN ('Shortlisted','Submitted','Underwriting','Pre-Approved','FOL Issued','Declined','Withdrawn')),
  conditions TEXT NOT NULL DEFAULT '',
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.case_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.mortgage_cases(id) ON DELETE CASCADE,
  doc_category TEXT NOT NULL,
  doc_name TEXT NOT NULL,
  mandatory BOOLEAN NOT NULL DEFAULT TRUE,
  recency_days INTEGER NOT NULL DEFAULT 30,
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending','Uploaded','Verified','Rejected','Expired')),
  storage_path TEXT NOT NULL DEFAULT '',
  file_name TEXT NOT NULL DEFAULT '',
  mime_type TEXT NOT NULL DEFAULT '',
  size_bytes BIGINT NOT NULL DEFAULT 0,
  document_date DATE,
  expiry_date DATE,
  uploaded_by TEXT,
  verified_by TEXT REFERENCES public.users(id),
  verified_at TIMESTAMPTZ,
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_case_docs_case ON public.case_documents(case_id);

CREATE TABLE IF NOT EXISTS public.case_valuations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.mortgage_cases(id) ON DELETE CASCADE,
  bank_key TEXT NOT NULL,
  valuation_company TEXT NOT NULL DEFAULT '',
  access_contact TEXT NOT NULL DEFAULT '',
  booked_date TIMESTAMPTZ,
  fee_aed NUMERIC(10,2) NOT NULL DEFAULT 3150,
  fee_paid BOOLEAN NOT NULL DEFAULT FALSE,
  report_value_aed NUMERIC(16,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Requested' CHECK (status IN ('Requested','Booked','Inspected','Report Received','Disputed')),
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  priority TEXT NOT NULL DEFAULT 'Normal' CHECK (priority IN ('Critical','High','Normal','Low')),
  status TEXT NOT NULL DEFAULT 'Todo' CHECK (status IN ('Todo','In Progress','Done')),
  due_date DATE NOT NULL DEFAULT ((NOW() AT TIME ZONE 'Asia/Dubai')::date),
  assigned_to TEXT NOT NULL REFERENCES public.users(id),
  created_by TEXT NOT NULL REFERENCES public.users(id),
  case_id UUID REFERENCES public.mortgage_cases(id) ON DELETE SET NULL,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  event_type TEXT NOT NULL DEFAULT 'Bank Follow-up' CHECK (event_type IN ('Valuation','Form F Deadline','Pre-Approval Expiry','FOL Signing','DLD Trustee','Bank Follow-up','Client Meeting')),
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  location TEXT NOT NULL DEFAULT '',
  assigned_to TEXT NOT NULL REFERENCES public.users(id),
  case_id UUID REFERENCES public.mortgage_cases(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'Scheduled' CHECK (status IN ('Scheduled','Completed','Cancelled')),
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.vault_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name TEXT NOT NULL,
  raw_phone TEXT NOT NULL,
  community TEXT NOT NULL DEFAULT '',
  project_name TEXT NOT NULL DEFAULT '',
  property_price_aed NUMERIC(16,2) NOT NULL DEFAULT 0,
  source_label TEXT NOT NULL DEFAULT 'Owner Bulk Upload',
  assigned_to TEXT REFERENCES public.users(id),
  progress_status TEXT NOT NULL DEFAULT 'Unassigned',
  call_count INTEGER NOT NULL DEFAULT 0,
  last_contacted_at TIMESTAMPTZ,
  notes TEXT NOT NULL DEFAULT '',
  created_by TEXT REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.call_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES public.users(id),
  entity_type TEXT NOT NULL DEFAULT 'lead',
  entity_id TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  masked_phone TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'Call' CHECK (channel IN ('Call','WhatsApp','Email','Unmask')),
  outcome TEXT NOT NULL DEFAULT 'Connected',
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.client_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES public.mortgage_cases(id) ON DELETE SET NULL,
  recipient_name TEXT NOT NULL,
  recipient_masked TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'WhatsApp',
  template_name TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL,
  sent_by TEXT NOT NULL REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
