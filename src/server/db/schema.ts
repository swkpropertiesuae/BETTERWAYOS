export const UNIFIED_SCHEMA_SQL = `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS company_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  legal_name TEXT NOT NULL,
  trade_licence_no TEXT NOT NULL,
  rera_orn TEXT NOT NULL,
  cbuae_broker_reg TEXT NOT NULL,
  vat_trn_15 TEXT NOT NULL,
  corporate_tax_tin TEXT NOT NULL,
  mohre_establishment_id TEXT NOT NULL,
  wps_routing_bank_code TEXT NOT NULL,
  wps_iban TEXT NOT NULL,
  peppol_endpoint_id TEXT NOT NULL,
  office_address TEXT NOT NULL,
  house_clawback_provision_bps INTEGER NOT NULL DEFAULT 1000,
  production_lock_enabled INTEGER NOT NULL DEFAULT 0 CHECK (production_lock_enabled IN (0,1)),
  office_wifi_ssid TEXT NOT NULL DEFAULT 'Betterway-Office-5G',
  office_wifi_ip TEXT NOT NULL DEFAULT '',
  office_ip_locked INTEGER NOT NULL DEFAULT 0 CHECK (office_ip_locked IN (0,1)),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL DEFAULT '',
  full_name_en TEXT NOT NULL,
  full_name_ar TEXT NOT NULL DEFAULT '',
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN (
    'SUPER_ADMIN','SALES_ADVISOR','CREDIT_UNDERWRITER','PROGRESSION_MANAGER',
    'COMPLIANCE_MLRO','FINANCE_ADMIN','HR_MANAGER','PARTNER_AGENCY_ADMIN','PARTNER_AGENT','CLIENT'
  )),
  is_mlro INTEGER NOT NULL DEFAULT 0 CHECK (is_mlro IN (0,1)),
  can_approve_rates INTEGER NOT NULL DEFAULT 0 CHECK (can_approve_rates IN (0,1)),
  preferred_lang TEXT NOT NULL DEFAULT 'en' CHECK (preferred_lang IN ('en','ar')),
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','SUSPENDED')),
  totp_secret TEXT NOT NULL DEFAULT '',
  mfa_enabled INTEGER NOT NULL DEFAULT 0,
  avatar_url TEXT DEFAULT NULL,
  failed_logins INTEGER NOT NULL DEFAULT 0,
  locked_until TEXT DEFAULT NULL,
  last_login_at TEXT DEFAULT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS login_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  outcome TEXT NOT NULL CHECK (outcome IN ('SUCCESS','BAD_PASSWORD','LOCKED','MFA_REQUIRED','MFA_FAILED','SUSPENDED','NOT_FOUND')),
  ip_address TEXT NOT NULL DEFAULT '',
  user_agent TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS staff_devices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  label TEXT NOT NULL DEFAULT '',
  last_ip TEXT NOT NULL DEFAULT '',
  first_seen_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_seen_at TEXT NOT NULL DEFAULT (datetime('now')),
  revoked_at TEXT DEFAULT NULL,
  UNIQUE(user_id, device_id)
);

CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  ip_address TEXT NOT NULL DEFAULT '',
  user_agent TEXT NOT NULL DEFAULT '',
  expires_at TEXT NOT NULL,
  revoked_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  actor_user_id INTEGER,
  actor_role TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  action TEXT NOT NULL,
  before_json TEXT,
  after_json TEXT,
  ip_address TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TRIGGER IF NOT EXISTS trg_audit_logs_no_update
BEFORE UPDATE ON audit_logs
BEGIN
  SELECT RAISE(ABORT, 'audit_logs is strictly append-only');
END;

CREATE TRIGGER IF NOT EXISTS trg_audit_logs_no_delete
BEFORE DELETE ON audit_logs
BEGIN
  SELECT RAISE(ABORT, 'audit_logs is strictly append-only');
END;

CREATE TABLE IF NOT EXISTS partner_agencies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_name TEXT NOT NULL,
  trade_licence_no TEXT NOT NULL,
  rera_orn TEXT NOT NULL UNIQUE,
  vat_trn_15 TEXT NOT NULL DEFAULT '',
  bank_name TEXT NOT NULL DEFAULT '',
  iban TEXT NOT NULL DEFAULT '',
  tier TEXT NOT NULL DEFAULT 'STANDARD' CHECK (tier IN ('STANDARD','SILVER','GOLD','STRATEGIC')),
  default_split_bps INTEGER NOT NULL DEFAULT 2500,
  verification_status TEXT NOT NULL DEFAULT 'PENDING_ORN_CHECK' CHECK (verification_status IN ('PENDING_ORN_CHECK','VERIFIED','SUSPENDED')),
  agreement_status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (agreement_status IN ('DRAFT','SENT','SIGNED','EXPIRED')),
  agreement_signed_at TEXT,
  clawback_debit_balance_fils INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS partner_agents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  agency_id INTEGER NOT NULL REFERENCES partner_agencies(id) ON DELETE CASCADE,
  rera_brn TEXT NOT NULL,
  brn_expiry_date TEXT NOT NULL,
  referral_code TEXT NOT NULL UNIQUE,
  is_agency_admin INTEGER NOT NULL DEFAULT 0 CHECK (is_agency_admin IN (0,1)),
  split_override_bps INTEGER,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','SUSPENDED')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS households (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  primary_name TEXT NOT NULL,
  segment TEXT NOT NULL DEFAULT 'RESIDENT_SALARIED' CHECK (segment IN (
    'RESIDENT_SALARIED','UAE_NATIONAL','GCC','NON_RESIDENT','SELF_EMPLOYED','HNW_SPV'
  )),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS applicants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  household_id INTEGER NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  applicant_role TEXT NOT NULL DEFAULT 'PRIMARY' CHECK (applicant_role IN ('PRIMARY','CO_BORROWER','GUARANTOR','UBO')),
  full_name_en TEXT NOT NULL,
  full_name_ar TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  nationality_code TEXT NOT NULL DEFAULT 'AE',
  residence_country TEXT NOT NULL DEFAULT 'AE',
  residency_type TEXT NOT NULL DEFAULT 'EXPAT_RESIDENT' CHECK (residency_type IN ('UAE_NATIONAL','EXPAT_RESIDENT','GCC_NATIONAL','NON_RESIDENT')),
  dob TEXT NOT NULL DEFAULT '1988-06-15',
  emirates_id TEXT NOT NULL DEFAULT '',
  eid_expiry_date TEXT,
  passport_no TEXT NOT NULL DEFAULT '',
  passport_expiry_date TEXT,
  is_pep INTEGER NOT NULL DEFAULT 0 CHECK (is_pep IN (0,1)),
  employment_type TEXT NOT NULL DEFAULT 'SALARIED' CHECK (employment_type IN ('SALARIED','SELF_EMPLOYED','INVESTOR')),
  employer_name TEXT NOT NULL DEFAULT '',
  employer_tier TEXT NOT NULL DEFAULT 'APPROVED_LISTED' CHECK (employer_tier IN ('GOVERNMENT_GRE','APPROVED_LISTED','MNC','UNLISTED_SME')),
  length_of_service_months INTEGER NOT NULL DEFAULT 24,
  stl_preference INTEGER NOT NULL DEFAULT 1 CHECK (stl_preference IN (0,1)),
  currency_code TEXT NOT NULL DEFAULT 'AED',
  fx_rate_to_aed_bps INTEGER NOT NULL DEFAULT 10000,
  fx_haircut_bps INTEGER NOT NULL DEFAULT 0,
  basic_salary_fils INTEGER NOT NULL DEFAULT 0,
  allowances_fils INTEGER NOT NULL DEFAULT 0,
  bonus_annual_avg_fils INTEGER NOT NULL DEFAULT 0,
  commission_monthly_avg_fils INTEGER NOT NULL DEFAULT 0,
  rental_income_annual_fils INTEGER NOT NULL DEFAULT 0,
  net_profit_yr1_fils INTEGER NOT NULL DEFAULT 0,
  net_profit_yr2_fils INTEGER NOT NULL DEFAULT 0,
  ownership_bps INTEGER NOT NULL DEFAULT 10000,
  aecb_score INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS applicant_liabilities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  applicant_id INTEGER NOT NULL REFERENCES applicants(id) ON DELETE CASCADE,
  source TEXT NOT NULL DEFAULT 'DECLARED' CHECK (source IN ('DECLARED','AECB_VERIFIED','STATEMENT_DETECTED')),
  liability_type TEXT NOT NULL CHECK (liability_type IN ('CREDIT_CARD','PERSONAL_LOAN','AUTO_LOAN','EXISTING_MORTGAGE','OVERDRAFT','BNPL')),
  lender_name TEXT NOT NULL,
  credit_limit_fils INTEGER NOT NULL DEFAULT 0,
  outstanding_balance_fils INTEGER NOT NULL DEFAULT 0,
  monthly_emi_fils INTEGER NOT NULL DEFAULT 0,
  to_be_cleared_before_fol INTEGER NOT NULL DEFAULT 0 CHECK (to_be_cleared_before_fol IN (0,1)),
  closure_letter_doc_id INTEGER
);

CREATE TABLE IF NOT EXISTS leads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  household_id INTEGER REFERENCES households(id) ON DELETE SET NULL,
  contact_name TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  contact_email TEXT NOT NULL DEFAULT '',
  source_channel TEXT NOT NULL DEFAULT 'WEBSITE_CALC' CHECK (source_channel IN (
    'WEBSITE_CALC','QUALIFIER','WHATSAPP','PARTNER_HUB','PROPERTY_FINDER','BAYUT','DUBIZZLE','META','GOOGLE','SELF_GEN','PORTAL_SELF_REG'
  )),
  calculator_snapshot_json TEXT,
  partner_agent_id INTEGER REFERENCES partner_agents(id) ON DELETE SET NULL,
  assigned_advisor_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  desk TEXT NOT NULL DEFAULT 'RESIDENT_DESK',
  transaction_type TEXT NOT NULL DEFAULT 'READY_PURCHASE' CHECK (transaction_type IN (
    'READY_PURCHASE','OFFPLAN_HANDOVER','BUYOUT','EQUITY_RELEASE','COMMERCIAL','CONSTRUCTION'
  )),
  target_property_fils INTEGER NOT NULL DEFAULT 0,
  stage TEXT NOT NULL DEFAULT 'NEW' CHECK (stage IN ('NEW','CONTACTED','FACT_FIND','CONVERTED_TO_DEAL','NURTURE','DISQUALIFIED')),
  first_response_due_at TEXT NOT NULL,
  first_responded_at TEXT,
  client_consent_logged_at TEXT,
  lost_reason TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS comm_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lead_id INTEGER REFERENCES leads(id) ON DELETE CASCADE,
  deal_id INTEGER,
  channel TEXT NOT NULL CHECK (channel IN ('WHATSAPP','EMAIL','CALL_LOG','INTERNAL_NOTE')),
  direction TEXT NOT NULL CHECK (direction IN ('INBOUND','OUTBOUND','INTERNAL')),
  sender_name TEXT NOT NULL,
  template_code TEXT,
  body TEXT NOT NULL,
  internal_only INTEGER NOT NULL DEFAULT 0 CHECK (internal_only IN (0,1)),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS banks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  bank_key TEXT NOT NULL UNIQUE,
  name_en TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  short_name TEXT NOT NULL,
  logo_path TEXT NOT NULL,
  structure TEXT NOT NULL CHECK (structure IN ('CONVENTIONAL','ISLAMIC','DUAL')),
  hq_emirate TEXT NOT NULL,
  stress_rate_bps INTEGER NOT NULL DEFAULT 650,
  card_limit_dbr_bps INTEGER NOT NULL DEFAULT 500 CHECK (card_limit_dbr_bps IN (300,500)),
  max_age_salaried INTEGER NOT NULL DEFAULT 65,
  max_age_self_emp INTEGER NOT NULL DEFAULT 70,
  accepts_non_resident INTEGER NOT NULL DEFAULT 0 CHECK (accepts_non_resident IN (0,1)),
  non_resident_max_ltv_bps INTEGER NOT NULL DEFAULT 6000,
  accepts_external_life INTEGER NOT NULL DEFAULT 0 CHECK (accepts_external_life IN (0,1)),
  bonus_haircut_bps INTEGER NOT NULL DEFAULT 5000,
  rental_haircut_bps INTEGER NOT NULL DEFAULT 2500,
  clawback_window_months INTEGER NOT NULL DEFAULT 24 CHECK (clawback_window_months IN (12,24,36))
);

CREATE TABLE IF NOT EXISTS bank_rate_cards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bank_id INTEGER NOT NULL REFERENCES banks(id) ON DELETE CASCADE,
  product_code TEXT NOT NULL,
  finance_mode TEXT NOT NULL CHECK (finance_mode IN ('CONVENTIONAL','IJARA','MURABAHA','MUSHARAKA')),
  residency_scope TEXT NOT NULL DEFAULT 'ALL' CHECK (residency_scope IN ('ALL','RESIDENT_ONLY','UAE_NATIONAL_ONLY','NON_RESIDENT')),
  stl_required INTEGER NOT NULL DEFAULT 1 CHECK (stl_required IN (0,1)),
  fixed_years INTEGER NOT NULL DEFAULT 2 CHECK (fixed_years IN (0,1,2,3,5)),
  intro_rate_bps INTEGER NOT NULL,
  eibor_tenor TEXT NOT NULL DEFAULT '3M' CHECK (eibor_tenor IN ('1M','3M','6M')),
  revert_margin_bps INTEGER NOT NULL,
  floor_rate_bps INTEGER NOT NULL DEFAULT 300,
  arrangement_fee_bps INTEGER NOT NULL DEFAULT 105,
  buyout_fee_bps INTEGER NOT NULL DEFAULT 0,
  free_overpay_cap_bps INTEGER NOT NULL DEFAULT 1000,
  valuation_fee_fils INTEGER NOT NULL DEFAULT 315000,
  min_salary_fils INTEGER NOT NULL DEFAULT 1500000,
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','PENDING_APPROVAL','ACTIVE','ARCHIVED')),
  created_by INTEGER REFERENCES users(id),
  approved_by INTEGER REFERENCES users(id),
  effective_from TEXT NOT NULL,
  effective_to TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS eibor_fixings (
  fixing_date TEXT PRIMARY KEY,
  value_date TEXT NOT NULL,
  overnight_micro INTEGER NOT NULL,
  one_month_micro INTEGER NOT NULL,
  three_month_micro INTEGER NOT NULL,
  six_month_micro INTEGER NOT NULL,
  one_year_micro INTEGER NOT NULL,
  source_status TEXT NOT NULL DEFAULT 'SNAPSHOT',
  retrieved_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS developers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  escrow_info TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  developer_id INTEGER NOT NULL REFERENCES developers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  community TEXT NOT NULL,
  completion_status TEXT NOT NULL DEFAULT 'HANDOVER_READY' CHECK (completion_status IN ('UNDER_CONSTRUCTION','HANDOVER_READY','COMPLETED'))
);

CREATE TABLE IF NOT EXISTS bank_project_apl (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bank_id INTEGER NOT NULL REFERENCES banks(id) ON DELETE CASCADE,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  tower_name TEXT NOT NULL DEFAULT 'All Towers',
  apl_status TEXT NOT NULL CHECK (apl_status IN ('APPROVED','CASE_BY_CASE','CAPPED_LTV','BLOCKED')),
  max_ltv_bps INTEGER NOT NULL DEFAULT 8000,
  valuation_basis TEXT NOT NULL DEFAULT 'FRESH_MARKET_VAL' CHECK (valuation_basis IN ('LOWER_OF_SPA_OR_VAL','FRESH_MARKET_VAL')),
  updated_by INTEGER REFERENCES users(id),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(bank_id, project_id, tower_name)
);

CREATE TABLE IF NOT EXISTS bank_bdm_contacts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bank_id INTEGER NOT NULL REFERENCES banks(id) ON DELETE CASCADE,
  segment TEXT NOT NULL,
  bdm_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  avg_ipa_tat_days INTEGER NOT NULL DEFAULT 3,
  avg_fol_tat_days INTEGER NOT NULL DEFAULT 5
);

CREATE TABLE IF NOT EXISTS deals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  deal_ref TEXT NOT NULL UNIQUE,
  origin_mode TEXT NOT NULL DEFAULT 'LIVE' CHECK (origin_mode IN ('LIVE','LEGACY_BACKBOOK')),
  lead_id INTEGER REFERENCES leads(id) ON DELETE SET NULL,
  household_id INTEGER NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  partner_agent_id INTEGER REFERENCES partner_agents(id) ON DELETE SET NULL,
  lead_source_category TEXT NOT NULL DEFAULT 'COMPANY_OR_PARTNER' CHECK (lead_source_category IN ('SELF_GEN','COMPANY_OR_PARTNER')),
  advisor_id INTEGER REFERENCES users(id),
  underwriter_id INTEGER REFERENCES users(id),
  progression_manager_id INTEGER REFERENCES users(id),
  finance_preference TEXT NOT NULL DEFAULT 'ANY' CHECK (finance_preference IN ('ANY','ISLAMIC_ONLY','CONVENTIONAL_ONLY')),
  transaction_type TEXT NOT NULL DEFAULT 'READY_PURCHASE' CHECK (transaction_type IN (
    'READY_PURCHASE','OFFPLAN_HANDOVER','BUYOUT','EQUITY_RELEASE','COMMERCIAL','CONSTRUCTION'
  )),
  emirate TEXT NOT NULL DEFAULT 'dubai',
  community_name TEXT NOT NULL DEFAULT 'Dubai Hills Estate',
  project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
  property_status TEXT NOT NULL DEFAULT 'READY' CHECK (property_status IN ('READY','OFFPLAN_UNDER_CONSTRUCTION','HANDOVER_COMPLETION')),
  is_first_home INTEGER NOT NULL DEFAULT 1 CHECK (is_first_home IN (0,1)),
  purchase_price_fils INTEGER NOT NULL,
  estimated_valuation_fils INTEGER NOT NULL,
  target_loan_fils INTEGER NOT NULL,
  direct_client_fee_fils INTEGER NOT NULL DEFAULT 0,
  tenure_months INTEGER NOT NULL DEFAULT 300,
  housing_grant_program TEXT NOT NULL DEFAULT 'NONE' CHECK (housing_grant_program IN ('NONE','MRHE','SZHP')),
  housing_grant_fils INTEGER NOT NULL DEFAULT 0,
  commercial_annual_noi_fils INTEGER NOT NULL DEFAULT 0,
  pre_qual_cert_enabled INTEGER NOT NULL DEFAULT 0 CHECK (pre_qual_cert_enabled IN (0,1)),
  stage TEXT NOT NULL DEFAULT 'FACT_FIND' CHECK (stage IN (
    'FACT_FIND','KFS_PENDING','DOC_COLLECTION','UNDERWRITING_READY',
    'IPA_SUBMITTED','IPA_APPROVED','MOU_SIGNED','VALUATION_ORDERED',
    'VALUATION_RECEIVED','FOL_ISSUED','FOL_SIGNED','NOC_AND_CLEARANCE',
    'CHEQUES_READY','TRANSFERRED_DISBURSED','DECLINED','WITHDRAWN'
  )),
  cdd_status TEXT NOT NULL DEFAULT 'PENDING' CHECK (cdd_status IN ('PENDING','CLEARED','EDD_REQUIRED','EDD_APPROVED','BLOCKED')),
  selected_bank_id INTEGER REFERENCES banks(id),
  selected_rate_card_id INTEGER REFERENCES bank_rate_cards(id),
  disbursed_loan_fils INTEGER NOT NULL DEFAULT 0,
  disbursed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS deal_submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  deal_id INTEGER NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  bank_id INTEGER NOT NULL REFERENCES banks(id),
  rate_card_id INTEGER NOT NULL REFERENCES bank_rate_cards(id),
  priority TEXT NOT NULL DEFAULT 'PRIMARY' CHECK (priority IN ('PRIMARY','BACKUP')),
  submitted_loan_fils INTEGER NOT NULL,
  calculated_dbr_bps INTEGER NOT NULL,
  calculated_ltv_bps INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN (
    'DRAFT','SUBMITTED','QUERY_RAISED','IPA_APPROVED','IPA_DECLINED','FOL_ISSUED','FOL_SIGNED','SELECTED_FOR_DISBURSAL'
  )),
  ipa_ref TEXT,
  ipa_expires_at TEXT,
  fol_ref TEXT,
  fol_fixed_end_date TEXT,
  fol_revert_margin_bps INTEGER,
  fol_floor_bps INTEGER,
  fol_audit_passed INTEGER NOT NULL DEFAULT 0 CHECK (fol_audit_passed IN (0,1)),
  underwriter_notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS conveyancing_cases (
  deal_id INTEGER PRIMARY KEY REFERENCES deals(id) ON DELETE CASCADE,
  form_f_signed_date TEXT,
  form_f_expiry_date TEXT,
  fol_contingency_date TEXT,
  deposit_cheque_no TEXT NOT NULL DEFAULT '',
  deposit_cheque_fils INTEGER NOT NULL DEFAULT 0,
  deposit_holder TEXT NOT NULL DEFAULT 'RERA Stakeholder Brokerage',
  seller_has_mortgage INTEGER NOT NULL DEFAULT 0 CHECK (seller_has_mortgage IN (0,1)),
  seller_bank_name TEXT NOT NULL DEFAULT '',
  liability_letter_payoff_fils INTEGER NOT NULL DEFAULT 0,
  liability_per_diem_fils INTEGER NOT NULL DEFAULT 0,
  liability_letter_expires_at TEXT,
  deposit_paid_direct_fils INTEGER NOT NULL DEFAULT 0,
  include_agency_fee INTEGER NOT NULL DEFAULT 1 CHECK (include_agency_fee IN (0,1)),
  valuation_firm TEXT NOT NULL DEFAULT '',
  valuation_amount_fils INTEGER NOT NULL DEFAULT 0,
  valuation_shortfall_action TEXT NOT NULL DEFAULT 'NONE' CHECK (valuation_shortfall_action IN (
    'NONE','APPEAL_FILED','SWITCHED_BACKUP_BANK','PRICE_RENEGOTIATED','BUYER_TOP_UP'
  )),
  appeal_comps_json TEXT,
  noc_status TEXT NOT NULL DEFAULT 'NOT_STARTED' CHECK (noc_status IN ('NOT_STARTED','APPLIED','ISSUED')),
  noc_issued_at TEXT,
  trustee_office TEXT NOT NULL DEFAULT '',
  transfer_appointment_at TEXT,
  cheque_split_json TEXT,
  title_deed_no TEXT NOT NULL DEFAULT '',
  valuation_access_status TEXT NOT NULL DEFAULT 'ACCESS_CONFIRMED',
  developer_portal_name TEXT NOT NULL DEFAULT 'Emaar Sakani Portal',
  dld_blocking_stage TEXT NOT NULL DEFAULT 'NOT_REQUIRED'
);

CREATE TABLE IF NOT EXISTS vault_documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  doc_uuid TEXT NOT NULL UNIQUE,
  deal_id INTEGER NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  applicant_id INTEGER REFERENCES applicants(id) ON DELETE SET NULL,
  doc_category TEXT NOT NULL CHECK (doc_category IN (
    'PASSPORT','EMIRATES_ID','VISA','SALARY_CERT','PAYSLIPS_6M','BANK_STATEMENTS_6M',
    'AUDIT_FINANCIALS','TRADE_LICENCE','AECB_REPORT','FORM_F','KFS_SIGNED','FOL_SIGNED','TITLE_DEED','TAKAFUL_POLICY'
  )),
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  byte_size INTEGER NOT NULL,
  sha256_hash TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  iv_hex TEXT NOT NULL,
  auth_tag_hex TEXT NOT NULL,
  document_issue_date TEXT,
  document_expiry_date TEXT,
  ocr_validation_status TEXT NOT NULL DEFAULT 'PASSED' CHECK (ocr_validation_status IN (
    'PENDING','PASSED','WARNING_EXPIRY_180D','WARNING_STALE_30D','REJECTED'
  )),
  ocr_notes TEXT NOT NULL DEFAULT '',
  verified_by INTEGER REFERENCES users(id),
  verified_at TEXT,
  uploaded_by INTEGER REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS homeowner_radar_monitors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  deal_id INTEGER NOT NULL UNIQUE REFERENCES deals(id) ON DELETE CASCADE,
  household_id INTEGER NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  lender_bank_id INTEGER NOT NULL REFERENCES banks(id),
  disbursed_loan_fils INTEGER NOT NULL,
  current_rate_bps INTEGER NOT NULL,
  fixed_expiry_date TEXT NOT NULL,
  revert_margin_bps INTEGER NOT NULL,
  floor_rate_bps INTEGER NOT NULL,
  alert_status TEXT NOT NULL DEFAULT 'MONITORING' CHECK (alert_status IN (
    'MONITORING','ALERT_120D','ALERT_90D','ALERT_60D','ALERT_30D','CONVERTED_BUYOUT_DEAL'
  )),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS cross_sell_referrals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  deal_id INTEGER NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  service_type TEXT NOT NULL CHECK (service_type IN (
    'EXTERNAL_LIFE_TAKAFUL','DIFC_WILL','FX_TRANSFER','GOLDEN_VISA_NOC','COMMERCIAL_ADVISORY'
  )),
  provider_name TEXT NOT NULL,
  quoted_client_saving_fils INTEGER NOT NULL DEFAULT 0,
  expected_referral_fee_fils INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'IDENTIFIED' CHECK (status IN ('IDENTIFIED','PITCHED','REFERRED','COMPLETED','DECLINED')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS gl_accounts (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  account_type TEXT NOT NULL CHECK (account_type IN ('ASSET','LIABILITY','EQUITY','REVENUE','EXPENSE'))
);

CREATE TABLE IF NOT EXISTS gl_journal_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entry_ref TEXT NOT NULL UNIQUE,
  entry_date TEXT NOT NULL,
  memo TEXT NOT NULL,
  source_module TEXT NOT NULL,
  source_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'POSTED' CHECK (status IN ('POSTED','REVERSED')),
  created_by INTEGER REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS gl_journal_lines (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  journal_entry_id INTEGER NOT NULL REFERENCES gl_journal_entries(id) ON DELETE CASCADE,
  account_code TEXT NOT NULL REFERENCES gl_accounts(code),
  debit_fils INTEGER NOT NULL DEFAULT 0 CHECK (debit_fils >= 0),
  credit_fils INTEGER NOT NULL DEFAULT 0 CHECK (credit_fils >= 0),
  line_memo TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS bank_subvention_grids (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bank_id INTEGER NOT NULL REFERENCES banks(id) ON DELETE CASCADE,
  monthly_volume_min_fils INTEGER NOT NULL DEFAULT 0,
  monthly_volume_max_fils INTEGER,
  commission_bps INTEGER NOT NULL,
  max_payout_cap_fils INTEGER,
  vat_mode TEXT NOT NULL DEFAULT 'EXCLUSIVE_5PCT' CHECK (vat_mode IN ('EXCLUSIVE_5PCT','INCLUSIVE_5PCT','ZERO_RATED','EXEMPT'))
);

CREATE TABLE IF NOT EXISTS bank_bordereau_batches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  batch_ref TEXT NOT NULL UNIQUE,
  bank_id INTEGER NOT NULL REFERENCES banks(id),
  received_date TEXT NOT NULL,
  total_cash_received_fils INTEGER NOT NULL,
  notes TEXT NOT NULL DEFAULT '',
  created_by INTEGER REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS commission_settlements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  deal_id INTEGER NOT NULL UNIQUE REFERENCES deals(id) ON DELETE CASCADE,
  bank_id INTEGER NOT NULL REFERENCES banks(id),
  disbursed_loan_fils INTEGER NOT NULL,
  vat_mode TEXT NOT NULL DEFAULT 'EXCLUSIVE_5PCT',
  expected_subvention_ex_vat_fils INTEGER NOT NULL,
  expected_output_vat_fils INTEGER NOT NULL DEFAULT 0,
  direct_client_fee_ex_vat_fils INTEGER NOT NULL DEFAULT 0,
  direct_client_output_vat_fils INTEGER NOT NULL DEFAULT 0,
  received_subvention_ex_vat_fils INTEGER NOT NULL DEFAULT 0,
  received_client_fee_ex_vat_fils INTEGER NOT NULL DEFAULT 0,
  reconciliation_status TEXT NOT NULL DEFAULT 'AWAITING_BANK_CASH' CHECK (reconciliation_status IN (
    'AWAITING_BANK_CASH','PARTIAL_RECEIVED','RECONCILED','CLAWED_BACK'
  )),
  partner_agency_id INTEGER REFERENCES partner_agencies(id),
  partner_split_bps INTEGER NOT NULL DEFAULT 0,
  partner_entitled_ex_vat_fils INTEGER NOT NULL DEFAULT 0,
  partner_released_ex_vat_fils INTEGER NOT NULL DEFAULT 0,
  partner_input_vat_fils INTEGER NOT NULL DEFAULT 0,
  partner_held_ex_vat_fils INTEGER NOT NULL DEFAULT 0,
  partner_held_vat_fils INTEGER NOT NULL DEFAULT 0,
  partner_clawback_offset_applied_fils INTEGER NOT NULL DEFAULT 0,
  partner_payout_status TEXT NOT NULL DEFAULT 'NOT_APPLICABLE' CHECK (partner_payout_status IN (
    'NOT_APPLICABLE','AWAITING_BANK_CASH','ONBOARDING_HOLD','PAYABLE_READY','PAID'
  )),
  house_clawback_provision_fils INTEGER NOT NULL DEFAULT 0,
  advisor_id INTEGER REFERENCES users(id),
  advisor_entitled_fils INTEGER NOT NULL DEFAULT 0,
  advisor_released_fils INTEGER NOT NULL DEFAULT 0,
  advisor_clawback_offset_applied_fils INTEGER NOT NULL DEFAULT 0,
  progression_bonus_fils INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS clawback_ledger (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  settlement_id INTEGER NOT NULL REFERENCES commission_settlements(id) ON DELETE CASCADE,
  deal_id INTEGER NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  bank_id INTEGER NOT NULL REFERENCES banks(id),
  protected_until_date TEXT NOT NULL,
  house_provision_fils INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE_HOLD' CHECK (status IN ('ACTIVE_HOLD','RELEASED_TO_INCOME','CLAWBACK_TRIGGERED')),
  clawback_claim_ex_vat_fils INTEGER NOT NULL DEFAULT 0,
  partner_debit_booked_fils INTEGER NOT NULL DEFAULT 0,
  advisor_debit_booked_fils INTEGER NOT NULL DEFAULT 0,
  triggered_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS tax_invoices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_number TEXT NOT NULL UNIQUE,
  invoice_type TEXT NOT NULL CHECK (invoice_type IN ('TAX_INVOICE_380','CREDIT_NOTE_381','SELF_BILLED_PARTNER')),
  deal_id INTEGER REFERENCES deals(id),
  counterparty_name TEXT NOT NULL,
  counterparty_trn_15 TEXT NOT NULL DEFAULT '',
  counterparty_peppol_id TEXT NOT NULL DEFAULT '',
  issue_date TEXT NOT NULL,
  supply_date TEXT NOT NULL,
  currency_code TEXT NOT NULL DEFAULT 'AED',
  subtotal_fils INTEGER NOT NULL,
  vat_rate_bps INTEGER NOT NULL DEFAULT 500,
  vat_fils INTEGER NOT NULL,
  total_fils INTEGER NOT NULL,
  pint_ae_xml TEXT NOT NULL,
  peppol_status TEXT NOT NULL DEFAULT 'VALIDATED_XML' CHECK (peppol_status IN ('DRAFT','VALIDATED_XML','SENT_TO_ASP','FTA_ACKNOWLEDGED','REJECTED')),
  gl_entry_id INTEGER REFERENCES gl_journal_entries(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS vendor_bills (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bill_number TEXT NOT NULL UNIQUE,
  vendor_name TEXT NOT NULL,
  vendor_trn_15 TEXT NOT NULL DEFAULT '',
  bill_date TEXT NOT NULL,
  expense_account_code TEXT NOT NULL REFERENCES gl_accounts(code),
  marketing_channel TEXT,
  subtotal_fils INTEGER NOT NULL,
  input_vat_fils INTEGER NOT NULL DEFAULT 0,
  input_vat_category TEXT NOT NULL DEFAULT 'DIRECT_TAXABLE' CHECK (input_vat_category IN ('DIRECT_TAXABLE','DIRECT_EXEMPT','RESIDUAL_OVERHEAD')),
  ct_deductibility TEXT NOT NULL DEFAULT 'FULL_100' CHECK (ct_deductibility IN ('FULL_100','ENTERTAINMENT_50','NON_DEDUCTIBLE_0')),
  approval_status TEXT NOT NULL DEFAULT 'APPROVED' CHECK (approval_status IN ('PENDING_OWNER_APPROVAL','APPROVED','REJECTED')),
  approved_by_user_id INTEGER REFERENCES users(id),
  gl_entry_id INTEGER REFERENCES gl_journal_entries(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS advisor_comp_plans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plan_name TEXT NOT NULL UNIQUE,
  self_gen_multiplier_bps INTEGER NOT NULL DEFAULT 12000,
  company_lead_multiplier_bps INTEGER NOT NULL DEFAULT 10000,
  progression_bonus_fils INTEGER NOT NULL DEFAULT 150000
);

CREATE TABLE IF NOT EXISTS advisor_comp_slabs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plan_id INTEGER NOT NULL REFERENCES advisor_comp_plans(id) ON DELETE CASCADE,
  monthly_house_net_min_fils INTEGER NOT NULL,
  monthly_house_net_max_fils INTEGER,
  payout_bps INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS employees (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE SET NULL,
  emp_code TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  nationality_code TEXT NOT NULL,
  is_uae_national INTEGER NOT NULL DEFAULT 0 CHECK (is_uae_national IN (0,1)),
  nafis_registered INTEGER NOT NULL DEFAULT 0 CHECK (nafis_registered IN (0,1)),
  gpssa_number TEXT NOT NULL DEFAULT '',
  mohre_person_id_14 TEXT NOT NULL,
  routing_agent_id_9 TEXT NOT NULL,
  employee_iban_23 TEXT NOT NULL,
  contract_type TEXT NOT NULL DEFAULT 'MAINLAND_MOHRE' CHECK (contract_type IN ('MAINLAND_MOHRE','FREEZONE')),
  department TEXT NOT NULL,
  designation TEXT NOT NULL,
  comp_plan_id INTEGER REFERENCES advisor_comp_plans(id),
  join_date TEXT NOT NULL,
  termination_date TEXT,
  basic_salary_fils INTEGER NOT NULL,
  housing_allowance_fils INTEGER NOT NULL DEFAULT 0,
  transport_allowance_fils INTEGER NOT NULL DEFAULT 0,
  other_allowance_fils INTEGER NOT NULL DEFAULT 0,
  monthly_draw_fils INTEGER NOT NULL DEFAULT 0,
  is_draw_recoverable INTEGER NOT NULL DEFAULT 1 CHECK (is_draw_recoverable IN (0,1)),
  draw_deficit_fils INTEGER NOT NULL DEFAULT 0,
  clawback_debit_balance_fils INTEGER NOT NULL DEFAULT 0,
  visa_expiry_date TEXT NOT NULL,
  emirates_id_expiry_date TEXT NOT NULL,
  rera_card_expiry_date TEXT,
  medical_ins_expiry_date TEXT NOT NULL,
  avatar_url TEXT DEFAULT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS leave_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  leave_type TEXT NOT NULL CHECK (leave_type IN ('ANNUAL','SICK','MATERNITY','PARENTAL','UNPAID')),
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  days_count INTEGER NOT NULL CHECK (days_count > 0),
  status TEXT NOT NULL DEFAULT 'APPROVED' CHECK (status IN ('PENDING','APPROVED','REJECTED')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS payroll_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  period_month TEXT NOT NULL UNIQUE,
  pay_start_date TEXT NOT NULL,
  pay_end_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','SIF_GENERATED','DISBURSED')),
  sif_filename TEXT NOT NULL DEFAULT '',
  sif_content TEXT NOT NULL DEFAULT '',
  total_net_fils INTEGER NOT NULL DEFAULT 0,
  gl_entry_id INTEGER REFERENCES gl_journal_entries(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS payroll_lines (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  payroll_run_id INTEGER NOT NULL REFERENCES payroll_runs(id) ON DELETE CASCADE,
  employee_id INTEGER NOT NULL REFERENCES employees(id),
  paid_days INTEGER NOT NULL,
  unpaid_leave_days INTEGER NOT NULL DEFAULT 0,
  fixed_pay_fils INTEGER NOT NULL,
  variable_commission_fils INTEGER NOT NULL DEFAULT 0,
  draw_advance_fils INTEGER NOT NULL DEFAULT 0,
  draw_recovered_fils INTEGER NOT NULL DEFAULT 0,
  gpssa_employee_deduction_fils INTEGER NOT NULL DEFAULT 0,
  gpssa_employer_contrib_fils INTEGER NOT NULL DEFAULT 0,
  net_payable_fils INTEGER NOT NULL,
  eosb_accrued_to_date_fils INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS kfs_acknowledgements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  deal_id INTEGER NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  applicant_id INTEGER NOT NULL REFERENCES applicants(id) ON DELETE CASCADE,
  kfs_version TEXT NOT NULL DEFAULT 'CBUAE-KFS-v2.1',
  disclosed_broker_fee_fils INTEGER NOT NULL DEFAULT 0,
  disclosed_lfi_commission_range TEXT NOT NULL,
  kfs_snapshot_json TEXT NOT NULL,
  signed_by_name TEXT NOT NULL,
  signed_ip TEXT NOT NULL DEFAULT '127.0.0.1',
  signed_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(deal_id, applicant_id)
);

CREATE TABLE IF NOT EXISTS aml_screenings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  deal_id INTEGER NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  applicant_id INTEGER NOT NULL REFERENCES applicants(id) ON DELETE CASCADE,
  risk_score INTEGER NOT NULL DEFAULT 15,
  risk_band TEXT NOT NULL DEFAULT 'LOW' CHECK (risk_band IN ('LOW','MEDIUM','HIGH')),
  source_of_funds_type TEXT NOT NULL DEFAULT 'UAE_SALARY_SAVINGS',
  source_of_funds_verified INTEGER NOT NULL DEFAULT 0 CHECK (source_of_funds_verified IN (0,1)),
  sanctions_match_status TEXT NOT NULL DEFAULT 'CLEAR' CHECK (sanctions_match_status IN ('CLEAR','POTENTIAL_MATCH','FALSE_POSITIVE_CLEARED','CONFIRMED_BLOCK')),
  pep_status INTEGER NOT NULL DEFAULT 0 CHECK (pep_status IN (0,1)),
  mlro_reviewer_id INTEGER REFERENCES users(id),
  reviewed_at TEXT,
  notes TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS goaml_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  report_ref TEXT NOT NULL UNIQUE,
  report_type TEXT NOT NULL CHECK (report_type IN ('STR','SAR')),
  deal_id INTEGER REFERENCES deals(id) ON DELETE SET NULL,
  subject_summary TEXT NOT NULL,
  red_flag_indicators_json TEXT NOT NULL,
  goaml_xml_payload TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'DRAFT_INVESTIGATION' CHECK (status IN ('DRAFT_INVESTIGATION','XML_READY','FILED_WITH_FIU','CLOSED_NO_ACTION')),
  created_by_mlro INTEGER NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sanadak_complaints (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  complaint_ref TEXT NOT NULL UNIQUE,
  deal_id INTEGER REFERENCES deals(id) ON DELETE SET NULL,
  complainant_name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  received_at TEXT NOT NULL DEFAULT (datetime('now')),
  ack_due_at TEXT NOT NULL,
  ack_sent_at TEXT,
  resolution_due_at TEXT NOT NULL,
  resolved_at TEXT,
  sanadak_escalated INTEGER NOT NULL DEFAULT 0 CHECK (sanadak_escalated IN (0,1)),
  outcome_notes TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS wiki_articles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  bank_id INTEGER REFERENCES banks(id) ON DELETE SET NULL,
  title_en TEXT NOT NULL,
  title_ar TEXT NOT NULL DEFAULT '',
  body_en TEXT NOT NULL,
  body_ar TEXT NOT NULL DEFAULT '',
  policy_version TEXT NOT NULL DEFAULT '1.0',
  clause_ref TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS ops_tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  deal_id INTEGER REFERENCES deals(id) ON DELETE CASCADE,
  assigned_role TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'HIGH' CHECK (priority IN ('CRITICAL','HIGH','NORMAL')),
  title TEXT NOT NULL,
  due_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN','COMPLETED')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS data_batches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  spec_no INTEGER NOT NULL,
  file_name TEXT NOT NULL,
  source_rows INTEGER NOT NULL DEFAULT 0,
  accepted_rows INTEGER NOT NULL DEFAULT 0,
  held_rows INTEGER NOT NULL DEFAULT 0,
  rejected_rows INTEGER NOT NULL DEFAULT 0,
  applied_rows INTEGER NOT NULL DEFAULT 0,
  csv_content TEXT NOT NULL DEFAULT '',
  reviewer_id INTEGER REFERENCES users(id),
  evidence_ref TEXT NOT NULL DEFAULT '',
  created_by INTEGER REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS data_rows (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  batch_id INTEGER NOT NULL REFERENCES data_batches(id) ON DELETE CASCADE,
  spec_no INTEGER NOT NULL,
  row_no INTEGER NOT NULL,
  external_id TEXT NOT NULL DEFAULT '',
  data_json TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('ACCEPTED','HELD_FOR_REVIEW','REJECTED','SUPERSEDED')),
  errors_json TEXT NOT NULL DEFAULT '[]',
  effective_from TEXT,
  effective_to TEXT,
  applied INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_data_rows_spec ON data_rows(spec_no, status);

CREATE TABLE IF NOT EXISTS data_exports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  spec_no INTEGER NOT NULL,
  actor_user_id INTEGER REFERENCES users(id),
  actor_role TEXT NOT NULL,
  purpose TEXT NOT NULL,
  row_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS deal_quotes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  deal_id INTEGER NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  inputs_json TEXT NOT NULL,
  offers_json TEXT NOT NULL,
  knockouts_json TEXT NOT NULL DEFAULT '[]',
  rule_version TEXT NOT NULL,
  cash_to_close_fils INTEGER NOT NULL DEFAULT 0,
  expires_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','APPROVED','SUPERSEDED')),
  override_reason TEXT NOT NULL DEFAULT '',
  approved_by INTEGER REFERENCES users(id),
  approved_at TEXT,
  created_by INTEGER REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (deal_id, version)
);

CREATE TABLE IF NOT EXISTS legacy_links (
  entity_type TEXT NOT NULL,
  legacy_id TEXT NOT NULL,
  entity_id INTEGER NOT NULL,
  PRIMARY KEY (entity_type, legacy_id)
);

CREATE TABLE IF NOT EXISTS document_index (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  deal_id INTEGER NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  applicant_id INTEGER REFERENCES applicants(id) ON DELETE SET NULL,
  document_type TEXT NOT NULL,
  vault_ref TEXT NOT NULL DEFAULT '',
  received_at TEXT,
  expiry_at TEXT,
  verification_status TEXT NOT NULL DEFAULT '',
  access_class TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS legacy_receivables (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  deal_id INTEGER NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  counterparty_id TEXT NOT NULL DEFAULT '',
  invoice_ref TEXT NOT NULL UNIQUE,
  accrued_fils INTEGER NOT NULL DEFAULT 0,
  paid_fils INTEGER NOT NULL DEFAULT 0,
  outstanding_fils INTEGER NOT NULL DEFAULT 0,
  due_date TEXT,
  reconciliation_status TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  deal_id INTEGER REFERENCES deals(id) ON DELETE SET NULL,
  template_id TEXT NOT NULL,
  channel TEXT NOT NULL,
  locale TEXT NOT NULL DEFAULT 'en',
  recipient TEXT NOT NULL DEFAULT '',
  trigger TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'QUEUED' CHECK (status IN ('QUEUED','SENT','SKIPPED','FAILED')),
  note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  sent_at TEXT
);

CREATE TABLE IF NOT EXISTS sanctions_list_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  list_name TEXT NOT NULL,
  name_upper TEXT NOT NULL,
  source_ref TEXT NOT NULL DEFAULT '',
  imported_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (list_name, name_upper)
);

CREATE TABLE IF NOT EXISTS retention_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  record_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  action TEXT NOT NULL,
  approved_by INTEGER REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS incidents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ref TEXT NOT NULL UNIQUE,
  kind TEXT NOT NULL CHECK (kind IN ('INCIDENT','DATA_REQUEST')),
  subtype TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'NORMAL' CHECK (severity IN ('LOW','NORMAL','HIGH','CRITICAL')),
  subject TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL,
  owner_role TEXT NOT NULL DEFAULT 'COMPLIANCE_MLRO',
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN','IN_PROGRESS','CLOSED')),
  opened_at TEXT NOT NULL DEFAULT (datetime('now')),
  due_at TEXT NOT NULL,
  closed_at TEXT,
  closure_ref TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS partner_payouts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  settlement_id INTEGER NOT NULL REFERENCES commission_settlements(id),
  amount_fils INTEGER NOT NULL CHECK (amount_fils > 0),
  payment_ref TEXT NOT NULL UNIQUE,
  approval_ref TEXT NOT NULL,
  approved_by INTEGER REFERENCES users(id),
  paid_by INTEGER REFERENCES users(id),
  paid_at TEXT NOT NULL DEFAULT (datetime('now')),
  reversal_ref TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS public_holidays (
  day TEXT PRIMARY KEY,
  name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS go_live_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  area TEXT NOT NULL,
  item TEXT NOT NULL UNIQUE,
  owner TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN','DONE','NOT_APPLICABLE')),
  evidence TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS recycle_bin_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  record_title TEXT NOT NULL,
  snapshot_json TEXT NOT NULL DEFAULT '{}',
  delete_reason TEXT NOT NULL,
  requested_by_user_id INTEGER REFERENCES users(id),
  requested_by_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','APPROVED_DELETED','REJECTED_RESTORED')),
  owner_notes TEXT NOT NULL DEFAULT '',
  decided_by_user_id INTEGER REFERENCES users(id),
  decided_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS manager_admin_decisions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  decision_ref TEXT NOT NULL UNIQUE,
  subject TEXT NOT NULL,
  category TEXT NOT NULL,
  reason TEXT NOT NULL,
  amount_fils INTEGER NOT NULL DEFAULT 0,
  submitted_by_user_id INTEGER REFERENCES users(id),
  submitted_by_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','APPROVED','REJECTED')),
  owner_comment TEXT NOT NULL DEFAULT '',
  decided_by_user_id INTEGER REFERENCES users(id),
  decided_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS deal_withdrawals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  withdrawal_ref TEXT NOT NULL UNIQUE,
  deal_id INTEGER REFERENCES deals(id) ON DELETE SET NULL,
  client_name TEXT NOT NULL,
  department TEXT NOT NULL DEFAULT 'READY_SECONDARY' CHECK (department IN ('READY_SECONDARY','OFFPLAN_HANDOVER','BUYOUT_COMMERCIAL')),
  withdrawal_stage TEXT NOT NULL DEFAULT 'FOL_ISSUED',
  withdrawal_reason TEXT NOT NULL,
  collected_fee_fils INTEGER NOT NULL DEFAULT 0,
  incurred_cost_fils INTEGER NOT NULL DEFAULT 0,
  refundable_fils INTEGER NOT NULL DEFAULT 0,
  payment_channel TEXT NOT NULL DEFAULT 'Betterway Company Bank Account (AED/FX)',
  status TEXT NOT NULL DEFAULT 'PENDING_OWNER' CHECK (status IN ('PENDING_MANAGER','PENDING_OWNER','APPROVED_REFUNDED','REJECTED')),
  manager_notes TEXT NOT NULL DEFAULT '',
  owner_notes TEXT NOT NULL DEFAULT '',
  approved_by_owner_id INTEGER REFERENCES users(id),
  decided_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS office_attendance_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  employee_name TEXT NOT NULL,
  email TEXT NOT NULL,
  check_in_date TEXT NOT NULL,
  check_in_time_gst TEXT NOT NULL,
  shift_name TEXT NOT NULL,
  is_late INTEGER NOT NULL DEFAULT 0 CHECK (is_late IN (0,1)),
  late_minutes INTEGER NOT NULL DEFAULT 0,
  qr_stand_code TEXT NOT NULL DEFAULT 'BW-RECEPTION-STAND-DXB-1',
  network_ssid TEXT NOT NULL DEFAULT 'Betterway-Office-5G',
  device_id TEXT NOT NULL DEFAULT 'WEB-BROWSER',
  status TEXT NOT NULL DEFAULT 'ON_TIME' CHECK (status IN ('ON_TIME','LATE','HOLIDAY_CLIENT_VISIT')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS late_contemptor_alerts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  employee_name TEXT NOT NULL,
  email TEXT NOT NULL,
  late_count_7d INTEGER NOT NULL,
  window_start_date TEXT NOT NULL,
  window_end_date TEXT NOT NULL,
  alert_status TEXT NOT NULL DEFAULT 'OPEN' CHECK (alert_status IN ('OPEN','ACKNOWLEDGED')),
  notified_owner_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS daily_work_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  employee_name TEXT NOT NULL,
  report_date TEXT NOT NULL,
  calls_count INTEGER NOT NULL DEFAULT 0,
  leads_qualified INTEGER NOT NULL DEFAULT 0,
  site_visits_count INTEGER NOT NULL DEFAULT 0,
  ipas_submitted INTEGER NOT NULL DEFAULT 0,
  summary_notes TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'SUBMITTED' CHECK (status IN ('SUBMITTED','REVIEWED')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS dld_market_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tx_ref TEXT NOT NULL UNIQUE,
  tx_date TEXT NOT NULL,
  area_code TEXT NOT NULL,
  area_name TEXT NOT NULL,
  property_type TEXT NOT NULL,
  transaction_category TEXT NOT NULL,
  size_sqft INTEGER NOT NULL,
  amount_fils INTEGER NOT NULL,
  ppsf_aed INTEGER NOT NULL,
  lender_bank TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS loan_amortization_schedules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  schedule_ref TEXT NOT NULL UNIQUE,
  deal_id INTEGER NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  principal_fils INTEGER NOT NULL,
  tenure_months INTEGER NOT NULL,
  fixed_years INTEGER NOT NULL DEFAULT 3,
  intro_rate_bps INTEGER NOT NULL,
  revert_eibor_bps INTEGER NOT NULL,
  revert_margin_bps INTEGER NOT NULL,
  floor_rate_bps INTEGER NOT NULL DEFAULT 299,
  intro_monthly_emi_fils INTEGER NOT NULL,
  revert_monthly_emi_fils INTEGER NOT NULL,
  total_interest_fils INTEGER NOT NULL,
  total_payable_fils INTEGER NOT NULL,
  first_year_principal_fils INTEGER NOT NULL,
  first_year_interest_fils INTEGER NOT NULL,
  early_settlement_fee_cap_fils INTEGER NOT NULL DEFAULT 1000000,
  schedule_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS credit_risk_profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  deal_id INTEGER NOT NULL UNIQUE REFERENCES deals(id) ON DELETE CASCADE,
  applicant_id INTEGER REFERENCES applicants(id) ON DELETE SET NULL,
  aecb_score INTEGER NOT NULL DEFAULT 740,
  stressed_dbr_bps INTEGER NOT NULL DEFAULT 4200,
  ltv_bps INTEGER NOT NULL DEFAULT 7500,
  employer_tier TEXT NOT NULL DEFAULT 'APPROVED_LISTED',
  bounced_cheques_count INTEGER NOT NULL DEFAULT 0,
  overdue_days INTEGER NOT NULL DEFAULT 0,
  overdue_amount_fils INTEGER NOT NULL DEFAULT 0,
  composite_risk_score INTEGER NOT NULL DEFAULT 82,
  risk_grade TEXT NOT NULL DEFAULT 'AA_STANDARD' CHECK (risk_grade IN ('AAA_PRIME','AA_STANDARD','BBB_WATCH','CCC_HIGH_RISK','D_BLOCKED')),
  dunning_level TEXT NOT NULL DEFAULT 'NONE' CHECK (dunning_level IN ('NONE','REMINDER_7D','FORMAL_DEMAND_15D','CREDIT_HOLD_30D')),
  credit_committee_decision TEXT NOT NULL DEFAULT 'AUTO_APPROVED' CHECK (credit_committee_decision IN ('AUTO_APPROVED','REFER_COMMITTEE','DECLINED_HOLD')),
  risk_notes TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS real_estate_assets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  property_code TEXT NOT NULL UNIQUE,
  deal_id INTEGER REFERENCES deals(id) ON DELETE SET NULL,
  household_id INTEGER REFERENCES households(id) ON DELETE SET NULL,
  registration_type TEXT NOT NULL DEFAULT 'TITLE_DEED' CHECK (registration_type IN ('TITLE_DEED','OQOOD_PRE_TITLE')),
  title_deed_or_oqood_no TEXT NOT NULL,
  dld_plot_no TEXT NOT NULL,
  makani_no TEXT NOT NULL,
  community_name TEXT NOT NULL,
  building_or_project_name TEXT NOT NULL,
  unit_no TEXT NOT NULL,
  property_type TEXT NOT NULL DEFAULT 'VILLA',
  built_up_area_sqft INTEGER NOT NULL,
  purchase_price_fils INTEGER NOT NULL,
  latest_valuation_fils INTEGER NOT NULL,
  annual_service_charge_fils INTEGER NOT NULL DEFAULT 0,
  ejari_annual_rent_fils INTEGER NOT NULL DEFAULT 0,
  gross_yield_bps INTEGER NOT NULL DEFAULT 0,
  net_yield_bps INTEGER NOT NULL DEFAULT 0,
  first_rank_mortgagee_bank TEXT NOT NULL DEFAULT 'Emirates NBD',
  encumbrance_status TEXT NOT NULL DEFAULT 'FIRST_RANK_MORTGAGE' CHECK (encumbrance_status IN ('UNENCUMBERED','FIRST_RANK_MORTGAGE','DEVELOPER_ESCROW_LIEN','RELEASED')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS pdc_cheque_register (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cheque_ref TEXT NOT NULL UNIQUE,
  deal_id INTEGER NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  cheque_type TEXT NOT NULL CHECK (cheque_type IN ('SECURITY_DEPOSIT_10PCT','INSTALLMENT_PDC','AGENCY_FEE_PDC','DLD_MANAGER_CHEQUE','SUBVENTION_CHEQUE')),
  cheque_number TEXT NOT NULL,
  drawer_name TEXT NOT NULL,
  drawer_bank TEXT NOT NULL,
  payee_name TEXT NOT NULL,
  amount_fils INTEGER NOT NULL CHECK (amount_fils > 0),
  maturity_date TEXT NOT NULL,
  vault_status TEXT NOT NULL DEFAULT 'IN_SAFE_VAULT' CHECK (vault_status IN ('IN_SAFE_VAULT','PRESENTED_TO_BANK','CLEARED','BOUNCED_DISHONOURED','RETURNED_TO_CLIENT')),
  bounce_reason TEXT NOT NULL DEFAULT '',
  gl_entry_id INTEGER REFERENCES gl_journal_entries(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_login_events_email_created ON login_events(email, created_at);
CREATE INDEX IF NOT EXISTS idx_staff_devices_user ON staff_devices(user_id, revoked_at);
CREATE INDEX IF NOT EXISTS idx_applicants_household ON applicants(household_id, applicant_role);
CREATE INDEX IF NOT EXISTS idx_applicants_user ON applicants(user_id);
CREATE INDEX IF NOT EXISTS idx_leads_stage_created ON leads(stage, created_at);
CREATE INDEX IF NOT EXISTS idx_leads_advisor ON leads(assigned_advisor_id, stage);
CREATE INDEX IF NOT EXISTS idx_comm_messages_lead ON comm_messages(lead_id, created_at);
CREATE INDEX IF NOT EXISTS idx_comm_messages_deal ON comm_messages(deal_id, created_at);
CREATE INDEX IF NOT EXISTS idx_bank_rate_cards_status ON bank_rate_cards(bank_id, status);
CREATE INDEX IF NOT EXISTS idx_deals_stage_origin ON deals(origin_mode, stage);
CREATE INDEX IF NOT EXISTS idx_deals_household ON deals(household_id);
CREATE INDEX IF NOT EXISTS idx_deals_partner ON deals(partner_agent_id);
CREATE INDEX IF NOT EXISTS idx_deal_submissions_deal ON deal_submissions(deal_id, status);
CREATE INDEX IF NOT EXISTS idx_vault_documents_deal ON vault_documents(deal_id, doc_category);
CREATE INDEX IF NOT EXISTS idx_gl_journal_lines_entry ON gl_journal_lines(journal_entry_id);
CREATE INDEX IF NOT EXISTS idx_gl_journal_lines_account ON gl_journal_lines(account_code);
CREATE INDEX IF NOT EXISTS idx_commission_settlements_status ON commission_settlements(reconciliation_status, partner_payout_status);
CREATE INDEX IF NOT EXISTS idx_tax_invoices_deal ON tax_invoices(deal_id, invoice_type);
CREATE INDEX IF NOT EXISTS idx_vendor_bills_status ON vendor_bills(approval_status, bill_date);
CREATE INDEX IF NOT EXISTS idx_ops_tasks_status_role ON ops_tasks(status, assigned_role, due_at);
CREATE INDEX IF NOT EXISTS idx_attendance_user_date ON office_attendance_logs(user_id, check_in_date);
CREATE INDEX IF NOT EXISTS idx_contemptor_status ON late_contemptor_alerts(alert_status, created_at);
CREATE INDEX IF NOT EXISTS idx_daily_reports_date ON daily_work_reports(report_date, user_id);
CREATE INDEX IF NOT EXISTS idx_dld_tx_date ON dld_market_transactions(tx_date, area_code);
CREATE INDEX IF NOT EXISTS idx_pdc_deal_status ON pdc_cheque_register(deal_id, vault_status);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status, created_at);
`;
