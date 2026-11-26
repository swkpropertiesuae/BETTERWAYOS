import { NextResponse } from 'next/server';
import { requireOwner } from '@/lib/auth/session';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { PIPELINE_STAGES } from '@/lib/domain/workflow';
import {
  listFastTrackJobs,
  listFastTrackInvoices,
  listFastTrackDocs,
  getOwnerConsolidatedVatSummary,
} from '@/lib/executive/service';

export async function GET() {
  const auth = await requireOwner();
  if ('error' in auth) return auth.error;

  const db = await getSupabaseAdmin();
  const [jobs, ftInvoices, ftDocs, consolidatedVat, casesRes, approvalsRes, masterReqsRes] = await Promise.all([
    listFastTrackJobs(auth.user),
    listFastTrackInvoices(auth.user),
    listFastTrackDocs(auth.user),
    getOwnerConsolidatedVatSummary(auth.user),
    db.from('mortgage_cases').select('*').eq('deleted_soft', false).order('updated_at', { ascending: false }),
    db.from('owner_approvals').select('*').in('status', ['PENDING', 'OWNER_1_APPROVED']).order('created_at', { ascending: false }),
    db.from('master_change_requests').select('*').eq('status', 'PENDING').order('created_at', { ascending: false }),
  ]);

  const cases = casesRes.data ?? [];
  const stageCounts = PIPELINE_STAGES.map((st) => {
    const stageCases = cases.filter((c) => c.stage_code === st.code);
    const ftStageJobs = jobs.filter((j) => j.stage_code === st.code);
    const totalLoanAed =
      stageCases.reduce((s, c) => s + Number(c.requested_loan_aed || 0), 0) +
      ftStageJobs.reduce((s, j) => s + Number(j.loan_amount_aed || 0), 0);
    return {
      ...st,
      standardCount: stageCases.length,
      fastTrackCount: ftStageJobs.length,
      totalCount: stageCases.length + ftStageJobs.length,
      totalLoanAed,
      cases: stageCases,
      fastTrackJobs: ftStageJobs,
    };
  });

  const urgentCashTotalAed = jobs
    .filter((j) => j.cash_status !== 'COLLECTED')
    .reduce((s, j) => s + Number(j.expected_fee_aed || 0), 0);

  return NextResponse.json({
    owner: auth.user,
    stageCounts,
    fastTrackJobs: jobs,
    fastTrackInvoices: ftInvoices,
    fastTrackDocs: ftDocs,
    urgentCashTotalAed,
    pendingApprovals: approvalsRes.data ?? [],
    pendingMasterRequests: masterReqsRes.data ?? [],
    consolidatedVat,
  });
}
