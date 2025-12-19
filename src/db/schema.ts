import { relations } from 'drizzle-orm'
import { pgTable, serial, text, timestamp, varchar } from 'drizzle-orm/pg-core'

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
 * Application Tables
 *
 * Add your own tables here that reference the auth tables
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

// Extend user relations to include posts
export const userRelations = relations(user, ({ many }) => ({
  posts: many(posts),
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
