# Betterway Mortgages OS v2.0 & Dedicated Mobile App

Full-stack **UAE Mortgage Brokerage Operating System (30 Routes)** and **Dedicated 3-Mode Mobile App (PWA + Capacitor 7)** crafted for **Betterway Mortgages LLC** (Al Nasr Plaza, Oud Metha, Dubai, UAE — sister brand to SWK Properties LLC), achieving full **SWKOS v3.9.0** parity in crisp **Simple English** with live partner branding and execution-first workflows.

---

## Key Capabilities

### 1. Owner Command & Safe Client Vault
- **Shabib's Corner (`/shabibs-corner`)**: Simple-English Step `1→12` Playbook, Confidential **AI Bulk Lead Importer** (converts pasted CSV/WhatsApp lists into Masked Vault or New Enquiries), **Owner VIP Fast-Track Override**, and unified Owner Approvals counter.
- **Client Vault & My Assigned Clients (`/vault`, `/my-cases`)**: Hard-masked client phone numbers (`+971 50 ••• •...`, `raw_phone` stripped server-side on `/api/vault/mine`), 1-click Masked Call & Masked WhatsApp outreach logging, and Owner/Manager lead dispatch.

### 2. Origination, 24 Partner Banks & CBUAE Rules
- **12-Step Mortgage Pipeline (`/pipeline`)**: From First Enquiry (`01`) to Bank Disbursal (`10`), Commission Settlement (`11`), and 90-Day Rate-Reset Buyout Watch (`12`).
- **24 Official UAE Banks (`/banks`)**: Official bank SVG/PNG logos, live CBUAE 3M EIBOR snapshot, fixed/variable rates, Islamic/Conventional/Low-Doc/Non-Resident flags, turnaround SLAs, and developer APL coverage (**Emaar, DAMAC, Sobha**).
- **8-Engine CBUAE Calculator (`/calculators`)**: 50% DBR stress test (at 6.5%), UAE National vs Expat vs Non-Resident LTV caps, Dubai DLD Cash-to-Close, Buyout savings, Off-Plan Handover, and Golden Visa AED 2M check.
- **UAE Market Pulse (`/market`)**: 60 UAE freehold communities across Dubai, Abu Dhabi, RAK & Sharjah.

### 3. Daily Execution, Field GPS & Communications
- **My Tasks Today (`/my-work`)** & **Schedule & Deadlines (`/calendar`)**: Overdue/Today/Upcoming checklists, valuations, FOL signing dates, and DLD Trustee appointments.
- **Field Visits GPS & SOS (`/field-duty`)**: Log Bank, Valuation, Developer, and Trustee visits with GPS pins, `End Visit`, and instant **SOS Alert** to Owner & Admin.
- **Betterway Core Suite**: **Betterway Inside** (`/inside` team deal rooms), **Betterway Work** (`/automations` auto follow-ups & rate-reset radar), **Betterway Phone** (`/phone` masked dialer), **Client Messages** (`/communications` WhatsApp/Email templates), and **AI Mortgage Helper** (`/ai`).

### 4. Letters, Utilities, Money, Compliance & HR
- **Letter & Word Studio (`/word-studio`)**: Branded Betterway Quotes, Zero-Fee Agreements, Developer SOA & RERA Partner letters with **Owner Corporate Seal** workflow and `.doc` / Print-PDF export.
- **Utilities Suite (`/utilities`)**: 9-Language glossary-locked Mortgage Translator (EN/AR/HI/UR/RU/FR/ZH/TL/ML), Emirates ID / Passport / Salary OCR extractor, and Unified Global Search.
- **Finance & Zero-Personal-Account Guard (`/finance`)**: Bank DSA commission ledger, 5% UAE VAT, partner payouts, and strict server-side block against personal accounts.
- **Compliance & Owner Delete Bin (`/compliance`)**, **50 Excel Reports (`/data-hub`)**, **Al Nasr Plaza Office QR & Mandatory Daily Close (`/reception-qr`)**, **HR/Visas/Leave/WPS (`/hr`)**, **8K Team Directory (`/team`)**, and **Website & Brand Studio (`/website-studio`)**.

### 5. Dedicated Betterway Mobile App (`/mobile/`)
- Installable **PWA + Capacitor 7** mobile bundle with strict Content-Security-Policy (zero inline styles/scripts):
  - **Advisor OS**: `Today` (KPIs, 1-tap Task checklist, 8-Bank partner ribbon), `Clients` (hard-masked Vault + 12-Step Deals), `24 Banks` (filter pills), `Quote` (instant CBUAE calculator), and `Field` (GPS Visits, SOS, Office Check-In/Out & Daily Close).
  - **Borrower Mode**: Live 12-step progress tracker, dedicated advisor card, bank offers, and camera/PDF document vault upload.
  - **RERA Partner Mode**: 60-second buyer referral attribution lock (incl. SWK Properties Relay) and live Commission Payout Wallet.

---

## Quick Start

```bash
# 1. Install dependencies (requires Node.js 22.13+ or Node.js 24+ with built-in node:sqlite)
npm install

# 2. Build Web OS + Dedicated Mobile App (Capacitor www/)
npm run build

# 3. Verify TypeScript, strict Mobile CSP, and all 5 E2E API test suites
npm run typecheck
node mobile/scripts/build-www.mjs --check
npm test

# 4. Run Betterway OS + Mobile Server
npm start
# Web OS:     http://127.0.0.1:8088
# Mobile App: http://127.0.0.1:8088/mobile/
```

### Default Local Demo Accounts (Password: `Betterway@2026` or 1-Tap Sign-In)
| Role | Name | Email |
|---|---|---|
| Owner | Shabib Siraj | `shabib@betterwaymortgages.com` |
| Executive Director | Warda | `warda@betterwaymortgages.com` |
| Team Manager | Daniel Xavier | `daniel@betterwaymortgages.com` |
| Mortgage Advisor | Asif Khan | `asif@betterwaymortgages.com` |
| Mortgage Advisor | Reshma Rajan | `reshma@betterwaymortgages.com` |
| Coordinator | Elton Frank | `elton@betterwaymortgages.com` |
| Digital Marketing | Mohammad Nusrik | `nusrik@betterwaymortgages.com` |
| HR Manager | Rahaba Azeez | `rahaba@betterwaymortgages.com` |
| Administrator | System Admin | `admin@betterwaymortgages.com` |

---

## Architecture & Strategy Documentation
- [Forensic UAE Mortgage Competitor & OS Benchmark Report](docs/betterway_forensic_competitor_and_os_report.md)
- [SWKOS v3.9.0 vs Betterway Mortgages OS — 31-Feature Parity Matrix](docs/swk_vs_betterway_feature_comparison.md)
