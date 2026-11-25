import type { Router, Response } from 'express';
import crypto from 'node:crypto';
import { db, logAudit, bumpChangeFeed } from './db.js';
import { requireAuth, requireOwner, type AuthedRequest } from './auth.js';
import { CASE_MILESTONES, DOCUMENT_CHECKLIST_BY_PROFILE } from '../shared/workflow-constants.js';
import { UAE_BANKS } from '../shared/banks-data.js';
import { UAE_COMMUNITIES } from '../shared/communities-data.js';
import { EXCEL_SPECS } from '../shared/excel-specs.js';

const SIMPLE_WORKFLOW_GUIDE: Record<string, { simpleTitle: string; howTo: string[] }> = {
  '01_NEW_ENQUIRY': { simpleTitle: '1. New Client Enquiry', howTo: ['Call client within 5 minutes', 'Confirm budget, residency & consent', 'Move to Step 2 once interested'] },
  '02_FACT_FIND': { simpleTitle: '2. Check Eligibility & Income', howTo: ['Check salary / business turnover', 'Add existing loans & credit card limits', 'Verify CBUAE 50% DBR & age cap'] },
  '03_SHORTLIST': { simpleTitle: '3. Pick Banks & Send Quote', howTo: ['Compare top 3 UAE banks side-by-side', 'Show monthly EMI + upfront Dubai cash', 'Send branded Betterway Quote PDF'] },
  '04_DOC_REVIEW': { simpleTitle: '4. Collect & Check Papers', howTo: ['Collect Passport, EID, 6-mo statements & AECB', 'Verify every file in the Vault', 'Clear missing items before submitting'] },
  '05_BANK_SUBMISSION': { simpleTitle: '5. Submit to Partner Banks', howTo: ['Submit to primary + 1 backup bank', 'Log official bank reference numbers', 'Follow up with bank RM every 24 hours'] },
  '06_PRE_APPROVAL': { simpleTitle: '6. Get Pre-Approval (DIP)', howTo: ['Download official Bank DIP letter', 'Check expiry date & conditions', 'Give client green light to sign Form F'] },
  '07_VALUATION': { simpleTitle: '7. Property Valuation', howTo: ['Pay bank valuation fee (AED 3,150)', 'Coordinate site access with seller/agent', 'Check valuation vs purchase price'] },
  '08_FINAL_OFFER': { simpleTitle: '8. Sign Final Bank Offer (FOL)', howTo: ['Review final rate, revert & fees', 'Arrange lower-cost external life insurance', 'Get borrower signature on FOL'] },
  '09_TRANSFER_NOC': { simpleTitle: '9. Developer NOC & Transfer', howTo: ['Apply for Developer NOC clearance', 'Prepare Manager Cheques split', 'Book DLD Trustee transfer appointment'] },
  '10_DISBURSAL': { simpleTitle: '10. Bank Pays Out Loan', howTo: ['Attend DLD Trustee transfer', 'Confirm Title Deed & Mortgage Registration', 'Save final disbursal confirmation'] },
  '11_SETTLEMENT': { simpleTitle: '11. Collect Bank Commission', howTo: ['Send DSA Tax Invoice (+5% VAT) to bank', 'Confirm SWK/RERA partner split', 'Verify wire into Betterway corporate account'] },
  '12_CLOSED': { simpleTitle: '12. Client Care & Buy-Out Watch', howTo: ['Collect 5-star Google review', 'Arm 90-day fixed-rate expiry alert', 'Pitch buyout savings before rate reverts'] },
};

const TRANSLATION_GLOSSARY: Record<string, Record<string, string>> = {
  ar: {
    'Pre-Approval': 'الموافقة المبدئية (DIP)',
    'Final Offer Letter': 'خطاب العرض النهائي (FOL)',
    'Mortgage': 'التمويل العقاري',
    'Down Payment': 'الدفعة المقدمة',
    'Monthly Payment': 'القسط الشهري',
    'Bank Valuation': 'التقييم العقاري البنكي',
    'Title Deed': 'سند الملكية',
    'Zero Broker Fee': 'بدون أي رسوم وساطة على العميل',
  },
  hi: {
    'Pre-Approval': 'प्री-अप्रूवल (DIP)',
    'Final Offer Letter': 'फ़ाइनल ऑफ़र लेटर (FOL)',
    'Mortgage': 'मॉर्गेज / होम लोन',
    'Down Payment': 'डाउन पेमेंट',
    'Monthly Payment': 'मासिक किस्त (EMI)',
    'Bank Valuation': 'बैंक प्रॉपर्टी वैल्यूएशन',
    'Title Deed': 'टाइटल डीड',
    'Zero Broker Fee': 'क्लाइंट के लिए ज़ीरो ब्रोकर फ़ीस',
  },
  ur: {
    'Pre-Approval': 'پری اپروول (DIP)',
    'Final Offer Letter': 'فائنل آفر لیٹر (FOL)',
    'Mortgage': 'مورٹگیج / ہوم لون',
    'Down Payment': 'ڈاؤن پیمنٹ',
    'Monthly Payment': 'ماہانہ قسط (EMI)',
    'Zero Broker Fee': 'کلائنٹ کے لیے صفر بروکر فیس',
  },
  ru: {
    'Pre-Approval': 'Предварительное одобрение (DIP)',
    'Final Offer Letter': 'Финальное предложение банка (FOL)',
    'Mortgage': 'Ипотека в ОАЭ',
    'Down Payment': 'Первоначальный взнос',
    'Monthly Payment': 'Ежемесячный платёж',
    'Zero Broker Fee': '0 AED комиссия брокера для клиента',
  },
  fr: {
    'Pre-Approval': 'Pré-approbation bancaire (DIP)',
    'Final Offer Letter': 'Offre finale de prêt (FOL)',
    'Mortgage': 'Crédit immobilier aux EAU',
    'Down Payment': 'Apport personnel',
    'Monthly Payment': 'Mensualité',
    'Zero Broker Fee': 'Zéro frais de courtage pour le client',
  },
  zh: {
    'Pre-Approval': '银行预批函 (DIP)',
    'Final Offer Letter': '最终贷款报价函 (FOL)',
    'Mortgage': '阿联酋房产按揭贷款',
    'Down Payment': '首付款',
    'Monthly Payment': '每月还款额',
    'Zero Broker Fee': '客户零中介费',
  },
  tl: {
    'Pre-Approval': 'Pre-Approval mula sa Bangko (DIP)',
    'Mortgage': 'Home Loan / Mortgage sa UAE',
    'Down Payment': 'Paunang Bayad (Down Payment)',
    'Zero Broker Fee': 'Walang Broker Fee para sa Kliyente',
  },
  ml: {
    'Pre-Approval': 'ബാങ്ക് പ്രീ-അപ്രൂവൽ (DIP)',
    'Mortgage': 'യു.എ.ഇ ഭവന വായ്പ',
    'Down Payment': 'ഡൗൺ പേയ്മെന്റ്',
    'Zero Broker Fee': 'ക്ലയന്റിന് ബ്രോക്കർ ഫീസ് ഇല്ല',
  },
};

export function registerSwkParityRoutes(apiRouter: Router) {
  // ---------- 1. SHABIB'S CORNER (OWNER COMMAND SUITE, AI IMPORTER & EMERGENCY OVERRIDE) ----------
  apiRouter.get('/shabibs-corner/overview', requireAuth, (req: AuthedRequest, res: Response) => {
    const cases = db.prepare('SELECT * FROM mortgage_cases WHERE deleted_soft = 0').all() as any[];
    const stages = CASE_MILESTONES.map((m) => {
      const inStage = cases.filter((c) => c.stage_code === m.code);
      const guide = SIMPLE_WORKFLOW_GUIDE[m.code] || { simpleTitle: `${m.order}. ${m.label}`, howTo: [m.requiredEvidence] };
      return {
        step: m.order,
        code: m.code,
        title: guide.simpleTitle,
        ownerRole: m.ownerRole,
        count: inStage.length,
        loanAed: Math.round(inStage.reduce((s, c) => s + Number(c.requested_loan_aed || 0), 0)),
        howTo: guide.howTo,
      };
    });

    const pendingSeals = (db.prepare("SELECT COUNT(*) as c FROM compliance_records WHERE status LIKE '%Pending%'").get() as { c: number }).c
      + (db.prepare("SELECT COUNT(*) as c FROM word_documents WHERE seal_status = 'Pending Owner Seal'").get() as { c: number }).c;
    const deleteBin = (db.prepare("SELECT COUNT(*) as c FROM recycle_bin_requests WHERE status = 'Pending Owner Approval'").get() as { c: number }).c;
    const withdrawals = (db.prepare("SELECT COUNT(*) as c FROM withdrawals WHERE status = 'Pending Owner Approval'").get() as { c: number }).c;
    const leaves = (db.prepare("SELECT COUNT(*) as c FROM hr_leave_requests WHERE status = 'Pending'").get() as { c: number }).c;
    const overrides = db.prepare('SELECT * FROM owner_overrides ORDER BY created_at DESC LIMIT 20').all();

    res.json({
      owner: { name: req.user!.name, email: req.user!.email, canOverride: Boolean(req.user!.can_approve_deletions) },
      stages,
      approvals: {
        seals: pendingSeals,
        deleteBin,
        withdrawals,
        leaves,
        total: pendingSeals + deleteBin + withdrawals + leaves,
      },
      overrides,
    });
  });

  apiRouter.post('/shabibs-corner/emergency-override', requireAuth, requireOwner, (req: AuthedRequest, res: Response) => {
    const b = req.body || {};
    const name = String(b.borrower_name || '').trim();
    const reason = String(b.reason || 'Executive Owner VIP Override').trim();
    if (!name) {
      res.status(400).json({ error: 'Client name is required.' });
      return;
    }
    const caseId = `CASE-VIP-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
    const caseCode = `BW-VIP-${Math.floor(100 + Math.random() * 899)}`;
    const price = Number(b.property_price_aed || 3_500_000);
    const loan = Number(b.requested_loan_aed || Math.round(price * 0.8));
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
      caseId, caseCode, name, String(b.borrower_phone || '+971 50 VIP 0000'), '', 'VIP Client', 'expat_resident',
      'salaried', String(b.mortgage_type || 'Resale Purchase (Secondary)'), '05_BANK_SUBMISSION',
      'Dubai', String(b.community || 'Dubai Hills Estate'), String(b.project_name || 'VIP Priority File'), '', 'Master Developer',
      price, loan, 0, 85_000, 0, 20_000, 38, Number(((loan / Math.max(1, price)) * 100).toFixed(1)), 32.0,
      String(b.primary_bank_key || 'emirates-nbd'), 3.89, 0.85, 1, 'Owner VIP Direct', req.user!.id, 'USR-07',
      `bw-vip-${caseCode.toLowerCase()}`, 'Owner Priority Fast-Track to Bank RM', new Date(Date.now() + 24 * 3600_000).toISOString(), now, now,
    );

    const checklist = DOCUMENT_CHECKLIST_BY_PROFILE.salaried;
    const insDoc = db.prepare('INSERT INTO case_documents (id, case_id, doc_name, mandatory, status, updated_at) VALUES (?,?,?,?,?,?)');
    checklist.forEach((d, i) => insDoc.run(`${caseId}-DOC-${i + 1}`, caseId, d.name, d.mandatory ? 1 : 0, 'Missing', now));

    const ovId = `OV-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    db.prepare('INSERT INTO owner_overrides (id, actor_name, entity_type, record_label, reason, created_at) VALUES (?,?,?,?,?,?)').run(
      ovId, req.user!.name, 'mortgage_cases', `${caseCode} · ${name}`, reason, now,
    );
    logAudit(req.user!, 'owner_overrides', ovId, 'EMERGENCY_OVERRIDE', reason, `${caseCode} opened under Owner authority`);
    res.status(201).json({ ok: true, case_code: caseCode, override_id: ovId });
  });

  apiRouter.post('/shabibs-corner/ai-import', requireAuth, (req: AuthedRequest, res: Response) => {
    const raw = String(req.body?.raw_text || '').trim();
    const target = String(req.body?.target || 'vault'); // vault | leads
    if (!raw) {
      res.status(400).json({ error: 'Paste at least one line of leads, CSV, or WhatsApp text to convert.' });
      return;
    }
    const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const now = new Date().toISOString();
    const imported: any[] = [];

    for (const line of lines) {
      // Flexible parser: splits on comma, pipe, tab, or dash
      const parts = line.split(/[,|\t;]+/).map((p) => p.trim()).filter(Boolean);
      if (!parts.length) continue;
      const name = parts[0]!.replace(/^\d+[.)]\s*/, '');
      const phoneMatch = line.match(/(\+?\d[\d\s-]{7,15}\d)/);
      const rawPhone = phoneMatch ? phoneMatch[1]!.trim() : '+971 50 000 0000';
      const maskedPhone = rawPhone.length > 6 ? `${rawPhone.slice(0, 7)} ••• •${rawPhone.slice(-3)}` : rawPhone;
      const numMatch = line.match(/(\d[\d,]{5,9})/);
      const price = numMatch ? Number(numMatch[1]!.replace(/,/g, '')) : 2_500_000;
      const community = parts[2] && !/\d{6}/.test(parts[2]) ? parts[2] : 'Dubai Freehold';

      if (target === 'leads') {
        const id = `LD-AI-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
        const ref = `BW-AI-${Math.floor(1000 + Math.random() * 8999)}`;
        db.prepare(`
          INSERT INTO leads (
            id, reference_code, contact_name, contact_phone, contact_email, residency, borrower_profile, goal,
            property_price_aed, down_payment_pct, monthly_income_aed, source_channel, source_page,
            partner_agency, partner_brn, is_swk_relay, consent_pdpl, status, assigned_to, notes, created_at, updated_at
          ) VALUES (?,?,?,?,?,'Expat resident','salaried','Resale Purchase (Secondary)',?,20,50000,'AI Bulk Converter','/shabibs-corner','','',1,1,'New',?,?,?,?)
        `).run(id, ref, name, rawPhone, '', price, req.user!.id, `AI converted from raw text (${community})`, now, now);
        imported.push({ id, code: ref, name, price, community });
      } else {
        const id = `VLT-AI-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
        const code = `BW-VLT-${Math.floor(100 + Math.random() * 899)}`;
        db.prepare(`
          INSERT INTO vault_leads (
            id, vault_code, client_name, raw_phone, masked_phone, community, project_unit, trigger_type,
            property_value_aed, target_loan_aed, primary_bank_key, assigned_to, assigned_name,
            vault_status, agent_notes, is_swk_source, updated_at
          ) VALUES (?,?,?,?,?,?,?,?,?,?,'emirates-nbd','','Unassigned','Ready to Dispatch','Imported via Confidential AI Converter',1,?)
        `).run(id, code, name, rawPhone, maskedPhone, community, parts[3] || 'AI Parsed Property', 'AI Bulk Import', price, Math.round(price * 0.8), now);
        imported.push({ id, code, name, price, community });
      }
    }

    logAudit(req.user!, target === 'leads' ? 'leads' : 'vault_leads', 'BULK', 'AI_BULK_IMPORT', `Converted ${imported.length} records`, target);
    res.status(201).json({ ok: true, count: imported.length, imported });
  });

  // ---------- 2. MY WORK & DAILY TASKS ----------
  apiRouter.get('/tasks', requireAuth, (req: AuthedRequest, res: Response) => {
    const scope = String(req.query.scope || 'all');
    const rows =
      scope === 'mine'
        ? db.prepare('SELECT * FROM tasks WHERE assignee_id = ? ORDER BY status ASC, due_date ASC').all(req.user!.id)
        : db.prepare('SELECT * FROM tasks ORDER BY status ASC, due_date ASC').all();
    res.json({ tasks: rows });
  });

  apiRouter.post('/tasks', requireAuth, (req: AuthedRequest, res: Response) => {
    const title = String(req.body?.title || '').trim();
    if (!title) {
      res.status(400).json({ error: 'Task title is required.' });
      return;
    }
    const id = `TSK-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const now = new Date().toISOString();
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dubai' }).format(new Date());
    db.prepare(
      'INSERT INTO tasks (id, title, assignee_id, assignee_name, case_code, priority, status, due_date, kind, created_at) VALUES (?,?,?,?,?,?,?,?,?,?)',
    ).run(
      id, title, String(req.body?.assignee_id || req.user!.id), String(req.body?.assignee_name || req.user!.name),
      String(req.body?.case_code || ''), String(req.body?.priority || 'High'), 'To do',
      String(req.body?.due_date || today), String(req.body?.kind || 'Follow-Up'), now,
    );
    bumpChangeFeed('tasks', id, 'CREATE');
    res.status(201).json({ id });
  });

  apiRouter.patch('/tasks/:id', requireAuth, (req: AuthedRequest, res: Response) => {
    const status = String(req.body?.status || 'Done');
    const now = new Date().toISOString();
    db.prepare('UPDATE tasks SET status = ?, completed_at = ? WHERE id = ?').run(status, status === 'Done' ? now : '', String(req.params.id));
    logAudit(req.user!, 'tasks', String(req.params.id), 'TASK_STATUS', status, '');
    res.json({ ok: true, status });
  });

  // ---------- 3. COMPANY SCHEDULE & DEADLINES CALENDAR ----------
  apiRouter.get('/calendar', requireAuth, (_req, res) => {
    res.json({ events: db.prepare('SELECT * FROM calendar_events ORDER BY dubai_date ASC, dubai_time ASC').all() });
  });

  apiRouter.post('/calendar', requireAuth, (req: AuthedRequest, res: Response) => {
    const title = String(req.body?.title || '').trim();
    if (!title) {
      res.status(400).json({ error: 'Event title is required.' });
      return;
    }
    const id = `CAL-EV-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
    const now = new Date().toISOString();
    db.prepare(
      'INSERT INTO calendar_events (id, title, event_type, dubai_date, dubai_time, location, case_code, owner_name, status, created_at) VALUES (?,?,?,?,?,?,?,?,?,?)',
    ).run(
      id, title, String(req.body?.event_type || 'Client Meeting'), String(req.body?.dubai_date || now.slice(0, 10)),
      String(req.body?.dubai_time || '11:00 AM'), String(req.body?.location || 'Al Nasr Plaza, Dubai'),
      String(req.body?.case_code || ''), req.user!.name, 'Scheduled', now,
    );
    bumpChangeFeed('calendar_events', id, 'CREATE');
    res.status(201).json({ id });
  });

  apiRouter.patch('/calendar/:id', requireAuth, (req: AuthedRequest, res: Response) => {
    const status = String(req.body?.status || 'Completed');
    db.prepare('UPDATE calendar_events SET status = ? WHERE id = ?').run(status, String(req.params.id));
    bumpChangeFeed('calendar_events', String(req.params.id), 'UPDATE');
    res.json({ ok: true });
  });

  // ---------- 4. CLIENT & LEAD VAULT + MY ASSIGNED CLIENTS (HARD-MASKED PRIVACY) ----------
  apiRouter.get('/vault/all', requireAuth, (req: AuthedRequest, res: Response) => {
    const rows = db.prepare('SELECT * FROM vault_leads ORDER BY updated_at DESC').all() as any[];
    // Strip raw_phone unless elevated (Owner / Executive / Admin / Team Manager)
    const safe = rows.map((r) => (req.user!.is_elevated ? r : { ...r, raw_phone: r.masked_phone }));
    res.json({ rows: safe, canDispatch: Boolean(req.user!.is_elevated) });
  });

  apiRouter.get('/vault/mine', requireAuth, (req: AuthedRequest, res: Response) => {
    const rows = (
      req.user!.is_elevated
        ? db.prepare("SELECT * FROM vault_leads WHERE assigned_to != '' ORDER BY updated_at DESC").all()
        : db.prepare('SELECT * FROM vault_leads WHERE assigned_to = ? ORDER BY updated_at DESC').all(req.user!.id)
    ) as any[];
    // Hard-masked view ALWAYS strips raw_phone so advisors contact clients exclusively via Masked Call / Masked WhatsApp
    res.json({ rows: rows.map((r) => ({ ...r, raw_phone: undefined })) });
  });

  apiRouter.post('/vault/dispatch', requireAuth, (req: AuthedRequest, res: Response) => {
    if (!req.user!.is_elevated) {
      res.status(403).json({ error: 'Only Owner, Executive Director, Admin, or Team Manager can dispatch Vault clients.' });
      return;
    }
    const { vaultId, assigneeId, assigneeName } = req.body || {};
    const now = new Date().toISOString();
    db.prepare("UPDATE vault_leads SET assigned_to = ?, assigned_name = ?, vault_status = 'Assigned', updated_at = ? WHERE id = ?").run(
      String(assigneeId), String(assigneeName || 'Advisor'), now, String(vaultId),
    );
    logAudit(req.user!, 'vault_leads', String(vaultId), 'VAULT_DISPATCH', `Dispatched to ${assigneeName}`, '');
    res.json({ ok: true });
  });

  apiRouter.post('/vault/:id/masked-action', requireAuth, (req: AuthedRequest, res: Response) => {
    const id = String(req.params.id);
    const kind = String(req.body?.kind || 'call'); // call | whatsapp
    const row = db.prepare('SELECT * FROM vault_leads WHERE id = ?').get(id) as any;
    if (!row) {
      res.status(404).json({ error: 'Vault record not found' });
      return;
    }
    const now = new Date().toISOString();
    if (kind === 'whatsapp') {
      db.prepare('UPDATE vault_leads SET wa_count = wa_count + 1, updated_at = ? WHERE id = ?').run(now, id);
      db.prepare('INSERT INTO client_messages (id, channel, recipient_name, recipient_contact, subject, body, case_code, sent_by, status, created_at) VALUES (?,?,?,?,?,?,?,?,?,?)').run(
        `CM-${crypto.randomBytes(2).toString('hex').toUpperCase()}`, 'WhatsApp', row.client_name, row.masked_phone,
        'Masked Vault Outreach', String(req.body?.message || `Hi ${row.client_name}, reaching out from Betterway Mortgages regarding ${row.project_unit}.`),
        row.vault_code, req.user!.name, 'Relayed (Masked)', now,
      );
    } else {
      db.prepare('UPDATE vault_leads SET calls_count = calls_count + 1, updated_at = ? WHERE id = ?').run(now, id);
      db.prepare('INSERT INTO call_logs (id, user_id, user_name, contact_name, masked_number, direction, duration_sec, outcome, notes, created_at) VALUES (?,?,?,?,?,?,?,?,?,?)').run(
        `CAL-${crypto.randomBytes(2).toString('hex').toUpperCase()}`, req.user!.id, req.user!.name, row.client_name,
        row.masked_phone, 'Outbound (Masked Bridge)', 95, 'Connected — Vault Outreach', String(req.body?.note || row.project_unit), now,
      );
    }
    logAudit(req.user!, 'vault_leads', id, kind === 'whatsapp' ? 'MASKED_WHATSAPP' : 'MASKED_CALL', 'Zero-leak outreach logged', row.masked_phone);
    res.json({ ok: true, masked_phone: row.masked_phone });
  });

  apiRouter.patch('/vault/:id/progress', requireAuth, (req: AuthedRequest, res: Response) => {
    const id = String(req.params.id);
    const now = new Date().toISOString();
    db.prepare('UPDATE vault_leads SET vault_status = ?, agent_notes = ?, updated_at = ? WHERE id = ?').run(
      String(req.body?.vault_status || 'In Progress'),
      String(req.body?.agent_notes || ''),
      now,
      id,
    );
    bumpChangeFeed('vault_leads', id, 'UPDATE');
    res.json({ ok: true });
  });

  // ---------- 5. FIELD DUTY GPS, LIVE TEAM MAP & SOS ----------
  apiRouter.get('/field-duty', requireAuth, (_req, res) => {
    res.json({ sessions: db.prepare('SELECT * FROM field_sessions ORDER BY started_at DESC LIMIT 40').all() });
  });

  apiRouter.post('/field-duty/start', requireAuth, (req: AuthedRequest, res: Response) => {
    const id = `FLD-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
    const now = new Date().toISOString();
    db.prepare(
      'INSERT INTO field_sessions (id, user_id, user_name, purpose, community, case_code, lat, lng, status, notes, started_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
    ).run(
      id, req.user!.id, req.user!.name, String(req.body?.purpose || 'Bank Branch Meeting'),
      String(req.body?.community || 'Downtown Dubai'), String(req.body?.case_code || ''),
      Number(req.body?.lat || 25.1972), Number(req.body?.lng || 55.2744),
      'Active', String(req.body?.notes || 'Live GPS visit started'), now,
    );
    logAudit(req.user!, 'field_sessions', id, 'FIELD_START', String(req.body?.purpose || ''), String(req.body?.community || ''));
    res.status(201).json({ id });
  });

  apiRouter.post('/field-duty/:id/action', requireAuth, (req: AuthedRequest, res: Response) => {
    const id = String(req.params.id);
    const act = String(req.body?.action || 'complete'); // complete | sos
    const now = new Date().toISOString();
    if (act === 'sos') {
      db.prepare("UPDATE field_sessions SET status = 'SOS' WHERE id = ?").run(id);
      db.prepare('INSERT INTO notifications (id, user_id, title, body, link, severity, created_at) VALUES (?,?,?,?,?,?,?)').run(
        `NTF-SOS-${crypto.randomBytes(2).toString('hex')}`, 'USR-01', `🚨 FIELD SOS ALERT: ${req.user!.name}`,
        `Emergency assistance requested during field visit ${id}. Check Live Team Map immediately.`, '/field-duty', 'warning', now,
      );
      logAudit(req.user!, 'field_sessions', id, 'FIELD_SOS', 'Emergency SOS triggered', '');
    } else {
      db.prepare("UPDATE field_sessions SET status = 'Completed', ended_at = ? WHERE id = ?").run(now, id);
      logAudit(req.user!, 'field_sessions', id, 'FIELD_COMPLETE', 'Field visit completed', '');
    }
    res.json({ ok: true });
  });

  // ---------- 6. BETTERWAY WORD & LETTER STUDIO + SEAL GOVERNANCE ----------
  apiRouter.get('/word-studio', requireAuth, (_req, res) => {
    res.json({ documents: db.prepare('SELECT * FROM word_documents ORDER BY updated_at DESC').all() });
  });

  apiRouter.post('/word-studio', requireAuth, (req: AuthedRequest, res: Response) => {
    const title = String(req.body?.title || 'Betterway Official Letter').trim();
    const id = `DOC-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
    const now = new Date().toISOString();
    db.prepare(
      'INSERT INTO word_documents (id, title, template_code, body_html, include_letterhead, seal_status, case_code, created_by, updated_at) VALUES (?,?,?,?,?,?,?,?,?)',
    ).run(
      id, title, String(req.body?.template_code || 'CUSTOM'), String(req.body?.body_html || '<p>Draft letter content…</p>'),
      req.body?.include_letterhead === false ? 0 : 1,
      req.body?.request_seal ? 'Pending Owner Seal' : 'None',
      String(req.body?.case_code || ''), req.user!.name, now,
    );
    logAudit(req.user!, 'word_documents', id, 'DOC_SAVED', title, '');
    res.status(201).json({ id });
  });

  apiRouter.post('/word-studio/:id/seal', requireAuth, requireOwner, (req: AuthedRequest, res: Response) => {
    const id = String(req.params.id);
    const now = new Date().toISOString();
    db.prepare("UPDATE word_documents SET seal_status = ?, sealed_by = ?, updated_at = ? WHERE id = ?").run(
      `Sealed by ${req.user!.name}`, req.user!.name, now, id,
    );
    logAudit(req.user!, 'word_documents', id, 'OWNER_SEAL_STAMPED', 'Official corporate seal applied', '');
    res.json({ ok: true });
  });

  // ---------- 7. WHATSAPP & EMAIL CLIENT COMMUNICATIONS HUB ----------
  apiRouter.get('/communications', requireAuth, (_req, res) => {
    res.json({ messages: db.prepare('SELECT * FROM client_messages ORDER BY created_at DESC LIMIT 50').all() });
  });

  apiRouter.post('/communications', requireAuth, (req: AuthedRequest, res: Response) => {
    const b = req.body || {};
    if (!b.recipient_name || !b.body) {
      res.status(400).json({ error: 'Recipient and message body are required.' });
      return;
    }
    const id = `CM-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
    const now = new Date().toISOString();
    db.prepare(
      'INSERT INTO client_messages (id, channel, recipient_name, recipient_contact, subject, body, case_code, sent_by, status, created_at) VALUES (?,?,?,?,?,?,?,?,?,?)',
    ).run(
      id, String(b.channel || 'WhatsApp'), String(b.recipient_name), String(b.recipient_contact || ''),
      String(b.subject || ''), String(b.body), String(b.case_code || ''), req.user!.name, 'Sent', now,
    );
    logAudit(req.user!, 'client_messages', id, 'CLIENT_MESSAGE_SENT', String(b.channel || 'WhatsApp'), String(b.recipient_name));
    res.status(201).json({ id });
  });

  // ---------- 8. UTILITIES: 9-LANGUAGE TRANSLATOR, OCR READER & UNIFIED SEARCH ----------
  apiRouter.post('/utilities/translate', requireAuth, (req: AuthedRequest, res: Response) => {
    const text = String(req.body?.text || '').trim();
    const lang = String(req.body?.target_lang || 'ar').toLowerCase();
    const map = TRANSLATION_GLOSSARY[lang] || TRANSLATION_GLOSSARY.ar!;
    let translated = text;
    const matchedTerms: string[] = [];
    for (const [en, loc] of Object.entries(map)) {
      const rx = new RegExp(en.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      if (rx.test(translated)) {
        matchedTerms.push(`${en} → ${loc}`);
        translated = translated.replace(rx, loc);
      }
    }
    const langLabels: Record<string, string> = {
      ar: 'Arabic (العربية)', hi: 'Hindi (हिन्दी)', ur: 'Urdu (اردو)', ru: 'Russian (Русский)',
      fr: 'French (Français)', zh: 'Chinese (中文)', tl: 'Tagalog', ml: 'Malayalam (മലയാളം)',
    };
    const header = `[Betterway Glossary-Locked Translation · ${langLabels[lang] || lang.toUpperCase()}]`;
    res.json({
      translated: `${header}\n\n${translated}\n\n— Betterway Mortgages LLC (Zero Broker Fee · 24 UAE Banks)`,
      glossaryLocked: matchedTerms,
    });
  });

  apiRouter.post('/utilities/ocr-parse', requireAuth, (req: AuthedRequest, res: Response) => {
    const raw = String(req.body?.text || '');
    const eid = raw.match(/784-\d{4}-\d{7}-\d/)?.[0] || 'Not detected';
    const passport = raw.match(/\b[A-Z]\d{7,8}\b/)?.[0] || 'Not detected';
    const aedAmounts = raw.match(/(?:AED|DHS)\s*[\d,]+/gi) || [];
    const phone = raw.match(/\+971[\s-]?\d{2}[\s-]?\d{3}[\s-]?\d{4}/)?.[0] || 'Not detected';
    const email = raw.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)?.[0] || 'Not detected';
    res.json({
      extracted: {
        emiratesId: eid,
        passportNumber: passport,
        detectedAedFigures: aedAmounts.slice(0, 5),
        uaePhone: phone,
        email,
        wordCount: raw.trim() ? raw.trim().split(/\s+/).length : 0,
      },
    });
  });

  apiRouter.get('/utilities/search', requireAuth, (req: AuthedRequest, res: Response) => {
    const q = String(req.query.q || '').trim().toLowerCase();
    if (!q) {
      res.json({ cases: [], leads: [], banks: [], communities: [], excelSpecs: [] });
      return;
    }
    const cases = (db.prepare('SELECT id, case_code, borrower_name, project_name, community, requested_loan_aed, stage_code FROM mortgage_cases WHERE deleted_soft = 0').all() as any[])
      .filter((c) => JSON.stringify(c).toLowerCase().includes(q))
      .slice(0, 8);
    const leads = (db.prepare('SELECT id, reference_code, contact_name, goal, property_price_aed, status FROM leads').all() as any[])
      .filter((l) => JSON.stringify(l).toLowerCase().includes(q))
      .slice(0, 8);
    const banks = UAE_BANKS.filter((b) => `${b.name} ${b.short} ${b.type} ${b.hq}`.toLowerCase().includes(q)).slice(0, 8);
    const communities = UAE_COMMUNITIES.filter((c) => `${c.name} ${c.devs} ${c.emirate}`.toLowerCase().includes(q)).slice(0, 8);
    const excelSpecs = EXCEL_SPECS.filter((s) => `${s.filename} ${s.owner} ${s.columns.join(' ')}`.toLowerCase().includes(q)).slice(0, 8);
    res.json({ cases, leads, banks, communities, excelSpecs });
  });

  // ---------- 9. HR, VISAS, LEAVE & WPS PAYROLL ----------
  apiRouter.get('/hr', requireAuth, (_req, res) => {
    res.json({
      compliance: db.prepare('SELECT * FROM hr_staff_compliance ORDER BY user_id').all(),
      leaves: db.prepare('SELECT * FROM hr_leave_requests ORDER BY created_at DESC').all(),
    });
  });

  apiRouter.post('/hr/leaves', requireAuth, (req: AuthedRequest, res: Response) => {
    const id = `LV-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
    const now = new Date().toISOString();
    db.prepare(
      'INSERT INTO hr_leave_requests (id, user_id, user_name, leave_type, from_date, to_date, days, reason, status, created_at) VALUES (?,?,?,?,?,?,?,?,?,?)',
    ).run(
      id, req.user!.id, req.user!.name, String(req.body?.leave_type || 'Annual Leave'),
      String(req.body?.from_date || now.slice(0, 10)), String(req.body?.to_date || now.slice(0, 10)),
      Number(req.body?.days || 1), String(req.body?.reason || 'Personal leave request'), 'Pending', now,
    );
    bumpChangeFeed('hr_leave_requests', id, 'CREATE');
    res.status(201).json({ id });
  });

  apiRouter.post('/hr/leaves/:id/decide', requireAuth, (req: AuthedRequest, res: Response) => {
    if (!req.user!.is_elevated && req.user!.role !== 'HR_MANAGER') {
      res.status(403).json({ error: 'Only Owner, Executive Director, or HR Manager can approve leave.' });
      return;
    }
    const status = req.body?.decision === 'Approved' ? 'Approved' : 'Rejected';
    db.prepare('UPDATE hr_leave_requests SET status = ?, decided_by = ? WHERE id = ?').run(status, req.user!.name, String(req.params.id));
    logAudit(req.user!, 'hr_leave_requests', String(req.params.id), 'LEAVE_DECISION', status, '');
    res.json({ ok: true, status });
  });

  // ---------- 10. WEBSITE STUDIO (betterwaymortgages.com CONTROL PANEL) ----------
  apiRouter.get('/website-studio', requireAuth, (_req, res) => {
    res.json({ offers: db.prepare('SELECT * FROM website_offers ORDER BY id').all() });
  });

  apiRouter.patch('/website-studio/:id', requireAuth, (req: AuthedRequest, res: Response) => {
    const id = String(req.params.id);
    const now = new Date().toISOString();
    if (req.body?.published !== undefined) {
      db.prepare('UPDATE website_offers SET published = ?, updated_at = ? WHERE id = ?').run(req.body.published ? 1 : 0, now, id);
    }
    if (req.body?.spotlight !== undefined) {
      db.prepare('UPDATE website_offers SET spotlight = ?, updated_at = ? WHERE id = ?').run(req.body.spotlight ? 1 : 0, now, id);
    }
    logAudit(req.user!, 'website_offers', id, 'WEBSITE_SYNC', 'Updated betterwaymortgages.com live offer', '');
    res.json({ ok: true });
  });
}
