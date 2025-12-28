import { articles, articleSystemImpacts, obligations } from '@/db/schema'
import { withAudit, withCreateAudit, withDeleteAudit } from '@/lib/audit'
import { NotFoundError } from '@/lib/errors'
import { requireAdmin, requireMutatePermission, scopedAnd } from '@/lib/tenancy'
import { and, desc, eq, sql } from 'drizzle-orm'
import { z } from 'zod'
import { orgProcedure, router } from '../init'

export const articlesRouter = router({
  /**
   * List articles with filters
   */
  list: orgProcedure
    .input(
      z
        .object({
          regulationId: z.string().optional(),
          reviewStatus: z.enum(['pending', 'approved', 'rejected']).optional(),
          limit: z.number().min(1).max(100).default(50),
          offset: z.number().min(0).default(0),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const { regulationId, reviewStatus, limit = 50, offset = 0 } = input ?? {}

      // Strict org scoping
      const conditions = [eq(articles.organizationId, ctx.activeOrganizationId)]

      if (regulationId) {
        conditions.push(eq(articles.regulationId, regulationId))
      }

      if (reviewStatus) {
        conditions.push(eq(articles.reviewStatus, reviewStatus))
      }

      const arts = await ctx.db.query.articles.findMany({
        where: and(...conditions),
        limit,
        offset,
        orderBy: desc(articles.createdAt),
        with: {
          regulation: {
            columns: { id: true, name: true, framework: true },
          },
        },
      })

      // Get total count
      const totalResult = await ctx.db
        .select({ count: sql<number>`count(*)` })
        .from(articles)
        .where(and(...conditions))

      return {
        items: arts,
        total: Number(totalResult[0]?.count ?? 0),
        limit,
        offset,
      }
    }),

  /**
   * Get a single article by ID with all related data
   */
  getById: orgProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    const article = await ctx.db.query.articles.findFirst({
      where: scopedAnd(articles, ctx, eq(articles.id, input.id)),
      with: {
        regulation: true,
        obligations: {
          where: eq(obligations.organizationId, ctx.activeOrganizationId),
        },
        systemImpacts: {
          where: eq(articleSystemImpacts.organizationId, ctx.activeOrganizationId),
          with: {
            system: true,
          },
        },
        ingestJob: {
          columns: { id: true, source: true, status: true, finishedAt: true },
        },
      },
    })

    if (!article) {
      throw new NotFoundError('Article', input.id)
    }

    return article
  }),

  /**
   * Create a new article
   */
  create: orgProcedure
    .input(
      z.object({
        regulationId: z.string(),
        articleNumber: z.string().min(1).max(100),
        sectionTitle: z.string().optional(),
        title: z.string().optional(),
        rawText: z.string().optional(),
        normalizedText: z.string().optional(),
        aiSummary: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      requireMutatePermission(ctx)

      return withCreateAudit(ctx, 'create_article', 'article', async () => {
        // Generate ID
        const id = `${input.regulationId}-${input.articleNumber.replace(/\s+/g, '-').toLowerCase()}`

        const [article] = await ctx.db
          .insert(articles)
          .values({
            ...input,
            id,
            organizationId: ctx.activeOrganizationId,
            title: input.title || input.sectionTitle,
            reviewStatus: 'pending',
          })
          .returning()

        return article
      })
    }),

  /**
   * Update an article
   */
  update: orgProcedure
    .input(
      z.object({
        id: z.string(),
        articleNumber: z.string().min(1).max(100).optional(),
        sectionTitle: z.string().optional(),
        title: z.string().optional(),
        rawText: z.string().optional(),
        normalizedText: z.string().optional(),
        aiSummary: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      requireMutatePermission(ctx)

      return withAudit(ctx, 'update_article', 'article', input.id, async () => {
        const { id, ...updates } = input

        const before = await ctx.db.query.articles.findFirst({
          where: scopedAnd(articles, ctx, eq(articles.id, id)),
        })

        const [after] = await ctx.db
          .update(articles)
          .set(updates)
          .where(scopedAnd(articles, ctx, eq(articles.id, id)))
          .returning()

        return { before, after, result: after }
      })
    }),

  /**
   * Review an article (approve/reject)
   */
  review: orgProcedure
    .input(
      z.object({
        id: z.string(),
        reviewStatus: z.enum(['approved', 'rejected']),
      })
    )
    .mutation(async ({ ctx, input }) => {
      requireMutatePermission(ctx)

      return withAudit(ctx, 'review_article', 'article', input.id, async () => {
        const before = await ctx.db.query.articles.findFirst({
          where: scopedAnd(articles, ctx, eq(articles.id, input.id)),
        })

        const [after] = await ctx.db
          .update(articles)
          .set({
            reviewStatus: input.reviewStatus,
            humanReviewedAt: new Date(),
            humanReviewedBy: ctx.user.id,
          })
          .where(scopedAnd(articles, ctx, eq(articles.id, input.id)))
          .returning()

        return { before, after, result: after }
      })
    }),

  /**
   * Delete an article
   */
  delete: orgProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    requireAdmin(ctx)

    return withDeleteAudit(
      ctx,
      'delete_obligation',
      'article',
      input.id,
      () =>
        ctx.db.query.articles.findFirst({
          where: scopedAnd(articles, ctx, eq(articles.id, input.id)),
        }),
      () => ctx.db.delete(articles).where(scopedAnd(articles, ctx, eq(articles.id, input.id)))
    )
  }),

  /**
   * Get articles by regulation
   */
  getByRegulation: orgProcedure.input(z.object({ regulationId: z.string() })).query(async ({ ctx, input }) => {
    return ctx.db.query.articles.findMany({
      where: scopedAnd(articles, ctx, eq(articles.regulationId, input.regulationId)),
      orderBy: (a, { asc }) => asc(a.articleNumber),
      with: {
        obligations: {
          where: eq(obligations.organizationId, ctx.activeOrganizationId),
          columns: { id: true, status: true },
        },
      },
    })
  }),

  /**
   * Get article stats
   */
  getStats: orgProcedure.query(async ({ ctx }) => {
    const arts = await ctx.db.query.articles.findMany({
      where: eq(articles.organizationId, ctx.activeOrganizationId),
      columns: { reviewStatus: true, regulationId: true },
    })

    const byStatus = {
      pending: arts.filter((a) => a.reviewStatus === 'pending').length,
      approved: arts.filter((a) => a.reviewStatus === 'approved').length,
      rejected: arts.filter((a) => a.reviewStatus === 'rejected').length,
    }

    const byRegulation = new Map<string, number>()
    arts.forEach((a) => {
      byRegulation.set(a.regulationId, (byRegulation.get(a.regulationId) ?? 0) + 1)
    })

    return {
      total: arts.length,
      byStatus,
      byRegulation: Object.fromEntries(byRegulation),
    }
  }),
})
