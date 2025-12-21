import { TRPCError } from '@trpc/server'
import { eq } from 'drizzle-orm'
import { member } from '@/db/schema'

export function requireOrgContext(ctx: any) {
  if (!ctx?.activeOrganizationId) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Organization context required' })
  }
  return ctx.activeOrganizationId
}

export function scopedWhereOrg(table: any, ctx: any) {
  const orgId = requireOrgContext(ctx)
  return (col: any) => eq(table.organizationId, orgId)
}

export function hasRole(ctx: any, roles: string | string[]) {
  if (!ctx?.member) return false
  const want = Array.isArray(roles) ? roles : [roles]
  return want.includes(ctx.member.role)
}

export function requireRole(ctx: any, roles: string | string[]) {
  if (!hasRole(ctx, roles)) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Insufficient role' })
  }
}

export { member }
