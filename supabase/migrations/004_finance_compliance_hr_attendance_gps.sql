-- Migration 004: Accounts/Finance, Compliance/AML/PDPL, Attendance (Hikvision + QR), Team Group Chat, Field GPS & HR

CREATE TABLE IF NOT EXISTS public.journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_no TEXT UNIQUE NOT NULL,
  entry_date DATE NOT NULL DEFAULT ((NOW() AT TIME ZONE 'Asia/Dubai')::date),
  description TEXT NOT NULL,
  debit_account_code TEXT NOT NULL,
  credit_account_code TEXT NOT NULL,
  amount_aed NUMERIC(16,2) NOT NULL,
  vat_code TEXT NOT NULL DEFAULT 'STD-5',
  vat_amount_aed NUMERIC(14,2) NOT NULL DEFAULT 0,
  case_id UUID REFERENCES public.mortgage_cases(id) ON DELETE SET NULL,
  corporate_account_ref TEXT NOT NULL DEFAULT '',
  created_by TEXT NOT NULL REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_no TEXT UNIQUE NOT NULL,
  invoice_type TEXT NOT NULL DEFAULT 'BANK_DSA' CHECK (invoice_type IN ('BANK_DSA','ADVISORY_FEE','PARTNER_BILL')),
  case_id UUID REFERENCES public.mortgage_cases(id) ON DELETE SET NULL,
  counterparty_name TEXT NOT NULL,
  counterparty_trn TEXT NOT NULL DEFAULT '',
  subtotal_aed NUMERIC(16,2) NOT NULL,
  vat_rate_pct NUMERIC(5,2) NOT NULL DEFAULT 5.00,
  vat_amount_aed NUMERIC(14,2) NOT NULL,
  total_aed NUMERIC(16,2) NOT NULL,
  receiving_corporate_iban TEXT NOT NULL,
  payment_term TEXT NOT NULL DEFAULT 'Net 30',
  status TEXT NOT NULL DEFAULT 'Issued' CHECK (status IN ('Draft','Issued','Paid','Overdue','Cancelled')),
  due_date DATE,
  paid_at TIMESTAMPTZ,
  created_by TEXT NOT NULL REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.payout_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payout_code TEXT UNIQUE NOT NULL,
  broker_id TEXT REFERENCES public.rera_brokers(id),
  case_id UUID REFERENCES public.mortgage_cases(id) ON DELETE SET NULL,
  payee_name TEXT NOT NULL,
  payee_account_type TEXT NOT NULL DEFAULT 'CORPORATE',
  destination_iban TEXT NOT NULL,
  bank_name TEXT NOT NULL DEFAULT '',
  amount_aed NUMERIC(16,2) NOT NULL,
  vat_aed NUMERIC(14,2) NOT NULL DEFAULT 0,
  orn_verified BOOLEAN NOT NULL DEFAULT FALSE,
  bank_letter_verified BOOLEAN NOT NULL DEFAULT FALSE,
  approval_id UUID REFERENCES public.owner_approvals(id),
  status TEXT NOT NULL DEFAULT 'PENDING_DUAL_APPROVAL' CHECK (status IN ('PENDING_DUAL_APPROVAL','OWNER_1_APPROVED','READY_TO_PAY','PAID','REJECTED')),
  requested_by TEXT NOT NULL REFERENCES public.users(id),
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_date DATE NOT NULL DEFAULT ((NOW() AT TIME ZONE 'Asia/Dubai')::date),
  vendor_name TEXT NOT NULL,
  account_code TEXT NOT NULL DEFAULT '5200',
  description TEXT NOT NULL,
  amount_aed NUMERIC(14,2) NOT NULL,
  vat_aed NUMERIC(14,2) NOT NULL DEFAULT 0,
  payment_channel TEXT NOT NULL DEFAULT 'Betterway Corporate Bank Account',
  created_by TEXT NOT NULL REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.compliance_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES public.mortgage_cases(id) ON DELETE CASCADE,
  check_type TEXT NOT NULL CHECK (check_type IN ('KFS_SIGN','SANCTIONS_SCREEN','PDPL_CONSENT','GOAML_STR')),
  subject_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending','Cleared','Flagged','Reported')),
  match_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  evidence_note TEXT NOT NULL DEFAULT '',
  reviewed_by TEXT REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.sanctions_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_source TEXT NOT NULL DEFAULT 'UAE EOCN / UN',
  full_name TEXT NOT NULL,
  nationality TEXT NOT NULL DEFAULT '',
  id_reference TEXT NOT NULL DEFAULT '',
  imported_by TEXT REFERENCES public.users(id),
  imported_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id TEXT NOT NULL,
  actor_name TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  entity_table TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  action TEXT NOT NULL,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Attendance: Hikvision Door Fingerprint + 20s Rotating QR + Oud Metha Geofence
CREATE TABLE IF NOT EXISTS public.attendance_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES public.users(id),
  emp_code TEXT NOT NULL,
  attendance_date_dubai DATE NOT NULL DEFAULT ((NOW() AT TIME ZONE 'Asia/Dubai')::date),
  source TEXT NOT NULL CHECK (source IN ('HIKVISION_DOOR','OFFICE_QR','MANUAL')),
  event_kind TEXT NOT NULL CHECK (event_kind IN ('CHECK_IN','DOOR_REENTRY','CHECK_OUT')),
  dubai_time_str TEXT NOT NULL,
  late_minutes INTEGER NOT NULL DEFAULT 0,
  device_serial TEXT NOT NULL DEFAULT '',
  client_ip TEXT NOT NULL DEFAULT '',
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  distance_m INTEGER,
  note TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_attendance_date_user ON public.attendance_events(attendance_date_dubai DESC, user_id);

CREATE TABLE IF NOT EXISTS public.daily_close_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES public.users(id),
  report_date_dubai DATE NOT NULL DEFAULT ((NOW() AT TIME ZONE 'Asia/Dubai')::date),
  calls_made INTEGER NOT NULL DEFAULT 0,
  enquiries_logged INTEGER NOT NULL DEFAULT 0,
  cases_progressed INTEGER NOT NULL DEFAULT 0,
  summary_today TEXT NOT NULL,
  plan_tomorrow TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, report_date_dubai)
);

CREATE TABLE IF NOT EXISTS public.hr_staff_compliance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  emirates_id_no TEXT NOT NULL DEFAULT '',
  emirates_id_expiry DATE,
  visa_expiry DATE,
  passport_no TEXT NOT NULL DEFAULT '',
  passport_expiry DATE,
  mohre_labour_card TEXT NOT NULL DEFAULT '',
  wps_routing_code TEXT NOT NULL DEFAULT '',
  wps_iban TEXT NOT NULL DEFAULT '',
  join_date DATE NOT NULL DEFAULT '2024-01-01',
  basic_salary_aed NUMERIC(14,2) NOT NULL DEFAULT 0,
  allowances_aed NUMERIC(14,2) NOT NULL DEFAULT 0,
  annual_leave_balance INTEGER NOT NULL DEFAULT 30,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.hr_leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES public.users(id),
  leave_type TEXT NOT NULL DEFAULT 'Annual Leave',
  from_date DATE NOT NULL,
  to_date DATE NOT NULL,
  days INTEGER NOT NULL DEFAULT 1,
  reason TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending','Approved','Rejected')),
  decided_by TEXT REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Team Group Chat (#attendance-checkin receives automatic check-in cards!)
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel TEXT NOT NULL DEFAULT 'general',
  sender_id TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  sender_role TEXT NOT NULL,
  sender_avatar TEXT DEFAULT '',
  message_kind TEXT NOT NULL DEFAULT 'TEXT' CHECK (message_kind IN ('TEXT','CHECKIN_CARD','ALERT','SOS')),
  body TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_channel_time ON public.chat_messages(channel, created_at DESC);

-- Field GPS Services
CREATE TABLE IF NOT EXISTS public.field_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES public.users(id),
  user_name TEXT NOT NULL,
  purpose TEXT NOT NULL,
  destination_label TEXT NOT NULL DEFAULT '',
  case_id UUID REFERENCES public.mortgage_cases(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','COMPLETED','SOS')),
  start_lat DOUBLE PRECISION NOT NULL,
  start_lng DOUBLE PRECISION NOT NULL,
  last_lat DOUBLE PRECISION NOT NULL,
  last_lng DOUBLE PRECISION NOT NULL,
  accuracy_m INTEGER NOT NULL DEFAULT 15,
  waypoints JSONB NOT NULL DEFAULT '[]'::jsonb,
  outcome_notes TEXT NOT NULL DEFAULT '',
  proof_storage_path TEXT NOT NULL DEFAULT '',
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_user_id TEXT NOT NULL REFERENCES public.users(id),
  severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info','warning','critical')),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  href TEXT NOT NULL DEFAULT '/os',
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.app_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_by TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
