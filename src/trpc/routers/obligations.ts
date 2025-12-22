import { articles, auditLog, obligations } from '@/db/schema'
import { withAudit, withCreateAudit, withDeleteAudit } from '@/lib/audit'
import { NotFoundError } from '@/lib/errors'
import { requireMutatePermission, scopedAnd } from '@/lib/tenancy'
import { and, desc, eq, isNull, sql } from 'drizzle-orm'
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
          status: z.enum(['not_started', 'in_progress', 'implemented', 'under_review', 'verified']).optional(),
          riskLevel: z.enum(['low', 'medium', 'high', 'critical']).optional(),
          limit: z.number().min(1).max(100).default(50),
          offset: z.number().min(0).default(0),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const { articleId, regulationId, status, riskLevel, limit = 50, offset = 0 } = input ?? {}

      // Start with strict org scoping + soft-delete filter
      const conditions = [eq(obligations.organizationId, ctx.activeOrganizationId), isNull(obligations.deletedAt)]

      if (regulationId) {
        conditions.push(eq(obligations.regulationId, regulationId))
      }

      if (articleId) {
        conditions.push(eq(obligations.articleId, articleId))
      }

      if (status) {
        conditions.push(eq(obligations.status, status))
      }

      if (riskLevel) {
        conditions.push(eq(obligations.riskLevel, riskLevel))
      }

      const obligationsList = await ctx.db.query.obligations.findMany({
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
          owner: {
            columns: { id: true, name: true, email: true },
          },
          systemMappings: {
            with: {
              system: {
                columns: { id: true, name: true, criticality: true },
              },
            },
          },
        },
      })

      // Get total count for pagination (respecting filters)
      const totalResult = await ctx.db
        .select({ count: sql<number>`count(*)` })
        .from(obligations)
        .where(and(...conditions))

      // Get stats for all org obligations
      const allObls = await ctx.db.query.obligations.findMany({
        where: eq(obligations.organizationId, ctx.activeOrganizationId),
        columns: { status: true },
      })

      const stats = {
        notStarted: allObls.filter((o) => o.status === 'not_started').length,
        inProgress: allObls.filter((o) => o.status === 'in_progress').length,
        implemented: allObls.filter((o) => o.status === 'implemented').length,
        underReview: allObls.filter((o) => o.status === 'under_review').length,
        verified: allObls.filter((o) => o.status === 'verified').length,
        total: allObls.length,
      }

      const compliant = stats.verified + stats.implemented
      const compliancePercent = stats.total > 0 ? Math.round((compliant / stats.total) * 100) : 100

      return {
        items: obligationsList,
        total: Number(totalResult[0]?.count ?? 0),
        stats,
        compliancePercent,
        limit,
        offset,
      }
    }),

  /**
   * Get a single obligation by ID
   */
  getById: orgProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    const obligation = await ctx.db.query.obligations.findFirst({
      where: scopedAnd(obligations, ctx, eq(obligations.id, input.id)),
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
        regulation: true,
        owner: {
          columns: { id: true, name: true, email: true },
        },
        systemMappings: {
          with: {
            system: true,
          },
        },
      },
    })

    if (!obligation) {
      throw new NotFoundError('Obligation', input.id)
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
        status: z.enum(['not_started', 'in_progress', 'implemented', 'under_review', 'verified']),
      })
    )
    .mutation(async ({ ctx, input }) => {
      requireMutatePermission(ctx)

      return withAudit(ctx, 'update_obligation_status', 'obligation', input.id, async () => {
        const before = await ctx.db.query.obligations.findFirst({
          where: scopedAnd(obligations, ctx, eq(obligations.id, input.id)),
        })

        if (!before) {
          throw new NotFoundError('Obligation', input.id)
        }

        const [after] = await ctx.db
          .update(obligations)
          .set({
            status: input.status,
            humanReviewedAt: new Date(),
            humanReviewedBy: ctx.user.id,
          })
          .where(scopedAnd(obligations, ctx, eq(obligations.id, input.id)))
          .returning()

        return { before, after, result: after }
      })
    }),

  /**
   * Bulk update obligation status
   */
  bulkUpdateStatus: orgProcedure
    .input(
      z.object({
        ids: z.array(z.string()).min(1).max(100),
        status: z.enum(['not_started', 'in_progress', 'implemented', 'under_review', 'verified']),
      })
    )
    .mutation(async ({ ctx, input }) => {
      requireMutatePermission(ctx)

      // Use transaction to ensure atomicity
      return ctx.db.transaction(async (tx) => {
        const results: Array<{ id: string; success: boolean }> = []

        for (const id of input.ids) {
          const before = await tx.query.obligations.findFirst({
            where: scopedAnd(obligations, ctx, eq(obligations.id, id)),
          })

          if (!before) {
            results.push({ id, success: false })
            continue
          }

          const [after] = await tx
            .update(obligations)
            .set({
              status: input.status,
              humanReviewedAt: new Date(),
              humanReviewedBy: ctx.user.id,
            })
            .where(scopedAnd(obligations, ctx, eq(obligations.id, id)))
            .returning()

          // Record audit
          if (after) {
            await tx.insert(auditLog).values({
              organizationId: ctx.activeOrganizationId,
              actorUserId: ctx.user.id,
              action: 'update_obligation_status',
              entityType: 'obligation',
              entityId: id,
              diff: { before, after },
            })
            results.push({ id, success: true })
          }
        }

        return { updated: results.filter((r) => r.success).length, results }
      })
    }),

  /**
   * Create a new obligation
   */
  create: orgProcedure
    .input(
      z.object({
        articleId: z.string(),
        title: z.string().min(1).max(500),
        summary: z.string().optional(),
        referenceCode: z.string().optional(),
        requirementType: z.enum(['process', 'technical', 'reporting']).optional(),
        riskLevel: z.enum(['low', 'medium', 'high', 'critical']).optional(),
        status: z
          .enum(['not_started', 'in_progress', 'implemented', 'under_review', 'verified'])
          .default('not_started'),
        dueDate: z.date().optional(),
        ownerUserId: z.string().optional(),
        ownerTeam: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      requireMutatePermission(ctx)

      return withCreateAudit(ctx, 'create_obligation', 'obligation', async () => {
        // Get article to derive regulation and ID prefix
        const article = await ctx.db.query.articles.findFirst({
          where: scopedAnd(articles, ctx, eq(articles.id, input.articleId)),
          with: {
            regulation: {
              columns: { id: true },
            },
          },
        })

        if (!article) {
          throw new NotFoundError('Article', input.articleId)
        }

        // Generate obligation ID
        const countResult = await ctx.db
          .select({ count: sql<number>`count(*)` })
          .from(obligations)
          .where(eq(obligations.organizationId, ctx.activeOrganizationId))

        const count = Number(countResult[0]?.count ?? 0)
        const prefix = article.regulation?.id?.toUpperCase() ?? 'OBL'
        const id = `OBL-${prefix}-${String(count + 1).padStart(3, '0')}`

        const [obligation] = await ctx.db
          .insert(obligations)
          .values({
            ...input,
            id,
            organizationId: ctx.activeOrganizationId,
            regulationId: article.regulationId,
            sourceType: 'manual',
          })
          .returning()

        return obligation
      })
    }),

  /**
   * Update an obligation
   */
  update: orgProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1).max(500).optional(),
        summary: z.string().optional(),
        referenceCode: z.string().optional(),
        requirementType: z.enum(['process', 'technical', 'reporting']).optional(),
        riskLevel: z.enum(['low', 'medium', 'high', 'critical']).optional(),
        status: z.enum(['not_started', 'in_progress', 'implemented', 'under_review', 'verified']).optional(),
        dueDate: z.date().nullable().optional(),
        ownerUserId: z.string().nullable().optional(),
        ownerTeam: z.string().nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      requireMutatePermission(ctx)

      return withAudit(ctx, 'update_obligation', 'obligation', input.id, async () => {
        const { id, ...updates } = input

        const before = await ctx.db.query.obligations.findFirst({
          where: scopedAnd(obligations, ctx, eq(obligations.id, id)),
        })

        const [after] = await ctx.db
          .update(obligations)
          .set({
            ...updates,
            humanReviewedAt: updates.status ? new Date() : undefined,
            humanReviewedBy: updates.status ? ctx.user.id : undefined,
          })
          .where(scopedAnd(obligations, ctx, eq(obligations.id, id)))
          .returning()

        return { before, after, result: after }
      })
    }),

  /**
   * Delete an obligation
   */
  delete: orgProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    requireMutatePermission(ctx)

    return withDeleteAudit(
      ctx,
      'delete_obligation',
      'obligation',
      input.id,
      () =>
        ctx.db.query.obligations.findFirst({
          where: scopedAnd(obligations, ctx, eq(obligations.id, input.id)),
        }),
      () => ctx.db.delete(obligations).where(scopedAnd(obligations, ctx, eq(obligations.id, input.id)))
    )
  }),

  /**
   * Get obligations by article
   */
  getByArticle: orgProcedure.input(z.object({ articleId: z.string() })).query(async ({ ctx, input }) => {
    return ctx.db.query.obligations.findMany({
      where: scopedAnd(obligations, ctx, eq(obligations.articleId, input.articleId)),
      orderBy: desc(obligations.createdAt),
      with: {
        owner: {
          columns: { id: true, name: true },
        },
        systemMappings: {
          with: {
            system: {
              columns: { id: true, name: true },
            },
          },
        },
      },
    })
  }),

  /**
   * Get obligation stats by regulation
   */
  getStatsByRegulation: orgProcedure.input(z.object({ regulationId: z.string() })).query(async ({ ctx, input }) => {
    const obls = await ctx.db.query.obligations.findMany({
      where: scopedAnd(obligations, ctx, eq(obligations.regulationId, input.regulationId)),
      columns: { status: true, riskLevel: true },
    })

    return {
      total: obls.length,
      byStatus: {
        notStarted: obls.filter((o) => o.status === 'not_started').length,
        inProgress: obls.filter((o) => o.status === 'in_progress').length,
        implemented: obls.filter((o) => o.status === 'implemented').length,
        underReview: obls.filter((o) => o.status === 'under_review').length,
        verified: obls.filter((o) => o.status === 'verified').length,
      },
      byRiskLevel: {
        critical: obls.filter((o) => o.riskLevel === 'critical').length,
        high: obls.filter((o) => o.riskLevel === 'high').length,
        medium: obls.filter((o) => o.riskLevel === 'medium').length,
        low: obls.filter((o) => o.riskLevel === 'low').length,
      },
    }
  }),
})
