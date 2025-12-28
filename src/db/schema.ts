import { relations, sql } from 'drizzle-orm'
import {
  index,
  integer,
  json,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core'

/**
 * Better-Auth Tables
 * Re-export from generated schema
 * To regenerate: bunx @better-auth/cli generate
 */
export {
  account,
  accountRelations,
  invitation,
  invitationRelations,
  member,
  memberRelations,
  organization,
  organizationRelations,
  session,
  // Re-export the generated relations (we'll extend userRelations below)
  sessionRelations,
  user,
  verification,
} from '../../auth-schema'

// Import for use in this file
import { invitation, member, organization, session, user } from '../../auth-schema'

/**
 * Enums
 */

// Role enum for organization members
export const roleEnum = pgEnum('role', ['OrgAdmin', 'ComplianceManager', 'Auditor', 'Viewer', 'BillingAdmin'])

// Severity levels
export const severityEnum = pgEnum('severity', ['info', 'low', 'medium', 'high', 'critical'])

// Alert status workflow
export const alertStatusEnum = pgEnum('alert_status', ['open', 'in_triage', 'in_progress', 'resolved', 'wont_fix'])

// Alert type enum
export const alertTypeEnum = pgEnum('alert_type', [
  'obligation_overdue',
  'regulation_changed',
  'evidence_pack_failed',
  'system_unmapped',
])

// Obligation status (5-state workflow)
export const obligationStatusEnum = pgEnum('obligation_status', [
  'not_started',
  'in_progress',
  'implemented',
  'under_review',
  'verified',
])

// Requirement type for obligations
export const requirementTypeEnum = pgEnum('requirement_type', ['process', 'technical', 'reporting'])

// Risk level enum
export const riskLevelEnum = pgEnum('risk_level', ['low', 'medium', 'high', 'critical'])

// Impact level (same as severity for article impacts)
export const impactLevelEnum = pgEnum('impact_level', ['critical', 'high', 'medium', 'low'])

// Evidence pack status
export const evidenceStatusEnum = pgEnum('evidence_status', ['draft', 'generating', 'ready', 'failed', 'archived'])

// Mapping confidence
export const mappingConfidenceEnum = pgEnum('mapping_confidence', ['low', 'medium', 'high'])

// Mapped by
export const mappedByEnum = pgEnum('mapped_by', ['llm', 'human'])

// Review status
export const reviewStatusEnum = pgEnum('review_status', ['pending', 'approved', 'rejected'])

// Regulation status
export const regulationStatusEnum = pgEnum('regulation_status', ['active', 'superseded', 'draft'])

// Source type
export const sourceTypeEnum = pgEnum('source_type', ['eur-lex', 'manual-upload', 'api', 'llm', 'manual'])

// Ingest job status
export const ingestJobStatusEnum = pgEnum('ingest_job_status', ['pending', 'running', 'succeeded', 'failed', 'partial'])

/**
 * Ingest jobs - track ingestion work
 */
export const ingestJobs = pgTable(
  'ingest_jobs',
  {
    id: text('id').primaryKey(),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),
    source: varchar('source', { length: 100 }).notNull(),
    sourceUrl: text('source_url'),
    status: ingestJobStatusEnum('status').default('pending'),
    startedAt: timestamp('started_at'),
    finishedAt: timestamp('finished_at'),
    log: text('log'),
    errorMessage: text('error_message'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [index('ingest_jobs_org_idx').on(table.organizationId)]
)

/**
 * Regulations - DORA, GDPR, AI Act, Basel III, etc.
 */
export const regulations = pgTable(
  'regulations',
  {
    id: text('id').primaryKey(), // e.g., 'dora', 'gdpr', 'ai-act'
    organizationId: text('organization_id')
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 255 }).notNull(),
    framework: varchar('framework', { length: 100 }).notNull(),
    version: varchar('version', { length: 50 }),
    status: regulationStatusEnum('status').default('active'),
    fullTitle: text('full_title').notNull(),
    jurisdiction: varchar('jurisdiction', { length: 100 }),
    effectiveDate: timestamp('effective_date'),
    lastUpdated: timestamp('last_updated'),
    // Provenance
    sourceUrl: text('source_url'),
    sourceType: sourceTypeEnum('source_type'),
    ingestJobId: text('ingest_job_id').references(() => ingestJobs.id, { onDelete: 'set null' }),
    ingestTimestamp: timestamp('ingest_timestamp'),
    checksum: text('checksum'),
    // Optimistic locking
    lockVersion: integer('lock_version').notNull().default(1),
    // Soft delete
    deletedAt: timestamp('deleted_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('regulations_org_id_idx').on(table.organizationId, table.id),
    index('regulations_org_framework_idx').on(table.organizationId, table.framework),
    uniqueIndex('regulations_org_slug_idx').on(table.organizationId, table.slug),
  ]
)

/**
 * Articles - Individual articles within regulations
 */
export const articles = pgTable(
  'articles',
  {
    id: text('id').primaryKey(), // e.g., 'dora-article-11'
    organizationId: text('organization_id')
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),
    regulationId: text('regulation_id')
      .notNull()
      .references(() => regulations.id, { onDelete: 'cascade' }),
    articleNumber: varchar('article_number', { length: 100 }).notNull(),
    sectionTitle: text('section_title'),
    title: text('title'),
    rawText: text('raw_text'),
    normalizedText: text('normalized_text'),
    description: text('description'),
    // Provenance
    sourceUrl: text('source_url'),
    ingestJobId: text('ingest_job_id').references(() => ingestJobs.id, { onDelete: 'set null' }),
    ingestTimestamp: timestamp('ingest_timestamp'),
    checksum: text('checksum'),
    // Review workflow
    humanReviewedBy: text('human_reviewed_by').references(() => user.id, { onDelete: 'set null' }),
    humanReviewedAt: timestamp('human_reviewed_at'),
    reviewStatus: reviewStatusEnum('review_status').default('pending'),
    aiSummary: text('ai_summary'),
    // Soft delete
    deletedAt: timestamp('deleted_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('articles_org_reg_idx').on(table.organizationId, table.regulationId, table.articleNumber),
    index('articles_org_id_idx').on(table.organizationId, table.id),
  ]
)

/**
 * Systems - IT systems tracked for compliance
 */
export const systems = pgTable(
  'systems',
  {
    id: text('id').primaryKey(),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 255 }),
    category: varchar('category', { length: 100 }),
    criticality: severityEnum('criticality'),
    dataClassification: varchar('data_classification', { length: 100 }),
    description: text('description'),
    ownerTeam: varchar('owner_team', { length: 200 }),
    ownerUserId: text('owner_user_id').references(() => user.id, { onDelete: 'set null' }),
    // Tags for filtering
    tags: text('tags')
      .array()
      .default(sql`'{}'::text[]`),
    // External system integration (CMDB, ServiceNow, etc.)
    externalId: varchar('external_id', { length: 255 }),
    externalSource: varchar('external_source', { length: 100 }),
    // Soft delete
    deletedAt: timestamp('deleted_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('systems_org_id_idx').on(table.organizationId, table.id),
    uniqueIndex('systems_org_slug_idx').on(table.organizationId, table.slug),
  ]
)

/**
 * Obligations - Compliance obligations derived from articles
 */
export const obligations = pgTable(
  'obligations',
  {
    id: text('id').primaryKey(), // e.g., 'OBL-DORA-11-001'
    organizationId: text('organization_id')
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),
    regulationId: text('regulation_id').references(() => regulations.id, { onDelete: 'cascade' }),
    articleId: text('article_id')
      .notNull()
      .references(() => articles.id, { onDelete: 'cascade' }),
    referenceCode: varchar('reference_code', { length: 255 }),
    title: varchar('title', { length: 500 }).notNull(),
    summary: text('summary'),
    requirementType: requirementTypeEnum('requirement_type'),
    riskLevel: riskLevelEnum('risk_level'),
    status: obligationStatusEnum('status').notNull().default('not_started'),
    // Provenance
    sourceType: sourceTypeEnum('source_type'),
    ingestJobId: text('ingest_job_id').references(() => ingestJobs.id, { onDelete: 'set null' }),
    ingestTimestamp: timestamp('ingest_timestamp'),
    checksum: text('checksum'),
    // Review
    humanReviewedBy: text('human_reviewed_by').references(() => user.id, { onDelete: 'set null' }),
    humanReviewedAt: timestamp('human_reviewed_at'),
    dueDate: timestamp('due_date'),
    ownerTeam: varchar('owner_team', { length: 200 }),
    ownerUserId: text('owner_user_id').references(() => user.id, { onDelete: 'set null' }),
    // Soft delete
    deletedAt: timestamp('deleted_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('obligations_org_status_idx').on(table.organizationId, table.status),
    index('obligations_org_risk_idx').on(table.organizationId, table.riskLevel),
    index('obligations_org_reg_idx').on(table.organizationId, table.regulationId),
    index('obligations_org_id_idx').on(table.organizationId, table.id),
    index('obligations_due_date_idx').on(table.organizationId, table.dueDate),
  ]
)

/**
 * Article-System Impact - Maps which systems are affected by which articles
 */
export const articleSystemImpacts = pgTable(
  'article_system_impacts',
  {
    id: serial('id').primaryKey(),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),
    articleId: text('article_id')
      .notNull()
      .references(() => articles.id, { onDelete: 'cascade' }),
    systemId: text('system_id')
      .notNull()
      .references(() => systems.id, { onDelete: 'cascade' }),
    impactLevel: impactLevelEnum('impact_level').notNull(),
    status: alertStatusEnum('status').default('open'),
    notes: text('notes'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('article_system_impacts_org_idx').on(table.organizationId),
    uniqueIndex('article_system_impacts_unique_idx').on(table.organizationId, table.articleId, table.systemId),
  ]
)

/**
 * Obligation <-> System mappings (explicit)
 */
export const obligationSystemMappings = pgTable(
  'obligation_system_mappings',
  {
    id: serial('id').primaryKey(),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),
    obligationId: text('obligation_id')
      .notNull()
      .references(() => obligations.id, { onDelete: 'cascade' }),
    systemId: text('system_id')
      .notNull()
      .references(() => systems.id, { onDelete: 'cascade' }),
    mappingConfidence: mappingConfidenceEnum('mapping_confidence').default('medium'),
    mappedBy: mappedByEnum('mapped_by').default('human'),
    reason: text('reason'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('obligation_system_mappings_org_idx').on(table.organizationId),
    uniqueIndex('obligation_system_mappings_unique_idx').on(table.organizationId, table.obligationId, table.systemId),
  ]
)

/**
 * Evidence Packs - Generated compliance documentation bundles
 */
export const evidencePacks = pgTable(
  'evidence_packs',
  {
    id: serial('id').primaryKey(),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 255 }),
    description: text('description'),
    framework: varchar('framework', { length: 100 }),
    jurisdiction: varchar('jurisdiction', { length: 100 }),
    status: evidenceStatusEnum('status').default('draft'),
    regulationId: text('regulation_id').references(() => regulations.id, { onDelete: 'cascade' }),
    systemId: text('system_id').references(() => systems.id, { onDelete: 'set null' }),
    articleId: text('article_id').references(() => articles.id, { onDelete: 'set null' }),
    requestedByUserId: text('requested_by_user_id').references(() => user.id, { onDelete: 'set null' }),
    intendedAudience: varchar('intended_audience', { length: 50 }), // 'internal', 'auditor', 'regulator'
    jobId: text('job_id'),
    lastGeneratedAt: timestamp('last_generated_at'),
    downloadUrl: text('download_url'),
    storageLocation: text('storage_location'),
    exportFormat: varchar('export_format', { length: 50 }),
    generatedAt: timestamp('generated_at').notNull().defaultNow(),
    // Soft delete
    deletedAt: timestamp('deleted_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('evidence_packs_org_status_idx').on(table.organizationId, table.status),
    index('evidence_packs_org_id_idx').on(table.organizationId, table.id),
    index('evidence_packs_regulation_idx').on(table.organizationId, table.regulationId),
  ]
)

/**
 * Alerts - Regulatory change alerts
 */
export const alerts = pgTable(
  'alerts',
  {
    id: text('id').primaryKey(), // e.g., 'ALT-001'
    organizationId: text('organization_id')
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),
    type: alertTypeEnum('type'),
    severity: severityEnum('severity').notNull(),
    status: alertStatusEnum('status').notNull().default('open'),
    title: varchar('title', { length: 500 }).notNull(),
    description: text('description'),
    context: json('context'), // JSONB for extra metadata
    // Related entities (nullable FKs)
    regulationId: text('regulation_id').references(() => regulations.id, { onDelete: 'set null' }),
    articleId: text('article_id').references(() => articles.id, { onDelete: 'set null' }),
    obligationId: text('obligation_id').references(() => obligations.id, { onDelete: 'set null' }),
    systemId: text('system_id').references(() => systems.id, { onDelete: 'set null' }),
    evidencePackId: integer('evidence_pack_id').references(() => evidencePacks.id, { onDelete: 'set null' }),
    // Assignment and resolution
    assignedToUserId: text('assigned_to_user_id').references(() => user.id, { onDelete: 'set null' }),
    dueDate: timestamp('due_date'),
    resolvedAt: timestamp('resolved_at'),
    resolvedByUserId: text('resolved_by_user_id').references(() => user.id, { onDelete: 'set null' }),
    resolutionNotes: text('resolution_notes'),
    // Priority for custom ordering (lower = higher priority)
    priority: integer('priority').default(0),
    // Soft delete
    deletedAt: timestamp('deleted_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('alerts_org_status_idx').on(table.organizationId, table.status),
    index('alerts_org_severity_idx').on(table.organizationId, table.severity),
    index('alerts_org_created_idx').on(table.organizationId, table.createdAt),
    index('alerts_org_id_idx').on(table.organizationId, table.id),
    index('alerts_priority_idx').on(table.organizationId, table.priority, table.createdAt),
    index('alerts_assigned_idx').on(table.assignedToUserId, table.status),
  ]
)

// Note: integer imported at top for evidencePackId reference

/**
 * Audit log - records all critical mutations
 */
export const auditLog = pgTable(
  'audit_log',
  {
    id: serial('id').primaryKey(),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),
    actorUserId: text('actor_user_id').references(() => user.id, { onDelete: 'set null' }),
    action: varchar('action', { length: 200 }).notNull(),
    entityType: varchar('entity_type', { length: 100 }).notNull(),
    entityId: text('entity_id'),
    diff: json('diff'),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    // Session correlation
    sessionId: text('session_id'),
    requestId: text('request_id'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('audit_log_org_idx').on(table.organizationId),
    index('audit_log_entity_idx').on(table.entityType, table.entityId),
    index('audit_log_actor_idx').on(table.actorUserId),
    index('audit_log_created_idx').on(table.organizationId, table.createdAt),
    index('audit_log_session_idx').on(table.sessionId),
  ]
)

/**
 * Regulatory Change Feed - Timeline of regulatory updates
 */
export const regulatoryChanges = pgTable(
  'regulatory_changes',
  {
    id: serial('id').primaryKey(),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),
    regulationId: text('regulation_id')
      .notNull()
      .references(() => regulations.id, { onDelete: 'cascade' }),
    articleId: text('article_id').references(() => articles.id, { onDelete: 'set null' }),
    title: varchar('title', { length: 500 }).notNull(),
    description: text('description'),
    severity: severityEnum('severity').notNull(),
    changesCount: integer('changes_count').default(0),
    publishedAt: timestamp('published_at').notNull().defaultNow(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [index('regulatory_changes_org_idx').on(table.organizationId)]
)

/**
 * Application Relations
 */

// Extend user relations to include alerts
export const userRelations = relations(user, ({ many }) => ({
  alerts: many(alerts),
  ownedSystems: many(systems),
  ownedObligations: many(obligations),
}))

export const regulationsRelations = relations(regulations, ({ one, many }) => ({
  organization: one(organization, {
    fields: [regulations.organizationId],
    references: [organization.id],
  }),
  ingestJob: one(ingestJobs, {
    fields: [regulations.ingestJobId],
    references: [ingestJobs.id],
  }),
  articles: many(articles),
  alerts: many(alerts),
  regulatoryChanges: many(regulatoryChanges),
  evidencePacks: many(evidencePacks),
  obligations: many(obligations),
}))

export const articlesRelations = relations(articles, ({ one, many }) => ({
  organization: one(organization, {
    fields: [articles.organizationId],
    references: [organization.id],
  }),
  regulation: one(regulations, {
    fields: [articles.regulationId],
    references: [regulations.id],
  }),
  ingestJob: one(ingestJobs, {
    fields: [articles.ingestJobId],
    references: [ingestJobs.id],
  }),
  obligations: many(obligations),
  systemImpacts: many(articleSystemImpacts),
  alerts: many(alerts),
}))

export const systemsRelations = relations(systems, ({ one, many }) => ({
  organization: one(organization, {
    fields: [systems.organizationId],
    references: [organization.id],
  }),
  owner: one(user, {
    fields: [systems.ownerUserId],
    references: [user.id],
  }),
  articleImpacts: many(articleSystemImpacts),
  obligationMappings: many(obligationSystemMappings),
  alerts: many(alerts),
  evidencePacks: many(evidencePacks),
}))

export const articleSystemImpactsRelations = relations(articleSystemImpacts, ({ one }) => ({
  organization: one(organization, {
    fields: [articleSystemImpacts.organizationId],
    references: [organization.id],
  }),
  article: one(articles, {
    fields: [articleSystemImpacts.articleId],
    references: [articles.id],
  }),
  system: one(systems, {
    fields: [articleSystemImpacts.systemId],
    references: [systems.id],
  }),
}))

export const obligationsRelations = relations(obligations, ({ one, many }) => ({
  organization: one(organization, {
    fields: [obligations.organizationId],
    references: [organization.id],
  }),
  regulation: one(regulations, {
    fields: [obligations.regulationId],
    references: [regulations.id],
  }),
  article: one(articles, {
    fields: [obligations.articleId],
    references: [articles.id],
  }),
  ingestJob: one(ingestJobs, {
    fields: [obligations.ingestJobId],
    references: [ingestJobs.id],
  }),
  owner: one(user, {
    fields: [obligations.ownerUserId],
    references: [user.id],
  }),
  systemMappings: many(obligationSystemMappings),
  alerts: many(alerts),
}))

export const obligationSystemMappingsRelations = relations(obligationSystemMappings, ({ one }) => ({
  organization: one(organization, {
    fields: [obligationSystemMappings.organizationId],
    references: [organization.id],
  }),
  obligation: one(obligations, {
    fields: [obligationSystemMappings.obligationId],
    references: [obligations.id],
  }),
  system: one(systems, {
    fields: [obligationSystemMappings.systemId],
    references: [systems.id],
  }),
}))

export const alertsRelations = relations(alerts, ({ one }) => ({
  organization: one(organization, {
    fields: [alerts.organizationId],
    references: [organization.id],
  }),
  regulation: one(regulations, {
    fields: [alerts.regulationId],
    references: [regulations.id],
  }),
  article: one(articles, {
    fields: [alerts.articleId],
    references: [articles.id],
  }),
  obligation: one(obligations, {
    fields: [alerts.obligationId],
    references: [obligations.id],
  }),
  system: one(systems, {
    fields: [alerts.systemId],
    references: [systems.id],
  }),
  evidencePack: one(evidencePacks, {
    fields: [alerts.evidencePackId],
    references: [evidencePacks.id],
  }),
  assignedTo: one(user, {
    fields: [alerts.assignedToUserId],
    references: [user.id],
  }),
  resolvedBy: one(user, {
    fields: [alerts.resolvedByUserId],
    references: [user.id],
  }),
}))

export const evidencePacksRelations = relations(evidencePacks, ({ one }) => ({
  organization: one(organization, {
    fields: [evidencePacks.organizationId],
    references: [organization.id],
  }),
  regulation: one(regulations, {
    fields: [evidencePacks.regulationId],
    references: [regulations.id],
  }),
  system: one(systems, {
    fields: [evidencePacks.systemId],
    references: [systems.id],
  }),
  article: one(articles, {
    fields: [evidencePacks.articleId],
    references: [articles.id],
  }),
  requestedBy: one(user, {
    fields: [evidencePacks.requestedByUserId],
    references: [user.id],
  }),
}))

export const regulatoryChangesRelations = relations(regulatoryChanges, ({ one }) => ({
  organization: one(organization, {
    fields: [regulatoryChanges.organizationId],
    references: [organization.id],
  }),
  regulation: one(regulations, {
    fields: [regulatoryChanges.regulationId],
    references: [regulations.id],
  }),
  article: one(articles, {
    fields: [regulatoryChanges.articleId],
    references: [articles.id],
  }),
}))

export const ingestJobsRelations = relations(ingestJobs, ({ one, many }) => ({
  organization: one(organization, {
    fields: [ingestJobs.organizationId],
    references: [organization.id],
  }),
  regulations: many(regulations),
  articles: many(articles),
  obligations: many(obligations),
}))

/**
 * Onboarding State - Tracks setup wizard progress
 */
export const onboardingState = pgTable(
  'onboarding_state',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),

    // Step progress
    currentStep: integer('current_step').notNull().default(1),
    completedAt: timestamp('completed_at', { withTimezone: true }),

    // Step 1: Industry
    industry: text('industry'),

    // Step 2: Regulations
    selectedRegulations: text('selected_regulations').array().default([]),
    regulationsCustomized: integer('regulations_customized').default(0), // 0 = false, 1 = true

    // Step 3: Systems
    selectedSystemTemplates: text('selected_system_templates').array().default([]),
    customSystems: json('custom_systems').$type<{ id: string; name: string; description: string }[]>().default([]),
    systemsCustomized: integer('systems_customized').default(0),

    // Step 4: Invites
    pendingInvites: json('pending_invites').$type<{ email: string; role: string }[]>().default([]),

    // Timestamps
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    orgIdx: index('idx_onboarding_state_org').on(table.organizationId),
    orgUnique: uniqueIndex('onboarding_state_org_unique').on(table.organizationId),
  })
)

export const onboardingStateRelations = relations(onboardingState, ({ one }) => ({
  organization: one(organization, {
    fields: [onboardingState.organizationId],
    references: [organization.id],
  }),
}))

/**
 * Integration status
 */
export const integrationStatusEnum = pgEnum('integration_status', ['pending', 'connected', 'error', 'disconnected'])

/**
 * Integration provider types
 */
export const integrationProviderEnum = pgEnum('integration_provider', [
  'jira',
  'confluence',
  'servicenow',
  'slack',
  'teams',
])

/**
 * Third-party integrations
 */
export const integrations = pgTable(
  'integrations',
  {
    id: text('id').primaryKey(),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),
    provider: integrationProviderEnum('provider').notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    // Encrypted credentials - stored as JSONB, encrypted at app level
    config: json('config').$type<{
      accessToken?: string
      refreshToken?: string
      instanceUrl?: string
      projectKey?: string
      spaceKey?: string
    }>(),
    status: integrationStatusEnum('status').default('pending'),
    lastSyncAt: timestamp('last_sync_at', { withTimezone: true }),
    lastError: text('last_error'),
    // Metadata
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    createdByUserId: text('created_by_user_id').references(() => user.id, { onDelete: 'set null' }),
  },
  (table) => ({
    orgIdx: index('idx_integrations_org').on(table.organizationId),
    providerIdx: index('idx_integrations_provider').on(table.organizationId, table.provider),
    orgProviderUnique: uniqueIndex('integrations_org_provider_unique').on(table.organizationId, table.provider),
  })
)

export const integrationsRelations = relations(integrations, ({ one }) => ({
  organization: one(organization, {
    fields: [integrations.organizationId],
    references: [organization.id],
  }),
  createdBy: one(user, {
    fields: [integrations.createdByUserId],
    references: [user.id],
  }),
}))

/**
 * Type exports for insertion and selection
 */

// Auth types
export type User = typeof user.$inferSelect
export type NewUser = typeof user.$inferInsert

export type Session = typeof session.$inferSelect
export type NewSession = typeof session.$inferInsert

export type Organization = typeof organization.$inferSelect
export type NewOrganization = typeof organization.$inferInsert

export type Member = typeof member.$inferSelect
export type NewMember = typeof member.$inferInsert

export type Invitation = typeof invitation.$inferSelect
export type NewInvitation = typeof invitation.$inferInsert

// Compliance domain types
export type Regulation = typeof regulations.$inferSelect
export type NewRegulation = typeof regulations.$inferInsert

export type Article = typeof articles.$inferSelect
export type NewArticle = typeof articles.$inferInsert

export type System = typeof systems.$inferSelect
export type NewSystem = typeof systems.$inferInsert

export type ArticleSystemImpact = typeof articleSystemImpacts.$inferSelect
export type NewArticleSystemImpact = typeof articleSystemImpacts.$inferInsert

export type ObligationSystemMapping = typeof obligationSystemMappings.$inferSelect
export type NewObligationSystemMapping = typeof obligationSystemMappings.$inferInsert

export type Alert = typeof alerts.$inferSelect
export type NewAlert = typeof alerts.$inferInsert

export type Obligation = typeof obligations.$inferSelect
export type NewObligation = typeof obligations.$inferInsert

export type EvidencePack = typeof evidencePacks.$inferSelect
export type NewEvidencePack = typeof evidencePacks.$inferInsert

export type RegulatoryChange = typeof regulatoryChanges.$inferSelect
export type NewRegulatoryChange = typeof regulatoryChanges.$inferInsert

export type IngestJob = typeof ingestJobs.$inferSelect
export type NewIngestJob = typeof ingestJobs.$inferInsert

export type AuditLogEntry = typeof auditLog.$inferSelect

export type Integration = typeof integrations.$inferSelect
export type NewIntegration = typeof integrations.$inferInsert
export type NewAuditLogEntry = typeof auditLog.$inferInsert

export type OnboardingState = typeof onboardingState.$inferSelect
export type NewOnboardingState = typeof onboardingState.$inferInsert

/**
 * User Preferences - store user-specific settings per organization
 * Used for things like system map node positions, UI preferences, etc.
 */
export const userPreferences = pgTable(
  'user_preferences',
  {
    id: serial('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),
    // System map node positions
    systemMapPositions: json('system_map_positions').$type<Array<{ nodeId: string; x: number; y: number }>>(),
    // Other UI preferences can be stored here
    preferences: json('preferences').$type<Record<string, unknown>>(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex('user_preferences_user_org_idx').on(table.userId, table.organizationId),
    index('user_preferences_org_idx').on(table.organizationId),
  ]
)

export const userPreferencesRelations = relations(userPreferences, ({ one }) => ({
  user: one(user, {
    fields: [userPreferences.userId],
    references: [user.id],
  }),
  organization: one(organization, {
    fields: [userPreferences.organizationId],
    references: [organization.id],
  }),
}))

export type UserPreferences = typeof userPreferences.$inferSelect
export type NewUserPreferences = typeof userPreferences.$inferInsert
