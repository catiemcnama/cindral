import { db } from '@/db'
import { auditLog } from '@/db/schema'
import { and, eq, gte, lte } from 'drizzle-orm'

/**
 * Audit action types for type safety
 */
export type AuditAction =
  // Obligations
  | 'create_obligation'
  | 'update_obligation'
  | 'update_obligation_status'
  | 'delete_obligation'
  // Alerts
  | 'create_alert'
  | 'update_alert'
  | 'update_alert_status'
  | 'assign_alert'
  | 'resolve_alert'
  | 'delete_alert'
  // Systems
  | 'create_system'
  | 'update_system'
  | 'delete_system'
  | 'add_system_impact'
  | 'remove_system_impact'
  // Evidence Packs
  | 'create_evidence_pack'
  | 'generate_evidence_pack'
  | 'delete_evidence_pack'
  // Regulations
  | 'create_regulation'
  | 'update_regulation'
  | 'delete_regulation'
  // Articles
  | 'create_article'
  | 'update_article'
  | 'review_article'
  // Mappings
  | 'create_obligation_mapping'
  | 'delete_obligation_mapping'
  // Generic
  | 'bulk_update'
  | 'test_create'

export type AuditEntityType =
  | 'obligation'
  | 'alert'
  | 'system'
  | 'evidence_pack'
  | 'regulation'
  | 'article'
  | 'obligation_system_mapping'
  | 'article_system_impact'
  | 'user'
  | 'organization'

export interface AuditContext {
  activeOrganizationId: string
  user?: { id: string }
}

export interface RecordAuditParams {
  ctx: AuditContext
  action: AuditAction
  entityType: AuditEntityType
  entityId?: string | number | null
  before?: unknown
  after?: unknown
  ipAddress?: string | null
  userAgent?: string | null
}

/**
 * Record an audit log entry
 */
export async function recordAudit({
  ctx,
  action,
  entityType,
  entityId,
  before,
  after,
  ipAddress,
  userAgent,
}: RecordAuditParams): Promise<void> {
  if (!ctx?.activeOrganizationId) {
    console.warn('recordAudit called without organization context')
    return
  }

  await db.insert(auditLog).values({
    organizationId: ctx.activeOrganizationId,
    actorUserId: ctx?.user?.id ?? null,
    action,
    entityType,
    entityId: entityId != null ? String(entityId) : null,
    diff: { before: before ?? null, after: after ?? null },
    ipAddress: ipAddress ?? null,
    userAgent: userAgent ?? null,
  })
}

/**
 * Wrapper for mutations that automatically records audit logs
 *
 * Usage:
 * ```ts
 * return withAudit(ctx, 'update_obligation', 'obligation', input.id, async () => {
 *   const before = await db.query.obligations.findFirst({ where: eq(id, input.id) })
 *   const [after] = await db.update(obligations).set({ ... }).returning()
 *   return { before, after, result: after }
 * })
 * ```
 */
export async function withAudit<T>(
  ctx: AuditContext,
  action: AuditAction,
  entityType: AuditEntityType,
  entityId: string | number | null | undefined,
  fn: () => Promise<{ before?: unknown; after?: unknown; result: T }>
): Promise<T> {
  const { before, after, result } = await fn()

  await recordAudit({
    ctx,
    action,
    entityType,
    entityId,
    before,
    after,
  })

  return result
}

/**
 * Simplified audit wrapper for create operations
 */
export async function withCreateAudit<T>(
  ctx: AuditContext,
  action: AuditAction,
  entityType: AuditEntityType,
  fn: () => Promise<T & { id: string | number }>
): Promise<T & { id: string | number }> {
  const result = await fn()

  await recordAudit({
    ctx,
    action,
    entityType,
    entityId: result.id,
    before: null,
    after: result,
  })

  return result
}

/**
 * Simplified audit wrapper for delete operations
 */
export async function withDeleteAudit<T>(
  ctx: AuditContext,
  action: AuditAction,
  entityType: AuditEntityType,
  entityId: string | number,
  getBeforeFn: () => Promise<T | undefined>,
  deleteFn: () => Promise<unknown>
): Promise<{ success: boolean }> {
  const before = await getBeforeFn()

  await deleteFn()

  await recordAudit({
    ctx,
    action,
    entityType,
    entityId,
    before,
    after: null,
  })

  return { success: true }
}

export interface GetAuditLogParams {
  organizationId: string
  entityType?: AuditEntityType
  actorUserId?: string
  entityId?: string
  from?: Date
  to?: Date
  limit?: number
  offset?: number
}

/**
 * Query audit log entries with filters
 */
export async function getAuditLog({
  organizationId,
  entityType,
  actorUserId,
  entityId,
  from,
  to,
  limit = 100,
  offset = 0,
}: GetAuditLogParams) {
  const conditions = [eq(auditLog.organizationId, organizationId)]

  if (entityType) {
    conditions.push(eq(auditLog.entityType, entityType))
  }
  if (actorUserId) {
    conditions.push(eq(auditLog.actorUserId, actorUserId))
  }
  if (entityId) {
    conditions.push(eq(auditLog.entityId, entityId))
  }
  if (from) {
    conditions.push(gte(auditLog.createdAt, from))
  }
  if (to) {
    conditions.push(lte(auditLog.createdAt, to))
  }

  return db.query.auditLog.findMany({
    where: and(...conditions),
    orderBy: (log, { desc }) => desc(log.createdAt),
    limit,
    offset,
  })
}

/**
 * Get audit log entry count for an entity
 */
export async function getAuditLogCount(organizationId: string, entityType?: AuditEntityType) {
  const conditions = [eq(auditLog.organizationId, organizationId)]

  if (entityType) {
    conditions.push(eq(auditLog.entityType, entityType))
  }

  const result = await db.query.auditLog.findMany({
    where: and(...conditions),
    columns: { id: true },
  })

  return result.length
}
