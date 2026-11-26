import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/session';
import { getCapabilitiesForRole } from '@/lib/auth/rbac';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { createCaseVaultUploadUrl } from '@/lib/pipeline/service';

export async function GET(req: Request) {
  const auth = await requireSession();
  if ('error' in auth) return auth.error;
  const caps = getCapabilitiesForRole(auth.user.role);
  const url = new URL(req.url);
  const caseId = url.searchParams.get('caseId');
  const db = await getSupabaseAdmin();

  let caseQ = db
    .from('mortgage_cases')
    .select('id,case_code,borrower_name,borrower_profile,stage_code,community,advisor_id')
    .eq('deleted_soft', false)
    .order('updated_at', { ascending: false });
  if (caps.pipelineScope === 'OWN') caseQ = caseQ.eq('advisor_id', auth.user.id);
  const { data: cases } = await caseQ.limit(100);

  const selectedId = caseId || cases?.[0]?.id || null;
  let documents: any[] = [];
  if (selectedId) {
    const { data: docs } = await db
      .from('case_documents')
      .select('*')
      .eq('case_id', selectedId)
      .order('doc_category', { ascending: true });
    documents = docs ?? [];
  }

  return NextResponse.json({ cases: cases ?? [], selectedCaseId: selectedId, documents });
}

export async function POST(req: Request) {
  const auth = await requireSession();
  if ('error' in auth) return auth.error;
  try {
    const body = (await req.json()) as {
      action: 'upload_url' | 'verify' | 'download_url';
      docId: string;
      fileName?: string;
      status?: 'Verified' | 'Rejected';
      notes?: string;
    };
    const db = await getSupabaseAdmin();
    if (body.action === 'upload_url') {
      const signed = await createCaseVaultUploadUrl(body.docId, body.fileName || 'document.pdf', auth.user);
      return NextResponse.json({ ok: true, ...signed });
    }
    if (body.action === 'download_url') {
      const { data: doc } = await db.from('case_documents').select('storage_path').eq('id', body.docId).single();
      if (!doc?.storage_path) return NextResponse.json({ error: 'No file uploaded yet' }, { status: 404 });
      const { data: signed, error } = await db.storage.from('client-vault').createSignedUrl(doc.storage_path, 300);
      if (error || !signed) throw new Error(error?.message || 'Unable to sign download');
      return NextResponse.json({ ok: true, signedUrl: signed.signedUrl });
    }
    const { data: updated, error } = await db
      .from('case_documents')
      .update({
        status: body.status || 'Verified',
        verified_by: auth.user.id,
        verified_at: new Date().toISOString(),
        notes: body.notes || '',
      })
      .eq('id', body.docId)
      .select('*')
      .single();
    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true, document: updated });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Vault action failed' }, { status: 400 });
  }
}
