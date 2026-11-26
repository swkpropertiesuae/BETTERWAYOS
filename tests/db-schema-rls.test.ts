import { describe, it, expect } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

describe('Task 1: Live Supabase Postgres Schema, RLS & Storage Verification', () => {
  it('blocks anonymous client from reading private tables (privacy_fast_track_jobs & users)', async () => {
    const anon = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
    const { data: ftData } = await anon.from('privacy_fast_track_jobs').select('*');
    const { data: usersData } = await anon.from('users').select('*');
    expect(ftData ?? []).toHaveLength(0);
    expect(usersData ?? []).toHaveLength(0);
  });

  it('allows authenticated backend service client to query core tables & access private storage buckets', async () => {
    const db = await getSupabaseAdmin();
    const tables = [
      'users',
      'communities',
      'developers',
      'office_branches',
      'departments',
      'banks',
      'master_change_requests',
      'leads',
      'mortgage_cases',
      'privacy_fast_track_jobs',
      'privacy_fast_track_invoices',
      'owner_approvals',
      'attendance_events',
      'chat_messages',
      'field_visits',
      'website_offers',
      'case_study_scenarios',
    ];
    for (const table of tables) {
      const { error } = await db.from(table).select('*', { count: 'exact', head: true });
      expect(error, `Table ${table} should exist and be accessible to backend service`).toBeNull();
    }

    const { data: signed, error: signErr } = await db.storage
      .from('client-vault')
      .createSignedUploadUrl(`healthcheck/${Date.now()}.txt`);
    expect(signErr).toBeNull();
    expect(signed?.signedUrl).toContain('https://');
  });
});
