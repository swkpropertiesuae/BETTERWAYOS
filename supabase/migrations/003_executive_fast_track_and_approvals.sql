-- Migration 003: Owner-Only Privacy Fast Track (Warda's Place / Shabib's Corner) & 1-of-2 / 2-of-2 Approvals

-- Strictly OWNER-only tables (zero visibility for Admin, Managers, Advisors, HR, IT)
CREATE TABLE IF NOT EXISTS public.privacy_fast_track_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_code TEXT UNIQUE NOT NULL,
  created_by_owner_id TEXT NOT NULL REFERENCES public.users(id),
  private_to_owner_id TEXT REFERENCES public.users(id), -- NULL = shared between Warda & Shabib; set = single-owner secrecy
  client_name TEXT NOT NULL,
  client_phone TEXT NOT NULL DEFAULT '',
  client_email TEXT NOT NULL DEFAULT '',
  property_summary TEXT NOT NULL DEFAULT '',
  community_freeform TEXT NOT NULL DEFAULT '',
  developer_freeform TEXT NOT NULL DEFAULT '',
  property_price_aed NUMERIC(16,2) NOT NULL DEFAULT 0,
  loan_amount_aed NUMERIC(16,2) NOT NULL DEFAULT 0,
  expected_fee_aed NUMERIC(14,2) NOT NULL DEFAULT 0,
  urgency TEXT NOT NULL DEFAULT 'IMMEDIATE_CASH' CHECK (urgency IN ('IMMEDIATE_CASH','VIP_PRIVATE','CONFIDENTIAL')),
  stage_code TEXT NOT NULL DEFAULT '01_ENQUIRY',
  target_cash_date DATE,
  cash_status TEXT NOT NULL DEFAULT 'ARRANGING' CHECK (cash_status IN ('ARRANGING','INVOICED','COLLECTED')),
  notes TEXT NOT NULL DEFAULT '',
  promoted_case_id UUID REFERENCES public.mortgage_cases(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Owner-Only Segregated Fast-Track Invoices (Option A: strictly excluded from non-Owner Accounts GL)
CREATE TABLE IF NOT EXISTS public.privacy_fast_track_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_no TEXT UNIQUE NOT NULL,
  job_id UUID NOT NULL REFERENCES public.privacy_fast_track_jobs(id) ON DELETE CASCADE,
  created_by_owner_id TEXT NOT NULL REFERENCES public.users(id),
  private_to_owner_id TEXT REFERENCES public.users(id),
  bill_to_name TEXT NOT NULL,
  description TEXT NOT NULL,
  subtotal_aed NUMERIC(14,2) NOT NULL,
  vat_rate_pct NUMERIC(5,2) NOT NULL DEFAULT 5.00,
  vat_amount_aed NUMERIC(14,2) NOT NULL,
  total_aed NUMERIC(14,2) NOT NULL,
  corporate_iban TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Issued' CHECK (status IN ('Draft','Issued','Paid','Void')),
  due_date DATE,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.privacy_fast_track_docs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.privacy_fast_track_jobs(id) ON DELETE CASCADE,
  created_by_owner_id TEXT NOT NULL REFERENCES public.users(id),
  private_to_owner_id TEXT REFERENCES public.users(id),
  doc_title TEXT NOT NULL,
  doc_type TEXT NOT NULL DEFAULT 'Executive Mandate',
  body_html TEXT NOT NULL DEFAULT '',
  storage_path TEXT NOT NULL DEFAULT '',
  sealed_by TEXT REFERENCES public.users(id),
  sealed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unified 1-of-2 & 2-of-2 Owner Approval Engine
CREATE TABLE IF NOT EXISTS public.owner_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  approval_kind TEXT NOT NULL CHECK (approval_kind IN (
    'MASTER_CHANGE','CORPORATE_SEAL','HR_LEAVE','WEBSITE_PUBLISH','DELETE_PURGE','PAYOUT_RELEASE'
  )),
  approval_mode TEXT NOT NULL CHECK (approval_mode IN ('1_OF_2','2_OF_2')),
  reference_table TEXT NOT NULL,
  reference_id TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL DEFAULT '',
  amount_aed NUMERIC(16,2) NOT NULL DEFAULT 0,
  requested_by TEXT NOT NULL REFERENCES public.users(id),
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','OWNER_1_APPROVED','APPROVED','REJECTED')),
  approver_1_id TEXT REFERENCES public.users(id),
  approver_1_at TIMESTAMPTZ,
  approver_1_note TEXT DEFAULT '',
  approver_2_id TEXT REFERENCES public.users(id),
  approver_2_at TIMESTAMPTZ,
  approver_2_note TEXT DEFAULT '',
  rejected_by TEXT REFERENCES public.users(id),
  rejected_at TIMESTAMPTZ,
  rejection_note TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_distinct_owners CHECK (approver_2_id IS NULL OR approver_1_id IS NULL OR approver_2_id <> approver_1_id)
);

CREATE TABLE IF NOT EXISTS public.delete_bin_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_table TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  record_label TEXT NOT NULL,
  snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  reason TEXT NOT NULL,
  requested_by TEXT NOT NULL REFERENCES public.users(id),
  approval_id UUID REFERENCES public.owner_approvals(id),
  status TEXT NOT NULL DEFAULT 'PENDING_DUAL_APPROVAL' CHECK (status IN ('PENDING_DUAL_APPROVAL','RESTORED','PURGED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.word_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doc_code TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  template_category TEXT NOT NULL DEFAULT 'Mortgage Quote',
  case_id UUID REFERENCES public.mortgage_cases(id) ON DELETE SET NULL,
  locale TEXT NOT NULL DEFAULT 'en',
  body_text TEXT NOT NULL,
  created_by TEXT NOT NULL REFERENCES public.users(id),
  seal_status TEXT NOT NULL DEFAULT 'Pending Seal' CHECK (seal_status IN ('Draft','Pending Seal','Sealed','Rejected')),
  sealed_by TEXT REFERENCES public.users(id),
  sealed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
