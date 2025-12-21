import { beforeAll, describe, expect, it } from 'vitest'
import { TEST_ORGS } from '../helpers'

// Skip integration tests if no database URL is configured
const skipTests = !process.env.DATABASE_URL

describe.skipIf(skipTests)('Tenant Isolation', () => {
  // Lazy load db to avoid initialization errors when DATABASE_URL is not set
  let db: Awaited<typeof import('@/db')>['db']
  let obligations: Awaited<typeof import('@/db/schema')>['obligations']
  let regulations: Awaited<typeof import('@/db/schema')>['regulations']
  let articles: Awaited<typeof import('@/db/schema')>['articles']
  let systems: Awaited<typeof import('@/db/schema')>['systems']
  let alerts: Awaited<typeof import('@/db/schema')>['alerts']
  let obligationSystemMappings: Awaited<typeof import('@/db/schema')>['obligationSystemMappings']
  let eq: Awaited<typeof import('drizzle-orm')>['eq']
  let and: Awaited<typeof import('drizzle-orm')>['and']

  beforeAll(async () => {
    // Dynamic imports to avoid initialization errors
    const dbModule = await import('@/db')
    const schemaModule = await import('@/db/schema')
    const drizzleOrm = await import('drizzle-orm')

    db = dbModule.db
    obligations = schemaModule.obligations
    regulations = schemaModule.regulations
    articles = schemaModule.articles
    systems = schemaModule.systems
    alerts = schemaModule.alerts
    obligationSystemMappings = schemaModule.obligationSystemMappings
    eq = drizzleOrm.eq
    and = drizzleOrm.and

    // Verify seed data exists
    const orgs = await db.query.obligations.findMany({
      where: eq(obligations.organizationId, TEST_ORGS.ORG_A),
      limit: 1,
    })

    if (orgs.length === 0) {
      throw new Error('Test data not found. Run `npm run db:seed` before running tests.')
    }
  })

  describe('Obligations', () => {
    it('are isolated by organization', async () => {
      const orgAObligations = await db.query.obligations.findMany({
        where: eq(obligations.organizationId, TEST_ORGS.ORG_A),
        limit: 5,
      })

      expect(orgAObligations.length).toBeGreaterThan(0)

      // Verify Org A obligations are not visible with Org B filter
      for (const obl of orgAObligations) {
        const crossOrgResult = await db.query.obligations.findFirst({
          where: and(eq(obligations.id, obl.id), eq(obligations.organizationId, TEST_ORGS.ORG_B)),
        })
        expect(crossOrgResult).toBeUndefined()
      }
    })

    it('have no ID collisions between organizations', async () => {
      const [orgAObls, orgBObls] = await Promise.all([
        db.query.obligations.findMany({ where: eq(obligations.organizationId, TEST_ORGS.ORG_A) }),
        db.query.obligations.findMany({ where: eq(obligations.organizationId, TEST_ORGS.ORG_B) }),
      ])

      const orgAIds = new Set(orgAObls.map((o) => o.id))
      const orgBIds = new Set(orgBObls.map((o) => o.id))

      for (const id of orgBIds) {
        expect(orgAIds.has(id)).toBe(false)
      }
    })
  })

  describe('Systems', () => {
    it('are isolated by organization', async () => {
      const orgASystems = await db.query.systems.findMany({
        where: eq(systems.organizationId, TEST_ORGS.ORG_A),
        limit: 5,
      })

      expect(orgASystems.length).toBeGreaterThan(0)

      for (const sys of orgASystems) {
        const crossOrgResult = await db.query.systems.findFirst({
          where: and(eq(systems.id, sys.id), eq(systems.organizationId, TEST_ORGS.ORG_B)),
        })
        expect(crossOrgResult).toBeUndefined()
      }
    })
  })

  describe('Regulations', () => {
    it('are isolated by organization', async () => {
      const orgARegs = await db.query.regulations.findMany({
        where: eq(regulations.organizationId, TEST_ORGS.ORG_A),
        limit: 5,
      })

      expect(orgARegs.length).toBeGreaterThan(0)

      for (const reg of orgARegs) {
        const crossOrgResult = await db.query.regulations.findFirst({
          where: and(eq(regulations.id, reg.id), eq(regulations.organizationId, TEST_ORGS.ORG_B)),
        })
        expect(crossOrgResult).toBeUndefined()
      }
    })
  })

  describe('Alerts', () => {
    it('are isolated by organization', async () => {
      const orgAAlerts = await db.query.alerts.findMany({
        where: eq(alerts.organizationId, TEST_ORGS.ORG_A),
        limit: 5,
      })

      // Alerts might be empty, that's okay
      for (const alert of orgAAlerts) {
        const crossOrgResult = await db.query.alerts.findFirst({
          where: and(eq(alerts.id, alert.id), eq(alerts.organizationId, TEST_ORGS.ORG_B)),
        })
        expect(crossOrgResult).toBeUndefined()
      }
    })
  })

  describe('Articles', () => {
    it('are isolated by organization', async () => {
      const orgAArticles = await db.query.articles.findMany({
        where: eq(articles.organizationId, TEST_ORGS.ORG_A),
        limit: 5,
      })

      expect(orgAArticles.length).toBeGreaterThan(0)

      for (const article of orgAArticles) {
        const crossOrgResult = await db.query.articles.findFirst({
          where: and(eq(articles.id, article.id), eq(articles.organizationId, TEST_ORGS.ORG_B)),
        })
        expect(crossOrgResult).toBeUndefined()
      }
    })
  })

  describe('Obligation-System Mappings', () => {
    it('are isolated by organization', async () => {
      const orgAMappings = await db.query.obligationSystemMappings.findMany({
        where: eq(obligationSystemMappings.organizationId, TEST_ORGS.ORG_A),
        limit: 5,
      })

      for (const mapping of orgAMappings) {
        const crossOrgResult = await db.query.obligationSystemMappings.findFirst({
          where: and(
            eq(obligationSystemMappings.id, mapping.id),
            eq(obligationSystemMappings.organizationId, TEST_ORGS.ORG_B)
          ),
        })
        expect(crossOrgResult).toBeUndefined()
      }
    })
  })
})
