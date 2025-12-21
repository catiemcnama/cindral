-- Day 1: create missing enums, tables and columns for tenancy, provenance, ingest, audit

-- Create enums if not present
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'severity') THEN
    CREATE TYPE severity AS ENUM ('critical','high','medium','low');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'alert_status') THEN
    CREATE TYPE alert_status AS ENUM ('open','in_progress','resolved','in_triage','wont_fix');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'obligation_status') THEN
    CREATE TYPE obligation_status AS ENUM ('not_started','in_progress','implemented','under_review','verified','pending','compliant','non_compliant');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'impact_level') THEN
    CREATE TYPE impact_level AS ENUM ('critical','high','medium','low');
  END IF;
END$$;

-- Regulations
CREATE TABLE IF NOT EXISTS regulations (
  id text PRIMARY KEY,
  slug varchar(255) NOT NULL,
  framework varchar(100),
  version varchar(50),
  status varchar(50) DEFAULT 'active',
  name varchar(255) NOT NULL,
  full_title text NOT NULL,
  jurisdiction varchar(100),
  effective_date timestamp,
  last_updated timestamp,
  organization_id text,
  source_url text,
  source_type varchar(100),
  ingest_job_id text,
  ingest_timestamp timestamp,
  checksum text,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

-- Articles
CREATE TABLE IF NOT EXISTS articles (
  id text PRIMARY KEY,
  regulation_id text NOT NULL,
  organization_id text,
  article_number varchar(100) NOT NULL,
  section_title text,
  title text,
  raw_text text,
  normalized_text text,
  description text,
  source_url text,
  ingest_job_id text,
  ingest_timestamp timestamp,
  checksum text,
  human_reviewed_by text,
  human_reviewed_at timestamp,
  review_status varchar(50) DEFAULT 'pending',
  ai_summary text,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

-- Systems
CREATE TABLE IF NOT EXISTS systems (
  id text PRIMARY KEY,
  name varchar(255) NOT NULL,
  description text,
  criticality severity,
  organization_id text,
  slug varchar(255),
  category varchar(100),
  data_classification varchar(100),
  owner_team varchar(200),
  owner_user_id text,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

-- Obligations
CREATE TABLE IF NOT EXISTS obligations (
  id text PRIMARY KEY,
  article_id text NOT NULL,
  organization_id text,
  regulation_id text,
  reference_code varchar(255),
  title varchar(500) NOT NULL,
  summary text,
  requirement_type varchar(100),
  risk_level varchar(50),
  status obligation_status NOT NULL DEFAULT 'pending',
  source_type varchar(50),
  ingest_job_id text,
  ingest_timestamp timestamp,
  checksum text,
  human_reviewed_by text,
  human_reviewed_at timestamp,
  due_date timestamp,
  owner_team varchar(200),
  owner_user_id text,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

-- Obligation <-> System mappings
CREATE TABLE IF NOT EXISTS obligation_system_mappings (
  id serial PRIMARY KEY,
  organization_id text NOT NULL,
  obligation_id text NOT NULL,
  system_id text NOT NULL,
  mapping_confidence varchar(50) DEFAULT 'medium',
  mapped_by varchar(50) DEFAULT 'human',
  reason text,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

-- Evidence packs
CREATE TABLE IF NOT EXISTS evidence_packs (
  id serial PRIMARY KEY,
  regulation_id text NOT NULL,
  article_id text,
  generated_at timestamp NOT NULL DEFAULT now(),
  export_format varchar(50),
  organization_id text,
  created_by_id text,
  title varchar(255),
  status varchar(50) DEFAULT 'draft',
  job_id text,
  last_generated_at timestamp,
  download_url text,
  storage_location text,
  intended_audience varchar(50),
  requested_by_user_id text
);

-- Alerts
CREATE TABLE IF NOT EXISTS alerts (
  id text PRIMARY KEY,
  title varchar(500) NOT NULL,
  description text,
  severity severity,
  status alert_status NOT NULL DEFAULT 'open',
  regulation_id text,
  article_id text,
  owner_id text,
  organization_id text,
  context jsonb,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

-- Audit log
CREATE TABLE IF NOT EXISTS audit_log (
  id serial PRIMARY KEY,
  organization_id text,
  actor_user_id text,
  action varchar(200) NOT NULL,
  entity_type varchar(100) NOT NULL,
  entity_id text,
  diff jsonb,
  ip_address text,
  user_agent text,
  created_at timestamp NOT NULL DEFAULT now()
);

-- Ingest jobs
CREATE TABLE IF NOT EXISTS ingest_jobs (
  id text PRIMARY KEY,
  organization_id text,
  source varchar(100),
  source_url text,
  status varchar(50) DEFAULT 'pending',
  started_at timestamp,
  finished_at timestamp,
  log text,
  error_message text
);

-- Indexes and constraints
-- Ensure organization_id columns exist on existing tables before creating indexes
ALTER TABLE IF EXISTS regulations ADD COLUMN IF NOT EXISTS organization_id text;
ALTER TABLE IF EXISTS articles ADD COLUMN IF NOT EXISTS organization_id text;
ALTER TABLE IF EXISTS obligations ADD COLUMN IF NOT EXISTS organization_id text;
ALTER TABLE IF EXISTS systems ADD COLUMN IF NOT EXISTS organization_id text;
ALTER TABLE IF EXISTS evidence_packs ADD COLUMN IF NOT EXISTS organization_id text;
ALTER TABLE IF EXISTS alerts ADD COLUMN IF NOT EXISTS organization_id text;

-- Add other provenance and tenancy columns if missing
ALTER TABLE IF EXISTS regulations ADD COLUMN IF NOT EXISTS slug varchar(255);
ALTER TABLE IF EXISTS regulations ADD COLUMN IF NOT EXISTS framework varchar(100);
ALTER TABLE IF EXISTS regulations ADD COLUMN IF NOT EXISTS version varchar(50);
ALTER TABLE IF EXISTS regulations ADD COLUMN IF NOT EXISTS status varchar(50) DEFAULT 'active';
ALTER TABLE IF EXISTS regulations ADD COLUMN IF NOT EXISTS source_url text;
ALTER TABLE IF EXISTS regulations ADD COLUMN IF NOT EXISTS source_type varchar(100);
ALTER TABLE IF EXISTS regulations ADD COLUMN IF NOT EXISTS ingest_job_id text;
ALTER TABLE IF EXISTS regulations ADD COLUMN IF NOT EXISTS ingest_timestamp timestamp;
ALTER TABLE IF EXISTS regulations ADD COLUMN IF NOT EXISTS checksum text;

ALTER TABLE IF EXISTS articles ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE IF EXISTS articles ADD COLUMN IF NOT EXISTS raw_text text;
ALTER TABLE IF EXISTS articles ADD COLUMN IF NOT EXISTS normalized_text text;
ALTER TABLE IF EXISTS articles ADD COLUMN IF NOT EXISTS source_url text;
ALTER TABLE IF EXISTS articles ADD COLUMN IF NOT EXISTS ingest_job_id text;
ALTER TABLE IF EXISTS articles ADD COLUMN IF NOT EXISTS ingest_timestamp timestamp;
ALTER TABLE IF EXISTS articles ADD COLUMN IF NOT EXISTS checksum text;
ALTER TABLE IF EXISTS articles ADD COLUMN IF NOT EXISTS human_reviewed_by text;
ALTER TABLE IF EXISTS articles ADD COLUMN IF NOT EXISTS human_reviewed_at timestamp;
ALTER TABLE IF EXISTS articles ADD COLUMN IF NOT EXISTS review_status varchar(50) DEFAULT 'pending';

ALTER TABLE IF EXISTS obligations ADD COLUMN IF NOT EXISTS regulation_id text;
ALTER TABLE IF EXISTS obligations ADD COLUMN IF NOT EXISTS reference_code varchar(255);
ALTER TABLE IF EXISTS obligations ADD COLUMN IF NOT EXISTS summary text;
ALTER TABLE IF EXISTS obligations ADD COLUMN IF NOT EXISTS requirement_type varchar(100);
ALTER TABLE IF EXISTS obligations ADD COLUMN IF NOT EXISTS risk_level varchar(50);
ALTER TABLE IF EXISTS obligations ADD COLUMN IF NOT EXISTS source_type varchar(50);
ALTER TABLE IF EXISTS obligations ADD COLUMN IF NOT EXISTS ingest_job_id text;
ALTER TABLE IF EXISTS obligations ADD COLUMN IF NOT EXISTS ingest_timestamp timestamp;
ALTER TABLE IF EXISTS obligations ADD COLUMN IF NOT EXISTS checksum text;
ALTER TABLE IF EXISTS obligations ADD COLUMN IF NOT EXISTS human_reviewed_by text;
ALTER TABLE IF EXISTS obligations ADD COLUMN IF NOT EXISTS human_reviewed_at timestamp;
ALTER TABLE IF EXISTS obligations ADD COLUMN IF NOT EXISTS due_date timestamp;
ALTER TABLE IF EXISTS obligations ADD COLUMN IF NOT EXISTS owner_team varchar(200);
ALTER TABLE IF EXISTS obligations ADD COLUMN IF NOT EXISTS owner_user_id text;

ALTER TABLE IF EXISTS systems ADD COLUMN IF NOT EXISTS slug varchar(255);
ALTER TABLE IF EXISTS systems ADD COLUMN IF NOT EXISTS category varchar(100);
ALTER TABLE IF EXISTS systems ADD COLUMN IF NOT EXISTS data_classification varchar(100);
ALTER TABLE IF EXISTS systems ADD COLUMN IF NOT EXISTS owner_team varchar(200);
ALTER TABLE IF EXISTS systems ADD COLUMN IF NOT EXISTS owner_user_id text;

ALTER TABLE IF EXISTS evidence_packs ADD COLUMN IF NOT EXISTS title varchar(255);
ALTER TABLE IF EXISTS evidence_packs ADD COLUMN IF NOT EXISTS status varchar(50) DEFAULT 'draft';
ALTER TABLE IF EXISTS evidence_packs ADD COLUMN IF NOT EXISTS job_id text;
ALTER TABLE IF EXISTS evidence_packs ADD COLUMN IF NOT EXISTS last_generated_at timestamp;
ALTER TABLE IF EXISTS evidence_packs ADD COLUMN IF NOT EXISTS download_url text;
ALTER TABLE IF EXISTS evidence_packs ADD COLUMN IF NOT EXISTS storage_location text;
ALTER TABLE IF EXISTS evidence_packs ADD COLUMN IF NOT EXISTS intended_audience varchar(50);
ALTER TABLE IF EXISTS evidence_packs ADD COLUMN IF NOT EXISTS requested_by_user_id text;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='regulations' AND column_name='organization_id') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_regulations_org_id ON regulations (organization_id, id)';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='articles' AND column_name='regulation_id') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_articles_org_reg_article ON articles (organization_id, regulation_id, article_number)';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='obligations' AND column_name='regulation_id') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_obligations_org_reg ON obligations (organization_id, regulation_id)';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='obligations' AND column_name='status') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_obligations_org_status ON obligations (organization_id, status)';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='obligations' AND column_name='risk_level') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_obligations_org_risk ON obligations (organization_id, risk_level)';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='alerts' AND column_name='status') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_alerts_org_status ON alerts (organization_id, status)';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='alerts' AND column_name='severity') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_alerts_org_severity ON alerts (organization_id, severity)';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='alerts' AND column_name='created_at') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_alerts_org_created_at ON alerts (organization_id, created_at DESC)';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='evidence_packs' AND column_name='status') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_evidence_packs_org_status ON evidence_packs (organization_id, status)';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='member') THEN
    EXECUTE 'CREATE UNIQUE INDEX IF NOT EXISTS uidx_member_org_user ON member (organization_id, user_id)';
  END IF;
END$$;

-- Foreign keys may already exist from auth-schema; adding FKs here is optional and may fail if referenced tables don't exist.

-- Done
