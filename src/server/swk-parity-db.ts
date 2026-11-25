import { db } from './db.js';

export function initSwkParitySchemaAndSeed() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      assignee_id TEXT NOT NULL,
      assignee_name TEXT NOT NULL,
      case_code TEXT DEFAULT '',
      priority TEXT NOT NULL DEFAULT 'High',
      status TEXT NOT NULL DEFAULT 'To do',
      due_date TEXT NOT NULL,
      kind TEXT NOT NULL DEFAULT 'Follow-Up',
      created_at TEXT NOT NULL,
      completed_at TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS calendar_events (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      event_type TEXT NOT NULL,
      dubai_date TEXT NOT NULL,
      dubai_time TEXT NOT NULL,
      location TEXT DEFAULT 'Al Nasr Plaza / Dubai',
      case_code TEXT DEFAULT '',
      owner_name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Scheduled',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS vault_leads (
      id TEXT PRIMARY KEY,
      vault_code TEXT UNIQUE NOT NULL,
      client_name TEXT NOT NULL,
      raw_phone TEXT NOT NULL,
      masked_phone TEXT NOT NULL,
      community TEXT NOT NULL,
      project_unit TEXT NOT NULL,
      trigger_type TEXT NOT NULL,
      property_value_aed REAL NOT NULL,
      target_loan_aed REAL NOT NULL,
      primary_bank_key TEXT NOT NULL DEFAULT 'emirates-nbd',
      assigned_to TEXT DEFAULT '',
      assigned_name TEXT DEFAULT 'Unassigned',
      vault_status TEXT NOT NULL DEFAULT 'Ready to Dispatch',
      agent_notes TEXT DEFAULT '',
      calls_count INTEGER NOT NULL DEFAULT 0,
      wa_count INTEGER NOT NULL DEFAULT 0,
      is_swk_source INTEGER NOT NULL DEFAULT 1,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS field_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      user_name TEXT NOT NULL,
      purpose TEXT NOT NULL,
      community TEXT NOT NULL,
      case_code TEXT DEFAULT '',
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'Active',
      notes TEXT DEFAULT '',
      started_at TEXT NOT NULL,
      ended_at TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS word_documents (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      template_code TEXT NOT NULL,
      body_html TEXT NOT NULL,
      include_letterhead INTEGER NOT NULL DEFAULT 1,
      seal_status TEXT NOT NULL DEFAULT 'None',
      sealed_by TEXT DEFAULT '',
      case_code TEXT DEFAULT '',
      created_by TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS client_messages (
      id TEXT PRIMARY KEY,
      channel TEXT NOT NULL,
      recipient_name TEXT NOT NULL,
      recipient_contact TEXT NOT NULL,
      subject TEXT DEFAULT '',
      body TEXT NOT NULL,
      case_code TEXT DEFAULT '',
      sent_by TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Sent',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS hr_leave_requests (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      user_name TEXT NOT NULL,
      leave_type TEXT NOT NULL,
      from_date TEXT NOT NULL,
      to_date TEXT NOT NULL,
      days INTEGER NOT NULL DEFAULT 1,
      reason TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Pending',
      decided_by TEXT DEFAULT '',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS hr_staff_compliance (
      user_id TEXT PRIMARY KEY,
      user_name TEXT NOT NULL,
      designation TEXT NOT NULL,
      emirates_id_expiry TEXT NOT NULL,
      visa_expiry TEXT NOT NULL,
      basic_salary_aed REAL NOT NULL,
      allowance_aed REAL NOT NULL,
      wps_status TEXT NOT NULL DEFAULT 'Ready'
    );

    CREATE TABLE IF NOT EXISTS website_offers (
      id TEXT PRIMARY KEY,
      headline TEXT NOT NULL,
      subline TEXT NOT NULL,
      bank_key TEXT NOT NULL,
      rate_badge TEXT NOT NULL,
      audience TEXT NOT NULL,
      published INTEGER NOT NULL DEFAULT 1,
      spotlight INTEGER NOT NULL DEFAULT 0,
      enquiries_count INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS owner_overrides (
      id TEXT PRIMARY KEY,
      actor_name TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      record_label TEXT NOT NULL,
      reason TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);

  const now = new Date().toISOString();
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dubai' }).format(new Date());
  const addDays = (n: number) => new Date(Date.now() + n * 86400_000).toISOString().slice(0, 10);

  if ((db.prepare('SELECT COUNT(*) as c FROM tasks').get() as { c: number }).c === 0) {
    const ins = db.prepare(
      'INSERT INTO tasks (id, title, assignee_id, assignee_name, case_code, priority, status, due_date, kind, created_at) VALUES (?,?,?,?,?,?,?,?,?,?)',
    );
    ins.run('TSK-01', 'Collect signed DIB Pre-Approval & book valuation for Afshin', 'USR-04', 'Daniel Xavier', 'BW-2026-M01', 'Urgent', 'To do', today, 'Bank Approval', now);
    ins.run('TSK-02', 'Confirm Manager Cheques & DLD Trustee slot for Matthias Pohl', 'USR-07', 'Elton Frank', 'BW-2026-M04', 'Urgent', 'To do', today, 'DLD Transfer', now);
    ins.run('TSK-03', 'Send 3-bank quote sheet (EI vs DIB vs ENBD) to Nadia Al Hashimi', 'USR-06', 'Reshma Rajan', 'BW-2026-M10', 'High', 'To do', today, 'Client Quote', now);
    ins.run('TSK-04', 'Verify Q4 VAT Return & AED 1,050 cheque for Rohan Low-Doc file', 'USR-05', 'Asif Khan', 'BW-2026-M07', 'High', 'To do', addDays(-1), 'Document Check', now);
    ins.run('TSK-05', 'Send fixed-rate ending buyout savings plan to Faisal Al Qasimi', 'USR-04', 'Daniel Xavier', 'BW-2026-M09', 'Medium', 'To do', addDays(2), 'Refinance', now);
    ins.run('TSK-06', 'Approve WDR-01 refund & BW-2026-M03 Corporate Seal request', 'USR-01', 'Shabib Siraj', 'BW-2026-M03', 'Urgent', 'To do', today, 'Owner Approval', now);
    ins.run('TSK-07', 'Raise FAB Bank Commission Invoice (AED 32,980 + VAT) for Tariq', 'USR-02', 'Warda', 'BW-2026-M06', 'High', 'To do', addDays(1), 'Commission', now);
  }

  if ((db.prepare('SELECT COUNT(*) as c FROM calendar_events').get() as { c: number }).c === 0) {
    const ins = db.prepare(
      'INSERT INTO calendar_events (id, title, event_type, dubai_date, dubai_time, location, case_code, owner_name, status, created_at) VALUES (?,?,?,?,?,?,?,?,?,?)',
    );
    ins.run('CAL-EV-01', 'DLD Trustee Transfer — Matthias Pohl (DAMAC Lagoons)', 'DLD Transfer', addDays(2), '11:00 AM', 'Al Barsha Heights DLD Trustee', 'BW-2026-M04', 'Elton Frank', 'Scheduled', now);
    ins.run('CAL-EV-02', 'ENBD Property Valuation — Azizi Riviera Rêve #1101', 'Bank Valuation', today, '02:30 PM', 'MBR City, Dubai', 'BW-2026-M02', 'Elton Frank', 'Scheduled', now);
    ins.run('CAL-EV-03', 'VIP Non-Resident Consultation — Sarah Jenkins (UK)', 'Client Meeting', today, '04:00 PM', 'Al Nasr Plaza Boardroom / Zoom', 'BW-ENQ-4822', 'Asif Khan', 'Scheduled', now);
    ins.run('CAL-EV-04', 'Emaar Developer NOC Pickup — Greenside Residence #A1001', 'Developer NOC', addDays(1), '10:30 AM', 'Emaar Square, Downtown Dubai', 'BW-2026-M03', 'Elton Frank', 'Scheduled', now);
    ins.run('CAL-EV-05', 'Fixed-Rate Expiry Buyout Call — Faisal Al Qasimi', 'Rate Reset', addDays(4), '01:00 PM', 'Phone / Betterway Inside', 'BW-2026-M09', 'Daniel Xavier', 'Scheduled', now);
  }

  if ((db.prepare('SELECT COUNT(*) as c FROM vault_leads').get() as { c: number }).c === 0) {
    const ins = db.prepare(`
      INSERT INTO vault_leads (
        id, vault_code, client_name, raw_phone, masked_phone, community, project_unit, trigger_type,
        property_value_aed, target_loan_aed, primary_bank_key, assigned_to, assigned_name,
        vault_status, agent_notes, calls_count, wa_count, is_swk_source, updated_at
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `);
    ins.run('VLT-01', 'BW-VLT-001', 'Sahar Kharrufa', '+971 50 967 1015', '+971 50 ••• •015', 'DAMAC Lagoons', 'Ibiza Villa #28919', 'Handover Balloon (65% LTV)', 2_575_000, 1_673_750, 'emirates-nbd', 'USR-05', 'Asif Khan', 'In Progress', 'Client wants 3Y fixed with zero early-settlement surprises', 3, 2, 1, now);
    ins.run('VLT-02', 'BW-VLT-002', 'Andrea Moretti', '+971 58 412 7709', '+971 58 ••• •709', 'Dubai Creek Harbour', 'The Cove II #210', 'Handover Financing', 2_890_000, 2_312_000, 'dib', 'USR-06', 'Reshma Rajan', 'Assigned', 'SWK Relay from Talha Shabbir — ready for fact-find', 1, 1, 1, now);
    ins.run('VLT-03', 'BW-VLT-003', 'Mihai Bouticia', '+971 52 749 2868', '+971 52 ••• •868', 'MBR City', 'Azizi Riviera 43 #310', 'Equity Refinance (70%)', 1_050_000, 735_000, 'rakbank', 'USR-05', 'Asif Khan', 'Assigned', 'Fully paid Title Deed — wants cash-out for 2nd unit', 2, 1, 1, now);
    ins.run('VLT-04', 'BW-VLT-004', 'Humayra Hafiz', '+971 55 571 2951', '+971 55 ••• •951', 'Dubai Sports City', 'Spanish Tower #1012', 'Equity / Buy-Out', 1_450_000, 1_015_000, 'cbd', '', 'Unassigned', 'Ready to Dispatch', 'Verified Title Deed — ready for Owner dispatch', 0, 0, 1, now);
    ins.run('VLT-05', 'BW-VLT-005', 'Khalid Al Falasi', '+971 50 618 4401', '+971 50 ••• •401', 'Dubai Hills Estate', 'Golf Place II #GP-18', 'UAE National 85% Upgrade', 6_400_000, 4_800_000, 'fab', 'USR-04', 'Daniel Xavier', 'Quote Sent', 'FAB & ADIB comparing 3Y vs 5Y fixed rates', 4, 2, 0, now);
    ins.run('VLT-06', 'BW-VLT-006', 'Ritu Malhotra', '+971 54 309 8821', '+971 54 ••• •821', 'Jumeirah Village Circle', 'Terrazzo Bldg B #B502', 'Low-Doc Handover', 1_151_000, 920_800, 'mashreq', '', 'Unassigned', 'Ready to Dispatch', 'High yield 7.65% unit — ready to dispatch', 0, 0, 1, now);
  }

  if ((db.prepare('SELECT COUNT(*) as c FROM field_sessions').get() as { c: number }).c === 0) {
    const ins = db.prepare(
      'INSERT INTO field_sessions (id, user_id, user_name, purpose, community, case_code, lat, lng, status, notes, started_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
    );
    ins.run('FLD-01', 'USR-07', 'Elton Frank', 'DLD Trustee Transfer', 'Al Barsha Heights', 'BW-2026-M04', 25.0982, 55.1743, 'Active', 'Submitting Manager Cheques & NOC clearance pack', now);
    ins.run('FLD-02', 'USR-04', 'Daniel Xavier', 'Bank Branch Meeting', 'DIFC / Emirates NBD HQ', 'BW-2026-M01', 25.2116, 55.2808, 'Active', 'Fast-tracking Al Habtoor Tower DIP sign-off', now);
    ins.run('FLD-03', 'USR-05', 'Asif Khan', 'Client Home Meeting', 'Dubai Hills Estate', 'BW-2026-M06', 25.1066, 55.2448, 'Completed', 'Collected signed FOL & external life insurance form', now);
  }

  if ((db.prepare('SELECT COUNT(*) as c FROM word_documents').get() as { c: number }).c === 0) {
    const ins = db.prepare(
      'INSERT INTO word_documents (id, title, template_code, body_html, include_letterhead, seal_status, sealed_by, case_code, created_by, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)',
    );
    ins.run(
      'DOC-01',
      'Key Facts Statement & Bank Comparison — Karim Al Alami',
      'KFS_QUOTE',
      '<h2>UAE Mortgage Key Facts &amp; Bank Shortlist</h2><p><strong>Client:</strong> Karim Al Alami &nbsp;|&nbsp; <strong>Property:</strong> Greenside Residence #A1001, Dubai Creek Harbour</p><p><strong>Property Value:</strong> AED 1,713,888 &nbsp;|&nbsp; <strong>Loan Requested:</strong> AED 1,371,110 (80% LTV)</p><p><strong>Recommended Bank:</strong> Emirates NBD — 3.89% Fixed for 3 Years (Est. AED 7,155/month), reverting to 3M EIBOR + 1.75%.</p><p><strong>Betterway Fee:</strong> AED 0 to Client (Betterway Mortgages LLC is remunerated directly by the lending bank upon successful disbursal).</p>',
      1,
      'Sealed by Shabib Siraj',
      'Shabib Siraj',
      'BW-2026-M03',
      'Daniel Xavier',
      now,
    );
    ins.run(
      'DOC-02',
      'Zero-Fee Engagement & Multi-Bank Consent Letter — Afshin Behbahani',
      'CLIENT_ENGAGEMENT',
      '<h2>Client Advisory &amp; PDPL Credit Sharing Consent</h2><p>I authorize <strong>Betterway Mortgages LLC</strong> (Al Nasr Plaza, Oud Metha, Dubai) to compare and submit my mortgage application across participating CBUAE-licensed UAE banks at zero upfront advisory charge.</p><p>All personal documents remain inside the encrypted Betterway Vault under UAE Federal Decree-Law No. 45 of 2021 (PDPL).</p>',
      1,
      'Pending Owner Seal',
      '',
      'BW-2026-M01',
      'Asif Khan',
      now,
    );
  }

  if ((db.prepare('SELECT COUNT(*) as c FROM client_messages').get() as { c: number }).c === 0) {
    const ins = db.prepare(
      'INSERT INTO client_messages (id, channel, recipient_name, recipient_contact, subject, body, case_code, sent_by, status, created_at) VALUES (?,?,?,?,?,?,?,?,?,?)',
    );
    ins.run('CM-01', 'WhatsApp', 'Karim Al Alami', '+971 56 ••• •934', 'Pre-Approval & Transfer Ready', 'Hi Karim — Great news! Your Emaar NOC is approved and Emirates NBD Final Offer is ready. Please reply YES to confirm your DLD Trustee slot.', 'BW-2026-M03', 'Elton Frank', 'Sent', now);
    ins.run('CM-02', 'Email', 'Nadia Al Hashimi', 'nadia.h@client.ae', 'Your 3-Bank UAE Mortgage Comparison (Emirates Islamic vs DIB vs ENBD)', 'Dear Nadia, Attached is your simple side-by-side comparison for Sobha One Unit 1904 showing monthly payment, upfront Dubai fees, and total 3-year cost.', 'BW-2026-M10', 'Reshma Rajan', 'Sent', now);
  }

  if ((db.prepare('SELECT COUNT(*) as c FROM hr_staff_compliance').get() as { c: number }).c === 0) {
    const ins = db.prepare(
      'INSERT INTO hr_staff_compliance (user_id, user_name, designation, emirates_id_expiry, visa_expiry, basic_salary_aed, allowance_aed, wps_status) VALUES (?,?,?,?,?,?,?,?)',
    );
    ins.run('USR-04', 'Daniel Xavier', 'Team Manager & Mortgage Advisor', '2027-08-15', '2027-08-15', 12000, 6000, 'WPS Ready');
    ins.run('USR-05', 'Asif Khan', 'Mortgage Advisor', '2027-05-20', '2027-05-20', 8500, 4500, 'WPS Ready');
    ins.run('USR-06', 'Reshma Rajan', 'Telesales cum Mortgage Advisor', '2027-01-12', '2027-01-12', 6500, 3500, 'Renewal Due Soon');
    ins.run('USR-07', 'Elton Frank', 'Coordinator', '2027-09-30', '2027-09-30', 7500, 3500, 'WPS Ready');
    ins.run('USR-08', 'Mohammad Nusrik', 'Digital Marketing', '2027-06-18', '2027-06-18', 7500, 3500, 'WPS Ready');
    ins.run('USR-09', 'Rahaba Azeez', 'HR Manager', '2027-11-01', '2027-11-01', 8000, 4000, 'WPS Ready');

    db.prepare(
      'INSERT INTO hr_leave_requests (id, user_id, user_name, leave_type, from_date, to_date, days, reason, status, created_at) VALUES (?,?,?,?,?,?,?,?,?,?)',
    ).run('LV-01', 'USR-05', 'Asif Khan', 'Annual Leave', '2026-12-20', '2026-12-26', 5, 'Family travel — handover covered by Daniel Xavier', 'Pending', now);
  }

  if ((db.prepare('SELECT COUNT(*) as c FROM website_offers').get() as { c: number }).c === 0) {
    const ins = db.prepare(
      'INSERT INTO website_offers (id, headline, subline, bank_key, rate_badge, audience, published, spotlight, enquiries_count, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)',
    );
    ins.run('WEB-01', '3.89% Fixed for 3 Years · Zero Broker Fee', 'Up to 80% LTV for UAE Expats & 85% for UAE Nationals on Dubai & Abu Dhabi homes.', 'emirates-nbd', '3.89% 3Y Fixed', 'UAE Residents', 1, 1, 84, now);
    ins.run('WEB-02', 'Islamic Home Finance · 3.92% Fixed (Ijara)', 'Sharia-compliant ready purchase, buyout & Emaar/DAMAC handover financing.', 'emirates-islamic', '3.92% Islamic', 'Islamic Finance', 1, 1, 61, now);
    ins.run('WEB-03', '48-Hour Fast-Pass Pre-Approval for Non-Residents', 'Buy Dubai freehold property earning abroad — up to 60% LTV across 14 UAE banks.', 'mashreq', '48h Fast DIP', 'Overseas Buyers', 1, 0, 47, now);
    ins.run('WEB-04', 'Self-Employed Low-Doc · No Audited Financials Needed', 'Qualify with 6 months personal bank statements (>AED 40k/mo credits) up to AED 2M.', 'rakbank', 'Low-Doc Tier', 'Business Owners', 1, 1, 39, now);
  }
}
