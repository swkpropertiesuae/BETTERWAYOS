import { getDb } from '@/server/db';
import { requireStaffUser } from '@/server/auth/request';
import { OFFICIAL_STAFF_DIRECTORY } from '@/lib/staff-directory';
import { canPrintReceptionQr, isSupremeOwner } from '@/server/engines/swk-enterprise-engine';
import { BetterwayOsDashboard, type ExecutiveDashboardData } from '@/components/betterway-os-dashboard';

export const dynamic = 'force-dynamic';

export default async function ExecutiveOverviewPage() {
  const user = await requireStaffUser();
  const db = getDb();

  const now = new Date();
  const todayGst = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Dubai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
  const hourGst = Number(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Dubai',
      hour: '2-digit',
      hour12: false,
    }).format(now),
  );
  const greeting = hourGst < 12 ? 'Good morning' : hourGst < 17 ? 'Good afternoon' : 'Good evening';
  const dubaiDateLabel = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Dubai',
    weekday: 'long',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(now);

  const dealsAgg = db
    .prepare(
      `SELECT COUNT(*) as c, COALESCE(SUM(target_loan_fils), 0) as total
       FROM deals WHERE origin_mode = 'LIVE' AND stage NOT IN ('DECLINED', 'WITHDRAWN')`,
    )
    .get() as { c: number; total: number };

  const activeLeadsCount = (
    db.prepare("SELECT COUNT(*) as c FROM leads WHERE stage NOT IN ('DISQUALIFIED')").get() as { c: number }
  ).c;
  const websiteLeadsCount = (
    db.prepare("SELECT COUNT(*) as c FROM leads WHERE source_channel = 'WEBSITE_CALC'").get() as { c: number }
  ).c;
  const openTasksCount = (
    db.prepare("SELECT COUNT(*) as c FROM ops_tasks WHERE status = 'OPEN'").get() as { c: number }
  ).c;
  const pendingBinCount = (
    db.prepare("SELECT COUNT(*) as c FROM recycle_bin_requests WHERE status = 'PENDING'").get() as { c: number }
  ).c;
  const pendingDecisionsCount = (
    db.prepare("SELECT COUNT(*) as c FROM manager_admin_decisions WHERE status = 'PENDING'").get() as { c: number }
  ).c;
  const pendingRatesCount = (
    db.prepare("SELECT COUNT(*) as c FROM bank_rate_cards WHERE status = 'PENDING_APPROVAL'").get() as { c: number }
  ).c;
  const openContemptorsCount = (
    db.prepare("SELECT COUNT(*) as c FROM late_contemptor_alerts WHERE alert_status = 'OPEN'").get() as { c: number }
  ).c;
  const banksCount = (db.prepare('SELECT COUNT(*) as c FROM banks').get() as { c: number }).c;

  const latestEibor = db
    .prepare('SELECT fixing_date, three_month_micro FROM eibor_fixings ORDER BY fixing_date DESC LIMIT 1')
    .get() as { fixing_date: string; three_month_micro: number } | undefined;

  const recentLeadsRows = db
    .prepare(
      `SELECT l.id, l.contact_name, l.contact_phone, l.source_channel, l.transaction_type,
              l.target_property_fils, l.stage, l.created_at,
              COALESCE(u.full_name_en, 'Unassigned') as advisor_name
       FROM leads l
       LEFT JOIN users u ON u.id = l.assigned_advisor_id
       ORDER BY l.id DESC
       LIMIT 6`,
    )
    .all() as Array<{
    id: number;
    contact_name: string;
    contact_phone: string;
    source_channel: string;
    transaction_type: string;
    target_property_fils: number;
    stage: string;
    created_at: string;
    advisor_name: string;
  }>;

  const recentDealsRows = db
    .prepare(
      `SELECT d.id, d.deal_ref, h.primary_name as borrower_name, d.community_name,
              d.target_loan_fils, d.stage, COALESCE(b.short_name, 'Panel') as bank_name
       FROM deals d
       JOIN households h ON h.id = d.household_id
       LEFT JOIN banks b ON b.id = d.selected_bank_id
       WHERE d.origin_mode = 'LIVE'
       ORDER BY d.id DESC
       LIMIT 5`,
    )
    .all() as Array<{
    id: number;
    deal_ref: string;
    borrower_name: string;
    community_name: string;
    target_loan_fils: number;
    stage: string;
    bank_name: string;
  }>;

  const todayCheckIns = db
    .prepare(
      `SELECT lower(email) as email, check_in_time_gst, status
       FROM office_attendance_logs
       WHERE check_in_date = ?
       ORDER BY id DESC`,
    )
    .all(todayGst) as Array<{ email: string; check_in_time_gst: string; status: string }>;

  const checkInByEmail = new Map<string, { time: string; status: string }>();
  for (const row of todayCheckIns) {
    if (!checkInByEmail.has(row.email)) {
      checkInByEmail.set(row.email, { time: row.check_in_time_gst, status: row.status });
    }
  }

  const teamRoster = OFFICIAL_STAFF_DIRECTORY.map((s) => {
    const ci = checkInByEmail.get(s.email.toLowerCase());
    return {
      email: s.email,
      fullName: s.fullNameEn,
      designation: s.designation,
      department: s.department,
      role: s.role,
      tier: s.tier,
      avatarUrl: s.avatarUrl,
      portrait8kUrl: s.portrait8kUrl,
      checkedInToday: Boolean(ci),
      checkInTimeGst: ci?.time ?? null,
      checkInStatus: ci?.status ?? null,
    };
  });

  const data: ExecutiveDashboardData = {
    user: {
      fullName: user.full_name_en,
      email: user.email,
      role: user.role,
      isOwner: isSupremeOwner(user),
      canPrintQr: canPrintReceptionQr(user),
    },
    dubaiDateLabel,
    greeting,
    metrics: {
      activeDealsCount: dealsAgg.c,
      activePipelineAed: Math.round(dealsAgg.total / 100),
      activeLeadsCount,
      websiteLeadsCount,
      eibor3mPct: ((latestEibor?.three_month_micro ?? 420_677) / 100_000).toFixed(2),
      eiborDate: latestEibor?.fixing_date ?? todayGst,
      checkedInTodayCount: checkInByEmail.size,
      totalStaffCount: OFFICIAL_STAFF_DIRECTORY.length,
      pendingBinCount,
      pendingDecisionsCount,
      pendingRatesCount,
      openContemptorsCount,
      openTasksCount,
      banksCount,
    },
    recentLeads: recentLeadsRows.map((l) => ({
      id: l.id,
      contactName: l.contact_name,
      contactPhone: l.contact_phone,
      sourceChannel: l.source_channel,
      transactionType: l.transaction_type,
      targetPropertyAed: Math.round(l.target_property_fils / 100),
      stage: l.stage,
      advisorName: l.advisor_name,
      createdAt: l.created_at,
    })),
    recentDeals: recentDealsRows.map((d) => ({
      id: d.id,
      dealRef: d.deal_ref,
      borrowerName: d.borrower_name,
      communityName: d.community_name,
      targetLoanAed: Math.round(d.target_loan_fils / 100),
      stage: d.stage,
      bankName: d.bank_name,
    })),
    teamRoster,
  };

  return <BetterwayOsDashboard data={data} />;
}
