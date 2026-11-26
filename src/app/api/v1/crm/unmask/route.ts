import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/session';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { logAudit } from '@/lib/auth/approvals';
import { maskPhoneNumber } from '@/lib/auth/masking';

export async function POST(req: Request) {
  const auth = await requireSession();
  if ('error' in auth) return auth.error;
  try {
    const body = (await req.json()) as {
      entityType: 'lead' | 'vault_lead' | 'case';
      entityId: string;
      channel: 'Call' | 'WhatsApp' | 'Unmask';
      notes?: string;
    };
    const db = await getSupabaseAdmin();
    let phone = '';
    let contactName = '';
    let assignedTo: string | null = null;

    if (body.entityType === 'lead') {
      const { data } = await db.from('leads').select('contact_name,contact_phone,assigned_to').eq('id', body.entityId).single();
      if (!data) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
      phone = data.contact_phone;
      contactName = data.contact_name;
      assignedTo = data.assigned_to;
    } else if (body.entityType === 'vault_lead') {
      const { data } = await db.from('vault_leads').select('client_name,raw_phone,assigned_to').eq('id', body.entityId).single();
      if (!data) return NextResponse.json({ error: 'Vault lead not found' }, { status: 404 });
      phone = data.raw_phone;
      contactName = data.client_name;
      assignedTo = data.assigned_to;
    } else {
      const { data } = await db.from('mortgage_cases').select('borrower_name,borrower_phone,advisor_id').eq('id', body.entityId).single();
      if (!data) return NextResponse.json({ error: 'Case not found' }, { status: 404 });
      phone = data.borrower_phone;
      contactName = data.borrower_name;
      assignedTo = data.advisor_id;
    }

    if (auth.user.role === 'ADVISOR' && assignedTo !== auth.user.id) {
      return NextResponse.json({ error: 'PDPL_DENIED: You may only access phone numbers for your own assigned clients.' }, { status: 403 });
    }

    await db.from('call_logs').insert({
      user_id: auth.user.id,
      entity_type: body.entityType,
      entity_id: body.entityId,
      contact_name: contactName,
      masked_phone: maskPhoneNumber(phone),
      channel: body.channel,
      outcome: 'Logged',
      notes: body.notes || `PDPL audited ${body.channel}`,
    });

    await logAudit(auth.user, body.entityType, body.entityId, `PDPL_PHONE_${body.channel.toUpperCase()}`, {
      masked: maskPhoneNumber(phone),
    });

    const cleanDigits = phone.replace(/\D/g, '');
    return NextResponse.json({
      ok: true,
      phone,
      whatsappUrl: cleanDigits ? `https://wa.me/${cleanDigits}` : null,
      telUrl: cleanDigits ? `tel:+${cleanDigits}` : null,
    });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unmask failed' }, { status: 400 });
  }
}
