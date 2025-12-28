-- User preferences table for storing user-specific settings per organization
-- Used for system map positions, UI preferences, etc.

CREATE TABLE IF NOT EXISTS "user_preferences" (
  "id" SERIAL PRIMARY KEY,
  "user_id" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "organization_id" TEXT NOT NULL REFERENCES "organization"("id") ON DELETE CASCADE,
  "system_map_positions" JSONB,
  "preferences" JSONB,
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updated_at" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Unique constraint: one preferences record per user per org
CREATE UNIQUE INDEX IF NOT EXISTS "user_preferences_user_org_idx" ON "user_preferences" ("user_id", "organization_id");

-- Index for org-based lookups
CREATE INDEX IF NOT EXISTS "user_preferences_org_idx" ON "user_preferences" ("organization_id");

