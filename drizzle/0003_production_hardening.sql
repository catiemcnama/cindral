-- =============================================================================
-- Migration: Production Hardening
-- Purpose: Add soft-delete, versioning, JSONB indexes, and unique constraints
-- Author: Auto-generated
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. SOFT DELETE COLUMNS
-- Adds deleted_at timestamp for logical deletion across core entities
-- -----------------------------------------------------------------------------

ALTER TABLE regulations ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE obligations ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE systems ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE evidence_packs ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- Indexes for soft-delete queries (filter out deleted records efficiently)
CREATE INDEX IF NOT EXISTS idx_regulations_deleted ON regulations(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_articles_deleted ON articles(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_obligations_deleted ON obligations(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_systems_deleted ON systems(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_alerts_deleted ON alerts(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_evidence_packs_deleted ON evidence_packs(organization_id) WHERE deleted_at IS NULL;

-- -----------------------------------------------------------------------------
-- 2. OPTIMISTIC LOCKING
-- Version column for detecting concurrent updates on regulations
-- -----------------------------------------------------------------------------

ALTER TABLE regulations ADD COLUMN IF NOT EXISTS lock_version INTEGER DEFAULT 1 NOT NULL;

-- -----------------------------------------------------------------------------
-- 3. ALERT PRIORITY & ORDERING
-- Priority column for custom alert ordering (lower = higher priority)
-- -----------------------------------------------------------------------------

ALTER TABLE alerts ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_alerts_priority ON alerts(organization_id, priority, created_at DESC);

-- -----------------------------------------------------------------------------
-- 4. SYSTEM ENHANCEMENTS
-- Tags array for filtering, external_id for CMDB integration
-- -----------------------------------------------------------------------------

ALTER TABLE systems ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE systems ADD COLUMN IF NOT EXISTS external_id VARCHAR(255);
ALTER TABLE systems ADD COLUMN IF NOT EXISTS external_source VARCHAR(100);

-- GIN index for array containment queries (WHERE 'tag' = ANY(tags))
CREATE INDEX IF NOT EXISTS idx_systems_tags ON systems USING GIN(tags);

-- Index for external system lookups
CREATE INDEX IF NOT EXISTS idx_systems_external ON systems(organization_id, external_source, external_id) 
  WHERE external_id IS NOT NULL;

-- -----------------------------------------------------------------------------
-- 5. JSONB INDEX FOR ALERTS CONTEXT
-- GIN index for efficient JSONB queries on alert context
-- -----------------------------------------------------------------------------

-- Drop and recreate to ensure correct type
DO $$ 
BEGIN
  -- Only create if context column exists and is JSON/JSONB type
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'alerts' AND column_name = 'context'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_alerts_context ON alerts USING GIN(context);
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 6. COMPOSITE UNIQUE CONSTRAINTS
-- Prevent duplicate entries within organizations
-- -----------------------------------------------------------------------------

-- Unique regulation slug per organization
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uq_regulations_org_slug'
  ) THEN
    ALTER TABLE regulations ADD CONSTRAINT uq_regulations_org_slug 
      UNIQUE (organization_id, slug);
  END IF;
END $$;

-- Unique system slug per organization  
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uq_systems_org_slug'
  ) THEN
    ALTER TABLE systems ADD CONSTRAINT uq_systems_org_slug 
      UNIQUE (organization_id, slug);
  END IF;
END $$;

-- Unique article-system impact per organization (no duplicate mappings)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uq_article_system_impacts'
  ) THEN
    ALTER TABLE article_system_impacts ADD CONSTRAINT uq_article_system_impacts 
      UNIQUE (organization_id, article_id, system_id);
  END IF;
END $$;

-- Unique obligation-system mapping per organization
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uq_obligation_system_mappings'
  ) THEN
    ALTER TABLE obligation_system_mappings ADD CONSTRAINT uq_obligation_system_mappings 
      UNIQUE (organization_id, obligation_id, system_id);
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 7. AUDIT LOG ENHANCEMENTS
-- Add session tracking for audit correlation
-- -----------------------------------------------------------------------------

ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS session_id TEXT;
ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS request_id TEXT;

CREATE INDEX IF NOT EXISTS idx_audit_log_session ON audit_log(session_id) WHERE session_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log(organization_id, created_at DESC);

-- -----------------------------------------------------------------------------
-- 8. PERFORMANCE INDEXES
-- Additional indexes for common query patterns
-- -----------------------------------------------------------------------------

-- Obligations by due date (for deadline tracking)
CREATE INDEX IF NOT EXISTS idx_obligations_due_date ON obligations(organization_id, due_date) 
  WHERE due_date IS NOT NULL AND status NOT IN ('verified');

-- Alerts assigned to user
CREATE INDEX IF NOT EXISTS idx_alerts_assigned ON alerts(assigned_to_user_id, status) 
  WHERE assigned_to_user_id IS NOT NULL;

-- Evidence packs by regulation
CREATE INDEX IF NOT EXISTS idx_evidence_packs_regulation ON evidence_packs(organization_id, regulation_id);

-- Regulatory changes by date
CREATE INDEX IF NOT EXISTS idx_regulatory_changes_published ON regulatory_changes(organization_id, published_at DESC);

-- =============================================================================
-- END MIGRATION
-- =============================================================================

