import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/session';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { createOwnerApproval } from '@/lib/auth/approvals';
import { generateGoAmlXml } from '@/lib/compliance/statutory';

export async function GET(req: Request) {
  const auth = await requireSession();
  if ('error' in auth) return auth.error;
  if (auth.user.role !== 'OWNER' && auth.user.role !== 'OFFICE_ADMIN') {
    return NextResponse.json({ error: 'FORBIDDEN: Compliance & Audit Shield is restricted to Owners & Office Admin.' }, { status: 403 });
  }
  const url = new URL(req.url);
  const goamlId = url.searchParams.get('goamlId');
  const db = await getSupabaseAdmin();

  if (goamlId) {
    const { data: chk } = await db.from('compliance_checks').select('*').eq('id', goamlId).single();
    const xml = generateGoAmlXml({
      reportId: chk?.id || goamlId,
      subjectName: chk?.subject_name || 'Subject',
      reason: chk?.evidence_note || 'UAE FIU STR compliance report',
    });
    return new NextResponse(xml, {
      headers: { 'Content-Type': 'application/xml', 'Content-Disposition': `attachment; filename="goAML-${goamlId.slice(0, 8)}.xml"` },
    });
  }

  const [checks, sanctions, deleteBin, audits] = await Promise.all([
    db.from('compliance_checks').select('*').order('created_at', { ascending: false }).limit(80),
    db.from('sanctions_entries').select('*').order('imported_at', { ascending: false }).limit(50),
    db.from('delete_bin_requests').select('*').order('created_at', { ascending: false }).limit(50),
    db.from('audit_events').select('*').order('created_at', { ascending: false }).limit(120),
  ]);

  // Strictly isolate Owner Privacy Fast Track audit rows from non-Owners AND protect single-owner locked events
  const safeAudits = (audits.data ?? []).filter((a) => {
    const isFastTrack =
      String(a.entity_table || '').startsWith('privacy_fast_track') ||
      String(a.action || '').includes('FAST_TRACK');
    if (!isFastTrack) return true;
    if (auth.user.role !== 'OWNER') return false;
    const details = (a.details || {}) as { privateToMeOnly?: boolean };
    if (details.privateToMeOnly && a.actor_id && a.actor_id !== auth.user.id) return false;
    return true;
  });

  return NextResponse.json({
    checks: checks.data ?? [],
    sanctions: sanctions.data ?? [],
    deleteBin: deleteBin.data ?? [],
    audits: safeAudits.slice(0, 80),
  });
}

export async function POST(req: Request) {
  const auth = await requireSession();
  if ('error' in auth) return auth.error;
  if (auth.user.role !== 'OWNER' && auth.user.role !== 'OFFICE_ADMIN') {
    return NextResponse.json({ error: 'FORBIDDEN: Compliance actions are restricted to Owners & Office Admin.' }, { status: 403 });
  }
  try {
    const body = await req.json();
    const db = await getSupabaseAdmin();

    if (body.kind === 'sanctions_import') {
      const names = String(body.rawNames || '')
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter(Boolean);
      const { data, error } = await db
        .from('sanctions_entries')
        .insert(names.map((n) => ({ list_source: body.source || 'UAE EOCN / UN', full_name: n, imported_by: auth.user.id })))
        .select('*');
      if (error) throw new Error(error.message);
      return NextResponse.json({ ok: true, imported: (data ?? []).length }, { status: 201 });
    }

    if (body.kind === 'delete_bin') {
      const { data: delReq, error } = await db
        .from('delete_bin_requests')
        .insert({
          entity_table: body.entityTable,
          entity_id: body.entityId,
          record_label: body.recordLabel,
          reason: body.reason,
          requested_by: auth.user.id,
          status: 'PENDING_DUAL_APPROVAL',
        })
        .select('*')
        .single();
      if (error || !delReq) throw new Error(error?.message || 'Delete request failed');

      const approval = await createOwnerApproval({
        approvalKind: 'DELETE_PURGE',
        referenceTable: 'delete_bin_requests',
        referenceId: delReq.id,
        title: `Permanent Delete Purge: ${body.recordLabel}`,
        summary: `Requested by ${auth.user.name} — Reason: ${body.reason}. Requires 2-of-2 Owner sign-off (Warda + Shabib).`,
        requestedBy: auth.user.id,
      });
      await db.from('delete_bin_requests').update({ approval_id: approval.id }).eq('id', delReq.id);
      return NextResponse.json({ ok: true, deleteRequest: delReq, approval }, { status: 201 });
    }

    // Screen subject against imported sanctions list
    const cleanSubject = String(body.subjectName || '').trim();
    if (cleanSubject.length < 2) {
      return NextResponse.json({ error: 'Subject name must be at least 2 characters.' }, { status: 400 });
    }
    const { data: list } = await db.from('sanctions_entries').select('full_name');
    const q = cleanSubject.toLowerCase();
    const hit = (list ?? []).find((s) => s.full_name.toLowerCase().includes(q) || q.includes(s.full_name.toLowerCase()));
    const allowedTypes = new Set(['KFS_SIGN', 'SANCTIONS_SCREEN', 'PDPL_CONSENT', 'GOAML_STR']);
    const safeType = allowedTypes.has(String(body.checkType)) ? String(body.checkType) : 'SANCTIONS_SCREEN';
    const { data: chk, error } = await db
      .from('compliance_checks')
      .insert({
        check_type: safeType,
        subject_name: cleanSubject,
        status: hit ? 'Flagged' : 'Cleared',
        match_score: hit ? 92 : 0,
        evidence_note: hit ? `Potential match against watchlist entry: ${hit.full_name}` : 'Zero match across UAE EOCN / UN list',
        reviewed_by: auth.user.id,
      })
      .select('*')
      .single();
    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true, check: chk }, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Compliance action failed' }, { status: 400 });
  }
}
