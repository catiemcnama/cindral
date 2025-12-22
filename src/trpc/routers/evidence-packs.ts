import { auditLog, evidencePacks, obligations, regulations } from '@/db/schema'
import { withAudit, withCreateAudit, withDeleteAudit } from '@/lib/audit'
import { NotFoundError } from '@/lib/errors'
import { requireMutatePermission, scopedAnd } from '@/lib/tenancy'
import { and, desc, eq, sql } from 'drizzle-orm'
import { z } from 'zod'
import { orgProcedure, router } from '../init'

export const evidencePacksRouter = router({
  /**
   * List all evidence packs for the organization
   */
  list: orgProcedure
    .input(
      z
        .object({
          regulationId: z.string().optional(),
          status: z.enum(['draft', 'generating', 'ready', 'failed', 'archived']).optional(),
          intendedAudience: z.enum(['internal', 'auditor', 'regulator']).optional(),
          exportFormat: z.string().optional(),
          limit: z.number().min(1).max(100).default(50),
          offset: z.number().min(0).default(0),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const { regulationId, status, intendedAudience, exportFormat, limit = 50, offset = 0 } = input ?? {}

      // Strict org scoping
      const conditions = [eq(evidencePacks.organizationId, ctx.activeOrganizationId)]

      if (regulationId) {
        conditions.push(eq(evidencePacks.regulationId, regulationId))
      }

      if (status) {
        conditions.push(eq(evidencePacks.status, status))
      }

      if (intendedAudience) {
        conditions.push(eq(evidencePacks.intendedAudience, intendedAudience))
      }

      if (exportFormat) {
        conditions.push(eq(evidencePacks.exportFormat, exportFormat))
      }

      const packs = await ctx.db.query.evidencePacks.findMany({
        where: and(...conditions),
        limit,
        offset,
        orderBy: desc(evidencePacks.generatedAt),
        with: {
          regulation: {
            columns: { id: true, name: true, framework: true },
          },
          system: {
            columns: { id: true, name: true },
          },
          article: {
            columns: { id: true, articleNumber: true },
          },
          requestedBy: {
            columns: { id: true, name: true, email: true },
          },
        },
      })

      // Get total count
      const totalResult = await ctx.db
        .select({ count: sql<number>`count(*)` })
        .from(evidencePacks)
        .where(and(...conditions))

      // Get counts by status
      const statusCounts = await Promise.all([
        ctx.db
          .select({ count: sql<number>`count(*)` })
          .from(evidencePacks)
          .where(and(eq(evidencePacks.organizationId, ctx.activeOrganizationId), eq(evidencePacks.status, 'draft'))),
        ctx.db
          .select({ count: sql<number>`count(*)` })
          .from(evidencePacks)
          .where(and(eq(evidencePacks.organizationId, ctx.activeOrganizationId), eq(evidencePacks.status, 'ready'))),
        ctx.db
          .select({ count: sql<number>`count(*)` })
          .from(evidencePacks)
          .where(and(eq(evidencePacks.organizationId, ctx.activeOrganizationId), eq(evidencePacks.status, 'failed'))),
      ])

      return {
        items: packs,
        total: Number(totalResult[0]?.count ?? 0),
        stats: {
          draft: Number(statusCounts[0][0]?.count ?? 0),
          ready: Number(statusCounts[1][0]?.count ?? 0),
          failed: Number(statusCounts[2][0]?.count ?? 0),
        },
        limit,
        offset,
      }
    }),

  /**
   * Get a single evidence pack by ID
   */
  getById: orgProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
    const pack = await ctx.db.query.evidencePacks.findFirst({
      where: scopedAnd(evidencePacks, ctx, eq(evidencePacks.id, input.id)),
      with: {
        regulation: true,
        system: true,
        article: true,
        requestedBy: {
          columns: { id: true, name: true, email: true },
        },
      },
    })

    if (!pack) {
      throw new NotFoundError('Evidence pack', input.id)
    }

    // Get related obligations for this regulation
    let relatedObligations: Awaited<ReturnType<typeof ctx.db.query.obligations.findMany>> = []
    if (pack.regulationId) {
      relatedObligations = await ctx.db.query.obligations.findMany({
        where: scopedAnd(obligations, ctx, eq(obligations.regulationId, pack.regulationId)),
        with: {
          article: {
            columns: { id: true, articleNumber: true, sectionTitle: true },
          },
        },
      })
    }

    return {
      ...pack,
      obligations: relatedObligations,
    }
  }),

  /**
   * Create a new evidence pack (draft)
   */
  create: orgProcedure
    .input(
      z.object({
        title: z.string().min(1).max(255),
        description: z.string().optional(),
        regulationId: z.string(),
        systemId: z.string().optional(),
        articleId: z.string().optional(),
        framework: z.string().optional(),
        jurisdiction: z.string().optional(),
        intendedAudience: z.enum(['internal', 'auditor', 'regulator']).default('internal'),
        exportFormat: z.enum(['pdf', 'confluence', 'jira', 'json']).default('json'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      requireMutatePermission(ctx)

      return withCreateAudit(ctx, 'create_evidence_pack', 'evidence_pack', async () => {
        const [pack] = await ctx.db
          .insert(evidencePacks)
          .values({
            ...input,
            organizationId: ctx.activeOrganizationId,
            requestedByUserId: ctx.user.id,
            status: 'draft',
          })
          .returning()

        return pack
      })
    }),

  /**
   * Generate an evidence pack for a regulation
   */
  generate: orgProcedure
    .input(
      z.object({
        title: z.string().min(1).max(255),
        description: z.string().optional(),
        regulationId: z.string(),
        systemId: z.string().optional(),
        articleId: z.string().optional(),
        intendedAudience: z.enum(['internal', 'auditor', 'regulator']).default('internal'),
        exportFormat: z.enum(['pdf', 'confluence', 'jira', 'json']).default('json'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      requireMutatePermission(ctx)

      // Get regulation details
      const regulation = await ctx.db.query.regulations.findFirst({
        where: scopedAnd(regulations, ctx, eq(regulations.id, input.regulationId)),
      })

      if (!regulation) {
        throw new NotFoundError('Regulation', input.regulationId)
      }

      // Get all obligations for this regulation
      const orgObligations = await ctx.db.query.obligations.findMany({
        where: scopedAnd(obligations, ctx, eq(obligations.regulationId, input.regulationId)),
        with: {
          article: {
            with: {
              systemImpacts: {
                with: {
                  system: true,
                },
              },
            },
          },
        },
      })

      // Calculate compliance stats
      const stats = {
        total: orgObligations.length,
        notStarted: orgObligations.filter((o) => o.status === 'not_started').length,
        inProgress: orgObligations.filter((o) => o.status === 'in_progress').length,
        implemented: orgObligations.filter((o) => o.status === 'implemented').length,
        underReview: orgObligations.filter((o) => o.status === 'under_review').length,
        verified: orgObligations.filter((o) => o.status === 'verified').length,
      }

      // Get unique systems impacted
      const impactedSystems = new Set<string>()
      orgObligations.forEach((o) => {
        o.article?.systemImpacts?.forEach((si) => {
          impactedSystems.add(si.system.name)
        })
      })

      // Create the evidence pack with generating status
      const [pack] = await ctx.db
        .insert(evidencePacks)
        .values({
          ...input,
          organizationId: ctx.activeOrganizationId,
          requestedByUserId: ctx.user.id,
          status: 'generating',
          framework: regulation.framework,
          jurisdiction: regulation.jurisdiction,
          generatedAt: new Date(),
        })
        .returning()

      // Record audit
      await ctx.db.insert(auditLog).values({
        organizationId: ctx.activeOrganizationId,
        actorUserId: ctx.user.id,
        action: 'generate_evidence_pack',
        entityType: 'evidence_pack',
        entityId: String(pack.id),
        diff: { before: null, after: pack },
      })

      // TODO: In production, this would trigger a background job
      // For now, immediately mark as ready
      const [updatedPack] = await ctx.db
        .update(evidencePacks)
        .set({
          status: 'ready',
          lastGeneratedAt: new Date(),
        })
        .where(eq(evidencePacks.id, pack.id))
        .returning()

      const compliant = stats.verified + stats.implemented
      return {
        ...updatedPack,
        summary: {
          ...stats,
          complianceRate: stats.total > 0 ? Math.round((compliant / stats.total) * 100) : 0,
          systemsImpacted: impactedSystems.size,
        },
      }
    }),

  /**
   * Update evidence pack status
   */
  updateStatus: orgProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.enum(['draft', 'generating', 'ready', 'failed', 'archived']),
      })
    )
    .mutation(async ({ ctx, input }) => {
      requireMutatePermission(ctx)

      return withAudit(ctx, 'update_obligation', 'evidence_pack', input.id, async () => {
        const before = await ctx.db.query.evidencePacks.findFirst({
          where: scopedAnd(evidencePacks, ctx, eq(evidencePacks.id, input.id)),
        })

        const [after] = await ctx.db
          .update(evidencePacks)
          .set({ status: input.status })
          .where(scopedAnd(evidencePacks, ctx, eq(evidencePacks.id, input.id)))
          .returning()

        return { before, after, result: after }
      })
    }),

  /**
   * Delete an evidence pack
   */
  delete: orgProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
    requireMutatePermission(ctx)

    return withDeleteAudit(
      ctx,
      'delete_evidence_pack',
      'evidence_pack',
      input.id,
      () =>
        ctx.db.query.evidencePacks.findFirst({
          where: scopedAnd(evidencePacks, ctx, eq(evidencePacks.id, input.id)),
        }),
      () => ctx.db.delete(evidencePacks).where(scopedAnd(evidencePacks, ctx, eq(evidencePacks.id, input.id)))
    )
  }),

  /**
   * Get stats for evidence packs
   */
  getStats: orgProcedure.query(async ({ ctx }) => {
    const packs = await ctx.db.query.evidencePacks.findMany({
      where: eq(evidencePacks.organizationId, ctx.activeOrganizationId),
      columns: {
        exportFormat: true,
        regulationId: true,
        status: true,
        intendedAudience: true,
      },
    })

    const byFormat: Record<string, number> = {}
    const byAudience: Record<string, number> = {}
    const byStatus: Record<string, number> = {}
    const regulationsWithPacks = new Set<string>()

    packs.forEach((p) => {
      const format = p.exportFormat ?? 'unknown'
      byFormat[format] = (byFormat[format] ?? 0) + 1

      const audience = p.intendedAudience ?? 'unknown'
      byAudience[audience] = (byAudience[audience] ?? 0) + 1

      const status = p.status ?? 'unknown'
      byStatus[status] = (byStatus[status] ?? 0) + 1

      if (p.regulationId) {
        regulationsWithPacks.add(p.regulationId)
      }
    })

    return {
      total: packs.length,
      byFormat,
      byAudience,
      byStatus,
      regulationsWithPacks: regulationsWithPacks.size,
    }
  }),
})
