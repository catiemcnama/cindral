-- Migration: Add onboarding state table
-- Day 4: Navigation, Search & Onboarding

-- Onboarding state table to persist setup wizard progress
CREATE TABLE IF NOT EXISTS onboarding_state (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  organization_id TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  
  -- Step progress
  current_step INTEGER DEFAULT 1 NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Step 1: Industry
  industry TEXT,
  
  -- Step 2: Regulations
  selected_regulations TEXT[] DEFAULT '{}',
  regulations_customized BOOLEAN DEFAULT FALSE,
  
  -- Step 3: Systems
  selected_system_templates TEXT[] DEFAULT '{}',
  custom_systems JSONB DEFAULT '[]',
  systems_customized BOOLEAN DEFAULT FALSE,
  
  -- Step 4: Invites
  pending_invites JSONB DEFAULT '[]',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  -- Constraints
  CONSTRAINT onboarding_state_org_unique UNIQUE (organization_id)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_onboarding_state_org ON onboarding_state(organization_id);

-- Add organization onboarding status column
ALTER TABLE organization 
ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMP WITH TIME ZONE;

-- Comment
COMMENT ON TABLE onboarding_state IS 'Stores onboarding wizard progress for each organization';

