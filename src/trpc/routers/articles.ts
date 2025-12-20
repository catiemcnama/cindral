import { articles, obligations } from '@/db/schema'
import { z } from 'zod'
import { orgProcedure, router } from '../init'
import { eq, and, sql, desc } from 'drizzle-orm'

export const articlesRouter = router({
  /**
   * List articles with filters
   */
  list: orgProcedure
    .input(
      z.object({
        regulationId: z.string().optional(),
        riskLevel: z.enum(['critical', 'high', 'medium', 'low']).optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const { regulationId, riskLevel, limit = 50, offset = 0 } = input ?? {}

      const conditions = []

      if (regulationId) {
        conditions.push(eq(articles.regulationId, regulationId))
      }

      if (riskLevel) {
        conditions.push(eq(articles.riskLevel, riskLevel))
      }

      const arts = await ctx.db.query.articles.findMany({
        where: conditions.length > 0 ? and(...conditions) : undefined,
        limit,
        offset,
        orderBy: [desc(articles.riskLevel), desc(articles.createdAt)],
        with: {
          regulation: {
            columns: { id: true, name: true },
          },
        },
      })

      return arts
    }),

  /**
   * Get a single article by ID with all related data
   */
  getById: orgProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const article = await ctx.db.query.articles.findFirst({
        where: eq(articles.id, input.id),
        with: {
          regulation: true,
          obligations: {
            where: sql`(${obligations.organizationId} IS NULL OR ${obligations.organizationId} = ${ctx.activeOrganizationId})`,
          },
          systemImpacts: {
            with: {
              system: true,
            },
          },
        },
      })

      if (!article) {
        throw new Error('Article not found')
      }

      return article
    }),

  /**
   * Create a new article
   */
  create: orgProcedure
    .input(
      z.object({
        id: z.string().min(1).max(100),
        regulationId: z.string(),
        articleNumber: z.string().min(1).max(50),
        sectionTitle: z.string().max(255).optional(),
        description: z.string().optional(),
        fullText: z.string().optional(),
        riskLevel: z.enum(['critical', 'high', 'medium', 'low']).optional(),
        aiSummary: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.member.role !== 'owner' && ctx.member.role !== 'admin') {
        throw new Error('Only admins can create articles')
      }

      const [article] = await ctx.db
        .insert(articles)
        .values(input)
        .returning()

      return article
    }),

  /**
   * Update an article
   */
  update: orgProcedure
    .input(
      z.object({
        id: z.string(),
        articleNumber: z.string().min(1).max(50).optional(),
        sectionTitle: z.string().max(255).optional(),
        description: z.string().optional(),
        fullText: z.string().optional(),
        riskLevel: z.enum(['critical', 'high', 'medium', 'low']).optional(),
        aiSummary: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.member.role !== 'owner' && ctx.member.role !== 'admin') {
        throw new Error('Only admins can update articles')
      }

      const { id, ...updates } = input

      const [article] = await ctx.db
        .update(articles)
        .set(updates)
        .where(eq(articles.id, id))
        .returning()

      return article
    }),

  /**
   * Delete an article
   */
  delete: orgProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.member.role !== 'owner') {
        throw new Error('Only owners can delete articles')
      }

      await ctx.db.delete(articles).where(eq(articles.id, input.id))

      return { success: true }
    }),
})
