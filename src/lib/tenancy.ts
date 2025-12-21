import { TRPCError } from '@trpc/server'
import { and, eq, SQL } from 'drizzle-orm'
import type { PgTable, TableConfig } from 'drizzle-orm/pg-core'

/**
 * Organization Roles
 */
export const ROLES = {
  OrgAdmin: 'OrgAdmin',
  ComplianceManager: 'ComplianceManager',
  Auditor: 'Auditor',
  Viewer: 'Viewer',
  BillingAdmin: 'BillingAdmin',
} as const

export type Role = (typeof ROLES)[keyof typeof ROLES]

/**
 * Role hierarchy for permission checks
 * Higher index = more permissions
 */
const ROLE_HIERARCHY: Role[] = ['Viewer', 'Auditor', 'BillingAdmin', 'ComplianceManager', 'OrgAdmin']

/**
 * Roles that can mutate compliance data
 */
export const MUTATE_ROLES: Role[] = ['OrgAdmin', 'ComplianceManager']

/**
 * Roles that can only read
 */
export const READ_ONLY_ROLES: Role[] = ['Auditor', 'Viewer']

/**
 * Admin roles
 */
export const ADMIN_ROLES: Role[] = ['OrgAdmin']

export interface TenancyContext {
  activeOrganizationId?: string | null
  member?: { role: string } | null
  user?: { id: string } | null
}

/**
 * Require organization context, throw FORBIDDEN if missing
 */
export function requireOrgContext(ctx: TenancyContext): string {
  if (!ctx?.activeOrganizationId) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Organization context required',
    })
  }
  return ctx.activeOrganizationId
}

/**
 * Get a scoped where condition for organization filtering
 * Use this for ALL queries to ensure tenant isolation
 */
export function scopedWhere<T extends PgTable<TableConfig>>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  table: T & { organizationId: any },
  ctx: TenancyContext
): SQL {
  const orgId = requireOrgContext(ctx)
  return eq(table.organizationId, orgId)
}

/**
 * Combine scoped org filter with additional conditions
 */
export function scopedAnd<T extends PgTable<TableConfig>>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  table: T & { organizationId: any },
  ctx: TenancyContext,
  ...conditions: (SQL | undefined)[]
): SQL {
  const orgCondition = scopedWhere(table, ctx)
  const validConditions = conditions.filter((c): c is SQL => c !== undefined)
  return and(orgCondition, ...validConditions)!
}

/**
 * Check if context has one of the specified roles
 */
export function hasRole(ctx: TenancyContext, roles: Role | Role[]): boolean {
  if (!ctx?.member?.role) return false
  const wantRoles = Array.isArray(roles) ? roles : [roles]
  return wantRoles.includes(ctx.member.role as Role)
}

/**
 * Check if context has at least the specified role level
 * Based on role hierarchy
 */
export function hasRoleLevel(ctx: TenancyContext, minimumRole: Role): boolean {
  if (!ctx?.member?.role) return false
  const currentRoleIndex = ROLE_HIERARCHY.indexOf(ctx.member.role as Role)
  const minimumRoleIndex = ROLE_HIERARCHY.indexOf(minimumRole)
  return currentRoleIndex >= minimumRoleIndex
}

/**
 * Require one of the specified roles, throw FORBIDDEN if not
 */
export function requireRole(ctx: TenancyContext, roles: Role | Role[]): void {
  if (!hasRole(ctx, roles)) {
    const wantRoles = Array.isArray(roles) ? roles : [roles]
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: `Insufficient permissions. Required role: ${wantRoles.join(' or ')}`,
    })
  }
}

/**
 * Require at least the specified role level
 */
export function requireRoleLevel(ctx: TenancyContext, minimumRole: Role): void {
  if (!hasRoleLevel(ctx, minimumRole)) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: `Insufficient permissions. Required role level: ${minimumRole} or higher`,
    })
  }
}

/**
 * Check if user can mutate compliance data
 */
export function canMutate(ctx: TenancyContext): boolean {
  return hasRole(ctx, MUTATE_ROLES)
}

/**
 * Require mutation permissions
 */
export function requireMutatePermission(ctx: TenancyContext): void {
  requireRole(ctx, MUTATE_ROLES)
}

/**
 * Check if user is admin
 */
export function isAdmin(ctx: TenancyContext): boolean {
  return hasRole(ctx, ADMIN_ROLES)
}

/**
 * Require admin permissions
 */
export function requireAdmin(ctx: TenancyContext): void {
  requireRole(ctx, ADMIN_ROLES)
}

/**
 * Get the current user's organization ID (throws if not available)
 */
export function getOrgId(ctx: TenancyContext): string {
  return requireOrgContext(ctx)
}

/**
 * Get the current user's ID (throws if not available)
 */
export function getUserId(ctx: TenancyContext): string {
  if (!ctx?.user?.id) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'User context required',
    })
  }
  return ctx.user.id
}
