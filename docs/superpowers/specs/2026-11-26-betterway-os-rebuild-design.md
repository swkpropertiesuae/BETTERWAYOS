# Betterway Mortgages OS v3 — Full Rebuild & Website Interconnect Design Specification

**Date:** 26 November 2026  
**Status:** Ready for Approval  
**Target Repositories:**
- **Operating System:** `https://github.com/swkpropertiesuae/BETTERWAYOS` (`C:\Users\shamh\.gemini\antigravity\scratch\Betterwayos`)
- **Public Website:** `https://github.com/swkpropertiesuae/BETTERWAYMORTGAGES` (`C:\Users\shamh\.gemini\antigravity\scratch\BetterwayMortgages`)

**Cloud Stack:** Vercel (Next.js 15 App Router) + **Supabase** (Postgres + Private Storage + Realtime) under Supabase organization `propertiesswk-tech` (`wqseorpcqezxfbfclpdb`).

---

## 1. Intent & Why

Betterway Mortgages LLC (Al Nasr Plaza, Plot 319-310, Oud Metha Road, Oud Metha, Dubai, UAE) requires a ground-up rebuild of its Operating System so that **Owner, Founder & Managing Director Warda Kapadia** and **Executive Director Shabib Siraj** can run every function of the brokerage from a single desktop-grade, app-icon OS permanently synchronized two-way with `betterwaymortgages.com`.

This rebuild resolves four structural defects in `BETTERWAYOS` v2.0 (`origin/main` @ `eae1833`):
1. **Swapped leadership & stale roster:** Swapped Warda and Shabib's titles, omitted Warda's surname and both executive portraits, hardcoded only `"Shabib's Corner"`, and kept outdated titles for Elton, Nusrik, and Reshma.
2. **Ephemeral `/tmp` SQLite on Vercel:** Wiped leads, vault records, offers, and edits on every serverless cold start or redeploy.
3. **Missing CORE Master Log & Admin approval gate:** Lacked the 22-registry headquarters Master Log and the rule that Office Admin additions/edits require Owner approval before committing.
4. **One-way disconnected website:** `betterwaymortgages.com` pushed enquiries to `/api/v1/intake/leads`, while Hot Offers, rates, banners, and team profiles remained static files unaffected by OS Website Studio.

---

## 2. Goals, Non-Goals & Anti-Goals

### Goals
- **100% Equal Co-Owner Authority:** Warda Kapadia and Shabib Siraj share identical `OWNER` permissions, dynamically rendered as **Warda's Place** + **Warda's Client — Privacy Fast Track** (for Warda) and **Shabib's Corner** + **Shabib's Client — Privacy Fast Track** (for Shabib).
- **Tiered Owner Sign-Off Governance:** Standard Owner approvals (Admin Master Log requests, Corporate Seals, HR Leave) require **1-of-2** Owner sign-off; high-risk actions (**Permanent Delete Bin purges** and **Commission/Partner Payouts**) require **2-of-2 dual sign-off** (both Warda AND Shabib).
- **Zero-Leak Owner Privacy & Segregated Fast-Track Ledger:** Privacy Fast Track jobs, documents, and custom VAT invoices live in a strictly Owner-only ledger (100% invisible to all non-Owners), paired with an Owner-only **Consolidated P&L & UAE VAT 201** view combining standard + fast-track totals for FTA filing.
- **Single Source of Truth (22-Registry CORE Master Log):** All core reference data (Communities, Developers, Oud Metha Office Wi-Fi/Geofence/Hikvision, Departments, FX, VAT, COA, Payment Terms, 24 Banks/APL, Staff, RERA Brokers, Templates, Case Studies) is centralized; Owners write directly, Office Admin writes to an approval queue, and staff consume read-only lookups.
- **100% Daily Enquiry Capture & 12-Step Mortgage Pipeline:** Every enquiry across Website, Online Chat, WhatsApp, Bayut, Property Finder, Calls, Walk-ins, and Referrals is recorded with immutable Dubai GST date-stamping and visible stage counts across Steps 1 → 12.
- **Physical + Digital Office Attendance with Live Group Check-In:** Integrates the Al Nasr Plaza **Hikvision door fingerprint terminal** AND **20-second rotating Office QR + Oud Metha WAN IP/Geofence**, broadcasting live check-in cards automatically to `#attendance-checkin` in the company team group.
- **True Two-Way Website & Social Connection:** Changes in OS Website Studio publish live to `betterwaymortgages.com` via shared Supabase CMS tables + HMAC-signed Next.js cache revalidation; website forms and portal uploads flow straight into OS Step 01 and Private Storage.
- **PII-Shielded AI Underwriting & Case-Study Engine:** Pre-trained on Betterway's 15-year underwriting rules (`Mortgage presentation-Landscape.pdf`, `Betterway Forensic Underwriting & Client Advisory Dossier (38 Units).pdf`, `CTO Calculation_.xlsx`, `Average Balance_.xlsx`) with an in-app **Case-Study Training Library** so the brokerage's institutional knowledge grows with every closed case.

### Non-Goals
- Direct API integrations into UAE banks' private internal origination portals (requires institutional bank contracts; OS tracks submissions, RM contacts, refs, SLAs, and proof PDFs).
- Direct live AECB credit bureau API pull or UAE PASS government OAuth onboarding (manual PDF upload + structured liability tracking + PDPL audit trail ship out-of-the-box; connectors remain cleanly pluggable).
- Separate native Swift/Kotlin mobile apps (OS ships as a responsive installable PWA for mobile field GPS, QR attendance, and deal updates; a thin Capacitor wrapper can point to the live URL later if an Android `.apk` is requested).

### Anti-Goals (Hard Failure Conditions)
- Any data loss on Vercel redeploy or cold start (zero `/tmp` SQLite in production).
- Any non-Owner (including Office Admin, Team Manager, or Operations Manager) viewing, searching, or querying Privacy Fast Track records or Owner-only ledger entries.
- Any Office Admin edit to CORE Master Log reference tables taking effect without Owner approval, or any Admin modification to RBAC/geofence/salaries.
- Any personal bank account being accepted for receivables or outgoing commission payouts (strict Corporate-Account-Only guard).
- Any SWK Properties branding appearing on public `betterwaymortgages.com` pages (SWK exists strictly as an internal referral partner record inside OS Partner Hub).

---

## 3. Approaches Considered & Selected

| Approach | Summary | Trade-offs | Decision |
| :--- | :--- | :--- | :---: |
| **Approach 1: Clean Rebuild on Next.js 15 App Router + Supabase (Postgres, Private Storage, Realtime) on Vercel** | Rebuild `BETTERWAYOS` on Next.js 15 matching `BETTERWAYMORTGAGES`; each domain (Master Log, Pipeline, Vault, Hikvision webhook, Bulk AI, Website CMS, AI Case-Study Engine) runs in isolated Vercel serverless routes backed by Supabase Postgres, Private Storage, and Realtime. | Full clean rebuild of `BETTERWAYOS` routes; mobile runs as responsive PWA. Best Vercel reliability, zero single-function timeout/size bottlenecks, strict server middleware, unified stack with website. | **SELECTED** |
| **Approach 2: Evolve Vite 7 + Express 5 SPA (`api/index.ts`) + Capacitor Mobile + Supabase** | Keep existing Vite/Express/Capacitor structure and swap SQLite for Supabase. | Preserves existing Capacitor static bundle, but squeezes all backend routes (AI, OCR, Excel, Vault, Hikvision) through one Vercel Express function with higher cold-start and bundle risk. | Rejected |

---

## 4. Governance, Team Roster, RBAC & Data Scoping

### 4.1 Equal Co-Owners (`OWNER` Role — 100% Identical Authority)

| Emp Code | Name | Arabic | Official Title | Department | Email | Personal Executive App | Privacy Fast Track Name |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `BW-001` | **Warda Kapadia** | وردة كاباديا | Owner, Founder & Managing Director | Management & Ownership | `warda@betterwaymortgages.com` | **Warda's Place** | **Warda's Client — Privacy Fast Track** |
| `BW-002` | **Shabib Siraj** | شبيب سراج | Executive Director | Management & Ownership | `shabib@betterwaymortgages.com` | **Shabib's Corner** | **Shabib's Client — Privacy Fast Track** |

### 4.2 Complete Updated Team Roster (8 Specialists + Office Admin)
All 8 uploaded high-resolution studio portraits are processed into crisp WebP/JPG assets in `public/staff/` (and synced with `betterwaymortgages.com` & Supabase Storage `brand-and-team` bucket):

| Emp Code | Name | Official Title | Department | OS Role | Studio Portrait File |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `BW-001` | **Warda Kapadia** | Owner, Founder & Managing Director | Management & Ownership | `OWNER` | `media_1795655417082_cd839563.jpg` |
| `BW-002` | **Shabib Siraj** | Executive Director | Management & Ownership | `OWNER` | `media_1795655417496_020d2ae7.jpg` |
| `BW-003` | **Daniel Xavier** | Team Manager | Sales & Business Development | `TEAM_MANAGER` | `media_1795655417619_b970e9d8.jpg` |
| `BW-004` | **Elton Frank** | Operations Manager | Operations | `OPERATIONS_MANAGER` | `media_1795655417077_9b4ce2b7.jpg` |
| `BW-005` | **Rahaba Azeez** | HR | HR | `HR_MANAGER` | `media_1795655417083_7b95de95.jpg` |
| `BW-006` | **Nusrik** *(Mohammad Nusrik)* | IT & Marketing | Digital Marketing | `IT_MARKETING` | `media_1795655417065_cf4001bd.jpg` |
| `BW-007` | **Asif Khan** | Advisor | Sales & Business Development | `ADVISOR` | `media_1795655417617_5fa76760.jpg` |
| `BW-008` | **Reshma** *(Reshma Rajan)* | Advisor | Sales & Business Development | `ADVISOR` | `media_1795655417073_d3251d27.jpg` |
| `BW-000` | **Office Admin** | Office & System Administrator | Operations / Admin | `OFFICE_ADMIN` | Brand monogram badge |

### 4.3 Strict Row-Level Scoping & Approval Matrix (Enforced in API + Postgres RLS)

| Role | Leads & 12-Step Cases | Borrower Phone Numbers | Client Vault | Privacy Fast Track & Owner Ledger | Master Log | Accounts & Compliance | HR & Salaries |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **`OWNER`** (Warda & Shabib) | All + Fast Track | Unmasked | Full | **Full** (+ optional per-record "Private to me only" lock) | **Direct Write + Approve** | Full + **Consolidated Owner VAT/P&L** | Full |
| **`TEAM_MANAGER`** (Daniel) | All standard team leads/cases | Masked until assigned/audit-logged unmask | All standard cases | **Zero access (`403` / RLS hidden)** | Read lookups only | Read own team commissions | Own profile only |
| **`OPERATIONS_MANAGER`** (Elton) | All standard team cases (Steps 01–12) | Masked until logged action | All standard cases | **Zero access** | Read lookups only | Read valuation/NOC fees | Own profile only |
| **`ADVISOR`** (Asif, Reshma) | **Own assigned leads & cases ONLY** | **Hard-masked** (`+971 50 ••• •418`) until assigned; every call/WhatsApp/unmask logged in PDPL audit | Own assigned cases only | **Zero access** | Read lookups only | Own commission forecast only | Own profile only |
| **`HR_MANAGER`** (Rahaba) | None | None | None | **Zero access** | Staff/HR directory proposal rights (gated) | Payroll WPS export only | **Full HR, Visas, Attendance, Leave, WPS** |
| **`IT_MARKETING`** (Nusrik) | Source/Campaign aggregate stats & new web lead count | Masked | None | **Zero access** | Read lookups only | None | Own profile only |
| **`OFFICE_ADMIN`** | Standard enquiry intake & admin support | Masked | Standard intake verification | **Zero access** | **Propose Add/Edit to Reference Masters ONLY** (queued for Owner approval; **blocked** from RBAC, Geofence/Wi-Fi/Hikvision, and Salaries) | Standard Company Accounts, Expenses, Invoices & Compliance prep (**excludes** Owner Fast-Track ledger) | Attendance & Visa tracking (no Owner salary edit) |

### 4.4 Co-Owner Sign-Off Rules
- **1-of-2 Approval (Warda OR Shabib independently):** Admin Master Log change requests, Corporate Seal applications, HR Leave approvals, Bank Rate/Offer website publish sign-offs.
- **2-of-2 Dual Approval (BOTH Warda AND Shabib required):**
  1. **Delete Bin Permanent Purges** (records stay soft-deleted until both Owners sign off).
  2. **Outgoing Commission / Partner / Refund Payouts** (record moves `pending_payout` → `owner_1_approved` → `dual_approved_ready_to_pay`).

### 4.5 Authentication *(Builder call)*
- Standard Email + Password authentication (`scrypt` salted hashes in Postgres `users`) with signed `HttpOnly; Secure; SameSite=Lax` session cookies + optional TOTP 2FA for Owners and Admin.
- A 1-tap Role Switcher is strictly gated behind `NEXT_PUBLIC_DEMO_MODE=true` (disabled in production deployments).

---

## 5. App-Icon OS Architecture & Complete 18-App Launcher

Landing on `/` opens a luxury desktop-grade **App-Icon OS Launcher** (Warm Bone `#F8F7F4` canvas, Midnight Navy `#0A1128` executive accents, Emerald `#0D8A6A` live telemetry, Champagne Gold `#D4AF37` Owner badges, Dark Mode toggle, and RTL Arabic mode toggle for shell chrome, headings, Arabic data fields, and Arabic client documents).

### Persistent OS Top Bar
- Dynamic User/Owner Portrait Pill · Live Dubai GST Clock · Live CBUAE 3M EIBOR Pill · Global Search (`Ctrl+K`) · Critical Alerts Bell (pending 1-of-2 / 2-of-2 approvals, SLA breaches, Field SOS) · Live Office Presence Pill (`X/8 Checked In`).

### Complete 18-App Inventory

1. **Warda's Place** *(for Warda)* / **Shabib's Corner** *(for Shabib)* — *Owners Only*: Step 1–12 Playbook + Live Kanban & Gold-Rush Cash Velocity, **Privacy Fast Track**, **Bulk AI Upload**, **Master Log Quick Entry**, **Owner Approvals Hub** (1-of-2 & 2-of-2 queues), and **Owner Consolidated VAT/P&L**.
2. **Command Center** — *Owners & Managers*: Live daily enquiry intake counter, 12-stage lead counts & aging, Gold-Rush expected cash calendar, critical SLA/expiry alerts, live Oud Metha office attendance board, and live Field GPS radar.
3. **Dashboard** — *All Staff (role-scoped)*: Loan Book (AED), Expected vs. Collected Bank DSA Commissions, 12-Stage Funnel Counters, **My Tasks Today + Team & Individual Task Monitor**, **Assigned Clients** (by referral/staff), and Critical Alerts.
4. **Master Log (CORE)** — *Owners + Approval-Gated Admin*: Exact 22-registry headquarters grid matching the uploaded Master Log blueprint (`All`, `Core Masters`, `Finance & Compliance`, `People & Access`, `Real Estate & Mortgage Ops`, `Platform & Automation`).
5. **12-Step Pipeline** — *Role-Scoped*: Interactive 12-stage Kanban & Table (`01 Enquiry` → `12 Client Care`) with exact live count per stage, SLA clocks, mandatory exit-evidence gates, and Case 360° drawer.
6. **CRM** — *Role-Scoped*: 100% Exact Daily Enquiry Register (Website, Online Chat, WhatsApp, Bayut, Property Finder, Referral, Call, Walk-in, Social), Deduplication, Hard-Masked Client Vault dispatch, Assigned Clients desk, Call/WhatsApp logs, Follow-up sequences.
7. **Mortgage Exclusive Desk** — *All Advisory & Ops*: **Schedule & Deadlines** (Form F expiry, Pre-Approval expiry, FOL signing, DLD Trustee dates), **Valuation Booking & Tracker**, **Bank RM Follow-up Desk**, **24 UAE Partner Banks & APL Matrix**, **8 CBUAE Calculators** (50% DBR stress test, LTV, EMI, DLD Cash-to-Close, Buyout, Off-Plan Handover, Golden Visa AED 2M, Equity), and **CTO / Average Balance Bank Statement Analyzer** (formula + CSV upload matching `CTO Calculation_.xlsx` & `Average Balance_.xlsx`).
8. **Sales & Services** — *All Advisory & Ops*: Branded Bank Comparison Quotes & Proposal Print Suite, Cross-Sell Desk (Takaful, Wills, Golden Visa), RERA Partner Referral Hub (BRN/ORN attribution, verified corporate bank docs, SWK internal relay), Withdrawals & Refunds.
9. **Client Document Vault** — *Role-Scoped*: Per-client encrypted vault on Supabase Private Storage (`client-vault`) with direct signed uploads (bypassing Vercel's 4.5 MB limit), auto-checklists covering all 13+ core mortgage docs, 30-day recency alerts, verification stamps, and PDF dossier export.
10. **Accounts** — *Owners & Admin (standard ledger); Owners Only (Fast-Track + Consolidated)*: Double-entry GL mapped to 50-account COA, Bank DSA Commission Ledger, Standard Invoices, UAE 5% VAT 201 & PINT-AE UBL XML export, Expenses, P&L & Balance Sheet, Strict Corporate-Account-Only Payment Guard.
11. **Compliance** — *Owners & Admin*: CBUAE Joint KFS sign-off gate, AML/Sanctions screening (UN/UAE EOCN CSV/XLSX/JSON upload + fuzzy matcher) & goAML XML export, UAE PDPL Decree-Law 45/2021 consent & phone-unmasking audit trail, Immutable Audit Log, and **Owner Delete Bin** (2-of-2 permanent purge).
12. **Website & Social Studio** — *Owners & IT/Marketing*: Live two-way CMS for `betterwaymortgages.com` (Hot Offers, 24-Bank Rates, Top Announcements/Banners, 8-Member Team Bios/Portraits, Featured Guides) + Social Media Campaign Planner & UTM Lead Attribution tracker.
13. **Employees** — *Owners, HR & Admin*: 8-Member Studio Roster, **QR + Hikvision Door Fingerprint Attendance Console**, Mandatory Daily Close reports, Visa/EID/Passport expiry alerts, Leave Approvals, MOHRE WPS `.SIF` Payroll & EOSB Gratuity.
14. **Field GPS Services** — *All Staff (live oversight for Owners/Ops)*: Foreground GPS Check-In/Check-Out + manual waypoint pings for Bank, Valuation, Developer & DLD Trustee visits; live map view for Warda, Shabib & Elton; proximity verification; proof photos; **1-Tap SOS Emergency Alert** (Realtime siren + Web Push + optional webhook).
15. **Team Group (Inside)** — *All Staff*: Built-in team messaging channels (`#attendance-checkin`, `#general`, `#bank-desk`, `#progression`, `#urgent-alerts`) receiving **automatic real-time Check-In cards** on every Hikvision door unlock or QR scan.
16. **AI Case-Study Copilot** — *All Staff (Training: Owners & Managers)*: PII-shielded AI Underwriting & Policy Copilot seeded with Betterway's real case studies + interactive **Case-Study Training Studio** to save & index every new real-world scenario.
17. **Utilities & Documents** — *All Staff*: Letter & Word Studio (Quotes, Zero-Fee Agreements, Developer SOA/NOC requests) with **Owner Corporate Seal** approval, **9-Language Mortgage Translator** (`EN, AR, HI, UR, RU, FR, ZH, TL, ML`), Emirates ID/Passport/Salary OCR parser (with PII shield & human verification), Unified Global Search, and **50-Spec Excel Data Hub** (matching `Betterway_Mortgages_OS_Requirements.pdf`).
18. **Settings** — *Owners (full); Admin (non-security)*: Oud Metha Office WAN IP/CIDR & Geofence, Hikvision Door Terminal credentials & single/dual-reader mode toggle, Website Sync HMAC & revalidation test, Company TRN / MOL Employer ID / Corporate Bank IBAN Whitelist, Security/MFA, and Postgres backup export.

---

## 6. Deep-Dive Module Contracts

### 6.1 Privacy Fast Track & Owner-Only Ledger (Option A — Approved)
- **Tables:** `privacy_fast_track_jobs`, `privacy_fast_track_invoices`, `privacy_fast_track_docs` — protected by Postgres RLS (`role = 'OWNER'`, plus optional `private_to_owner_id = auth_user_id` toggle).
- **Capabilities:**
  - Bypass Master Log entirely to create an immediate VIP/urgent-cash deal (`FT-2026-XXXX`) with target cash-collection date and urgency banner (`CASH NEEDED IMMEDIATELY`, `VIP PRIVATE`, `CONFIDENTIAL`).
  - Generate custom branded UAE Tax Invoices (with 5% VAT) and Executive Letters/Mandates with 1-click Owner Corporate Seal and PDF export.
  - Store private files in Supabase Storage bucket `privacy-fast-track` (Owner-only signed URLs).
  - **Accounting Separation:** Never posts lines into the shared `journal_entries` or standard `invoices` tables visible to Admin/Staff. Inside **Warda's Place / Shabib's Corner**, an **Owner Consolidated Accounting & UAE VAT 201** tab merges `standard_ledger + fast_track_ledger` on the fly so Warda and Shabib see true company-wide P&L, cash flow, and FTA VAT 201 figures privately.

### 6.2 CORE Master Log — 22 Registries & Approval Gate
Matches the uploaded Master Log UI (`All`, `Core Masters`, `Finance & Compliance`, `People & Access`, `Real Estate & Mortgage Ops`, `Platform & Automation`):

- **Reference & Configuration Masters (Owner direct write; Admin → `master_change_requests` 1-of-2 Owner approval):**
  1. `communities` — Dubai & UAE Communities (`code`, `name`, `name_ar`, `emirate`, `area_zone`, `rera_code`, `description`, `avg_sqft_aed`, `gross_yield_pct`, `mortgage_demand`) — 60 seeded.
  2. `developers` — Master Developers (`code`, `name`, `emirate`, `rera_dev_no`, `description`, `apl_tier`, `noc_portal`, `escrow_banks`, `website`) — 15+ seeded.
  3. `departments` — Company Departments (`Management & Ownership`, `BDM`, `Digital Marketing`, `HR`, `Documentation`, `Accounts`, `Finance`, `Property Management`, `Sales & Business Development`, `Operations`, `IT & Digital Platforms`, `Compliance & MLRO`) — 12 seeded.
  4. `currencies` — 15 Currencies & FX Rates (synced with `/api/market/fx` + manual override).
  5. `vat_codes` — UAE FTA VAT Codes (5% Standard, 0% Zero-Rated, Exempt, Out-of-Scope, Reverse Charge).
  6. `chart_of_accounts` — 50 IFRS / UAE FTA Audit-Ready GL Accounts.
  7. `payment_terms` — 7 Standard Payment Terms (Upon Disbursal, Net 7/15/30, DSA 30–45D, Trustee Day, Immediate).
  8. `rera_brokers` — RERA Brokers & Referral Partners (ORN, BRN, split %, verified corporate bank letter + Trade License required before payouts).
  9. `banks` — **24 UAE Partner Banks & APL Rate Cards** (official SVG/PNG logos from existing assets, conventional/Islamic, fixed/revert rates, EIBOR margin/floor, LTV/DBR/age rules, SLAs, RM contacts).
  10. `document_checklists` — Mandatory checklists by borrower profile (`salaried`, `self_employed_full`, `self_employed_low_doc`, `non_resident`).
  11. `offplan_payment_plans` — Developer milestone & handover SOA structures.
  12. `lead_routing_rules` — Channel/Emirate/Loan-size lead assignment rules.
  13. `custom_fields` — No-code custom fields attached to OS records.
  14. `document_templates` — KFS, Zero-Fee Agreements, Bank Proposals, Developer SOA/NOC, Executive Letters.
  15. `case_study_scenarios` — AI Underwriting Case Studies & Rules Library.
- **Security-Critical Masters (Strictly Owner-only write — Admin read-only):**
  16. `office_branches` — Pre-seeded: **Al Nasr Plaza, Plot 319-310, Oud Metha Road, Oud Metha, Dubai, UAE** (`25.2397, 55.3119`, configurable geofence radius, public WAN IP/CIDR, Wi-Fi label, Hikvision serial/IP, single/dual-reader toggle, shift hours).
  17. `roles_permissions` — Immutable `OWNER` lock + role capability matrix.
  18. `employees` — 8-Member Staff & HR Directory (Admin/HR can update Visa/EID expiry; salary & role edits Owner-only).
- **Live Operational Registries *(Builder call — operational creates during 12-step pipeline never block the 5-min SLA; Master Log bulk/admin edits remain audited)*:**
  19. `master_properties` — Verified buildings, towers & villa projects.
  20. `property_units` — Apartments, townhouses, villas & offices.
  21. `contacts` — Borrowers, co-borrowers, buyers & landlords (with PDPL consent & phone masking).
  22. `master_vault_index` — Central encrypted index of all uploaded client/company PDFs.

### 6.3 12-Step Mortgage Pipeline & 100% Daily Enquiry Guarantee
Every enquiry from any source (`Website`, `Online Chat`, `WhatsApp`, `Bayut`, `Property Finder`, `Referral`, `Walk-in`, `Phone`, `Social Media`) writes to `leads` with `received_date_dubai` (GST), source attribution, duplicate check, and 5-minute SLA clock. Generic signed intake webhooks (`/api/v1/intake/leads`, `/api/v1/intake/whatsapp`, `/api/v1/intake/portal-webhook`) + Bulk AI paste + 1-click manual capture guarantee 100% daily logging.

**Stages (`01` → `12`):** `01 Enquiry` → `02 Eligibility` → `03 Pick Banks` → `04 Collect Papers` → `05 Submit to Bank` → `06 Pre-Approval` → `07 Valuation` → `08 Final Offer (FOL)` → `09 Developer NOC` → `10 Transfer & Disbursal` → `11 Commission` → `12 Client Care`. Every stage displays live lead count, AED value, and aging badges in both the Pipeline app and Warda's Place / Shabib's Corner.

### 6.4 Per-Client Document Vault (13+ Core Docs + Direct Signed Storage)
Backed by Supabase Private Storage (`client-vault`) using short-lived signed upload/download URLs (handles large 20 MB+ 6-month bank statement PDFs cleanly without hitting Vercel's 4.5 MB API limit). Default checklist per client includes:
1. Passport Copy · 2. Emirates ID (Front & Back) · 3. UAE Visa Page · 4. Latest Salary Certificate · 5. Last 6 Months Payslips · 6. Last 6 Months Bank Statements · 7. AECB Credit Report · 8. Signed Bank Application · 9. Signed Information Sheet & KFS · 10. Property Form F (MOU) · 11. Oqood · 12. Title Deed · 13. Developer SOA & NOC *(plus Self-Employed Full/Low-Doc and Non-Resident mandatory add-ons from `Mortgage presentation-Landscape.pdf`)*.

### 6.5 Attendance: Hikvision Office Door Fingerprint + 20s Rotating QR + Auto Group Check-In
- **Hikvision Door Integration (Single Entry Reader default + Dual-Reader option in Settings):**
  - Ships a ready-to-run Node LAN relay agent (`tools/hikvision-relay/index.mjs` + setup guide) that runs on any Oud Metha office PC, listens to Hikvision ISAPI `alertStream` / polls `AcsEvent`, maps `employeeNoString` (`BW-001`..`BW-008`) to staff, and posts HMAC-SHA256 signed JSON to `POST /api/v1/attendance/hikvision`.
  - **Single-Reader Smart State Machine:** First unlock of the Dubai GST day = **`CHECK_IN`** (computes on-time vs. late minutes against Oud Metha shift start); subsequent mid-day unlocks = **`DOOR_REENTRY`** (logged cleanly without false check-out); **Check-Out** completes via Reception QR scan or Mandatory Daily Close report. If Settings switches to `DUAL_READER`, exit-reader events trigger `CHECK_OUT` automatically.
  - Includes manual Hikvision CSV/JSON event import + Owner test-punch simulator in Settings.
- **20-Second Rotating QR + Oud Metha WAN IP & GPS Geofence:** Verifies HMAC token + Oud Metha office static public IP/CIDR + browser GPS radius.
- **Auto Team Group Check-In:** Every check-in automatically posts a real-time card to `#attendance-checkin` in **Team Group (Inside)** via Supabase Realtime.

### 6.6 Two-Way Website & Social Interconnect (`BETTERWAYOS` ↔ `BETTERWAYMORTGAGES`)
- **OS → `betterwaymortgages.com`:**
  - OS Website Studio edits `website_offers`, `website_banners`, `website_bank_rates`, `website_team_sync`, and `social_campaigns` in Supabase.
  - Exposes `GET /api/v1/public/cms` (cacheable JSON payload of live published offers, banners, bank rates, team, and announcements).
  - On publish, OS calls `POST https://betterwaymortgages.com/api/cms/revalidate` (HMAC-SHA256 signed) to invalidate Next.js cache tags immediately.
  - We update `BETTERWAYMORTGAGES` (`/hot-offers`, `HotOffersPopup.tsx`, `/rates`, `/about-us`, and top announcement bar) to consume this live feed with zero-downtime fallback to bundled defaults.
- **`betterwaymortgages.com` → OS:**
  - Keeps 100% backwards compatibility on `POST /api/v1/intake/leads` (called by `BETTERWAYMORTGAGES/src/app/api/os/leads/route.ts`).
  - Adds borrower `POST /api/v1/public/vault-upload-url` (validated by case `portal_token`) so `betterwaymortgages.com/portal/vault` uploads large documents directly into Supabase Private Storage `client-vault`.

### 6.7 PII-Shielded AI Underwriting & Case-Study Engine
- **Seeded Knowledge Base (`case_study_scenarios`):** Pre-populated with all Betterway rules & real underwriting scenarios from `Mortgage presentation-Landscape.pdf` (Resident Salaried, Self-Employed Full-Doc vs. Low-Doc, Non-Resident 40k/4-txn rule, Joint Husband/Wife & Blood-Relation rules, Rental Income ≥ 600k/yr, Handover SOA, Resale, Equity 50–70%, Buy-Out, Buy-Out + Equity), anonymized case patterns from `Betterway Forensic Underwriting & Client Advisory Dossier (38 Units).pdf`, and CTO/Average Balance calculation rules.
- **PDPL PII Shield:** Before calling any external LLM (`GEMINI_API_KEY` or `OPENAI_API_KEY`), all Emirates IDs, passport numbers, IBANs, and raw borrower phone numbers are tokenized/stripped server-side. When no external API key is configured, the deterministic CBUAE + Case-Study SQL engine answers directly with exact figures and policy citations.
- **Continuous Training Loop:** Owners and Managers add new closed/edge-case scenarios via the **Train New Case Study** form (Profile, Income/Liabilities, Property, Challenge, Banks Tried, Winning Solution, Lesson), immediately indexing them for future AI underwriting queries.

### 6.8 Corporate-Account-Only Financial Guard
- Betterway's own corporate IBANs are Owner-locked in Settings for all client/bank receivables.
- Outgoing RERA broker commission payouts require a verified ORN brokerage record with uploaded Corporate Bank Letter + Trade License AND **2-of-2 Owner sign-off**; server validation hard-rejects personal/cash-in-hand accounts.

---

## 7. Builder Calls Summary (Explicit Defaults to Confirm)

1. **Privacy Fast Track Sharing Between Co-Owners:** Both Warda and Shabib see all Privacy Fast Track records by default (100% equal access), with an optional per-record **"Private to me only"** lock toggle if either Owner wants single-owner privacy on a specific item.
2. **Operational Creates vs. Master Log Approval Gate:** Advisors/Ops can create borrower `contacts`, `property_units`, and upload `client-vault` files freely during active deals so the 5-minute enquiry SLA is never blocked; the **Admin → Owner approval gate** strictly governs CORE Reference/Config Masters, while RBAC, Oud Metha Geofence/Hikvision, and Salaries remain **Owner-only**.
3. **Browser PWA Attendance & Field GPS:** QR check-in verifies Oud Metha public static WAN IP/CIDR + GPS geofence (since web browsers cannot read raw Wi-Fi SSID/BSSID); Field GPS tracks foreground check-in/out + manual waypoint pings; 1-Tap SOS triggers Supabase Realtime siren + Web Push + optional Email/WhatsApp webhook.
4. **RTL Arabic Scope:** Full RTL layout toggle + bilingual Arabic nav/headings, Arabic data fields (`name_ar`), and Arabic/English client letters/quotes/portal views, while keeping internal operational tables in crisp Simple English.
5. **PII Shield on External LLMs:** Automatic server-side scrubbing of Emirates IDs, passports, phone numbers, and IBANs before any external Gemini/OpenAI call to uphold UAE PDPL Decree-Law 45/2021.
6. **Clean Production Database Seed:** Supabase Postgres launches with zero fake legacy deals — pre-seeded strictly with official Betterway Master Data (8 staff + Admin, 24 banks, 60 UAE communities, 15+ developers, Oud Metha Al Nasr Plaza branch, 12 departments, 15 currencies, FTA VAT codes, 50 COA accounts, 7 payment terms, document checklists, templates, and Betterway Case-Study Knowledge Base).
