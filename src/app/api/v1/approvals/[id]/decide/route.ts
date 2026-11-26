import { NextResponse } from 'next/server';
import { requireOwner } from '@/lib/auth/session';
import { decideOwnerApproval } from '@/lib/auth/approvals';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireOwner();
  if ('error' in auth) return auth.error;

  const { id } = await ctx.params;
  try {
    const body = (await req.json()) as { decision?: 'APPROVED' | 'REJECTED'; note?: string };
    const decision = body.decision === 'REJECTED' ? 'REJECTED' : 'APPROVED';
    const updated = await decideOwnerApproval(id, auth.user, decision, body.note || '');

    // Sync downstream records when finalized
    const db = await getSupabaseAdmin();
    if (updated.reference_table === 'payout_requests') {
      const nextStatus =
        updated.status === 'APPROVED'
          ? 'READY_TO_PAY'
          : updated.status === 'OWNER_1_APPROVED'
            ? 'OWNER_1_APPROVED'
            : 'REJECTED';
      await db.from('payout_requests').update({ status: nextStatus }).eq('id', updated.reference_id);
    } else if (updated.reference_table === 'delete_bin_requests' && updated.status === 'APPROVED') {
      const { data: delReq } = await db
        .from('delete_bin_requests')
        .select('*')
        .eq('id', updated.reference_id)
        .maybeSingle();
      const allowedPurgeTables = new Set(['leads', 'mortgage_cases', 'case_documents', 'contacts']);
      if (delReq && allowedPurgeTables.has(delReq.entity_table)) {
        if (delReq.entity_table === 'case_documents') {
          const { data: docRow } = await db
            .from('case_documents')
            .select('storage_path')
            .eq('id', delReq.entity_id)
            .maybeSingle();
          if (docRow?.storage_path) {
            await db.storage.from('client-vault').remove([docRow.storage_path]);
          }
          await db.from('case_documents').delete().eq('id', delReq.entity_id);
        } else if (delReq.entity_table === 'leads' || delReq.entity_table === 'mortgage_cases') {
          await db.from(delReq.entity_table).delete().eq('id', delReq.entity_id);
        } else if (delReq.entity_table === 'contacts') {
          await db.from('contacts').delete().eq('id', delReq.entity_id);
        }
      }
      await db
        .from('delete_bin_requests')
        .update({ status: 'PURGED', purged_at: new Date().toISOString() })
        .eq('id', updated.reference_id);
    } else if (updated.reference_table === 'word_documents' && updated.status === 'APPROVED') {
      await db
        .from('word_documents')
        .update({ seal_status: 'Sealed', sealed_by: auth.user.id, sealed_at: new Date().toISOString() })
        .eq('id', updated.reference_id);
    }

    return NextResponse.json({ ok: true, approval: updated });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Approval error';
    const status = msg.includes('DUPLICATE_OWNER_APPROVAL') ? 409 : 400;
    return NextResponse.json({ error: msg }, { status });
  }
}
