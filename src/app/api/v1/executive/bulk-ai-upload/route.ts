import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import { requireOwner } from '@/lib/auth/session';
import { parseBulkLeadText } from '@/lib/ai/bulk-parser';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { createFastTrackJob } from '@/lib/executive/service';

export async function POST(req: Request) {
  const auth = await requireOwner();
  if ('error' in auth) return auth.error;

  try {
    const body = (await req.json()) as {
      rawText: string;
      target: 'vault' | 'leads' | 'fast_track';
      sourceLabel?: string;
      assignTo?: string;
    };
    const db = await getSupabaseAdmin();
    const { data: existingLeads } = await db.from('leads').select('contact_phone').limit(1000);
    const existingPhones = (existingLeads ?? []).map((r) => String(r.contact_phone || ''));

    const parsed = parseBulkLeadText(body.rawText, existingPhones);
    let inserted = 0;

    for (const item of parsed.items) {
      if (body.target === 'fast_track') {
        await createFastTrackJob(
          {
            clientName: item.contactName,
            clientPhone: item.contactPhone,
            clientEmail: item.contactEmail,
            communityFreeform: item.community,
            propertySummary: item.projectName || item.community,
            propertyPriceAed: item.propertyPriceAed,
            loanAmountAed: Math.round(item.propertyPriceAed * 0.8),
            expectedFeeAed: Math.round(item.propertyPriceAed * 0.8 * 0.0085),
            urgency: 'IMMEDIATE_CASH',
            notes: item.notes,
          },
          auth.user,
        );
        inserted += 1;
      } else if (body.target === 'vault') {
        const { error } = await db.from('vault_leads').insert({
          client_name: item.contactName,
          raw_phone: item.contactPhone,
          community: item.community,
          project_name: item.projectName,
          property_price_aed: item.propertyPriceAed,
          source_label: body.sourceLabel || `${auth.user.name} Bulk AI Upload`,
          assigned_to: body.assignTo || null,
          progress_status: body.assignTo ? 'Assigned' : 'Unassigned',
          notes: item.notes,
          created_by: auth.user.id,
        });
        if (!error) inserted += 1;
      } else {
        const ref = `BW-AI-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
        const { error } = await db.from('leads').insert({
          reference_code: ref,
          contact_name: item.contactName,
          contact_phone: item.contactPhone,
          contact_email: item.contactEmail,
          community: item.community,
          property_price_aed: item.propertyPriceAed,
          source_channel: body.sourceLabel || 'Owner Bulk AI Upload',
          assigned_to: body.assignTo || 'USR-07',
          notes: item.notes,
        });
        if (!error) inserted += 1;
      }
    }

    return NextResponse.json({
      ok: true,
      inserted,
      duplicatesSkipped: parsed.duplicatesSkipped,
      skippedLines: parsed.skippedLines,
      preview: parsed.items.slice(0, 15),
    });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Bulk AI upload failed' }, { status: 400 });
  }
}
