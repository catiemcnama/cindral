import { articles, obligations } from '@/db/schema'
import { and, desc, eq, sql } from 'drizzle-orm'
import { z } from 'zod'
import { orgProcedure, router } from '../init'

export const obligationsRouter = router({
  /**
   * List obligations with filters
   */
  list: orgProcedure
    .input(
      z
        .object({
          articleId: z.string().optional(),
          regulationId: z.string().optional(),
          status: z.enum(['pending', 'compliant', 'non_compliant']).optional(),
          limit: z.number().min(1).max(100).default(50),
          offset: z.number().min(0).default(0),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const { articleId, regulationId, status, limit = 50, offset = 0 } = input ?? {}

      // Build query based on filters
      let obligationsList

      if (regulationId) {
        // First get all articles for this regulation
        const arts = await ctx.db.query.articles.findMany({
          where: eq(articles.regulationId, regulationId),
          columns: { id: true },
        })
        const articleIds = arts.map((a) => a.id)

        if (articleIds.length === 0) {
          return {
            items: [],
            total: 0,
            stats: { compliant: 0, pending: 0, nonCompliant: 0, total: 0 },
            limit,
            offset,
          }
        }

        const conditions = [
          sql`${obligations.articleId} IN (${sql.join(
            articleIds.map((id) => sql`${id}`),
            sql`, `
          )})`,
          sql`(${obligations.organizationId} IS NULL OR ${obligations.organizationId} = ${ctx.activeOrganizationId})`,
        ]

        if (status) {
          conditions.push(eq(obligations.status, status))
        }

        obligationsList = await ctx.db.query.obligations.findMany({
          where: and(...conditions),
          limit,
          offset,
          orderBy: desc(obligations.updatedAt),
          with: {
            article: {
              with: {
                regulation: {
                  columns: { id: true, name: true },
                },
              },
            },
          },
        })
      } else {
        const conditions = [
          sql`(${obligations.organizationId} IS NULL OR ${obligations.organizationId} = ${ctx.activeOrganizationId})`,
        ]

        if (articleId) {
          conditions.push(eq(obligations.articleId, articleId))
        }

        if (status) {
          conditions.push(eq(obligations.status, status))
        }

        obligationsList = await ctx.db.query.obligations.findMany({
          where: and(...conditions),
          limit,
          offset,
          orderBy: desc(obligations.updatedAt),
          with: {
            article: {
              with: {
                regulation: {
                  columns: { id: true, name: true },
                },
              },
            },
          },
        })
      }

      // Get stats
      const allObls = await ctx.db.query.obligations.findMany({
        where: sql`(${obligations.organizationId} IS NULL OR ${obligations.organizationId} = ${ctx.activeOrganizationId})`,
        columns: { status: true },
      })

      const stats = {
        compliant: allObls.filter((o) => o.status === 'compliant').length,
        pending: allObls.filter((o) => o.status === 'pending').length,
        nonCompliant: allObls.filter((o) => o.status === 'non_compliant').length,
        total: allObls.length,
      }

      return {
        items: obligationsList,
        total: obligationsList.length,
        stats,
        compliancePercent: stats.total > 0 ? Math.round((stats.compliant / stats.total) * 100) : 100,
        limit,
        offset,
      }
    }),

  /**
   * Get a single obligation by ID
   */
  getById: orgProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    const obligation = await ctx.db.query.obligations.findFirst({
      where: and(
        eq(obligations.id, input.id),
        sql`(${obligations.organizationId} IS NULL OR ${obligations.organizationId} = ${ctx.activeOrganizationId})`
      ),
      with: {
        article: {
          with: {
            regulation: true,
            systemImpacts: {
              with: {
                system: true,
              },
            },
          },
        },
      },
    })

    if (!obligation) {
      throw new Error('Obligation not found')
    }

    return obligation
  }),

  /**
   * Update obligation status
   */
  updateStatus: orgProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(['pending', 'compliant', 'non_compliant']),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // First check if obligation exists and belongs to org
      const existing = await ctx.db.query.obligations.findFirst({
        where: eq(obligations.id, input.id),
      })

      if (!existing) {
        throw new Error('Obligation not found')
      }

      // If it's a global obligation, create an org-specific override
      if (!existing.organizationId) {
        const [newObl] = await ctx.db
          .insert(obligations)
          .values({
            id: `${input.id}-${ctx.activeOrganizationId}`,
            articleId: existing.articleId,
            title: existing.title,
            description: existing.description,
            status: input.status,
            lastReviewedAt: new Date(),
            organizationId: ctx.activeOrganizationId,
          })
          .returning()

        return newObl
      }

      // Update existing org-specific obligation
      const [updated] = await ctx.db
        .update(obligations)
        .set({
          status: input.status,
          lastReviewedAt: new Date(),
        })
        .where(and(eq(obligations.id, input.id), eq(obligations.organizationId, ctx.activeOrganizationId)))
        .returning()

      return updated
    }),

  /**
   * Bulk update obligation status
   */
  bulkUpdateStatus: orgProcedure
    .input(
      z.object({
        ids: z.array(z.string()),
        status: z.enum(['pending', 'compliant', 'non_compliant']),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const results = await Promise.all(
        input.ids.map(async (id) => {
          const existing = await ctx.db.query.obligations.findFirst({
            where: eq(obligations.id, id),
          })

          if (!existing) return null

          if (!existing.organizationId) {
            // Create org-specific override
            return ctx.db
              .insert(obligations)
              .values({
                id: `${id}-${ctx.activeOrganizationId}`,
                articleId: existing.articleId,
                title: existing.title,
                description: existing.description,
                status: input.status,
                lastReviewedAt: new Date(),
                organizationId: ctx.activeOrganizationId,
              })
              .returning()
          }

          return ctx.db
            .update(obligations)
            .set({
              status: input.status,
              lastReviewedAt: new Date(),
            })
            .where(and(eq(obligations.id, id), eq(obligations.organizationId, ctx.activeOrganizationId)))
            .returning()
        })
      )

      return { updated: results.filter(Boolean).length }
    }),

  /**
   * Create a new obligation
   */
  create: orgProcedure
    .input(
      z.object({
        articleId: z.string(),
        title: z.string().min(1).max(500),
        description: z.string().optional(),
        status: z.enum(['pending', 'compliant', 'non_compliant']).default('pending'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Generate obligation ID
      const countResult = await ctx.db.select({ count: sql<number>`count(*)` }).from(obligations)

      const count = Number(countResult[0]?.count ?? 0)

      // Get article for ID prefix
      const article = await ctx.db.query.articles.findFirst({
        where: eq(articles.id, input.articleId),
        with: {
          regulation: {
            columns: { id: true },
          },
        },
      })

      const prefix = article?.regulation?.id?.toUpperCase() ?? 'OBL'
      const id = `OBL-${prefix}-${String(count + 1).padStart(3, '0')}`

      const [obligation] = await ctx.db
        .insert(obligations)
        .values({
          ...input,
          id,
          organizationId: ctx.activeOrganizationId,
        })
        .returning()

      return obligation
    }),

  /**
   * Update an obligation
   */
  update: orgProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1).max(500).optional(),
        description: z.string().optional(),
        status: z.enum(['pending', 'compliant', 'non_compliant']).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updates } = input

      const [obligation] = await ctx.db
        .update(obligations)
        .set({
          ...updates,
          lastReviewedAt: updates.status ? new Date() : undefined,
        })
        .where(and(eq(obligations.id, id), eq(obligations.organizationId, ctx.activeOrganizationId)))
        .returning()

      return obligation
    }),

  /**
   * Delete an obligation
   */
  delete: orgProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    await ctx.db
      .delete(obligations)
      .where(and(eq(obligations.id, input.id), eq(obligations.organizationId, ctx.activeOrganizationId)))

    return { success: true }
  }),
})
