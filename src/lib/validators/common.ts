/**
 * Common Zod Validators
 *
 * Reusable validation schemas for consistent input validation across all tRPC routers.
 * These should be imported and composed rather than defining inline schemas.
 */

import { z } from 'zod'

// =============================================================================
// Primitive Validators
// =============================================================================

/** Non-empty string (trims whitespace) */
export const nonEmptyString = z.string().trim().min(1, 'Cannot be empty')

/** Non-empty string with max length */
export const boundedString = (max: number) => z.string().trim().min(1, 'Cannot be empty').max(max)

/** Optional string (can be empty, null, or undefined) */
export const optionalString = z.string().trim().optional().nullable()

/** ID field - non-empty string */
export const id = z.string().trim().min(1, 'ID is required')

/** Optional ID field */
export const optionalId = z.string().trim().min(1).optional().nullable()

/** Positive integer */
export const positiveInt = z.number().int().positive()

/** Non-negative integer */
export const nonNegativeInt = z.number().int().nonnegative()

// =============================================================================
// Entity IDs
// =============================================================================

/** Organization ID */
export const organizationId = id.describe('Organization ID')

/** User ID */
export const userId = id.describe('User ID')

/** Regulation ID (e.g., "dora", "gdpr") */
export const regulationId = z
  .string()
  .trim()
  .min(1)
  .max(50)
  .regex(/^[a-z0-9-]+$/, 'Must be lowercase alphanumeric with hyphens')
  .describe('Regulation ID')

/** Article ID (e.g., "dora-article-11") */
export const articleId = z.string().trim().min(1).max(100).describe('Article ID')

/** Obligation ID (e.g., "OBL-DORA-11-001") */
export const obligationId = z.string().trim().min(1).max(50).describe('Obligation ID')

/** System ID */
export const systemId = z.string().trim().min(1).max(50).describe('System ID')

/** Alert ID (e.g., "ALT-001") */
export const alertId = z.string().trim().min(1).max(50).describe('Alert ID')

// =============================================================================
// Pagination
// =============================================================================

/** Standard pagination input */
export const paginationInput = z.object({
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().nonnegative().default(0),
})

/** Cursor-based pagination input */
export const cursorPaginationInput = z.object({
  cursor: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(20),
  direction: z.enum(['forward', 'backward']).default('forward'),
})

/** Pagination output metadata */
export const paginationOutput = z.object({
  total: z.number(),
  limit: z.number(),
  offset: z.number(),
  hasMore: z.boolean(),
})

/** Cursor pagination output metadata */
export const cursorPaginationOutput = z.object({
  pageInfo: z.object({
    hasNextPage: z.boolean(),
    hasPreviousPage: z.boolean(),
    startCursor: z.string().nullable(),
    endCursor: z.string().nullable(),
  }),
  totalCount: z.number(),
})

// =============================================================================
// Sorting
// =============================================================================

/** Sort order */
export const sortOrder = z.enum(['asc', 'desc']).default('asc')

/** Generic sort input */
export function sortInput<T extends string>(allowedFields: readonly T[]) {
  return z.object({
    sortBy: z.enum(allowedFields as unknown as [T, ...T[]]).optional(),
    sortOrder: sortOrder,
  })
}

// =============================================================================
// Date & Time
// =============================================================================

/** ISO date string or Date object */
export const dateInput = z.coerce.date()

/** Optional date */
export const optionalDate = z.coerce.date().optional().nullable()

/** Date range */
export const dateRange = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
})

/** Future date (must be in the future) */
export const futureDate = z.coerce.date().refine((date) => date > new Date(), {
  message: 'Date must be in the future',
})

/** Past date (must be in the past) */
export const pastDate = z.coerce.date().refine((date) => date < new Date(), {
  message: 'Date must be in the past',
})

// =============================================================================
// Enums (matching schema.ts)
// =============================================================================

/** Severity levels */
export const severity = z.enum(['info', 'low', 'medium', 'high', 'critical'])

/** Alert status */
export const alertStatus = z.enum(['open', 'in_triage', 'in_progress', 'resolved', 'wont_fix'])

/** Alert type */
export const alertType = z.enum(['obligation_overdue', 'regulation_changed', 'evidence_pack_failed', 'system_unmapped'])

/** Obligation status */
export const obligationStatus = z.enum(['not_started', 'in_progress', 'implemented', 'under_review', 'verified'])

/** Requirement type */
export const requirementType = z.enum(['process', 'technical', 'reporting'])

/** Risk level */
export const riskLevel = z.enum(['low', 'medium', 'high', 'critical'])

/** Impact level */
export const impactLevel = z.enum(['critical', 'high', 'medium', 'low'])

/** Evidence pack status */
export const evidenceStatus = z.enum(['draft', 'generating', 'ready', 'failed', 'archived'])

/** Regulation status */
export const regulationStatus = z.enum(['active', 'superseded', 'draft'])

/** Review status */
export const reviewStatus = z.enum(['pending', 'approved', 'rejected'])

/** User role */
export const userRole = z.enum(['OrgAdmin', 'ComplianceManager', 'Auditor', 'Viewer', 'BillingAdmin'])

// =============================================================================
// Search & Filter
// =============================================================================

/** Search query string */
export const searchQuery = z
  .string()
  .trim()
  .max(200)
  .transform((v) => v || undefined)
  .optional()

/** Multi-select filter (array of strings) */
export const multiSelect = <T extends string>(values: readonly T[]) =>
  z.array(z.enum(values as unknown as [T, ...T[]])).optional()

// =============================================================================
// Complex Objects
// =============================================================================

/** Address or contact info */
export const contactInfo = z.object({
  email: z.string().email().optional(),
  phone: z.string().max(30).optional(),
  address: z.string().max(500).optional(),
})

/** Metadata (arbitrary JSON) */
export const metadata = z.record(z.string(), z.unknown()).optional()

/** Tags array */
export const tags = z.array(z.string().trim().min(1).max(50)).max(20).optional()

// =============================================================================
// Reusable Input Schemas
// =============================================================================

/** Standard list input with pagination and optional search */
export const listInput = paginationInput.extend({
  search: searchQuery,
})

/** Standard list input with sorting */
export function listInputWithSort<T extends string>(sortFields: readonly T[]) {
  return listInput.merge(sortInput(sortFields))
}

/** ID-only input */
export const idInput = z.object({ id })

/** Bulk IDs input */
export const bulkIdsInput = z.object({
  ids: z.array(id).min(1).max(100),
})

// =============================================================================
// Type Exports
// =============================================================================

export type PaginationInput = z.infer<typeof paginationInput>
export type CursorPaginationInput = z.infer<typeof cursorPaginationInput>
export type DateRange = z.infer<typeof dateRange>
export type SortOrder = z.infer<typeof sortOrder>
export type Severity = z.infer<typeof severity>
export type AlertStatus = z.infer<typeof alertStatus>
export type AlertType = z.infer<typeof alertType>
export type ObligationStatus = z.infer<typeof obligationStatus>
export type RiskLevel = z.infer<typeof riskLevel>
export type ImpactLevel = z.infer<typeof impactLevel>
export type UserRole = z.infer<typeof userRole>
