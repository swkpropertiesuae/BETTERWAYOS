import type { DatabaseSync } from 'node:sqlite';
import QRCode from 'qrcode';
import {
  checkAccountLockout,
  clearFailedLogins,
  ForbiddenError,
  hashPassword,
  recordFailedLoginAttempt,
  recordLoginEvent,
  verifyPassword,
  writeAuditLog,
  type UserRecord,
} from '@/server/auth';
import { getStaffAvatarUrl, getStaffProfileByNameOrEmail } from '@/lib/staff-directory';

export const SUPREME_OWNER_EMAILS = new Set([
  'shabib@betterwaymortgages.com',
  'warda@betterwaymortgages.com',
  'md@betterwaymortgages.com',
  'shabib@swk.properties',
  'shabib@swk.property',
  'shabib@swkpropertiesuae.com',
  'warda@swk.property',
  'warda@swk.properties',
]);

export const ADMIN_ACCOUNT_EMAILS = new Set([
  'admin@betterwaymortgages.com',
  'admin@swk.properties',
  'admin@swk.property',
  'admin@swkpropertiesuae.com',
]);

export const MANAGER_EMAILS = new Set([
  'daniel@betterwaymortgages.com',
  'haseeb@betterwaymortgages.com',
  'ops.director@betterwaymortgages.com',
  'haseeb@swk.property',
  'haseeb@swk.properties',
  'manager@swkpropertiesuae.com',
]);

export function normalizeLoginAlias(rawEmail: string): string {
  const clean = rawEmail.trim().toLowerCase();
  if (
    clean === 'md@betterwaymortgages.com' ||
    clean === 'shabib@swk.properties' ||
    clean === 'shabib@swk.property' ||
    clean === 'shabib@swkpropertiesuae.com'
  ) {
    return 'shabib@betterwaymortgages.com';
  }
  if (clean === 'warda@swk.property' || clean === 'warda@swk.properties') {
    return 'warda@betterwaymortgages.com';
  }
  if (
    clean === 'admin@swk.properties' ||
    clean === 'admin@swk.property' ||
    clean === 'admin@swkpropertiesuae.com'
  ) {
    return 'admin@betterwaymortgages.com';
  }
  if (
    clean === 'daniel.xavier@betterwaymortgages.com' ||
    clean === 'manager@betterwaymortgages.com' ||
    clean === 'manager@swkpropertiesuae.com'
  ) {
    return 'daniel@betterwaymortgages.com';
  }
  if (
    clean === 'ops.director@betterwaymortgages.com' ||
    clean === 'haseeb@swk.property' ||
    clean === 'haseeb@swk.properties'
  ) {
    return 'haseeb@betterwaymortgages.com';
  }
  if (
    clean === 'talha@swk.property' ||
    clean === 'talha@swk.properties' ||
    clean === 'talha@swkpropertiesuae.com'
  ) {
    return 'talha@betterwaymortgages.com';
  }
  if (clean === 'rahaba.azeez@betterwaymortgages.com' || clean === 'hr@betterwaymortgages.com') {
    return 'rahaba@betterwaymortgages.com';
  }
  if (clean === 'mohammad.nusrik@betterwaymortgages.com' || clean === 'marketing@betterwaymortgages.com') {
    return 'nusrik@betterwaymortgages.com';
  }
  if (clean === 'elton.frank@betterwaymortgages.com' || clean === 'coordinator@betterwaymortgages.com') {
    return 'elton@betterwaymortgages.com';
  }
  if (clean === 'reshma.rajan@betterwaymortgages.com' || clean === 'telesales@betterwaymortgages.com') {
    return 'reshma@betterwaymortgages.com';
  }
  if (clean === 'asif.khan@betterwaymortgages.com' || clean === 'advisor@betterwaymortgages.com') {
    return 'asif@betterwaymortgages.com';
  }
  return clean;
}

export function isSupremeOwner(user: Pick<UserRecord, 'email' | 'role' | 'full_name_en'> | null | undefined): boolean {
  if (!user) return false;
  const email = String(user.email || '').trim().toLowerCase();
  if (SUPREME_OWNER_EMAILS.has(email)) return true;
  if (user.role === 'SUPER_ADMIN' && String(user.full_name_en || '').toLowerCase().includes('shabib')) return true;
  return false;
}

export function canPrintReceptionQr(user: Pick<UserRecord, 'email' | 'role' | 'full_name_en'> | null | undefined): boolean {
  if (!user) return false;
  const email = String(user.email || '').trim().toLowerCase();
  if (isSupremeOwner(user) || ADMIN_ACCOUNT_EMAILS.has(email) || MANAGER_EMAILS.has(email)) return true;
  if (user.role === 'SUPER_ADMIN') return true;
  return false;
}

export function canAccessAdminGovernance(user: Pick<UserRecord, 'email' | 'role' | 'full_name_en'> | null | undefined): boolean {
  if (!user) return false;
  return canPrintReceptionQr(user) || user.role === 'FINANCE_ADMIN' || user.role === 'COMPLIANCE_MLRO';
}

export function executeOwnerAdminControl(
  db: DatabaseSync,
  actor: UserRecord,
  input: {
    action: 'suspend' | 'activate' | 'force_signout' | 'reset_password' | 'unlock';
    notes?: string;
  },
) {
  if (!isSupremeOwner(actor)) {
    throw new ForbiddenError(
      'Only Supreme Company Owner Shabib Siraj (shabib@betterwaymortgages.com) can exercise supervisory control over admin@betterwaymortgages.com',
    );
  }

  const adminUser = db
    .prepare("SELECT id, email, status FROM users WHERE email = 'admin@betterwaymortgages.com'")
    .get() as { id: number; email: string; status: string } | undefined;
  if (!adminUser) throw new Error('admin@betterwaymortgages.com account not found');

  if (input.action === 'suspend') {
    db.prepare("UPDATE users SET status = 'SUSPENDED' WHERE id = ?").run(adminUser.id);
    db.prepare("UPDATE sessions SET revoked_at = datetime('now') WHERE user_id = ?").run(adminUser.id);
  } else if (input.action === 'activate' || input.action === 'unlock') {
    db.prepare("UPDATE users SET status = 'ACTIVE', failed_logins = 0, locked_until = NULL WHERE id = ?").run(adminUser.id);
  } else if (input.action === 'force_signout') {
    db.prepare("UPDATE sessions SET revoked_at = datetime('now') WHERE user_id = ?").run(adminUser.id);
  } else if (input.action === 'reset_password') {
    const nextPassword = process.env.ADMIN_PASSWORD || process.env.STAFF_DEFAULT_PASSWORD || 'Betterway#2026';
    db.prepare('UPDATE users SET password_hash = ?, failed_logins = 0, locked_until = NULL WHERE id = ?').run(
      hashPassword(nextPassword),
      adminUser.id,
    );
    db.prepare("UPDATE sessions SET revoked_at = datetime('now') WHERE user_id = ?").run(adminUser.id);
  }

  const updated = db.prepare('SELECT id, email, status FROM users WHERE id = ?').get(adminUser.id) as {
    id: number;
    email: string;
    status: string;
  };
  writeAuditLog(db, actor, 'users', adminUser.id, `OWNER_ADMIN_CONTROL_${input.action.toUpperCase()}`, adminUser, {
    newStatus: updated.status,
    notes: input.notes ?? '',
  });

  return { adminId: updated.id, adminEmail: updated.email, adminStatus: updated.status, action: input.action };
}

export function recordReceptionQrCheckIn(
  db: DatabaseSync,
  actor: UserRecord,
  input: {
    checkInDate?: string; // YYYY-MM-DD
    checkInTimeGst?: string; // HH:MM (24h)
    networkSsid?: string;
    qrStandCode?: string;
    deviceId?: string;
  },
) {
  const now = new Date();
  const dateStr =
    input.checkInDate ||
    new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dubai', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
  const timeStr =
    input.checkInTimeGst ||
    new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Dubai', hour: '2-digit', minute: '2-digit', hour12: false }).format(now);

  const [hhStr = '10', mmStr = '00'] = timeStr.split(':');
  const totalMins = Number(hhStr) * 60 + Number(mmStr);
  const dtObj = new Date(dateStr + 'T08:00:00Z');
  const dayOfWeek = dtObj.getUTCDay(); // 0 = Sunday, 6 = Saturday

  const isSun = dayOfWeek === 0;
  const isSat = dayOfWeek === 6;
  const shiftName = isSun
    ? 'Sunday (Official Holiday — Client Variable Hours)'
    : isSat
      ? 'Saturday 10:00–16:00 GST'
      : 'Mon–Fri 10:00–19:00 GST';

  // Official Grace Period: up to 10:05 AM (605 mins) is ON_TIME; 10:06 AM+ is LATE with exact minutes from 10:00 AM
  const isLate = !isSun && totalMins > 10 * 60 + 5;
  const lateMinutes = isLate ? Math.max(6, totalMins - 10 * 60) : 0;
  const status = isSun ? 'HOLIDAY_CLIENT_VISIT' : isLate ? 'LATE' : 'ON_TIME';

  const res = db
    .prepare(
      `INSERT INTO office_attendance_logs (
        user_id, employee_name, email, check_in_date, check_in_time_gst,
        shift_name, is_late, late_minutes, qr_stand_code, network_ssid, device_id, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      actor.id,
      actor.full_name_en,
      actor.email,
      dateStr,
      timeStr,
      shiftName,
      isLate ? 1 : 0,
      lateMinutes,
      input.qrStandCode || 'BW-RECEPTION-STAND-DXB-1',
      input.networkSsid || 'Betterway-Office-5G',
      input.deviceId || 'WEB-BROWSER',
      status,
    );

  // Rolling 7-day Continuous Contemptor check (>= 3 late arrivals in 7 days)
  const windowStart = new Date(Date.parse(dateStr + 'T00:00:00Z') - 6 * 86_400_000).toISOString().slice(0, 10);
  const late7d = (
    db
      .prepare(
        `SELECT COUNT(*) as c FROM office_attendance_logs
         WHERE user_id = ? AND is_late = 1 AND check_in_date >= ? AND check_in_date <= ?`,
      )
      .get(actor.id, windowStart, dateStr) as { c: number }
  ).c;

  let contemptorAlertTriggered = false;
  if (isLate && late7d >= 3) {
    contemptorAlertTriggered = true;
    db.prepare(
      `INSERT INTO late_contemptor_alerts (user_id, employee_name, email, late_count_7d, window_start_date, window_end_date)
       VALUES (?, ?, ?, ?, ?, ?)`,
    ).run(actor.id, actor.full_name_en, actor.email, late7d, windowStart, dateStr);

    db.prepare(
      `INSERT INTO notifications (template_id, channel, recipient, trigger, body, status)
       VALUES ('CONTEMPTOR_ALERT', 'WHATSAPP', 'Shabib Siraj & Mohammad Haseeb', 'LATE_3X_7D', ?, 'SENT')`,
    ).run(
      `Continuous Contemptor Alert: ${actor.full_name_en} (${actor.email}) logged ${late7d} late arrivals (>10:05 AM) between ${windowStart} and ${dateStr}.`,
    );
  }

  writeAuditLog(db, actor, 'office_attendance_logs', Number(res.lastInsertRowid), 'RECEPTION_QR_CHECKIN', null, {
    dateStr,
    timeStr,
    status,
    lateMinutes,
    contemptorAlertTriggered,
  });

  return {
    logId: Number(res.lastInsertRowid),
    checkInDate: dateStr,
    checkInTimeGst: timeStr,
    shiftName,
    isLate,
    lateMinutes,
    status,
    lateCount7d: late7d,
    contemptorAlertTriggered,
  };
}

export function generateOwnerBriefing(
  db: DatabaseSync,
  actor: UserRecord,
  kind: 'morning' | 'attendance-1030',
  dateStr = new Date().toISOString().slice(0, 10),
) {
  const activeDeals = (
    db.prepare("SELECT COUNT(*) as c FROM deals WHERE origin_mode = 'LIVE' AND stage NOT IN ('DECLINED','WITHDRAWN')").get() as {
      c: number;
    }
  ).c;
  const pipelineFils = (
    db
      .prepare("SELECT COALESCE(SUM(target_loan_fils), 0) as v FROM deals WHERE origin_mode = 'LIVE' AND stage NOT IN ('DECLINED','WITHDRAWN')")
      .get() as { v: number }
  ).v;
  const pendingBin = (db.prepare("SELECT COUNT(*) as c FROM recycle_bin_requests WHERE status = 'PENDING'").get() as { c: number }).c;
  const pendingDecisions = (
    db.prepare("SELECT COUNT(*) as c FROM manager_admin_decisions WHERE status = 'PENDING'").get() as { c: number }
  ).c;
  const onTimeToday = (
    db.prepare('SELECT COUNT(*) as c FROM office_attendance_logs WHERE check_in_date = ? AND is_late = 0').get(dateStr) as { c: number }
  ).c;
  const lateToday = (
    db.prepare('SELECT COUNT(*) as c FROM office_attendance_logs WHERE check_in_date = ? AND is_late = 1').get(dateStr) as { c: number }
  ).c;
  const contemptorsCount = (
    db.prepare("SELECT COUNT(*) as c FROM late_contemptor_alerts WHERE alert_status = 'OPEN'").get() as { c: number }
  ).c;

  const summaryText =
    kind === 'morning'
      ? `09:30 AM Owner Morning Briefing for Shabib Siraj: ${activeDeals} active mortgage deals (AED ${(pipelineFils / 100).toLocaleString('en-US')}), ${pendingBin} Recycle Bin item(s) & ${pendingDecisions} Manager decision(s) awaiting Owner sign-off.`
      : `10:30 AM Attendance & Contemptor Report (${dateStr}): ${onTimeToday} on-time (<=10:05 AM), ${lateToday} late (>10:05 AM), ${contemptorsCount} active Continuous Contemptor alert(s).`;

  db.prepare(
    `INSERT INTO notifications (template_id, channel, recipient, trigger, body, status, sent_at)
     VALUES (?, 'WHATSAPP', 'Shabib Siraj (+971501000001)', ?, ?, 'SENT', datetime('now'))`,
  ).run(kind === 'morning' ? 'OWNER_MORNING_0930' : 'ATTENDANCE_REPORT_1030', kind.toUpperCase(), summaryText);

  writeAuditLog(db, actor, 'notifications', kind, 'SEND_OWNER_BRIEFING', null, {
    dateStr,
    onTimeToday,
    lateToday,
    contemptorsCount,
    summaryText,
  });

  return {
    kind,
    dateStr,
    activeDeals,
    pipelineFils,
    pendingBin,
    pendingDecisions,
    onTimeToday,
    lateToday,
    contemptorsCount,
    summaryText,
  };
}

export function requestRecordDeletionToBin(
  db: DatabaseSync,
  actor: UserRecord,
  input: {
    entityType: string;
    entityId: string;
    recordTitle: string;
    deleteReason: string;
    snapshot?: unknown;
  },
): number {
  const reason = input.deleteReason.trim();
  if (reason.length < 5) {
    throw new Error('Mandatory Delete Reason Required: Please state a specific reason for Owner Shabib Siraj review.');
  }

  const res = db
    .prepare(
      `INSERT INTO recycle_bin_requests (
        entity_type, entity_id, record_title, snapshot_json, delete_reason, requested_by_user_id, requested_by_name, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING')`,
    )
    .run(
      input.entityType,
      String(input.entityId),
      input.recordTitle.trim(),
      JSON.stringify(input.snapshot ?? { entityType: input.entityType, entityId: input.entityId }),
      reason,
      actor.id,
      actor.full_name_en,
    );

  const binId = Number(res.lastInsertRowid);
  writeAuditLog(db, actor, 'recycle_bin_requests', binId, 'QUEUE_DELETE_TO_BIN', null, {
    entityType: input.entityType,
    entityId: input.entityId,
    reason,
  });
  return binId;
}

export function decideRecycleBinRequest(
  db: DatabaseSync,
  actor: UserRecord,
  input: {
    binId: number;
    decision: 'APPROVED_DELETED' | 'REJECTED_RESTORED';
    ownerNotes?: string;
  },
) {
  if (!isSupremeOwner(actor)) {
    throw new ForbiddenError(
      'Only Supreme Owner Shabib Siraj (shabib@betterwaymortgages.com) can approve permanent deletion or restore items from the Pending Delete Bin.',
    );
  }

  const row = db.prepare('SELECT * FROM recycle_bin_requests WHERE id = ?').get(input.binId) as Record<string, unknown> | undefined;
  if (!row) throw new Error(`Recycle Bin item #${input.binId} not found`);

  db.prepare(
    `UPDATE recycle_bin_requests
     SET status = ?, owner_notes = ?, decided_by_user_id = ?, decided_at = datetime('now')
     WHERE id = ?`,
  ).run(input.decision, (input.ownerNotes ?? '').trim(), actor.id, input.binId);

  writeAuditLog(db, actor, 'recycle_bin_requests', input.binId, `OWNER_BIN_${input.decision}`, row, {
    decision: input.decision,
    ownerNotes: input.ownerNotes,
  });

  return db.prepare('SELECT * FROM recycle_bin_requests WHERE id = ?').get(input.binId) as {
    id: number;
    status: string;
    owner_notes: string;
  };
}

export function submitManagerAdminDecision(
  db: DatabaseSync,
  actor: UserRecord,
  input: {
    subject: string;
    category: string;
    reason: string;
    amountFils?: number;
  },
): number {
  if (!input.subject.trim() || !input.reason.trim()) {
    throw new Error('Both Subject and Detailed Reasoning are required for Owner Shabib Siraj approval.');
  }
  const seq = (db.prepare('SELECT COUNT(*) as c FROM manager_admin_decisions').get() as { c: number }).c + 1;
  const ref = `DEC-2026-${String(seq).padStart(3, '0')}`;

  const res = db
    .prepare(
      `INSERT INTO manager_admin_decisions (
        decision_ref, subject, category, reason, amount_fils, submitted_by_user_id, submitted_by_name, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING')`,
    )
    .run(
      ref,
      input.subject.trim(),
      input.category.trim(),
      input.reason.trim(),
      Math.max(0, Math.round(input.amountFils ?? 0)),
      actor.id,
      actor.full_name_en,
    );

  const id = Number(res.lastInsertRowid);
  writeAuditLog(db, actor, 'manager_admin_decisions', id, 'SUBMIT_MANAGER_DECISION', null, { ref, subject: input.subject });
  return id;
}

export function decideManagerAdminDecision(
  db: DatabaseSync,
  actor: UserRecord,
  input: {
    decisionId: number;
    decision: 'APPROVED' | 'REJECTED';
    ownerComment?: string;
  },
) {
  if (!isSupremeOwner(actor)) {
    throw new ForbiddenError('Only Supreme Owner Shabib Siraj can approve or reject Manager Administrative Decisions.');
  }

  db.prepare(
    `UPDATE manager_admin_decisions
     SET status = ?, owner_comment = ?, decided_by_user_id = ?, decided_at = datetime('now')
     WHERE id = ?`,
  ).run(input.decision, (input.ownerComment ?? 'Reviewed by Owner Shabib Siraj').trim(), actor.id, input.decisionId);

  writeAuditLog(db, actor, 'manager_admin_decisions', input.decisionId, `OWNER_DECISION_${input.decision}`);
  return db.prepare('SELECT * FROM manager_admin_decisions WHERE id = ?').get(input.decisionId) as {
    id: number;
    decision_ref: string;
    status: string;
    owner_comment: string;
  };
}

export const PERMITTED_UAE_PAYMENT_CHANNELS = [
  'Betterway Company Bank Account (AED/FX)',
  'Bank Subvention Wire / Bordereau',
  "DLD Registration Trustee Manager's Cheque",
  'Developer DLD Escrow Account',
  'Post-Dated Cheques (PDC)',
  'Worldwide Currency Exchange (Licensed UAE Exchange House)',
  'UAE-Permitted Crypto / USDT (VARA-Licensed Gateway)',
] as const;

export function assertLegalUaePaymentChannel(channel: string): string {
  const c = channel.trim();
  if (/personal|agent\s*account|advisor\s*account|cash\s*to\s*agent|private\s*iban/i.test(c)) {
    throw new Error(
      '400 Bad Request — Zero Tolerance for Personal Accounts: Client or bank funds may NEVER be received in a Sales Advisor personal bank account.',
    );
  }
  return c || PERMITTED_UAE_PAYMENT_CHANNELS[0];
}

export function computeSwk5050CommissionSplit(params: {
  grossCommissionExVatFils: number;
  partnerShareBps?: number; // e.g. 3000 = 30% 3rd-party B2B / A2A partner share
}) {
  const gross = Math.max(0, Math.round(params.grossCommissionExVatFils));
  const partnerBps = Math.max(0, Math.min(9000, Math.round(params.partnerShareBps ?? 0)));
  const partnerShareFils = Math.round((gross * partnerBps) / 10_000);
  const companyNetPoolFils = gross - partnerShareFils;
  const company50ShareFils = Math.round(companyNetPoolFils * 0.5);
  const advisor50ShareFils = companyNetPoolFils - company50ShareFils;
  const outputVat5PctFils = Math.round(gross * 0.05);

  return {
    grossCommissionExVatFils: gross,
    outputVat5PctFils,
    partnerShareBps: partnerBps,
    partnerShareFils,
    companyNetPoolFils,
    company50ShareFils,
    advisor50ShareFils,
  };
}

export function createDealWithdrawalRequest(
  db: DatabaseSync,
  actor: UserRecord,
  input: {
    dealId: number;
    department?: 'READY_SECONDARY' | 'OFFPLAN_HANDOVER' | 'BUYOUT_COMMERCIAL';
    withdrawalReason: string;
    collectedFeeFils: number;
    incurredCostFils: number;
    paymentChannel: string;
  },
): number {
  const validChannel = assertLegalUaePaymentChannel(input.paymentChannel);
  if (!input.withdrawalReason.trim()) {
    throw new Error('Mandatory withdrawal reason is required.');
  }

  const deal = db
    .prepare(
      `SELECT d.id, d.deal_ref, d.stage, h.primary_name
       FROM deals d JOIN households h ON h.id = d.household_id
       WHERE d.id = ?`,
    )
    .get(input.dealId) as { id: number; deal_ref: string; stage: string; primary_name: string } | undefined;
  const clientName = deal?.primary_name ?? `Deal #${input.dealId}`;

  const collected = Math.max(0, Math.round(input.collectedFeeFils));
  const incurred = Math.max(0, Math.round(input.incurredCostFils));
  const refundable = Math.max(0, collected - incurred);

  const seq = (db.prepare('SELECT COUNT(*) as c FROM deal_withdrawals').get() as { c: number }).c + 1;
  const ref = `WD-2026-${String(seq).padStart(3, '0')}`;

  const res = db
    .prepare(
      `INSERT INTO deal_withdrawals (
        withdrawal_ref, deal_id, client_name, department, withdrawal_stage,
        withdrawal_reason, collected_fee_fils, incurred_cost_fils, refundable_fils,
        payment_channel, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING_OWNER')`,
    )
    .run(
      ref,
      input.dealId,
      clientName,
      input.department ?? 'READY_SECONDARY',
      deal?.stage ?? 'FOL_ISSUED',
      input.withdrawalReason.trim(),
      collected,
      incurred,
      refundable,
      validChannel,
    );

  const id = Number(res.lastInsertRowid);
  writeAuditLog(db, actor, 'deal_withdrawals', id, 'CREATE_DEAL_WITHDRAWAL', null, { ref, refundable });
  return id;
}

export function decideDealWithdrawal(
  db: DatabaseSync,
  actor: UserRecord,
  input: {
    withdrawalId: number;
    decision: 'APPROVED_REFUNDED' | 'REJECTED';
    ownerNotes?: string;
  },
) {
  if (!isSupremeOwner(actor)) {
    throw new ForbiddenError(
      'Only Supreme Owner Shabib Siraj can authorize final Deal Withdrawal Client Refunds.',
    );
  }

  db.prepare(
    `UPDATE deal_withdrawals
     SET status = ?, owner_notes = ?, approved_by_owner_id = ?, decided_at = datetime('now')
     WHERE id = ?`,
  ).run(input.decision, (input.ownerNotes ?? '').trim(), actor.id, input.withdrawalId);

  writeAuditLog(db, actor, 'deal_withdrawals', input.withdrawalId, `OWNER_WITHDRAWAL_${input.decision}`);
  return db.prepare('SELECT * FROM deal_withdrawals WHERE id = ?').get(input.withdrawalId) as {
    id: number;
    withdrawal_ref: string;
    refundable_fils: number;
    status: string;
    owner_notes: string;
  };
}

export interface DubaiAreaPulse {
  code: string;
  ticker: string;
  name: string;
  segment: 'Prime' | 'Upper-mid' | 'Mid' | 'Value';
  ppsf: number;
  ppsfLY: number;
  yoyPct: number;
  yieldPct: number;
  serviceCharge: number;
  transactionsQ: number;
  offPlanShare: number;
  avgMortgageLtvPct: number;
  topBanks: string[];
  forecast15Y: { year: number; projectedPpsf: number; catalyst: string }[];
  nearby: {
    metro: string;
    landmarks: string[];
    schools: string[];
    hospitals: string[];
    beachOrParkMins: string;
  };
  ongoingProjects: string[];
  future15YearOutlook: string;
  closingKeywords: string[];
  fieldVisitPitchScript: string[];
}

export const DUBAI_AREAS_24: DubaiAreaPulse[] = [
  {
    code: 'PALM',
    ticker: 'PALM.DXB',
    name: 'Palm Jumeirah',
    segment: 'Prime',
    ppsf: 4380,
    ppsfLY: 3720,
    yoyPct: 17.7,
    yieldPct: 5.1,
    serviceCharge: 24,
    transactionsQ: 1180,
    offPlanShare: 38,
    avgMortgageLtvPct: 70,
    topBanks: ['First Abu Dhabi Bank', 'HSBC UAE', 'Emirates NBD'],
    forecast15Y: [
      { year: 2026, projectedPpsf: 4380, catalyst: 'Ultra-prime branded residence handovers (Armani Beach, Como)' },
      { year: 2029, projectedPpsf: 5250, catalyst: 'Zero remaining freehold plots on crescent & fronds' },
      { year: 2033, projectedPpsf: 6400, catalyst: 'Global UHNW trophy asset scarcity & beachfront premium' },
      { year: 2037, projectedPpsf: 7650, catalyst: 'Generational villa redevelopment & smart coastal transit' },
      { year: 2041, projectedPpsf: 9100, catalyst: 'Dubai 2040 coastal heritage crown jewel status' },
    ],
    nearby: {
      metro: 'Palm Monorail → Dubai Tram → Sobha Realty Metro (8 mins)',
      landmarks: ['Atlantis The Royal', 'Nakheel Mall', 'Palm West Beach', 'The Pointe Waterfront'],
      schools: ['Dubai College (10 mins)', 'GEMS Wellington International (12 mins)', 'Regent International School'],
      hospitals: ['Al Zahra Hospital Dubai', 'Emirates Hospital Clinic Palm', 'Saudi German Hospital (12 mins)'],
      beachOrParkMins: '0 mins (Private beachfront & Al Ittihad Park)',
    },
    ongoingProjects: ['Omniyat Orla Infinity', 'Armani Beach Residences by Arada', 'Ellington Ocean House', 'Six Senses The Palm'],
    future15YearOutlook:
      'Zero new land supply makes Palm Jumeirah the ultimate scarcity play over 2026–2041. High-value equity releases and HNW non-resident mortgages dominate panel volume.',
    closingKeywords: ['Zero New Land Supply', 'Private Beachfront Trophy Asset', '17.7% YoY Capital Growth', 'Instant 10-Year Golden Visa', 'UHNW Dollar-Pegged Safe Haven'],
    fieldVisitPitchScript: [
      'Notice the private beach access right here — not a single new plot can ever be added to Palm Jumeirah.',
      'Last year alone prices rose 17.7% to AED 4,380/sqft while maintaining a tax-free 5.1% yield.',
      'With FAB and HSBC underwriting up to AED 25M+ on Palm Jumeirah, you lock in leverage while qualifying for the 10-Year Golden Visa.',
    ],
  },
  {
    code: 'DWNT',
    ticker: 'DWNT.DXB',
    name: 'Downtown Dubai',
    segment: 'Prime',
    ppsf: 2980,
    ppsfLY: 2660,
    yoyPct: 12.0,
    yieldPct: 5.6,
    serviceCharge: 21,
    transactionsQ: 1640,
    offPlanShare: 31,
    avgMortgageLtvPct: 78,
    topBanks: ['Emirates NBD', 'HSBC UAE', 'ADCB'],
    forecast15Y: [
      { year: 2026, projectedPpsf: 2980, catalyst: 'Dubai Mall AED 1.5B expansion & Opera District completion' },
      { year: 2029, projectedPpsf: 3550, catalyst: 'Full maturation of final Boulevard & Burj Crown plots' },
      { year: 2033, projectedPpsf: 4250, catalyst: 'DIFC Zabeel expansion linking seamlessly to Downtown' },
      { year: 2037, projectedPpsf: 5100, catalyst: 'Pedestrianized climate-controlled boulevard network' },
      { year: 2041, projectedPpsf: 6050, catalyst: 'Undisputed cultural & financial core of the Middle East' },
    ],
    nearby: {
      metro: 'Burj Khalifa / Dubai Mall Metro Station (Direct air-conditioned link)',
      landmarks: ['Burj Khalifa', 'The Dubai Mall (100M+ annual visitors)', 'Dubai Opera', 'Souk Al Bahar'],
      schools: ['JSS Private School (8 mins)', 'Hartland International School (10 mins)', 'Citizens School (7 mins)'],
      hospitals: ['Mediclinic Dubai Mall', 'Emirates Hospital Jumeirah (12 mins)', 'American Hospital (14 mins)'],
      beachOrParkMins: '2 mins to Burj Park; 12 mins to Jumeirah Beach',
    },
    ongoingProjects: ['Dubai Mall 200-Store Luxury Expansion', 'Mercedes-Benz Places by Binghatti', 'St. Regis The Residences', 'Address Residences Zabeel'],
    future15YearOutlook:
      'Every Tier-1 UAE bank (ENBD, FAB, HSBC, ADCB, DIB) maintains automatic green-channel APL approval on Emaar Downtown towers, ensuring 48-hour valuation turnaround.',
    closingKeywords: ['Center of Now', '100M+ Footfall Next Door', 'Unmatched Bank Valuation Liquidity', 'Burj Khalifa View Premium', '48h Emaar APL Approval'],
    fieldVisitPitchScript: [
      'Look at the direct Burj corridor — properties with this view command a 22% resale and valuation premium.',
      'All 24 UAE banks have Emaar Downtown on their priority Approved Project List for 80% Expat / 85% National LTV.',
      'If you ever want to refinance or exit in 48 hours, Downtown Dubai is the most liquid submarket in the region.',
    ],
  },
  {
    code: 'MARN',
    ticker: 'MARN.DXB',
    name: 'Dubai Marina',
    segment: 'Upper-mid',
    ppsf: 2290,
    ppsfLY: 2070,
    yoyPct: 10.6,
    yieldPct: 6.4,
    serviceCharge: 18,
    transactionsQ: 2210,
    offPlanShare: 22,
    avgMortgageLtvPct: 80,
    topBanks: ['HSBC UAE', 'Emirates NBD', 'Mashreq'],
    forecast15Y: [
      { year: 2026, projectedPpsf: 2290, catalyst: 'Six Senses Residences & Ciel Tower completion' },
      { year: 2029, projectedPpsf: 2720, catalyst: 'Dubai Harbour superyacht marina & bridge connectivity' },
      { year: 2033, projectedPpsf: 3250, catalyst: 'Palm Jebel Ali corridor boosting New Dubai coastal belt' },
      { year: 2037, projectedPpsf: 3850, catalyst: 'Legacy tower refurbishment cycle & waterfront scarcity' },
      { year: 2041, projectedPpsf: 4550, catalyst: 'Dubai 2040 primary beachfront tourism & lifestyle hub' },
    ],
    nearby: {
      metro: 'Sobha Realty Metro & DMCC Metro + Dubai Tram Loop',
      landmarks: ['Dubai Marina Mall', 'Pier 7', 'JBR Walk & The Beach', 'Dubai Harbour Yacht Club'],
      schools: ['Emirates International School Meadows (10 mins)', 'Dubai British School Emirates Hills (12 mins)'],
      hospitals: ['Medcare Medical Centre Marina', 'Saudi German Hospital Barsha (10 mins)', 'Al Zahra Hospital'],
      beachOrParkMins: '5 mins walk to JBR Beach & 7km Marina Promenade',
    },
    ongoingProjects: ['Six Senses Residences Dubai Marina', 'Franck Muller Aeternitas', 'LIV Waterside', 'Habtoor Grand Residences'],
    future15YearOutlook:
      '95%+ built out, Dubai Marina is the #1 corridor for UK/European non-resident mortgages (60% LTV) and ready secondary transfers.',
    closingKeywords: ['Walk-to-Beach & Metro', '95% Occupancy Year-Round', '6.4% Gross Rental Yield', 'UK/EU Non-Resident Magnet', 'Zero Future Construction Noise'],
    fieldVisitPitchScript: [
      'You are 5 minutes on foot from both the Metro and the beach — that is why Marina occupancy stays above 95% all year.',
      'At AED 2,290/sqft, gross rental yield of 6.4% comfortably covers a 3.89% fixed mortgage EMI with positive cashflow.',
      'HSBC and Emirates NBD both underwrite non-resident GBP/EUR income here with 72-hour IPA turnaround.',
    ],
  },
  {
    code: 'BBAY',
    ticker: 'BBAY.DXB',
    name: 'Business Bay',
    segment: 'Upper-mid',
    ppsf: 2180,
    ppsfLY: 1950,
    yoyPct: 11.8,
    yieldPct: 6.8,
    serviceCharge: 17,
    transactionsQ: 2570,
    offPlanShare: 54,
    avgMortgageLtvPct: 78,
    topBanks: ['Dubai Islamic Bank', 'ADCB', 'Emirates NBD'],
    forecast15Y: [
      { year: 2026, projectedPpsf: 2180, catalyst: 'Marasi Bay ultra-luxury yacht club by Omniyat' },
      { year: 2029, projectedPpsf: 2650, catalyst: 'Bugatti, Jacob & Co, and One River Point handovers' },
      { year: 2033, projectedPpsf: 3200, catalyst: 'Complete Canal promenade activation & DIFC spillover' },
      { year: 2037, projectedPpsf: 3820, catalyst: 'Narrowing price gap with Downtown Dubai to <12%' },
      { year: 2041, projectedPpsf: 4500, catalyst: 'Central financial & waterfront residential powerhouse' },
    ],
    nearby: {
      metro: 'Business Bay Metro Station + RTA Water Canal Marine Transport',
      landmarks: ['Dubai Water Canal Boardwalk', 'Marasi Bay Marina', 'The Opus by Zaha Hadid', 'Downtown Dubai (3 mins)'],
      schools: ['Horizon English School (8 mins)', 'JSS Private School (6 mins)', 'Dubai International School'],
      hospitals: ['Emirates Hospital Clinic Business Bay', 'Aster Royal Clinic', 'Mediclinic City Hospital (12 mins)'],
      beachOrParkMins: '1 min to Dubai Canal 12km Jogging Track; 10 mins to Jumeirah Beach & Safa Park',
    },
    ongoingProjects: ['Bugatti Residences by Binghatti', 'Vela & Vela Viento by Omniyat', 'Peninsula by Select Group', 'One River Point by Ellington'],
    future15YearOutlook:
      'Over 2026–2041, Business Bay’s Marasi Bay and Dubai Water Canal transformation is driving high-volume off-plan handover mortgages at Fresh Market Valuation.',
    closingKeywords: ['Dubai Canal Waterfront', '27% Discount vs Downtown', '6.8% High Corporate Yield', 'Fresh Market Valuation Handover', '3 Mins to Burj Khalifa & DIFC'],
    fieldVisitPitchScript: [
      'We are literally 3 minutes from Burj Khalifa, yet you are entering at AED 2,180/sqft instead of AED 2,980/sqft in Downtown.',
      'On handover, banks on our APL lend against Fresh Market Valuation rather than original SPA price, reducing your cash outlay.',
      'Finance and tech executives working in DIFC and Business Bay drive a rock-solid 6.8% rental yield here.',
    ],
  },
  {
    code: 'DHIL',
    ticker: 'DHIL.DXB',
    name: 'Dubai Hills Estate',
    segment: 'Upper-mid',
    ppsf: 2390,
    ppsfLY: 2090,
    yoyPct: 14.4,
    yieldPct: 5.8,
    serviceCharge: 15,
    transactionsQ: 1930,
    offPlanShare: 47,
    avgMortgageLtvPct: 80,
    topBanks: ['HSBC UAE', 'Emirates NBD', 'First Abu Dhabi Bank'],
    forecast15Y: [
      { year: 2026, projectedPpsf: 2390, catalyst: 'Parkside & Golf Grand handovers around Central Park' },
      { year: 2029, projectedPpsf: 2920, catalyst: 'Planned Etihad Rail & Metro connectivity along Umm Suqeim/Al Khail' },
      { year: 2033, projectedPpsf: 3550, catalyst: '100% master-community completion by Emaar' },
      { year: 2037, projectedPpsf: 4250, catalyst: 'Generational family villa & park-view scarcity' },
      { year: 2041, projectedPpsf: 5100, catalyst: 'Green Heart of Dubai benchmark family address' },
    ],
    nearby: {
      metro: 'Dubai Hills Mall RTA Express Bus → Equiti Metro (10 mins); future metro corridor',
      landmarks: ['Dubai Hills Mall', '18-Hole Championship Golf Course', 'Dubai Hills Central Park (180,000 sqm)'],
      schools: ['GEMS International School', 'GEMS Wellington Academy Al Khail', 'GEMS New Millennium School'],
      hospitals: ['King’s College Hospital London (Inside Dubai Hills)', 'Mediclinic Parkview (8 mins)'],
      beachOrParkMins: '0 mins to Dubai Hills Central Park; 12 mins to Kite Beach',
    },
    ongoingProjects: ['Emaar Address Residences Dubai Hills', 'Park Gate Villas', 'Club Place', 'Golf Hillside'],
    future15YearOutlook:
      '#1 family end-user mortgage destination in Dubai with King’s College Hospital, 3 GEMS schools, and Dubai Hills Mall inside one green masterplan.',
    closingKeywords: ['Green Heart of Dubai', 'King’s College Hospital On-Site', '80% Expat / 85% National LTV', '14.4% YoY End-User Appreciation', '18-Hole Championship Golf'],
    fieldVisitPitchScript: [
      'Dubai Hills is the #1 end-user mortgage community in Dubai — families stay 7 to 10+ years because schools, hospital, and mall are all inside.',
      'CBRE and Cavendish Maxwell valuations here consistently match or exceed Contract F price due to comp velocity.',
      'First-home buyers qualify for full 80% Expat / 85% UAE National LTV up to AED 5M across our entire 24-bank panel.',
    ],
  },
  ...[
    ['CREK', 'CREK.DXB', 'Dubai Creek Harbour', 'Upper-mid', 2310, 2020, 14.4, 6.1, 17, 1790, 62],
    ['JVC', 'JVC.DXB', 'Jumeirah Village Circle', 'Mid', 1420, 1240, 14.5, 7.9, 13, 4120, 64],
    ['JLT', 'JLT.DXB', 'Jumeirah Lakes Towers', 'Mid', 1680, 1510, 11.3, 7.1, 16, 1540, 28],
    ['EMBF', 'EMBF.DXB', 'Emaar Beachfront', 'Prime', 3690, 3210, 15.0, 5.5, 22, 820, 58],
    ['MBRC', 'MBRC.DXB', 'MBR City & Sobha Hartland', 'Upper-mid', 2140, 1890, 13.2, 6.3, 16, 2080, 59],
    ['DIFC', 'DIFC.DXB', 'DIFC Financial District', 'Prime', 3120, 2790, 11.8, 5.9, 23, 610, 34],
    ['ARAB', 'ARAB.DXB', 'Arabian Ranches I, II & III', 'Upper-mid', 1940, 1690, 14.8, 5.7, 5, 1120, 32],
    ['DAMC', 'DAMC.DXB', 'DAMAC Hills & Lagoons', 'Mid', 1560, 1360, 14.7, 6.9, 12, 2340, 56],
    ['DSOU', 'DSOU.DXB', 'Dubai South & Expo City', 'Value', 1290, 1090, 18.3, 7.4, 11, 2680, 71],
    ['PJBL', 'PJBL.DXB', 'Palm Jebel Ali', 'Prime', 3250, 2750, 18.2, 5.2, 19, 690, 92],
    ['FURJ', 'FURJ.DXB', 'Al Furjan', 'Mid', 1510, 1330, 13.5, 7.2, 12, 1490, 44],
    ['CTWK', 'CTWK.DXB', 'City Walk', 'Prime', 2840, 2510, 13.1, 5.8, 20, 540, 39],
    ['BLUE', 'BLUE.DXB', 'Bluewaters Island', 'Prime', 4120, 3620, 13.8, 5.4, 24, 310, 18],
    ['DISL', 'DISL.DXB', 'Dubai Islands', 'Upper-mid', 2280, 1960, 16.3, 6.2, 17, 940, 78],
    ['BARR', 'BARR.DXB', 'Al Barari', 'Prime', 2690, 2310, 16.5, 5.3, 14, 380, 35],
    ['JGE', 'JGE.DXB', 'Jumeirah Golf Estates', 'Prime', 2480, 2140, 15.9, 5.6, 8, 520, 29],
    ['ARJN', 'ARJN.DXB', 'Arjan & Miracle Garden', 'Value', 1340, 1180, 13.6, 7.8, 12, 1890, 66],
    ['SZR', 'SZR.DXB', 'Sheikh Zayed Road Corridor', 'Upper-mid', 2360, 2110, 11.8, 6.3, 18, 760, 41],
    ['MOTR', 'MOTR.DXB', 'Motor City & Sports City', 'Value', 1260, 1110, 13.5, 7.7, 12, 1620, 48],
  ].map(([code, ticker, name, segment, ppsf, ppsfLY, yoyPct, yieldPct, serviceCharge, transactionsQ, offPlanShare]) => {
    const p = Number(ppsf);
    return {
      code: String(code),
      ticker: String(ticker),
      name: String(name),
      segment: segment as 'Prime' | 'Upper-mid' | 'Mid' | 'Value',
      ppsf: p,
      ppsfLY: Number(ppsfLY),
      yoyPct: Number(yoyPct),
      yieldPct: Number(yieldPct),
      serviceCharge: Number(serviceCharge),
      transactionsQ: Number(transactionsQ),
      offPlanShare: Number(offPlanShare),
      avgMortgageLtvPct: 80,
      topBanks: ['Emirates NBD', 'Dubai Islamic Bank', 'ADCB'],
      forecast15Y: [
        { year: 2026, projectedPpsf: p, catalyst: 'Current DLD registered transfer & mortgage benchmark' },
        { year: 2029, projectedPpsf: Math.round(p * 1.22), catalyst: 'Infrastructure & Metro Blue/Gold Line feeder maturity' },
        { year: 2033, projectedPpsf: Math.round(p * 1.48), catalyst: 'Masterplan phase completions & retail density' },
        { year: 2037, projectedPpsf: Math.round(p * 1.76), catalyst: 'Supply absorption & secondary refinance cycle' },
        { year: 2041, projectedPpsf: Math.round(p * 2.1), catalyst: 'Dubai 2040 Urban Master Plan population milestone (5.8M+)' },
      ],
      nearby: {
        metro: 'RTA Metro / Express Feeder Link (6–12 mins)',
        landmarks: [`${name} Town Centre`, 'Community Retail & Boulevard', 'Dubai 2040 Green Corridor'],
        schools: ['GEMS / Taaleem International School (8–10 mins)', 'British & IB Curriculum Nurseries'],
        hospitals: ['Mediclinic / Aster / Emirates Hospital Clinic (10 mins)'],
        beachOrParkMins: '5 mins to community park; 15 mins to coastline',
      },
      ongoingProjects: [`${name} Signature Residences`, `${name} Park Views`, `${name} Handover Phase`],
      future15YearOutlook: `Aligned with the Dubai 2040 Urban Master Plan, ${name} combines ${yieldPct}% gross rental yield with strong 24-bank APL mortgage liquidity over 2026–2041.`,
      closingKeywords: [`${yoyPct}% YoY Growth`, `${yieldPct}% Gross Yield`, '24-Bank APL Approved', '80% Expat / 85% National LTV', 'Dubai 2040 Corridor'],
      fieldVisitPitchScript: [
        `${name} is trading at AED ${p}/sqft (+${yoyPct}% YoY) with a verified ${yieldPct}% rental yield.`,
        'Our 24-bank LOS panel pre-approves this corridor within 48 hours for both Resident and Non-Resident buyers.',
        'Over the 15-year Dubai 2040 horizon, infrastructure expansion positions this community for 2x capital growth.',
      ],
    } satisfies DubaiAreaPulse;
  }),
];

export function syncDailyDldTransactions(db: DatabaseSync, actor: UserRecord) {
  const today = new Date().toISOString().slice(0, 10);
  const sampleFeed = [
    ['DHIL', 'Dubai Hills Estate', '4BR Park Villa', 'Ready Mortgage', 3920, 936_880_000, 2390, 'HSBC UAE'],
    ['PALM', 'Palm Jumeirah', '3BR Beachfront Apt', 'Ready Mortgage', 2650, 1_160_700_000, 4380, 'First Abu Dhabi Bank'],
    ['MARN', 'Dubai Marina', '2BR Full Marina View', 'Refinance Buyout', 1480, 338_920_000, 2290, 'Emirates NBD'],
    ['BBAY', 'Business Bay', '2BR Marasi Canal Suite', 'Off-Plan Oqood', 1360, 296_480_000, 2180, 'Dubai Islamic Bank'],
    ['JVC', 'Jumeirah Village Circle', '1BR Investor Suite', 'Ready Mortgage', 860, 122_120_000, 1420, 'ADCB'],
    ['DSOU', 'Dubai South & Expo City', '3BR Townhouse', 'Off-Plan Oqood', 2150, 277_350_000, 1290, 'Abu Dhabi Islamic Bank'],
  ] as const;

  let insertedCount = 0;
  const ins = db.prepare(
    `INSERT OR IGNORE INTO dld_market_transactions (
      tx_ref, tx_date, area_code, area_name, property_type, transaction_category, size_sqft, amount_fils, ppsf_aed, lender_bank
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );

  const stamp = Date.now().toString().slice(-5);
  for (let i = 0; i < sampleFeed.length; i++) {
    const [areaCode, areaName, propType, cat, sqft, fils, ppsf, bank] = sampleFeed[i];
    const ref = `DLD-${today}-${stamp}-${i + 1}`;
    const r = ins.run(ref, today, areaCode, areaName, propType, cat, sqft, fils, ppsf, bank);
    if (r.changes > 0) insertedCount += 1;
  }

  writeAuditLog(db, actor, 'dld_market_transactions', today, 'SYNC_DAILY_DLD_FEED', null, { insertedCount });
  return { date: today, insertedCount };
}

/**
 * Generates a real, camera-scannable ISO/IEC 18004 QR Code SVG (ECC Level M)
 * for the Betterway Mortgages LLC Reception Attendance Stand.
 */
export function generateReceptionStandQrSvg(scanUrl: string, darkColor = '#021125', lightColor = '#ffffff'): string {
  const qr = QRCode.create(scanUrl, { errorCorrectionLevel: 'M' });
  const size = qr.modules.size;
  const data = qr.modules.data;
  const margin = 4;
  const total = size + margin * 2;

  const paths: string[] = [];
  for (let r = 0; r < size; r++) {
    let runStart = -1;
    for (let c = 0; c <= size; c++) {
      const dark = c < size && Boolean(data[r * size + c]);
      if (dark && runStart === -1) {
        runStart = c;
      } else if (!dark && runStart !== -1) {
        const len = c - runStart;
        paths.push(`M${runStart + margin} ${r + margin}h${len}v1h-${len}z`);
        runStart = -1;
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" width="260" height="260" shape-rendering="crispEdges" role="img" aria-label="Betterway Mortgages LLC Reception Attendance QR Code"><rect width="${total}" height="${total}" rx="2" fill="${lightColor}" /><path d="${paths.join('')}" fill="${darkColor}" /></svg>`;
}

export interface OfficeWifiConfig {
  ssid: string;
  officeIp: string;
  strictIpLock: boolean;
}

export function getOfficeWifiConfig(db: DatabaseSync): OfficeWifiConfig {
  try {
    const row = db
      .prepare('SELECT office_wifi_ssid, office_wifi_ip, office_ip_locked FROM company_settings WHERE id = 1')
      .get() as { office_wifi_ssid?: string; office_wifi_ip?: string; office_ip_locked?: number } | undefined;
    return {
      ssid: row?.office_wifi_ssid?.trim() || 'Betterway-Office-5G',
      officeIp: row?.office_wifi_ip?.trim() || '',
      strictIpLock: Number(row?.office_ip_locked || 0) === 1,
    };
  } catch {
    return { ssid: 'Betterway-Office-5G', officeIp: '', strictIpLock: false };
  }
}

export function updateOfficeWifiLock(
  db: DatabaseSync,
  actor: UserRecord,
  input: { ssid?: string; officeIp?: string; strictIpLock: boolean },
): OfficeWifiConfig {
  if (!canPrintReceptionQr(actor)) {
    throw new ForbiddenError(
      'Only Owner (Shabib Siraj / Warda), Betterway Admin, or Team Manager (Daniel Xavier) can configure Office Wi-Fi IP lock.',
    );
  }
  const current = getOfficeWifiConfig(db);
  const ssid = input.ssid?.trim() || current.ssid;
  const officeIp = input.strictIpLock ? (input.officeIp?.trim() || current.officeIp) : (input.officeIp?.trim() ?? current.officeIp);
  if (input.strictIpLock && !officeIp) {
    throw new Error('Cannot enable strict Office Wi-Fi IP lock without a valid office public IP address.');
  }
  db.prepare(
    `UPDATE company_settings
     SET office_wifi_ssid = ?, office_wifi_ip = ?, office_ip_locked = ?, updated_at = datetime('now')
     WHERE id = 1`,
  ).run(ssid, officeIp, input.strictIpLock ? 1 : 0);

  writeAuditLog(db, actor, 'company_settings', 1, input.strictIpLock ? 'LOCK_OFFICE_WIFI_IP' : 'UNLOCK_OFFICE_WIFI_IP', current, {
    ssid,
    officeIp,
    strictIpLock: input.strictIpLock,
  });
  return { ssid, officeIp, strictIpLock: input.strictIpLock };
}

export function verifyAndRecordPublicQrCheckIn(
  db: DatabaseSync,
  input: {
    email: string;
    password: string;
    connectionType?: string;
    networkSsid?: string;
    qrStandCode?: string;
    deviceId?: string;
    clientIp?: string;
    checkInDate?: string;
    checkInTimeGst?: string;
  },
) {
  const conn = String(input.connectionType || 'wifi').toLowerCase();
  if (conn.includes('cellular') || conn === '3g' || conn === '2g' || conn === '4g' || conn === '5g-mobile') {
    throw new Error(
      'Anti-Loophole Network Gate: Cellular data check-in is blocked. Please connect your phone to the Betterway Mortgages Office Wi-Fi (Betterway-Office-5G) and scan again.',
    );
  }

  const wifiCfg = getOfficeWifiConfig(db);
  if (wifiCfg.strictIpLock && wifiCfg.officeIp && input.clientIp) {
    const cleanClientIp = input.clientIp.trim();
    if (cleanClientIp !== wifiCfg.officeIp) {
      throw new Error(
        `Office Wi-Fi IP Lock active: your connection IP (${cleanClientIp}) does not match the registered Betterway Office Wi-Fi gateway (${wifiCfg.ssid}). Connect to Office Wi-Fi and try again.`,
      );
    }
  }

  const normalizedEmail = normalizeLoginAlias(input.email);
  const user = db
    .prepare('SELECT * FROM users WHERE lower(email) = ?')
    .get(normalizedEmail) as (UserRecord & { password_hash: string; avatar_url?: string | null }) | undefined;

  if (!user) {
    recordLoginEvent(db, { email: normalizedEmail, outcome: 'NOT_FOUND', ip: input.clientIp });
    throw new Error('Invalid Betterway Mortgages email or password.');
  }

  const lockState = checkAccountLockout(db, user.id);
  if (lockState.locked) {
    recordLoginEvent(db, { userId: user.id, email: normalizedEmail, outcome: 'LOCKED', ip: input.clientIp });
    throw new Error(
      `Account temporarily locked after repeated failed attempts. Retry in ${Math.ceil(lockState.remainingSeconds / 60)} minute(s) or contact Owner Shabib Siraj.`,
    );
  }

  if (!verifyPassword(input.password, user.password_hash)) {
    const attempt = recordFailedLoginAttempt(db, user.id);
    recordLoginEvent(db, {
      userId: user.id,
      email: normalizedEmail,
      outcome: attempt.locked ? 'LOCKED' : 'BAD_PASSWORD',
      ip: input.clientIp,
    });
    throw new Error('Invalid Betterway Mortgages email or password.');
  }
  if (user.status !== 'ACTIVE') {
    recordLoginEvent(db, { userId: user.id, email: normalizedEmail, outcome: 'SUSPENDED', ip: input.clientIp });
    throw new Error('This staff account is currently suspended.');
  }

  clearFailedLogins(db, user.id);
  recordLoginEvent(db, { userId: user.id, email: normalizedEmail, outcome: 'SUCCESS', ip: input.clientIp });

  const deviceId = input.deviceId || 'BW-MOBILE-SCAN';
  try {
    db.prepare(
      `INSERT INTO staff_devices (user_id, device_id, label, last_ip, last_seen_at)
       VALUES (?, ?, 'Reception QR Device', ?, datetime('now'))
       ON CONFLICT(user_id, device_id) DO UPDATE SET
         last_ip = excluded.last_ip,
         last_seen_at = datetime('now')`,
    ).run(user.id, deviceId, input.clientIp || '127.0.0.1');
  } catch {
    // Non-fatal on older schemas
  }

  const rec = recordReceptionQrCheckIn(db, user, {
    checkInDate: input.checkInDate,
    checkInTimeGst: input.checkInTimeGst,
    networkSsid: input.networkSsid || wifiCfg.ssid,
    qrStandCode: input.qrStandCode || 'BW-RECEPTION-STAND-DXB-1',
    deviceId,
  });

  const empRow = db
    .prepare('SELECT designation, department, avatar_url FROM employees WHERE user_id = ?')
    .get(user.id) as { designation?: string; department?: string; avatar_url?: string | null } | undefined;

  const staffMeta = getStaffProfileByNameOrEmail(user.email);
  const avatarUrl =
    user.avatar_url || empRow?.avatar_url || staffMeta?.avatarUrl || getStaffAvatarUrl(user.full_name_en);

  return {
    ...rec,
    referenceNo: `BW-ATT-${rec.checkInDate.replace(/-/g, '')}-${String(rec.logId).padStart(4, '0')}`,
    employee: {
      userId: user.id,
      email: user.email,
      fullNameEn: user.full_name_en,
      role: user.role,
      designation: empRow?.designation || staffMeta?.designation || user.role,
      department: empRow?.department || staffMeta?.department || 'Operations',
      avatarUrl,
    },
  };
}

export function ingestWebsiteLeadToOs(
  db: DatabaseSync,
  input: {
    fullName: string;
    phone: string;
    email?: string;
    residency?: string;
    goal?: string;
    propertyValueAed?: number;
    downPaymentPct?: number;
    monthlyIncomeAed?: number;
    topic?: string;
    preferredSlot?: string;
    sourcePage?: string;
    reraOrn?: string;
    reraBrn?: string;
    agencyName?: string;
  },
) {
  const fullName = String(input.fullName || 'Website Client').trim();
  const phone = String(input.phone || '').trim();
  if (!fullName || !phone) {
    throw new Error('Full name and mobile phone number are required.');
  }

  const email = String(input.email || `${phone.replace(/\D/g, '') || 'enquiry'}@client.betterwaymortgages.com`)
    .trim()
    .toLowerCase();

  // Pick advisor from official Betterway advisory team (Daniel Xavier, Reshma Rajan, Asif Khan)
  const advisorCandidates = db
    .prepare(
      `SELECT id, email, full_name_en, avatar_url FROM users
       WHERE email IN ('daniel@betterwaymortgages.com', 'reshma@betterwaymortgages.com', 'asif@betterwaymortgages.com')
         AND status = 'ACTIVE'
       ORDER BY id ASC`,
    )
    .all() as Array<{ id: number; email: string; full_name_en: string; avatar_url: string | null }>;

  let chosenAdvisor = advisorCandidates[0];
  if (advisorCandidates.length > 0) {
    const countRow = db.prepare('SELECT COUNT(*) as c FROM leads').get() as { c: number };
    chosenAdvisor = advisorCandidates[countRow.c % advisorCandidates.length]!;
  } else {
    chosenAdvisor = db
      .prepare("SELECT id, email, full_name_en, avatar_url FROM users WHERE status = 'ACTIVE' ORDER BY id ASC LIMIT 1")
      .get() as { id: number; email: string; full_name_en: string; avatar_url: string | null };
  }

  const residencyRaw = String(input.residency || 'Expat resident').toUpperCase();
  const segment = residencyRaw.includes('NATIONAL')
    ? 'UAE_NATIONAL'
    : residencyRaw.includes('NON')
      ? 'NON_RESIDENT'
      : 'RESIDENT_SALARIED';
  const residencyType = residencyRaw.includes('NATIONAL')
    ? 'UAE_NATIONAL'
    : residencyRaw.includes('GCC')
      ? 'GCC_NATIONAL'
      : residencyRaw.includes('NON')
        ? 'NON_RESIDENT'
        : 'EXPAT_RESIDENT';

  const priceAed = Math.max(0, Number(input.propertyValueAed || 2_500_000));
  const incomeAed = Math.max(0, Number(input.monthlyIncomeAed || 45_000));
  const salaryFils = Math.round(incomeAed * 100);
  const priceFils = Math.round(priceAed * 100);

  const hhId = Number(
    db
      .prepare('INSERT INTO households (primary_name, segment) VALUES (?, ?)')
      .run(fullName, segment).lastInsertRowid,
  );

  db.prepare(
    `INSERT INTO applicants (
      household_id, applicant_role, full_name_en, email, phone,
      nationality_code, residence_country, residency_type, employment_type,
      employer_name, basic_salary_fils
    ) VALUES (?, 'PRIMARY', ?, ?, ?, 'AE', 'AE', ?, 'SALARIED', ?, ?)`,
  ).run(
    hhId,
    fullName,
    email,
    phone,
    residencyType,
    input.agencyName || 'Website Enquiry',
    salaryFils,
  );

  const slaDue = new Date(Date.now() + 5 * 60_000).toISOString();
  const campaignName = [
    input.topic || 'Website Mortgage Enquiry',
    input.goal ? `Goal: ${input.goal}` : '',
    input.preferredSlot ? `Slot: ${input.preferredSlot}` : '',
    input.sourcePage ? `Page: ${input.sourcePage}` : '',
  ]
    .filter(Boolean)
    .join(' · ');

  const goalUpper = String(input.goal || '').toUpperCase();
  const txType = goalUpper.includes('OFF-PLAN') || goalUpper.includes('HANDOVER')
    ? 'OFFPLAN_HANDOVER'
    : goalUpper.includes('SWITCH') || goalUpper.includes('BUYOUT')
      ? 'BUYOUT'
      : goalUpper.includes('EQUITY')
        ? 'EQUITY_RELEASE'
        : goalUpper.includes('COMMERCIAL')
          ? 'COMMERCIAL'
          : 'READY_PURCHASE';
  const desk =
    residencyType === 'NON_RESIDENT'
      ? 'NON_RESIDENT_DESK'
      : txType === 'OFFPLAN_HANDOVER'
        ? 'HANDOVER_DESK'
        : txType === 'COMMERCIAL'
          ? 'COMMERCIAL_DESK'
          : 'RESIDENT_DESK';

  const leadId = Number(
    db
      .prepare(
        `INSERT INTO leads (
          household_id, contact_name, contact_phone, contact_email, source_channel,
          assigned_advisor_id, desk, transaction_type, target_property_fils,
          calculator_snapshot_json, stage, first_response_due_at, client_consent_logged_at
        ) VALUES (?, ?, ?, ?, 'WEBSITE_CALC', ?, ?, ?, ?, ?, 'NEW', ?, datetime('now'))`,
      )
      .run(
        hhId,
        fullName,
        phone,
        email,
        chosenAdvisor?.id ?? null,
        desk,
        txType,
        priceFils,
        JSON.stringify({
          topic: input.topic,
          goal: input.goal,
          residency: input.residency,
          propertyValueAed: priceAed,
          downPaymentPct: input.downPaymentPct ?? 20,
          monthlyIncomeAed: incomeAed,
          preferredSlot: input.preferredSlot ?? null,
          sourcePage: input.sourcePage ?? '/',
        }),
        slaDue,
      ).lastInsertRowid,
  );

  // Log omnichannel message & follow-up task if consultation slot requested
  db.prepare(
    `INSERT INTO comm_messages (lead_id, channel, direction, sender_name, body, internal_only)
     VALUES (?, 'WHATSAPP', 'INBOUND', ?, ?, 0)`,
  ).run(
    leadId,
    fullName,
    `Website enquiry (${campaignName}) — Property AED ${priceAed.toLocaleString('en-US')}`,
  );

  if (input.preferredSlot) {
    db.prepare(
      `INSERT INTO ops_tasks (assigned_role, priority, title, due_at, status)
       VALUES ('SALES_ADVISOR', 'HIGH', ?, ?, 'OPEN')`,
    ).run(
      `Website Consultation Slot (${input.preferredSlot}) — ${fullName} (${phone})`,
      slaDue,
    );
  }

  const refCode = `BW-ENQ-${new Date().getFullYear()}-${String(leadId).padStart(4, '0')}`;
  const staffProfile = getStaffProfileByNameOrEmail(chosenAdvisor?.email);

  return {
    referenceCode: refCode,
    leadId,
    householdId: hhId,
    assignedAdvisor: {
      id: chosenAdvisor?.id ?? 0,
      email: chosenAdvisor?.email ?? 'daniel@betterwaymortgages.com',
      fullNameEn: chosenAdvisor?.full_name_en ?? 'Daniel Xavier',
      designation: staffProfile?.designation ?? 'Team Manager & Mortgage Advisor',
      avatarUrl:
        chosenAdvisor?.avatar_url ||
        staffProfile?.avatarUrl ||
        '/staff/daniel-xavier.jpg',
    },
  };
}
