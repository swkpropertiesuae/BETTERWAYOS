import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let cachedAdmin: SupabaseClient | null = null;
let cachedSessionExpiry = 0;

/**
 * Server-only Supabase database & private storage client.
 * - Production Vercel: uses SUPABASE_SERVICE_ROLE_KEY directly.
 * - Local/Staging fallback: authenticates once as the locked backend service user
 *   (`raw_app_meta_data.bw_service = true`), which passes strict RLS while keeping
 *   anonymous callers 100% locked out of all private tables and storage buckets.
 */
export async function getSupabaseAdmin(): Promise<SupabaseClient> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) throw new Error('NEXT_PUBLIC_SUPABASE_URL is required');

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (serviceRoleKey) {
    if (!cachedAdmin) {
      cachedAdmin = createClient(url, serviceRoleKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
    }
    return cachedAdmin;
  }

  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  const email = process.env.BW_BACKEND_AUTH_EMAIL?.trim();
  const password = process.env.BW_BACKEND_AUTH_PASSWORD?.trim();

  if (!anonKey || !email || !password) {
    throw new Error(
      'Missing SUPABASE_SERVICE_ROLE_KEY or backend service auth credentials (BW_BACKEND_AUTH_EMAIL / BW_BACKEND_AUTH_PASSWORD)',
    );
  }

  const now = Date.now();
  if (cachedAdmin && cachedSessionExpiry > now + 60_000) {
    return cachedAdmin;
  }

  const client = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error || !data.session) {
    throw new Error(`Backend Supabase auth failed: ${error?.message ?? 'no session'}`);
  }

  cachedAdmin = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      headers: {
        Authorization: `Bearer ${data.session.access_token}`,
      },
    },
  });
  cachedSessionExpiry = (data.session.expires_at ?? Math.floor(now / 1000) + 3000) * 1000;
  return cachedAdmin;
}

export function resetSupabaseAdminCache() {
  cachedAdmin = null;
  cachedSessionExpiry = 0;
}
