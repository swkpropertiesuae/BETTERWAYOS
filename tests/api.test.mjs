import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const PORT = 18089;
const BASE = `http://127.0.0.1:${PORT}`;
const TMP_DB = path.join(os.tmpdir(), `betterway-os-test-${Date.now()}.sqlite`);

let serverProc;

async function waitForServer() {
  for (let i = 0; i < 40; i++) {
    try {
      const r = await fetch(`${BASE}/api/health`);
      if (r.ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error('Betterway OS server did not become ready in time');
}

test.before(async () => {
  serverProc = spawn(process.execPath, ['node_modules/tsx/dist/cli.mjs', 'src/server/index.ts'], {
    cwd: process.cwd(),
    env: { ...process.env, PORT: String(PORT), BETTERWAY_DB_PATH: TMP_DB },
    stdio: 'pipe',
  });
  await waitForServer();
});

test.after(() => {
  serverProc?.kill();
  for (const suffix of ['', '-shm', '-wal']) {
    try { fs.unlinkSync(TMP_DB + suffix); } catch {}
  }
});

test('1. Health & Public Benchmarks return all 24 banks, 60 communities & 50 Excel specs', async () => {
  const res = await fetch(`${BASE}/api/health`);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.ok, true);
  assert.equal(body.banksCount, 24);
  assert.equal(body.communitiesCount, 60);
  assert.equal(body.excelSpecsCount, 50);
  assert.ok(body.eibor3m > 3 && body.eibor3m < 7);
});

test('2. Website Interconnect (/api/v1/intake/leads) creates & deduplicates leads', async () => {
  const payload = {
    contactName: 'Tariq Test Buyer',
    contactPhone: '+971 50 999 8877',
    contactEmail: 'tariq.test@dubai.ae',
    propertyPriceAed: 3_000_000,
    monthlyIncomeAed: 62_000,
    sourcePage: '/calculators/mortgage-calculator',
  };
  const r1 = await fetch(`${BASE}/api/v1/intake/leads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  assert.equal(r1.status, 201);
  const d1 = await r1.json();
  assert.equal(d1.syncedToOs, true);
  assert.ok(d1.referenceCode.startsWith('BW-ENQ-'));

  const r2 = await fetch(`${BASE}/api/v1/intake/leads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  assert.equal(r2.status, 200);
  const d2 = await r2.json();
  assert.equal(d2.deduplicated, true);
  assert.equal(d2.referenceCode, d1.referenceCode);
});

test('3. CBUAE Deterministic Calculator & 15-Year Underwriting Policy Evaluator', async () => {
  const r = await fetch(`${BASE}/api/calculators/evaluate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      profile: 'self_employed_low_doc',
      propertyPriceAed: 2_500_000,
      downPaymentPct: 40,
      monthlyIncomeAed: 55_000,
      existingEmisAed: 2_000,
      cardLimitsAed: 20_000,
      age: 40,
      tenureYears: 25,
    }),
  });
  assert.equal(r.status, 200);
  const d = await r.json();
  assert.equal(d.policy.verdict, 'ELIGIBLE');
  assert.ok(d.policy.projectedDbrPct <= 50);
  assert.equal(d.goldenVisa.eligible, true);
  assert.ok(d.cash.total > 1_100_000);
});

test('4. Auth, Zero-Personal-Account Guard, Mandatory Reason & Owner Pending Delete Bin', async () => {
  // Login as Advisor (non-Owner)
  const loginAdv = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'asif@betterwaymortgages.com', password: 'Betterway@2026' }),
  });
  assert.equal(loginAdv.status, 200);
  const { token: advToken } = await loginAdv.json();
  const advHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${advToken}` };

  // Zero-Personal-Account Guard must return 400
  const badPay = await fetch(`${BASE}/api/finance/entries`, {
    method: 'POST',
    headers: advHeaders,
    body: JSON.stringify({
      case_code: 'BW-2026-M01',
      borrower_name: 'Test',
      bank_key: 'emirates-nbd',
      loan_disbursed_aed: 2_000_000,
      payment_channel: 'Advisor Personal Account',
    }),
  });
  assert.equal(badPay.status, 400);

  // Mandatory reason on case update
  const badPatch = await fetch(`${BASE}/api/cases/CASE-01`, {
    method: 'PATCH',
    headers: advHeaders,
    body: JSON.stringify({ stage_code: '07_VALUATION', reason: '' }),
  });
  assert.equal(badPatch.status, 400);

  // Non-Owner delete routes to Pending Owner Delete Bin (202)
  const delReq = await fetch(`${BASE}/api/cases/CASE-12`, {
    method: 'DELETE',
    headers: advHeaders,
    body: JSON.stringify({ reason: 'Duplicate entry verified with borrower' }),
  });
  assert.equal(delReq.status, 202);
  const delBody = await delReq.json();
  assert.equal(delBody.mode, 'queued_for_owner_approval');

  // Check-out blocked before Daily Close Report
  const badOut = await fetch(`${BASE}/api/attendance/checkout`, { method: 'POST', headers: advHeaders });
  assert.equal(badOut.status, 400);

  // Submit Daily Close Report (>= 30 chars each) -> Check-out succeeds
  const dly = await fetch(`${BASE}/api/daily/report`, {
    method: 'POST',
    headers: advHeaders,
    body: JSON.stringify({
      summary_today: 'Completed 14 borrower calls, submitted 2 parallel bank packs to ENBD and DIB.',
      plan_tomorrow: 'Follow up on Azizi Riviera valuation report and schedule DLD Trustee transfer.',
      calls_made: 14,
      cases_submitted: 2,
    }),
  });
  assert.equal(dly.status, 201);

  const goodOut = await fetch(`${BASE}/api/attendance/checkout`, { method: 'POST', headers: advHeaders });
  assert.equal(goodOut.status, 201);

  // Excel Spec Export streams valid UTF-8 CSV
  const exp = await fetch(`${BASE}/api/data-hub/export/01`, { headers: advHeaders });
  assert.equal(exp.status, 200);
  const csv = await exp.text();
  assert.ok(csv.includes('Emirates NBD'));
  assert.ok(csv.includes('Dubai Islamic Bank'));

  // Mobile App PWA & Real-Time Sync Feed
  const sync = await fetch(`${BASE}/api/sync/changes?since=0`, { headers: advHeaders });
  assert.equal(sync.status, 200);
  const syncData = await sync.json();
  assert.ok(syncData.latestSeq > 0);

  const mob = await fetch(`${BASE}/mobile/`);
  assert.equal(mob.status, 200);
  const mobHtml = await mob.text();
  assert.ok(mobHtml.includes('Betterway Mobile'));
});

test('5. SWKOS v3.9.0 Parity Engines (Shabib Corner, Hard-Masked Vault, Tasks, Field GPS, Word Seal, Utilities, HR, Website)', async () => {
  // Login as Owner (Shabib)
  const loginOwner = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'shabib@betterwaymortgages.com', password: 'Betterway@2026' }),
  });
  assert.equal(loginOwner.status, 200);
  const { token: ownerToken } = await loginOwner.json();
  const ownerHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${ownerToken}` };

  // Login as Advisor (Asif)
  const loginAdv = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'asif@betterwaymortgages.com', password: 'Betterway@2026' }),
  });
  const { token: advToken } = await loginAdv.json();
  const advHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${advToken}` };

  // 5a. Shabib's Corner Overview + AI Bulk Lead Importer
  const corner = await (await fetch(`${BASE}/api/shabibs-corner/overview`, { headers: ownerHeaders })).json();
  assert.equal(corner.stages.length, 12);
  assert.ok(corner.owner.canOverride);

  const aiImp = await fetch(`${BASE}/api/shabibs-corner/ai-import`, {
    method: 'POST',
    headers: ownerHeaders,
    body: JSON.stringify({
      raw_text: 'Rashid Al Mansoori, +971 50 777 1234, Dubai Hills Estate, Sidra Villa 12, 4200000',
      target: 'vault',
    }),
  });
  assert.equal(aiImp.status, 201);
  const aiImpData = await aiImp.json();
  assert.equal(aiImpData.count, 1);

  // 5b. Hard-Masked Vault privacy check (BOTH Owner & Advisor MUST succeed with 200 and strip raw_phone in /api/vault/mine)
  for (const hdrs of [ownerHeaders, advHeaders]) {
    const mvRes = await fetch(`${BASE}/api/vault/mine`, { headers: hdrs });
    assert.equal(mvRes.status, 200);
    const myVault = await mvRes.json();
    assert.ok(Array.isArray(myVault.rows) && myVault.rows.length > 0);
    for (const row of myVault.rows) {
      assert.equal(row.raw_phone, undefined);
      assert.ok(row.masked_phone);
    }
  }

  // 5c. My Work Tasks CRUD
  const tCreate = await fetch(`${BASE}/api/tasks`, {
    method: 'POST',
    headers: advHeaders,
    body: JSON.stringify({ title: 'Follow up ENBD FOL signature', priority: 'Urgent', case_code: 'BW-2026-M03' }),
  });
  assert.equal(tCreate.status, 201);
  const { id: taskId } = await tCreate.json();
  const tPatch = await fetch(`${BASE}/api/tasks/${taskId}`, {
    method: 'PATCH',
    headers: advHeaders,
    body: JSON.stringify({ status: 'Done' }),
  });
  assert.equal(tPatch.status, 200);

  // 5d. Field Duty GPS Start -> Complete
  const fStart = await fetch(`${BASE}/api/field-duty/start`, {
    method: 'POST',
    headers: advHeaders,
    body: JSON.stringify({ purpose: 'DLD Trustee Transfer', community: 'Business Bay', lat: 25.185, lng: 55.262 }),
  });
  assert.equal(fStart.status, 201);
  const { id: fldId } = await fStart.json();
  const fDone = await fetch(`${BASE}/api/field-duty/${fldId}/action`, {
    method: 'POST',
    headers: advHeaders,
    body: JSON.stringify({ action: 'complete' }),
  });
  assert.equal(fDone.status, 200);

  // 5e. Word Studio Document + Owner Corporate Seal
  const dCreate = await fetch(`${BASE}/api/word-studio`, {
    method: 'POST',
    headers: advHeaders,
    body: JSON.stringify({ title: 'Zero-Fee Advisory Letter', template_code: 'ZERO_FEE', request_seal: true }),
  });
  assert.equal(dCreate.status, 201);
  const { id: docId } = await dCreate.json();
  const dSeal = await fetch(`${BASE}/api/word-studio/${docId}/seal`, { method: 'POST', headers: ownerHeaders });
  assert.equal(dSeal.status, 200);

  // 5f. Utilities: 9-Language Translator, OCR Parser & Unified Global Search
  const tr = await (
    await fetch(`${BASE}/api/utilities/translate`, {
      method: 'POST',
      headers: advHeaders,
      body: JSON.stringify({ text: 'Your Pre-Approval for Mortgage has Zero Broker Fee.', target_lang: 'ar' }),
    })
  ).json();
  assert.ok(tr.translated.includes('الموافقة المبدئية'));

  const ocr = await (
    await fetch(`${BASE}/api/utilities/ocr-parse`, {
      method: 'POST',
      headers: advHeaders,
      body: JSON.stringify({ text: 'Emirates ID 784-1988-1234567-1 Salary AED 52,000 +971 50 555 4321' }),
    })
  ).json();
  assert.equal(ocr.extracted.emiratesId, '784-1988-1234567-1');

  const srch = await (await fetch(`${BASE}/api/utilities/search?q=emirates`, { headers: advHeaders })).json();
  assert.ok(srch.banks.length > 0);

  // 5g. HR & Website Studio
  const hr = await (await fetch(`${BASE}/api/hr`, { headers: ownerHeaders })).json();
  assert.ok(hr.compliance.length >= 6);
  const web = await (await fetch(`${BASE}/api/website-studio`, { headers: ownerHeaders })).json();
  assert.ok(web.offers.length >= 3);
});
