# Cindral — 7-Day Production Launch Roadmap

> **Philosophy:** This is not an MVP. This is a production-grade GRC platform that would satisfy Gary Tan, Elon Musk, and Sam Altman. Every line of code should be enterprise-ready. No "Day 1" naming, no shortcuts, no TODO comments left behind.

---

## ✅ Architecture Foundation (COMPLETED)

### Professional Standards Implemented

- [x] **Vitest testing framework** - Replaced custom test runner with industry-standard Vitest
- [x] **Typed environment variables** - `src/env.ts` with Zod validation (no more `!` assertions)
- [x] **Structured logger** - `src/lib/logger.ts` with JSON output for production
- [x] **GitHub Actions CI** - `.github/workflows/ci.yml` with lint, test, build, e2e
- [x] **Husky pre-commit hooks** - Lint-staged for code quality gates
- [x] **Playwright E2E setup** - `e2e/` directory with smoke tests
- [x] **Proper test structure** - `test/unit/` and `test/integration/` directories
- [x] **Database connection pooling** - Configured for serverless environments
- [x] Renamed migration files to semantic names
- [x] Removed all "Day 1" naming conventions
- [x] Created professional documentation

### Files Created/Updated

```
src/env.ts                           # Typed environment variables
src/lib/logger.ts                    # Structured logging
src/db/index.ts                      # Connection pooling
vitest.config.ts                     # Test configuration
playwright.config.ts                 # E2E configuration
test/setup.ts                        # Global test setup
test/helpers.ts                      # Test utilities
test/unit/rbac.test.ts               # RBAC tests
test/integration/tenant-isolation.test.ts
test/integration/audit-log.test.ts
e2e/smoke.test.ts                    # E2E smoke tests
.github/workflows/ci.yml             # CI/CD pipeline
.husky/pre-commit                    # Pre-commit hooks
docs/GETTING_STARTED.md              # Developer docs
```

---

## Day 1 — Database Foundation & Professional Architecture

### 1.1 Schema Refinements (2h)

**Goal:** Production-grade schema with proper indexing strategy

**Files:** `src/db/schema.ts`, `drizzle/0003_production_indexes.sql`

- [ ] Add GIN index on `alerts.context` for JSONB queries
- [ ] Add composite unique constraints where missing:
  - `(organization_id, slug)` on regulations
  - `(organization_id, system_id, article_id)` on article_system_impacts
  - `(organization_id, obligation_id, system_id)` on obligation_system_mappings
- [ ] Add `deleted_at` soft-delete column to: regulations, articles, obligations, systems, alerts, evidence_packs
- [ ] Add `version` column to regulations for optimistic locking
- [ ] Add `priority` (integer) to alerts for custom ordering
- [ ] Add `tags` (text[]) array to systems for filtering
- [ ] Add `external_id` to systems for CMDB integration
- [ ] Create proper migration file with semantic versioning

### 1.2 Seed Script Hardening (1.5h)

**Goal:** Deterministic, idempotent seed with realistic data

**Files:** `src/db/seed.ts`

- [ ] Remove random data generation - use fixed seed data for reproducibility
- [ ] Add realistic article `rawText` and `normalizedText` (actual DORA/GDPR excerpts)
- [ ] Add realistic obligation summaries (not "Obligation 1 for article X")
- [ ] Add proper due dates spread across next 90 days
- [ ] Add assignment chains (some alerts assigned, some unassigned)
- [ ] Add regulatory changes feed items with proper dates
- [ ] Create `scripts/seed-dev.ts` for development (fast, minimal data)
- [ ] Create `scripts/seed-demo.ts` for demo environment (comprehensive)
- [ ] Add checksum generation for seeded data

### 1.3 Database Connection Pooling & Health (1h)

**Goal:** Production-ready database connectivity

**Files:** `src/db/index.ts`, `src/db/pool.ts`

- [ ] Configure connection pool with proper limits:
  ```typescript
  const poolConfig = {
    max: process.env.NODE_ENV === 'production' ? 20 : 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  }
  ```
- [ ] Add connection health check on startup
- [ ] Add graceful shutdown handling
- [ ] Add query timeout configuration (30s default)
- [ ] Add slow query logging (>1s)

### 1.4 Migration System (1h)

**Goal:** Proper migration workflow

**Files:** `scripts/db-migrate.ts`, `drizzle.config.ts`

- [ ] Create migration runner script with:
  - Dry-run mode
  - Rollback support
  - Transaction wrapping
  - Migration status table
- [ ] Add `npm run db:migrate:status` command
- [ ] Add `npm run db:migrate:rollback` command
- [ ] Document migration workflow in README

### 1.5 Backup & Restore Scripts (0.5h)

**Goal:** Disaster recovery capability

**Files:** `scripts/db-backup.sh`, `scripts/db-restore.sh`

- [ ] Create timestamped backup script using `pg_dump`
- [ ] Create restore script with confirmation prompt
- [ ] Add S3 upload option for production
- [ ] Document backup schedule recommendation (daily)

### 1.6 Database Unit Tests (1.5h)

**Goal:** Test data layer integrity

**Files:** `src/tests/db-helpers.test.ts`, `src/tests/schema-validation.test.ts`

- [ ] Test FK constraint enforcement
- [ ] Test unique constraint enforcement
- [ ] Test cascade delete behavior
- [ ] Test index usage with EXPLAIN ANALYZE
- [ ] Test organization isolation at DB level
- [ ] Add transaction rollback tests

### 1.7 Database Documentation (0.5h)

**Goal:** Complete database reference

**Files:** `docs/DATABASE.md`

- [ ] Entity relationship diagram (use Mermaid)
- [ ] Table descriptions and column purposes
- [ ] Index strategy explanation
- [ ] Query patterns and examples
- [ ] Environment variables reference

---

## Day 2 — API Layer, Validation & Caching

### 2.1 tRPC Middleware Stack (1.5h)

**Goal:** Production-grade API middleware

**Files:** `src/trpc/middleware/`, `src/trpc/init.ts`

- [ ] Create `src/trpc/middleware/rate-limit.ts`:
  ```typescript
  // Rate limits per procedure type:
  // - mutations: 60/minute per user
  // - queries: 300/minute per user
  // - auth endpoints: 10/minute per IP
  ```
- [ ] Create `src/trpc/middleware/logging.ts`:
  - Log request start/end with duration
  - Log errors with stack traces
  - Redact sensitive fields (passwords, tokens)
- [ ] Create `src/trpc/middleware/timing.ts`:
  - Add `X-Response-Time` header
  - Add `X-Request-Id` header (UUID)
- [ ] Create `src/trpc/middleware/validation.ts`:
  - Input sanitization
  - Output type checking in development

### 2.2 Zod Schema Library (1h)

**Goal:** Comprehensive input validation

**Files:** `src/lib/validators/`, `src/lib/validators/index.ts`

- [ ] Create `src/lib/validators/common.ts`:
  - `orgId` - non-empty string
  - `userId` - non-empty string
  - `pagination` - { limit, offset, cursor }
  - `dateRange` - { from, to }
  - `sortOrder` - 'asc' | 'desc'
- [ ] Create `src/lib/validators/regulations.ts`
- [ ] Create `src/lib/validators/alerts.ts`
- [ ] Create `src/lib/validators/obligations.ts`
- [ ] Create `src/lib/validators/systems.ts`
- [ ] Create `src/lib/validators/evidence-packs.ts`
- [ ] Add custom error messages for all validators

### 2.3 Cursor-Based Pagination (1.5h)

**Goal:** Scalable pagination for large datasets

**Files:** `src/lib/pagination.ts`, all tRPC routers

- [ ] Create pagination utility:

  ```typescript
  interface CursorPaginationInput {
    cursor?: string // base64 encoded JSON
    limit: number
    direction: 'forward' | 'backward'
  }

  interface CursorPaginationOutput<T> {
    items: T[]
    pageInfo: {
      hasNextPage: boolean
      hasPreviousPage: boolean
      startCursor: string | null
      endCursor: string | null
    }
    totalCount: number
  }
  ```

- [ ] Update `regulations.list` to support cursor pagination
- [ ] Update `alerts.list` to support cursor pagination
- [ ] Update `obligations.list` to support cursor pagination
- [ ] Update `systems.list` to support cursor pagination
- [ ] Keep offset pagination as fallback option

### 2.4 Caching Layer (1.5h)

**Goal:** Reduce database load for read-heavy endpoints

**Files:** `src/lib/cache.ts`, `src/lib/cache-keys.ts`

- [ ] Create in-memory cache with TTL:

  ```typescript
  interface CacheOptions {
    ttl: number // seconds
    staleWhileRevalidate?: number
  }

  // Cache key patterns
  const CACHE_KEYS = {
    dashboardStats: (orgId: string) => `dashboard:stats:${orgId}`,
    regulationsList: (orgId: string, hash: string) => `regulations:list:${orgId}:${hash}`,
    systemsList: (orgId: string) => `systems:list:${orgId}`,
  }
  ```

- [ ] Add cache invalidation on mutations
- [ ] Add cache headers to responses
- [ ] Create cache warmer for dashboard stats
- [ ] Add Redis adapter interface for production scaling

### 2.5 API Error Handling (1h)

**Goal:** Consistent, informative errors

**Files:** `src/lib/errors.ts`, `src/trpc/error-formatter.ts`

- [ ] Create custom error classes:

  ```typescript
  class CindralError extends Error {
    code: string
    statusCode: number
    context?: Record<string, unknown>
  }

  class NotFoundError extends CindralError {}
  class ValidationError extends CindralError {}
  class RateLimitError extends CindralError {}
  class AuthorizationError extends CindralError {}
  ```

- [ ] Configure tRPC error formatter with:
  - Stack traces in development only
  - Error codes mapping
  - User-friendly messages
- [ ] Add error tracking preparation (Sentry-ready)

### 2.6 Integration Tests (2h)

**Goal:** Test API contracts end-to-end

**Files:** `src/tests/integration/`

- [ ] Create test utilities:
  - `createTestContext(userId, orgId, role)`
  - `seedTestData()`
  - `cleanupTestData()`
- [ ] Test `regulations.list` with filters
- [ ] Test `regulations.getById` with relations
- [ ] Test `regulations.create` with validation
- [ ] Test `alerts.list` with pagination
- [ ] Test `alerts.updateStatus` with audit log
- [ ] Test `dashboard.getStats` accuracy
- [ ] Test `obligations.bulkUpdate`
- [ ] Test cross-org access denial

### 2.7 API Documentation (0.5h)

**Goal:** Self-documenting API

**Files:** `docs/API.md`

- [ ] Document all endpoints with examples
- [ ] Document error codes and meanings
- [ ] Document rate limits
- [ ] Add Postman/Insomnia collection export

---

## Day 3 — Dashboard & Real-Time Features

### 3.1 Live Data Integration (1.5h)

**Goal:** Replace all mock data with live tRPC hooks

**Files:** `src/app/dashboard/_components/*`

- [ ] `regulatory-feed.tsx`:
  - Remove demo data fallback for authenticated users
  - Add error retry with exponential backoff
  - Add empty state when no changes
- [ ] `recent-alerts.tsx`:
  - Wire to `dashboard.getRecentAlerts`
  - Add click-to-view alert detail
  - Add severity color coding
- [ ] `compliance-status.tsx`:
  - Wire to `dashboard.getComplianceByRegulation`
  - Show compliance rate per regulation
  - Add trend indicators
- [ ] `system-impact-overview.tsx`:
  - Wire to `dashboard.getSystemImpactOverview`
  - Show top 5 at-risk systems
  - Add click-through to system detail

### 3.2 Skeleton Loaders & Error Boundaries (1h)

**Goal:** Production-grade loading states

**Files:** `src/components/ui/skeleton.tsx`, `src/components/error-boundary.tsx`

- [ ] Create `DashboardCardSkeleton` component
- [ ] Create `TableSkeleton` component with configurable rows
- [ ] Create `ChartSkeleton` component
- [ ] Create `ErrorBoundary` with:
  - Retry button
  - Error message display
  - Sentry error reporting
  - Fallback UI
- [ ] Wrap all dashboard cards in error boundaries

### 3.3 Real-Time Updates (1.5h)

**Goal:** Live data without manual refresh

**Files:** `src/lib/realtime.ts`, `src/hooks/use-realtime.ts`

- [ ] Implement polling hook:
  ```typescript
  function usePolling<T>(
    queryFn: () => Promise<T>,
    interval: number,
    options?: {
      enabled?: boolean
      onUpdate?: (data: T) => void
    }
  )
  ```
- [ ] Add polling to regulatory feed (30s interval)
- [ ] Add polling to alerts count (30s interval)
- [ ] Add visible "last updated" timestamp
- [ ] Add manual refresh button
- [ ] Create WebSocket stub for future enhancement:
  ```typescript
  // WebSocket events to support:
  // - alert:created
  // - alert:updated
  // - regulation:changed
  // - evidence_pack:ready
  ```

### 3.4 Notification Badge System (1h)

**Goal:** Alert users to new items

**Files:** `src/components/notification-badge.tsx`, `src/lib/last-seen.ts`

- [ ] Create localStorage-based last-seen tracker:
  ```typescript
  interface LastSeenState {
    alerts: string // ISO timestamp
    regulatoryChanges: string
  }
  ```
- [ ] Create `NotificationBadge` component with count
- [ ] Add badge to sidebar alerts link
- [ ] Add badge to regulatory feed header
- [ ] Clear badge on view (mark as seen)

### 3.5 Compliance Charts (1.5h)

**Goal:** Visual compliance insights

**Files:** `src/components/charts/`, `src/app/dashboard/_components/compliance-pie.tsx`

- [ ] Create `CompliancePieChart`:
  - Donut chart with 5 status segments
  - Center text showing overall %
  - Interactive tooltips
  - Click to filter obligations
- [ ] Create `ComplianceTrendChart`:
  - Line chart showing compliance over time
  - 30-day view
  - Compare multiple regulations
- [ ] Create `RiskHeatmap`:
  - Systems × Regulations matrix
  - Color by impact level
- [ ] Add proper ARIA labels for accessibility
- [ ] Add chart legends

### 3.6 Mobile Responsiveness (1h)

**Goal:** Usable on all devices

**Files:** All dashboard components

- [ ] Audit all cards for mobile layout
- [ ] Add collapsible sidebar on mobile
- [ ] Ensure touch-friendly tap targets (min 44px)
- [ ] Test on iPhone SE, iPhone 14, iPad Mini
- [ ] Fix any horizontal scroll issues
- [ ] Ensure charts resize properly

### 3.7 Dashboard Performance (0.5h)

**Goal:** Fast initial load

- [ ] Add `loading.tsx` for route-level suspense
- [ ] Implement parallel data fetching
- [ ] Add prefetching on hover for detail pages
- [ ] Measure and optimize LCP < 2.5s

---

## Day 4 — Navigation, Search & Onboarding

### 4.1 Header & Navigation Polish (1h)

**Goal:** Professional navigation experience

**Files:** `src/components/app-header.tsx`, `src/components/app-sidebar.tsx`

- [ ] Fix logo alignment and make clickable to /dashboard
- [ ] Add user avatar dropdown with:
  - Current organization display
  - Organization switcher
  - Profile link
  - Sign out
- [ ] Add breadcrumb navigation
- [ ] Add keyboard navigation (cmd+k for search)
- [ ] Add help/support link

### 4.2 Global Search (2h)

**Goal:** Find anything instantly

**Files:** `src/components/command-search.tsx`, `src/trpc/routers/search.ts`

- [ ] Create search router:
  ```typescript
  search.global: {
    input: { query: string, types?: string[] }
    output: {
      regulations: { id, name, match }[]
      articles: { id, title, regulationName, match }[]
      obligations: { id, title, status, match }[]
      systems: { id, name, match }[]
      alerts: { id, title, severity, match }[]
    }
  }
  ```
- [ ] Create Command palette (cmd+k):
  - Recent searches
  - Type-ahead suggestions
  - Result grouping by type
  - Keyboard navigation
  - Quick actions (create alert, etc.)
- [ ] Add search to header
- [ ] Index searchable fields with pg_trgm for fuzzy search

### 4.3 Onboarding Backend (1.5h)

**Goal:** Persist onboarding selections

**Files:** `src/trpc/routers/onboarding.ts`, `src/db/schema.ts`

- [ ] Add `onboarding_state` table:
  ```sql
  CREATE TABLE onboarding_state (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organization(id),
    industry TEXT,
    selected_regulations TEXT[],
    selected_systems JSONB,
    invited_emails JSONB,
    completed_at TIMESTAMP,
    current_step INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  );
  ```
- [ ] Create onboarding router:
  - `getState` - get current onboarding state
  - `updateStep` - save step progress
  - `complete` - mark as complete, trigger setup
- [ ] On completion:
  - Create regulations from selections
  - Create systems from templates
  - Queue invitation emails
  - Create initial alerts
  - Trigger initial ingest job

### 4.4 Onboarding Enforcement (1h)

**Goal:** Ensure all users complete onboarding

**Files:** `src/app/dashboard/layout.tsx`, `src/middleware.ts`

- [ ] Add onboarding check middleware:
  - Check if org has completed onboarding
  - Redirect to /dashboard/onboarding if incomplete
  - Allow access to /dashboard/onboarding without completion
  - Allow access to /dashboard/settings
- [ ] Add progress indicator in sidebar:
  - Show "Setup: 2/4 steps" badge
  - Link to onboarding page

### 4.5 Onboarding Wizard Improvements (1h)

**Goal:** Best-in-class setup experience

**Files:** `src/app/dashboard/onboarding/_components/onboarding-wizard.tsx`

- [ ] Connect to backend persistence
- [ ] Add step validation before progression
- [ ] Add "Resume where you left off" on return
- [ ] Add skip confirmation dialog
- [ ] Add completion celebration animation
- [ ] Trigger data seeding on completion

### 4.6 System Templates (1h)

**Goal:** Quick-add common systems

**Files:** `src/lib/system-templates.ts`

- [ ] Create comprehensive template library:
  - **Core Banking**: Core Banking Platform, Payment Switch, Card Management
  - **Cloud**: AWS/Azure/GCP Infrastructure, Kubernetes, Serverless
  - **Security**: IAM, SIEM, DLP, Endpoint Protection
  - **Data**: Data Warehouse, Data Lake, BI Platform
  - **Customer**: CRM, Mobile App, Web Portal
  - **Compliance**: GRC Tool, Audit Management, Policy Management
- [ ] Add template icons (Lucide icons mapped)
- [ ] Add suggested regulatory mappings per template

### 4.7 Onboarding Tests (0.5h)

**Goal:** Ensure onboarding flow works

**Files:** `src/tests/integration/onboarding.test.ts`

- [ ] Test state persistence
- [ ] Test completion flow
- [ ] Test skip handling
- [ ] Test invitation queuing

---

## Day 5 — Alerts, Evidence Packs & Obligations

### 5.1 Alerts List Page (2h)

**Goal:** Full-featured alert management

**Files:** `src/app/dashboard/alerts/page.tsx`

- [ ] Create filter panel:
  - Status multi-select
  - Severity multi-select
  - Type filter
  - Date range picker
  - Assigned to filter
  - Regulation filter
- [ ] Create sortable data table:
  - Columns: Title, Severity, Status, Type, Assigned, Due Date, Created
  - Click to expand details
  - Bulk selection checkboxes
- [ ] Add bulk actions toolbar:
  - Bulk status change
  - Bulk assign
  - Bulk delete (with confirmation)
- [ ] Add pagination with page size selector
- [ ] Add "Export to CSV" button

### 5.2 Alert Detail & Workflow (1.5h)

**Goal:** Complete alert lifecycle management

**Files:** `src/app/dashboard/alerts/[id]/page.tsx`

- [ ] Create alert detail drawer/page:
  - Title, description, metadata
  - Related regulation/article/system links
  - Timeline of status changes
  - Comments section
- [ ] Add status workflow buttons:
  - Open → In Triage → In Progress → Resolved/Won't Fix
  - Require resolution notes for closing
- [ ] Add assignment dropdown:
  - List org members
  - Show current assignee
  - Trigger notification on assign
- [ ] Add due date picker
- [ ] Add related items section

### 5.3 Evidence Pack Generator UI (2h)

**Goal:** Self-service evidence generation

**Files:** `src/app/dashboard/evidence-packs/page.tsx`, `src/app/dashboard/evidence-packs/generate/page.tsx`

- [ ] Create evidence pack list page:
  - Table with: Title, Regulation, Status, Format, Created, Download
  - Status badges: Draft, Generating, Ready, Failed
  - Quick actions: Download, Regenerate, Delete
- [ ] Create generation wizard:
  - Step 1: Select regulation
  - Step 2: Select scope (all articles or specific)
  - Step 3: Select systems to include
  - Step 4: Choose format (PDF, JSON, Confluence)
  - Step 5: Choose audience (Internal, Auditor, Regulator)
  - Step 6: Review and generate

### 5.4 Evidence Pack Backend (1.5h)

**Goal:** Actual evidence generation

**Files:** `src/lib/evidence-generator.ts`, `scripts/jobs/generate-evidence.ts`

- [ ] Create evidence generator service:
  ```typescript
  interface EvidencePackContent {
    metadata: { title; generatedAt; generatedBy; scope }
    executiveSummary: { complianceRate; obligationsCount; systemsCount }
    regulationOverview: { name; framework; effectiveDate }
    obligationsByArticle: Array<{
      article: { number; title }
      obligations: Array<{
        id
        title
        status
        owner
        evidence
      }>
    }>
    systemsCoverage: Array<{
      system: { name; category }
      impactedBy: string[]
    }>
    gaps: Array<{ obligation; reason }>
  }
  ```
- [ ] Create PDF generator using React-PDF or Puppeteer
- [ ] Create JSON export
- [ ] Add file storage (local for dev, S3 for production)
- [ ] Update pack status and download URL on completion

### 5.5 Evidence Pack Progress UI (0.5h)

**Goal:** Show generation progress

**Files:** `src/app/dashboard/evidence-packs/[id]/page.tsx`

- [ ] Show progress stages:
  - Queued → Gathering Data → Generating Document → Uploading → Ready
- [ ] Add progress percentage
- [ ] Show download button when ready
- [ ] Show error details and retry on failure

### 5.6 Obligations Management (1.5h)

**Goal:** Full obligation lifecycle

**Files:** `src/app/dashboard/obligations/page.tsx`

- [ ] Create obligations table:
  - Columns: Reference, Title, Regulation, Article, Status, Risk, Due Date, Owner
  - Status pills with colors
  - Expandable rows with details
- [ ] Add bulk status update:
  - Select multiple obligations
  - Change status in batch
  - Add bulk notes
- [ ] Add Kanban view option:
  - Columns by status
  - Drag-and-drop to change status
- [ ] Add owner assignment
- [ ] Add due date management

### 5.7 Email Notifications (1h)

**Goal:** Keep users informed

**Files:** `src/lib/email.ts`, `src/lib/email-templates/`

- [ ] Create email service interface:
  ```typescript
  interface EmailService {
    sendAlertAssignment(to: string, alert: Alert): Promise<void>
    sendAlertStatusChange(to: string, alert: Alert): Promise<void>
    sendEvidencePackReady(to: string, pack: EvidencePack): Promise<void>
    sendInvitation(to: string, org: Organization, inviter: User): Promise<void>
    sendPasswordReset(to: string, token: string): Promise<void>
  }
  ```
- [ ] Create email templates (React Email or MJML):
  - Alert assignment
  - Alert status change
  - Evidence pack ready
  - Invitation
  - Password reset
- [ ] Implement with Resend/SendGrid (dev mode: console.log)
- [ ] Add email queue for batching

---

## Day 6 — System Map, Integrations & Auth

### 6.1 Interactive System Map (3h)

**Goal:** Visual system-regulation relationships

**Files:** `src/app/dashboard/system-map/page.tsx`, `src/components/system-map/`

- [ ] Implement with @xyflow/react:
  - Node types: System, Regulation, Article
  - Edge types: Impact (colored by level)
  - Layout: Hierarchical (regulations → articles → systems)
- [ ] Add node interactions:
  - Click to select
  - Double-click to open detail
  - Right-click context menu
- [ ] Add CRUD for nodes/edges:
  - Create new system node
  - Connect system to article
  - Delete connections
- [ ] Add position persistence:
  - Store node positions in DB
  - Load saved layout
- [ ] Add filtering:
  - Show/hide by regulation
  - Show/hide by impact level
  - Search nodes

### 6.2 System Map Export (0.5h)

**Goal:** Share system maps

**Files:** `src/lib/graph-export.ts`

- [ ] Export to PNG (using html-to-image)
- [ ] Export to SVG
- [ ] Export to PDF
- [ ] Add export button to toolbar

### 6.3 Integration Stubs (1.5h)

**Goal:** Framework for third-party integrations

**Files:** `src/trpc/routers/integrations.ts`, `src/lib/integrations/`

- [ ] Create integrations table:
  ```sql
  CREATE TABLE integrations (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organization(id),
    provider TEXT NOT NULL, -- 'jira', 'confluence', 'servicenow'
    config JSONB, -- encrypted credentials
    status TEXT DEFAULT 'pending',
    last_sync_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
  );
  ```
- [ ] Create integration router:
  - `list` - get all integrations for org
  - `connect` - initiate OAuth flow
  - `disconnect` - revoke access
  - `sync` - trigger manual sync
- [ ] Create Jira stub:
  - OAuth flow placeholder
  - Export alerts as issues
  - Import issue status updates
- [ ] Create Confluence stub:
  - OAuth flow placeholder
  - Export evidence packs as pages

### 6.4 Billing Foundation (1h)

**Goal:** Stripe integration ready

**Files:** `src/trpc/routers/billing.ts`, `src/app/api/webhooks/stripe/route.ts`

- [ ] Add billing columns to organization:
  ```sql
  ALTER TABLE organization ADD COLUMN stripe_customer_id TEXT;
  ALTER TABLE organization ADD COLUMN subscription_status TEXT;
  ALTER TABLE organization ADD COLUMN plan TEXT DEFAULT 'free';
  ```
- [ ] Create billing router:
  - `createCheckoutSession` - Stripe Checkout
  - `createBillingPortalSession` - manage subscription
  - `getSubscription` - current plan details
- [ ] Create Stripe webhook handler:
  - `checkout.session.completed`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
- [ ] Add plan limits configuration

### 6.5 Auth: Forgot Password (1h)

**Goal:** Self-service password recovery

**Files:** `src/app/(auth)/forgot-password/page.tsx`, `src/app/(auth)/reset-password/page.tsx`

- [ ] Create forgot password page:
  - Email input
  - Submit button
  - Success message
- [ ] Configure Better Auth forgot password:
  - Token generation
  - Email sending
  - Token expiry (1 hour)
- [ ] Create reset password page:
  - Token from URL
  - New password input
  - Confirm password
  - Submit and redirect to signin

### 6.6 Auth: Email Verification (0.5h)

**Goal:** Verified user emails

**Files:** `src/app/(auth)/verify-email/page.tsx`

- [ ] Enable `requireEmailVerification` in Better Auth config
- [ ] Create verify email page:
  - Token from URL
  - Auto-verify on load
  - Success/error messages
- [ ] Create "Resend verification" option

### 6.7 OAuth Providers (1h)

**Goal:** Social login options

**Files:** `src/lib/auth.ts`

- [ ] Add Google OAuth:
  ```typescript
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  }
  ```
- [ ] Add Microsoft OAuth:
  ```typescript
  microsoft: {
    clientId: process.env.MICROSOFT_CLIENT_ID!,
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
    tenantId: 'common', // or specific tenant
  }
  ```
- [ ] Add OAuth buttons to signin/signup pages
- [ ] Handle account linking (same email)

### 6.8 Auth Security Tests (0.5h)

**Goal:** Verify security measures

**Files:** `src/tests/integration/auth.test.ts`

- [ ] Test login rate limiting (10 attempts)
- [ ] Test password requirements
- [ ] Test session expiry
- [ ] Test token refresh
- [ ] Test password reset token expiry

---

## Day 7 — Monitoring, AI, E2E & Polish

### 7.1 Sentry Integration (1h)

**Goal:** Error tracking and performance monitoring

**Files:** `src/lib/sentry.ts`, `next.config.ts`

- [ ] Install and configure Sentry:
  ```bash
  npm install @sentry/nextjs
  npx @sentry/wizard@latest -i nextjs
  ```
- [ ] Configure source maps upload
- [ ] Add custom context (user, org, request)
- [ ] Add performance tracing to:
  - tRPC procedures
  - Database queries
  - External API calls
- [ ] Create error boundary with Sentry reporting
- [ ] Add release tracking

### 7.2 Accessibility Audit (1.5h)

**Goal:** WCAG 2.1 AA compliance

**Files:** All components

- [ ] Run axe-core audit on all pages
- [ ] Fix top issues:
  - Color contrast (4.5:1 minimum)
  - Missing form labels
  - Missing alt text
  - Keyboard focus indicators
  - ARIA labels on interactive elements
  - Skip navigation link
  - Focus trapping in modals
- [ ] Test with screen reader (VoiceOver)
- [ ] Test keyboard-only navigation

### 7.3 Playwright E2E Tests (2h)

**Goal:** Critical path coverage

**Files:** `e2e/`, `playwright.config.ts`

- [ ] Install and configure Playwright:
  ```bash
  npm install -D @playwright/test
  npx playwright install
  ```
- [ ] Create test utilities:
  - Auth helpers (login as user)
  - Data setup/teardown
  - Screenshot comparison
- [ ] Write critical flow tests:
  - **Sign up flow**: Register → Verify email → Create org → Onboarding
  - **Login flow**: Login → Dashboard loads → Data visible
  - **Regulation view**: Navigate → Filter → View detail
  - **Alert workflow**: Create → Assign → Resolve
  - **Evidence pack**: Generate → Wait for ready → Download
  - **Search**: Open search → Type → Navigate to result
- [ ] Configure CI pipeline (GitHub Actions)

### 7.4 AI Setup & Caching (1.5h)

**Goal:** AI-powered features foundation

**Files:** `src/lib/ai.ts`, `src/lib/ai-cache.ts`

- [ ] Create AI service abstraction:
  ```typescript
  interface AIService {
    summarize(text: string, maxLength?: number): Promise<string>
    extractObligations(articleText: string): Promise<Obligation[]>
    assessImpact(article: Article, system: System): Promise<ImpactAssessment>
  }
  ```
- [ ] Implement with Anthropic Claude:
  - API key from environment
  - Rate limiting (60 RPM)
  - Retry with exponential backoff
- [ ] Add response caching:
  - Cache key: hash of input + model version
  - TTL: 7 days
  - Store: PostgreSQL or Redis
- [ ] Add usage tracking for billing

### 7.5 Regulation Summarizer (1h)

**Goal:** AI-powered article summaries

**Files:** `src/trpc/routers/ai.ts`

- [ ] Create AI router:
  ```typescript
  ai.summarizeArticle: {
    input: { articleId: string }
    output: {
      summary: string
      keyPoints: string[]
      implications: string[]
      cached: boolean
      generatedAt: string
    }
  }
  ```
- [ ] Add "Generate Summary" button to article detail
- [ ] Show cached indicator
- [ ] Allow regeneration (clear cache)

### 7.6 Analytics Events (1h)

**Goal:** User behavior tracking

**Files:** `src/lib/analytics.ts`

- [ ] Create analytics abstraction:
  ```typescript
  interface Analytics {
    track(event: string, properties?: Record<string, unknown>): void
    identify(userId: string, traits?: Record<string, unknown>): void
    page(name: string, properties?: Record<string, unknown>): void
  }
  ```
- [ ] Implement with console.log for development
- [ ] Add Amplitude/Mixpanel adapter for production
- [ ] Track key events:
  - `onboarding_started`
  - `onboarding_completed`
  - `regulation_viewed`
  - `alert_created`
  - `alert_resolved`
  - `evidence_pack_generated`
  - `search_performed`

### 7.7 Marketing Site Polish (1h)

**Goal:** Launch-ready marketing

**Files:** `public/`, `src/app/(marketing)/`

- [ ] Create proper favicon (32x32, 180x180, 192x192, 512x512)
- [ ] Create OG image (1200x630):
  - Brand colors
  - Logo
  - Tagline
- [ ] Update screenshots with real app images
- [ ] Review and update copy:
  - Pricing page (if applicable)
  - Features page
  - About page
- [ ] Add JSON-LD structured data
- [ ] Verify meta tags on all pages

### 7.8 Final Review & Launch Prep (1h)

**Goal:** Ship-ready application

- [ ] Run full test suite:
  ```bash
  npm run test:unit
  npm run test:integration
  npm run test:e2e
  ```
- [ ] Run lighthouse audit (target: 90+ all categories)
- [ ] Run security audit:
  ```bash
  npm audit
  ```
- [ ] Create `CHANGELOG.md` with all changes
- [ ] Create deployment checklist:
  - Environment variables
  - Database migrations
  - DNS configuration
  - SSL certificates
  - Backup verification
- [ ] Write launch announcement

---

## Environment Variables Reference

```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/cindral
DATABASE_POOL_SIZE=20

# Auth
BETTER_AUTH_SECRET=<32+ char random string>
BETTER_AUTH_URL=https://app.trycindral.com
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
MICROSOFT_CLIENT_ID=
MICROSOFT_CLIENT_SECRET=

# AI
ANTHROPIC_API_KEY=

# Email
RESEND_API_KEY=
EMAIL_FROM=notifications@trycindral.com

# Storage
S3_BUCKET=cindral-evidence-packs
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=eu-west-1

# Monitoring
SENTRY_DSN=
SENTRY_AUTH_TOKEN=

# Analytics
AMPLITUDE_API_KEY=

# Payments
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_ID_PRO=

# Feature Flags
ENABLE_AI_FEATURES=true
ENABLE_REALTIME=true
```

---

## Success Criteria

By end of Day 7, the application MUST:

1. **Database**
   - ✅ Seed completes without errors
   - ✅ All FK constraints enforced
   - ✅ Organization isolation verified
   - ✅ Backup/restore tested

2. **API**
   - ✅ All endpoints return expected data
   - ✅ Rate limiting active
   - ✅ Proper error responses
   - ✅ < 200ms p95 latency

3. **UI**
   - ✅ Dashboard loads in < 2s
   - ✅ All data is live (no mocks)
   - ✅ Mobile responsive
   - ✅ WCAG 2.1 AA compliant

4. **Auth**
   - ✅ Sign up/in works
   - ✅ Password reset works
   - ✅ OAuth works
   - ✅ Session management works

5. **Features**
   - ✅ Onboarding flow complete
   - ✅ Alerts CRUD works
   - ✅ Evidence pack generation works
   - ✅ System map displays and persists

6. **Quality**
   - ✅ 80%+ test coverage
   - ✅ 0 critical bugs
   - ✅ Lighthouse 90+ all categories
   - ✅ Sentry capturing errors

---

## Time Budget Summary

| Day       | Focus Area              | Total Hours |
| --------- | ----------------------- | ----------- |
| 1         | Database & Architecture | 8h          |
| 2         | API Layer & Caching     | 9h          |
| 3         | Dashboard & Real-Time   | 8h          |
| 4         | Navigation & Onboarding | 8h          |
| 5         | Alerts & Evidence Packs | 10h         |
| 6         | System Map & Auth       | 9h          |
| 7         | Monitoring & Polish     | 10h         |
| **Total** |                         | **62h**     |

Assumes ~9 hours of focused work per day with breaks.

---

_Built with intensity. Shipped with pride. Ready for YC._
