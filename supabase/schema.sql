-- Net Defterim — Supabase (PostgreSQL) Auth, Multi-Tenant, Veritabanı ve Storage Şeması
-- Bu SQL betiğini Supabase Dashboard -> SQL Editor ekranına yapıştırıp "Run" düğmesine basarak çalıştırın.

-- 1. TENANT (ÇALIŞMA ALANI / KURUM) TABLOLARI
CREATE TABLE IF NOT EXISTS public.tenants (
  id text PRIMARY KEY,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  owner_id text NOT NULL,
  plan text NOT NULL DEFAULT 'free',
  created_at text NOT NULL
);

CREATE TABLE IF NOT EXISTS public.tenant_members (
  tenant_id text NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id text NOT NULL,
  role text NOT NULL DEFAULT 'owner',
  created_at text NOT NULL,
  PRIMARY KEY (tenant_id, user_id)
);
CREATE INDEX IF NOT EXISTS tenant_members_user_idx ON public.tenant_members (user_id);

-- 2. KULLANICILAR VE OTURUMLAR (Supabase Auth ile senkronize)
CREATE TABLE IF NOT EXISTS public.users (
  id text PRIMARY KEY,
  email text NOT NULL UNIQUE,
  name text NOT NULL,
  password_hash text,
  password_salt text,
  google_sub text UNIQUE,
  tenant_id text,
  created_at text NOT NULL,
  last_login_at text
);

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS tenant_id text;

CREATE TABLE IF NOT EXISTS public.sessions (
  id text PRIMARY KEY,
  user_id text NOT NULL,
  tenant_id text,
  sb_access_token text,
  sb_refresh_token text,
  created_at text NOT NULL,
  expires_at text NOT NULL,
  user_agent text NOT NULL DEFAULT ''
);
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS tenant_id text;
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS sb_access_token text;
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS sb_refresh_token text;
CREATE INDEX IF NOT EXISTS sessions_user_idx ON public.sessions (user_id);

CREATE TABLE IF NOT EXISTS public.password_resets (
  email text PRIMARY KEY,
  code_hash text NOT NULL,
  expires_at text NOT NULL,
  attempts integer NOT NULL DEFAULT 0,
  created_at text NOT NULL
);

-- 3. UYGULAMA VERİ TABLOLARI (user_id = aktif tenant_id veya kullanıcı kimliği)
CREATE TABLE IF NOT EXISTS public.questions (
  id text PRIMARY KEY,
  user_id text NOT NULL,
  exam text NOT NULL,
  exam_type text NOT NULL,
  date text NOT NULL,
  subject text NOT NULL,
  topic text NOT NULL,
  question text NOT NULL,
  my_answer text NOT NULL DEFAULT '',
  answer_key text NOT NULL DEFAULT '',
  image_key text,
  mime text,
  analysis text,
  reviewed integer NOT NULL DEFAULT 0,
  created_at text NOT NULL,
  analyzing_at text,
  mistake_type text NOT NULL DEFAULT 'yanlış',
  review_stage integer NOT NULL DEFAULT 0,
  next_review text,
  review_log text NOT NULL DEFAULT '[]'
);
CREATE INDEX IF NOT EXISTS questions_user_date_idx ON public.questions (user_id, date);
CREATE INDEX IF NOT EXISTS questions_user_next_review_idx ON public.questions (user_id, next_review);

CREATE TABLE IF NOT EXISTS public.reports (
  id text PRIMARY KEY,
  user_id text NOT NULL,
  month text NOT NULL,
  notes text NOT NULL,
  updated_at text NOT NULL,
  goals text NOT NULL DEFAULT '[]',
  UNIQUE (user_id, month)
);

CREATE TABLE IF NOT EXISTS public.exams (
  id text PRIMARY KEY,
  user_id text NOT NULL,
  name text NOT NULL,
  exam_type text NOT NULL,
  date text NOT NULL,
  net double precision NOT NULL,
  correct integer,
  wrong integer,
  blank integer,
  notes text NOT NULL DEFAULT '',
  created_at text NOT NULL
);
CREATE INDEX IF NOT EXISTS exams_user_date_idx ON public.exams (user_id, date);

CREATE TABLE IF NOT EXISTS public.video_cache (
  id text PRIMARY KEY,
  user_id text NOT NULL,
  subject text NOT NULL,
  topic text NOT NULL,
  videos text NOT NULL DEFAULT '[]',
  rejected text NOT NULL DEFAULT '[]',
  updated_at text NOT NULL,
  UNIQUE (user_id, subject, topic)
);

CREATE TABLE IF NOT EXISTS public.study_notes (
  id text PRIMARY KEY,
  user_id text NOT NULL,
  subject text NOT NULL,
  topic text NOT NULL,
  exam_type text NOT NULL DEFAULT '',
  content text NOT NULL,
  prompt text NOT NULL DEFAULT '',
  updated_at text NOT NULL,
  UNIQUE (user_id, subject, topic)
);

CREATE TABLE IF NOT EXISTS public.profiles (
  user_id text PRIMARY KEY,
  name text NOT NULL,
  grade text NOT NULL DEFAULT '10',
  target text NOT NULL DEFAULT '',
  exam_year integer NOT NULL DEFAULT 2028,
  exam_date text NOT NULL DEFAULT '2028-06-17',
  motto text NOT NULL DEFAULT '',
  daily_goal integer NOT NULL DEFAULT 0,
  school text NOT NULL DEFAULT '',
  updated_at text NOT NULL
);

CREATE TABLE IF NOT EXISTS public.ai_usage (
  user_id text NOT NULL,
  day text NOT NULL,
  kind text NOT NULL,
  count integer NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, day, kind)
);

CREATE TABLE IF NOT EXISTS public.auth_attempts (
  key text PRIMARY KEY,
  count integer NOT NULL DEFAULT 0,
  reset_at text NOT NULL
);

CREATE TABLE IF NOT EXISTS public.study_plans (
  user_id text PRIMARY KEY,
  config text NOT NULL,
  done text NOT NULL DEFAULT '{}',
  off_days text NOT NULL DEFAULT '{}',
  created_at text NOT NULL,
  updated_at text NOT NULL
);

-- 4. SUPABASE AUTH TRIGGER: auth.users tablosunda kullanıcı açıldığında otomatik Tenant + Üyelik + Profil oluşturur
CREATE OR REPLACE FUNCTION public.handle_new_supabase_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_id text := NEW.id::text;
  v_name text := COALESCE(NULLIF(NEW.raw_user_meta_data->>'name', ''), split_part(NEW.email, '@', 1));
  v_grade text := COALESCE(NULLIF(NEW.raw_user_meta_data->>'grade', ''), '12');
  v_tenant_name text := COALESCE(NULLIF(NEW.raw_user_meta_data->>'tenant_name', ''), v_name || ' Çalışma Alanı');
  v_slug text := lower(regexp_replace(v_name, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substr(v_id, 1, 6);
  v_now text := to_char( now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"' );
BEGIN
  INSERT INTO public.tenants (id, name, slug, owner_id, plan, created_at)
  VALUES (v_id, v_tenant_name, v_slug, v_id, 'free', v_now)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.tenant_members (tenant_id, user_id, role, created_at)
  VALUES (v_id, v_id, 'owner', v_now)
  ON CONFLICT (tenant_id, user_id) DO NOTHING;

  INSERT INTO public.users (id, email, name, tenant_id, created_at)
  VALUES (v_id, lower(NEW.email), v_name, v_id, v_now)
  ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, tenant_id = COALESCE(public.users.tenant_id, EXCLUDED.tenant_id);

  INSERT INTO public.profiles (user_id, name, grade, target, exam_year, exam_date, motto, daily_goal, school, updated_at)
  VALUES (v_id, v_name, v_grade, '', 2027, '2027-06-19', 'Her yanlış, bir sonraki doğruya.', 0, '', v_now)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_supabase_user();

-- 5. MULTI-TENANT YARDIMCI FONKSİYONU VE ROW LEVEL SECURITY (RLS) POLİTİKALARI
CREATE OR REPLACE FUNCTION public.has_tenant_access(target_tenant_id text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER STABLE
AS $$
  SELECT
    auth.role() = 'service_role'
    OR auth.uid()::text = target_tenant_id
    OR EXISTS (
      SELECT 1 FROM public.tenant_members tm
      WHERE tm.tenant_id = target_tenant_id
        AND tm.user_id = auth.uid()::text
    );
$$;

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_tenants ON public.tenants;
CREATE POLICY tenant_isolation_tenants ON public.tenants
  FOR ALL USING (public.has_tenant_access(id)) WITH CHECK (public.has_tenant_access(id));

ALTER TABLE public.tenant_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_members ON public.tenant_members;
CREATE POLICY tenant_isolation_members ON public.tenant_members
  FOR ALL USING (user_id = auth.uid()::text OR public.has_tenant_access(tenant_id))
  WITH CHECK (public.has_tenant_access(tenant_id));

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['questions','reports','exams','video_cache','study_notes','profiles','ai_usage','study_plans']
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_%I ON public.%I', t, t);
    EXECUTE format('CREATE POLICY tenant_isolation_%I ON public.%I FOR ALL USING (public.has_tenant_access(user_id)) WITH CHECK (public.has_tenant_access(user_id))', t, t);
  END LOOP;
END $$;

-- 5b. SİSTEM AYARLARI (sys_config): API anahtarları (OpenAI vb.) tutar.
-- Yalnız service_role (RLS'i aşar) erişir: RLS açık, politika YOK, anon/authenticated yetkisiz.
CREATE TABLE IF NOT EXISTS public.sys_config (
  key text PRIMARY KEY,
  value text NOT NULL
);
ALTER TABLE public.sys_config ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.sys_config FROM anon, authenticated;

-- 6. SUPABASE STORAGE KOVASI
INSERT INTO storage.buckets (id, name, public)
VALUES ('question-images', 'question-images', false)
ON CONFLICT (id) DO NOTHING;
