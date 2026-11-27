import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/session';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { logAudit } from '@/lib/auth/approvals';
import { getFieldVerifiers, isFieldVerificationAuthority } from '@/lib/workspace/verifiers';

export async function GET(req: Request) {
  const auth = await requireSession();
  if ('error' in auth) return auth.error;

  const url = new URL(req.url);
  const reportType = url.searchParams.get('reportType');
  const verificationStatus = url.searchParams.get('verificationStatus');
  const outcome = url.searchParams.get('outcome');

  const [db, isVerifier, verifiers] = await Promise.all([
    getSupabaseAdmin(),
    isFieldVerificationAuthority(auth.user),
    getFieldVerifiers(),
  ]);

  let q = db.from('forensic_field_reports').select('*').order('created_at', { ascending: false }).limit(150);
  if (!isVerifier) {
    q = q.eq('submitted_by_user_id', auth.user.id);
  }
  if (reportType && reportType !== 'ALL') q = q.eq('report_type', reportType);
  if (verificationStatus && verificationStatus !== 'ALL') q = q.eq('verification_status', verificationStatus);
  if (outcome && outcome !== 'ALL') q = q.eq('outcome', outcome);

  const [{ data: reports, error }, { data: myTasks }] = await Promise.all([
    q,
    db.from('tasks').select('*').eq('assigned_to', auth.user.id).order('due_date', { ascending: true }).limit(40),
  ]);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({
    isVerifier,
    verifiers,
    myTasks: myTasks ?? [],
    reports: reports ?? [],
  });
}

export async function POST(req: Request) {
  const auth = await requireSession();
  if ('error' in auth) return auth.error;

  try {
    const body = await req.json();
    const db = await getSupabaseAdmin();

    // 1. Authority Verification Action (Owners OR Owner-Assigned Verification Authorities ONLY)
    if (body.action === 'verify') {
      const allowed = await isFieldVerificationAuthority(auth.user);
      if (!allowed) {
        return NextResponse.json(
          { error: 'FORBIDDEN: Only Owners (Warda / Shabib) or Owner-assigned Verification Authorities can verify reports.' },
          { status: 403 },
        );
      }
      const reportId = String(body.reportId || '');
      const status = ['Verified', 'Flagged', 'Rejected'].includes(body.verificationStatus)
        ? body.verificationStatus
        : 'Verified';
      const notes = String(body.verificationNotes || '');

      const { data: updated, error } = await db
        .from('forensic_field_reports')
        .update({
          verification_status: status,
          verified_by_user_id: auth.user.id,
          verified_by_name: auth.user.name,
          verified_at: new Date().toISOString(),
          verification_notes: notes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', reportId)
        .select('*')
        .single();
      if (error || !updated) throw new Error(error?.message || 'Report not found');

      await db.from('notifications').insert({
        recipient_user_id: updated.submitted_by_user_id,
        title: `Forensic Report ${updated.report_no}: ${status}`,
        body: `${auth.user.name} marked your ${updated.report_type} (${updated.building_or_project || updated.community}) as ${status}. ${notes}`,
        severity: status === 'Verified' ? 'info' : 'warning',
        href: '/os/field-gps',
      });
      await logAudit(auth.user, 'forensic_field_reports', updated.id, 'FORENSIC_REPORT_VERIFIED', {
        reportNo: updated.report_no,
        status,
      });
      return NextResponse.json({ ok: true, report: updated });
    }

    // 2. Staff Own-Task Toggle (scoped strictly to auth.user.id)
    if (body.action === 'toggle_my_task') {
      const taskId = String(body.taskId || '');
      const nextStatus = body.status === 'Done' ? 'Done' : body.status === 'In Progress' ? 'In Progress' : 'Todo';
      const { data: existing } = await db.from('tasks').select('id,assigned_to').eq('id', taskId).maybeSingle();
      if (!existing || (existing.assigned_to !== auth.user.id && !auth.user.isOwner)) {
        return NextResponse.json({ error: 'FORBIDDEN: You can only toggle your own assigned tasks.' }, { status: 403 });
      }
      const { data, error } = await db
        .from('tasks')
        .update({ status: nextStatus, completed_at: nextStatus === 'Done' ? new Date().toISOString() : null })
        .eq('id', taskId)
        .select('*')
        .single();
      if (error) throw new Error(error.message);
      return NextResponse.json({ ok: true, task: data });
    }

    // 3. Submit New GPS-Pinned Site Visit / Viewing Forensic Report (Any Authenticated Staff)
    const reportType = body.reportType === 'Viewing' ? 'Viewing' : 'Site Visit';
    const reportNo = `FSR-${String(new Date().getFullYear()).slice(-2)}${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
    const dubaiDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dubai' }).format(new Date());

    // Cap inline photo thumbnails cleanly (max 6 photos, data URLs or https paths)
    const rawPhotos = Array.isArray(body.photos) ? body.photos.slice(0, 6) : [];
    const safePhotos = rawPhotos
      .filter((p: any) => p && typeof p.dataUrl === 'string' && p.dataUrl.length < 750_000)
      .map((p: any) => ({
        name: String(p.name || 'unit-photo.jpg').slice(0, 80),
        caption: String(p.caption || 'Unit Photo').slice(0, 120),
        dataUrl: String(p.dataUrl),
        uploadedAt: new Date().toISOString(),
      }));

    const paymentStages = Array.isArray(body.paymentStages) ? body.paymentStages : [];
    const stageLog = Array.isArray(body.stageLog) && body.stageLog.length
      ? body.stageLog
      : [
          {
            stage: `${reportType} GPS Pinned & Logged`,
            at: new Date().toISOString(),
            by: auth.user.name,
            note: `${body.buildingOrProject || body.community || 'Dubai Site'} · Met: ${body.metPersonName || 'Contact'}`,
          },
        ];

    const isAutoOwnerVerified = auth.user.isOwner && Boolean(body.autoVerifyOwner);

    const { data: created, error } = await db
      .from('forensic_field_reports')
      .insert({
        report_no: reportNo,
        report_type: reportType,
        submitted_by_user_id: auth.user.id,
        submitted_by_name: auth.user.name,
        visit_date: body.visitDate || dubaiDate,
        community: String(body.community || '').trim(),
        building_or_project: String(body.buildingOrProject || '').trim(),
        unit_no: String(body.unitNo || '').trim(),
        gps_lat: body.gpsLat !== undefined ? Number(body.gpsLat) : null,
        gps_lng: body.gpsLng !== undefined ? Number(body.gpsLng) : null,
        gps_accuracy_m: Number(body.gpsAccuracyM || 15),
        gps_address_label: String(body.gpsAddressLabel || '').trim(),
        verification_status: isAutoOwnerVerified ? 'Verified' : 'Pending Verification',
        verified_by_user_id: isAutoOwnerVerified ? auth.user.id : null,
        verified_by_name: isAutoOwnerVerified ? auth.user.name : '',
        verified_at: isAutoOwnerVerified ? new Date().toISOString() : null,
        met_person_name: String(body.metPersonName || '').trim(),
        met_person_role: body.metPersonRole || 'Client',
        met_person_phone: String(body.metPersonPhone || '').trim(),
        met_person_email: String(body.metPersonEmail || '').trim(),
        owner_or_agent_name: String(body.ownerOrAgentName || '').trim(),
        owner_or_agent_phone: String(body.ownerOrAgentPhone || '').trim(),
        owner_or_agent_email: String(body.ownerOrAgentEmail || '').trim(),
        is_third_party: Boolean(body.isThirdParty),
        third_party_agency: String(body.thirdPartyAgency || '').trim(),
        third_party_agent_name: String(body.thirdPartyAgentName || '').trim(),
        third_party_brn: String(body.thirdPartyBrn || '').trim(),
        third_party_phone: String(body.thirdPartyPhone || '').trim(),
        third_party_email: String(body.thirdPartyEmail || '').trim(),
        deal_category: body.dealCategory || 'Secondary',
        asking_price_aed: Number(body.askingPriceAed || 0),
        final_price_aed: Number(body.finalPriceAed || 0),
        yearly_rent_aed: Number(body.yearlyRentAed || 0),
        cheques_count: Number(body.chequesCount || 0),
        outcome: body.outcome || 'Follow-Up Pending',
        not_closed_reason: String(body.notClosedReason || '').trim(),
        next_action_date: body.nextActionDate || null,
        payment_summary_json: paymentStages,
        stage_log_json: stageLog,
        photos_json: safePhotos,
        forensic_notes: String(body.forensicNotes || '').trim(),
      })
      .select('*')
      .single();

    if (error || !created) throw new Error(error?.message || 'Forensic report save failed');

    // Notify Co-Owners + any designated Verification Authorities
    const verifiers = await getFieldVerifiers();
    const notifyIds = Array.from(new Set(['USR-01', 'USR-02', ...verifiers.map((v) => v.user_id)]));
    await db.from('notifications').insert(
      notifyIds.map((uid) => ({
        recipient_user_id: uid,
        title: `New ${reportType} Forensic Report (${reportNo})`,
        body: `${auth.user.name} submitted GPS-pinned ${reportType} at ${created.building_or_project || created.community} (${created.outcome}).`,
        severity: created.outcome === 'Closed' ? 'info' : 'warning',
        href: '/os/executive',
      })),
    );

    await logAudit(auth.user, 'forensic_field_reports', created.id, 'FORENSIC_REPORT_SUBMITTED', {
      reportNo,
      reportType,
      outcome: created.outcome,
    });

    return NextResponse.json({ ok: true, report: created }, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Forensic report error' }, { status: 400 });
  }
}
