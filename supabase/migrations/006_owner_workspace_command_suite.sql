-- Migration 006: Warda's Workspace & Shabib's Workspace Executive Command Suite
-- Adds:
--   1. forensic_field_reports (GPS-pinned, Owner/Authority-verified Site Visits & Viewings with unit photos, 3rd-party details, pricing & payment stages)
--   2. closing_forensic_dossiers + closing_cheque_ledger (Pin-to-Pin Scratch-to-Handover across Off-Plan, Secondary, Handover, Leasing, Property Management)
--   3. owner_commission_expenses (Agent Commission & Expense Settlement Ledger: Paid/Received/Pending, Cash/BT/Botim, 3rd-Party Agent details)
--   4. Brochure customization & material specs columns on communities, developers, master_properties, property_units
--   5. Seeded UAE Legal & Brokerage Templates (A2A / Form I, LOI, Tenancy Contract, Ejari Pack, NOC Pack, Brokerage & Advisory Agreements)

-- 1. Extend Catalog Tables with Brochure Theme, Materials & Rich Specs
ALTER TABLE public.communities
  ADD COLUMN IF NOT EXISTS brochure_theme_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS materials_spec_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS marketing_details_json JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.developers
  ADD COLUMN IF NOT EXISTS brochure_theme_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS materials_spec_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS marketing_details_json JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.master_properties
  ADD COLUMN IF NOT EXISTS brochure_theme_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS materials_spec_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS marketing_details_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS starting_price_aed NUMERIC(16,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS handover_quarter TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS payment_plan_summary TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS cover_image_url TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT '';

ALTER TABLE public.property_units
  ADD COLUMN IF NOT EXISTS brochure_theme_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS materials_spec_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS marketing_details_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS asking_price_aed NUMERIC(16,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS yearly_rent_aed NUMERIC(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS unit_type TEXT NOT NULL DEFAULT 'Apartment',
  ADD COLUMN IF NOT EXISTS view_label TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS cover_image_url TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT '';

-- 2. Forensic Site Visits & Property Viewing Reports (GPS-Pinned + Authority-Verified)
CREATE TABLE IF NOT EXISTS public.forensic_field_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_no TEXT UNIQUE NOT NULL,
  report_type TEXT NOT NULL CHECK (report_type IN ('Site Visit','Viewing')),
  submitted_by_user_id TEXT NOT NULL REFERENCES public.users(id),
  submitted_by_name TEXT NOT NULL DEFAULT '',
  field_visit_id UUID REFERENCES public.field_visits(id) ON DELETE SET NULL,
  visit_date DATE NOT NULL DEFAULT ((NOW() AT TIME ZONE 'Asia/Dubai')::date),
  community TEXT NOT NULL DEFAULT '',
  building_or_project TEXT NOT NULL DEFAULT '',
  unit_no TEXT NOT NULL DEFAULT '',
  gps_lat DOUBLE PRECISION,
  gps_lng DOUBLE PRECISION,
  gps_accuracy_m INTEGER DEFAULT 0,
  gps_address_label TEXT NOT NULL DEFAULT '',
  verification_status TEXT NOT NULL DEFAULT 'Pending Verification' CHECK (
    verification_status IN ('Pending Verification','Verified','Flagged','Rejected')
  ),
  verified_by_user_id TEXT REFERENCES public.users(id),
  verified_by_name TEXT NOT NULL DEFAULT '',
  verified_at TIMESTAMPTZ,
  verification_notes TEXT NOT NULL DEFAULT '',
  -- Person Met & Owner/Agent Details
  met_person_name TEXT NOT NULL DEFAULT '',
  met_person_role TEXT NOT NULL DEFAULT 'Client' CHECK (
    met_person_role IN ('Owner','Buyer','Tenant','Client','Developer Rep','Bank RM','3rd-Party Agent','Other')
  ),
  met_person_phone TEXT NOT NULL DEFAULT '',
  met_person_email TEXT NOT NULL DEFAULT '',
  owner_or_agent_name TEXT NOT NULL DEFAULT '',
  owner_or_agent_phone TEXT NOT NULL DEFAULT '',
  owner_or_agent_email TEXT NOT NULL DEFAULT '',
  -- 3rd Party Full Details
  is_third_party BOOLEAN NOT NULL DEFAULT FALSE,
  third_party_agency TEXT NOT NULL DEFAULT '',
  third_party_agent_name TEXT NOT NULL DEFAULT '',
  third_party_brn TEXT NOT NULL DEFAULT '',
  third_party_phone TEXT NOT NULL DEFAULT '',
  third_party_email TEXT NOT NULL DEFAULT '',
  -- Commercials & Outcome
  deal_category TEXT NOT NULL DEFAULT 'Secondary' CHECK (
    deal_category IN ('Off-Plan','Secondary','Handover','Leasing','Property Management','Mortgage')
  ),
  asking_price_aed NUMERIC(16,2) NOT NULL DEFAULT 0,
  final_price_aed NUMERIC(16,2) NOT NULL DEFAULT 0,
  yearly_rent_aed NUMERIC(14,2) NOT NULL DEFAULT 0,
  cheques_count INTEGER NOT NULL DEFAULT 0,
  outcome TEXT NOT NULL DEFAULT 'Follow-Up Pending' CHECK (
    outcome IN ('Closed','Not Closed','Follow-Up Pending')
  ),
  not_closed_reason TEXT NOT NULL DEFAULT '',
  next_action_date DATE,
  -- Stage-Wise Payments, Forensic Timeline & Unit Photos
  payment_summary_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  stage_log_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  photos_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  forensic_notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_forensic_reports_date ON public.forensic_field_reports(visit_date DESC);
CREATE INDEX IF NOT EXISTS idx_forensic_reports_submitter ON public.forensic_field_reports(submitted_by_user_id);
CREATE INDEX IF NOT EXISTS idx_forensic_reports_verif ON public.forensic_field_reports(verification_status);

-- 3. Pin-to-Pin Closing Forensic Dossiers (All 5 Tracks: Off-Plan, Secondary, Handover, Leasing, Property Management)
CREATE TABLE IF NOT EXISTS public.closing_forensic_dossiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dossier_no TEXT UNIQUE NOT NULL,
  track TEXT NOT NULL CHECK (
    track IN ('Off-Plan','Secondary','Handover','Leasing','Property Management')
  ),
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'In Progress' CHECK (
    status IN ('In Progress','Ready for Transfer','Handed Over','Closed','On Hold')
  ),
  case_id UUID REFERENCES public.mortgage_cases(id) ON DELETE SET NULL,
  agent_user_id TEXT REFERENCES public.users(id),
  agent_name TEXT NOT NULL DEFAULT '',
  community TEXT NOT NULL DEFAULT '',
  project_name TEXT NOT NULL DEFAULT '',
  unit_no TEXT NOT NULL DEFAULT '',
  -- Client & Counterparty
  client_name TEXT NOT NULL,
  client_phone TEXT NOT NULL DEFAULT '',
  client_email TEXT NOT NULL DEFAULT '',
  client_passport_eid TEXT NOT NULL DEFAULT '',
  counterparty_name TEXT NOT NULL DEFAULT '',
  counterparty_phone TEXT NOT NULL DEFAULT '',
  counterparty_email TEXT NOT NULL DEFAULT '',
  -- 3rd-Party Co-Broker Details
  is_third_party BOOLEAN NOT NULL DEFAULT FALSE,
  third_party_agency TEXT NOT NULL DEFAULT '',
  third_party_agent TEXT NOT NULL DEFAULT '',
  third_party_brn TEXT NOT NULL DEFAULT '',
  third_party_phone TEXT NOT NULL DEFAULT '',
  third_party_email TEXT NOT NULL DEFAULT '',
  -- Financials & Registry Refs
  asking_price_aed NUMERIC(16,2) NOT NULL DEFAULT 0,
  agreed_price_aed NUMERIC(16,2) NOT NULL DEFAULT 0,
  yearly_rent_aed NUMERIC(14,2) NOT NULL DEFAULT 0,
  deposit_aed NUMERIC(14,2) NOT NULL DEFAULT 0,
  dld_or_adm_fee_aed NUMERIC(14,2) NOT NULL DEFAULT 0,
  agency_commission_aed NUMERIC(14,2) NOT NULL DEFAULT 0,
  vat_aed NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_cheques_count INTEGER NOT NULL DEFAULT 0,
  payment_mode TEXT NOT NULL DEFAULT 'Bank Transfer (BT)',
  escrow_or_bank_ref TEXT NOT NULL DEFAULT '',
  ejari_or_oqood_or_deed_ref TEXT NOT NULL DEFAULT '',
  noc_ref TEXT NOT NULL DEFAULT '',
  handover_date DATE,
  keys_and_meters_summary TEXT NOT NULL DEFAULT '',
  -- Pin-to-Pin Ordered Stage Checklist
  stages_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  notes TEXT NOT NULL DEFAULT '',
  created_by TEXT REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_closing_dossiers_track ON public.closing_forensic_dossiers(track);

-- 4. Cheque-by-Cheque & Payment Stage Ledger per Closing Dossier
CREATE TABLE IF NOT EXISTS public.closing_cheque_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dossier_id UUID NOT NULL REFERENCES public.closing_forensic_dossiers(id) ON DELETE CASCADE,
  cheque_no TEXT NOT NULL DEFAULT '',
  bank_name TEXT NOT NULL DEFAULT '',
  payee_name TEXT NOT NULL DEFAULT '',
  payer_name TEXT NOT NULL DEFAULT '',
  purpose TEXT NOT NULL DEFAULT 'Down Payment',
  payment_method TEXT NOT NULL DEFAULT 'Cheque / PDC' CHECK (
    payment_method IN ('Cheque / PDC','Manager Cheque','Bank Transfer (BT)','Cash','Botim','Escrow')
  ),
  amount_aed NUMERIC(16,2) NOT NULL DEFAULT 0,
  cheque_date DATE,
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (
    status IN ('Pending','Received','Deposited','Cleared','Paid','Bounced','Replaced')
  ),
  cleared_date DATE,
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_closing_cheques_dossier ON public.closing_cheque_ledger(dossier_id);

-- 5. Agent Commissions & Agent Expenses Ledger (Paid / Received / Pending · Cash / BT / Botim · 3rd-Party Agent)
CREATE TABLE IF NOT EXISTS public.owner_commission_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_no TEXT UNIQUE NOT NULL,
  entry_type TEXT NOT NULL CHECK (
    entry_type IN ('Commission to Agent','Expense by Agent','Agent Advance','3rd-Party Split')
  ),
  agent_user_id TEXT REFERENCES public.users(id),
  agent_name TEXT NOT NULL,
  deal_ref TEXT NOT NULL DEFAULT '',
  property_label TEXT NOT NULL DEFAULT '',
  track TEXT NOT NULL DEFAULT 'Secondary' CHECK (
    track IN ('Off-Plan','Secondary','Handover','Leasing','Property Management','Mortgage')
  ),
  gross_amount_aed NUMERIC(16,2) NOT NULL DEFAULT 0,
  split_pct NUMERIC(6,2) NOT NULL DEFAULT 100,
  net_amount_aed NUMERIC(16,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (
    status IN ('Pending','Received','Paid')
  ),
  payment_mode TEXT NOT NULL DEFAULT 'Bank Transfer (BT)' CHECK (
    payment_mode IN ('Cash','Bank Transfer (BT)','Botim','Cheque / PDC','Manager Cheque','Other')
  ),
  payment_reference TEXT NOT NULL DEFAULT '',
  entry_date DATE NOT NULL DEFAULT ((NOW() AT TIME ZONE 'Asia/Dubai')::date),
  settled_date DATE,
  expense_category TEXT NOT NULL DEFAULT '',
  -- 3rd-Party Agent Details
  is_third_party BOOLEAN NOT NULL DEFAULT FALSE,
  third_party_agency TEXT NOT NULL DEFAULT '',
  third_party_agent_name TEXT NOT NULL DEFAULT '',
  third_party_brn TEXT NOT NULL DEFAULT '',
  third_party_phone TEXT NOT NULL DEFAULT '',
  third_party_email TEXT NOT NULL DEFAULT '',
  third_party_payment_details TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  created_by TEXT REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_owner_comm_exp_agent ON public.owner_commission_expenses(agent_user_id);
CREATE INDEX IF NOT EXISTS idx_owner_comm_exp_status ON public.owner_commission_expenses(status);

-- 6. Seed Default Settings for Dynamic Verification Authorities & Default Brochure Theme
INSERT INTO public.app_settings (key, value, updated_by)
VALUES
  ('owner:field_verifiers', '{"verifiers": []}'::jsonb, 'USR-01'),
  ('catalog:default_brochure_theme', '{"preset":"navy_gold","primaryHex":"#0A1128","accentHex":"#D4AF37","surfaceHex":"#F8F7F4","inkHex":"#0A1128","coverLayout":"executive_band","headerTagline":"Independent UAE Mortgage & Real Estate Advisory · 24 Partner Banks","footerNote":"Betterway Mortgages LLC · Al Nasr Plaza, Oud Metha, Dubai, UAE · betterwaymortgages.com","showPaymentPlan":true,"showAmenities":true,"showMortgageStrip":true}'::jsonb, 'USR-01')
ON CONFLICT (key) DO NOTHING;

-- 7. Seed 6 UAE Legal, Brokerage & Mortgage Fillable Templates (A2A, LOI, Tenancy, Ejari, NOC, Agreements)
INSERT INTO public.document_templates (id, code, title, category, locale, requires_owner_seal, body_template, status)
VALUES
  (
    'TPL-A2A-FORMI',
    'BW-A2A-FORMI',
    'Agent-to-Agent (A2A / Form I) Co-Brokerage & Commission Protection Agreement',
    'Legal & Brokerage',
    'en',
    TRUE,
    E'AGENT-TO-AGENT (A2A / RERA FORM I) CO-BROKERAGE AGREEMENT\nDate: [Agreement_Date] | Reference: [Reference_No]\n\nPARTY A (Listing / Mortgage Advisory Office):\nCompany: Betterway Mortgages LLC | Office: Al Nasr Plaza, Oud Metha, Dubai, UAE\nRepresented By: [Party_A_Agent_Name] | Email: [Party_A_Email] | Phone: [Party_A_Phone]\n\nPARTY B (Co-Brokering / 3rd-Party Agency):\nAgency Name: [Party_B_Agency_Name] | RERA ORN: [Party_B_ORN]\nAgent Name: [Party_B_Agent_Name] | RERA BRN: [Party_B_BRN]\nMobile: [Party_B_Phone] | Email: [Party_B_Email]\n\nPROPERTY & CLIENT DETAILS:\nCommunity / Project: [Community_Project] | Unit No: [Unit_No]\nClient / Buyer Name: [Client_Name] | Agreed Price / Loan: AED [Deal_Amount_AED]\n\nCOMMISSION SPLIT & PROTECTION TERMS:\n1. Total Gross Commission / Referral Fee: [Total_Commission_Pct]% (AED [Total_Commission_AED]).\n2. Agreed Split: Party A [Party_A_Split_Pct]% | Party B [Party_B_Split_Pct]%.\n3. Settlement Mode: [Payment_Mode] (Corporate Bank Transfer / Verified Account Only) within [Settlement_Days] days of bank disbursal / DLD transfer.\n4. Non-Circumvention: Both parties mutually protect client & seller introductions for 12 months.\n\nSigned for Party A: _____________________   Signed for Party B: _____________________',
    'Active'
  ),
  (
    'TPL-LOI-OFFER',
    'BW-LOI-OFFER',
    'Letter of Intent (LOI) — Property Offer & Mortgage Financing Commitment',
    'Legal & Brokerage',
    'en',
    TRUE,
    E'LETTER OF INTENT (LOI) — OFFER TO PURCHASE / LEASE\nDate: [LOI_Date] | Validity Until: [Validity_Date]\n\nTO (Seller / Landlord / Developer): [Counterparty_Name]\nFROM (Buyer / Tenant): [Client_Full_Name] | Passport / EID: [Client_ID_No]\nContact: [Client_Phone] | Email: [Client_Email]\n\nSUBJECT PROPERTY:\nCommunity: [Community_Name] | Building / Project: [Project_Name] | Unit: [Unit_No] | Size: [Area_SqFt] Sq.Ft\n\nCOMMERCIAL OFFER TERMS:\n- Asking Price / Rent: AED [Asking_Price_AED]\n- Offered Final Price / Rent: AED [Offered_Price_AED]\n- Financing / Payment Mode: [Financing_Mode] (Cash / UAE Mortgage via Betterway Mortgages LLC)\n- Booking Security Deposit: AED [Deposit_AED] (via [Deposit_Payment_Method])\n- Cheques / Instalment Structure: [Cheques_Count] cheque(s) / [Payment_Schedule_Summary]\n- Target Transfer / Move-In Date: [Target_Closing_Date]\n\nSPECIAL CONDITIONS:\n[Special_Conditions]\n\nBuyer / Tenant Signature: _____________________   Seller / Landlord Acceptance: _____________________',
    'Active'
  ),
  (
    'TPL-TENANCY-RERA',
    'BW-TENANCY-RERA',
    'Dubai RERA Unified Residential / Commercial Tenancy Contract',
    'Leasing & Ejari',
    'en',
    TRUE,
    E'DUBAI UNIFIED TENANCY CONTRACT (RERA COMPLIANT)\nContract Date: [Contract_Date] | Ejari Ref: [Ejari_Ref_No]\n\nLANDLORD DETAILS:\nName: [Landlord_Name] | Emirates ID / Passport: [Landlord_ID] | Phone: [Landlord_Phone] | Email: [Landlord_Email]\n\nTENANT DETAILS:\nName: [Tenant_Name] | Emirates ID / Passport: [Tenant_ID] | Phone: [Tenant_Phone] | Email: [Tenant_Email]\n\nLEASED PREMISES:\nCommunity: [Community_Name] | Building: [Building_Name] | Unit No: [Unit_No] | Plot / Makani: [Plot_Makani_No] | Usage: [Property_Usage]\n\nTENANCY PERIOD & RENT:\n- Lease Start: [Lease_Start_Date] to Lease End: [Lease_End_Date]\n- Annual Rent: AED [Annual_Rent_AED] payable in [Cheques_Count] cheque(s)\n- Security Deposit (Refundable): AED [Security_Deposit_AED]\n- Cheque Schedule Details: [Cheque_Details_Summary]\n- Agency / Leasing Fee: AED [Leasing_Fee_AED] (+5% VAT)\n\nADDENDUM & MAINTENANCE TERMS:\n1. Major structural & MEP repairs above AED [Maintenance_Threshold_AED] borne by Landlord; minor maintenance by Tenant.\n2. DEWA, Chiller & Ejari registration borne by Tenant prior to key handover.\n3. Additional Clauses: [Additional_Terms]\n\nLandlord Signature: _____________________   Tenant Signature: _____________________',
    'Active'
  ),
  (
    'TPL-EJARI-PACK',
    'BW-EJARI-PACK',
    'Ejari Registration Pack & Move-In Undertaking Form',
    'Leasing & Ejari',
    'en',
    TRUE,
    E'EJARI REGISTRATION & MOVE-IN UNDERTAKING FORM\nSubmission Date: [Submission_Date] | DLD / Ejari Trustee Center: [Trustee_Center]\n\nPROPERTY & DEED INFORMATION:\nTitle Deed No: [Title_Deed_No] | DEWA Premise No: [DEWA_Premise_No]\nCommunity & Building: [Community_Building] | Unit No: [Unit_No]\n\nLANDLORD: [Landlord_Name] (ID: [Landlord_ID])\nTENANT: [Tenant_Name] (EID: [Tenant_EID], Mobile: [Tenant_Phone], Email: [Tenant_Email])\n\nCONTRACT SUMMARY:\nAnnual Rent: AED [Annual_Rent_AED] | Period: [Lease_Start_Date] to [Lease_End_Date] | Cheques: [Cheques_Count]\nEjari Registration Fee Paid: AED [Ejari_Fee_AED] | Mode: [Payment_Mode]\n\nDOCUMENT CHECKLIST VERIFIED:\n[x] Signed Tenancy Contract  [x] Title Deed Copy  [x] Landlord Passport/EID  [x] Tenant Passport/Visa/EID  [x] Security Deposit Receipt\n\nAuthorised Representative / Applicant Signature: _____________________',
    'Active'
  ),
  (
    'TPL-NOC-PACK',
    'BW-NOC-PACK',
    'No Objection Certificate (NOC) Request — Developer / Bank / Mortgage Transfer',
    'Legal & Brokerage',
    'en',
    TRUE,
    E'OFFICIAL NO OBJECTION CERTIFICATE (NOC) REQUEST & CLEARANCE\nDate: [NOC_Date] | Request Ref: [NOC_Ref_No]\n\nTO: [Developer_Or_Bank_Name] — NOC & Handover Clearance Department\nSUBJECT: Request for [NOC_Type] NOC — [Project_Name], Unit [Unit_No]\n\nCURRENT OWNER / SELLER: [Seller_Name] | Passport / EID: [Seller_ID]\nBUYER / BORROWER: [Buyer_Name] | Passport / EID: [Buyer_ID]\nFINANCING BANK: [Lending_Bank_Name] | Bank FOL Ref: [Bank_FOL_Ref]\n\nFINANCIAL & CLEARANCE DETAILS:\n- Title Deed / Oqood No: [Deed_Or_Oqood_No]\n- Agreed Purchase Price: AED [Agreed_Price_AED] | Approved Mortgage Loan: AED [Approved_Loan_AED]\n- Service Charge Clearance Status: [Service_Charge_Status]\n- NOC Fee: AED [NOC_Fee_AED] (Paid via [Payment_Mode])\n\nKindly issue the official NOC enabling DLD Trustee ownership & mortgage registration. Prepared and coordinated by Betterway Mortgages LLC.\n\nAuthorised Signatory & Corporate Seal: _____________________',
    'Active'
  ),
  (
    'TPL-AGREEMENT-PACK',
    'BW-AGREEMENT-PACK',
    'Client Mortgage Advisory, Zero-Fee Mandate & Property Management Agreement',
    'Agreements',
    'en',
    TRUE,
    E'BETTERWAY MORTGAGES LLC — CLIENT ADVISORY & TRANSACTION MANDATE AGREEMENT\nDate: [Agreement_Date] | Mandate Ref: [Mandate_Ref_No]\n\nADVISORY FIRM: Betterway Mortgages LLC (Al Nasr Plaza, Oud Metha, Dubai, UAE)\nCLIENT FULL NAME: [Client_Full_Name] | Nationality: [Client_Nationality]\nEmirates ID / Passport: [Client_ID_No] | Phone: [Client_Phone] | Email: [Client_Email]\n\nSCOPE OF MANDATE ([Service_Track]):\nProperty: [Community_Project_Unit] | Value: AED [Property_Value_AED] | Financing / Rent: AED [Target_Amount_AED]\n\nKEY TERMS & UAE PDPL / CBUAE DISCLOSURES:\n1. Multi-Bank Advisory: Betterway Mortgages LLC compares offers across 24 UAE banks objectively.\n2. Fee Transparency: Standard residential mortgage advisory fee to Client is AED [Client_Fee_AED] (AED 0 for standard bank-remunerated placements). Any bespoke commercial/management fee is explicitly agreed in writing: [Fee_Schedule_Notes].\n3. Corporate Payment Protection: All payments must be made strictly to Betterway Mortgages LLC corporate bank accounts or official DLD/Bank entities.\n4. Data Protection: Client KYC & bank statements are stored encrypted under UAE Federal Decree-Law No. 45 of 2021 (PDPL).\n\nClient Signature: _____________________   Betterway Executive Sign-Off: _____________________',
    'Active'
  )
ON CONFLICT (code) DO NOTHING;

-- 8. Enable Row Level Security + Service Policy on All New Tables
DO $$
DECLARE
  t TEXT;
  new_tables TEXT[] := ARRAY[
    'forensic_field_reports',
    'closing_forensic_dossiers',
    'closing_cheque_ledger',
    'owner_commission_expenses'
  ];
BEGIN
  FOREACH t IN ARRAY new_tables LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = t AND policyname = 'bw_service_all'
    ) THEN
      EXECUTE format(
        'CREATE POLICY bw_service_all ON public.%I FOR ALL TO authenticated USING (public.is_bw_service()) WITH CHECK (public.is_bw_service());',
        t
      );
    END IF;
  END LOOP;
END $$;

-- 9. Add forensic_field_reports to Realtime Publication for Instant Owner Oversight
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'forensic_field_reports'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.forensic_field_reports;
  END IF;
END $$;
