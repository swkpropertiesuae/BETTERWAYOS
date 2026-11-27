-- ============================================================================
-- Betterway Mortgages OS v3 — Migration 007
-- 100% UAE CBUAE Mortgage-Exclusive Internal Operations Restructuring
-- Removes all real-estate brokerage / leasing / viewing / site-visit / tenancy
-- jargon, tracks, and templates and replaces them with dedicated UAE mortgage
-- advisory workflows, field meeting types, 5 mortgage closing tracks,
-- advisor DSA commission/expense types, and 6 fillable UAE mortgage agreements.
-- ============================================================================

-- 1. Update forensic_field_reports constraints to 100% UAE Mortgage Field Meetings
ALTER TABLE public.forensic_field_reports
  DROP CONSTRAINT IF EXISTS forensic_field_reports_report_type_check,
  DROP CONSTRAINT IF EXISTS forensic_field_reports_met_person_role_check,
  DROP CONSTRAINT IF EXISTS forensic_field_reports_deal_category_check;

UPDATE public.forensic_field_reports SET report_type = 'Client Consultation' WHERE report_type IN ('Site Visit', 'Viewing');
UPDATE public.forensic_field_reports SET met_person_role = 'Borrower / Applicant' WHERE met_person_role IN ('Owner', 'Buyer', 'Tenant', 'Client');
UPDATE public.forensic_field_reports SET met_person_role = 'Bank RM / Credit Officer' WHERE met_person_role = 'Bank RM';
UPDATE public.forensic_field_reports SET met_person_role = 'Developer NOC Officer' WHERE met_person_role = 'Developer Rep';
UPDATE public.forensic_field_reports SET met_person_role = 'RERA Introducer / Referrer' WHERE met_person_role = '3rd-Party Agent';
UPDATE public.forensic_field_reports SET deal_category = 'Ready Home Purchase' WHERE deal_category IN ('Secondary', 'Mortgage');
UPDATE public.forensic_field_reports SET deal_category = 'Off-Plan Handover Finance' WHERE deal_category IN ('Off-Plan', 'Handover');
UPDATE public.forensic_field_reports SET deal_category = 'Equity Release' WHERE deal_category IN ('Leasing', 'Property Management');

ALTER TABLE public.forensic_field_reports
  ALTER COLUMN report_type SET DEFAULT 'Client Consultation',
  ALTER COLUMN met_person_role SET DEFAULT 'Borrower / Applicant',
  ALTER COLUMN deal_category SET DEFAULT 'Ready Home Purchase',
  ADD CONSTRAINT forensic_field_reports_report_type_check CHECK (
    report_type IN (
      'Client Consultation',
      'Bank RM & FOL Signing',
      'Valuation Inspection',
      'Developer SOA & NOC',
      'DLD Trustee Transfer'
    )
  ),
  ADD CONSTRAINT forensic_field_reports_met_person_role_check CHECK (
    met_person_role IN (
      'Borrower / Applicant',
      'Co-Borrower / Spouse',
      'Bank RM / Credit Officer',
      'Bank Valuer',
      'Developer NOC Officer',
      'DLD Trustee Officer',
      'RERA Introducer / Referrer',
      'Other'
    )
  ),
  ADD CONSTRAINT forensic_field_reports_deal_category_check CHECK (
    deal_category IN (
      'Ready Home Purchase',
      'Off-Plan Handover Finance',
      'Buyout & Refinance',
      'Equity Release',
      'Non-Resident Mortgage',
      'Commercial & SME Finance'
    )
  );

-- 2. Update closing_forensic_dossiers tracks to 5 Authentic UAE Mortgage Closing Tracks
ALTER TABLE public.closing_forensic_dossiers
  DROP CONSTRAINT IF EXISTS closing_forensic_dossiers_track_check,
  DROP CONSTRAINT IF EXISTS closing_forensic_dossiers_status_check;

UPDATE public.closing_forensic_dossiers SET track = 'Ready Purchase Mortgage' WHERE track = 'Secondary';
UPDATE public.closing_forensic_dossiers SET track = 'Off-Plan Handover Finance' WHERE track IN ('Off-Plan', 'Handover');
UPDATE public.closing_forensic_dossiers SET track = 'Buyout & Refinance' WHERE track = 'Leasing';
UPDATE public.closing_forensic_dossiers SET track = 'Equity Release' WHERE track = 'Property Management';
UPDATE public.closing_forensic_dossiers SET status = 'Disbursed' WHERE status = 'Handed Over';

ALTER TABLE public.closing_forensic_dossiers
  ALTER COLUMN track SET DEFAULT 'Ready Purchase Mortgage',
  ADD CONSTRAINT closing_forensic_dossiers_track_check CHECK (
    track IN (
      'Ready Purchase Mortgage',
      'Off-Plan Handover Finance',
      'Buyout & Refinance',
      'Equity Release',
      'Non-Resident & Commercial'
    )
  ),
  ADD CONSTRAINT closing_forensic_dossiers_status_check CHECK (
    status IN ('In Progress', 'FOL Signed', 'Ready for Trustee', 'Disbursed', 'Closed', 'On Hold')
  );

-- 3. Update owner_commission_expenses to 100% UAE Mortgage Advisor DSA & RERA Referral Types
ALTER TABLE public.owner_commission_expenses
  DROP CONSTRAINT IF EXISTS owner_commission_expenses_entry_type_check,
  DROP CONSTRAINT IF EXISTS owner_commission_expenses_track_check;

UPDATE public.owner_commission_expenses SET entry_type = 'Advisor DSA Commission' WHERE entry_type = 'Commission to Agent';
UPDATE public.owner_commission_expenses SET entry_type = 'Advisor Case Expense' WHERE entry_type = 'Expense by Agent';
UPDATE public.owner_commission_expenses SET entry_type = 'Advisor Draw / Advance' WHERE entry_type = 'Agent Advance';
UPDATE public.owner_commission_expenses SET entry_type = 'RERA Partner Referral Split' WHERE entry_type = '3rd-Party Split';
UPDATE public.owner_commission_expenses SET track = 'Ready Purchase Mortgage' WHERE track IN ('Secondary', 'Mortgage');
UPDATE public.owner_commission_expenses SET track = 'Off-Plan Handover Finance' WHERE track IN ('Off-Plan', 'Handover');
UPDATE public.owner_commission_expenses SET track = 'Buyout & Refinance' WHERE track = 'Leasing';
UPDATE public.owner_commission_expenses SET track = 'Equity Release' WHERE track = 'Property Management';

ALTER TABLE public.owner_commission_expenses
  ALTER COLUMN entry_type SET DEFAULT 'Advisor DSA Commission',
  ALTER COLUMN track SET DEFAULT 'Ready Purchase Mortgage',
  ADD CONSTRAINT owner_commission_expenses_entry_type_check CHECK (
    entry_type IN (
      'Advisor DSA Commission',
      'Advisor Case Expense',
      'Advisor Draw / Advance',
      'RERA Partner Referral Split'
    )
  ),
  ADD CONSTRAINT owner_commission_expenses_track_check CHECK (
    track IN (
      'Ready Purchase Mortgage',
      'Off-Plan Handover Finance',
      'Buyout & Refinance',
      'Equity Release',
      'Non-Resident & Commercial'
    )
  );

-- 4. Update DEP-08 Department & Default Brochure Tagline to 100% Mortgage Advisory
UPDATE public.departments
SET code = 'EQTY',
    name = 'Portfolio & Equity Release',
    description = 'Mortgage portfolio refinancing, equity release structuring, off-plan handover finance & rate-reset retention desk.'
WHERE id = 'DEP-08';

UPDATE public.app_settings
SET value = jsonb_set(
      COALESCE(value, '{}'::jsonb),
      '{headerTagline}',
      '"Independent UAE Mortgage Advisory · 24 Conventional & Islamic Partner Banks · Zero Client Broker Fee"'::jsonb,
      true
    ),
    updated_at = now()
WHERE key = 'catalog:default_brochure_theme';

-- 5. Archive any legacy real-estate templates & seed 6 Dedicated UAE CBUAE Mortgage Fillable Templates
UPDATE public.document_templates
SET status = 'Archived', updated_at = now()
WHERE id IN ('TPL-A2A-FORMI','TPL-LOI-OFFER','TPL-TENANCY-RERA','TPL-EJARI-PACK','TPL-NOC-PACK','TPL-AGREEMENT-PACK');

INSERT INTO public.document_templates (id, code, title, category, locale, requires_owner_seal, body_template, status)
VALUES
  (
    'TPL-07',
    'BW-MANDATE-KFS',
    'CBUAE Key Facts Statement (KFS) & Zero-Broker-Fee Mortgage Mandate',
    'CBUAE Mortgage Mandate',
    'en',
    true,
    E'BETTERWAY MORTGAGES LLC — CBUAE KEY FACTS STATEMENT (KFS) & CLIENT ADVISORY MANDATE\nAl Nasr Plaza, Oud Metha, Dubai, United Arab Emirates\n\nDate: [Mandate_Date] | Case Reference: [Case_Code]\n\nBORROWER DETAILS\nPrimary Applicant: [Borrower_Full_Name] | Emirates ID / Passport: [Borrower_ID_Number]\nMobile: [Borrower_Phone] | Email: [Borrower_Email]\nResidency & Profile: [Residency_And_Employment_Profile] | Monthly Income: AED [Monthly_Income_AED]\n\nFINANCING STRUCTURE\nEmirate & Community: [Community_Name] | Project & Unit: [Project_And_Unit]\nEstimated Property Value: AED [Property_Value_AED] | Requested Mortgage: AED [Requested_Loan_AED]\nTarget LTV: [Target_LTV_Pct]% | Tenure: [Loan_Tenure_Years] Years | Structure: [Conventional_Or_Islamic]\nStressed CBUAE DBR Check (Max 50%): [Stressed_DBR_Pct]%\n\nCBUAE DISCLOSURES & ZERO-UPFRONT BROKER FEE\n1. Betterway Mortgages LLC compares up to 24 UAE lending banks independently and charges AED 0 upfront brokerage fee to standard residential borrowers; remuneration is settled by the lending bank via DSA agreement upon successful disbursal.\n2. Under Central Bank of the UAE (CBUAE) Mortgage Regulations, early settlement / partial settlement fees are capped at 1% of the outstanding loan balance or AED 10,000 (+5% VAT), whichever is lower.\n3. Bank valuation fees (approx. AED 2,500–3,150 + VAT), bank processing fees, DLD mortgage registration (0.25% of loan + AED 290), and Trustee fees are payable directly to the respective lender/government authority.\n\nBorrower Signature: ___________________________     Betterway Advisor: [Advisor_Name]',
    'Active'
  ),
  (
    'TPL-08',
    'BW-PREAPP-PACK',
    '24-Bank Mortgage Pre-Approval (DIP) Comparison & Cash-to-Close Schedule',
    'Pre-Approval & Quotes',
    'en',
    false,
    E'BETTERWAY MORTGAGES LLC — 24-BANK SHORTLIST & CASH-TO-CLOSE SCHEDULE\nPrepared for: [Borrower_Full_Name] | Date: [Quote_Date] | Case Ref: [Case_Code]\n\nPROPERTY & LOAN SUMMARY\nProperty: [Project_And_Unit], [Community_Name]\nPurchase / Valuation Price: AED [Property_Value_AED] | Loan Amount: AED [Requested_Loan_AED] ([LTV_Pct]% LTV)\nTenure: [Tenure_Years] Years | Facility Type: [Conventional_Or_Islamic]\n\nSHORTLISTED LENDER COMPARISON\nOption 1 — [Bank_1_Name]: [Bank_1_Fixed_Rate_Pct]% Fixed ([Bank_1_Fixed_Years]Y) | Revert: 3M EIBOR + [Bank_1_Margin_Pct]% | Est. EMI: AED [Bank_1_EMI_AED]/mo\nOption 2 — [Bank_2_Name]: [Bank_2_Fixed_Rate_Pct]% Fixed ([Bank_2_Fixed_Years]Y) | Revert: 3M EIBOR + [Bank_2_Margin_Pct]% | Est. EMI: AED [Bank_2_EMI_AED]/mo\nOption 3 — [Bank_3_Name]: [Bank_3_Fixed_Rate_Pct]% Fixed ([Bank_3_Fixed_Years]Y) | Revert: 3M EIBOR + [Bank_3_Margin_Pct]% | Est. EMI: AED [Bank_3_EMI_AED]/mo\n\nESTIMATED CASH-TO-CLOSE BREAKDOWN (AED)\nDown Payment Equity: AED [Down_Payment_AED]\nDLD Transfer Fee (4% + AED 580): AED [DLD_Transfer_Fee_AED]\nDLD Mortgage Registration (0.25% of Loan + AED 290): AED [DLD_Mortgage_Reg_AED]\nDLD Trustee Fee + Valuation + Bank Processing: AED [Bank_And_Trustee_Fees_AED]\nBetterway Client Broker Fee: AED 0 (Zero Broker Fee)\nTotal Estimated Cash Required: AED [Total_Cash_To_Close_AED]\n\nPrepared by: [Advisor_Name] · Betterway Mortgages LLC, Oud Metha, Dubai',
    'Active'
  ),
  (
    'TPL-09',
    'BW-REFERRAL-DSA',
    'RERA Partner Mortgage Referral & Corporate Commission Split Agreement',
    'Partner Referral & DSA',
    'en',
    true,
    E'BETTERWAY MORTGAGES LLC — RERA PARTNER MORTGAGE REFERRAL AGREEMENT\nAl Nasr Plaza, Oud Metha, Dubai, UAE\n\nAgreement Date: [Agreement_Date] | Referral Ref: [Referral_Code]\n\nPARTIES\nMortgage Brokerage: Betterway Mortgages LLC, Dubai, UAE (Authorized Signatory: [Betterway_Signatory])\nReferring Partner Brokerage: [Partner_Agency_Name] (RERA ORN: [Partner_ORN_Number])\nReferring Broker Representative: [Partner_Broker_Name] (RERA BRN: [Partner_BRN_Number])\nPartner Phone: [Partner_Phone] | Partner Email: [Partner_Email]\n\nREFERRED BORROWER & TRANSACTION\nBorrower Name: [Borrower_Full_Name] | Target Property: [Project_And_Unit], [Community_Name]\nEstimated Mortgage Loan: AED [Loan_Amount_AED] | Lending Bank: [Lending_Bank_Name]\n\nCORPORATE COMMISSION SPLIT & CBUAE COMPLIANCE\n1. Agreed Referral Share: [Referral_Split_Pct]% of Net Bank DSA Commission received by Betterway Mortgages LLC (plus 5% UAE VAT upon receipt of valid FTA Tax Invoice).\n2. STRICT CORPORATE-ACCOUNT-ONLY PAYOUT: Commission payouts are disbursed exclusively to the verified corporate bank account matching the Partner Brokerage RERA ORN ([Partner_Corporate_Bank] · IBAN: [Partner_Corporate_IBAN]). Zero payouts to personal bank accounts.\n3. Settlement occurs within 7 business days after cleared DSA commission receipt from the lending bank and expiry of any bank clawback/disbursal verification checks.\n\nBetterway Mortgages LLC: _____________________     Partner Brokerage Stamp: _____________________',
    'Active'
  ),
  (
    'TPL-10',
    'BW-NOC-SOA',
    'Developer Statement of Account (SOA) & Mortgage e-NOC Request Letter',
    'Bank & Developer NOC',
    'en',
    true,
    E'BETTERWAY MORTGAGES LLC — OFFICIAL SOA & MORTGAGE e-NOC REQUEST\nDate: [Request_Date] | Betterway Case Ref: [Case_Code]\n\nTO: Customer Care / Escrow & Handover Department — [Developer_Name]\nSUBJECT: Request for Updated Statement of Account (SOA) & Mortgage e-NOC — [Project_Name], Unit [Unit_Number]\n\nDear Sir / Madam,\n\nWe write on behalf of our client, [Borrower_Full_Name] (Emirates ID / Passport: [Borrower_ID_Number]), who has obtained Final Offer Letter (FOL) mortgage approval from [Lending_Bank_Name] for the financed purchase / handover settlement of:\n- Master Community & Project: [Community_Name] — [Project_Name]\n- Unit Number / Oqood / Title Deed Ref: [Unit_Number] ([Oqood_Or_Deed_No])\n- Approved Mortgage Facility: AED [Approved_Loan_AED]\n\nKindly issue:\n1. Updated Developer Statement of Account (SOA) reflecting paid milestones and final handover balance payable via Bank Manager''s Cheque / Escrow Transfer.\n2. Developer Mortgage e-NOC and Service Charge Clearance procedure for DLD Trustee mortgage registration.\n\nBank RM Contact: [Bank_RM_Name] ([Bank_RM_Email] / [Bank_RM_Phone])\nBetterway Operations Desk: [Operations_Contact] · Al Nasr Plaza, Oud Metha, Dubai',
    'Active'
  ),
  (
    'TPL-11',
    'BW-BUYOUT-LIAB',
    'Liability Letter Request & Mortgage Buyout / Refinance Authorization',
    'Buyout & Equity Release',
    'en',
    true,
    E'BETTERWAY MORTGAGES LLC — MORTGAGE BUYOUT & LIABILITY LETTER AUTHORIZATION\nDate: [Authorization_Date] | Case Ref: [Case_Code]\n\nTO: Mortgage Retention & Settlements Department — [Current_Bank_Name]\nFROM / BORROWER: [Borrower_Full_Name] | Emirates ID: [Borrower_Emirates_ID]\nExisting Mortgage Account / Loan No.: [Existing_Loan_Number]\nMortgaged Property: [Project_And_Unit], [Community_Name] | Title Deed No.: [Title_Deed_No]\n\nAUTHORIZATION & LIABILITY LETTER REQUEST\n1. I hereby request an official Liability Letter addressed to [New_Lending_Bank_Name] confirming the exact outstanding principal, accrued profit/interest, and statutory early settlement fee.\n2. Per CBUAE Mortgage Regulations, early settlement fees are capped at 1% of remaining principal or AED 10,000 (+5% VAT), whichever is lower.\n3. I authorize Betterway Mortgages LLC (Advisor: [Advisor_Name]) to coordinate Liability Letter collection, bank-to-bank settlement Manager''s Cheque delivery, DLD mortgage release, and new mortgage registration on my behalf.\n\nCurrent Rate: [Current_Rate_Pct]% → Proposed New Rate: [New_Rate_Pct]% | Est. Annual Savings: AED [Annual_Savings_AED]\n\nBorrower Signature: ___________________________     Date: [Authorization_Date]',
    'Active'
  ),
  (
    'TPL-12',
    'BW-FOL-TRUSTEE',
    'Final Offer Letter (FOL) Sign-Off & DLD Trustee Disbursal Pack',
    'Disbursal & Trustee',
    'en',
    true,
    E'BETTERWAY MORTGAGES LLC — FINAL OFFER LETTER (FOL) & DLD TRUSTEE DISBURSAL PACK\nDate: [Trustee_Date] | Case Ref: [Case_Code] | Trustee Office: [DLD_Trustee_Office]\n\nBORROWER & LENDER SUMMARY\nBorrower: [Borrower_Full_Name] | Phone: [Borrower_Phone] | EID: [Borrower_Emirates_ID]\nLending Bank: [Lending_Bank_Name] | Bank RM: [Bank_RM_Name] | FOL Ref: [FOL_Reference_No]\nProperty: [Project_And_Unit], [Community_Name] | Valuation: AED [Valuation_Amount_AED]\nApproved Loan: AED [Approved_Loan_AED] | Rate: [Approved_Rate_Pct]% | Tenure: [Tenure_Years] Years\n\nPRE-DISBURSAL & MANAGER''S CHEQUE VERIFICATION\n[x] Signed Final Offer Letter (FOL) & CBUAE KFS Verified\n[x] Life Insurance / Takaful & Property Insurance Assigned to [Lending_Bank_Name]\n[x] Developer e-NOC & Service Charge Clearance Confirmed (NOC Ref: [Developer_NOC_Ref])\n[x] Seller Liability / Escrow Manager''s Cheque: AED [Bank_Disbursal_Cheque_AED] (Chq #: [Bank_Cheque_No])\n[x] Borrower Equity / Balance Manager''s Cheque: AED [Borrower_Equity_Cheque_AED] (Chq #: [Equity_Cheque_No])\n[x] DLD 4% Transfer + 0.25% Mortgage Registration Fee Ready: AED [Total_DLD_Fees_AED]\n\nOperations Sign-Off: [Operations_Officer]     Owner Seal: Warda Kapadia / Shabib Siraj',
    'Active'
  )
ON CONFLICT (id) DO UPDATE SET
  code = EXCLUDED.code,
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  body_template = EXCLUDED.body_template,
  requires_owner_seal = EXCLUDED.requires_owner_seal,
  status = 'Active',
  updated_at = now();
