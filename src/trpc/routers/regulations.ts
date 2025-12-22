import { obligations, regulations } from '@/db/schema'
import { withAudit, withCreateAudit, withDeleteAudit } from '@/lib/audit'
import { NotFoundError } from '@/lib/errors'
import { requireAdmin, requireMutatePermission, scopedAnd } from '@/lib/tenancy'
import { and, asc, desc, eq, isNull, sql } from 'drizzle-orm'
import { z } from 'zod'
import { orgProcedure, router } from '../init'

export const regulationsRouter = router({
  /**
   * List all regulations with pagination and filters
   */
  list: orgProcedure
    .input(
      z
        .object({
          limit: z.number().min(1).max(100).default(20),
          offset: z.number().min(0).default(0),
          jurisdiction: z.string().optional(),
          framework: z.string().optional(),
          status: z.enum(['active', 'superseded', 'draft']).optional(),
          search: z.string().optional(),
          sortBy: z.enum(['name', 'effectiveDate', 'lastUpdated', 'framework']).default('name'),
          sortOrder: z.enum(['asc', 'desc']).default('asc'),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const {
        limit = 20,
        offset = 0,
        jurisdiction,
        framework,
        status,
        search,
        sortBy = 'name',
        sortOrder = 'asc',
      } = input ?? {}

      // Strict org scoping + soft-delete filter
      const conditions = [eq(regulations.organizationId, ctx.activeOrganizationId), isNull(regulations.deletedAt)]

      if (jurisdiction) {
        conditions.push(eq(regulations.jurisdiction, jurisdiction))
      }

      if (framework) {
        conditions.push(eq(regulations.framework, framework))
      }

      if (status) {
        conditions.push(eq(regulations.status, status))
      }

      if (search) {
        conditions.push(
          sql`(${regulations.name} ILIKE ${`%${search}%`} OR ${regulations.fullTitle} ILIKE ${`%${search}%`})`
        )
      }

      // Get regulations with article counts
      const regs = await ctx.db.query.regulations.findMany({
        where: and(...conditions),
        limit,
        offset,
        orderBy:
          sortOrder === 'asc'
            ? asc(regulations[sortBy as keyof typeof regulations.$inferSelect])
            : desc(regulations[sortBy as keyof typeof regulations.$inferSelect]),
        with: {
          articles: {
            columns: { id: true },
          },
          ingestJob: {
            columns: { id: true, status: true, finishedAt: true },
          },
        },
      })

      // Get obligation compliance stats per regulation
      const regulationsWithStats = await Promise.all(
        regs.map(async (reg) => {
          const obls = await ctx.db.query.obligations.findMany({
            where: scopedAnd(obligations, ctx, eq(obligations.regulationId, reg.id)),
            columns: { status: true },
          })

          const stats = {
            notStarted: obls.filter((o) => o.status === 'not_started').length,
            inProgress: obls.filter((o) => o.status === 'in_progress').length,
            implemented: obls.filter((o) => o.status === 'implemented').length,
            underReview: obls.filter((o) => o.status === 'under_review').length,
            verified: obls.filter((o) => o.status === 'verified').length,
            total: obls.length,
          }

          const compliant = stats.verified + stats.implemented
          const compliancePercent = stats.total > 0 ? Math.round((compliant / stats.total) * 100) : 100

          return {
            ...reg,
            articleCount: reg.articles.length,
            compliancePercent,
            obligationStats: stats,
          }
        })
      )

      // Get total count for pagination
      const totalResult = await ctx.db
        .select({ count: sql<number>`count(*)` })
        .from(regulations)
        .where(and(...conditions))

      return {
        items: regulationsWithStats,
        total: Number(totalResult[0]?.count ?? 0),
        limit,
        offset,
      }
    }),

  /**
   * Get a single regulation by ID with all related data
   */
  getById: orgProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    const reg = await ctx.db.query.regulations.findFirst({
      where: scopedAnd(regulations, ctx, eq(regulations.id, input.id)),
      with: {
        articles: {
          with: {
            obligations: {
              where: eq(obligations.organizationId, ctx.activeOrganizationId),
            },
            systemImpacts: {
              where: eq(obligations.organizationId, ctx.activeOrganizationId),
              with: {
                system: true,
              },
            },
          },
        },
        regulatoryChanges: {
          orderBy: (rc, { desc }) => desc(rc.publishedAt),
          limit: 10,
        },
        evidencePacks: {
          where: eq(regulations.organizationId, ctx.activeOrganizationId),
          orderBy: (ep, { desc }) => desc(ep.generatedAt),
          limit: 5,
        },
        ingestJob: true,
      },
    })

    if (!reg) {
      throw new NotFoundError('Regulation', input.id)
    }

    // Calculate compliance stats
    const allObligations = reg.articles.flatMap((a) => a.obligations)
    const stats = {
      notStarted: allObligations.filter((o) => o.status === 'not_started').length,
      inProgress: allObligations.filter((o) => o.status === 'in_progress').length,
      implemented: allObligations.filter((o) => o.status === 'implemented').length,
      underReview: allObligations.filter((o) => o.status === 'under_review').length,
      verified: allObligations.filter((o) => o.status === 'verified').length,
      total: allObligations.length,
    }

    const compliant = stats.verified + stats.implemented
    const compliancePercent = stats.total > 0 ? Math.round((compliant / stats.total) * 100) : 100

    // Get unique impacted systems
    const impactedSystems = new Map()
    reg.articles.forEach((article) => {
      article.systemImpacts.forEach((impact) => {
        if (impact.system && !impactedSystems.has(impact.system.id)) {
          impactedSystems.set(impact.system.id, {
            ...impact.system,
            impactLevel: impact.impactLevel,
          })
        }
      })
    })

    return {
      ...reg,
      compliancePercent,
      obligationStats: stats,
      impactedSystems: Array.from(impactedSystems.values()),
    }
  }),

  /**
   * Create a new regulation
   */
  create: orgProcedure
    .input(
      z.object({
        id: z.string().min(1).max(50),
        name: z.string().min(1).max(255),
        fullTitle: z.string().min(1),
        framework: z.string().min(1).max(100),
        version: z.string().optional(),
        jurisdiction: z.string().max(100).optional(),
        effectiveDate: z.date().optional(),
        sourceUrl: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      requireMutatePermission(ctx)

      return withCreateAudit(ctx, 'create_regulation', 'regulation', async () => {
        const slug = input.id

        const [reg] = await ctx.db
          .insert(regulations)
          .values({
            ...input,
            slug,
            organizationId: ctx.activeOrganizationId,
            sourceType: 'manual-upload',
          })
          .returning()

        return reg
      })
    }),

  /**
   * Update a regulation
   */
  update: orgProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).max(255).optional(),
        fullTitle: z.string().min(1).optional(),
        framework: z.string().min(1).max(100).optional(),
        version: z.string().optional(),
        jurisdiction: z.string().max(100).optional(),
        status: z.enum(['active', 'superseded', 'draft']).optional(),
        effectiveDate: z.date().optional(),
        sourceUrl: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      requireMutatePermission(ctx)

      return withAudit(ctx, 'update_regulation', 'regulation', input.id, async () => {
        const { id, ...updates } = input

        const before = await ctx.db.query.regulations.findFirst({
          where: scopedAnd(regulations, ctx, eq(regulations.id, id)),
        })

        const [after] = await ctx.db
          .update(regulations)
          .set({ ...updates, lastUpdated: new Date() })
          .where(scopedAnd(regulations, ctx, eq(regulations.id, id)))
          .returning()

        return { before, after, result: after }
      })
    }),

  /**
   * Delete a regulation
   */
  delete: orgProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    requireAdmin(ctx)

    return withDeleteAudit(
      ctx,
      'delete_regulation',
      'regulation',
      input.id,
      () =>
        ctx.db.query.regulations.findFirst({
          where: scopedAnd(regulations, ctx, eq(regulations.id, input.id)),
        }),
      () => ctx.db.delete(regulations).where(scopedAnd(regulations, ctx, eq(regulations.id, input.id)))
    )
  }),

  /**
   * Get all unique jurisdictions for filtering
   */
  getJurisdictions: orgProcedure.query(async ({ ctx }) => {
    const result = await ctx.db
      .selectDistinct({ jurisdiction: regulations.jurisdiction })
      .from(regulations)
      .where(
        and(eq(regulations.organizationId, ctx.activeOrganizationId), sql`${regulations.jurisdiction} IS NOT NULL`)
      )

    return result.map((r) => r.jurisdiction).filter(Boolean) as string[]
  }),

  /**
   * Get all unique frameworks for filtering
   */
  getFrameworks: orgProcedure.query(async ({ ctx }) => {
    const result = await ctx.db
      .selectDistinct({ framework: regulations.framework })
      .from(regulations)
      .where(eq(regulations.organizationId, ctx.activeOrganizationId))

    return result.map((r) => r.framework).filter(Boolean) as string[]
  }),
})
