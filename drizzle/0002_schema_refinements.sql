-- Schema Refinements Migration
-- Adds missing columns, indexes, and enum values

-- ============================================================================
-- NEW ENUMS
-- ============================================================================

-- Create new enums if they don't exist
DO $$ BEGIN
  CREATE TYPE role AS ENUM ('OrgAdmin', 'ComplianceManager', 'Auditor', 'Viewer', 'BillingAdmin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE alert_type AS ENUM ('obligation_overdue', 'regulation_changed', 'evidence_pack_failed', 'system_unmapped');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE requirement_type AS ENUM ('process', 'technical', 'reporting');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE risk_level AS ENUM ('low', 'medium', 'high', 'critical');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE evidence_status AS ENUM ('draft', 'generating', 'ready', 'failed', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE mapping_confidence AS ENUM ('low', 'medium', 'high');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE mapped_by AS ENUM ('llm', 'human');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE review_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE regulation_status AS ENUM ('active', 'superseded', 'draft');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE source_type AS ENUM ('eur-lex', 'manual-upload', 'api', 'llm', 'manual');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE ingest_job_status AS ENUM ('pending', 'running', 'succeeded', 'failed', 'partial');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- ALTER EXISTING ENUMS (expand them to match spec)
-- ============================================================================

-- Expand alert_status enum
ALTER TYPE alert_status ADD VALUE IF NOT EXISTS 'in_triage';
ALTER TYPE alert_status ADD VALUE IF NOT EXISTS 'wont_fix';

-- We need to handle obligation_status differently since we're changing values
-- Create new enum and migrate
DO $$ BEGIN
  CREATE TYPE obligation_status_new AS ENUM ('not_started', 'in_progress', 'implemented', 'under_review', 'verified');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Expand severity enum
ALTER TYPE severity ADD VALUE IF NOT EXISTS 'info';

-- ============================================================================
-- ADD MISSING COLUMNS TO EXISTING TABLES
-- ============================================================================

-- article_system_impacts: Add organization_id
ALTER TABLE article_system_impacts 
ADD COLUMN IF NOT EXISTS organization_id TEXT REFERENCES organization(id) ON DELETE CASCADE;

ALTER TABLE article_system_impacts 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- alerts: Add missing columns
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS type alert_type;
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS obligation_id TEXT REFERENCES obligations(id) ON DELETE SET NULL;
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS system_id TEXT REFERENCES systems(id) ON DELETE SET NULL;
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS evidence_pack_id INTEGER REFERENCES evidence_packs(id) ON DELETE SET NULL;
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS assigned_to_user_id TEXT REFERENCES "user"(id) ON DELETE SET NULL;
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS due_date TIMESTAMP;
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP;
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS resolved_by_user_id TEXT REFERENCES "user"(id) ON DELETE SET NULL;
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS resolution_notes TEXT;

-- evidence_packs: Add missing columns
ALTER TABLE evidence_packs ADD COLUMN IF NOT EXISTS title VARCHAR(255);
ALTER TABLE evidence_packs ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE evidence_packs ADD COLUMN IF NOT EXISTS framework VARCHAR(100);
ALTER TABLE evidence_packs ADD COLUMN IF NOT EXISTS jurisdiction VARCHAR(100);
ALTER TABLE evidence_packs ADD COLUMN IF NOT EXISTS status evidence_status DEFAULT 'draft';
ALTER TABLE evidence_packs ADD COLUMN IF NOT EXISTS system_id TEXT REFERENCES systems(id) ON DELETE SET NULL;
ALTER TABLE evidence_packs ADD COLUMN IF NOT EXISTS intended_audience VARCHAR(50);
ALTER TABLE evidence_packs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- obligations: Add missing columns
ALTER TABLE obligations ADD COLUMN IF NOT EXISTS requirement_type requirement_type;
ALTER TABLE obligations ADD COLUMN IF NOT EXISTS risk_level risk_level;

-- regulations: Add status column
ALTER TABLE regulations ADD COLUMN IF NOT EXISTS status regulation_status DEFAULT 'active';

-- articles: Change review_status to use enum
ALTER TABLE articles ADD COLUMN IF NOT EXISTS review_status_new review_status DEFAULT 'pending';

-- ingest_jobs: Add created_at
ALTER TABLE ingest_jobs ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();

-- regulatory_changes: Add organization_id if missing
ALTER TABLE regulatory_changes 
ADD COLUMN IF NOT EXISTS organization_id TEXT REFERENCES organization(id) ON DELETE CASCADE;

-- ============================================================================
-- CREATE MISSING INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_regulations_org_id ON regulations(organization_id, id);
CREATE INDEX IF NOT EXISTS idx_articles_org_reg ON articles(organization_id, regulation_id, article_number);
CREATE INDEX IF NOT EXISTS idx_obligations_org_status ON obligations(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_obligations_org_risk ON obligations(organization_id, risk_level);
CREATE INDEX IF NOT EXISTS idx_alerts_org_status ON alerts(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_alerts_org_severity ON alerts(organization_id, severity);
CREATE INDEX IF NOT EXISTS idx_alerts_org_created ON alerts(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_evidence_packs_org_status ON evidence_packs(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_article_system_impacts_org ON article_system_impacts(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_org ON audit_log(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_ingest_jobs_org ON ingest_jobs(organization_id);

-- ============================================================================
-- ENSURE NOT NULL CONSTRAINTS WHERE NEEDED
-- ============================================================================

-- After migration, we need to backfill organization_id for article_system_impacts
-- This should be done via a script that reads from the article -> regulation -> organization chain

-- ============================================================================
-- UPDATE MEMBER ROLES
-- ============================================================================
-- The better-auth member table uses text for role, so we need to update existing values
-- to match our new role enum names

UPDATE member SET role = 'OrgAdmin' WHERE role = 'owner';
UPDATE member SET role = 'ComplianceManager' WHERE role = 'admin';
UPDATE member SET role = 'Viewer' WHERE role = 'member';

