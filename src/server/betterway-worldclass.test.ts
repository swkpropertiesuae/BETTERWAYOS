import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { createInMemoryDb } from '@/server/db';
import { ensureCommercialProductionReady, OFFICIAL_BETTERWAY_STAFF } from '@/server/db/seed';
import {
  canPrintReceptionQr,
  generateReceptionStandQrSvg,
  verifyAndRecordPublicQrCheckIn,
  ingestWebsiteLeadToOs,
  updateOfficeWifiLock,
  getOfficeWifiConfig,
} from '@/server/engines/swk-enterprise-engine';
import {
  checkAccountLockout,
  recordFailedLoginAttempt,
  clearFailedLogins,
  MAX_FAILED_LOGINS,
} from '@/server/auth';
import { statutoryMaxLtvBps } from '@/server/engines/underwriting-engine';
import { resolveDataDir } from '@/server/db/data-dir';
import {
  OFFICIAL_STAFF_DIRECTORY,
  getStaffAvatarUrl,
  getStaffProfileByNameOrEmail,
} from '@/lib/staff-directory';
import { computeToolkitAll } from '@/lib/uae-deal-toolkit';

test('BW-1: Official Betterway Mortgages LLC roster seeds 9 exact accounts with studio avatars for the 6 staff and clean Warda profile', () => {
  const db = createInMemoryDb({ seed: true });
  ensureCommercialProductionReady(db);

  const users = db
    .prepare('SELECT email, full_name_en, role, avatar_url, status FROM users ORDER BY id ASC')
    .all() as Array<{
    email: string;
    full_name_en: string;
    role: string;
    avatar_url: string | null;
    status: string;
  }>;

  const emails = users.map((u) => u.email);
  assert.deepEqual(emails, [
    'shabib@betterwaymortgages.com',
    'warda@betterwaymortgages.com',
    'admin@betterwaymortgages.com',
    'daniel@betterwaymortgages.com',
    'rahaba@betterwaymortgages.com',
    'nusrik@betterwaymortgages.com',
    'elton@betterwaymortgages.com',
    'reshma@betterwaymortgages.com',
    'asif@betterwaymortgages.com',
  ]);

  // Verify Warda is named strictly "Warda" with zero mention of "wife" anywhere in users or employees
  const wardaUser = users.find((u) => u.email === 'warda@betterwaymortgages.com')!;
  assert.equal(wardaUser.full_name_en, 'Warda');
  const wardaEmp = db
    .prepare('SELECT full_name, designation, department FROM employees WHERE full_name = ?')
    .get('Warda') as { full_name: string; designation: string; department: string };
  assert.ok(wardaEmp);
  assert.doesNotMatch(
    `${wardaEmp.full_name} ${wardaEmp.designation} ${wardaEmp.department}`,
    /wife/i,
  );

  // Verify all 6 photographed staff have studio avatar URLs and the image files exist on disk in public/staff/
  const expectedAvatars: Record<string, string> = {
    'daniel@betterwaymortgages.com': '/staff/daniel-xavier.jpg',
    'rahaba@betterwaymortgages.com': '/staff/rahaba-azeez.jpg',
    'nusrik@betterwaymortgages.com': '/staff/mohammad-nusrik.jpg',
    'elton@betterwaymortgages.com': '/staff/elton-frank.jpg',
    'reshma@betterwaymortgages.com': '/staff/reshma-rajan.jpg',
    'asif@betterwaymortgages.com': '/staff/asif-khan.jpg',
  };

  for (const [email, avatarPath] of Object.entries(expectedAvatars)) {
    const u = users.find((x) => x.email === email)!;
    assert.equal(u.avatar_url, avatarPath);
    assert.equal(getStaffAvatarUrl(email), avatarPath);
    assert.equal(getStaffAvatarUrl(u.full_name_en), avatarPath);
    const diskPath = path.resolve(process.cwd(), 'public', avatarPath.replace(/^\//, ''));
    assert.equal(existsSync(diskPath), true, `Missing studio portrait on disk: ${diskPath}`);
  }

  // Verify exact designations requested by user
  const empByEmail = new Map(
    (
      db
        .prepare(
          `SELECT u.email, e.designation, e.department
           FROM employees e JOIN users u ON u.id = e.user_id`,
        )
        .all() as Array<{ email: string; designation: string; department: string }>
    ).map((r) => [r.email, r]),
  );

  assert.match(empByEmail.get('daniel@betterwaymortgages.com')!.designation, /Team Manager.*Mortgage Advisor/i);
  assert.match(empByEmail.get('rahaba@betterwaymortgages.com')!.designation, /HR/i);
  assert.match(empByEmail.get('nusrik@betterwaymortgages.com')!.designation, /Digital Marketing/i);
  assert.match(empByEmail.get('elton@betterwaymortgages.com')!.designation, /Coordinator/i);
  assert.match(empByEmail.get('reshma@betterwaymortgages.com')!.designation, /Telesales.*Mortgage Advisor/i);
  assert.match(empByEmail.get('asif@betterwaymortgages.com')!.designation, /Mortgage Advisor/i);
  assert.equal(OFFICIAL_BETTERWAY_STAFF.length, 9);
  assert.equal(OFFICIAL_STAFF_DIRECTORY.length, 9);
  assert.ok(getStaffProfileByNameOrEmail('Daniel Xavier'));
});

test('BW-2: Reception QR generation, Wi-Fi/Cellular anti-loophole verification, and print guard for Owner Shabib, Warda, Admin & Manager Daniel Xavier', () => {
  const db = createInMemoryDb({ seed: true });
  ensureCommercialProductionReady(db);

  const shabib = db.prepare("SELECT * FROM users WHERE email = 'shabib@betterwaymortgages.com'").get() as any;
  const warda = db.prepare("SELECT * FROM users WHERE email = 'warda@betterwaymortgages.com'").get() as any;
  const daniel = db.prepare("SELECT * FROM users WHERE email = 'daniel@betterwaymortgages.com'").get() as any;
  const asif = db.prepare("SELECT * FROM users WHERE email = 'asif@betterwaymortgages.com'").get() as any;

  assert.equal(canPrintReceptionQr(shabib), true);
  assert.equal(canPrintReceptionQr(warda), true);
  assert.equal(canPrintReceptionQr(daniel), true);
  assert.equal(canPrintReceptionQr(asif), false);

  const qrSvg = generateReceptionStandQrSvg('https://os.betterwaymortgages.com/os/reception-qr?scan=1&stand=BW-RECEPTION-STAND-DXB-1');
  assert.match(qrSvg, /<svg[\s\S]*viewBox=/);
  assert.match(qrSvg, /<rect|<path/);

  // Reject cellular data check-in (anti-loophole rule matching SWK)
  assert.throws(
    () =>
      verifyAndRecordPublicQrCheckIn(db, {
        email: 'asif@betterwaymortgages.com',
        password: 'Betterway#2026',
        connectionType: 'cellular',
        networkSsid: 'Betterway-Office-5G',
        qrStandCode: 'BW-RECEPTION-STAND-DXB-1',
        deviceId: 'BW-WEB-TEST1',
      }),
    /Office Wi-Fi/i,
  );

  // Accept valid Office Wi-Fi check-in with credentials
  const checkIn = verifyAndRecordPublicQrCheckIn(db, {
    email: 'asif@betterwaymortgages.com',
    password: 'Betterway#2026',
    connectionType: 'wifi',
    networkSsid: 'Betterway-Office-5G',
    qrStandCode: 'BW-RECEPTION-STAND-DXB-1',
    deviceId: 'BW-WEB-TEST1',
    checkInDate: '2026-11-18',
    checkInTimeGst: '09:56',
  });
  assert.equal(checkIn.status, 'ON_TIME');
  assert.equal(checkIn.employee.fullNameEn, 'Asif Khan');
  assert.equal(checkIn.employee.avatarUrl, '/staff/asif-khan.jpg');
});

test('BW-3: SWK-grade 8-tool UAE Deal & Mortgage Toolkit computes accurate figures and WhatsApp summaries', () => {
  const res = computeToolkitAll({
    priceAed: 3_000_000,
    downPaymentPct: 20,
    interestRatePct: 3.99,
    tenureYears: 25,
    monthlyIncomeAed: 50_000,
    existingDebtAed: 2_000,
    cardLimitsAed: 40_000,
    residency: 'expat',
    firstHome: true,
    offPlan: false,
    currentLoanBalanceAed: 2_000_000,
    currentRatePct: 5.49,
    newRatePct: 3.89,
    remainingYears: 20,
    annualRentAed: 210_000,
    areaSqft: 1_400,
    serviceChargePerSqft: 18,
    reraIndexAvgAed: 240_000,
    jointOwners: 1,
    grossSubventionAed: 30_000,
    partnerSharePct: 25,
    advisorSplitPct: 50,
    bookingPct: 20,
    constructionPct: 40,
    handoverPct: 40,
    postHandoverPct: 0,
  });

  assert.ok(res.costToClose.cashRequired > 600_000);
  assert.ok(res.mortgage.emi > 10_000);
  assert.equal(res.mortgage.dbrOk, true);
  assert.equal(res.buyout.earlySettlementFeeAed, 10_500); // AED 10,000 cap + 5% VAT
  assert.ok(res.buyout.netFiveYearSavingsAed > 50_000);
  assert.equal(res.visa.goldenVisaEligible, true);
  assert.equal(res.commission.partnerPayoutAed, 7_500);
  assert.equal(res.commission.netPoolAed, 22_500);
  assert.equal(res.commission.advisorPayoutAed, 11_250);
  assert.ok(res.yieldRera.netYieldPct > 4);
  assert.equal(res.offPlan.oqoodFeeAed, 120_000);
  assert.match(res.summaries.mortgage, /Betterway Mortgages/i);
});

test('BW-4: Website-to-OS interconnection ingests public enquiries, calculator scenarios, slot bookings & partner signups into CRM', () => {
  const db = createInMemoryDb({ seed: true });
  ensureCommercialProductionReady(db);

  const out = ingestWebsiteLeadToOs(db, {
    fullName: 'Omar Al Falasi',
    phone: '+971509876543',
    email: 'omar.falasi@example.ae',
    residency: 'UAE National',
    goal: 'Buy a ready home',
    propertyValueAed: 4_200_000,
    downPaymentPct: 15,
    monthlyIncomeAed: 65_000,
    topic: 'Calculator scenario: Monthly Repayment & DBR',
    preferredSlot: 'Tomorrow 11:00 AM GST',
    sourcePage: '/calculators/mortgage-repayment',
  });

  assert.match(out.referenceCode, /^BW-ENQ-/);
  assert.ok(out.leadId > 0);
  assert.ok(
    ['Daniel Xavier', 'Reshma Rajan', 'Asif Khan'].includes(out.assignedAdvisor.fullNameEn),
  );
  assert.ok(out.assignedAdvisor.avatarUrl.startsWith('/staff/'));
});

test('BW-5: 8K UHD portrait suite exists on disk for all 6 photographed staff and real ISO/IEC 18004 QR SVG renders crisp paths', () => {
  const slugs = [
    'daniel-xavier',
    'rahaba-azeez',
    'mohammad-nusrik',
    'elton-frank',
    'reshma-rajan',
    'asif-khan',
  ];

  for (const slug of slugs) {
    const files = [
      `public/staff/${slug}.jpg`,
      `public/staff/${slug}.webp`,
      `public/staff/${slug}-portrait.webp`,
      `public/staff/${slug}-portrait-1080.webp`,
      `public/staff/8k/${slug}-8k.webp`,
    ];
    for (const rel of files) {
      const full = path.resolve(process.cwd(), rel);
      assert.equal(existsSync(full), true, `Missing remastered staff portrait asset: ${rel}`);
    }
  }

  const svg = generateReceptionStandQrSvg('https://os.betterwaymortgages.com/os/reception-qr?scan=1&stand=BW-RECEPTION-STAND-DXB-1');
  assert.match(svg, /shape-rendering="crispEdges"/);
  assert.match(svg, /<path d="M/);
  assert.ok(svg.length > 800, 'Expected full ISO/IEC 18004 QR path data');
});

test('BW-6: SWKOS security parity — 5-fail account lockout, Office Wi-Fi IP lock, CBUAE 2nd-home LTV cap, and serverless data-dir', () => {
  const db = createInMemoryDb({ seed: true });
  ensureCommercialProductionReady(db);

  const shabib = db.prepare("SELECT * FROM users WHERE email = 'shabib@betterwaymortgages.com'").get() as any;
  const asif = db.prepare("SELECT * FROM users WHERE email = 'asif@betterwaymortgages.com'").get() as any;

  // 1. Account lockout after 5 failed attempts
  for (let i = 1; i < MAX_FAILED_LOGINS; i++) {
    const res = recordFailedLoginAttempt(db, asif.id);
    assert.equal(res.locked, false);
  }
  const fifth = recordFailedLoginAttempt(db, asif.id);
  assert.equal(fifth.locked, true);
  assert.equal(checkAccountLockout(db, asif.id).locked, true);
  clearFailedLogins(db, asif.id);
  assert.equal(checkAccountLockout(db, asif.id).locked, false);

  // 2. Office Wi-Fi IP Lock (Owner Shabib Siraj locks office IP; non-owner blocked)
  assert.throws(
    () => updateOfficeWifiLock(db, asif, { officeIp: '94.200.10.25', strictIpLock: true }),
    /Only Owner/i,
  );
  const lockedCfg = updateOfficeWifiLock(db, shabib, {
    ssid: 'Betterway-Office-5G',
    officeIp: '94.200.10.25',
    strictIpLock: true,
  });
  assert.equal(lockedCfg.strictIpLock, true);
  assert.equal(getOfficeWifiConfig(db).officeIp, '94.200.10.25');

  // Mismatched IP is blocked
  assert.throws(
    () =>
      verifyAndRecordPublicQrCheckIn(db, {
        email: 'asif@betterwaymortgages.com',
        password: 'Betterway#2026',
        connectionType: 'wifi',
        clientIp: '185.12.44.9',
      }),
    /IP Lock active/i,
  );

  // Matching Office IP succeeds
  const okCheckIn = verifyAndRecordPublicQrCheckIn(db, {
    email: 'asif@betterwaymortgages.com',
    password: 'Betterway#2026',
    connectionType: 'wifi',
    clientIp: '94.200.10.25',
    checkInDate: '2026-11-23',
    checkInTimeGst: '09:55',
  });
  assert.equal(okCheckIn.status, 'ON_TIME');

  // 3. CBUAE 2nd-home LTV cap: 65% UAE National vs 60% Expat Resident
  assert.equal(
    statutoryMaxLtvBps({
      residencyType: 'UAE_NATIONAL',
      isFirstHome: false,
      propertyStatus: 'READY',
      valuationBaseFils: 300_000_000,
      nonResidentBankMaxBps: 6000,
    }),
    6500,
  );
  assert.equal(
    statutoryMaxLtvBps({
      residencyType: 'EXPAT_RESIDENT',
      isFirstHome: false,
      propertyStatus: 'READY',
      valuationBaseFils: 300_000_000,
      nonResidentBankMaxBps: 6000,
    }),
    6000,
  );

  // 4. Data dir resolves cleanly
  const resolved = resolveDataDir();
  assert.ok(resolved.length > 0);
});
