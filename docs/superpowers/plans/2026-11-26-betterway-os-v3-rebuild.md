# Betterway Mortgages OS v3 — Full Rebuild & Website Interconnect Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Completely rebuild `BETTERWAYOS` on **Next.js 15 App Router + Supabase (Postgres, Private Storage, Realtime)** with 18 desktop-style OS apps, 100% equal co-owner control for **Warda Kapadia** (*Warda's Place*) and **Shabib Siraj** (*Shabib's Corner*), a 22-registry approval-gated **CORE Master Log**, a 12-step mortgage pipeline, Hikvision door fingerprint + QR attendance with auto team-group check-ins, Field GPS, PII-shielded AI Case-Study Engine, and live two-way sync with `BETTERWAYMORTGAGES` (`betterwaymortgages.com`).

**Architecture:** Clean Next.js 15 App Router rebuild inside `C:\Users\shamh\.gemini\antigravity\scratch\Betterwayos` (branched cleanly from `origin/main` as `rebuild/betterway-os-v3`) backed by a dedicated Supabase project (`betterway-mortgages` under org `propertiesswk-tech`). Server-side API routes enforce signed `HttpOnly` session cookies, Postgres Row-Level Security, hard phone masking, 1-of-2 / 2-of-2 Owner sign-offs, and direct-to-Supabase signed storage uploads, while `BETTERWAYMORTGAGES` consumes OS-published CMS content via `/api/v1/public/cms` + HMAC-signed `/api/cms/revalidate`.

**Tech Stack:** Next.js 15.5, React 19, TypeScript 5.9, Tailwind CSS v4, `@supabase/supabase-js`, `lucide-react`, `qrcode`, `exceljs`, Node built-in `crypto` (`scrypt`, `HMAC-SHA256`, TOTP), Vitest, Playwright/Browser QA.

**Spec:** [2026-11-26-betterway-os-rebuild-design.md](file:///C:/Users/shamh/.gemini/antigravity/brain/0103e747-c493-4ab9-8fd3-79f9c227011b/2026-11-26-betterway-os-rebuild-design.md) *(mirrored to `docs/superpowers/specs/2026-11-26-betterway-os-rebuild-design.md` in Task 2)*.

---

## Global Constraints

- **Co-Owner Equality:** `Warda Kapadia` (`warda@betterwaymortgages.com`, Founder & Managing Director) and `Shabib Siraj` (`shabib@betterwaymortgages.com`, Executive Director) hold 100% identical `OWNER` role and permissions.
- **Exact 8-Member Roster + Admin:** Warda Kapadia (`OWNER`), Shabib Siraj (`OWNER`), Daniel Xavier (`TEAM_MANAGER`), Elton Frank (`OPERATIONS_MANAGER`), Rahaba Azeez (`HR_MANAGER`), Mohammad Nusrik / "Nusrik" (`IT_MARKETING`), Asif Khan (`ADVISOR`), Reshma Rajan / "Reshma" (`ADVISOR`), Office Admin (`OFFICE_ADMIN`). All 8 studio portraits synced from `BetterwayMortgages/public/staff/`.
- **Strict Zero-Leak Privacy Fast Track:** `privacy_fast_track_*` tables and `privacy-fast-track` Storage bucket are strictly `OWNER`-only (plus optional `private_to_owner_id` lock); never posted into non-Owner `Accounts` GL/invoices.
- **Tiered Approvals:** `1-of-2` Owner approval (Warda OR Shabib) for Admin Master Log requests, Corporate Seals, Leave, and Website publish; `2-of-2` distinct Owner approvals (BOTH Warda AND Shabib) for Delete Bin permanent purges and Outgoing Payouts.
- **Master Log Governance:** `OWNER` writes directly; `OFFICE_ADMIN` writes to `master_change_requests` for 15 reference registries and is hard-blocked (`403`) from `roles_permissions`, `office_branches` security fields, and `employees` salaries; operational pipeline creates (`contacts`, `property_units`, `master_vault_index`) never block the 5-minute enquiry SLA.
- **Persistence:** Zero `/tmp` SQLite in production — all state persists in Supabase Postgres + Private Storage buckets (`client-vault`, `privacy-fast-track`, `brand-and-team`).
- **Zero SWK Public Leakage:** Public `betterwaymortgages.com` CMS payloads must never contain SWK Properties branding; SWK stays strictly an internal referral partner record inside OS Partner Hub.
- **Corporate-Account-Only Guard:** Reject personal/cash-in-hand accounts on all receivables and outgoing RERA broker payouts; require verified ORN corporate bank letter + 2-of-2 Owner sign-off before payout release.

---

## Review Focus

1. **Privacy Fast Track Isolation Across Every Read Surface:** A non-Owner (`OFFICE_ADMIN`, `TEAM_MANAGER`, `ADVISOR`) calling `/api/v1/executive/*`, `/api/v1/accounts/summary`, or `/api/v1/utilities/search` with a Fast-Track client name/code must receive `403` or zero Fast-Track matches — **pinned in Task 3 & Task 6 tests**.
2. **Admin Master Log Bypass & Security-Table Escalation:** `OFFICE_ADMIN` sending `POST`/`PATCH` directly to `/api/v1/masters/developers` must queue a pending approval without mutating `developers`, and sending any write to `/api/v1/masters/roles_permissions`, `/api/v1/masters/office_branches`, or `/api/v1/masters/employees` salary fields must return `403` — **pinned in Task 4 tests**.
3. **2-of-2 Distinct-Owner Enforcement:** The same Owner (e.g., Warda) approving a Delete Bin permanent purge or Payout twice must NOT complete the `2-of-2` gate — it must remain `owner_1_approved` until Shabib also approves — **pinned in Task 3 & Task 10 tests**.
4. **Hikvision Single-Reader Re-Entry & Replay Safety:** A second morning/mid-day fingerprint unlock on a Single Entry Reader must log `DOOR_REENTRY` (never false `CHECK_OUT` or duplicate `#attendance-checkin` spam), and an invalid/expired HMAC signature must return `401` — **pinned in Task 9 tests**.
5. **PDPL PII Shield & Personal Account Rejection:** Submitting raw Emirates ID (`784-YYYY-NNNNNNN-N`), UAE mobile (`+971 50 ...`), Passport, or IBAN to `/api/v1/ai/copilot` must strip all PII tokens before external LLM dispatch; submitting an outgoing payout to a personal or unverified broker account must return `400` — **pinned in Task 10 & Task 11 tests**.

---

## File Structure Overview

```text
Betterwayos/
├── docs/superpowers/{specs,plans}/         # Approved spec & this plan
├── supabase/migrations/                    # Ordered Postgres DDL + RLS + Realtime SQL
├── scripts/seed-supabase.ts                # Clean Master Data + Case-Study KB seeder
├── tools/hikvision-relay/                  # Oud Metha office LAN ISAPI -> Webhook relay
├── public/{brand,banks,staff,images}/      # v4 logos, 24 bank SVGs/PNGs, 8 studio portraits
├── src/
│   ├── middleware.ts                       # Route guard, security headers, owner-path block
│   ├── lib/
│   │   ├── supabase/{server,admin,client}.ts
│   │   ├── domain/{types,staff,banks,communities,workflow,masters,excel-specs,cbuae-math,case-studies}.ts
│   │   ├── auth/{password,session,rbac,approvals,masking,totp}.ts
│   │   ├── ai/{pii-shield,underwriting-engine,bulk-parser}.ts
│   │   ├── compliance/{corporate-guard,pint-ae,goaml,wps-sif}.ts
│   │   └── attendance/{hikvision,qr-hmac,geofence}.ts
│   ├── components/
│   │   ├── os/{OsShell,TopBar,AppLauncher,CommandPalette,CriticalAlertsBell,StaffPortrait,UiKit}.tsx
│   │   └── modules/{ExecutiveDesk,MasterLogHub,PipelineBoard,DocumentVault,MortgageDesk,AttendanceConsole,FieldGpsMap,WebsiteStudio,AiCopilotStudio}.tsx
│   └── app/
│       ├── layout.tsx, globals.css, manifest.ts
│       ├── login/page.tsx
│       ├── os/                             # All 18 Apps (Launcher + 17 dedicated module routes)
│       └── api/v1/                         # Isolated Next.js serverless API routes
└── tests/                                  # Vitest unit, security, RBAC, workflow & integration suites

BetterwayMortgages/ (surgical two-way sync additions only)
├── src/lib/cms-live.ts                     # Fetches live OS CMS payload with static fallback
└── src/app/api/cms/revalidate/route.ts     # HMAC-signed Next.js cache-tag revalidation endpoint
```

---

### Task 1: Supabase Project Provisioning, Postgres Schema, RLS & Private Storage

**Files:**
- Create: `supabase/migrations/001_core_auth_and_masters.sql`
- Create: `supabase/migrations/002_pipeline_crm_and_vault.sql`
- Create: `supabase/migrations/003_executive_fast_track_and_approvals.sql`
- Create: `supabase/migrations/004_finance_compliance_hr_attendance_gps.sql`
- Create: `supabase/migrations/005_website_cms_ai_and_rls.sql`
- Test: `tests/db-schema-rls.test.ts`

**Interfaces:**
- Consumes: Supabase MCP (`create_project`, `get_project`, `apply_migration`, `execute_sql`, `get_project_url`, `get_publishable_keys`).
- Produces: Live Supabase project `betterway-mortgages` in org `propertiesswk-tech` (`wqseorpcqezxfbfclpdb`, region `ap-south-1`), all relational tables, RLS policies, Realtime publication (`chat_messages`, `notifications`, `master_change_requests`, `field_visits`), and Storage buckets (`client-vault` private, `privacy-fast-track` private, `brand-and-team` public).

- [ ] **Step 1: Provision Supabase project `betterway-mortgages`**
  Call `supabase_mcp:create_project` with `{ name: "betterway-mortgages", organization_id: "wqseorpcqezxfbfclpdb", region: "ap-south-1" }` and poll `get_project` until `status === "ACTIVE_HEALTHY"`.
- [ ] **Step 2: Write SQL migration files `001` through `005`**
  Define exact schemas matching Section 6 of the spec:
  - `001`: `users`, `user_sessions`, `roles_permissions`, `office_branches`, `departments`, `communities`, `developers`, `currencies`, `vat_codes`, `chart_of_accounts`, `payment_terms`, `rera_brokers`, `banks`, `master_properties`, `property_units`, `contacts`, `document_checklists`, `offplan_payment_plans`, `lead_routing_rules`, `custom_fields`, `document_templates`, `master_vault_index`, `master_change_requests`.
  - `002`: `leads` (with immutable `received_date_dubai DATE`), `mortgage_cases` (12 stages `01_ENQUIRY`..`12_CLIENT_CARE`), `bank_submissions`, `case_documents`, `case_valuations`, `tasks`, `calendar_events`, `vault_leads`, `call_logs`, `client_messages`.
  - `003`: `privacy_fast_track_jobs`, `privacy_fast_track_invoices`, `privacy_fast_track_docs` (all with `created_by_owner_id` & `private_to_owner_id`), `owner_approvals` (`approval_mode IN ('1_OF_2', '2_OF_2')`, `approver_1_id`, `approver_2_id`), `delete_bin_requests`, `word_documents`.
  - `004`: `journal_entries`, `invoices`, `payout_requests` (`corporate_iban_verified`, `orn_letter_vault_id`), `expenses`, `compliance_checks`, `sanctions_entries`, `audit_events`, `attendance_events` (`source IN ('HIKVISION_DOOR','OFFICE_QR','MANUAL')`, `event_kind IN ('CHECK_IN','DOOR_REENTRY','CHECK_OUT')`), `daily_close_reports`, `hr_staff_compliance`, `hr_leave_requests`, `chat_messages`, `field_visits`, `notifications`.
  - `005`: `website_offers`, `website_banners`, `website_bank_rates`, `website_team_sync`, `social_campaigns`, `case_study_scenarios`, Storage buckets (`client-vault`, `privacy-fast-track`, `brand-and-team`), Postgres RLS policies, and `ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages, notifications, master_change_requests, field_visits`.
- [ ] **Step 3: Apply migrations to Supabase and verify with `tests/db-schema-rls.test.ts`**
  Run each migration via `supabase_mcp:apply_migration` and run `npx vitest run tests/db-schema-rls.test.ts` verifying every table exists, RLS is enabled on sensitive tables, and storage buckets exist.
- [ ] **Step 4: Commit migrations**
  Commit `supabase/migrations/*.sql` and `tests/db-schema-rls.test.ts` with message `feat(db): provision Supabase Postgres schema, RLS policies, and private storage buckets`.

---

### Task 2: Next.js 15 App Router Scaffold, Synced Assets, Domain Contracts & Clean Seed Script

**Files:**
- Create: `package.json`, `next.config.ts`, `tsconfig.json`, `postcss.config.mjs`, `vitest.config.ts`, `.env.example`, `.env.local` (gitignored)
- Create: `docs/superpowers/specs/2026-11-26-betterway-os-rebuild-design.md`, `docs/superpowers/plans/2026-11-26-betterway-os-v3-rebuild.md`
- Create: `src/lib/supabase/{server,admin,client}.ts`
- Create: `src/lib/domain/{types,staff,banks,communities,workflow,masters,excel-specs,cbuae-math,case-studies}.ts`
- Create: `scripts/seed-supabase.ts`
- Sync assets: `public/staff/*` (all 8 portraits incl. Warda & Shabib), `public/brand/*` (v4 logos), `public/banks/*` (24 official bank logos), `public/images/*`
- Test: `tests/domain-and-seed.test.ts`

**Interfaces:**
- Consumes: Task 1 live Supabase Postgres tables & credentials.
- Produces:
  - `supabaseAdmin(): SupabaseClient` in `src/lib/supabase/admin.ts`
  - `UserRole`, `SessionUser`, `MasterRegistryKey`, `StageCode`, `ApprovalMode`, `CmsPayload` in `src/lib/domain/types.ts`
  - `OFFICIAL_ROSTER` (8 members + Office Admin), `MASTER_REGISTRIES` (all 22 registries with categories & gate level), `PIPELINE_STAGES` (12 exact stages), `CORE_DOCUMENT_CHECKLIST` (13+ docs), `UAE_BANKS_24`, `UAE_COMMUNITIES_60`, `SEED_CASE_STUDIES`, `calculateCbuaeEligibility()`, `calculateCtoAndAvgBalance()`.

- [ ] **Step 1: Create clean branch `rebuild/betterway-os-v3` from `origin/main` and preserve visual assets**
  Run `git checkout -B rebuild/betterway-os-v3 origin/main`, copy `public/banks/*`, `public/images/*`, and `public/projects/*` to a clean layout, sync all 8 studio portraits and v4 brand logos from `BetterwayMortgages/public/{staff,brand}/`, and archive obsolete Vite/Express files cleanly.
- [ ] **Step 2: Write failing domain & CBUAE math tests (`tests/domain-and-seed.test.ts`)**
  Assert:
  - `OFFICIAL_ROSTER` has Warda Kapadia (`OWNER`, Founder & Managing Director) and Shabib Siraj (`OWNER`, Executive Director) with identical permission flags, plus Daniel Xavier (Team Manager), Elton Frank (Operations Manager), Rahaba Azeez (HR), Nusrik (IT & Marketing), Asif Khan (Advisor), Reshma (Advisor), and Office Admin.
  - `MASTER_REGISTRIES` defines exactly 22 registries across the 5 categories with security-critical keys (`office_branches`, `roles_permissions`, `employees`) tagged `writePolicy: 'OWNER_ONLY'`.
  - `PIPELINE_STAGES` defines 12 ordered steps (`01_ENQUIRY` → `12_CLIENT_CARE`).
  - `calculateCbuaeEligibility()` enforces 50% DBR at 6.5% stress rate, 80% expat / 85% national LTV ≤ 5M, 70%/75% > 5M, age caps 65 salaried / 70 self-employed.
  - `calculateCtoAndAvgBalance()` computes 6-month total credits, monthly average, and low-doc AED 40k/mo + AED 15k min balance qualification.
- [ ] **Step 3: Run test to verify it fails**
  Run: `npx vitest run tests/domain-and-seed.test.ts` → Expected: FAIL (modules missing).
- [ ] **Step 4: Install Next.js 15 dependencies, implement `src/lib/supabase/*`, `src/lib/domain/*`, and `scripts/seed-supabase.ts`**
  Implement all typed domain modules and idempotent clean seeder (`npx tsx scripts/seed-supabase.ts`) populating official Master Data + Betterway Case-Study Knowledge Base with zero fake legacy deals.
- [ ] **Step 5: Run tests + seed script**
  Run: `npx vitest run tests/domain-and-seed.test.ts && npx tsx scripts/seed-supabase.ts` → Expected: PASS + clean seeded counts verified.
- [ ] **Step 6: Commit**
  Commit with message `feat(core): scaffold Next.js 15 OS, synced portraits/brand assets, domain models, and clean Supabase seeder`.

---

### Task 3: Authentication, Co-Owner Equality, Strict RBAC, Phone Masking & 1-of-2 / 2-of-2 Approval Engine

**Files:**
- Create: `src/lib/auth/{password,session,rbac,approvals,masking,totp}.ts`
- Create: `src/middleware.ts`
- Create: `src/app/api/v1/auth/{login,logout,me,demo-switch}/route.ts`
- Create: `src/app/api/v1/approvals/route.ts`, `src/app/api/v1/approvals/[id]/decide/route.ts`
- Test: `tests/auth-rbac-approvals.test.ts`

**Interfaces:**
- Consumes: Task 2 `supabaseAdmin`, `SessionUser`, `UserRole`.
- Produces:
  - `requireSession(req): Promise<SessionUser>`
  - `requireOwner(req): Promise<SessionUser>` (strictly Warda or Shabib)
  - `canViewRecord(user: SessionUser, resource: string, ownerId?: string): boolean`
  - `maskPhoneForRole(phone: string, user: SessionUser, isAssigned: boolean): string`
  - `recordApprovalDecision(approvalId: string, actor: SessionUser, decision: 'APPROVED' | 'REJECTED', note?: string): Promise<ApprovalState>` (enforcing `1_OF_2` vs `2_OF_2` distinct-Owner rule!).

- [ ] **Step 1: Write failing security & approval tests (`tests/auth-rbac-approvals.test.ts`)**
  Pin Review Focus #1 and #3:
  - Test Warda and Shabib produce identical capability maps (`isOwner === true`, `executiveAppTitle` = `"Warda's Place"` vs `"Shabib's Corner"`).
  - Test `OFFICE_ADMIN`, `TEAM_MANAGER`, `OPERATIONS_MANAGER`, `ADVISOR` calling `requireOwner` receive `403`.
  - Test `ADVISOR` phone masking returns `+971 50 ••• •418` when unassigned and logs PDPL audit on unmask.
  - Test `1_OF_2` approval transitions to `APPROVED` on Warda's single sign-off.
  - Test `2_OF_2` approval (Delete Bin purge / Payout): Warda approving once sets `OWNER_1_APPROVED`; **Warda approving a second time throws `409 DUPLICATE_OWNER_APPROVAL`**; Shabib approving transitions to `APPROVED`.
- [ ] **Step 2: Run test to verify it fails**
  Run: `npx vitest run tests/auth-rbac-approvals.test.ts` → Expected: FAIL.
- [ ] **Step 3: Implement auth, RBAC, masking, middleware, and approval engine**
  Implement `scrypt` password verify, HMAC-SHA256 signed `HttpOnly` cookie session, TOTP helper, Next.js middleware blocking `/os/executive` and `/api/v1/executive/*` for non-Owners, and approval routes.
- [ ] **Step 4: Run test to verify it passes**
  Run: `npx vitest run tests/auth-rbac-approvals.test.ts` → Expected: PASS.
- [ ] **Step 5: Commit**
  Commit with message `feat(auth): add co-owner RBAC, PDPL phone masking, and 1-of-2/2-of-2 approval engine`.

---

### Task 4: CORE Master Log Engine (22 Registries) & Admin Proposal Queue

**Files:**
- Create: `src/app/api/v1/masters/route.ts` (counts across all 22 registries)
- Create: `src/app/api/v1/masters/[registry]/route.ts` (`GET`, `POST`)
- Create: `src/app/api/v1/masters/[registry]/[id]/route.ts` (`PATCH`, `DELETE`)
- Create: `src/app/api/v1/masters/change-requests/route.ts` & `[id]/decide/route.ts`
- Create: `src/components/modules/MasterLogHub.tsx`
- Create: `src/app/os/master-log/page.tsx` & `src/app/os/master-log/[registry]/page.tsx`
- Test: `tests/master-log-gate.test.ts`

**Interfaces:**
- Consumes: Task 2 `MASTER_REGISTRIES`, Task 3 `requireSession`, `requireOwner`.
- Produces: Generic CRUD + Admin proposal API across all 22 registries and the 22-card Master Log UI matching the uploaded screenshot (`All`, `Core Masters`, `Finance & Compliance`, `People & Access`, `Real Estate & Mortgage Ops`, `Platform & Automation`).

- [ ] **Step 1: Write failing Master Log gate tests (`tests/master-log-gate.test.ts`)**
  Pin Review Focus #2:
  - Test `OWNER` (Warda or Shabib) creating a Dubai Community (`code, name, emirate, area_zone, rera_code, description, avg_sqft_aed`) writes immediately to `communities`.
  - Test `OFFICE_ADMIN` creating/editing a Developer writes ONLY to `master_change_requests` (`status: 'PENDING'`) and leaves `developers` unchanged until an Owner approves it via `/api/v1/masters/change-requests/[id]/decide`.
  - Test `OFFICE_ADMIN` attempting to write to `roles_permissions`, `office_branches` (geofence/Wi-Fi/Hikvision), or `employees` salary returns `403 OWNER_ONLY_SECURITY_MASTER`.
  - Test `ADVISOR` attempting to open Master Log write endpoints returns `403`.
- [ ] **Step 2: Run test to verify it fails**
  Run: `npx vitest run tests/master-log-gate.test.ts` → Expected: FAIL.
- [ ] **Step 3: Implement Master Log APIs and 22-Registry UI**
  Build the dynamic schema-validated CRUD handlers, before/after JSON diff generator for Admin proposals, notification trigger to both Owners on Admin submission, and the crisp Emerald/Bone Master Log card grid + registry table/drawer UI (including Oud Metha branch geofence & Wi-Fi display).
- [ ] **Step 4: Run test to verify it passes**
  Run: `npx vitest run tests/master-log-gate.test.ts` → Expected: PASS.
- [ ] **Step 5: Commit**
  Commit with message `feat(masters): build 22-registry CORE Master Log with Admin-to-Owner approval gate`.

---

### Task 5: Desktop App-Icon OS Shell, Login, Launcher, Command Center & Dashboard

**Files:**
- Create: `src/app/layout.tsx`, `src/app/globals.css`, `src/app/manifest.ts`
- Create: `src/app/login/page.tsx`
- Create: `src/components/os/{OsShell,TopBar,AppLauncher,CommandPalette,CriticalAlertsBell,StaffPortrait,UiKit}.tsx`
- Create: `src/app/os/layout.tsx`, `src/app/os/page.tsx` (18-App Icon Launcher)
- Create: `src/app/os/command-center/page.tsx`, `src/app/os/dashboard/page.tsx`
- Create: `src/app/api/v1/dashboard/overview/route.ts`, `src/app/api/v1/tasks/route.ts`, `src/app/api/v1/tasks/[id]/route.ts`, `src/app/api/v1/notifications/route.ts`
- Test: `tests/dashboard-tasks.test.ts`

**Interfaces:**
- Consumes: Task 3 session/RBAC, Task 4 Master counts.
- Produces: Persistent OS chrome (`OsShell`, `TopBar`, `AppLauncher` with dynamic **Warda's Place** / **Shabib's Corner** tile, Dark Mode + RTL Arabic toggle), live `Command Center`, and `Dashboard` (12-stage lead counts, My Tasks Today + Team & Individual Task monitor, Assigned Clients by referral/staff, Critical Alerts).

- [ ] **Step 1: Write failing dashboard & task-monitor tests (`tests/dashboard-tasks.test.ts`)**
  Test `/api/v1/dashboard/overview` returns exact counts for all 12 stages (`01_ENQUIRY`..`12_CLIENT_CARE`), `tasks.mine`, `tasks.teamByStaff`, `criticalAlerts`, and role-scoped visibility (`ADVISOR` sees own counts only; `OWNER` sees full counts).
- [ ] **Step 2: Run test to verify it fails**
  Run: `npx vitest run tests/dashboard-tasks.test.ts` → Expected: FAIL.
- [ ] **Step 3: Build OS design system, Login, 18-App Launcher, Command Center & Dashboard**
  Build the luxury App-Icon Launcher (Warm Bone `#F8F7F4`, Midnight Navy `#0A1128`, Emerald `#0D8A6A`, Champagne Gold `#D4AF37`), dynamic portrait badge, Dubai GST clock, live EIBOR pill, `Ctrl+K` palette, and interactive Dashboard/Command Center.
- [ ] **Step 4: Run test to verify it passes**
  Run: `npx vitest run tests/dashboard-tasks.test.ts` → Expected: PASS.
- [ ] **Step 5: Commit**
  Commit with message `feat(ui): build App-Icon OS Shell, 18-app Launcher, Command Center, and Dashboard`.

---

### Task 6: Warda's Place / Shabib's Corner — Privacy Fast Track, 1–12 Playbook Kanban, Bulk AI Upload & Owner Approvals

**Files:**
- Create: `src/app/api/v1/executive/overview/route.ts`
- Create: `src/app/api/v1/executive/fast-track/route.ts` & `[id]/route.ts`
- Create: `src/app/api/v1/executive/fast-track/[id]/invoice/route.ts`
- Create: `src/app/api/v1/executive/bulk-ai-upload/route.ts`
- Create: `src/app/api/v1/executive/consolidated-vat/route.ts`
- Create: `src/lib/ai/bulk-parser.ts`
- Create: `src/components/modules/ExecutiveDesk.tsx`
- Create: `src/app/os/executive/page.tsx`
- Test: `tests/executive-fast-track.test.ts`

**Interfaces:**
- Consumes: Task 3 `requireOwner`, Task 4 `master_change_requests`, Task 1 `privacy_fast_track_*`.
- Produces: Complete Owner-only workspace dynamically branded **Warda's Place** / **Shabib's Corner**, Privacy Fast Track custom job/invoice/doc engine (Master Log bypass), Bulk AI Lead/CSV/WhatsApp importer, 12-stage Gold-Rush Kanban with live daily cash velocity, Unified 1-of-2 & 2-of-2 Approvals tab, and Owner-Only Consolidated P&L & UAE VAT 201 tab.

- [ ] **Step 1: Write failing executive isolation & Fast-Track tests (`tests/executive-fast-track.test.ts`)**
  Pin Review Focus #1:
  - Test Warda creating a Privacy Fast Track job + custom 5% VAT invoice succeeds WITHOUT any Master Log developer/community record, and is visible to Shabib unless `privateToOwnerOnly: true` is set.
  - Test `OFFICE_ADMIN`, `TEAM_MANAGER`, `ADVISOR` requesting `/api/v1/executive/fast-track` or `/api/v1/executive/consolidated-vat` receive `403`.
  - Test Bulk AI Parser extracts structured leads from messy pasted WhatsApp/CSV text, deduplicates against existing phones, and writes to selected target (`vault`, `leads`, or `fast_track`).
- [ ] **Step 2: Run test to verify it fails**
  Run: `npx vitest run tests/executive-fast-track.test.ts` → Expected: FAIL.
- [ ] **Step 3: Implement Executive APIs, Bulk AI Parser, and `ExecutiveDesk.tsx`**
  Build the 6-tab Owner HQ (`1–12 Gold-Rush Kanban`, `Privacy Fast Track`, `Bulk AI Upload`, `Owner Approvals (1-of-2 & 2-of-2)`, `Consolidated P&L & VAT 201`, `Master Log Quick Jump`) with 1-click printable Fast-Track Tax Invoice & sealed Executive Letters.
- [ ] **Step 4: Run test to verify it passes**
  Run: `npx vitest run tests/executive-fast-track.test.ts` → Expected: PASS.
- [ ] **Step 5: Commit**
  Commit with message `feat(executive): build Warda's Place / Shabib's Corner, Privacy Fast Track, Bulk AI Upload, and Owner Consolidated VAT`.

---

### Task 7: 12-Step Mortgage Pipeline, 100% Daily Enquiry CRM & Per-Client Encrypted Document Vault

**Files:**
- Create: `src/app/api/v1/intake/{leads,whatsapp,portal-webhook}/route.ts`
- Create: `src/app/api/v1/crm/{leads,vault,dispatch,unmask}/route.ts`
- Create: `src/app/api/v1/pipeline/cases/route.ts`, `[id]/route.ts`, `[id]/advance/route.ts`, `[id]/submissions/route.ts`
- Create: `src/app/api/v1/vault/documents/route.ts`, `upload-url/route.ts`, `[id]/download-url/route.ts`, `[id]/verify/route.ts`
- Create: `src/components/modules/{PipelineBoard,CrmWorkspace,DocumentVault}.tsx`
- Create: `src/app/os/{pipeline,crm,vault}/page.tsx`
- Test: `tests/pipeline-crm-vault.test.ts`

**Interfaces:**
- Consumes: Task 2 `PIPELINE_STAGES`, `CORE_DOCUMENT_CHECKLIST`, Task 3 RBAC & masking.
- Produces: 100% backwards-compatible `/api/v1/intake/leads` (for `BETTERWAYMORTGAGES`), daily Dubai GST enquiry reconciliation log, 12-stage Kanban + Case 360° drawer, and Supabase Private Storage signed upload/download vault covering all 13+ required UAE mortgage documents.

- [ ] **Step 1: Write failing pipeline, daily CRM & vault tests (`tests/pipeline-crm-vault.test.ts`)**
  Test:
  - Website HMAC-signed lead intake (`POST /api/v1/intake/leads`) creates a `01_ENQUIRY` record with exact Dubai GST date (`received_date_dubai`), deduplicates repeat phones, and respects `ADVISOR` row scoping.
  - Advancing a case across all 12 stages enforces mandatory exit-evidence notes and updates stage lead counters accurately.
  - Creating a case auto-spawns all 13+ required Document Vault slots (Passport, EID, Visa, Salary Cert, 6m Payslips, 6m Bank Statements, AECB, Signed Bank App, Info Sheet & KFS, Form F, Oqood, Title Deed, Developer SOA/NOC) and returns short-lived Supabase Private Storage signed upload URLs.
- [ ] **Step 2: Run test to verify it fails**
  Run: `npx vitest run tests/pipeline-crm-vault.test.ts` → Expected: FAIL.
- [ ] **Step 3: Implement CRM Intake, 12-Step Pipeline, and Per-Client Private Storage Vault**
  Wire direct-to-Supabase signed URLs (handles 20 MB+ PDF packs cleanly on Vercel), recency checks (≤ 30 days on salary cert/statements/AECB), and PDPL phone-masking audit logs.
- [ ] **Step 4: Run test to verify it passes**
  Run: `npx vitest run tests/pipeline-crm-vault.test.ts` → Expected: PASS.
- [ ] **Step 5: Commit**
  Commit with message `feat(pipeline,crm,vault): implement 100% daily CRM intake, 12-step mortgage pipeline, and encrypted client document vault`.

---

### Task 8: Mortgage Exclusive Business Desk, 24-Bank Matrix, 8 CBUAE Calculators, CTO/Avg Balance Analyzer & Sales/Services

**Files:**
- Create: `src/app/api/v1/mortgage-desk/{schedule,valuations,followups,cto-analyze}/route.ts`
- Create: `src/app/api/v1/sales/{proposals,cross-sell,partners,withdrawals}/route.ts`
- Create: `src/components/modules/{MortgageDesk,SalesServicesDesk}.tsx`
- Create: `src/app/os/{mortgage-desk,sales}/page.tsx`
- Test: `tests/mortgage-desk-sales.test.ts`

**Interfaces:**
- Consumes: Task 2 `UAE_BANKS_24`, `calculateCbuaeEligibility`, `calculateCtoAndAvgBalance`, Task 7 `mortgage_cases`.
- Produces: Mortgage Exclusive Business Desk (Schedule, Deadlines, Valuation Booking & Follow-up tracker, 24-Bank APL matrix with official logos, 8 CBUAE calculators, CTO & Average Balance monthly/CSV analyzer) and Sales & Services (Branded Quote Printer, Cross-Sell Desk, RERA Partner Hub with SWK internal relay, Withdrawals).

- [ ] **Step 1: Write failing mortgage desk & sales tests (`tests/mortgage-desk-sales.test.ts`)**
  Test valuation booking updates case Step 07 deadline alerts, CTO analyzer flags low-doc eligibility accurately from 6-month credit/balance CSV rows, and RERA Partner referral locks attribution cleanly.
- [ ] **Step 2: Run test to verify it fails**
  Run: `npx vitest run tests/mortgage-desk-sales.test.ts` → Expected: FAIL.
- [ ] **Step 3: Implement Mortgage Exclusive Business Desk & Sales/Services APIs and UI**
  Build the interactive desk with official 24-bank logos, deadline radar (Form F / Pre-Approval / Valuation / FOL / Trustee), CTO/Avg Balance spreadsheet analyzer, and printable Bank Comparison Proposal.
- [ ] **Step 4: Run test to verify it passes**
  Run: `npx vitest run tests/mortgage-desk-sales.test.ts` → Expected: PASS.
- [ ] **Step 5: Commit**
  Commit with message `feat(desk,sales): build Mortgage Exclusive Business Desk, CTO/Avg Balance analyzer, and Sales & Partner Hub`.

---

### Task 9: Attendance (Hikvision Door Fingerprint + 20s QR + Oud Metha Geofence), Team Group (`#attendance-checkin`) & Field GPS

**Files:**
- Create: `src/lib/attendance/{hikvision,qr-hmac,geofence}.ts`
- Create: `src/app/api/v1/attendance/{hikvision,qr-terminal,checkin,checkout,daily-close,live,import}/route.ts`
- Create: `src/app/api/v1/chat/route.ts`
- Create: `src/app/api/v1/field-gps/route.ts`, `[id]/route.ts`, `[id]/sos/route.ts`
- Create: `tools/hikvision-relay/{index.mjs,start-relay.bat,README.md}`
- Create: `src/components/modules/{AttendanceConsole,TeamInsideChat,FieldGpsMap}.tsx`
- Create: `src/app/os/{inside,field-gps}/page.tsx`
- Test: `tests/attendance-hikvision-gps.test.ts`

**Interfaces:**
- Consumes: Task 4 `office_branches` (Al Nasr Plaza Oud Metha coordinates/WAN IP/Hikvision config), Task 1 Supabase Realtime `chat_messages` & `field_visits`.
- Produces: HMAC-verified Hikvision door webhook, Single/Dual-Reader attendance state machine, Oud Metha LAN relay script (`tools/hikvision-relay/`), 20s rotating QR + WAN IP/geofence validator, auto-posted `#attendance-checkin` cards in Team Group, and Field GPS live map + 1-Tap SOS alert.

- [ ] **Step 1: Write failing Hikvision, QR, group-post & GPS SOS tests (`tests/attendance-hikvision-gps.test.ts`)**
  Pin Review Focus #4:
  - Test invalid/replayed HMAC signature on `POST /api/v1/attendance/hikvision` returns `401`.
  - Test first morning Hikvision punch for `BW-003` (Daniel Xavier) logs `CHECK_IN` AND inserts a structured Check-In message into `chat_messages` (`channel = 'attendance-checkin'`).
  - Test second mid-day punch in `SINGLE_ENTRY_READER` mode logs `DOOR_REENTRY`, does NOT mark `CHECK_OUT`, and does NOT post duplicate morning check-in spam.
  - Test `haversineDistanceMeters()` rejects QR check-ins outside Oud Metha geofence radius when geofence lock is enabled.
  - Test Field GPS 1-Tap SOS creates `CRITICAL` notifications targeted directly at both Owners (`BW-001`, `BW-002`) and posts to `#urgent-alerts`.
- [ ] **Step 2: Run test to verify it fails**
  Run: `npx vitest run tests/attendance-hikvision-gps.test.ts` → Expected: FAIL.
- [ ] **Step 3: Implement Attendance engine, Hikvision LAN relay, Team Group chat & Field GPS**
  Build the APIs, Realtime subscriptions, Hikvision ISAPI LAN relay agent with setup docs, Reception QR kiosk view, Team Inside chat, and interactive Field GPS live map + SOS trigger.
- [ ] **Step 4: Run test to verify it passes**
  Run: `npx vitest run tests/attendance-hikvision-gps.test.ts` → Expected: PASS.
- [ ] **Step 5: Commit**
  Commit with message `feat(attendance,gps,chat): add Hikvision door fingerprint + QR attendance with auto group check-in and Field GPS SOS`.

---

### Task 10: Accounts (Corporate-Account Guard), Compliance/AML/PDPL, Employees/HR/WPS, Utilities (50-Spec Excel Hub) & Settings

**Files:**
- Create: `src/lib/compliance/{corporate-guard,pint-ae,goaml,wps-sif}.ts`
- Create: `src/app/api/v1/accounts/{ledger,invoices,payouts,vat-201,pint-ae}/route.ts`
- Create: `src/app/api/v1/compliance/{overview,sanctions-import,goaml,delete-bin,audit}/route.ts`
- Create: `src/app/api/v1/hr/{overview,leaves,wps-sif}/route.ts`
- Create: `src/app/api/v1/utilities/{word-studio,translate,ocr,search,excel-export}/route.ts`
- Create: `src/app/api/v1/settings/route.ts`
- Create: `src/app/os/{accounts,compliance,employees,utilities,settings}/page.tsx`
- Test: `tests/finance-compliance-hr.test.ts`

**Interfaces:**
- Consumes: Task 3 2-of-2 Owner approval engine, Task 4 COA/VAT/Staff/RERA Brokers masters, Task 9 Attendance console.
- Produces: Standard company Accounts & GL (isolated from Privacy Fast Track), Corporate-Account-Only validator, UAE 5% VAT 201 & PINT-AE XML, Sanctions CSV/XLSX matcher & goAML XML, 2-of-2 Delete Bin, HR Roster + Attendance Console + MOHRE WPS `.SIF` + EOSB, Word Studio + Owner Seal, 9-Language Translator, OCR, Global Search (strictly excluding Fast Track for non-Owners), 50-Spec Excel exports (`exceljs`), and Settings.

- [ ] **Step 1: Write failing finance, compliance & search isolation tests (`tests/finance-compliance-hr.test.ts`)**
  Pin Review Focus #1, #3, #5:
  - Test outgoing payout to personal/cash-in-hand account OR broker lacking verified ORN corporate bank letter returns `400 CORPORATE_ACCOUNT_REQUIRED`.
  - Test valid broker payout requires `2-of-2` distinct Owner sign-offs (Warda + Shabib) before status becomes `READY_TO_PAY`.
  - Test `OFFICE_ADMIN` calling `/api/v1/utilities/search?q=<fast_track_client>` returns 0 Fast-Track matches while `OWNER` finds it.
  - Test PINT-AE XML, goAML XML, and MOHRE WPS `.SIF` serializers produce valid non-empty statutory outputs.
- [ ] **Step 2: Run test to verify it fails**
  Run: `npx vitest run tests/finance-compliance-hr.test.ts` → Expected: FAIL.
- [ ] **Step 3: Implement Accounts, Compliance, Employees/HR, Utilities & Settings**
  Build all routes and clean workspace UIs (embedding the Attendance Console inside Employees + Reception QR quick launch, plus 8-member studio portfolio with uploaded portraits).
- [ ] **Step 4: Run test to verify it passes**
  Run: `npx vitest run tests/finance-compliance-hr.test.ts` → Expected: PASS.
- [ ] **Step 5: Commit**
  Commit with message `feat(finance,compliance,hr,utilities): add Corporate-Account Accounts, Compliance/AML, HR/WPS, Utilities & Settings`.

---

### Task 11: PII-Shielded AI Underwriting & Case-Study Training Engine

**Files:**
- Create: `src/lib/ai/{pii-shield,underwriting-engine}.ts`
- Create: `src/app/api/v1/ai/{copilot,case-studies}/route.ts` & `case-studies/[id]/route.ts`
- Create: `src/components/modules/AiCopilotStudio.tsx`
- Create: `src/app/os/ai/page.tsx`
- Test: `tests/ai-pii-case-studies.test.ts`

**Interfaces:**
- Consumes: Task 2 `SEED_CASE_STUDIES`, `calculateCbuaeEligibility`, Task 1 `case_study_scenarios`, `banks`, `mortgage_cases`.
- Produces:
  - `scrubPii(input: string): { sanitized: string; redactions: number }`
  - `answerUnderwritingQuery(prompt: string, user: SessionUser): Promise<AiUnderwritingResponse>` (grounded in Postgres case studies + CBUAE rules + live pipeline counts; optional Gemini/OpenAI enhancement only on PII-scrubbed prompt!)
  - Case-Study Training Studio UI allowing Warda, Shabib, and Managers to add/edit/tag real scenarios so the AI learns continuously.

- [ ] **Step 1: Write failing PII-shield & Case-Study AI tests (`tests/ai-pii-case-studies.test.ts`)**
  Pin Review Focus #5:
  - Test `scrubPii("EID 784-1988-1234567-1, phone +971 50 441 8821, IBAN AE070331234567890123456")` replaces every sensitive token with `[REDACTED_EID]`, `[REDACTED_PHONE]`, `[REDACTED_IBAN]`.
  - Test querying Low-Doc Self-Employed, Non-Resident 40k/4-txn, Joint Husband/Wife, Rental Income ≥ 600k, and Buy-Out + Equity returns exact Betterway underwriting rules and cited case-study IDs from `case_study_scenarios`.
  - Test creating a brand-new Case Study via `POST /api/v1/ai/case-studies` makes it immediately retrievable in the very next `/api/v1/ai/copilot` query.
- [ ] **Step 2: Run test to verify it fails**
  Run: `npx vitest run tests/ai-pii-case-studies.test.ts` → Expected: FAIL.
- [ ] **Step 3: Implement PII Shield, Case-Study Underwriting Engine, and Training Studio UI**
  Build the dual-pane AI Copilot + Case-Study Library & "Train New Scenario" builder.
- [ ] **Step 4: Run test to verify it passes**
  Run: `npx vitest run tests/ai-pii-case-studies.test.ts` → Expected: PASS.
- [ ] **Step 5: Commit**
  Commit with message `feat(ai): add PDPL PII-shielded AI Underwriting Copilot and live Case-Study Training Studio`.

---

### Task 12: Two-Way Website & Social Studio (`BETTERWAYOS` ↔ `BETTERWAYMORTGAGES`) + Full Verification

**Files:**
- Create (in `Betterwayos`): `src/app/api/v1/website-studio/{route.ts,publish/route.ts}`, `src/app/api/v1/public/{cms,vault-upload-url,status}/route.ts`, `src/components/modules/WebsiteStudio.tsx`, `src/app/os/website-studio/page.tsx`
- Create (in `BetterwayMortgages`): `src/lib/cms-live.ts`, `src/app/api/cms/revalidate/route.ts`
- Modify (in `BetterwayMortgages`): `src/app/(en)/hot-offers/page.tsx`, `src/components/HotOffersPopup.tsx`, `src/app/(en)/rates/page.tsx`, `src/app/(en)/about-us/page.tsx` (consume live OS CMS feed with zero-downtime static fallback and zero SWK strings)
- Test: `Betterwayos/tests/website-sync-e2e.test.ts` + `BetterwayMortgages` existing test suite

**Interfaces:**
- Consumes: Task 1 `website_*` & `social_campaigns` tables, Task 7 `client-vault` signed URLs.
- Produces: Live two-way CMS publishing (`OS → betterwaymortgages.com` via `GET /api/v1/public/cms` + HMAC-signed `POST /api/cms/revalidate`), Social Campaign Planner & UTM Attribution tracker, Borrower Portal signed upload bridge (`POST /api/v1/public/vault-upload-url`), and end-to-end verified builds across both repositories.

- [ ] **Step 1: Write failing two-way CMS sync & zero-SWK guard tests (`tests/website-sync-e2e.test.ts`)**
  Test:
  - Updating a Hot Offer or Top Banner in Website Studio updates `GET /api/v1/public/cms` immediately, fires HMAC-signed revalidation payload, and asserts zero occurrences of `swk` anywhere in the public CMS JSON.
  - Calling `POST /api/v1/public/vault-upload-url` with an invalid `portal_token` returns `401`, and with a valid case `portal_token` returns a signed upload URL scoped strictly to that case's prefix in `client-vault`.
- [ ] **Step 2: Run test to verify it fails**
  Run: `npx vitest run tests/website-sync-e2e.test.ts` → Expected: FAIL.
- [ ] **Step 3: Implement OS Website & Social Studio + surgical `BETTERWAYMORTGAGES` live CMS hook**
  Build OS Website Studio (Hot Offers, Bank Rates, Top Announcement Banner, Team Sync, Social Campaigns + UTM Builder) and wire `BetterwayMortgages` with safe ISR tag revalidation (`betterway-cms`) and zero-downtime fallback.
- [ ] **Step 4: Full Verification Gate across BOTH repositories**
  - Run `Betterwayos`: `npx tsc --noEmit && npx vitest run && npm run build`
  - Run `BetterwayMortgages`: existing tests + `npm run build` (confirming 0 broken links, 0 SWK references, 100% clean build)
  - Start local dev servers and verify live desktop (`1440×900`) and mobile (`390×844`) views across Login, **Warda's Place** vs **Shabib's Corner**, Privacy Fast Track, 22-Registry Master Log, 12-Step Pipeline, Client Vault, Attendance (QR + Hikvision test punch → `#attendance-checkin`), Field GPS, Website Studio → live site update, and AI Case-Study Copilot.
- [ ] **Step 5: Commit across both repos**
  Commit `Betterwayos` (`feat(cms): complete two-way Website & Social Studio sync and E2E verification`) and `BetterwayMortgages` (`feat(cms): connect live offers, rates, team & banners to BetterwayOS with signed revalidation`).
