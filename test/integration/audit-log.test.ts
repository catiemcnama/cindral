import { beforeAll, describe, expect, it } from 'vitest'
import { TEST_ORGS, TEST_USERS } from '../helpers'

// Skip integration tests if no database URL is configured
const skipTests = !process.env.DATABASE_URL

describe.skipIf(skipTests)('Audit Log', () => {
  // Lazy load to avoid initialization errors
  let db: Awaited<typeof import('@/db')>['db']
  let auditLog: Awaited<typeof import('@/db/schema')>['auditLog']
  let recordAudit: Awaited<typeof import('@/lib/audit')>['recordAudit']
  let getAuditLog: Awaited<typeof import('@/lib/audit')>['getAuditLog']
  let withAudit: Awaited<typeof import('@/lib/audit')>['withAudit']
  let eq: Awaited<typeof import('drizzle-orm')>['eq']

  beforeAll(async () => {
    const dbModule = await import('@/db')
    const schemaModule = await import('@/db/schema')
    const auditModule = await import('@/lib/audit')
    const drizzleOrm = await import('drizzle-orm')

    db = dbModule.db
    auditLog = schemaModule.auditLog
    recordAudit = auditModule.recordAudit
    getAuditLog = auditModule.getAuditLog
    withAudit = auditModule.withAudit
    eq = drizzleOrm.eq
  })
  const testOrgId = TEST_ORGS.ORG_A
  const testUserId = TEST_USERS.ADMIN

  const createAuditContext = () => ({
    activeOrganizationId: testOrgId,
    user: { id: testUserId },
  })

  describe('recordAudit', () => {
    it('creates an audit log entry', async () => {
      const entityId = `test-entity-${Date.now()}`

      await recordAudit({
        ctx: createAuditContext(),
        action: 'test_create',
        entityType: 'obligation',
        entityId,
        before: null,
        after: { id: entityId, status: 'created' },
      })

      const entries = await db.query.auditLog.findMany({
        where: eq(auditLog.entityId, entityId),
      })

      expect(entries).toHaveLength(1)
      expect(entries[0]).toMatchObject({
        organizationId: testOrgId,
        actorUserId: testUserId,
        action: 'test_create',
        entityType: 'obligation',
        entityId,
      })
    })

    it('stores before and after diff', async () => {
      const entityId = `test-diff-${Date.now()}`
      const before = { status: 'old' }
      const after = { status: 'new' }

      await recordAudit({
        ctx: createAuditContext(),
        action: 'update_obligation',
        entityType: 'obligation',
        entityId,
        before,
        after,
      })

      const entries = await db.query.auditLog.findMany({
        where: eq(auditLog.entityId, entityId),
      })

      expect(entries[0]?.diff).toEqual({ before, after })
    })

    it('handles null context gracefully', async () => {
      // Should not throw, just warn - use unknown to bypass type checking for edge case
      await recordAudit({
        ctx: { activeOrganizationId: undefined } as unknown as Parameters<typeof recordAudit>[0]['ctx'],
        action: 'test_create',
        entityType: 'obligation',
        entityId: 'test',
      })
    })
  })

  describe('getAuditLog', () => {
    it('retrieves audit entries for organization', async () => {
      const entries = await getAuditLog({
        organizationId: testOrgId,
        limit: 10,
      })

      entries.forEach((entry) => {
        expect(entry.organizationId).toBe(testOrgId)
      })
    })

    it('filters by entity type', async () => {
      const entries = await getAuditLog({
        organizationId: testOrgId,
        entityType: 'obligation',
        limit: 10,
      })

      entries.forEach((entry) => {
        expect(entry.entityType).toBe('obligation')
      })
    })

    it('respects limit and offset', async () => {
      const firstPage = await getAuditLog({
        organizationId: testOrgId,
        limit: 5,
        offset: 0,
      })

      const secondPage = await getAuditLog({
        organizationId: testOrgId,
        limit: 5,
        offset: 5,
      })

      expect(firstPage).toHaveLength(5)

      // Verify no overlap
      const firstIds = new Set(firstPage.map((e) => e.id))
      secondPage.forEach((entry) => {
        expect(firstIds.has(entry.id)).toBe(false)
      })
    })
  })

  describe('withAudit wrapper', () => {
    it('records audit after successful mutation', async () => {
      const entityId = `wrapper-test-${Date.now()}`

      const result = await withAudit(createAuditContext(), 'update_obligation', 'obligation', entityId, async () => ({
        before: { status: 'old' },
        after: { status: 'new' },
        result: { success: true },
      }))

      expect(result).toEqual({ success: true })

      const entries = await db.query.auditLog.findMany({
        where: eq(auditLog.entityId, entityId),
      })

      expect(entries).toHaveLength(1)
    })
  })
})
