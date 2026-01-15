-- Demo mode configuration table
-- Stores demo settings and customizations for sales/demo presentations

CREATE TABLE IF NOT EXISTS "demo_config" (
  "id" text PRIMARY KEY NOT NULL,
  "organization_id" text NOT NULL UNIQUE REFERENCES "organization"("id") ON DELETE CASCADE,
  "is_demo" boolean NOT NULL DEFAULT false,
  "display_name" text,
  "display_logo" text,
  "display_domain" text,
  "last_reset_at" timestamp,
  "reset_count" integer NOT NULL DEFAULT 0,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

-- Index for fast lookup by organization
CREATE INDEX IF NOT EXISTS "demo_config_org_idx" ON "demo_config" ("organization_id");
