-- =============================================================================
-- Migration: Better Auth Tables
-- Purpose: Create required tables for better-auth authentication
-- This MUST run before any other migrations
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- USER TABLE
-- Core user table for better-auth
-- =============================================================================
CREATE TABLE IF NOT EXISTS "user" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL UNIQUE,
  "email_verified" BOOLEAN NOT NULL DEFAULT FALSE,
  "image" TEXT,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- SESSION TABLE
-- Manages user sessions
-- =============================================================================
CREATE TABLE IF NOT EXISTS "session" (
  "id" TEXT PRIMARY KEY,
  "expires_at" TIMESTAMP NOT NULL,
  "token" TEXT NOT NULL UNIQUE,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "ip_address" TEXT,
  "user_agent" TEXT,
  "user_id" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "active_organization_id" TEXT
);

CREATE INDEX IF NOT EXISTS "session_userId_idx" ON "session"("user_id");

-- =============================================================================
-- ACCOUNT TABLE  
-- Stores OAuth and credential accounts linked to users
-- =============================================================================
CREATE TABLE IF NOT EXISTS "account" (
  "id" TEXT PRIMARY KEY,
  "account_id" TEXT NOT NULL,
  "provider_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "access_token" TEXT,
  "refresh_token" TEXT,
  "id_token" TEXT,
  "access_token_expires_at" TIMESTAMP,
  "refresh_token_expires_at" TIMESTAMP,
  "scope" TEXT,
  "password" TEXT,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "account_userId_idx" ON "account"("user_id");

-- =============================================================================
-- VERIFICATION TABLE
-- Email verification and password reset tokens
-- =============================================================================
CREATE TABLE IF NOT EXISTS "verification" (
  "id" TEXT PRIMARY KEY,
  "identifier" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "expires_at" TIMESTAMP NOT NULL,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "verification_identifier_idx" ON "verification"("identifier");

-- =============================================================================
-- ORGANIZATION TABLE
-- Multi-tenant organizations (better-auth organization plugin)
-- =============================================================================
CREATE TABLE IF NOT EXISTS "organization" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL UNIQUE,
  "logo" TEXT,
  "created_at" TIMESTAMP NOT NULL,
  "metadata" TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS "organization_slug_uidx" ON "organization"("slug");

-- =============================================================================
-- MEMBER TABLE
-- Organization membership linking users to organizations
-- =============================================================================
CREATE TABLE IF NOT EXISTS "member" (
  "id" TEXT PRIMARY KEY,
  "organization_id" TEXT NOT NULL REFERENCES "organization"("id") ON DELETE CASCADE,
  "user_id" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "role" TEXT NOT NULL DEFAULT 'member',
  "created_at" TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS "member_organizationId_idx" ON "member"("organization_id");
CREATE INDEX IF NOT EXISTS "member_userId_idx" ON "member"("user_id");

-- =============================================================================
-- INVITATION TABLE
-- Organization invitations
-- =============================================================================
CREATE TABLE IF NOT EXISTS "invitation" (
  "id" TEXT PRIMARY KEY,
  "organization_id" TEXT NOT NULL REFERENCES "organization"("id") ON DELETE CASCADE,
  "email" TEXT NOT NULL,
  "role" TEXT,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "expires_at" TIMESTAMP NOT NULL,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "inviter_id" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "invitation_organizationId_idx" ON "invitation"("organization_id");
CREATE INDEX IF NOT EXISTS "invitation_email_idx" ON "invitation"("email");

-- =============================================================================
-- END MIGRATION
-- =============================================================================




