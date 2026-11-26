import type { SessionUser } from '@/lib/domain/types';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { notifyOwners } from '@/lib/auth/approvals';

export async function startFieldVisit(
  input: {
    purpose: string;
    destinationLabel: string;
    caseId?: string;
    lat: number;
    lng: number;
    accuracyM?: number;
  },
  actor: SessionUser,
) {
  const db = await getSupabaseAdmin();
  const { data, error } = await db
    .from('field_visits')
    .insert({
      user_id: actor.id,
      user_name: actor.name,
      purpose: input.purpose,
      destination_label: input.destinationLabel,
      case_id: input.caseId || null,
      status: 'ACTIVE',
      start_lat: input.lat,
      start_lng: input.lng,
      last_lat: input.lat,
      last_lng: input.lng,
      accuracy_m: input.accuracyM ?? 15,
      waypoints: [{ lat: input.lat, lng: input.lng, at: new Date().toISOString(), label: 'Check-In' }],
    })
    .select('*')
    .single();
  if (error || !data) throw new Error(`Field visit start failed: ${error?.message}`);
  return data;
}

export async function pingFieldWaypoint(visitId: string, lat: number, lng: number, note = 'GPS Ping') {
  const db = await getSupabaseAdmin();
  const { data: existing } = await db.from('field_visits').select('waypoints').eq('id', visitId).single();
  const prev = Array.isArray(existing?.waypoints) ? existing.waypoints : [];
  const { data, error } = await db
    .from('field_visits')
    .update({
      last_lat: lat,
      last_lng: lng,
      waypoints: [...prev, { lat, lng, at: new Date().toISOString(), label: note }],
    })
    .eq('id', visitId)
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function endFieldVisit(visitId: string, outcomeNotes: string) {
  const db = await getSupabaseAdmin();
  const { data, error } = await db
    .from('field_visits')
    .update({
      status: 'COMPLETED',
      outcome_notes: outcomeNotes,
      ended_at: new Date().toISOString(),
    })
    .eq('id', visitId)
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function triggerFieldSos(visitId: string, reason: string, actor: SessionUser) {
  const db = await getSupabaseAdmin();
  const { data, error } = await db
    .from('field_visits')
    .update({
      status: 'SOS',
      outcome_notes: `SOS: ${reason}`,
    })
    .eq('id', visitId)
    .select('*')
    .single();
  if (error || !data) throw new Error(`SOS failed: ${error?.message}`);

  const mapsLink = `https://maps.google.com/?q=${data.last_lat},${data.last_lng}`;
  await notifyOwners(
    `🚨 FIELD SOS ALERT — ${actor.name}`,
    `${actor.name} triggered SOS at ${data.destination_label} (${data.purpose}): ${reason}. GPS: ${mapsLink}`,
    '/os/field-gps',
    'critical',
  );

  await db.from('chat_messages').insert({
    channel: 'urgent-alerts',
    sender_id: actor.id,
    sender_name: actor.name,
    sender_role: actor.role,
    sender_avatar: actor.avatarUrl || '',
    message_kind: 'SOS',
    body: `🚨 SOS ALERT from ${actor.name} at ${data.destination_label}: ${reason} · GPS (${Number(data.last_lat).toFixed(4)}, ${Number(data.last_lng).toFixed(4)})`,
    metadata: { visitId, lat: data.last_lat, lng: data.last_lng, mapsLink },
  });

  return data;
}
