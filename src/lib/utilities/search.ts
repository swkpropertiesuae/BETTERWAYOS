import type { SessionUser } from '@/lib/domain/types';
import { getCapabilitiesForRole } from '@/lib/auth/rbac';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export interface UnifiedSearchHit {
  type: string;
  title: string;
  subtitle: string;
  href: string;
}

export function sanitizePostgrestQuery(raw: string): string {
  return String(raw || '')
    .replace(/[(),%*\\'"`]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80);
}

/**
 * Global OS Search — strictly isolates Privacy Fast Track to Owners (Warda & Shabib),
 * enforces Advisor own-record scoping, and sanitizes PostgREST filter characters.
 */
export async function runUnifiedSearch(query: string, user: SessionUser): Promise<UnifiedSearchHit[]> {
  const q = sanitizePostgrestQuery(query);
  if (q.length < 2) return [];
  const pattern = `%${q}%`;
  const db = await getSupabaseAdmin();
  const caps = getCapabilitiesForRole(user.role);
  const hits: UnifiedSearchHit[] = [];

  // 1. Standard Mortgage Cases (scoped)
  let caseQ = db
    .from('mortgage_cases')
    .select('id,case_code,borrower_name,community,stage_code')
    .eq('deleted_soft', false)
    .or(`borrower_name.ilike.${pattern},case_code.ilike.${pattern},community.ilike.${pattern}`)
    .limit(8);
  if (caps.pipelineScope === 'OWN') caseQ = caseQ.eq('advisor_id', user.id);

  // 2. Daily Leads (scoped)
  let leadQ = db
    .from('leads')
    .select('id,reference_code,contact_name,source_channel,community')
    .eq('deleted_soft', false)
    .or(`contact_name.ilike.${pattern},reference_code.ilike.${pattern},community.ilike.${pattern}`)
    .limit(8);
  if (caps.pipelineScope === 'OWN') leadQ = leadQ.eq('assigned_to', user.id);

  // 3. Master Data (Communities, Developers, Banks, Case Studies)
  const [casesRes, leadsRes, comRes, devRes, bankRes, csRes] = await Promise.all([
    caps.pipelineScope !== 'NONE' ? caseQ : Promise.resolve({ data: [] }),
    caps.pipelineScope !== 'NONE' ? leadQ : Promise.resolve({ data: [] }),
    db.from('communities').select('id,code,name,emirate').or(`name.ilike.${pattern},code.ilike.${pattern}`).limit(5),
    db.from('developers').select('id,code,name,emirate').or(`name.ilike.${pattern},code.ilike.${pattern}`).limit(5),
    db.from('banks').select('id,name,bank_type').ilike('name', pattern).limit(5),
    db.from('case_study_scenarios').select('id,scenario_code,title,category').or(`title.ilike.${pattern},challenge.ilike.${pattern}`).limit(5),
  ]);

  for (const c of casesRes.data ?? []) {
    hits.push({ type: 'Case', title: `${c.case_code} · ${c.borrower_name}`, subtitle: `${c.community} · ${c.stage_code}`, href: '/os/pipeline' });
  }
  for (const l of leadsRes.data ?? []) {
    hits.push({ type: 'Enquiry', title: `${l.reference_code} · ${l.contact_name}`, subtitle: `${l.source_channel} · ${l.community}`, href: '/os/crm' });
  }
  for (const c of comRes.data ?? []) {
    hits.push({ type: 'Community', title: `${c.name} (${c.code})`, subtitle: c.emirate, href: '/os/master-log/communities' });
  }
  for (const d of devRes.data ?? []) {
    hits.push({ type: 'Developer', title: `${d.name} (${d.code})`, subtitle: d.emirate, href: '/os/master-log/developers' });
  }
  for (const b of bankRes.data ?? []) {
    hits.push({ type: 'Bank', title: b.name, subtitle: b.bank_type, href: '/os/mortgage-desk' });
  }
  for (const cs of csRes.data ?? []) {
    hits.push({ type: 'AI Case Study', title: `${cs.scenario_code} · ${cs.title}`, subtitle: cs.category, href: '/os/ai' });
  }

  // 4. Privacy Fast Track — STRICTLY OWNER ONLY! Never queried for non-Owners!
  if (user.role === 'OWNER') {
    const { data: ft } = await db
      .from('privacy_fast_track_jobs')
      .select('id,job_code,client_name,urgency,private_to_owner_id')
      .or(`private_to_owner_id.is.null,private_to_owner_id.eq.${user.id}`)
      .or(`client_name.ilike.${pattern},job_code.ilike.${pattern}`)
      .limit(8);
    for (const j of ft ?? []) {
      hits.push({
        type: 'Privacy Fast Track',
        title: `${j.job_code} · ${j.client_name}`,
        subtitle: `Owner Confidential (${j.urgency})`,
        href: '/os/executive',
      });
    }
  }

  return hits;
}
