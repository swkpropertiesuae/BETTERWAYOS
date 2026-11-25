import express, { type Request, type Response } from 'express';
import crypto from 'node:crypto';
import QRCode from 'qrcode';
import { db, logAudit, verifyPassword, bumpChangeFeed } from './db.js';
import {
  requireAuth,
  requireOwner,
  signSessionToken,
  generateRotatingQrToken,
  verifyRotatingQrToken,
  getUserById,
  type AuthedRequest,
} from './auth.js';
import { UAE_BANKS, EIBOR_SNAPSHOT, DEVELOPER_APL_PROJECTS } from '../shared/banks-data.js';
import { UAE_COMMUNITIES } from '../shared/communities-data.js';
import { EXCEL_SPECS } from '../shared/excel-specs.js';
import {
  CASE_MILESTONES,
  DOCUMENT_CHECKLIST_BY_PROFILE,
  FORBIDDEN_PAYMENT_TERMS,
  LEGAL_UAE_PAYMENT_CHANNELS,
  MORTGAGE_TYPES,
  type BorrowerProfileType,
} from '../shared/workflow-constants.js';
import {
  borrowingPower,
  buyoutSavings,
  cashToClose,
  CBUAE_RULE_VERSION,
  emi,
  evaluateUnderwritingPolicy,
  fixedThenRevert,
  goldenVisaCheck,
  handoverRelease,
  lifeInsuranceSavings,
  chequeSplit,
} from '../shared/cbuae-math.js';
import { registerSwkParityRoutes } from './swk-parity-routes.js';

export const apiRouter = express.Router();
registerSwkParityRoutes(apiRouter);

function isPersonalAccountPayment(channel: string): boolean {
  const lower = String(channel || '').toLowerCase();
  return FORBIDDEN_PAYMENT_TERMS.some((term) => lower.includes(term));
}

function dubaiNowParts() {
  const d = new Date();
  const dubaiDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dubai' }).format(d);
  const dubaiTime = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Dubai',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
    .format(d)
    .toUpperCase();
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Dubai',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(d);
  const hr = Number(parts.find((p) => p.type === 'hour')?.value || 9);
  const min = Number(parts.find((p) => p.type === 'minute')?.value || 0);
  const totalMin = hr * 60 + min;
  const lateMinutes = totalMin > 9 * 60 + 5 ? totalMin - (9 * 60 + 5) : 0; // 09:05 GST grace
  return { dubaiDate, dubaiTime, lateMinutes };
}

// ---------- HEALTH & PUBLIC BENCHMARKS ----------
apiRouter.get('/health', (_req, res) => {
  const cases = (db.prepare('SELECT COUNT(*) as c FROM mortgage_cases WHERE deleted_soft = 0').get() as { c: number }).c;
  res.json({
    ok: true,
    service: 'Betterway Mortgages OS v1.0',
    location: 'Al Nasr Plaza, Oud Metha, Dubai, UAE',
    banksCount: UAE_BANKS.length,
    communitiesCount: UAE_COMMUNITIES.length,
    excelSpecsCount: EXCEL_SPECS.length,
    activeCases: cases,
    eibor3m: EIBOR_SNAPSHOT.latest.threeMonth,
    timestamp: new Date().toISOString(),
  });
});

apiRouter.get('/eibor', (_req, res) => res.json(EIBOR_SNAPSHOT));

apiRouter.get('/banks', (_req, res) => {
  res.json({
    banks: UAE_BANKS,
    eibor: EIBOR_SNAPSHOT,
    aplProjects: DEVELOPER_APL_PROJECTS,
  });
});

apiRouter.get('/communities', (_req, res) => {
  res.json({ communities: UAE_COMMUNITIES });
});

// ---------- AUTHENTICATION ----------
apiRouter.get('/auth/demo-accounts', (_req, res) => {
  const rows = db
    .prepare(
      'SELECT id, emp_code, name, name_ar, email, role, tier, designation, department, avatar, portrait, initials FROM users WHERE active = 1 ORDER BY id',
    )
    .all();
  res.json({ accounts: rows });
});

apiRouter.post('/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required.' });
    return;
  }
  const row = db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?) AND active = 1').get(String(email).trim()) as any;
  if (!row || !verifyPassword(String(password), row.password_hash)) {
    res.status(401).json({ error: 'Invalid credentials. Default demo password is Betterway@2026.' });
    return;
  }
  const token = signSessionToken(row.id);
  const user = getUserById(row.id)!;
  logAudit({ id: user.id, name: user.name, role: user.role }, 'auth', user.id, 'LOGIN', 'Password login', user.email);
  res.cookie('bw_session', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: Boolean(process.env.VERCEL || req.secure),
    path: '/',
    maxAge: 7 * 24 * 3600 * 1000,
  });
  res.json({ token, user });
});

apiRouter.post('/auth/quick-role', (req: Request, res: Response) => {
  const { email } = req.body || {};
  const row = db.prepare('SELECT id FROM users WHERE LOWER(email) = LOWER(?) AND active = 1').get(String(email || '').trim()) as
    | { id: string }
    | undefined;
  if (!row) {
    res.status(404).json({ error: 'Staff profile not found.' });
    return;
  }
  const user = getUserById(row.id)!;
  const token = signSessionToken(user.id);
  logAudit({ id: user.id, name: user.name, role: user.role }, 'auth', user.id, 'QUICK_ROLE_SIGNIN', 'Executive/Demo Role Switch', user.role);
  res.cookie('bw_session', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: Boolean(process.env.VERCEL || req.secure),
    path: '/',
    maxAge: 7 * 24 * 3600 * 1000,
  });
  res.json({ token, user });
});

apiRouter.post('/auth/logout', (_req, res) => {
  res.clearCookie('bw_session');
  res.json({ ok: true });
});

apiRouter.get('/auth/me', requireAuth, (req: AuthedRequest, res: Response) => {
  const staff = db
    .prepare('SELECT id, emp_code, slug, name, name_ar, email, phone, role, tier, designation, department, avatar, portrait, initials, monthly_target_aed FROM users WHERE active = 1 ORDER BY id')
    .all();
  res.json({
    user: req.user,
    staff,
    milestones: CASE_MILESTONES,
    mortgageTypes: MORTGAGE_TYPES,
    legalPaymentChannels: LEGAL_UAE_PAYMENT_CHANNELS,
  });
});

// ---------- PUBLIC WEBSITE LEAD INTERCONNECT (100% compatible with BETTERWAYMORTGAGES/src/lib/os-interconnect.ts) ----------
apiRouter.post('/v1/intake/leads', (req: Request, res: Response) => {
  const b = req.body || {};
  const contactName = String(b.contactName || b.name || '').trim();
  const contactPhone = String(b.contactPhone || b.phone || '').trim();
  if (!contactName || !contactPhone) {
    res.status(400).json({ error: 'contactName and contactPhone are required.' });
    return;
  }

  // Deduplication check
  const existing = db.prepare('SELECT reference_code, assigned_to FROM leads WHERE contact_phone = ? LIMIT 1').get(contactPhone) as
    | { reference_code: string; assigned_to: string }
    | undefined;
  if (existing) {
    const adv = getUserById(existing.assigned_to);
    res.json({
      ok: true,
      syncedToOs: true,
      deduplicated: true,
      referenceCode: existing.reference_code,
      assignedAdvisor: adv ? { name: adv.name, designation: adv.designation, email: adv.email } : undefined,
    });
    return;
  }

  // Round-robin assignment across active advisors (Daniel, Asif, Reshma)
  const advisorPool = ['USR-04', 'USR-05', 'USR-06'];
  const count = (db.prepare('SELECT COUNT(*) as c FROM leads').get() as { c: number }).c;
  const assignedTo = advisorPool[count % advisorPool.length]!;
  const adv = getUserById(assignedTo)!;

  const id = `LD-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
  const referenceCode = `BW-ENQ-${1000 + ((count + 4826) % 8999)}`;
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO leads (
      id, reference_code, contact_name, contact_phone, contact_email, residency, borrower_profile, goal,
      property_price_aed, down_payment_pct, monthly_income_aed, source_channel, source_page,
      partner_agency, partner_brn, is_swk_relay, consent_pdpl, status, assigned_to, notes, created_at, updated_at
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,1,'New',?,?,?,?)
  `).run(
    id,
    referenceCode,
    contactName,
    contactPhone,
    String(b.contactEmail || b.email || ''),
    String(b.residency || 'Expat resident'),
    String(b.borrowerProfile || 'salaried'),
    String(b.goal || 'Resale Purchase (Secondary)'),
    Number(b.propertyPriceAed || b.price || 2_500_000),
    Number(b.downPaymentPct ?? 20),
    Number(b.monthlyIncomeAed ?? 45_000),
    b.agencyName ? 'Partner Hub' : 'Website Interconnect',
    String(b.sourcePage || '/contact'),
    String(b.agencyName || ''),
    String(b.reraBrn || ''),
    String(b.agencyName || '').toLowerCase().includes('swk') ? 1 : 0,
    assignedTo,
    String(b.topic || 'Website Mortgage Enquiry') + (b.preferredSlot ? ` · Slot: ${b.preferredSlot}` : ''),
    now,
    now,
  );

  db.prepare(
    'INSERT INTO notifications (id, user_id, title, body, link, severity, created_at) VALUES (?,?,?,?,?,?,?)',
  ).run(
    `NTF-${crypto.randomBytes(3).toString('hex')}`,
    assignedTo,
    `New Website Lead ${referenceCode}`,
    `${contactName} (${contactPhone}) assigned to ${adv.name} — AED ${Number(b.propertyPriceAed || 2_500_000).toLocaleString()}`,
    '/leads',
    'info',
    now,
  );

  logAudit({ id: 'SYSTEM', name: 'Website Interconnect', role: 'SYSTEM' }, 'leads', id, 'WEBSITE_INTAKE', 'Consent captured via betterwaymortgages.com', referenceCode);

  res.status(201).json({
    ok: true,
    syncedToOs: true,
    id,
    referenceCode,
    assignedAdvisor: { name: adv.name, designation: adv.designation, email: adv.email },
  });
});

// ---------- PUBLIC BORROWER PORTAL LOOKUP ----------
apiRouter.get('/v1/public/status', (req: Request, res: Response) => {
  const q = String(req.query.ref || req.query.token || 'BW-2026-M03').trim();
  const c = db
    .prepare(
      `SELECT id, case_code, borrower_name, mortgage_type, stage_code, emirate, community, project_name, unit_door,
              property_price_aed, requested_loan_aed, valuation_aed, ltv_pct, dbr_pct, primary_bank_key,
              indicative_rate_pct, noc_status, transfer_date, next_action, advisor_id, coordinator_id, portal_token
       FROM mortgage_cases WHERE deleted_soft = 0 AND (LOWER(case_code) = LOWER(?) OR portal_token = ?) LIMIT 1`,
    )
    .get(q, q) as any;
  if (!c) {
    res.status(404).json({ error: 'Case reference not found.' });
    return;
  }
  const docs = db.prepare('SELECT id, doc_name, mandatory, status, expiry_date FROM case_documents WHERE case_id = ?').all(c.id);
  const subs = db
    .prepare('SELECT bank_key, bank_name, product_type, rate_pct, loan_amount_aed, status, dip_expiry FROM bank_submissions WHERE case_id = ?')
    .all(c.id);
  const advisor = getUserById(c.advisor_id);
  const coordinator = getUserById(c.coordinator_id);
  res.json({
    case: c,
    milestones: CASE_MILESTONES,
    documents: docs,
    submissions: subs,
    advisor: advisor ? { name: advisor.name, designation: advisor.designation, email: advisor.email, phone: advisor.phone, avatar: advisor.avatar } : null,
    coordinator: coordinator ? { name: coordinator.name, designation: coordinator.designation, email: coordinator.email, avatar: coordinator.avatar } : null,
  });
});

apiRouter.post('/v1/public/upload-doc', (req: Request, res: Response) => {
  const { docId, fileName } = req.body || {};
  if (!docId) {
    res.status(400).json({ error: 'docId is required' });
    return;
  }
  const now = new Date().toISOString();
  db.prepare("UPDATE case_documents SET status = 'Uploaded', vault_ref = ?, updated_at = ? WHERE id = ?").run(
    `VAULT/PORTAL/${String(fileName || 'client_upload.pdf').replace(/[^a-zA-Z0-9._-]/g, '_')}`,
    now,
    docId,
  );
  bumpChangeFeed('case_documents', docId, 'PORTAL_UPLOAD');
  res.json({ ok: true, status: 'Uploaded' });
});

// ---------- PUBLIC / AUTHED DETERMINISTIC CALCULATOR API ----------
apiRouter.post('/calculators/evaluate', (req: Request, res: Response) => {
  const b = req.body || {};
  const price = Number(b.propertyPriceAed || 2_500_000);
  const downPct = Number(b.downPaymentPct ?? 20);
  const loan = Math.max(0, price * (1 - downPct / 100));
  const ratePct = Number(b.fixedRatePct ?? 3.89);
  const years = Number(b.tenureYears ?? 25);
  const salary = Number(b.monthlyIncomeAed ?? 45_000);
  const existingEmis = Number(b.existingEmisAed ?? 0);
  const cardLimits = Number(b.cardLimitsAed ?? 25_000);
  const age = Number(b.age ?? 35);
  const profile = (b.profile || 'salaried') as BorrowerProfileType;

  const monthlyEmi = emi(loan, ratePct, years);
  const dbr = borrowingPower({ salary, existingEmis, cardLimits, years, rentalIncomeAnnual: Number(b.rentalIncomeAnnual || 0) });
  const cash = cashToClose({ price, downPct, bankFeePct: Number(b.bankFeePct ?? 0.5), agency: b.includeAgency !== false, offPlanHandover: Boolean(b.offPlanHandover), emirate: b.emirate || 'dubai' });
  const revert = fixedThenRevert(loan, years, ratePct, Number(b.fixedYears ?? 3), EIBOR_SNAPSHOT.latest.threeMonth, Number(b.revertMargin ?? 1.75), Number(b.floorPct ?? 3.89));
  const buyout = buyoutSavings({ balance: Number(b.currentBalance || loan), currentRate: Number(b.currentRate || 5.45), newRate: ratePct, yearsLeft: Number(b.yearsLeft || 20) });
  const handover = handoverRelease(price, Number(b.handoverBalancePct ?? 60), Number(b.currentValuation || price * 1.12), 100 - downPct);
  const gv = goldenVisaCheck(price, Number(b.dependants ?? 2));
  const ins = lifeInsuranceSavings(loan, ratePct, years);
  const cheques = chequeSplit(price, Number(b.sellerOutstanding || 0), price * (downPct / 100), loan);
  const policy = evaluateUnderwritingPolicy({
    profile,
    monthlyIncomeAed: salary,
    existingEmisAed: existingEmis,
    cardLimitsAed: cardLimits,
    age,
    propertyPriceAed: price,
    requestedLoanAed: loan,
    businessYears: Number(b.businessYears ?? 3),
    annualTurnoverAed: Number(b.annualTurnoverAed ?? 2_500_000),
    avgMonthlyBalanceAed: Number(b.avgMonthlyBalanceAed ?? 25_000),
  });

  res.json({
    ruleVersion: CBUAE_RULE_VERSION,
    eibor3m: EIBOR_SNAPSHOT.latest.threeMonth,
    eiborDate: EIBOR_SNAPSHOT.asOfDate,
    monthlyEmi,
    dbr,
    cash,
    revert,
    buyout,
    handover,
    goldenVisa: gv,
    lifeInsurance: ins,
    chequeSplit: cheques,
    policy,
  });
});

// ---------- PROTECTED OS ROUTES ----------
apiRouter.get('/dashboard', requireAuth, (req: AuthedRequest, res: Response) => {
  const cases = db.prepare('SELECT * FROM mortgage_cases WHERE deleted_soft = 0 ORDER BY updated_at DESC').all() as any[];
  const leads = db.prepare('SELECT * FROM leads ORDER BY created_at DESC').all() as any[];
  const ledger = db.prepare('SELECT * FROM finance_ledger ORDER BY created_at DESC').all() as any[];
  const withdrawals = db.prepare("SELECT * FROM withdrawals WHERE status = 'Pending Owner Approval'").all() as any[];
  const pendingDeletes = db.prepare("SELECT * FROM recycle_bin_requests WHERE status = 'Pending Owner Approval'").all() as any[];
  const pendingSeals = db.prepare("SELECT * FROM compliance_records WHERE status LIKE '%Pending%' OR status = 'In Review'").all() as any[];
  const dubaiDate = dubaiNowParts().dubaiDate;
  const attendanceToday = db.prepare('SELECT * FROM attendance_events WHERE dubai_date = ? ORDER BY created_at DESC').all(dubaiDate) as any[];
  const staff = db.prepare('SELECT id, name, designation, avatar, portrait, initials, role, monthly_target_aed FROM users WHERE active = 1').all() as any[];

  const totalPipelineLoanAed = cases.reduce((s, c) => s + Number(c.requested_loan_aed || 0), 0);
  const totalPropertyVolumeAed = cases.reduce((s, c) => s + Number(c.property_price_aed || 0), 0);
  const projectedDsaAed = cases.reduce((s, c) => s + (Number(c.requested_loan_aed || 0) * Number(c.dsa_rate_pct || 0.85)) / 100, 0);
  const settledRevenueAed = ledger.filter((l) => l.status === 'Settled').reduce((s, l) => s + Number(l.net_betterway_aed || 0), 0);
  const accruedRevenueAed = ledger.reduce((s, l) => s + Number(l.gross_dsa_aed || 0), 0);
  const swkRelayVolumeAed = cases.filter((c) => c.is_swk_relay === 1).reduce((s, c) => s + Number(c.requested_loan_aed || 0), 0);

  const stageCounts = CASE_MILESTONES.map((m) => {
    const inStage = cases.filter((c) => c.stage_code === m.code);
    return {
      code: m.code,
      order: m.order,
      label: m.label,
      color: m.color,
      count: inStage.length,
      loanAed: inStage.reduce((s, c) => s + Number(c.requested_loan_aed || 0), 0),
    };
  });

  const advisorStats = staff
    .filter((u) => ['OWNER', 'TEAM_MANAGER', 'MORTGAGE_ADVISOR', 'TELESALES_ADVISOR'].includes(u.role))
    .map((u) => {
      const myCases = cases.filter((c) => c.advisor_id === u.id);
      const volume = myCases.reduce((s, c) => s + Number(c.requested_loan_aed || 0), 0);
      const dsa = myCases.reduce((s, c) => s + (Number(c.requested_loan_aed || 0) * Number(c.dsa_rate_pct || 0.85)) / 100, 0);
      return {
        ...u,
        casesCount: myCases.length,
        volumeAed: Math.round(volume),
        dsaAed: Math.round(dsa),
        targetPct: u.monthly_target_aed > 0 ? Math.min(100, Math.round((volume / u.monthly_target_aed) * 100)) : 0,
      };
    })
    .sort((a, b) => b.volumeAed - a.volumeAed);

  const upcomingTransfers = cases.filter((c) => c.transfer_date).slice(0, 6);
  const rateResetWatch = cases.filter((c) => c.fixed_expiry_date).slice(0, 5);

  res.json({
    kpis: {
      activeCases: cases.length,
      openLeads: leads.filter((l) => l.status !== 'Converted' && l.status !== 'Lost').length,
      totalPipelineLoanAed: Math.round(totalPipelineLoanAed),
      totalPropertyVolumeAed: Math.round(totalPropertyVolumeAed),
      projectedDsaAed: Math.round(projectedDsaAed),
      settledRevenueAed: Math.round(settledRevenueAed),
      accruedRevenueAed: Math.round(accruedRevenueAed),
      swkRelayVolumeAed: Math.round(swkRelayVolumeAed),
      pendingApprovalsCount: withdrawals.length + pendingDeletes.length + pendingSeals.length,
      checkedInToday: attendanceToday.filter((a) => a.event_type === 'CHECK_IN').length,
    },
    stageCounts,
    advisorStats,
    recentCases: cases.slice(0, 8),
    upcomingTransfers,
    rateResetWatch,
    pendingActions: {
      withdrawals,
      pendingDeletes,
      pendingSeals,
    },
    eibor: EIBOR_SNAPSHOT,
    attendanceToday,
  });
});

// ---------- LEADS ----------
apiRouter.get('/leads', requireAuth, (_req, res) => {
  const rows = db.prepare('SELECT * FROM leads ORDER BY created_at DESC').all();
  res.json({ leads: rows });
});

apiRouter.post('/leads', requireAuth, (req: AuthedRequest, res: Response) => {
  const b = req.body || {};
  const name = String(b.contact_name || '').trim();
  const phone = String(b.contact_phone || '').trim();
  if (!name || !phone) {
    res.status(400).json({ error: 'Contact name and phone are required.' });
    return;
  }
  const id = `LD-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
  const ref = `BW-ENQ-${Math.floor(1000 + Math.random() * 8999)}`;
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO leads (
      id, reference_code, contact_name, contact_phone, contact_email, residency, borrower_profile, goal,
      property_price_aed, down_payment_pct, monthly_income_aed, source_channel, source_page,
      partner_agency, partner_brn, is_swk_relay, consent_pdpl, status, assigned_to, notes, created_at, updated_at
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).run(
    id, ref, name, phone, String(b.contact_email || ''), String(b.residency || 'Expat resident'),
    String(b.borrower_profile || 'salaried'), String(b.goal || 'Resale Purchase (Secondary)'),
    Number(b.property_price_aed || 2_500_000), Number(b.down_payment_pct ?? 20), Number(b.monthly_income_aed || 45_000),
    String(b.source_channel || 'Direct Advisory'), '/os/leads', String(b.partner_agency || ''), String(b.partner_brn || ''),
    b.is_swk_relay ? 1 : 0, b.consent_pdpl === false ? 0 : 1, 'New', String(b.assigned_to || req.user!.id),
    String(b.notes || ''), now, now,
  );
  logAudit(req.user!, 'leads', id, 'CREATE', 'Manual lead creation', `${ref} · ${name}`);
  res.status(201).json({ id, reference_code: ref });
});

apiRouter.post('/leads/:id/convert', requireAuth, (req: AuthedRequest, res: Response) => {
  const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(String(req.params.id)) as any;
  if (!lead) {
    res.status(404).json({ error: 'Lead not found' });
    return;
  }
  const caseId = `CASE-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
  const count = (db.prepare('SELECT COUNT(*) as c FROM mortgage_cases').get() as { c: number }).c;
  const caseCode = `BW-2026-M${String(count + 1).padStart(2, '0')}`;
  const loan = Math.round(lead.property_price_aed * (1 - lead.down_payment_pct / 100));
  const ltv = Number((100 - lead.down_payment_pct).toFixed(1));
  const dbr = Number(Math.min(49, ((loan * 0.00675) / Math.max(1, lead.monthly_income_aed)) * 100).toFixed(1));
  const now = new Date().toISOString();
  const slaDue = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
  const prof = (lead.borrower_profile || 'salaried') as BorrowerProfileType;

  db.prepare(`
    INSERT INTO mortgage_cases (
      id, case_code, lead_id, borrower_name, borrower_phone, borrower_email, nationality, residency_status,
      borrower_profile, mortgage_type, stage_code, emirate, community, project_name, unit_door, developer,
      property_price_aed, requested_loan_aed, valuation_aed, monthly_income_aed, existing_emis_aed, card_limits_aed,
      borrower_age, ltv_pct, dbr_pct, primary_bank_key, indicative_rate_pct, dsa_rate_pct, is_swk_relay,
      partner_agency, advisor_id, coordinator_id, portal_token, next_action, sla_due_at, created_at, updated_at
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).run(
    caseId, caseCode, lead.id, lead.contact_name, lead.contact_phone, lead.contact_email,
    lead.residency, lead.residency.toLowerCase().includes('national') ? 'uae_national' : lead.residency.toLowerCase().includes('non') ? 'non_resident' : 'expat_resident',
    prof, lead.goal, '02_FACT_FIND', 'Dubai', 'Dubai Hills Estate', 'TBD Property Selection', '', 'Emaar Properties',
    lead.property_price_aed, loan, 0, lead.monthly_income_aed, 0, 20_000, 35, ltv, dbr,
    'emirates-nbd', 3.89, 0.85, lead.is_swk_relay, lead.partner_agency || 'Direct', lead.assigned_to || req.user!.id,
    'USR-07', `bw-trk-${caseCode.toLowerCase()}`, 'Complete fact-find & collect mandatory KYC docs', slaDue, now, now,
  );

  const checklist = DOCUMENT_CHECKLIST_BY_PROFILE[prof] || DOCUMENT_CHECKLIST_BY_PROFILE.salaried;
  const insDoc = db.prepare('INSERT INTO case_documents (id, case_id, doc_name, mandatory, status, updated_at) VALUES (?,?,?,?,?,?)');
  checklist.forEach((d, i) => insDoc.run(`${caseId}-DOC-${i + 1}`, caseId, d.name, d.mandatory ? 1 : 0, 'Missing', now));

  db.prepare("UPDATE leads SET status = 'Converted', updated_at = ? WHERE id = ?").run(now, lead.id);
  logAudit(req.user!, 'mortgage_cases', caseId, 'CONVERT_FROM_LEAD', `Converted lead ${lead.reference_code}`, caseCode);
  res.status(201).json({ id: caseId, case_code: caseCode });
});

// ---------- MORTGAGE CASES (12-MILESTONE LOS) ----------
apiRouter.get('/cases', requireAuth, (req: AuthedRequest, res: Response) => {
  const stage = typeof req.query.stage === 'string' ? req.query.stage : '';
  const search = typeof req.query.q === 'string' ? req.query.q.trim().toLowerCase() : '';
  let rows = db.prepare('SELECT * FROM mortgage_cases WHERE deleted_soft = 0 ORDER BY updated_at DESC').all() as any[];
  if (stage && stage !== 'ALL') rows = rows.filter((r) => r.stage_code === stage);
  if (search) {
    rows = rows.filter(
      (r) =>
        r.borrower_name.toLowerCase().includes(search) ||
        r.case_code.toLowerCase().includes(search) ||
        r.project_name.toLowerCase().includes(search) ||
        r.community.toLowerCase().includes(search),
    );
  }
  res.json({ cases: rows, milestones: CASE_MILESTONES });
});

apiRouter.get('/cases/:id', requireAuth, (req: AuthedRequest, res: Response) => {
  const c = db.prepare('SELECT * FROM mortgage_cases WHERE id = ? AND deleted_soft = 0').get(String(req.params.id)) as any;
  if (!c) {
    res.status(404).json({ error: 'Mortgage case not found' });
    return;
  }
  const documents = db.prepare('SELECT * FROM case_documents WHERE case_id = ? ORDER BY id').all(c.id);
  const submissions = db.prepare('SELECT * FROM bank_submissions WHERE case_id = ? ORDER BY submitted_at DESC').all(c.id);
  const quotes = db.prepare('SELECT * FROM quotes WHERE case_id = ? ORDER BY created_at DESC').all(c.id);
  const audit = db.prepare('SELECT * FROM audit_log WHERE record_id = ? ORDER BY id DESC LIMIT 30').all(c.id);
  res.json({ case: c, documents, submissions, quotes, audit });
});

apiRouter.post('/cases', requireAuth, (req: AuthedRequest, res: Response) => {
  const b = req.body || {};
  const borrowerName = String(b.borrower_name || '').trim();
  if (!borrowerName) {
    res.status(400).json({ error: 'borrower_name is required.' });
    return;
  }
  const id = `CASE-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
  const count = (db.prepare('SELECT COUNT(*) as c FROM mortgage_cases').get() as { c: number }).c;
  const caseCode = `BW-2026-M${String(count + 1).padStart(2, '0')}`;
  const price = Number(b.property_price_aed || 2_500_000);
  const loan = Number(b.requested_loan_aed || Math.round(price * 0.8));
  const income = Number(b.monthly_income_aed || 45_000);
  const prof = (b.borrower_profile || 'salaried') as BorrowerProfileType;
  const ltv = Number(((loan / Math.max(1, price)) * 100).toFixed(1));
  const dbr = Number((((Number(b.existing_emis_aed || 0) + Number(b.card_limits_aed || 0) * 0.05 + emi(loan, 6.5, 25)) / Math.max(1, income)) * 100).toFixed(1));
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO mortgage_cases (
      id, case_code, borrower_name, borrower_phone, borrower_email, nationality, residency_status,
      borrower_profile, mortgage_type, stage_code, emirate, community, project_name, unit_door, developer,
      property_price_aed, requested_loan_aed, valuation_aed, monthly_income_aed, existing_emis_aed, card_limits_aed,
      borrower_age, ltv_pct, dbr_pct, primary_bank_key, indicative_rate_pct, dsa_rate_pct, is_swk_relay,
      partner_agency, advisor_id, coordinator_id, portal_token, next_action, sla_due_at, created_at, updated_at
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).run(
    id, caseCode, borrowerName, String(b.borrower_phone || '+971 50 000 0000'), String(b.borrower_email || ''),
    String(b.nationality || 'UAE Resident'), String(b.residency_status || 'expat_resident'), prof,
    String(b.mortgage_type || 'Resale Purchase (Secondary)'), String(b.stage_code || '02_FACT_FIND'),
    String(b.emirate || 'Dubai'), String(b.community || 'Dubai Hills Estate'), String(b.project_name || 'Direct Acquisition'),
    String(b.unit_door || ''), String(b.developer || 'Emaar Properties'), price, loan, Number(b.valuation_aed || 0),
    income, Number(b.existing_emis_aed || 0), Number(b.card_limits_aed || 20_000), Number(b.borrower_age || 36),
    ltv, dbr, String(b.primary_bank_key || 'emirates-nbd'), Number(b.indicative_rate_pct || 3.89),
    Number(b.dsa_rate_pct || 0.85), b.is_swk_relay ? 1 : 0, String(b.partner_agency || 'Direct'),
    String(b.advisor_id || req.user!.id), 'USR-07', `bw-trk-${caseCode.toLowerCase()}`,
    String(b.next_action || 'Run 24-bank shortlist & verify KYC vault'),
    new Date(Date.now() + 48 * 3600 * 1000).toISOString(), now, now,
  );

  const checklist = DOCUMENT_CHECKLIST_BY_PROFILE[prof] || DOCUMENT_CHECKLIST_BY_PROFILE.salaried;
  const insDoc = db.prepare('INSERT INTO case_documents (id, case_id, doc_name, mandatory, status, updated_at) VALUES (?,?,?,?,?,?)');
  checklist.forEach((d, i) => insDoc.run(`${id}-DOC-${i + 1}`, id, d.name, d.mandatory ? 1 : 0, 'Missing', now));

  logAudit(req.user!, 'mortgage_cases', id, 'CREATE', 'New mortgage case originated', `${caseCode} · ${borrowerName}`);
  res.status(201).json({ id, case_code: caseCode });
});

apiRouter.patch('/cases/:id', requireAuth, (req: AuthedRequest, res: Response) => {
  const b = req.body || {};
  const reason = String(b.reason || '').trim();
  if (reason.length < 4) {
    res.status(400).json({ error: 'Mandatory audit reason (min 4 characters) is required for any case modification.' });
    return;
  }
  const existing = db.prepare('SELECT * FROM mortgage_cases WHERE id = ? AND deleted_soft = 0').get(String(req.params.id)) as any;
  if (!existing) {
    res.status(404).json({ error: 'Case not found' });
    return;
  }
  const now = new Date().toISOString();
  const nextStage = b.stage_code ?? existing.stage_code;
  db.prepare(`
    UPDATE mortgage_cases
    SET stage_code = ?, valuation_aed = ?, noc_status = ?, next_action = ?, primary_bank_key = ?,
        indicative_rate_pct = ?, transfer_date = ?, fixed_expiry_date = ?, updated_at = ?
    WHERE id = ?
  `).run(
    nextStage,
    b.valuation_aed !== undefined ? Number(b.valuation_aed) : existing.valuation_aed,
    b.noc_status ?? existing.noc_status,
    b.next_action ?? existing.next_action,
    b.primary_bank_key ?? existing.primary_bank_key,
    b.indicative_rate_pct !== undefined ? Number(b.indicative_rate_pct) : existing.indicative_rate_pct,
    b.transfer_date ?? existing.transfer_date,
    b.fixed_expiry_date ?? existing.fixed_expiry_date,
    now,
    existing.id,
  );
  logAudit(req.user!, 'mortgage_cases', existing.id, 'UPDATE', reason, `${existing.stage_code} -> ${nextStage}`);
  res.json({ ok: true, id: existing.id, stage_code: nextStage });
});

/** SWK-Parity Delete Protection: Non-Owner deletes go to Pending Owner Delete Bin! */
apiRouter.delete('/cases/:id', requireAuth, (req: AuthedRequest, res: Response) => {
  const reason = String(req.body?.reason || req.query.reason || '').trim();
  if (reason.length < 6) {
    res.status(400).json({ error: 'Mandatory written reason (min 6 characters) is required to request deletion.' });
    return;
  }
  const existing = db.prepare('SELECT * FROM mortgage_cases WHERE id = ? AND deleted_soft = 0').get(String(req.params.id)) as any;
  if (!existing) {
    res.status(404).json({ error: 'Case not found' });
    return;
  }
  const now = new Date().toISOString();
  if (req.user!.can_approve_deletions) {
    db.prepare('UPDATE mortgage_cases SET deleted_soft = 1, updated_at = ? WHERE id = ?').run(now, existing.id);
    logAudit(req.user!, 'mortgage_cases', existing.id, 'OWNER_DELETE', reason, `Directly archived by ${req.user!.name}`);
    res.json({ ok: true, mode: 'deleted_by_owner' });
    return;
  }
  const reqId = `DEL-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
  db.prepare(`
    INSERT INTO recycle_bin_requests (id, entity_type, record_id, record_label, snapshot_json, reason, requested_by, requested_by_name, status, created_at)
    VALUES (?,?,?,?,?,?,?,?,'Pending Owner Approval',?)
  `).run(reqId, 'mortgage_cases', existing.id, `${existing.case_code} — ${existing.borrower_name}`, JSON.stringify(existing), reason, req.user!.id, req.user!.name, now);

  db.prepare('INSERT INTO notifications (id, user_id, title, body, link, severity, created_at) VALUES (?,?,?,?,?,?,?)').run(
    `NTF-${crypto.randomBytes(3).toString('hex')}`,
    'USR-01',
    `Delete Bin Request: ${existing.case_code}`,
    `${req.user!.name} requested deletion of ${existing.borrower_name}. Reason: ${reason}`,
    '/compliance',
    'warning',
    now,
  );
  logAudit(req.user!, 'recycle_bin', reqId, 'DELETE_REQUESTED', reason, `Queued ${existing.case_code} for Owner Shabib Siraj approval`);
  res.status(202).json({ ok: true, mode: 'queued_for_owner_approval', requestId: reqId });
});

// Parallel Bank Submissions per case
apiRouter.post('/cases/:id/submissions', requireAuth, (req: AuthedRequest, res: Response) => {
  const c = db.prepare('SELECT * FROM mortgage_cases WHERE id = ? AND deleted_soft = 0').get(String(req.params.id)) as any;
  if (!c) {
    res.status(404).json({ error: 'Case not found' });
    return;
  }
  const bankKey = String(req.body?.bank_key || 'emirates-nbd');
  const bank = UAE_BANKS.find((b) => b.key === bankKey) || UAE_BANKS[0]!;
  const id = `SUB-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
  const ref = `${bank.short.toUpperCase()}-2026-${Math.floor(100 + Math.random() * 899)}`;
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO bank_submissions (id, case_id, bank_key, bank_name, lender_ref, product_type, rate_pct, loan_amount_aed, status, conditions, dip_expiry, submitted_at, updated_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).run(
    id, c.id, bank.key, bank.name, ref, String(req.body?.product_type || '3Y Fixed'),
    Number(req.body?.rate_pct ?? bank.indicativeFixed3Y), Number(req.body?.loan_amount_aed ?? c.requested_loan_aed),
    'Submitted', String(req.body?.conditions || 'Awaiting bank credit acknowledgement'),
    new Date(Date.now() + 60 * 24 * 3600 * 1000).toISOString().slice(0, 10), now, now,
  );
  logAudit(req.user!, 'bank_submissions', id, 'BANK_SUBMIT', `Submitted ${c.case_code} to ${bank.name}`, ref);
  res.status(201).json({ id, lender_ref: ref, bank_name: bank.name });
});

apiRouter.patch('/documents/:docId', requireAuth, (req: AuthedRequest, res: Response) => {
  const status = String(req.body?.status || 'Verified');
  const now = new Date().toISOString();
  db.prepare("UPDATE case_documents SET status = ?, verified_by = ?, vault_ref = COALESCE(NULLIF(?, ''), vault_ref), updated_at = ? WHERE id = ?").run(
    status,
    status === 'Verified' ? req.user!.name : '',
    String(req.body?.vault_ref || ''),
    now,
    String(req.params.docId),
  );
  logAudit(req.user!, 'case_documents', String(req.params.docId), 'DOC_STATUS', `Marked ${status}`, '');
  res.json({ ok: true, status });
});

// ---------- QUOTES (VERSIONED KFS) ----------
apiRouter.get('/quotes', requireAuth, (_req, res) => {
  res.json({ quotes: db.prepare('SELECT * FROM quotes ORDER BY created_at DESC LIMIT 50').all() });
});

apiRouter.post('/quotes', requireAuth, (req: AuthedRequest, res: Response) => {
  const b = req.body || {};
  const id = `QT-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO quotes (
      id, case_id, borrower_name, bank_key, bank_name, rule_version, eibor_date,
      property_price_aed, loan_amount_aed, tenure_years, fixed_rate_pct, fixed_years,
      revert_rate_pct, intro_emi_aed, revert_emi_aed, cash_to_close_aed, dbr_pct, ltv_pct,
      created_by, created_at
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).run(
    id, b.case_id || null, String(b.borrower_name || 'Walk-in Client'), String(b.bank_key || 'emirates-nbd'),
    String(b.bank_name || 'Emirates NBD'), CBUAE_RULE_VERSION, EIBOR_SNAPSHOT.asOfDate,
    Number(b.property_price_aed || 2_500_000), Number(b.loan_amount_aed || 2_000_000), Number(b.tenure_years || 25),
    Number(b.fixed_rate_pct || 3.89), Number(b.fixed_years || 3), Number(b.revert_rate_pct || 5.96),
    Number(b.intro_emi_aed || 10_436), Number(b.revert_emi_aed || 12_680), Number(b.cash_to_close_aed || 665_000),
    Number(b.dbr_pct || 34.5), Number(b.ltv_pct || 80), req.user!.name, now,
  );
  logAudit(req.user!, 'quotes', id, 'CREATE_KFS_QUOTE', 'Versioned CBUAE Key Facts Quote saved', String(b.borrower_name || ''));
  res.status(201).json({ id, rule_version: CBUAE_RULE_VERSION });
});

// ---------- FINANCE, DSA COMMISSIONS & STRICT ZERO-PERSONAL-ACCOUNT GUARD ----------
apiRouter.get('/finance', requireAuth, (_req, res) => {
  const ledger = db.prepare('SELECT * FROM finance_ledger ORDER BY created_at DESC').all();
  const withdrawals = db.prepare('SELECT * FROM withdrawals ORDER BY created_at DESC').all();
  res.json({ ledger, withdrawals, legalPaymentChannels: LEGAL_UAE_PAYMENT_CHANNELS });
});

apiRouter.post('/finance/entries', requireAuth, (req: AuthedRequest, res: Response) => {
  const b = req.body || {};
  const channel = String(b.payment_channel || '');
  if (isPersonalAccountPayment(channel) || !LEGAL_UAE_PAYMENT_CHANNELS.includes(channel as any)) {
    logAudit(req.user!, 'finance_ledger', 'BLOCKED', 'ZERO_PERSONAL_ACCOUNT_VIOLATION', `Blocked channel: ${channel}`, '');
    res.status(400).json({
      error:
        'ZERO-TOLERANCE UAE LEGAL PAYMENT GUARD: Client fees and bank DSA commissions may ONLY route through licensed Betterway corporate, bank wire, or DLD escrow accounts. Personal advisor accounts are strictly prohibited.',
    });
    return;
  }
  const loan = Number(b.loan_disbursed_aed || 0);
  const dsaPct = Number(b.dsa_rate_pct || 0.85);
  const gross = Math.round((loan * dsaPct) / 100);
  const vat = Number((gross * 0.05).toFixed(2));
  const partnerShare = Math.round(Number(b.partner_share_aed || 0));
  const net = gross - partnerShare;
  const id = `FIN-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
  const invRef = `INV-BW-2026-${Math.floor(1100 + Math.random() * 8800)}`;
  const now = new Date().toISOString();
  const clawback = new Date(Date.now() + 180 * 24 * 3600 * 1000).toISOString().slice(0, 10);

  db.prepare(`
    INSERT INTO finance_ledger (
      id, invoice_ref, case_id, case_code, borrower_name, bank_key, bank_name, loan_disbursed_aed,
      dsa_rate_pct, gross_dsa_aed, vat_aed, partner_share_aed, swk_relay_fee_aed, net_betterway_aed,
      payment_channel, status, clawback_until, created_at, updated_at
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,'Accrued',?,?,?)
  `).run(
    id, invRef, String(b.case_id || ''), String(b.case_code || 'BW-MANUAL'), String(b.borrower_name || ''),
    String(b.bank_key || 'emirates-nbd'), String(b.bank_name || 'Emirates NBD'), loan, dsaPct, gross, vat,
    partnerShare, Number(b.swk_relay_fee_aed || 0), net, channel, clawback, now, now,
  );
  logAudit(req.user!, 'finance_ledger', id, 'CREATE_INVOICE', 'DSA accrual recorded', `${invRef} · AED ${gross}`);
  res.status(201).json({ id, invoice_ref: invRef, gross_dsa_aed: gross, vat_aed: vat, net_betterway_aed: net });
});

apiRouter.post('/finance/entries/:id/approve', requireAuth, requireOwner, (req: AuthedRequest, res: Response) => {
  const now = new Date().toISOString();
  db.prepare("UPDATE finance_ledger SET status = 'Settled', approved_by = ?, updated_at = ? WHERE id = ?").run(
    req.user!.name,
    now,
    String(req.params.id),
  );
  logAudit(req.user!, 'finance_ledger', String(req.params.id), 'OWNER_SETTLE_APPROVED', 'Executive payout/settlement verified', '');
  res.json({ ok: true });
});

apiRouter.post('/withdrawals/:id/decide', requireAuth, requireOwner, (req: AuthedRequest, res: Response) => {
  const decision = req.body?.decision === 'Approved' ? 'Approved — Refund Released' : 'Rejected';
  const now = new Date().toISOString();
  db.prepare('UPDATE withdrawals SET status = ?, approved_by = ?, updated_at = ? WHERE id = ?').run(
    decision,
    req.user!.name,
    now,
    String(req.params.id),
  );
  logAudit(req.user!, 'withdrawals', String(req.params.id), 'OWNER_WITHDRAWAL_DECISION', decision, '');
  res.json({ ok: true, status: decision });
});

// ---------- PARTNER HUB (RERA REALTOR REFERRALS) ----------
apiRouter.get('/partners', requireAuth, (_req, res) => {
  res.json({ referrals: db.prepare('SELECT * FROM partner_referrals ORDER BY created_at DESC').all() });
});

apiRouter.post('/partners/referrals', (req: Request, res: Response) => {
  const b = req.body || {};
  if (!b.agency_name || !b.buyer_name) {
    res.status(400).json({ error: 'agency_name and buyer_name are required.' });
    return;
  }
  const id = `PRT-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
  const code = `BWP-2026-${Math.floor(100 + Math.random() * 899)}`;
  const val = Number(b.property_value_aed || 2_500_000);
  const loan = Number(b.target_loan_aed || Math.round(val * 0.8));
  const sharePct = Number(b.commission_share_pct ?? 25);
  const estPayout = Math.round(((loan * 0.0085) * sharePct) / 100);
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO partner_referrals (
      id, referral_code, agency_name, agent_name, agent_phone, rera_orn, rera_brn,
      buyer_name, property_value_aed, target_loan_aed, stage_label, commission_share_pct,
      estimated_payout_aed, payout_status, created_at
    ) VALUES (?,?,?,?,?,?,?,?,?,?,'New Referral',?,?,'Tracked',?)
  `).run(
    id, code, String(b.agency_name), String(b.agent_name || 'Partner Agent'), String(b.agent_phone || '+971 50 000 0000'),
    String(b.rera_orn || 'ORN-PENDING'), String(b.rera_brn || 'BRN-PENDING'), String(b.buyer_name),
    val, loan, sharePct, estPayout, now,
  );
  bumpChangeFeed('partner_referrals', id, 'CREATE');
  res.status(201).json({ id, referral_code: code, estimated_payout_aed: estPayout });
});

// ---------- RECEPTION ROTATING QR ATTENDANCE, WI-FI LOCK & MANDATORY DAILY CLOSE ----------
apiRouter.get('/attendance/qr-terminal', requireAuth, async (req: AuthedRequest, res: Response) => {
  const qr = generateRotatingQrToken();
  const dataUrl = await QRCode.toDataURL(qr.code, { width: 320, margin: 2, color: { dark: '#070E1A', light: '#FFFFFF' } });
  const settingsRows = db.prepare('SELECT key, value FROM settings').all() as { key: string; value: string }[];
  const cfg = Object.fromEntries(settingsRows.map((r) => [r.key, r.value]));
  res.json({
    ...qr,
    qrDataUrl: dataUrl,
    officeAddress: cfg.office_address,
    officeWifiSsid: cfg.office_wifi_ssid,
    officeWifiIp: cfg.office_wifi_ip,
    officeWifiLocked: cfg.office_wifi_locked === '1',
    canPrintQr: Boolean(req.user!.can_print_qr),
    canLockWifi: Boolean(req.user!.can_lock_wifi),
  });
});

apiRouter.post('/attendance/wifi-lock', requireAuth, (req: AuthedRequest, res: Response) => {
  if (!req.user!.can_lock_wifi) {
    res.status(403).json({ error: 'Only Admin, Owner, or Executive Director can modify Office Wi-Fi lock.' });
    return;
  }
  const now = new Date().toISOString();
  const locked = req.body?.locked ? '1' : '0';
  if (req.body?.ssid) db.prepare("UPDATE settings SET value = ?, updated_at = ?, updated_by = ? WHERE key = 'office_wifi_ssid'").run(String(req.body.ssid), now, req.user!.id);
  if (req.body?.ip) db.prepare("UPDATE settings SET value = ?, updated_at = ?, updated_by = ? WHERE key = 'office_wifi_ip'").run(String(req.body.ip), now, req.user!.id);
  db.prepare("UPDATE settings SET value = ?, updated_at = ?, updated_by = ? WHERE key = 'office_wifi_locked'").run(locked, now, req.user!.id);
  logAudit(req.user!, 'settings', 'office_wifi', 'WIFI_LOCK_UPDATED', `Locked=${locked}`, String(req.body?.ssid || ''));
  res.json({ ok: true, locked: locked === '1' });
});

apiRouter.get('/attendance/live', requireAuth, (_req, res) => {
  const { dubaiDate } = dubaiNowParts();
  const events = db.prepare('SELECT * FROM attendance_events ORDER BY created_at DESC LIMIT 60').all();
  const reports = db.prepare('SELECT * FROM daily_reports ORDER BY created_at DESC LIMIT 30').all();
  res.json({ dubaiDate, events, reports });
});

apiRouter.post('/attendance/checkin', requireAuth, (req: AuthedRequest, res: Response) => {
  const { qrToken, mode, gpsLat, gpsLng, note } = req.body || {};
  const checkMode = String(mode || 'OFFICE_QR');
  if (checkMode === 'OFFICE_QR' && qrToken && !verifyRotatingQrToken(String(qrToken))) {
    res.status(400).json({ error: 'Reception QR token expired or invalid. Scan the live 20-second rotating screen at Al Nasr Plaza.' });
    return;
  }
  const { dubaiDate, dubaiTime, lateMinutes } = dubaiNowParts();
  const id = `ATT-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
  const now = new Date().toISOString();
  const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1');

  db.prepare(`
    INSERT INTO attendance_events (id, user_id, user_name, event_type, mode, dubai_date, dubai_time, late_minutes, wifi_ip, gps_lat, gps_lng, note, created_at)
    VALUES (?,?,?,'CHECK_IN',?,?,?,?,?,?,?,?,?)
  `).run(id, req.user!.id, req.user!.name, checkMode, dubaiDate, dubaiTime, lateMinutes, ip, gpsLat ?? null, gpsLng ?? null, String(note || 'Verified attendance check-in'), now);

  logAudit(req.user!, 'attendance', id, 'CHECK_IN', checkMode, `${dubaiDate} ${dubaiTime} (Late: ${lateMinutes}m)`);
  res.status(201).json({ id, dubaiDate, dubaiTime, lateMinutes });
});

/** SWK Mobile v3.0.0 parity: Check-out is blocked until Mandatory Daily Close Report (min 30 chars each) is submitted! */
apiRouter.post('/attendance/checkout', requireAuth, (req: AuthedRequest, res: Response) => {
  const { dubaiDate, dubaiTime } = dubaiNowParts();
  const report = db.prepare('SELECT id FROM daily_reports WHERE user_id = ? AND dubai_date = ?').get(req.user!.id, dubaiDate);
  if (!report) {
    res.status(400).json({
      error: 'CHECK-OUT BLOCKED: Submit your mandatory Daily Close Report & Next-Day Plan (min 30 chars each) before checking out. Owner Shabib Siraj is notified automatically.',
    });
    return;
  }
  const id = `ATT-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO attendance_events (id, user_id, user_name, event_type, mode, dubai_date, dubai_time, late_minutes, note, created_at)
    VALUES (?,?,?,'CHECK_OUT','OFFICE_QR',?,?,0,'Daily close verified — shift completed',?)
  `).run(id, req.user!.id, req.user!.name, dubaiDate, dubaiTime, now);
  logAudit(req.user!, 'attendance', id, 'CHECK_OUT', 'Shift closed after daily report', `${dubaiDate} ${dubaiTime}`);
  res.status(201).json({ id, dubaiDate, dubaiTime });
});

apiRouter.post('/daily/report', requireAuth, (req: AuthedRequest, res: Response) => {
  const summary = String(req.body?.summary_today || '').trim();
  const plan = String(req.body?.plan_tomorrow || '').trim();
  if (summary.length < 30 || plan.length < 30) {
    res.status(400).json({ error: 'Both Today Summary and Next-Day Plan must be at least 30 characters.' });
    return;
  }
  const { dubaiDate } = dubaiNowParts();
  const id = `DLY-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO daily_reports (id, user_id, user_name, dubai_date, summary_today, plan_tomorrow, calls_made, cases_submitted, created_at)
    VALUES (?,?,?,?,?,?,?,?,?)
  `).run(id, req.user!.id, req.user!.name, dubaiDate, summary, plan, Number(req.body?.calls_made || 0), Number(req.body?.cases_submitted || 0), now);

  db.prepare('INSERT INTO notifications (id, user_id, title, body, link, severity, created_at) VALUES (?,?,?,?,?,?,?)').run(
    `NTF-${crypto.randomBytes(3).toString('hex')}`,
    'USR-01',
    `Daily Close Submitted: ${req.user!.name}`,
    summary.slice(0, 120),
    '/reception-qr',
    'info',
    now,
  );
  logAudit(req.user!, 'daily_reports', id, 'DAILY_CLOSE', 'Mandatory EOD submitted', dubaiDate);
  res.status(201).json({ id, dubaiDate });
});

// ---------- COMPLIANCE, RECYCLE BIN & UNIVERSAL AUDIT LOG ----------
apiRouter.get('/compliance', requireAuth, (_req, res) => {
  const records = db.prepare('SELECT * FROM compliance_records ORDER BY created_at DESC').all();
  const recycleBin = db.prepare('SELECT * FROM recycle_bin_requests ORDER BY created_at DESC').all();
  const audit = db.prepare('SELECT * FROM audit_log ORDER BY id DESC LIMIT 100').all();
  res.json({ records, recycleBin, audit });
});

apiRouter.post('/compliance/:id/seal', requireAuth, requireOwner, (req: AuthedRequest, res: Response) => {
  const now = new Date().toISOString();
  db.prepare("UPDATE compliance_records SET status = 'Sealed & Approved', seal_approved_by = ?, updated_at = ? WHERE id = ?").run(
    req.user!.name,
    now,
    String(req.params.id),
  );
  logAudit(req.user!, 'compliance_records', String(req.params.id), 'OWNER_SEAL_APPROVED', 'Official Betterway corporate seal granted', '');
  res.json({ ok: true });
});

apiRouter.post('/recycle-bin/:id/decide', requireAuth, requireOwner, (req: AuthedRequest, res: Response) => {
  const decision = req.body?.decision === 'approve' ? 'Approved — Deleted' : 'Rejected — Restored';
  const row = db.prepare('SELECT * FROM recycle_bin_requests WHERE id = ?').get(String(req.params.id)) as any;
  if (!row) {
    res.status(404).json({ error: 'Delete Bin request not found' });
    return;
  }
  const now = new Date().toISOString();
  db.prepare('UPDATE recycle_bin_requests SET status = ?, decided_by = ?, decided_at = ? WHERE id = ?').run(
    decision,
    req.user!.name,
    now,
    row.id,
  );
  if (req.body?.decision === 'approve' && row.entity_type === 'mortgage_cases') {
    db.prepare('UPDATE mortgage_cases SET deleted_soft = 1, updated_at = ? WHERE id = ?').run(now, row.record_id);
  }
  logAudit(req.user!, 'recycle_bin', row.id, 'OWNER_DELETE_DECISION', decision, row.record_label);
  res.json({ ok: true, status: decision });
});

// ---------- 50-SPEC EXCEL DATA HUB ----------
apiRouter.get('/data-hub/specs', requireAuth, (_req, res) => {
  res.json({ specs: EXCEL_SPECS });
});

apiRouter.get('/data-hub/export/:num', requireAuth, (req: AuthedRequest, res: Response) => {
  const spec = EXCEL_SPECS.find((s) => s.num === String(req.params.num).padStart(2, '0'));
  if (!spec) {
    res.status(404).json({ error: 'Excel spec not found' });
    return;
  }
  const rows: Record<string, any>[] = [];
  if (spec.exportEntity === 'banks') {
    UAE_BANKS.forEach((b) =>
      rows.push({
        bank_id: b.id, legal_name: b.name, status: 'Active', submission_channel: 'Broker Portal / Email',
        relationship_owner: 'Daniel Xavier', source_ref: 'CBUAE Panel', last_verified_at: b.verifiedDate,
        product_id: `PRD-${b.key.toUpperCase()}`, product_type: b.type, rate_type: 'Fixed-to-EIBOR',
        fixed_rate_pct: b.indicativeFixed3Y, fixed_months: 36, benchmark_tenor: '3M EIBOR',
        revert_margin_pct: b.revertMarginOver3m, floor_pct: b.floorPct, fees: `${b.processingFeePct}%`,
        sla_business_days: b.slaDays, approved_by: 'Shabib Siraj',
      }),
    );
  } else if (spec.exportEntity === 'cases') {
    (db.prepare('SELECT * FROM mortgage_cases WHERE deleted_soft = 0').all() as any[]).forEach((c) =>
      rows.push({
        case_id: c.case_code, legacy_case_id: c.case_code, case_type: c.mortgage_type, stage_code: c.stage_code,
        stage_entered_at: c.updated_at, owner_id: c.advisor_id, next_action: c.next_action, due_at: c.sla_due_at,
        valuation_aed: c.valuation_aed, valuation_gap_aed: c.valuation_aed ? c.valuation_aed - c.property_price_aed : 0,
        noc_status: c.noc_status, disbursal_amount_aed: c.requested_loan_aed, purchase_price_aed: c.property_price_aed,
        emirate: c.emirate, project_id: c.project_name, fixed_end_date: c.fixed_expiry_date,
      }),
    );
  } else if (spec.exportEntity === 'leads') {
    (db.prepare('SELECT * FROM leads').all() as any[]).forEach((l) =>
      rows.push({
        legacy_lead_id: l.reference_code, contact_name: l.contact_name, phone: l.contact_phone, email: l.contact_email,
        source_id: l.source_channel, owner_id: l.assigned_to, consent_status: l.consent_pdpl ? 'Opted-In' : 'Suppressed',
        captured_at: l.created_at,
      }),
    );
  } else if (spec.exportEntity === 'finance') {
    (db.prepare('SELECT * FROM finance_ledger').all() as any[]).forEach((f) =>
      rows.push({
        case_id: f.case_code, bank_id: f.bank_key, invoice_ref: f.invoice_ref, invoiced_aed: f.gross_dsa_aed,
        tax_aed: f.vat_aed, received_aed: f.status === 'Settled' ? f.gross_dsa_aed : 0, accrual_aed: f.gross_dsa_aed,
        approval_ref: f.approved_by,
      }),
    );
  } else if (spec.exportEntity === 'audit') {
    (db.prepare('SELECT * FROM audit_log ORDER BY id DESC LIMIT 100').all() as any[]).forEach((a) =>
      rows.push({
        event_id: a.id, case_id: a.record_id, actor_id: a.actor_name, action: a.action, occurred_at: a.created_at,
        export_purpose: a.reason,
      }),
    );
  } else if (spec.exportEntity === 'eibor') {
    EIBOR_SNAPSHOT.history.forEach((h) =>
      rows.push({
        rate_code: 'EIBOR_3M', tenor_or_currency_pair: '3M AED', published_at: h.date, observation_date: h.date,
        value: h.threeMonth, source_ref: EIBOR_SNAPSHOT.source, verification_status: 'Verified',
      }),
    );
  }

  const esc = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const lines = [
    spec.columns.map(esc).join(','),
    ...rows.map((r) => spec.columns.map((col) => esc(r[col] ?? '')).join(',')),
  ];
  logAudit(req.user!, 'data_hub', spec.num, 'EXCEL_EXPORT', `Exported ${spec.filename}`, `${rows.length} rows`);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${spec.filename.replace(/\.xlsx$/i, '.csv')}"`);
  res.send('\uFEFF' + lines.join('\r\n'));
});

// ---------- BETTERWAY CORE SUITE: INSIDE (CHAT), WORK (AUTOMATIONS), PHONE (DIALER), AI COPILOT ----------
apiRouter.get('/chat', requireAuth, (req: AuthedRequest, res: Response) => {
  const channel = typeof req.query.channel === 'string' ? req.query.channel : 'all';
  const rows =
    channel === 'all'
      ? db.prepare('SELECT * FROM chat_messages ORDER BY created_at ASC').all()
      : db.prepare('SELECT * FROM chat_messages WHERE channel = ? ORDER BY created_at ASC').all(channel);
  res.json({ messages: rows });
});

apiRouter.post('/chat', requireAuth, (req: AuthedRequest, res: Response) => {
  const body = String(req.body?.body || '').trim();
  if (!body) {
    res.status(400).json({ error: 'Message body required' });
    return;
  }
  const id = `MSG-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
  const now = new Date().toISOString();
  db.prepare('INSERT INTO chat_messages (id, channel, sender_id, sender_name, sender_avatar, body, case_ref, created_at) VALUES (?,?,?,?,?,?,?,?)').run(
    id, String(req.body?.channel || 'general'), req.user!.id, req.user!.name, req.user!.avatar, body, String(req.body?.case_ref || ''), now,
  );
  bumpChangeFeed('chat_messages', id, 'CREATE');
  res.status(201).json({ id, created_at: now });
});

apiRouter.get('/calls', requireAuth, (_req, res) => {
  res.json({ calls: db.prepare('SELECT * FROM call_logs ORDER BY created_at DESC LIMIT 50').all() });
});

apiRouter.post('/calls', requireAuth, (req: AuthedRequest, res: Response) => {
  const id = `CAL-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
  const now = new Date().toISOString();
  const rawPhone = String(req.body?.phone || '+971 50 000 0000');
  const masked = rawPhone.length > 6 ? `${rawPhone.slice(0, 7)} ••• •${rawPhone.slice(-3)}` : rawPhone;
  db.prepare('INSERT INTO call_logs (id, user_id, user_name, contact_name, masked_number, direction, duration_sec, outcome, notes, created_at) VALUES (?,?,?,?,?,?,?,?,?,?)').run(
    id, req.user!.id, req.user!.name, String(req.body?.contact_name || 'Borrower Call'), masked,
    'Outbound', Number(req.body?.duration_sec || 65), String(req.body?.outcome || 'Connected'), String(req.body?.notes || ''), now,
  );
  bumpChangeFeed('call_logs', id, 'CREATE');
  res.status(201).json({ id, masked_number: masked });
});

apiRouter.get('/automations', requireAuth, (_req, res) => {
  res.json({ automations: db.prepare('SELECT * FROM automations ORDER BY id').all() });
});

apiRouter.patch('/automations/:id', requireAuth, (req: AuthedRequest, res: Response) => {
  const enabled = req.body?.enabled ? 1 : 0;
  const runNow = Boolean(req.body?.trigger_now);
  const now = new Date().toISOString();
  if (runNow) {
    db.prepare('UPDATE automations SET runs_count = runs_count + 1, last_run_at = ? WHERE id = ?').run(now, String(req.params.id));
    logAudit(req.user!, 'automations', String(req.params.id), 'MANUAL_RUN', 'Triggered workflow run', '');
  } else {
    db.prepare('UPDATE automations SET enabled = ? WHERE id = ?').run(enabled, String(req.params.id));
    logAudit(req.user!, 'automations', String(req.params.id), 'TOGGLE', `enabled=${enabled}`, '');
  }
  res.json({ ok: true });
});

apiRouter.get('/notifications', requireAuth, (req: AuthedRequest, res: Response) => {
  const rows = db
    .prepare("SELECT * FROM notifications WHERE user_id = 'ALL' OR user_id = ? ORDER BY created_at DESC LIMIT 30")
    .all(req.user!.id) as any[];
  const unread = rows.filter((r) => !r.read_at).length;
  res.json({ unread, rows });
});

apiRouter.post('/notifications/read', requireAuth, (req: AuthedRequest, res: Response) => {
  const now = new Date().toISOString();
  db.prepare("UPDATE notifications SET read_at = ? WHERE (user_id = 'ALL' OR user_id = ?) AND read_at = ''").run(now, req.user!.id);
  res.json({ ok: true });
});

/** Real-Time Sync Feed for Betterway Mobile App (exact SWK Mobile v3.0.0 parity). */
apiRouter.get('/sync/changes', requireAuth, (req: AuthedRequest, res: Response) => {
  const since = Number(req.query.since || 0);
  const changes = db.prepare('SELECT * FROM change_feed WHERE seq > ? ORDER BY seq ASC LIMIT 50').all(since) as any[];
  const latestSeq = (db.prepare('SELECT COALESCE(MAX(seq), 0) as m FROM change_feed').get() as { m: number }).m;
  res.json({ latestSeq, changes, serverTime: new Date().toISOString() });
});

/** Grounded Betterway AI Underwriting Copilot (live SQL + CBUAE + 15-Year Underwriting PDF rules). */
apiRouter.post('/ai/copilot', requireAuth, (req: AuthedRequest, res: Response) => {
  const prompt = String(req.body?.prompt || '').trim();
  const q = prompt.toLowerCase();
  const cases = db.prepare('SELECT * FROM mortgage_cases WHERE deleted_soft = 0').all() as any[];
  const totalLoans = cases.reduce((s, c) => s + Number(c.requested_loan_aed || 0), 0);
  const totalDsa = Math.round(cases.reduce((s, c) => s + (Number(c.requested_loan_aed || 0) * Number(c.dsa_rate_pct || 0.85)) / 100, 0));

  let answer = '';
  if (q.includes('low-doc') || q.includes('low doc') || q.includes('self-employed') || q.includes('self employed')) {
    answer = [
      '**Betterway Self-Employed Underwriting Rules (15-Year Policy Playbook):**',
      '• **Option 1 (Full-Doc):** Up to 80% LTV (first home ≤ AED 5M), requires 2-year Trade License, 1-year ownership, 2 years audited financials & AED 2.0M+ 12-month corporate bank turnover. Age cap: **70 years**.',
      '• **Option 2 (Low-Doc Personal Statement):** No full company financials required. Requires **> AED 40,000/mo** personal account credits & **AED 15,000** minimum maintained balance, 4 quarters VAT returns, office Ejari, website, AECB report & AED 1,050 bank pre-approval cheque. Capped at **50–60% LTV** (first home) and up to **AED 2.0M** standard loan.',
      '• **Top Panel Banks for Self-Employed/Low-Doc:** RAKBANK, RAKislamic, Mashreq Bank, CBD, Dubai Islamic Bank, Ajman Bank, CBI.',
    ].join('\n');
  } else if (q.includes('non-resident') || q.includes('non resident') || q.includes('overseas')) {
    answer = [
      '**Betterway Non-Resident Desk Rules:**',
      '• **Account Activity Threshold:** Minimum **AED 40,000/mo** credited across ≥ 4 transactions (6 months statements), **AED 15,000** month-end floor, and **AED 25,000** average balance.',
      '• **LTV & Ceiling:** Typically **50%–60% LTV** (up to AED 2.2M standard desk, higher for HSBC/SC/ENBD wealth tiers). Equity release is **not permitted** for non-residents.',
      '• **Participating Panel (14 Banks):** Emirates NBD, FAB, DIB, ADCB, EI, HSBC, Mashreq, CBD, RAKBANK, Standard Chartered, Ajman Bank, Arab Bank, Citi, Bank of Baroda.',
    ].join('\n');
  } else if (q.includes('eibor') || q.includes('rate') || q.includes('buyout') || q.includes('refinance')) {
    answer = [
      `**Live CBUAE EIBOR Snapshot (${EIBOR_SNAPSHOT.asOfDate}):**`,
      `• Overnight: **${EIBOR_SNAPSHOT.latest.overnight.toFixed(3)}%** | 1M: **${EIBOR_SNAPSHOT.latest.oneMonth.toFixed(3)}%** | **3M EIBOR: ${EIBOR_SNAPSHOT.latest.threeMonth.toFixed(3)}%** | 6M: **${EIBOR_SNAPSHOT.latest.sixMonth.toFixed(3)}%** | 1Y: **${EIBOR_SNAPSHOT.latest.oneYear.toFixed(3)}%**`,
      `• **CBUAE Early Settlement Cap:** min(1% of balance, AED 10,000) + 5% VAT — max AED 10,500 exit fee!`,
      `• **Best 3Y Fixed Benchmarks:** HSBC UAE (3.84%), Emirates NBD (3.89%), Standard Chartered (3.89%), Emirates Islamic (3.92%), FAB (3.94%), DIB & Mashreq (3.95%).`,
    ].join('\n');
  } else {
    answer = [
      `**Betterway Executive Pipeline Brief (${cases.length} Active Cases):**`,
      `• **Active Loan Book:** AED ${Math.round(totalLoans).toLocaleString()} across Dubai & Abu Dhabi.`,
      `• **Projected Gross DSA Pool:** AED ${totalDsa.toLocaleString()} (plus SWK Properties Dual-Relay attribution on ${cases.filter((c) => c.is_swk_relay).length} linked deals).`,
      `• **CBUAE Statutory Guardrails Active:** 50% DBR @ 6.5% stress rate | Expat ≤5M: 80% LTV (>5M: 70%) | National ≤5M: 85% LTV | Off-Plan: 50% LTV | Zero-Personal-Account payment lock active.`,
      `• Ask me about *Low-Doc self-employed criteria*, *Non-Resident thresholds*, *EIBOR buyout math*, or *Handover SOA release*.`,
    ].join('\n');
  }

  res.json({
    answer,
    ruleVersion: CBUAE_RULE_VERSION,
    eibor3m: EIBOR_SNAPSHOT.latest.threeMonth,
    timestamp: new Date().toISOString(),
  });
});
