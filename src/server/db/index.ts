import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { UNIFIED_SCHEMA_SQL } from './schema';
import { ensureCommercialProductionReady, seedInitialData } from './seed';
import { resolveDataDir } from './data-dir';
import { hashPassword } from '@/server/auth';

let singletonDb: DatabaseSync | null = null;

export function initializeDatabase(
  db: DatabaseSync,
  shouldSeed = true,
  isCommercialProduction = false,
): DatabaseSync {
  db.exec('PRAGMA foreign_keys = ON;');
  db.exec(UNIFIED_SCHEMA_SQL);
  // Columns added after a database file was first created.
  const ensure = (table: string, col: string, ddl: string) => {
    if (!(db.prepare(`PRAGMA table_info('${table}')`).all() as { name: string }[]).some((c) => c.name === col)) db.exec(`ALTER TABLE ${table} ADD COLUMN ${col} ${ddl}`);
  };
  ensure('data_batches', 'csv_content', "TEXT NOT NULL DEFAULT ''");
  ensure('data_batches', 'applied_rows', 'INTEGER NOT NULL DEFAULT 0');
  ensure('data_rows', 'applied', 'INTEGER NOT NULL DEFAULT 0');
  ensure('users', 'totp_secret', "TEXT NOT NULL DEFAULT ''");
  ensure('users', 'mfa_enabled', 'INTEGER NOT NULL DEFAULT 0');
  ensure('users', 'avatar_url', 'TEXT');
  ensure('users', 'failed_logins', 'INTEGER NOT NULL DEFAULT 0');
  ensure('users', 'locked_until', 'TEXT');
  ensure('users', 'last_login_at', 'TEXT');
  ensure('employees', 'avatar_url', 'TEXT');
  ensure('leads', 'lost_reason', "TEXT NOT NULL DEFAULT ''");
  ensure('company_settings', 'production_lock_enabled', 'INTEGER NOT NULL DEFAULT 0');
  ensure('company_settings', 'office_wifi_ssid', "TEXT NOT NULL DEFAULT 'Betterway-Office-5G'");
  ensure('company_settings', 'office_wifi_ip', "TEXT NOT NULL DEFAULT ''");
  ensure('company_settings', 'office_ip_locked', 'INTEGER NOT NULL DEFAULT 0');
  ensure('vendor_bills', 'approval_status', "TEXT NOT NULL DEFAULT 'APPROVED'");
  ensure('vendor_bills', 'approved_by_user_id', 'INTEGER');
  ensure('conveyancing_cases', 'valuation_access_status', "TEXT NOT NULL DEFAULT 'ACCESS_CONFIRMED'");
  ensure('conveyancing_cases', 'developer_portal_name', "TEXT NOT NULL DEFAULT 'Emaar Sakani Portal'");
  ensure('conveyancing_cases', 'dld_blocking_stage', "TEXT NOT NULL DEFAULT 'NOT_REQUIRED'");
  const items: [string, string, string][] = [
    ['Regulatory', 'Confirm LTV caps (resident, non-resident, first/second home, over AED 5M, off-plan) against the current CBUAE rulebook', 'Compliance'],
    ['Regulatory', 'Confirm DLD fees (transfer, mortgage registration, admin, trustee) against the current DLD schedule and import Fees_and_Closing_Costs', 'Finance'],
    ['Regulatory', 'Confirm UAE e-invoicing go-live dates and appoint an Accredited Service Provider', 'Finance'],
    ['Regulatory', 'Confirm AML scope (DNFBP) against the licensed activities and any lender-delegated controls', 'Compliance'],
    ['Regulatory', 'Confirm legal deadlines for data requests and breach notification (PDPL) with counsel', 'Compliance'],
    ['Decision', 'Sign off and fund the historical 24-hour partner payout target (or keep pay-when-paid)', 'Management'],
    ['Decision', 'Sign off commercial / SME lending scope and lender requirements', 'Management'],
    ['Decision', 'Sign off ancillary referral scope (insurance, conveyancing, FX, Golden Visa) and provider agreements', 'Management'],
    ['Data', 'Import bank master, products and rates, eligibility rules, employer policies, SLAs (files 1-5) with source and approver', 'Credit'],
    ['Data', 'Import project list and handover data (file 11) and partner commission rules (file 12)', 'Operations'],
    ['Data', 'Import staff approval matrix (file 9), lead sources and consent (file 10), templates (file 14)', 'Operations'],
    ['Data', 'Load opening balances (file 15) and legacy cases, borrowers, documents, receivables (files 16-22), reconcile and sign off each batch', 'Finance'],
    ['Security', 'Switch MFA on for every admin, finance, compliance and HR user', 'IT'],
    ['Security', 'Set WHATSAPP_VERIFY_TOKEN / WHATSAPP_APP_SECRET and register the webhook (if WhatsApp is used)', 'IT'],
    ['Accounts', 'Open accounts for AECB, UAE PASS, e-signature, OCR and lender APIs, then build the connectors (see Connectors list)', 'IT'],
    ['Operations', 'Add this year\'s public holidays (they move with moon sighting)', 'Operations'],
  ];
  const addItem = db.prepare('INSERT OR IGNORE INTO go_live_items (area, item, owner) VALUES (?, ?, ?)');
  items.forEach((i) => addItem.run(...i));

  if (isCommercialProduction) {
    ensureCommercialProductionReady(db);
    return db;
  }

  if (shouldSeed) {
    seedInitialData(db);
    // Ensure SWK/Betterway executive & staff accounts exist on upgraded test databases
    const hasShabib = db.prepare("SELECT id FROM users WHERE email = 'shabib@betterwaymortgages.com'").get();
    if (!hasShabib) {
      const pass = hashPassword('Betterway#2026');
      const ins = db.prepare(
        `INSERT OR IGNORE INTO users (email, phone, full_name_en, full_name_ar, password_hash, role, is_mlro, can_approve_rates, preferred_lang)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      );
      ins.run('shabib@betterwaymortgages.com', '+971501000001', 'Shabib Siraj', 'شبيب سراج', pass, 'SUPER_ADMIN', 1, 1, 'en');
      ins.run('admin@betterwaymortgages.com', '+971501000000', 'Betterway Admin', 'مسؤول النظام', pass, 'SUPER_ADMIN', 1, 1, 'en');
      ins.run('haseeb@betterwaymortgages.com', '+971501000002', 'Mohammad Haseeb', 'محمد حسيب', pass, 'SUPER_ADMIN', 0, 1, 'en');
      ins.run('talha@betterwaymortgages.com', '+971501000003', 'Talha Shabbir', 'طلحة شبير', pass, 'SALES_ADVISOR', 0, 0, 'en');
      db.prepare("UPDATE users SET full_name_en = 'Shabib Siraj', full_name_ar = 'شبيب سراج' WHERE email = 'md@betterwaymortgages.com'").run();
    }
    const hasAssets = (db.prepare('SELECT COUNT(*) as c FROM real_estate_assets').get() as { c: number }).c;
    if (hasAssets === 0) {
      db.prepare(
        `INSERT OR IGNORE INTO credit_risk_profiles (
          deal_id, applicant_id, aecb_score, stressed_dbr_bps, ltv_bps, employer_tier,
          bounced_cheques_count, overdue_days, overdue_amount_fils, composite_risk_score,
          risk_grade, dunning_level, credit_committee_decision, risk_notes
        ) VALUES
          (1, 1, 768, 3950, 8000, 'APPROVED_LISTED', 0, 0, 0, 88, 'AAA_PRIME', 'NONE', 'AUTO_APPROVED', 'Composite Score 88/100 (AAA_PRIME) · AECB 768 · Stressed DBR 39.5% · Zero Dishonoured Cheques'),
          (2, 3, 742, 4320, 6000, 'MNC', 0, 0, 0, 81, 'AA_STANDARD', 'NONE', 'AUTO_APPROVED', 'Composite Score 81/100 (AA_STANDARD) · AECB 742 · Non-Resident 60% LTV · Zero Dishonoured Cheques')`,
      ).run();
      db.prepare(
        `INSERT OR IGNORE INTO real_estate_assets (
          property_code, deal_id, household_id, registration_type, title_deed_or_oqood_no,
          dld_plot_no, makani_no, community_name, building_or_project_name, unit_no,
          property_type, built_up_area_sqft, purchase_price_fils, latest_valuation_fils,
          annual_service_charge_fils, ejari_annual_rent_fils, gross_yield_bps, net_yield_bps,
          first_rank_mortgagee_bank, encumbrance_status
        ) VALUES
          ('PROP-DXB-001', 1, 1, 'TITLE_DEED', 'DLD-TD-2026-88412', 'PLOT-631-0412', '29481 94012', 'Dubai Hills Estate', 'Maple 2 at Dubai Hills', 'V-114', 'VILLA', 2470, 350_000_000, 355_000_000, 1_850_000, 21_000_000, 600, 547, 'Emirates NBD', 'FIRST_RANK_MORTGAGE'),
          ('PROP-DXB-002', 2, 2, 'OQOOD_PRE_TITLE', 'DLD-OQD-2026-39104', 'PLOT-392-1108', '18392 74190', 'Dubai Marina', 'Emaar Marina Shores', 'APT-2904', 'APARTMENT', 1680, 400_000_000, 415_000_000, 3_024_000, 25_600_000, 640, 564, 'HSBC UAE', 'DEVELOPER_ESCROW_LIEN')`,
      ).run();
      db.prepare(
        `INSERT OR IGNORE INTO pdc_cheque_register (
          cheque_ref, deal_id, cheque_type, cheque_number, drawer_name, drawer_bank,
          payee_name, amount_fils, maturity_date, vault_status
        ) VALUES
          ('PDC-2026-001', 1, 'SECURITY_DEPOSIT_10PCT', 'CHQ-884120', 'Khalid Al Nuaimi', 'Emirates NBD', 'Seller Escrow — Al Manara DLD Trustee', 35_000_000, '2026-12-01', 'IN_SAFE_VAULT'),
          ('PDC-2026-002', 1, 'AGENCY_FEE_PDC', 'CHQ-884121', 'Khalid Al Nuaimi', 'Emirates NBD', 'Betterway Mortgages LLC', 7_350_000, '2026-12-01', 'IN_SAFE_VAULT'),
          ('PDC-2026-003', 2, 'DLD_MANAGER_CHEQUE', 'MGR-991044', 'HSBC UAE', 'HSBC UAE', 'Emaar Properties DLD Escrow', 240_000_000, '2026-11-28', 'PRESENTED_TO_BANK')`,
      ).run();
    }
  }
  return db;
}

export function getDb(): DatabaseSync {
  if (singletonDb) return singletonDb;
  const dataDir = resolveDataDir();
  const dbPath = process.env.BW_OS_DB_PATH || path.join(dataDir, 'betterway-os.sqlite');
  mkdirSync(path.dirname(dbPath), { recursive: true });
  const db = new DatabaseSync(dbPath);
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA busy_timeout = 5000;');
  initializeDatabase(db, true, true);
  singletonDb = db;
  return db;
}

export function createTestDb(shouldSeed = true): DatabaseSync {
  const db = new DatabaseSync(':memory:');
  return initializeDatabase(db, shouldSeed, false);
}

export function createInMemoryDb(opts?: { seed?: boolean }): DatabaseSync {
  return createTestDb(opts?.seed ?? true);
}
