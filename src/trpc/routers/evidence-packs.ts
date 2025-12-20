import { evidencePacks, obligations, regulations } from '@/db/schema'
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
          exportFormat: z.string().optional(),
          limit: z.number().min(1).max(100).default(50),
          offset: z.number().min(0).default(0),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const { regulationId, exportFormat, limit = 50, offset = 0 } = input ?? {}

      const conditions = [eq(evidencePacks.organizationId, ctx.activeOrganizationId)]

      if (regulationId) {
        conditions.push(eq(evidencePacks.regulationId, regulationId))
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
            columns: { id: true, name: true },
          },
          article: {
            columns: { id: true, articleNumber: true },
          },
        },
      })

      // Get total count
      const totalResult = await ctx.db
        .select({ count: sql<number>`count(*)` })
        .from(evidencePacks)
        .where(and(...conditions))

      return {
        items: packs,
        total: Number(totalResult[0]?.count ?? 0),
        limit,
        offset,
      }
    }),

  /**
   * Get a single evidence pack by ID
   */
  getById: orgProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
    const pack = await ctx.db.query.evidencePacks.findFirst({
      where: and(eq(evidencePacks.id, input.id), eq(evidencePacks.organizationId, ctx.activeOrganizationId)),
      with: {
        regulation: true,
        article: true,
      },
    })

    if (!pack) {
      throw new Error('Evidence pack not found')
    }

    // Get related obligations for this regulation
    const relatedObligations = await ctx.db.query.obligations.findMany({
      where: and(
        sql`${obligations.articleId} IN (
            SELECT id FROM articles WHERE regulation_id = ${pack.regulationId}
          )`,
        sql`(${obligations.organizationId} IS NULL OR ${obligations.organizationId} = ${ctx.activeOrganizationId})`
      ),
      with: {
        article: {
          columns: { id: true, articleNumber: true, sectionTitle: true },
        },
      },
    })

    return {
      ...pack,
      obligations: relatedObligations,
    }
  }),

  /**
   * Generate a new evidence pack for a regulation
   */
  generate: orgProcedure
    .input(
      z.object({
        regulationId: z.string(),
        articleId: z.string().optional(),
        exportFormat: z.enum(['pdf', 'confluence', 'jira', 'json']).default('json'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Get regulation details
      const regulation = await ctx.db.query.regulations.findFirst({
        where: eq(regulations.id, input.regulationId),
      })

      if (!regulation) {
        throw new Error('Regulation not found')
      }

      // Get all obligations for this regulation
      const orgObligations = await ctx.db.query.obligations.findMany({
        where: sql`${obligations.articleId} IN (
          SELECT id FROM articles WHERE regulation_id = ${input.regulationId}
        ) AND (${obligations.organizationId} IS NULL OR ${obligations.organizationId} = ${ctx.activeOrganizationId})`,
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
        compliant: orgObligations.filter((o) => o.status === 'compliant').length,
        pending: orgObligations.filter((o) => o.status === 'pending').length,
        nonCompliant: orgObligations.filter((o) => o.status === 'non_compliant').length,
      }

      // Get unique systems impacted
      const impactedSystems = new Set<string>()
      orgObligations.forEach((o) => {
        o.article?.systemImpacts?.forEach((si) => {
          impactedSystems.add(si.system.name)
        })
      })

      // Create the evidence pack
      const [pack] = await ctx.db
        .insert(evidencePacks)
        .values({
          organizationId: ctx.activeOrganizationId,
          regulationId: input.regulationId,
          articleId: input.articleId,
          exportFormat: input.exportFormat,
          generatedAt: new Date(),
        })
        .returning()

      return {
        ...pack,
        summary: {
          ...stats,
          complianceRate: stats.total > 0 ? Math.round((stats.compliant / stats.total) * 100) : 0,
          systemsImpacted: impactedSystems.size,
        },
      }
    }),

  /**
   * Delete an evidence pack
   */
  delete: orgProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
    await ctx.db
      .delete(evidencePacks)
      .where(and(eq(evidencePacks.id, input.id), eq(evidencePacks.organizationId, ctx.activeOrganizationId)))

    return { success: true }
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
      },
    })

    const byFormat: Record<string, number> = {}
    const regulationsWithPacks = new Set<string>()

    packs.forEach((p) => {
      const format = p.exportFormat ?? 'unknown'
      byFormat[format] = (byFormat[format] ?? 0) + 1
      regulationsWithPacks.add(p.regulationId)
    })

    return {
      total: packs.length,
      byFormat,
      regulationsWithPacks: regulationsWithPacks.size,
    }
  }),
})
