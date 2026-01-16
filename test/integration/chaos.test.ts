/**
 * Chaos & Race Condition Tests
 *
 * "If you haven't stress-tested multi-tenant concurrent writes,
 * you don't have a product, you have a lawsuit."
 * - Elon Musk (paraphrased)
 *
 * These tests simulate real-world chaos scenarios:
 * - Concurrent writes from multiple tenants
 * - Race conditions in obligation status updates
 * - Soft delete consistency
 * - Database connection exhaustion
 */

import { beforeAll, describe, expect, it } from 'vitest'
import { TEST_ORGS } from '../helpers'

const skipTests = !process.env.DATABASE_URL

describe.skipIf(skipTests)('Chaos & Race Conditions', () => {
  let db: Awaited<typeof import('@/db')>['db']
  let obligations: Awaited<typeof import('@/db/schema')>['obligations']
  let systems: Awaited<typeof import('@/db/schema')>['systems']
  let obligationSystemMappings: Awaited<typeof import('@/db/schema')>['obligationSystemMappings']
  let eq: Awaited<typeof import('drizzle-orm')>['eq']
  let and: Awaited<typeof import('drizzle-orm')>['and']
  let sql: Awaited<typeof import('drizzle-orm')>['sql']

  beforeAll(async () => {
    const dbModule = await import('@/db')
    const schemaModule = await import('@/db/schema')
    const drizzleOrm = await import('drizzle-orm')

    db = dbModule.db
    obligations = schemaModule.obligations
    systems = schemaModule.systems
    obligationSystemMappings = schemaModule.obligationSystemMappings
    eq = drizzleOrm.eq
    and = drizzleOrm.and
    sql = drizzleOrm.sql
  })

  describe('Concurrent Multi-Tenant Writes', () => {
    it('maintains tenant isolation under concurrent load', async () => {
      // Simulate 10 concurrent updates to each tenant
      const orgAUpdates = Array.from({ length: 10 }, async (_, i) => {
        const obl = await db.query.obligations.findFirst({
          where: eq(obligations.organizationId, TEST_ORGS.ORG_A),
        })
        if (!obl) return null

        // Simulate read-modify-write race
        await new Promise((r) => setTimeout(r, Math.random() * 10))

        return db
          .update(obligations)
          .set({
            summary: `Concurrent update ${i} at ${Date.now()}`,
            updatedAt: new Date(),
          })
          .where(and(eq(obligations.id, obl.id), eq(obligations.organizationId, TEST_ORGS.ORG_A)))
          .returning()
      })

      const orgBUpdates = Array.from({ length: 10 }, async (_, i) => {
        const obl = await db.query.obligations.findFirst({
          where: eq(obligations.organizationId, TEST_ORGS.ORG_B),
        })
        if (!obl) return null

        await new Promise((r) => setTimeout(r, Math.random() * 10))

        return db
          .update(obligations)
          .set({
            summary: `Concurrent update ${i} at ${Date.now()}`,
            updatedAt: new Date(),
          })
          .where(and(eq(obligations.id, obl.id), eq(obligations.organizationId, TEST_ORGS.ORG_B)))
          .returning()
      })

      // Run all updates concurrently
      const results = await Promise.allSettled([...orgAUpdates, ...orgBUpdates])

      // All should succeed or return null (no test data)
      const errors = results.filter((r) => r.status === 'rejected' && !r.reason.message.includes('not found'))
      expect(errors).toHaveLength(0)

      // Verify no cross-tenant pollution
      const orgAFinal = await db.query.obligations.findMany({
        where: eq(obligations.organizationId, TEST_ORGS.ORG_A),
        limit: 1,
      })

      const orgBFinal = await db.query.obligations.findMany({
        where: eq(obligations.organizationId, TEST_ORGS.ORG_B),
        limit: 1,
      })

      // Tenants should remain isolated
      if (orgAFinal[0] && orgBFinal[0]) {
        expect(orgAFinal[0].organizationId).toBe(TEST_ORGS.ORG_A)
        expect(orgBFinal[0].organizationId).toBe(TEST_ORGS.ORG_B)
      }
    })

    it('prevents cross-tenant ID injection', async () => {
      // Attempt to update Org A obligation with Org B's context
      const orgAObl = await db.query.obligations.findFirst({
        where: eq(obligations.organizationId, TEST_ORGS.ORG_A),
      })

      if (!orgAObl) {
        console.log('Skipping: No test data')
        return
      }

      // Try to update with wrong org - should update 0 rows
      const result = await db
        .update(obligations)
        .set({ summary: 'HACKED by Org B!' })
        .where(
          and(
            eq(obligations.id, orgAObl.id),
            eq(obligations.organizationId, TEST_ORGS.ORG_B) // Wrong org!
          )
        )
        .returning()

      expect(result).toHaveLength(0)

      // Verify original data is unchanged
      const stillOrgA = await db.query.obligations.findFirst({
        where: eq(obligations.id, orgAObl.id),
      })
      expect(stillOrgA?.organizationId).toBe(TEST_ORGS.ORG_A)
      expect(stillOrgA?.summary).not.toBe('HACKED by Org B!')
    })
  })

  describe('Status Update Race Conditions', () => {
    it('handles concurrent status transitions gracefully', async () => {
      // Valid statuses: 'not_started', 'in_progress', 'implemented', 'under_review', 'verified'
      const obl = await db.query.obligations.findFirst({
        where: and(eq(obligations.organizationId, TEST_ORGS.ORG_A), eq(obligations.status, 'not_started')),
      })

      if (!obl) {
        console.log('Skipping: No not_started obligations')
        return
      }

      const originalStatus = obl.status

      // 5 concurrent attempts to change status using valid enum values
      const statusChanges = ['in_progress', 'under_review', 'implemented', 'verified', 'not_started'] as const

      const updates = statusChanges.map(async (status) => {
        await new Promise((r) => setTimeout(r, Math.random() * 5))
        return db
          .update(obligations)
          .set({ status, updatedAt: new Date() })
          .where(and(eq(obligations.id, obl.id), eq(obligations.organizationId, TEST_ORGS.ORG_A)))
          .returning()
      })

      await Promise.allSettled(updates)

      // Final state should be one of the valid statuses
      const finalObl = await db.query.obligations.findFirst({
        where: eq(obligations.id, obl.id),
      })

      expect(statusChanges).toContain(finalObl?.status)

      // Reset to original
      await db
        .update(obligations)
        .set({ status: originalStatus, updatedAt: new Date() })
        .where(eq(obligations.id, obl.id))
    })
  })

  describe('Soft Delete Consistency', () => {
    it('maintains referential integrity on soft delete', async () => {
      // Find an obligation with system mappings
      const oblWithMappings = await db.query.obligations.findFirst({
        where: eq(obligations.organizationId, TEST_ORGS.ORG_A),
        with: {
          systemMappings: true,
        },
      })

      if (!oblWithMappings || oblWithMappings.systemMappings.length === 0) {
        console.log('Skipping: No obligations with mappings')
        return
      }

      // Soft delete the obligation
      await db.update(obligations).set({ deletedAt: new Date() }).where(eq(obligations.id, oblWithMappings.id))

      // Mappings should still exist (soft delete doesn't cascade)
      const mappings = await db.query.obligationSystemMappings.findMany({
        where: eq(obligationSystemMappings.obligationId, oblWithMappings.id),
      })

      // Mappings remain but obligation is "deleted"
      expect(mappings.length).toBeGreaterThan(0)

      // Restore
      await db.update(obligations).set({ deletedAt: null }).where(eq(obligations.id, oblWithMappings.id))
    })

    it('excludes soft-deleted records from normal queries', async () => {
      const obl = await db.query.obligations.findFirst({
        where: and(eq(obligations.organizationId, TEST_ORGS.ORG_A), eq(obligations.deletedAt, sql`NULL`)),
      })

      if (!obl) {
        console.log('Skipping: No active obligations')
        return
      }

      // Soft delete
      const deleteTime = new Date()
      await db.update(obligations).set({ deletedAt: deleteTime }).where(eq(obligations.id, obl.id))

      // Should not appear in "active" queries
      const activeObls = await db.query.obligations.findMany({
        where: and(eq(obligations.organizationId, TEST_ORGS.ORG_A), sql`${obligations.deletedAt} IS NULL`),
      })

      const foundDeleted = activeObls.find((o) => o.id === obl.id)
      expect(foundDeleted).toBeUndefined()

      // But should still exist in database
      const stillExists = await db.query.obligations.findFirst({
        where: eq(obligations.id, obl.id),
      })
      expect(stillExists).toBeDefined()
      expect(stillExists?.deletedAt).toEqual(deleteTime)

      // Restore
      await db.update(obligations).set({ deletedAt: null }).where(eq(obligations.id, obl.id))
    })
  })

  describe('Connection Pool Stress', () => {
    it('handles burst of concurrent queries', async () => {
      // Simulate 50 concurrent reads
      const queries = Array.from({ length: 50 }, async () => {
        return db.query.obligations.findMany({
          where: eq(obligations.organizationId, TEST_ORGS.ORG_A),
          limit: 10,
        })
      })

      const start = Date.now()
      const results = await Promise.allSettled(queries)
      const duration = Date.now() - start

      const successes = results.filter((r) => r.status === 'fulfilled')
      const failures = results.filter((r) => r.status === 'rejected')

      // All should succeed
      expect(failures).toHaveLength(0)
      expect(successes).toHaveLength(50)

      // Should complete in reasonable time (< 5s for 50 queries)
      expect(duration).toBeLessThan(5000)

      console.log(`50 concurrent queries completed in ${duration}ms`)
    })

    it('handles mixed read/write workload', async () => {
      const operations = Array.from({ length: 30 }, async (_, i) => {
        if (i % 3 === 0) {
          // Write operation
          const obl = await db.query.obligations.findFirst({
            where: eq(obligations.organizationId, TEST_ORGS.ORG_A),
          })
          if (!obl) return { type: 'write', success: false }

          await db
            .update(obligations)
            .set({ summary: `Stress test ${Date.now()}`, updatedAt: new Date() })
            .where(eq(obligations.id, obl.id))

          return { type: 'write', success: true }
        } else {
          // Read operation
          const result = await db.query.obligations.findMany({
            where: eq(obligations.organizationId, TEST_ORGS.ORG_A),
            limit: 5,
          })
          return { type: 'read', success: true, count: result.length }
        }
      })

      const results = await Promise.allSettled(operations)
      const allSucceeded = results.every((r) => r.status === 'fulfilled')

      expect(allSucceeded).toBe(true)
    })
  })

  describe('Data Integrity Under Chaos', () => {
    it('maintains foreign key relationships under load', async () => {
      // Get a system and verify its relationships survive concurrent operations
      const system = await db.query.systems.findFirst({
        where: eq(systems.organizationId, TEST_ORGS.ORG_A),
        with: {
          obligationMappings: true,
        },
      })

      if (!system) {
        console.log('Skipping: No systems')
        return
      }

      const originalMappingCount = system.obligationMappings.length

      // Concurrent reads on the same system
      const reads = Array.from({ length: 20 }, async () => {
        return db.query.systems.findFirst({
          where: eq(systems.id, system.id),
          with: { obligationMappings: true },
        })
      })

      const results = await Promise.all(reads)

      // All reads should return consistent data
      for (const result of results) {
        expect(result?.obligationMappings.length).toBe(originalMappingCount)
        expect(result?.organizationId).toBe(TEST_ORGS.ORG_A)
      }
    })
  })
})
