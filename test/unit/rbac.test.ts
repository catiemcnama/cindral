import { canMutate, hasRole, isAdmin, requireAdmin, requireMutatePermission, requireRole, ROLES } from '@/lib/tenancy'
import { TRPCError } from '@trpc/server'
import { describe, expect, it } from 'vitest'
import { createTestContext } from '../helpers'

describe('RBAC', () => {
  describe('hasRole', () => {
    it('returns true when user has the specified role', () => {
      const ctx = createTestContext({ role: 'OrgAdmin' })
      expect(hasRole(ctx, 'OrgAdmin')).toBe(true)
    })

    it('returns false when user has a different role', () => {
      const ctx = createTestContext({ role: 'OrgAdmin' })
      expect(hasRole(ctx, 'Viewer')).toBe(false)
    })

    it('returns true when user has one of multiple roles', () => {
      const ctx = createTestContext({ role: 'ComplianceManager' })
      expect(hasRole(ctx, ['OrgAdmin', 'ComplianceManager'])).toBe(true)
    })

    it('returns false when user has none of the specified roles', () => {
      const ctx = createTestContext({ role: 'Viewer' })
      expect(hasRole(ctx, ['OrgAdmin', 'ComplianceManager'])).toBe(false)
    })

    it('returns false when member is null', () => {
      const ctx = { activeOrganizationId: 'test', member: null, user: null }
      expect(hasRole(ctx, 'OrgAdmin')).toBe(false)
    })
  })

  describe('requireRole', () => {
    it('does not throw when user has the required role', () => {
      const ctx = createTestContext({ role: 'OrgAdmin' })
      expect(() => requireRole(ctx, 'OrgAdmin')).not.toThrow()
    })

    it('throws FORBIDDEN when user lacks the required role', () => {
      const ctx = createTestContext({ role: 'Viewer' })
      expect(() => requireRole(ctx, 'OrgAdmin')).toThrow(TRPCError)

      try {
        requireRole(ctx, 'OrgAdmin')
      } catch (e) {
        expect(e).toBeInstanceOf(TRPCError)
        expect((e as TRPCError).code).toBe('FORBIDDEN')
      }
    })
  })

  describe('canMutate', () => {
    it('returns true for OrgAdmin', () => {
      const ctx = createTestContext({ role: 'OrgAdmin' })
      expect(canMutate(ctx)).toBe(true)
    })

    it('returns true for ComplianceManager', () => {
      const ctx = createTestContext({ role: 'ComplianceManager' })
      expect(canMutate(ctx)).toBe(true)
    })

    it('returns false for Auditor', () => {
      const ctx = createTestContext({ role: 'Auditor' })
      expect(canMutate(ctx)).toBe(false)
    })

    it('returns false for Viewer', () => {
      const ctx = createTestContext({ role: 'Viewer' })
      expect(canMutate(ctx)).toBe(false)
    })
  })

  describe('requireMutatePermission', () => {
    it('does not throw for OrgAdmin', () => {
      const ctx = createTestContext({ role: 'OrgAdmin' })
      expect(() => requireMutatePermission(ctx)).not.toThrow()
    })

    it('throws FORBIDDEN for Viewer', () => {
      const ctx = createTestContext({ role: 'Viewer' })
      expect(() => requireMutatePermission(ctx)).toThrow(TRPCError)
    })
  })

  describe('isAdmin', () => {
    it('returns true for OrgAdmin', () => {
      const ctx = createTestContext({ role: 'OrgAdmin' })
      expect(isAdmin(ctx)).toBe(true)
    })

    it('returns false for ComplianceManager', () => {
      const ctx = createTestContext({ role: 'ComplianceManager' })
      expect(isAdmin(ctx)).toBe(false)
    })
  })

  describe('requireAdmin', () => {
    it('does not throw for OrgAdmin', () => {
      const ctx = createTestContext({ role: 'OrgAdmin' })
      expect(() => requireAdmin(ctx)).not.toThrow()
    })

    it('throws FORBIDDEN for ComplianceManager', () => {
      const ctx = createTestContext({ role: 'ComplianceManager' })
      expect(() => requireAdmin(ctx)).toThrow(TRPCError)
    })
  })

  describe('ROLES constant', () => {
    it('defines all required roles', () => {
      const requiredRoles = ['OrgAdmin', 'ComplianceManager', 'Auditor', 'Viewer', 'BillingAdmin']
      requiredRoles.forEach((role) => {
        expect(ROLES).toHaveProperty(role)
      })
    })
  })
})
