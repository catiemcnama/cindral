import { beforeAll, describe, expect, it } from 'vitest'
import { TEST_ORGS } from '../helpers'

// Skip integration tests if no database URL is configured
const skipTests = !process.env.DATABASE_URL

describe.skipIf(skipTests)('Database Constraints', () => {
  let db: Awaited<typeof import('@/db')>['db']
  let obligations: Awaited<typeof import('@/db/schema')>['obligations']
  let regulations: Awaited<typeof import('@/db/schema')>['regulations']
  let articles: Awaited<typeof import('@/db/schema')>['articles']
  let systems: Awaited<typeof import('@/db/schema')>['systems']
  let organization: Awaited<typeof import('@/db/schema')>['organization']
  let eq: Awaited<typeof import('drizzle-orm')>['eq']

  beforeAll(async () => {
    const dbModule = await import('@/db')
    const schemaModule = await import('@/db/schema')
    const drizzleOrm = await import('drizzle-orm')

    db = dbModule.db
    obligations = schemaModule.obligations
    regulations = schemaModule.regulations
    articles = schemaModule.articles
    systems = schemaModule.systems
    organization = schemaModule.organization
    eq = drizzleOrm.eq
  })

  describe('Foreign Key Constraints', () => {
    it('rejects obligation with invalid article_id', async () => {
      const invalidObligation = {
        id: 'test-invalid-obl-' + Date.now(),
        organizationId: TEST_ORGS.ORG_A,
        articleId: 'non-existent-article-id-xyz',
        title: 'Test Invalid Obligation',
        status: 'not_started' as const,
      }

      await expect(db.insert(obligations).values(invalidObligation)).rejects.toThrow()
    })

    it('rejects article with invalid regulation_id', async () => {
      const invalidArticle = {
        id: 'test-invalid-art-' + Date.now(),
        organizationId: TEST_ORGS.ORG_A,
        regulationId: 'non-existent-regulation-id-xyz',
        articleNumber: 'Test Article 999',
      }

      await expect(db.insert(articles).values(invalidArticle)).rejects.toThrow()
    })

    it('rejects regulation with invalid organization_id', async () => {
      const invalidRegulation = {
        id: 'test-invalid-reg-' + Date.now(),
        organizationId: 'non-existent-org-id-xyz',
        name: 'Test Invalid Regulation',
        slug: 'test-invalid',
        framework: 'TEST',
        fullTitle: 'Test Invalid Regulation',
      }

      await expect(db.insert(regulations).values(invalidRegulation)).rejects.toThrow()
    })
  })

  describe('Cascade Delete Behavior', () => {
    it('deleting organization cascades to regulations', async () => {
      // Create test organization
      const testOrgId = 'test-cascade-org-' + Date.now()
      await db.insert(organization).values({
        id: testOrgId,
        name: 'Cascade Test Org',
        slug: 'cascade-test-' + Date.now(),
        createdAt: new Date(),
      })

      // Create regulation for this org
      const testRegId = 'test-cascade-reg-' + Date.now()
      await db.insert(regulations).values({
        id: testRegId,
        organizationId: testOrgId,
        name: 'Cascade Test Reg',
        slug: 'cascade-test-reg',
        framework: 'TEST',
        fullTitle: 'Test Regulation for Cascade',
      })

      // Verify regulation exists
      const beforeDelete = await db.query.regulations.findFirst({
        where: eq(regulations.id, testRegId),
      })
      expect(beforeDelete).toBeDefined()

      // Delete organization
      await db.delete(organization).where(eq(organization.id, testOrgId))

      // Verify regulation was cascade deleted
      const afterDelete = await db.query.regulations.findFirst({
        where: eq(regulations.id, testRegId),
      })
      expect(afterDelete).toBeUndefined()
    })

    it('deleting regulation cascades to articles', async () => {
      // Get an existing regulation with articles
      const existingReg = await db.query.regulations.findFirst({
        where: eq(regulations.organizationId, TEST_ORGS.ORG_A),
        with: { articles: { limit: 1 } },
      })

      if (!existingReg || existingReg.articles.length === 0) {
        // Skip if no test data - this is expected in clean environments
        return
      }

      // Create a new regulation for this test to avoid affecting other tests
      const testOrgId = TEST_ORGS.ORG_A
      const testRegId = 'test-cascade-reg2-' + Date.now()
      const testArtId = 'test-cascade-art-' + Date.now()

      await db.insert(regulations).values({
        id: testRegId,
        organizationId: testOrgId,
        name: 'Cascade Test Reg 2',
        slug: 'cascade-test-reg2-' + Date.now(),
        framework: 'TEST',
        fullTitle: 'Test Regulation 2',
      })

      await db.insert(articles).values({
        id: testArtId,
        organizationId: testOrgId,
        regulationId: testRegId,
        articleNumber: 'Test Article',
      })

      // Verify article exists
      const beforeDelete = await db.query.articles.findFirst({
        where: eq(articles.id, testArtId),
      })
      expect(beforeDelete).toBeDefined()

      // Delete regulation
      await db.delete(regulations).where(eq(regulations.id, testRegId))

      // Verify article was cascade deleted
      const afterDelete = await db.query.articles.findFirst({
        where: eq(articles.id, testArtId),
      })
      expect(afterDelete).toBeUndefined()
    })
  })

  describe('Unique Constraints', () => {
    it('rejects duplicate regulation slug within same organization', async () => {
      // Get an existing regulation to copy its slug
      const existingReg = await db.query.regulations.findFirst({
        where: eq(regulations.organizationId, TEST_ORGS.ORG_A),
      })

      if (!existingReg) {
        // Skip if no test data
        return
      }

      const duplicateRegulation = {
        id: 'test-dup-reg-' + Date.now(),
        organizationId: TEST_ORGS.ORG_A,
        name: 'Duplicate Test',
        slug: existingReg.slug, // Same slug = should fail
        framework: 'TEST',
        fullTitle: 'Duplicate Test Regulation',
      }

      await expect(db.insert(regulations).values(duplicateRegulation)).rejects.toThrow()
    })

    it('allows same slug in different organizations', async () => {
      const sharedSlug = 'shared-slug-test-' + Date.now()

      // Create regulation with slug in Org A
      const regA = {
        id: 'test-shared-reg-a-' + Date.now(),
        organizationId: TEST_ORGS.ORG_A,
        name: 'Shared Slug Test A',
        slug: sharedSlug,
        framework: 'TEST',
        fullTitle: 'Shared Slug Test A',
      }

      // Create regulation with same slug in Org B
      const regB = {
        id: 'test-shared-reg-b-' + Date.now(),
        organizationId: TEST_ORGS.ORG_B,
        name: 'Shared Slug Test B',
        slug: sharedSlug,
        framework: 'TEST',
        fullTitle: 'Shared Slug Test B',
      }

      // Both should succeed
      await db.insert(regulations).values(regA)
      await db.insert(regulations).values(regB)

      // Cleanup
      await db.delete(regulations).where(eq(regulations.id, regA.id))
      await db.delete(regulations).where(eq(regulations.id, regB.id))
    })

    it('rejects duplicate system slug within same organization', async () => {
      const existingSystem = await db.query.systems.findFirst({
        where: eq(systems.organizationId, TEST_ORGS.ORG_A),
      })

      if (!existingSystem?.slug) {
        return
      }

      const duplicateSystem = {
        id: 'test-dup-sys-' + Date.now(),
        organizationId: TEST_ORGS.ORG_A,
        name: 'Duplicate System',
        slug: existingSystem.slug,
      }

      await expect(db.insert(systems).values(duplicateSystem)).rejects.toThrow()
    })
  })
})
