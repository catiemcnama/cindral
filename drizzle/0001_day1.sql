-- Day 1 canonical schema for Cindral
-- Enums (must be created before tables)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE role_enum AS ENUM ('OrgAdmin','ComplianceManager','Auditor','Viewer','BillingAdmin');
CREATE TYPE obligation_status AS ENUM ('not_started','in_progress','implemented','under_review','verified');
CREATE TYPE alert_status AS ENUM ('open','in_triage','in_progress','resolved','wont_fix');
CREATE TYPE evidence_status AS ENUM ('draft','generating','ready','failed','archived');
CREATE TYPE severity_enum AS ENUM ('info','low','medium','high','critical');

-- Ingest jobs (referenced by regulations/articles)
CREATE TABLE ingest_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  source varchar(100) NOT NULL
);

-- Organizations
CREATE TABLE organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(255) NOT NULL,
  slug varchar(255) UNIQUE NOT NULL,
  primary_jurisdiction varchar(100),
  industry varchar(100),
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Users
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email varchar(255) UNIQUE NOT NULL,
  full_name varchar(255),
  hashed_password varchar(255),
  default_organization_id uuid REFERENCES organizations(id) ON DELETE SET NULL,
  email_verified_at timestamp,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Organization memberships
CREATE TABLE organization_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role role_enum NOT NULL,
  CONSTRAINT organization_user_unique UNIQUE (organization_id, user_id)
);

-- Regulations
CREATE TABLE regulations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  slug varchar(255) NOT NULL,
  framework varchar(100) NOT NULL,
  title text NOT NULL,
  version varchar(50),
  source_url text,
  source_type varchar(100),
  ingest_job_id uuid REFERENCES ingest_jobs(id) ON DELETE SET NULL,
  checksum text,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now(),
  CONSTRAINT regulations_org_framework_version_unique UNIQUE (organization_id, framework, version)
);

-- Articles
CREATE TABLE articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  regulation_id uuid NOT NULL REFERENCES regulations(id) ON DELETE CASCADE,
  article_number varchar(100) NOT NULL,
  title text,
  raw_text text,
  normalized_text text,
  source_url text,
  ingest_job_id uuid REFERENCES ingest_jobs(id) ON DELETE SET NULL,
  human_reviewed_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Systems
CREATE TABLE systems (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name varchar(255) NOT NULL,
  slug varchar(255),
  category varchar(100),
  criticality severity_enum,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Obligations
CREATE TABLE obligations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  regulation_id uuid NOT NULL REFERENCES regulations(id) ON DELETE CASCADE,
  article_id uuid NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  reference_code varchar(255),
  title varchar(500) NOT NULL,
  status obligation_status DEFAULT 'not_started',
  risk_level varchar(50),
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Obligation <-> System mappings (UUID PK)
CREATE TABLE obligation_system_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  obligation_id uuid NOT NULL REFERENCES obligations(id) ON DELETE CASCADE,
  system_id uuid NOT NULL REFERENCES systems(id) ON DELETE CASCADE,
  created_at timestamp DEFAULT now()
);

-- Evidence packs
CREATE TABLE evidence_packs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  regulation_id uuid REFERENCES regulations(id) ON DELETE SET NULL,
  status evidence_status DEFAULT 'draft',
  generated_at timestamp,
  created_at timestamp DEFAULT now()
);

-- Alerts
CREATE TABLE alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  type varchar(100),
  severity severity_enum,
  status alert_status DEFAULT 'open',
  title varchar(500) NOT NULL,
  description text,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Audit log (minimal fields as requested)
CREATE TABLE audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  actor_user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  action varchar(200),
  entity_type varchar(200),
  entity_id uuid,
  diff jsonb,
  ip_address varchar(100),
  user_agent text,
  created_at timestamp DEFAULT now()
);

-- Indexes (tenant-first), created concurrently where appropriate.
-- Note: CREATE INDEX CONCURRENTLY cannot run inside a transaction.
CREATE INDEX CONCURRENTLY idx_regulations_org_id ON regulations (organization_id, id);
CREATE INDEX CONCURRENTLY idx_articles_org_reg ON articles (organization_id, regulation_id, article_number);
CREATE INDEX CONCURRENTLY idx_obligations_org_status ON obligations (organization_id, status);
CREATE INDEX CONCURRENTLY idx_obligations_org_risk ON obligations (organization_id, risk_level);
CREATE INDEX CONCURRENTLY idx_alerts_org_status ON alerts (organization_id, status);
CREATE INDEX CONCURRENTLY idx_alerts_org_severity ON alerts (organization_id, severity);
CREATE INDEX CONCURRENTLY idx_alerts_org_created ON alerts (organization_id, created_at DESC);
