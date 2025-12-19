import { relations } from 'drizzle-orm'
import { integer, pgEnum, pgTable, serial, text, timestamp, varchar } from 'drizzle-orm/pg-core'

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
export const severityEnum = pgEnum('severity', ['critical', 'high', 'medium', 'low'])
export const alertStatusEnum = pgEnum('alert_status', ['open', 'in_progress', 'resolved'])
export const obligationStatusEnum = pgEnum('obligation_status', ['pending', 'compliant', 'non_compliant'])
export const impactLevelEnum = pgEnum('impact_level', ['critical', 'high', 'medium', 'low'])

/**
 * Regulations - DORA, GDPR, AI Act, Basel III, etc.
 */
export const regulations = pgTable('regulations', {
  id: text('id').primaryKey(), // e.g., 'dora', 'gdpr', 'ai-act'
  name: varchar('name', { length: 255 }).notNull(),
  fullTitle: text('full_title').notNull(),
  jurisdiction: varchar('jurisdiction', { length: 100 }), // e.g., 'European Union'
  effectiveDate: timestamp('effective_date'),
  lastUpdated: timestamp('last_updated'),
  organizationId: text('organization_id').references(() => organization.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at')
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
})

/**
 * Articles - Individual articles within regulations
 */
export const articles = pgTable('articles', {
  id: text('id').primaryKey(), // e.g., 'dora-article-11'
  regulationId: text('regulation_id')
    .notNull()
    .references(() => regulations.id, { onDelete: 'cascade' }),
  articleNumber: varchar('article_number', { length: 50 }).notNull(), // e.g., 'Article 11(1)'
  sectionTitle: varchar('section_title', { length: 255 }),
  description: text('description'),
  fullText: text('full_text'),
  riskLevel: severityEnum('risk_level'),
  aiSummary: text('ai_summary'), // Plain English AI interpretation
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at')
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
})

/**
 * Systems - IT systems tracked for compliance (Mobile App, Core Banking, etc.)
 */
export const systems = pgTable('systems', {
  id: text('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  criticality: severityEnum('criticality'),
  organizationId: text('organization_id').references(() => organization.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at')
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
})

/**
 * Article-System Impact - Maps which systems are affected by which articles
 */
export const articleSystemImpacts = pgTable('article_system_impacts', {
  id: serial('id').primaryKey(),
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
})

/**
 * Alerts - Regulatory change alerts
 */
export const alerts = pgTable('alerts', {
  id: text('id').primaryKey(), // e.g., 'ALT-001'
  title: varchar('title', { length: 500 }).notNull(),
  description: text('description'),
  severity: severityEnum('severity').notNull(),
  status: alertStatusEnum('status').notNull().default('open'),
  regulationId: text('regulation_id').references(() => regulations.id, { onDelete: 'set null' }),
  articleId: text('article_id').references(() => articles.id, { onDelete: 'set null' }),
  ownerId: text('owner_id').references(() => user.id, { onDelete: 'set null' }),
  organizationId: text('organization_id').references(() => organization.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at')
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
})

/**
 * Obligations - Compliance obligations derived from articles
 */
export const obligations = pgTable('obligations', {
  id: text('id').primaryKey(), // e.g., 'OBL-DORA-11-001'
  articleId: text('article_id')
    .notNull()
    .references(() => articles.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 500 }).notNull(),
  description: text('description'),
  status: obligationStatusEnum('status').notNull().default('pending'),
  lastReviewedAt: timestamp('last_reviewed_at'),
  organizationId: text('organization_id').references(() => organization.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at')
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
})

/**
 * Evidence Packs - Generated compliance documentation bundles
 */
export const evidencePacks = pgTable('evidence_packs', {
  id: serial('id').primaryKey(),
  regulationId: text('regulation_id')
    .notNull()
    .references(() => regulations.id, { onDelete: 'cascade' }),
  articleId: text('article_id').references(() => articles.id, { onDelete: 'set null' }),
  generatedAt: timestamp('generated_at').notNull().defaultNow(),
  exportFormat: varchar('export_format', { length: 50 }), // 'pdf', 'confluence', 'jira'
  organizationId: text('organization_id').references(() => organization.id, { onDelete: 'cascade' }),
  createdById: text('created_by_id').references(() => user.id, { onDelete: 'set null' }),
})

/**
 * Regulatory Change Feed - Timeline of regulatory updates
 */
export const regulatoryChanges = pgTable('regulatory_changes', {
  id: serial('id').primaryKey(),
  regulationId: text('regulation_id')
    .notNull()
    .references(() => regulations.id, { onDelete: 'cascade' }),
  articleId: text('article_id').references(() => articles.id, { onDelete: 'set null' }),
  title: varchar('title', { length: 500 }).notNull(),
  description: text('description'),
  severity: severityEnum('severity').notNull(),
  changesCount: integer('changes_count').default(0),
  publishedAt: timestamp('published_at').notNull().defaultNow(),
  organizationId: text('organization_id').references(() => organization.id, { onDelete: 'cascade' }),
})

/**
 * Legacy posts table (can be removed if not needed)
 */
export const posts = pgTable('posts', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  organizationId: text('organization_id').references(() => organization.id, {
    onDelete: 'cascade',
  }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at')
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
})

/**
 * Application Relations
 */

// Extend user relations to include posts and alerts
export const userRelations = relations(user, ({ many }) => ({
  posts: many(posts),
  alerts: many(alerts),
}))

export const postsRelations = relations(posts, ({ one }) => ({
  user: one(user, {
    fields: [posts.userId],
    references: [user.id],
  }),
  organization: one(organization, {
    fields: [posts.organizationId],
    references: [organization.id],
  }),
}))

export const regulationsRelations = relations(regulations, ({ many }) => ({
  articles: many(articles),
  alerts: many(alerts),
  regulatoryChanges: many(regulatoryChanges),
  evidencePacks: many(evidencePacks),
}))

export const articlesRelations = relations(articles, ({ one, many }) => ({
  regulation: one(regulations, {
    fields: [articles.regulationId],
    references: [regulations.id],
  }),
  obligations: many(obligations),
  systemImpacts: many(articleSystemImpacts),
}))

export const systemsRelations = relations(systems, ({ many }) => ({
  articleImpacts: many(articleSystemImpacts),
}))

export const articleSystemImpactsRelations = relations(articleSystemImpacts, ({ one }) => ({
  article: one(articles, {
    fields: [articleSystemImpacts.articleId],
    references: [articles.id],
  }),
  system: one(systems, {
    fields: [articleSystemImpacts.systemId],
    references: [systems.id],
  }),
}))

export const alertsRelations = relations(alerts, ({ one }) => ({
  regulation: one(regulations, {
    fields: [alerts.regulationId],
    references: [regulations.id],
  }),
  article: one(articles, {
    fields: [alerts.articleId],
    references: [articles.id],
  }),
  owner: one(user, {
    fields: [alerts.ownerId],
    references: [user.id],
  }),
}))

export const obligationsRelations = relations(obligations, ({ one }) => ({
  article: one(articles, {
    fields: [obligations.articleId],
    references: [articles.id],
  }),
}))

export const evidencePacksRelations = relations(evidencePacks, ({ one }) => ({
  regulation: one(regulations, {
    fields: [evidencePacks.regulationId],
    references: [regulations.id],
  }),
  article: one(articles, {
    fields: [evidencePacks.articleId],
    references: [articles.id],
  }),
  createdBy: one(user, {
    fields: [evidencePacks.createdById],
    references: [user.id],
  }),
}))

export const regulatoryChangesRelations = relations(regulatoryChanges, ({ one }) => ({
  regulation: one(regulations, {
    fields: [regulatoryChanges.regulationId],
    references: [regulations.id],
  }),
  article: one(articles, {
    fields: [regulatoryChanges.articleId],
    references: [articles.id],
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

// Application types
export type Post = typeof posts.$inferSelect
export type NewPost = typeof posts.$inferInsert

// Compliance domain types
export type Regulation = typeof regulations.$inferSelect
export type NewRegulation = typeof regulations.$inferInsert

export type Article = typeof articles.$inferSelect
export type NewArticle = typeof articles.$inferInsert

export type System = typeof systems.$inferSelect
export type NewSystem = typeof systems.$inferInsert

export type ArticleSystemImpact = typeof articleSystemImpacts.$inferSelect
export type NewArticleSystemImpact = typeof articleSystemImpacts.$inferInsert

export type Alert = typeof alerts.$inferSelect
export type NewAlert = typeof alerts.$inferInsert

export type Obligation = typeof obligations.$inferSelect
export type NewObligation = typeof obligations.$inferInsert

export type EvidencePack = typeof evidencePacks.$inferSelect
export type NewEvidencePack = typeof evidencePacks.$inferInsert

export type RegulatoryChange = typeof regulatoryChanges.$inferSelect
export type NewRegulatoryChange = typeof regulatoryChanges.$inferInsert
