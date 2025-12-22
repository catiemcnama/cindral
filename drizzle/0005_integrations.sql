-- Migration: Add integrations table for third-party integrations
-- Date: 2024-12-22

-- Integration status enum
DO $$ BEGIN
  CREATE TYPE integration_status AS ENUM ('pending', 'connected', 'error', 'disconnected');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Integration provider enum  
DO $$ BEGIN
  CREATE TYPE integration_provider AS ENUM ('jira', 'confluence', 'servicenow', 'slack', 'teams');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Integrations table
CREATE TABLE IF NOT EXISTS "integrations" (
  "id" text PRIMARY KEY NOT NULL,
  "organization_id" text NOT NULL REFERENCES "organization"("id") ON DELETE CASCADE,
  "provider" integration_provider NOT NULL,
  "name" varchar(255) NOT NULL,
  "config" jsonb,
  "status" integration_status DEFAULT 'pending',
  "last_sync_at" timestamp with time zone,
  "last_error" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "created_by_user_id" text REFERENCES "user"("id") ON DELETE SET NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS "idx_integrations_org" ON "integrations" ("organization_id");
CREATE INDEX IF NOT EXISTS "idx_integrations_provider" ON "integrations" ("organization_id", "provider");
CREATE UNIQUE INDEX IF NOT EXISTS "integrations_org_provider_unique" ON "integrations" ("organization_id", "provider");

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_integrations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_integrations_updated_at ON integrations;
CREATE TRIGGER trigger_integrations_updated_at
  BEFORE UPDATE ON integrations
  FOR EACH ROW
  EXECUTE FUNCTION update_integrations_updated_at();

