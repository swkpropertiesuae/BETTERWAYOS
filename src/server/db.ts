import { DatabaseSync } from 'node:sqlite';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { BETTERWAY_STAFF } from '../shared/staff-directory.js';
import { DOCUMENT_CHECKLIST_BY_PROFILE, type BorrowerProfileType } from '../shared/workflow-constants.js';

function resolveDbPath(): string {
  if (process.env.BETTERWAY_DB_PATH) return process.env.BETTERWAY_DB_PATH;
  const preferredDir = process.env.VERCEL ? os.tmpdir() : path.resolve(process.cwd(), 'data');
  try {
    if (!fs.existsSync(preferredDir)) fs.mkdirSync(preferredDir, { recursive: true });
    return path.join(preferredDir, 'betterway-os.sqlite');
  } catch {
    const fallbackDir = os.tmpdir();
    if (!fs.existsSync(fallbackDir)) fs.mkdirSync(fallbackDir, { recursive: true });
    return path.join(fallbackDir, 'betterway-os.sqlite');
  }
}

const DB_PATH = resolveDbPath();
export const db = new DatabaseSync(DB_PATH);

try {
  db.exec('PRAGMA journal_mode = WAL;');
} catch {
  // Serverless tmp filesystems may not support WAL; fall back gracefully.
}
db.exec('PRAGMA foreign_keys = ON;');

export function hashPassword(password: string, salt?: string): string {
  const s = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, s, 32).toString('hex');
  return `${s}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, orig] = stored.split(':');
  if (!salt || !orig) return false;
  const check = crypto.scryptSync(password, salt, 32).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(orig, 'hex'), Buffer.from(check, 'hex'));
}

export function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      emp_code TEXT UNIQUE NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      name_ar TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL,
      tier TEXT NOT NULL,
      designation TEXT NOT NULL,
      department TEXT NOT NULL,
      avatar TEXT,
      portrait TEXT,
      initials TEXT NOT NULL,
      is_elevated INTEGER NOT NULL DEFAULT 0,
      can_approve_deletions INTEGER NOT NULL DEFAULT 0,
      can_approve_payouts INTEGER NOT NULL DEFAULT 0,
      can_lock_wifi INTEGER NOT NULL DEFAULT 0,
      can_print_qr INTEGER NOT NULL DEFAULT 0,
      can_approve_rates INTEGER NOT NULL DEFAULT 0,
      monthly_target_aed REAL NOT NULL DEFAULT 0,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      updated_by TEXT
    );

    CREATE TABLE IF NOT EXISTS leads (
      id TEXT PRIMARY KEY,
      reference_code TEXT UNIQUE NOT NULL,
      contact_name TEXT NOT NULL,
      contact_phone TEXT NOT NULL,
      contact_email TEXT DEFAULT '',
      residency TEXT NOT NULL DEFAULT 'Expat resident',
      borrower_profile TEXT NOT NULL DEFAULT 'salaried',
      goal TEXT NOT NULL DEFAULT 'Resale Purchase (Secondary)',
      property_price_aed REAL NOT NULL DEFAULT 2500000,
      down_payment_pct REAL NOT NULL DEFAULT 20,
      monthly_income_aed REAL NOT NULL DEFAULT 45000,
      source_channel TEXT NOT NULL DEFAULT 'Website',
      source_page TEXT DEFAULT '/contact',
      partner_agency TEXT DEFAULT '',
      partner_brn TEXT DEFAULT '',
      is_swk_relay INTEGER NOT NULL DEFAULT 0,
      consent_pdpl INTEGER NOT NULL DEFAULT 1,
      status TEXT NOT NULL DEFAULT 'New',
      lost_reason TEXT DEFAULT '',
      assigned_to TEXT NOT NULL,
      notes TEXT DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS mortgage_cases (
      id TEXT PRIMARY KEY,
      case_code TEXT UNIQUE NOT NULL,
      lead_id TEXT,
      borrower_name TEXT NOT NULL,
      borrower_phone TEXT NOT NULL,
      borrower_email TEXT DEFAULT '',
      nationality TEXT NOT NULL DEFAULT 'UAE Resident',
      residency_status TEXT NOT NULL DEFAULT 'expat_resident',
      borrower_profile TEXT NOT NULL DEFAULT 'salaried',
      mortgage_type TEXT NOT NULL DEFAULT 'Resale Purchase (Secondary)',
      stage_code TEXT NOT NULL DEFAULT '01_NEW_ENQUIRY',
      emirate TEXT NOT NULL DEFAULT 'Dubai',
      community TEXT NOT NULL,
      project_name TEXT NOT NULL,
      unit_door TEXT DEFAULT '',
      developer TEXT DEFAULT '',
      property_price_aed REAL NOT NULL,
      requested_loan_aed REAL NOT NULL,
      valuation_aed REAL DEFAULT 0,
      monthly_income_aed REAL NOT NULL,
      existing_emis_aed REAL NOT NULL DEFAULT 0,
      card_limits_aed REAL NOT NULL DEFAULT 0,
      borrower_age INTEGER NOT NULL DEFAULT 36,
      ltv_pct REAL NOT NULL,
      dbr_pct REAL NOT NULL,
      primary_bank_key TEXT NOT NULL DEFAULT 'emirates-nbd',
      indicative_rate_pct REAL NOT NULL DEFAULT 3.89,
      dsa_rate_pct REAL NOT NULL DEFAULT 0.85,
      is_swk_relay INTEGER NOT NULL DEFAULT 0,
      partner_agency TEXT DEFAULT '',
      advisor_id TEXT NOT NULL,
      coordinator_id TEXT NOT NULL DEFAULT 'USR-07',
      form_f_expiry TEXT DEFAULT '',
      noc_status TEXT NOT NULL DEFAULT 'Pending',
      transfer_date TEXT DEFAULT '',
      fixed_expiry_date TEXT DEFAULT '',
      portal_token TEXT UNIQUE NOT NULL,
      next_action TEXT NOT NULL DEFAULT 'Complete fact-find & CBUAE DBR check',
      sla_due_at TEXT NOT NULL,
      deleted_soft INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS bank_submissions (
      id TEXT PRIMARY KEY,
      case_id TEXT NOT NULL,
      bank_key TEXT NOT NULL,
      bank_name TEXT NOT NULL,
      lender_ref TEXT NOT NULL,
      product_type TEXT NOT NULL DEFAULT '3Y Fixed',
      rate_pct REAL NOT NULL,
      loan_amount_aed REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'Submitted',
      conditions TEXT DEFAULT '',
      dip_expiry TEXT DEFAULT '',
      submitted_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (case_id) REFERENCES mortgage_cases(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS case_documents (
      id TEXT PRIMARY KEY,
      case_id TEXT NOT NULL,
      doc_name TEXT NOT NULL,
      mandatory INTEGER NOT NULL DEFAULT 1,
      status TEXT NOT NULL DEFAULT 'Missing',
      vault_ref TEXT DEFAULT '',
      verified_by TEXT DEFAULT '',
      expiry_date TEXT DEFAULT '',
      updated_at TEXT NOT NULL,
      FOREIGN KEY (case_id) REFERENCES mortgage_cases(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS quotes (
      id TEXT PRIMARY KEY,
      case_id TEXT,
      borrower_name TEXT NOT NULL,
      bank_key TEXT NOT NULL,
      bank_name TEXT NOT NULL,
      rule_version TEXT NOT NULL,
      eibor_date TEXT NOT NULL,
      property_price_aed REAL NOT NULL,
      loan_amount_aed REAL NOT NULL,
      tenure_years INTEGER NOT NULL,
      fixed_rate_pct REAL NOT NULL,
      fixed_years INTEGER NOT NULL,
      revert_rate_pct REAL NOT NULL,
      intro_emi_aed REAL NOT NULL,
      revert_emi_aed REAL NOT NULL,
      cash_to_close_aed REAL NOT NULL,
      dbr_pct REAL NOT NULL,
      ltv_pct REAL NOT NULL,
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS finance_ledger (
      id TEXT PRIMARY KEY,
      invoice_ref TEXT UNIQUE NOT NULL,
      case_id TEXT NOT NULL,
      case_code TEXT NOT NULL,
      borrower_name TEXT NOT NULL,
      bank_key TEXT NOT NULL,
      bank_name TEXT NOT NULL,
      loan_disbursed_aed REAL NOT NULL,
      dsa_rate_pct REAL NOT NULL,
      gross_dsa_aed REAL NOT NULL,
      vat_aed REAL NOT NULL,
      partner_share_aed REAL NOT NULL DEFAULT 0,
      swk_relay_fee_aed REAL NOT NULL DEFAULT 0,
      net_betterway_aed REAL NOT NULL,
      payment_channel TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Accrued',
      clawback_until TEXT NOT NULL,
      approved_by TEXT DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS withdrawals (
      id TEXT PRIMARY KEY,
      case_id TEXT NOT NULL,
      case_code TEXT NOT NULL,
      borrower_name TEXT NOT NULL,
      reason TEXT NOT NULL,
      paid_fee_aed REAL NOT NULL,
      refundable_aed REAL NOT NULL,
      deduction_aed REAL NOT NULL,
      payment_channel TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Pending Owner Approval',
      requested_by TEXT NOT NULL,
      approved_by TEXT DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS partner_referrals (
      id TEXT PRIMARY KEY,
      referral_code TEXT UNIQUE NOT NULL,
      agency_name TEXT NOT NULL,
      agent_name TEXT NOT NULL,
      agent_phone TEXT NOT NULL,
      rera_orn TEXT NOT NULL,
      rera_brn TEXT NOT NULL,
      buyer_name TEXT NOT NULL,
      property_value_aed REAL NOT NULL,
      target_loan_aed REAL NOT NULL,
      stage_label TEXT NOT NULL DEFAULT 'Fact-Find',
      commission_share_pct REAL NOT NULL DEFAULT 25,
      estimated_payout_aed REAL NOT NULL,
      payout_status TEXT NOT NULL DEFAULT 'Tracked',
      case_id TEXT DEFAULT '',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS attendance_events (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      user_name TEXT NOT NULL,
      event_type TEXT NOT NULL,
      mode TEXT NOT NULL DEFAULT 'OFFICE_QR',
      dubai_date TEXT NOT NULL,
      dubai_time TEXT NOT NULL,
      late_minutes INTEGER NOT NULL DEFAULT 0,
      wifi_ip TEXT DEFAULT '',
      gps_lat REAL,
      gps_lng REAL,
      note TEXT DEFAULT '',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS daily_reports (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      user_name TEXT NOT NULL,
      dubai_date TEXT NOT NULL,
      summary_today TEXT NOT NULL,
      plan_tomorrow TEXT NOT NULL,
      calls_made INTEGER NOT NULL DEFAULT 0,
      cases_submitted INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS compliance_records (
      id TEXT PRIMARY KEY,
      record_code TEXT UNIQUE NOT NULL,
      case_id TEXT DEFAULT '',
      category TEXT NOT NULL,
      subject TEXT NOT NULL,
      risk_band TEXT NOT NULL DEFAULT 'Low',
      status TEXT NOT NULL DEFAULT 'Open',
      owner_name TEXT NOT NULL,
      notes TEXT DEFAULT '',
      seal_approved_by TEXT DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS recycle_bin_requests (
      id TEXT PRIMARY KEY,
      entity_type TEXT NOT NULL,
      record_id TEXT NOT NULL,
      record_label TEXT NOT NULL,
      snapshot_json TEXT NOT NULL,
      reason TEXT NOT NULL,
      requested_by TEXT NOT NULL,
      requested_by_name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Pending Owner Approval',
      decided_by TEXT DEFAULT '',
      decided_at TEXT DEFAULT '',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      actor_id TEXT NOT NULL,
      actor_name TEXT NOT NULL,
      actor_role TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      record_id TEXT NOT NULL,
      action TEXT NOT NULL,
      reason TEXT DEFAULT '',
      details TEXT DEFAULT '',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS automations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      trigger_event TEXT NOT NULL,
      condition_expr TEXT NOT NULL,
      action_desc TEXT NOT NULL,
      channel TEXT NOT NULL,
      enabled INTEGER NOT NULL DEFAULT 1,
      runs_count INTEGER NOT NULL DEFAULT 0,
      last_run_at TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS chat_messages (
      id TEXT PRIMARY KEY,
      channel TEXT NOT NULL,
      sender_id TEXT NOT NULL,
      sender_name TEXT NOT NULL,
      sender_avatar TEXT,
      body TEXT NOT NULL,
      case_ref TEXT DEFAULT '',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS call_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      user_name TEXT NOT NULL,
      contact_name TEXT NOT NULL,
      masked_number TEXT NOT NULL,
      direction TEXT NOT NULL DEFAULT 'Outbound',
      duration_sec INTEGER NOT NULL DEFAULT 0,
      outcome TEXT NOT NULL DEFAULT 'Connected',
      notes TEXT DEFAULT '',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      link TEXT DEFAULT '/dashboard',
      severity TEXT NOT NULL DEFAULT 'info',
      read_at TEXT DEFAULT '',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS change_feed (
      seq INTEGER PRIMARY KEY AUTOINCREMENT,
      entity TEXT NOT NULL,
      record_id TEXT NOT NULL,
      action TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);
}

export function bumpChangeFeed(entity: string, recordId: string, action: string) {
  db.prepare('INSERT INTO change_feed (entity, record_id, action, created_at) VALUES (?, ?, ?, ?)').run(
    entity,
    recordId,
    action,
    new Date().toISOString(),
  );
}

export function logAudit(
  actor: { id: string; name: string; role: string },
  entityType: string,
  recordId: string,
  action: string,
  reason = '',
  details = '',
) {
  db.prepare(
    'INSERT INTO audit_log (actor_id, actor_name, actor_role, entity_type, record_id, action, reason, details, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
  ).run(actor.id, actor.name, actor.role, entityType, recordId, action, reason, details, new Date().toISOString());
  bumpChangeFeed(entityType, recordId, action);
}

export function seedIfEmpty() {
  initSchema();
  const userCount = (db.prepare('SELECT COUNT(*) as c FROM users').get() as { c: number }).c;
  const now = new Date().toISOString();

  if (userCount === 0) {
    const defaultHash = hashPassword('Betterway@2026');
    const insUser = db.prepare(`
      INSERT INTO users (
        id, emp_code, slug, name, name_ar, email, phone, password_hash, role, tier,
        designation, department, avatar, portrait, initials, is_elevated,
        can_approve_deletions, can_approve_payouts, can_lock_wifi, can_print_qr, can_approve_rates,
        monthly_target_aed, active, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
    `);
    for (const s of BETTERWAY_STAFF) {
      insUser.run(
        s.id, s.empCode, s.slug, s.name, s.nameAr, s.email, s.phone, defaultHash,
        s.role, s.tier, s.designation, s.department, s.avatar, s.portrait, s.initials,
        s.isElevated ? 1 : 0, s.canApproveDeletions ? 1 : 0, s.canApprovePayouts ? 1 : 0,
        s.canLockOfficeWifi ? 1 : 0, s.canPrintReceptionQr ? 1 : 0, s.canApproveRates ? 1 : 0,
        s.monthlyTargetAed, now,
      );
    }

    const insSet = db.prepare('INSERT OR IGNORE INTO settings (key, value, updated_at, updated_by) VALUES (?, ?, ?, ?)');
    insSet.run('office_wifi_ssid', 'Betterway-AlNasrPlaza-5G', now, 'USR-03');
    insSet.run('office_wifi_ip', '127.0.0.1,::1,192.168.1.0/24', now, 'USR-03');
    insSet.run('office_wifi_locked', '1', now, 'USR-03');
    insSet.run('qr_secret', crypto.randomBytes(24).toString('hex'), now, 'USR-03');
    insSet.run('qr_rotation_sec', '20', now, 'USR-03');
    insSet.run('office_address', 'Al Nasr Plaza, Plot 319-310, Oud Metha Road, Dubai, UAE', now, 'USR-01');
    insSet.run('ded_license', 'DED #1084921 · CBUAE-MB-2025-041', now, 'USR-01');
    insSet.run('eibor_last_sync', '2026-11-06', now, 'USR-03');
  }

  const caseCount = (db.prepare('SELECT COUNT(*) as c FROM mortgage_cases').get() as { c: number }).c;
  if (caseCount === 0) {
    // Seed 12 rich institutional UAE mortgage cases spanning all 12 milestones & 5+ mortgage types
    const casesSeed = [
      {
        id: 'CASE-01', code: 'BW-2026-M01', name: 'Afshin Behbahani', phone: '+971 50 422 4218', email: 'afshin.b@client.ae',
        nat: 'UAE Resident', res: 'expat_resident', prof: 'salaried' as BorrowerProfileType, type: 'Handover Payment (SOA)',
        stage: '06_PRE_APPROVAL', emirate: 'Dubai', comm: 'Business Bay', proj: 'Al Habtoor Tower', door: 'Door #1009', dev: 'Al Habtoor Group',
        price: 3_444_275, loan: 2_238_779, val: 3_520_000, inc: 68_000, emis: 4_200, cards: 40_000, age: 41,
        bank: 'dib', rate: 3.95, dsa: 0.85, swk: 1, partner: 'SWK Properties LLC', adv: 'USR-04', noc: 'Requested', formF: '2026-12-18', xfer: '2026-12-28', fixExp: '2029-12-28',
        next: 'Collect signed DIP acceptance & schedule DIB valuation', token: 'bw-trk-m01',
      },
      {
        id: 'CASE-02', code: 'BW-2026-M02', name: 'Enrico Lubrano', phone: '+971 50 294 0211', email: 'enrico.l@client.ae',
        nat: 'Italy (Resident)', res: 'expat_resident', prof: 'self_employed_full' as BorrowerProfileType, type: 'Handover Payment (SOA)',
        stage: '07_VALUATION', emirate: 'Dubai', comm: 'MBR City', proj: 'Azizi Riviera Rêve', door: 'Door #1101', dev: 'Azizi Developments',
        price: 3_090_135, loan: 2_008_588, val: 3_150_000, inc: 82_000, emis: 6_500, cards: 50_000, age: 44,
        bank: 'emirates-nbd', rate: 3.89, dsa: 0.85, swk: 1, partner: 'SWK Properties LLC', adv: 'USR-05', noc: 'In Progress', formF: '2026-12-12', xfer: '2026-12-22', fixExp: '2029-12-22',
        next: 'Review ENBD valuation report (+AED 60k uplift) & issue FOL', token: 'bw-trk-m02',
      },
      {
        id: 'CASE-03', code: 'BW-2026-M03', name: 'Karim Al Alami', phone: '+971 56 134 1934', email: 'karim.alami@client.ae',
        nat: 'Canada (Resident)', res: 'expat_resident', prof: 'salaried' as BorrowerProfileType, type: 'Resale Purchase (Secondary)',
        stage: '08_FINAL_OFFER', emirate: 'Dubai', comm: 'Dubai Creek Harbour', proj: 'Greenside Residence', door: 'Door #A1001', dev: 'Emaar Properties',
        price: 1_713_888, loan: 1_371_110, val: 1_750_000, inc: 42_000, emis: 2_500, cards: 25_000, age: 34,
        bank: 'emirates-nbd', rate: 3.89, dsa: 0.85, swk: 1, partner: 'SWK Properties LLC', adv: 'USR-05', noc: 'Approved', formF: '2026-12-05', xfer: '2026-12-10', fixExp: '2029-12-10',
        next: 'Bind external decreasing life cover (saves AED 21k) & book DLD Trustee', token: 'bw-trk-m03',
      },
      {
        id: 'CASE-04', code: 'BW-2026-M04', name: 'Matthias Pohl', phone: '+971 54 453 8845', email: 'm.pohl@client.de',
        nat: 'Germany (Resident)', res: 'expat_resident', prof: 'salaried' as BorrowerProfileType, type: 'Handover Payment (SOA)',
        stage: '09_TRANSFER_NOC', emirate: 'Dubai', comm: 'DAMAC Lagoons', proj: 'Portofino Cluster', door: 'Villa DL-BL103', dev: 'DAMAC Properties',
        price: 2_750_000, loan: 2_200_000, val: 2_920_000, inc: 64_000, emis: 3_100, cards: 30_000, age: 39,
        bank: 'emirates-nbd', rate: 3.89, dsa: 0.85, swk: 1, partner: 'SWK Properties LLC', adv: 'USR-04', noc: 'Approved', formF: '2026-11-30', xfer: '2026-12-02', fixExp: '2029-12-02',
        next: 'Confirm Manager Cheques & DLD Trustee slot at Barsha Heights', token: 'bw-trk-m04',
      },
      {
        id: 'CASE-05', code: 'BW-2026-M05', name: 'Soumia Belkhoumani', phone: '+971 52 391 5656', email: 'soumia.b@client.ae',
        nat: 'France (Non-Resident)', res: 'non_resident', prof: 'non_resident' as BorrowerProfileType, type: 'Non-Resident Purchase',
        stage: '05_BANK_SUBMISSION', emirate: 'Dubai', comm: 'DAMAC Lagoons', proj: 'Nice Cluster', door: 'Villa 8070', dev: 'DAMAC Properties',
        price: 2_675_000, loan: 1_605_000, val: 2_675_000, inc: 74_000, emis: 4_000, cards: 20_000, age: 42,
        bank: 'mashreq', rate: 3.95, dsa: 0.90, swk: 0, partner: 'Horizon Prime Realty', adv: 'USR-04', noc: 'Pending', formF: '2026-12-28', xfer: '', fixExp: '',
        next: 'Submit parallel pack to CBD & Mashreq Non-Resident Desk', token: 'bw-trk-m05',
      },
      {
        id: 'CASE-06', code: 'BW-2026-M06', name: 'Tariq Al Mansoori', phone: '+971 50 882 1190', email: 'tariq.m@emirates.ae',
        nat: 'UAE National', res: 'uae_national', prof: 'salaried' as BorrowerProfileType, type: 'Resale Purchase (Secondary)',
        stage: '10_DISBURSAL', emirate: 'Dubai', comm: 'Dubai Hills Estate', proj: 'Sidra Villas III', door: 'Villa S3-114', dev: 'Emaar Properties',
        price: 4_850_000, loan: 4_122_500, val: 4_950_000, inc: 95_000, emis: 8_000, cards: 60_000, age: 37,
        bank: 'fab', rate: 3.94, dsa: 0.80, swk: 0, partner: 'Direct Website', adv: 'USR-04', noc: 'Completed', formF: '2026-11-20', xfer: '2026-11-24', fixExp: '2029-11-24',
        next: 'Title Deed mortgaged; raise FAB DSA invoice AED 32,980 + VAT', token: 'bw-trk-m06',
      },
      {
        id: 'CASE-07', code: 'BW-2026-M07', name: 'Rohan Deshmukh', phone: '+971 55 741 9920', email: 'rohan.d@techventures.ae',
        nat: 'India (Resident)', res: 'expat_resident', prof: 'self_employed_low_doc' as BorrowerProfileType, type: 'Buy-Out + Equity',
        stage: '04_DOC_REVIEW', emirate: 'Dubai', comm: 'Jumeirah Village Circle (JVC)', proj: 'Terrazzo Building B', door: 'Unit B510', dev: 'Taraf Holding',
        price: 2_338_000, loan: 1_402_800, val: 2_410_000, inc: 58_000, emis: 5_200, cards: 35_000, age: 40,
        bank: 'rakbank', rate: 4.15, dsa: 0.95, swk: 1, partner: 'SWK Properties LLC', adv: 'USR-05', noc: 'Pending', formF: '', xfer: '', fixExp: '',
        next: 'Verify Q4 VAT return & AED 1,050 pre-approval fee cheque for Low-Doc tier', token: 'bw-trk-m07',
      },
      {
        id: 'CASE-08', code: 'BW-2026-M08', name: 'Elena Petrova', phone: '+971 58 612 3044', email: 'elena.petrova@client.ae',
        nat: 'UK (Resident)', res: 'expat_resident', prof: 'salaried' as BorrowerProfileType, type: 'Buy-Out (Refinance)',
        stage: '11_SETTLEMENT', emirate: 'Dubai', comm: 'Dubai Marina', proj: 'Marina Gate II', door: 'Unit 2804', dev: 'Select Group',
        price: 3_600_000, loan: 2_450_000, val: 3_750_000, inc: 72_000, emis: 3_000, cards: 30_000, age: 38,
        bank: 'hsbc', rate: 3.84, dsa: 0.75, swk: 0, partner: 'Direct Website', adv: 'USR-05', noc: 'Completed', formF: '', xfer: '2026-11-18', fixExp: '2029-11-18',
        next: 'Reconcile HSBC DSA wire (AED 18,375) & close settlement', token: 'bw-trk-m08',
      },
      {
        id: 'CASE-09', code: 'BW-2026-M09', name: 'Faisal Al Qasimi', phone: '+971 50 318 7701', email: 'faisal.q@client.ae',
        nat: 'UAE National', res: 'uae_national', prof: 'salaried' as BorrowerProfileType, type: 'Equity Refinance',
        stage: '12_CLOSED', emirate: 'Abu Dhabi', comm: 'Yas Island', proj: 'Yas Acres North Bay', door: 'Villa YA-42', dev: 'Aldar Properties',
        price: 5_200_000, loan: 3_120_000, val: 5_350_000, inc: 110_000, emis: 12_000, cards: 50_000, age: 45,
        bank: 'adib', rate: 3.99, dsa: 0.80, swk: 0, partner: 'Capital Crest Brokers', adv: 'USR-04', noc: 'Completed', formF: '', xfer: '2026-11-05', fixExp: '2027-02-15',
        next: 'Rate-Reset Alert armed (90d before 2027-02-15 revert)', token: 'bw-trk-m09',
      },
      {
        id: 'CASE-10', code: 'BW-2026-M10', name: 'Nadia Al Hashimi', phone: '+971 56 904 2219', email: 'nadia.h@client.ae',
        nat: 'Jordan (Resident)', res: 'expat_resident', prof: 'salaried' as BorrowerProfileType, type: 'Resale Purchase (Secondary)',
        stage: '03_SHORTLIST', emirate: 'Dubai', comm: 'Sobha Hartland (MBR City)', proj: 'Sobha One Tower B', door: 'Unit 1904', dev: 'Sobha Realty',
        price: 2_480_000, loan: 1_984_000, val: 0, inc: 48_000, emis: 2_200, cards: 20_000, age: 33,
        bank: 'emirates-islamic', rate: 3.92, dsa: 0.85, swk: 0, partner: 'Direct Website', adv: 'USR-06', noc: 'Pending', formF: '2026-12-20', xfer: '', fixExp: '',
        next: 'Send 3-bank KFS quote comparison (EI vs DIB vs ENBD)', token: 'bw-trk-m10',
      },
      {
        id: 'CASE-11', code: 'BW-2026-M11', name: 'James Whitaker', phone: '+971 52 801 4451', email: 'j.whitaker@client.uk',
        nat: 'UK (Resident)', res: 'expat_resident', prof: 'salaried' as BorrowerProfileType, type: 'Off-Plan Finance',
        stage: '02_FACT_FIND', emirate: 'Dubai', comm: 'The Oasis by Emaar', proj: 'Palmiera Phase 2', door: 'Villa P2-19', dev: 'Emaar Properties',
        price: 8_400_000, loan: 4_200_000, val: 0, inc: 135_000, emis: 9_000, cards: 75_000, age: 46,
        bank: 'adcb', rate: 3.99, dsa: 0.80, swk: 1, partner: 'SWK Properties LLC', adv: 'USR-04', noc: 'Pending', formF: '', xfer: '', fixExp: '',
        next: 'Confirm 50% CBUAE off-plan LTV & Emaar escrow SOA milestone', token: 'bw-trk-m11',
      },
      {
        id: 'CASE-12', code: 'BW-2026-M12', name: 'Vikramjit Singh', phone: '+971 55 319 6702', email: 'vikram.s@client.ae',
        nat: 'India (Resident)', res: 'expat_resident', prof: 'salaried' as BorrowerProfileType, type: 'Resale Purchase (Secondary)',
        stage: '01_NEW_ENQUIRY', emirate: 'Dubai', comm: 'Al Furjan', proj: 'Tilal Al Furjan', door: 'Townhouse TF-208', dev: 'Nakheel',
        price: 3_250_000, loan: 2_600_000, val: 0, inc: 56_000, emis: 3_500, cards: 30_000, age: 36,
        bank: 'cbd', rate: 3.99, dsa: 0.90, swk: 0, partner: 'Direct Website', adv: 'USR-06', noc: 'Pending', formF: '', xfer: '', fixExp: '',
        next: 'Initial discovery call & AECB consent capture', token: 'bw-trk-m12',
      },
    ];

    const insCase = db.prepare(`
      INSERT INTO mortgage_cases (
        id, case_code, borrower_name, borrower_phone, borrower_email, nationality, residency_status,
        borrower_profile, mortgage_type, stage_code, emirate, community, project_name, unit_door, developer,
        property_price_aed, requested_loan_aed, valuation_aed, monthly_income_aed, existing_emis_aed, card_limits_aed,
        borrower_age, ltv_pct, dbr_pct, primary_bank_key, indicative_rate_pct, dsa_rate_pct, is_swk_relay,
        partner_agency, advisor_id, coordinator_id, form_f_expiry, noc_status, transfer_date, fixed_expiry_date,
        portal_token, next_action, sla_due_at, created_at, updated_at
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `);
    const insDoc = db.prepare(`
      INSERT INTO case_documents (id, case_id, doc_name, mandatory, status, vault_ref, verified_by, expiry_date, updated_at)
      VALUES (?,?,?,?,?,?,?,?,?)
    `);
    const insSub = db.prepare(`
      INSERT INTO bank_submissions (id, case_id, bank_key, bank_name, lender_ref, product_type, rate_pct, loan_amount_aed, status, conditions, dip_expiry, submitted_at, updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
    `);

    const slaFuture = new Date(Date.now() + 48 * 3600 * 1000).toISOString();
    const bankNameMap: Record<string, string> = {
      'emirates-nbd': 'Emirates NBD', fab: 'First Abu Dhabi Bank', dib: 'Dubai Islamic Bank',
      adcb: 'ADCB', adib: 'Abu Dhabi Islamic Bank', 'emirates-islamic': 'Emirates Islamic',
      hsbc: 'HSBC UAE', mashreq: 'Mashreq Bank', cbd: 'Commercial Bank of Dubai', rakbank: 'RAKBANK',
    };

    for (const c of casesSeed) {
      const ltv = Number(((c.loan / c.price) * 100).toFixed(1));
      const dbr = Number((((c.emis + c.cards * 0.05 + (c.loan * 0.00675)) / c.inc) * 100).toFixed(1));
      insCase.run(
        c.id, c.code, c.name, c.phone, c.email, c.nat, c.res, c.prof, c.type, c.stage,
        c.emirate, c.comm, c.proj, c.door, c.dev, c.price, c.loan, c.val, c.inc, c.emis, c.cards,
        c.age, ltv, Math.min(49.5, dbr), c.bank, c.rate, c.dsa, c.swk, c.partner, c.adv, 'USR-07',
        c.formF, c.noc, c.xfer, c.fixExp, c.token, c.next, slaFuture, now, now,
      );

      const checklist = DOCUMENT_CHECKLIST_BY_PROFILE[c.prof];
      const stageNum = Number(c.stage.slice(0, 2));
      checklist.forEach((doc, idx) => {
        const status =
          stageNum >= 6 ? 'Verified' : stageNum >= 4 ? (idx < checklist.length - 1 ? 'Verified' : 'Uploaded') : idx < 3 ? 'Uploaded' : 'Missing';
        insDoc.run(
          `${c.id}-DOC-${idx + 1}`,
          c.id,
          doc.name,
          doc.mandatory ? 1 : 0,
          status,
          status === 'Missing' ? '' : `VAULT/${c.code}/doc_${idx + 1}.pdf`,
          status === 'Verified' ? 'Elton Frank' : '',
          '2027-03-31',
          now,
        );
      });

      if (stageNum >= 5) {
        const subStatus =
          stageNum >= 10 ? 'Disbursed' : stageNum >= 8 ? 'Final Offer Issued' : stageNum >= 6 ? 'Pre-Approved (DIP)' : 'Underwriting Review';
        insSub.run(
          `SUB-${c.id}-1`, c.id, c.bank, bankNameMap[c.bank] || c.bank.toUpperCase(),
          `${c.bank.toUpperCase().slice(0, 4)}-2026-${c.code.slice(-3)}`,
          '3Y Fixed → 3M EIBOR + 1.75%', c.rate, c.loan, subStatus,
          stageNum >= 6 ? 'Subject to satisfactory valuation & life cover' : 'Pending AECB clearance',
          '2027-01-25', now, now,
        );
        if (stageNum >= 5 && stageNum <= 7) {
          const altKey = c.bank === 'emirates-nbd' ? 'dib' : 'emirates-nbd';
          insSub.run(
            `SUB-${c.id}-2`, c.id, altKey, bankNameMap[altKey] || altKey,
            `${altKey.toUpperCase().slice(0, 4)}-2026-B${c.code.slice(-2)}`,
            '5Y Fixed Parallel Backup', Number((c.rate + 0.1).toFixed(2)), c.loan,
            'Backup Submitted', 'Parallel rate-lock protection', '2027-01-30', now, now,
          );
        }
      }
    }

    // Seed Leads
    const insLead = db.prepare(`
      INSERT INTO leads (
        id, reference_code, contact_name, contact_phone, contact_email, residency, borrower_profile, goal,
        property_price_aed, down_payment_pct, monthly_income_aed, source_channel, source_page,
        partner_agency, partner_brn, is_swk_relay, consent_pdpl, status, assigned_to, notes, created_at, updated_at
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `);
    const leadsSeed = [
      ['LD-01', 'BW-ENQ-4821', 'Omar Al Suwaidi', '+971 50 773 4102', 'omar.s@uae.ae', 'UAE National', 'salaried', 'Resale Purchase (Secondary)', 4_200_000, 15, 78_000, 'Website Calculator', '/calculators/dbr', '', '', 0, 1, 'Qualified', 'USR-04', 'Checking 85% LTV for Arabian Ranches 3 villa'],
      ['LD-02', 'BW-ENQ-4822', 'Sarah Jenkins', '+971 58 214 9088', 'sarah.j@london.co.uk', 'Non-resident', 'non_resident', 'Non-Resident Purchase', 2_900_000, 40, 88_000, 'Partner Hub', '/partners', 'SWK Properties LLC', 'BRN-54210', 1, 1, 'Contacted', 'USR-05', 'UK GBP earner buying Dubai Creek Harbour 2BR via SWK agent Talha'],
      ['LD-03', 'BW-ENQ-4823', 'Deepak Nair', '+971 55 902 1144', 'deepak@nairlogistics.ae', 'Expat resident', 'self_employed_low_doc', 'Buy-Out + Equity', 3_100_000, 35, 65_000, 'WhatsApp Direct', '/whatsapp', '', '', 0, 1, 'New', 'USR-06', 'SME owner seeking Low-Doc buyout from 5.85% revert rate'],
      ['LD-04', 'BW-ENQ-4824', 'Amira Hassan', '+971 52 440 8120', 'amira.h@difc.ae', 'Expat resident', 'salaried', 'Handover Payment (SOA)', 2_150_000, 20, 46_000, 'SWK Relay', '/swk-relay', 'SWK Properties LLC', 'BRN-58102', 1, 1, 'New', 'USR-06', 'Q1 2027 handover balloon at Sobha Hartland'],
      ['LD-05', 'BW-ENQ-4825', 'Marco Rossi', '+971 54 611 3900', 'marco@rossi.it', 'Expat resident', 'salaried', 'Buy-Out (Refinance)', 4_600_000, 30, 84_000, 'Website Contact', '/rates/emirates-nbd', '', '', 0, 1, 'Qualified', 'USR-05', 'Current 3Y fixed ending in 70 days — clear AED 1,850/mo savings'],
    ];
    for (const l of leadsSeed) insLead.run(...l, now, now);

    // Seed Finance Ledger
    const insFin = db.prepare(`
      INSERT INTO finance_ledger (
        id, invoice_ref, case_id, case_code, borrower_name, bank_key, bank_name, loan_disbursed_aed,
        dsa_rate_pct, gross_dsa_aed, vat_aed, partner_share_aed, swk_relay_fee_aed, net_betterway_aed,
        payment_channel, status, clawback_until, approved_by, created_at, updated_at
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `);
    insFin.run('FIN-01', 'INV-BW-2026-0101', 'CASE-06', 'BW-2026-M06', 'Tariq Al Mansoori', 'fab', 'First Abu Dhabi Bank', 4_122_500, 0.80, 32_980, 1_649, 0, 0, 32_980, 'Lending Bank Direct DSA Settlement Wire (SWIFT/UAEFTS)', 'Invoiced', '2027-05-24', 'Shabib Siraj', now, now);
    insFin.run('FIN-02', 'INV-BW-2026-0102', 'CASE-08', 'BW-2026-M08', 'Elena Petrova', 'hsbc', 'HSBC UAE', 2_450_000, 0.75, 18_375, 918.75, 0, 0, 18_375, 'Lending Bank Direct DSA Settlement Wire (SWIFT/UAEFTS)', 'Settled', '2027-05-18', 'Shabib Siraj', now, now);
    insFin.run('FIN-03', 'INV-BW-2026-0103', 'CASE-09', 'BW-2026-M09', 'Faisal Al Qasimi', 'adib', 'Abu Dhabi Islamic Bank', 3_120_000, 0.80, 24_960, 1_248, 6_240, 0, 18_720, 'Betterway Mortgages LLC Corporate Bank Account (AED)', 'Settled', '2027-05-05', 'Shabib Siraj', now, now);
    insFin.run('FIN-04', 'INV-BW-2026-0104', 'CASE-04', 'BW-2026-M04', 'Matthias Pohl', 'emirates-nbd', 'Emirates NBD', 2_200_000, 0.85, 18_700, 935, 0, 55_000, 18_700, 'DLD Trustee / Developer Escrow Account', 'Accrued', '2027-06-02', '', now, now);

    // Seed Partner Referrals
    const insPart = db.prepare(`
      INSERT INTO partner_referrals (
        id, referral_code, agency_name, agent_name, agent_phone, rera_orn, rera_brn,
        buyer_name, property_value_aed, target_loan_aed, stage_label, commission_share_pct,
        estimated_payout_aed, payout_status, case_id, created_at
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `);
    insPart.run('PRT-01', 'BWP-2026-001', 'SWK Properties LLC', 'Talha Shabbir', '+971 55 811 2020', 'ORN-31910', 'BRN-54210', 'Karim Al Alami', 1_713_888, 1_371_110, 'Final Offer (FOL)', 30, 3_496, 'Pending Disbursal', 'CASE-03', now);
    insPart.run('PRT-02', 'BWP-2026-002', 'SWK Properties LLC', 'Umar Farooq', '+971 55 811 2024', 'ORN-31910', 'BRN-58119', 'Matthias Pohl', 2_750_000, 2_200_000, 'NOC & DLD Transfer', 30, 5_610, 'Pending Disbursal', 'CASE-04', now);
    insPart.run('PRT-03', 'BWP-2026-003', 'Capital Crest Brokers', 'Rami Khoury', '+971 50 492 8831', 'ORN-29412', 'BRN-49103', 'Faisal Al Qasimi', 5_200_000, 3_120_000, 'Disbursed & Settled', 25, 6_240, 'Approved for Payout', 'CASE-09', now);
    insPart.run('PRT-04', 'BWP-2026-004', 'Horizon Prime Realty', 'Claire Beaumont', '+971 58 930 1120', 'ORN-24810', 'BRN-41982', 'Soumia Belkhoumani', 2_675_000, 1_605_000, 'Bank Submission', 25, 3_611, 'Tracked', 'CASE-05', now);

    // Seed Withdrawals
    db.prepare(`
      INSERT INTO withdrawals (id, case_id, case_code, borrower_name, reason, paid_fee_aed, refundable_aed, deduction_aed, payment_channel, status, requested_by, created_at, updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
    `).run(
      'WDR-01', 'CASE-07', 'BW-2026-M07', 'Rohan Deshmukh', 'Seller withdrew prior to bank valuation inspection',
      3_150, 2_100, 1_050, 'Betterway Mortgages LLC Corporate Bank Account (AED)',
      'Pending Owner Approval', 'Asif Khan', now, now,
    );

    // Seed Compliance & Governance Records
    const insComp = db.prepare(`
      INSERT INTO compliance_records (id, record_code, case_id, category, subject, risk_band, status, owner_name, notes, seal_approved_by, created_at, updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
    `);
    insComp.run('CMP-01', 'AML-2026-001', 'CASE-05', 'goAML / Enhanced Due Diligence', 'Non-Resident Source-of-Funds verification (France EUR wire)', 'Medium', 'In Review', 'Warda', '6-month BNP Paribas statements + notarized PoA wording verified', '', now, now);
    insComp.run('CMP-02', 'PDPL-2026-014', 'CASE-01', 'UAE PDPL Law 45/2021 Consent', 'Explicit multi-bank credit sharing authorization signed', 'Low', 'Cleared', 'Elton Frank', 'Signed borrower disclosure vault-archived', 'Shabib Siraj', now, now);
    insComp.run('CMP-03', 'SEAL-2026-009', 'CASE-03', 'Corporate Seal & KFS Governance', 'Betterway Official KFS & Broker Engagement Letter Seal Request', 'Low', 'Pending Owner Seal', 'Daniel Xavier', 'Awaiting Managing Director digital seal before client dispatch', '', now, now);

    // Seed Automations
    const insAuto = db.prepare(`
      INSERT INTO automations (id, name, trigger_event, condition_expr, action_desc, channel, enabled, runs_count, last_run_at)
      VALUES (?,?,?,?,?,?,?,?,?)
    `);
    insAuto.run('AUT-01', '90-Day Fixed-Rate Expiry Buyout Radar', 'DAILY_CRON_0900', 'fixed_expiry_date <= +90 days AND consent_pdpl = 1', 'Compute buyout savings vs 3M EIBOR revert & notify Advisor + Client WhatsApp', 'WhatsApp + OS Alert', 1, 42, now);
    insAuto.run('AUT-02', 'Website Lead 5-Minute SLA Escalation', 'LEAD_CREATED', 'source = Website AND status = New AFTER 5 min', 'Auto-assign round-robin to Daniel/Asif/Reshma & ping Betterway Inside', 'Betterway Inside', 1, 128, now);
    insAuto.run('AUT-03', 'Pre-Approval (DIP) 7-Day Expiry Shield', 'DAILY_CRON_0930', 'stage = 06_PRE_APPROVAL AND dip_expiry <= +7 days', 'Alert Progression Coordinator (Elton) & initiate bank DIP renewal', 'Email + Task', 1, 19, now);
    insAuto.run('AUT-04', 'Missing Vault Document Auto-Chaser', 'STAGE_ENTERED_04', 'mandatory_docs_missing > 0 FOR 24 hours', 'Send bilingual EN/AR portal upload magic link to borrower', 'Client Portal + SMS', 1, 86, now);
    insAuto.run('AUT-05', 'SWK Properties Dual-Relay Attribution Sync', 'CASE_DISBURSED', 'is_swk_relay = 1', 'Post DSA accrual & 30% SWK partner statement to Finance Owner Queue', 'Finance Ledger', 1, 14, now);
    insAuto.run('AUT-06', 'Owner 09:30 Morning & 10:30 Attendance Brief', 'DAILY_CRON_1030', 'weekday != Sun', 'Compile pipeline velocity + Al Nasr Plaza QR attendance summary for Shabib Siraj', 'Executive Brief', 1, 61, now);

    // Seed Attendance for today (Dubai GST)
    const dubaiDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dubai' }).format(new Date());
    const insAtt = db.prepare(`
      INSERT INTO attendance_events (id, user_id, user_name, event_type, mode, dubai_date, dubai_time, late_minutes, wifi_ip, note, created_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?)
    `);
    insAtt.run('ATT-01', 'USR-04', 'Daniel Xavier', 'CHECK_IN', 'OFFICE_QR', dubaiDate, '08:57 AM', 0, '192.168.1.42', 'Al Nasr Plaza Reception QR Verified', now);
    insAtt.run('ATT-02', 'USR-05', 'Asif Khan', 'CHECK_IN', 'OFFICE_QR', dubaiDate, '09:02 AM', 0, '192.168.1.44', 'Al Nasr Plaza Reception QR Verified', now);
    insAtt.run('ATT-03', 'USR-06', 'Reshma Rajan', 'CHECK_IN', 'OFFICE_QR', dubaiDate, '09:00 AM', 0, '192.168.1.48', 'Al Nasr Plaza Reception QR Verified', now);
    insAtt.run('ATT-04', 'USR-07', 'Elton Frank', 'CHECK_IN', 'OFFICE_QR', dubaiDate, '09:11 AM', 6, '192.168.1.51', 'DLD Trustee morning drop-off noted', now);
    insAtt.run('ATT-05', 'USR-09', 'Rahaba Azeez', 'CHECK_IN', 'OFFICE_QR', dubaiDate, '08:55 AM', 0, '192.168.1.55', 'Al Nasr Plaza Reception QR Verified', now);

    // Seed Betterway Inside Chat
    const insChat = db.prepare(`
      INSERT INTO chat_messages (id, channel, sender_id, sender_name, sender_avatar, body, case_ref, created_at)
      VALUES (?,?,?,?,?,?,?,?)
    `);
    insChat.run('MSG-01', 'general', 'USR-01', 'Shabib Siraj', null, 'Welcome to Betterway Mortgages OS v1.0. All 24 UAE banks, CBUAE EIBOR curves, SWK Dual-Relay pipelines, and Al Nasr Plaza QR attendance are live.', '', now);
    insChat.run('MSG-02', 'bank-desk', 'USR-04', 'Daniel Xavier', '/staff/daniel-xavier.jpg', 'ENBD valuation for BW-2026-M02 (Azizi Riviera Rêve #1101) came in at AED 3.15M (+AED 60k uplift). Moving directly to FOL with Elton.', 'BW-2026-M02', now);
    insChat.run('MSG-03', 'progression', 'USR-07', 'Elton Frank', '/staff/elton-frank.jpg', 'Emaar NOC approved for BW-2026-M03 (Greenside Residence #A1001). Manager cheque split verified and DLD Trustee slot reserved.', 'BW-2026-M03', now);
    insChat.run('MSG-04', 'swk-relay', 'USR-05', 'Asif Khan', '/staff/asif-khan.jpg', 'Received UK Non-Resident referral from SWK agent Talha (Sarah Jenkins — Dubai Creek Harbour). Mashreq & CBD parallel packs prepared.', 'BW-ENQ-4822', now);

    // Seed Call Logs
    const insCall = db.prepare(`
      INSERT INTO call_logs (id, user_id, user_name, contact_name, masked_number, direction, duration_sec, outcome, notes, created_at)
      VALUES (?,?,?,?,?,?,?,?,?,?)
    `);
    insCall.run('CAL-01', 'USR-06', 'Reshma Rajan', 'Vikramjit Singh', '+971 55 ••• •702', 'Outbound', 342, 'Connected — Fact-Find Booked', 'Salaried AED 56k, minimal cards, targeting Al Furjan townhouse 80% LTV.', now);
    insCall.run('CAL-02', 'USR-05', 'Asif Khan', 'Rohan Deshmukh', '+971 55 ••• •920', 'Outbound', 488, 'Connected — Low-Doc Verified', 'Confirmed Q4 VAT return and RAKBANK AED 1,050 pre-approval fee cheque.', now);
    insCall.run('CAL-03', 'USR-04', 'Daniel Xavier', 'Matthias Pohl', '+971 54 ••• •845', 'Outbound', 215, 'Connected — Transfer Ready', 'Walked through transfer-day Manager Cheques for DAMAC Lagoons Portofino.', now);

    // Seed Notifications
    const insNotif = db.prepare(`
      INSERT INTO notifications (id, user_id, title, body, link, severity, created_at)
      VALUES (?,?,?,?,?,?,?)
    `);
    insNotif.run('NTF-01', 'ALL', 'CBUAE 3M EIBOR Snapshot Active (4.207%)', 'Official Central Bank EIBOR curve loaded across all 8 calculators and 24-bank revert comparisons.', '/banks', 'info', now);
    insNotif.run('NTF-02', 'USR-01', '1 Withdrawal Refund Awaiting Owner Approval', 'WDR-01 (Rohan Deshmukh — AED 2,100 refund) submitted by Asif Khan requires Shabib Siraj sign-off.', '/finance', 'warning', now);
    insNotif.run('NTF-03', 'USR-01', 'Corporate Seal Request Pending (BW-2026-M03)', 'Daniel Xavier requested official seal on KFS & Broker Engagement Letter.', '/compliance', 'warning', now);
    insNotif.run('NTF-04', 'ALL', 'Rate-Reset Alert: BW-2026-M09 (Faisal Al Qasimi)', 'Fixed rate expires 2027-02-15 (82 days). Auto-buyout savings brief ready.', '/pipeline', 'success', now);

    logAudit({ id: 'USR-03', name: 'Betterway Admin', role: 'ADMIN' }, 'system', 'INIT', 'SEED_COMPLETED', 'Initial Betterway Mortgage OS bootstrap', '12 cases, 5 leads, 24 banks, 50 Excel specs, 9 staff accounts');
  }
}
