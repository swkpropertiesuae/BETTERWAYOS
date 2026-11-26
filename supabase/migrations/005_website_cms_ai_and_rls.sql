-- Migration 005: Website & Social CMS, AI Case-Study Knowledge Base, Private Storage Buckets, RLS & Realtime

CREATE TABLE IF NOT EXISTS public.website_offers (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  tab_label TEXT NOT NULL,
  badge TEXT NOT NULL,
  headline TEXT NOT NULL,
  summary TEXT NOT NULL,
  highlights JSONB NOT NULL DEFAULT '[]'::jsonb,
  bank_key TEXT NOT NULL DEFAULT 'emirates-nbd',
  rate_badge TEXT NOT NULL DEFAULT '3.89% Fixed',
  cta_href TEXT NOT NULL DEFAULT '/get-started',
  cta_label TEXT NOT NULL DEFAULT 'Check Eligibility',
  spotlight BOOLEAN NOT NULL DEFAULT FALSE,
  published BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 1,
  enquiries_count INTEGER NOT NULL DEFAULT 0,
  updated_by TEXT REFERENCES public.users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.website_banners (
  id TEXT PRIMARY KEY,
  placement TEXT NOT NULL DEFAULT 'top_bar',
  badge TEXT NOT NULL DEFAULT 'LIVE UPDATE',
  message TEXT NOT NULL,
  cta_label TEXT NOT NULL DEFAULT 'Compare Rates',
  cta_href TEXT NOT NULL DEFAULT '/hot-offers',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  updated_by TEXT REFERENCES public.users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.website_bank_rates (
  id TEXT PRIMARY KEY,
  bank_key TEXT UNIQUE NOT NULL,
  bank_name TEXT NOT NULL,
  product_name TEXT NOT NULL,
  rate_pct NUMERIC(5,3) NOT NULL,
  fixed_years INTEGER NOT NULL DEFAULT 3,
  revert_margin_pct NUMERIC(5,3) NOT NULL DEFAULT 1.49,
  max_ltv_pct NUMERIC(5,2) NOT NULL DEFAULT 80,
  islamic BOOLEAN NOT NULL DEFAULT FALSE,
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  published BOOLEAN NOT NULL DEFAULT TRUE,
  verified_at DATE NOT NULL DEFAULT ((NOW() AT TIME ZONE 'Asia/Dubai')::date),
  updated_by TEXT REFERENCES public.users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.website_team_sync (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  name_ar TEXT NOT NULL DEFAULT '',
  designation TEXT NOT NULL,
  department TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Advisory',
  email TEXT NOT NULL,
  portrait_url TEXT NOT NULL,
  summary TEXT NOT NULL,
  specialties JSONB NOT NULL DEFAULT '[]'::jsonb,
  sort_order INTEGER NOT NULL DEFAULT 1,
  published BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.social_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('Instagram','LinkedIn','Meta Ads','Google Ads','TikTok','YouTube','WhatsApp Broadcast')),
  campaign_utm TEXT NOT NULL,
  target_url TEXT NOT NULL DEFAULT 'https://betterwaymortgages.com/hot-offers',
  status TEXT NOT NULL DEFAULT 'Scheduled' CHECK (status IN ('Draft','Scheduled','Live','Paused','Completed')),
  scheduled_for TIMESTAMPTZ,
  budget_aed NUMERIC(12,2) NOT NULL DEFAULT 0,
  leads_attributed INTEGER NOT NULL DEFAULT 0,
  caption TEXT NOT NULL DEFAULT '',
  owner_id TEXT REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.case_study_scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_code TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  borrower_profile TEXT NOT NULL,
  mortgage_type TEXT NOT NULL,
  income_summary TEXT NOT NULL DEFAULT '',
  property_summary TEXT NOT NULL DEFAULT '',
  challenge TEXT NOT NULL,
  banks_considered JSONB NOT NULL DEFAULT '[]'::jsonb,
  winning_bank TEXT NOT NULL DEFAULT '',
  structuring_solution TEXT NOT NULL,
  cbuae_rules_applied JSONB NOT NULL DEFAULT '[]'::jsonb,
  outcome_lessons TEXT NOT NULL,
  tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  source_ref TEXT NOT NULL DEFAULT 'Betterway 15-Year Underwriting Playbook',
  verified BOOLEAN NOT NULL DEFAULT TRUE,
  created_by TEXT REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('client-vault', 'client-vault', FALSE, 52428800, ARRAY['application/pdf','image/jpeg','image/png','image/webp','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','text/csv']),
  ('privacy-fast-track', 'privacy-fast-track', FALSE, 52428800, ARRAY['application/pdf','image/jpeg','image/png','image/webp','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document']),
  ('brand-and-team', 'brand-and-team', TRUE, 15728640, ARRAY['image/jpeg','image/png','image/webp','image/svg+xml','application/pdf'])
ON CONFLICT (id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.is_bw_service() RETURNS BOOLEAN
LANGUAGE SQL STABLE AS $$
  SELECT COALESCE((auth.jwt() -> 'app_metadata' ->> 'bw_service') = 'true', FALSE);
$$;

DO $$
DECLARE
  t TEXT;
  all_tables TEXT[] := ARRAY[
    'users','user_sessions','communities','developers','office_branches','departments',
    'currencies','vat_codes','chart_of_accounts','payment_terms','rera_brokers',
    'roles_permissions','banks','master_properties','property_units','contacts',
    'document_checklists','offplan_payment_plans','lead_routing_rules','custom_fields',
    'document_templates','master_vault_index','master_change_requests',
    'leads','mortgage_cases','bank_submissions','case_documents','case_valuations',
    'tasks','calendar_events','vault_leads','call_logs','client_messages',
    'privacy_fast_track_jobs','privacy_fast_track_invoices','privacy_fast_track_docs',
    'owner_approvals','delete_bin_requests','word_documents',
    'journal_entries','invoices','payout_requests','expenses',
    'compliance_checks','sanctions_entries','audit_events',
    'attendance_events','daily_close_reports','hr_staff_compliance','hr_leave_requests',
    'chat_messages','field_visits','notifications','app_settings',
    'website_offers','website_banners','website_bank_rates','website_team_sync',
    'social_campaigns','case_study_scenarios'
  ];
BEGIN
  FOREACH t IN ARRAY all_tables LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = t AND policyname = 'bw_service_all'
    ) THEN
      EXECUTE format(
        'CREATE POLICY bw_service_all ON public.%I FOR ALL TO authenticated USING (public.is_bw_service()) WITH CHECK (public.is_bw_service());',
        t
      );
    END IF;
  END LOOP;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='website_offers' AND policyname='public_read_published_offers') THEN
    CREATE POLICY public_read_published_offers ON public.website_offers FOR SELECT TO anon USING (published = TRUE);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='website_banners' AND policyname='public_read_active_banners') THEN
    CREATE POLICY public_read_active_banners ON public.website_banners FOR SELECT TO anon USING (active = TRUE);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='website_bank_rates' AND policyname='public_read_published_rates') THEN
    CREATE POLICY public_read_published_rates ON public.website_bank_rates FOR SELECT TO anon USING (published = TRUE);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='website_team_sync' AND policyname='public_read_published_team') THEN
    CREATE POLICY public_read_published_team ON public.website_team_sync FOR SELECT TO anon USING (published = TRUE);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='bw_service_storage_all') THEN
    CREATE POLICY bw_service_storage_all ON storage.objects
      FOR ALL TO authenticated
      USING (bucket_id IN ('client-vault','privacy-fast-track','brand-and-team') AND public.is_bw_service())
      WITH CHECK (bucket_id IN ('client-vault','privacy-fast-track','brand-and-team') AND public.is_bw_service());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='public_read_brand_and_team') THEN
    CREATE POLICY public_read_brand_and_team ON storage.objects
      FOR SELECT TO anon
      USING (bucket_id = 'brand-and-team');
  END IF;
END $$;

DO $$
DECLARE
  rt TEXT;
  rt_tables TEXT[] := ARRAY['chat_messages','notifications','master_change_requests','field_visits','attendance_events'];
BEGIN
  FOREACH rt IN ARRAY rt_tables LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = rt
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I;', rt);
    END IF;
  END LOOP;
END $$;
