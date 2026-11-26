import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/session';
import { getCapabilitiesForRole } from '@/lib/auth/rbac';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { PIPELINE_STAGES } from '@/lib/domain/workflow';
import { EIBOR_SNAPSHOT } from '@/lib/domain/banks';
import { maskPhoneForRole } from '@/lib/auth/masking';

export async function GET() {
  const auth = await requireSession();
  if ('error' in auth) return auth.error;

  const db = await getSupabaseAdmin();
  const caps = getCapabilitiesForRole(auth.user.role);
  const todayDubai = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dubai' }).format(new Date());

  let casesQ = db.from('mortgage_cases').select('*').eq('deleted_soft', false);
  let leadsQ = db.from('leads').select('*').eq('deleted_soft', false);
  if (caps.pipelineScope === 'OWN') {
    casesQ = casesQ.eq('advisor_id', auth.user.id);
    leadsQ = leadsQ.eq('assigned_to', auth.user.id);
  }

  const [
    casesRes,
    leadsRes,
    tasksRes,
    notifsRes,
    attendanceRes,
    fieldRes,
    approvalsRes,
    usersRes,
    eventsRes,
  ] = await Promise.all([
    caps.pipelineScope === 'NONE' ? Promise.resolve({ data: [] }) : casesQ,
    caps.pipelineScope === 'NONE' ? Promise.resolve({ data: [] }) : leadsQ.order('created_at', { ascending: false }).limit(200),
    db.from('tasks').select('*').order('due_date', { ascending: true }).limit(200),
    db.from('notifications').select('*').eq('recipient_user_id', auth.user.id).order('created_at', { ascending: false }).limit(30),
    db.from('attendance_events').select('*').eq('attendance_date_dubai', todayDubai).order('created_at', { ascending: false }),
    db.from('field_visits').select('*').in('status', ['ACTIVE', 'SOS']).order('started_at', { ascending: false }),
    auth.user.isOwner
      ? db.from('owner_approvals').select('id,approval_kind,approval_mode,title,status').in('status', ['PENDING', 'OWNER_1_APPROVED'])
      : Promise.resolve({ data: [] }),
    db.from('users').select('id,emp_code,name,designation,department,role,avatar_url,portrait_url,initials,monthly_target_aed').eq('active', true),
    db.from('calendar_events').select('*').eq('status', 'Scheduled').order('starts_at', { ascending: true }).limit(15),
  ]);

  const cases = casesRes.data ?? [];
  const leads = leadsRes.data ?? [];
  const allTasks = tasksRes.data ?? [];
  const myTasks = allTasks.filter((t) => t.assigned_to === auth.user.id);
  const staffList = usersRes.data ?? [];

  const stageCounts = PIPELINE_STAGES.map((st) => {
    const items = cases.filter((c) => c.stage_code === st.code);
    return {
      code: st.code,
      order: st.order,
      label: st.label,
      shortLabel: st.shortLabel,
      count: items.length,
      loanVolumeAed: items.reduce((s, c) => s + Number(c.requested_loan_aed || 0), 0),
      accentHex: st.accentHex,
    };
  });

  const loanBookAed = cases.reduce((s, c) => s + Number(c.requested_loan_aed || 0), 0);
  const expectedDsaAed = Math.round(
    cases.reduce((s, c) => s + (Number(c.requested_loan_aed || 0) * Number(c.dsa_rate_pct || 0.85)) / 100, 0),
  );
  const todayEnquiries = leads.filter((l) => l.received_date_dubai === todayDubai);
  const checkedInUserIds = new Set((attendanceRes.data ?? []).filter((a) => a.event_kind === 'CHECK_IN').map((a) => a.user_id));

  const teamTaskSummary = staffList.map((s) => {
    const stTasks = allTasks.filter((t) => t.assigned_to === s.id);
    return {
      userId: s.id,
      name: s.name,
      designation: s.designation,
      avatarUrl: s.avatar_url,
      initials: s.initials,
      openCount: stTasks.filter((t) => t.status !== 'Done').length,
      criticalCount: stTasks.filter((t) => t.status !== 'Done' && t.priority === 'Critical').length,
      doneCount: stTasks.filter((t) => t.status === 'Done').length,
      checkedInToday: checkedInUserIds.has(s.id),
    };
  });

  const assignedClients = leads.slice(0, 12).map((l) => ({
    id: l.id,
    referenceCode: l.reference_code,
    contactName: l.contact_name,
    phoneDisplay: maskPhoneForRole(l.contact_phone, auth.user, false),
    sourceChannel: l.source_channel,
    referrerName: l.referrer_name || l.partner_agency || 'Direct',
    assignedTo: l.assigned_to,
    propertyPriceAed: Number(l.property_price_aed || 0),
    status: l.status,
    receivedDateDubai: l.received_date_dubai,
  }));

  return NextResponse.json({
    user: auth.user,
    todayDubai,
    kpis: {
      loanBookAed,
      expectedDsaAed,
      activeCasesCount: cases.length,
      totalLeadsCount: leads.length,
      todayEnquiriesCount: todayEnquiries.length,
      checkedInCount: checkedInUserIds.size,
      totalStaffCount: staffList.length,
      activeFieldVisitsCount: (fieldRes.data ?? []).length,
      pendingApprovalsCount: (approvalsRes.data ?? []).length,
      eibor3m: EIBOR_SNAPSHOT.latest.threeMonth,
    },
    stageCounts,
    myTasks,
    teamTaskSummary,
    assignedClients,
    upcomingDeadlines: eventsRes.data ?? [],
    activeFieldVisits: fieldRes.data ?? [],
    criticalAlerts: notifsRes.data ?? [],
    pendingApprovals: approvalsRes.data ?? [],
  });
}
