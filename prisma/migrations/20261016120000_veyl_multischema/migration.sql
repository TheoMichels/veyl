-- Migration multiSchema cible pour Veyl sur PostgreSQL Supabase partagé
-- Schéma : veyl | Auth partagée : auth.users | RLS 100% avec policies auth.uid() = user_id
BEGIN;

CREATE SCHEMA IF NOT EXISTS veyl;
GRANT USAGE ON SCHEMA veyl TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA veyl
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated, service_role;

CREATE OR REPLACE FUNCTION veyl.set_updated_at() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path = pg_catalog AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION veyl.set_updated_at() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION veyl.set_updated_at() TO authenticated, service_role;

-- -----------------------------------------------------------------------------
-- 1. Table veyl.digests
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS veyl.digests (
  id TEXT NOT NULL,
  user_id UUID NOT NULL,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT digests_pkey PRIMARY KEY (id),
  CONSTRAINT digests_user_fk FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_digests_user_id ON veyl.digests(user_id);
CREATE INDEX IF NOT EXISTS idx_digests_category ON veyl.digests(user_id, category);

REVOKE ALL ON veyl.digests FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON veyl.digests TO authenticated, service_role;
ALTER TABLE veyl.digests ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS trg_digests_updated_at ON veyl.digests;
CREATE TRIGGER trg_digests_updated_at BEFORE UPDATE ON veyl.digests
  FOR EACH ROW EXECUTE FUNCTION veyl.set_updated_at();

DROP POLICY IF EXISTS digests_select_policy ON veyl.digests;
CREATE POLICY digests_select_policy ON veyl.digests FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS digests_insert_policy ON veyl.digests;
CREATE POLICY digests_insert_policy ON veyl.digests FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS digests_update_policy ON veyl.digests;
CREATE POLICY digests_update_policy ON veyl.digests FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS digests_delete_policy ON veyl.digests;
CREATE POLICY digests_delete_policy ON veyl.digests FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- 2. Table veyl.sources
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS veyl.sources (
  id TEXT NOT NULL,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  category TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT sources_pkey PRIMARY KEY (id),
  CONSTRAINT sources_user_fk FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT uq_sources_user_url UNIQUE (user_id, url)
);

CREATE INDEX IF NOT EXISTS idx_sources_user_id ON veyl.sources(user_id);

REVOKE ALL ON veyl.sources FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON veyl.sources TO authenticated, service_role;
ALTER TABLE veyl.sources ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS trg_sources_updated_at ON veyl.sources;
CREATE TRIGGER trg_sources_updated_at BEFORE UPDATE ON veyl.sources
  FOR EACH ROW EXECUTE FUNCTION veyl.set_updated_at();

DROP POLICY IF EXISTS sources_select_policy ON veyl.sources;
CREATE POLICY sources_select_policy ON veyl.sources FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS sources_insert_policy ON veyl.sources;
CREATE POLICY sources_insert_policy ON veyl.sources FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS sources_update_policy ON veyl.sources;
CREATE POLICY sources_update_policy ON veyl.sources FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS sources_delete_policy ON veyl.sources;
CREATE POLICY sources_delete_policy ON veyl.sources FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- 3. Table veyl.user_settings
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS veyl.user_settings (
  user_id UUID NOT NULL,
  gemini_prompt_ia TEXT NOT NULL,
  gemini_prompt_lux TEXT NOT NULL,
  gemini_prompt_tech TEXT NOT NULL,
  cron_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT user_settings_pkey PRIMARY KEY (user_id),
  CONSTRAINT user_settings_user_fk FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

REVOKE ALL ON veyl.user_settings FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON veyl.user_settings TO authenticated, service_role;
ALTER TABLE veyl.user_settings ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS trg_user_settings_updated_at ON veyl.user_settings;
CREATE TRIGGER trg_user_settings_updated_at BEFORE UPDATE ON veyl.user_settings
  FOR EACH ROW EXECUTE FUNCTION veyl.set_updated_at();

DROP POLICY IF EXISTS user_settings_select_policy ON veyl.user_settings;
CREATE POLICY user_settings_select_policy ON veyl.user_settings FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS user_settings_insert_policy ON veyl.user_settings;
CREATE POLICY user_settings_insert_policy ON veyl.user_settings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS user_settings_update_policy ON veyl.user_settings;
CREATE POLICY user_settings_update_policy ON veyl.user_settings FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS user_settings_delete_policy ON veyl.user_settings;
CREATE POLICY user_settings_delete_policy ON veyl.user_settings FOR DELETE TO authenticated USING (auth.uid() = user_id);

COMMIT;
