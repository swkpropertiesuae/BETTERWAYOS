import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/session';
import { getCapabilitiesForRole } from '@/lib/auth/rbac';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { endFieldVisit, pingFieldWaypoint, startFieldVisit, triggerFieldSos } from '@/lib/attendance/field-gps';

export async function GET() {
  const auth = await requireSession();
  if ('error' in auth) return auth.error;
  const caps = getCapabilitiesForRole(auth.user.role);
  const db = await getSupabaseAdmin();
  let q = db.from('field_visits').select('*').order('started_at', { ascending: false }).limit(80);
  if (!caps.canViewFieldGpsAll) q = q.eq('user_id', auth.user.id);
  const { data } = await q;
  return NextResponse.json({ visits: data ?? [] });
}

export async function POST(req: Request) {
  const auth = await requireSession();
  if ('error' in auth) return auth.error;
  try {
    const body = await req.json();
    if (body.action === 'waypoint') {
      const visit = await pingFieldWaypoint(body.visitId, Number(body.lat), Number(body.lng), body.note);
      return NextResponse.json({ ok: true, visit });
    }
    if (body.action === 'end') {
      const visit = await endFieldVisit(body.visitId, String(body.outcomeNotes || 'Visit completed'));
      return NextResponse.json({ ok: true, visit });
    }
    if (body.action === 'sos') {
      const visit = await triggerFieldSos(body.visitId, String(body.reason || 'Field Emergency SOS'), auth.user);
      return NextResponse.json({ ok: true, visit });
    }
    const visit = await startFieldVisit(
      {
        purpose: body.purpose || 'Bank / Valuation Field Visit',
        destinationLabel: body.destinationLabel || 'Dubai Field Destination',
        caseId: body.caseId,
        lat: Number(body.lat ?? 25.2397),
        lng: Number(body.lng ?? 55.3119),
        accuracyM: Number(body.accuracyM ?? 15),
      },
      auth.user,
    );
    return NextResponse.json({ ok: true, visit }, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Field GPS error' }, { status: 400 });
  }
}
