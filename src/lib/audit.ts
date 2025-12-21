import { db } from '@/db'
import { auditLog } from '@/db/schema'
import { eq, gte, lte } from 'drizzle-orm'

export async function recordAudit({ ctx, action, entityType, entityId, before, after, ipAddress, userAgent }: any) {
  const organizationId = ctx?.activeOrganizationId ?? null

  await db.insert(auditLog).values({
    organizationId,
    actorUserId: ctx?.user?.id ?? null,
    action,
    entityType,
    entityId: entityId ?? null,
    diff: { before: before ?? null, after: after ?? null },
    ipAddress: ipAddress ?? null,
    userAgent: userAgent ?? null,
  })
}

export async function getAuditLog({ organizationId, entityType, actorUserId, from, to }: any) {
  let q: any = db.select().from(auditLog)
  // Basic filtering
  if (organizationId) q = q.where(eq(auditLog.organizationId, organizationId))
  if (entityType) q = q.where(eq(auditLog.entityType, entityType))
  if (actorUserId) q = q.where(eq(auditLog.actorUserId, actorUserId))
  if (from) q = q.where(gte(auditLog.createdAt, from))
  if (to) q = q.where(lte(auditLog.createdAt, to))
  return q.orderBy((a: any, helpers: { desc: (col: any) => unknown }) => helpers.desc(a.createdAt))
}
