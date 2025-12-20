import { regulations, obligations } from '@/db/schema'
import { z } from 'zod'
import { orgProcedure, router } from '../init'
import { eq, and, desc, asc, sql } from 'drizzle-orm'

export const regulationsRouter = router({
  /**
   * List all regulations with pagination and filters
   */
  list: orgProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
        jurisdiction: z.string().optional(),
        search: z.string().optional(),
        sortBy: z.enum(['name', 'effectiveDate', 'lastUpdated']).default('name'),
        sortOrder: z.enum(['asc', 'desc']).default('asc'),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const { limit = 20, offset = 0, jurisdiction, search, sortBy = 'name', sortOrder = 'asc' } = input ?? {}

      // Build where conditions
      const conditions = []
      
      // Filter by organization (regulations can be global or org-specific)
      conditions.push(
        sql`(${regulations.organizationId} IS NULL OR ${regulations.organizationId} = ${ctx.activeOrganizationId})`
      )

      if (jurisdiction) {
        conditions.push(eq(regulations.jurisdiction, jurisdiction))
      }

      if (search) {
        conditions.push(
          sql`(${regulations.name} ILIKE ${`%${search}%`} OR ${regulations.fullTitle} ILIKE ${`%${search}%`})`
        )
      }

      // Get regulations with article counts
      const regs = await ctx.db.query.regulations.findMany({
        where: conditions.length > 0 ? and(...conditions) : undefined,
        limit,
        offset,
        orderBy: sortOrder === 'asc' 
          ? asc(regulations[sortBy as keyof typeof regulations.$inferSelect])
          : desc(regulations[sortBy as keyof typeof regulations.$inferSelect]),
        with: {
          articles: {
            columns: { id: true },
          },
        },
      })

      // Get obligation compliance stats per regulation
      const regulationsWithStats = await Promise.all(
        regs.map(async (reg) => {
          const articleIds = reg.articles.map(a => a.id)
          
          if (articleIds.length === 0) {
            return {
              ...reg,
              articleCount: 0,
              compliancePercent: 100,
              obligationStats: { compliant: 0, pending: 0, nonCompliant: 0, total: 0 },
            }
          }

          const obls = await ctx.db.query.obligations.findMany({
            where: (obl, { and: andOp, inArray }) => andOp(
              inArray(obl.articleId, articleIds),
              sql`(${obl.organizationId} IS NULL OR ${obl.organizationId} = ${ctx.activeOrganizationId})`
            ),
          })

          const stats = {
            compliant: obls.filter(o => o.status === 'compliant').length,
            pending: obls.filter(o => o.status === 'pending').length,
            nonCompliant: obls.filter(o => o.status === 'non_compliant').length,
            total: obls.length,
          }

          const compliancePercent = stats.total > 0 
            ? Math.round((stats.compliant / stats.total) * 100) 
            : 100

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
        .where(conditions.length > 0 ? and(...conditions) : undefined)

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
  getById: orgProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const reg = await ctx.db.query.regulations.findFirst({
        where: eq(regulations.id, input.id),
        with: {
          articles: {
            with: {
              obligations: {
                where: sql`(${obligations.organizationId} IS NULL OR ${obligations.organizationId} = ${ctx.activeOrganizationId})`,
              },
              systemImpacts: {
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
            where: eq(sql`${ctx.activeOrganizationId}`, sql`organization_id`),
            orderBy: (ep, { desc }) => desc(ep.generatedAt),
            limit: 5,
          },
        },
      })

      if (!reg) {
        throw new Error('Regulation not found')
      }

      // Calculate compliance stats
      const allObligations = reg.articles.flatMap(a => a.obligations)
      const stats = {
        compliant: allObligations.filter(o => o.status === 'compliant').length,
        pending: allObligations.filter(o => o.status === 'pending').length,
        nonCompliant: allObligations.filter(o => o.status === 'non_compliant').length,
        total: allObligations.length,
      }

      // Get unique impacted systems
      const impactedSystems = new Map()
      reg.articles.forEach(article => {
        article.systemImpacts.forEach(impact => {
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
        compliancePercent: stats.total > 0 ? Math.round((stats.compliant / stats.total) * 100) : 100,
        obligationStats: stats,
        impactedSystems: Array.from(impactedSystems.values()),
      }
    }),

  /**
   * Create a new regulation (admin only)
   */
  create: orgProcedure
    .input(
      z.object({
        id: z.string().min(1).max(50),
        name: z.string().min(1).max(255),
        fullTitle: z.string().min(1),
        jurisdiction: z.string().max(100).optional(),
        effectiveDate: z.date().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user is admin/owner
      if (ctx.member.role !== 'owner' && ctx.member.role !== 'admin') {
        throw new Error('Only admins can create regulations')
      }

      const [reg] = await ctx.db
        .insert(regulations)
        .values({
          ...input,
          organizationId: ctx.activeOrganizationId,
        })
        .returning()

      return reg
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
        jurisdiction: z.string().max(100).optional(),
        effectiveDate: z.date().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.member.role !== 'owner' && ctx.member.role !== 'admin') {
        throw new Error('Only admins can update regulations')
      }

      const { id, ...updates } = input

      const [reg] = await ctx.db
        .update(regulations)
        .set({ ...updates, lastUpdated: new Date() })
        .where(and(
          eq(regulations.id, id),
          eq(regulations.organizationId, ctx.activeOrganizationId)
        ))
        .returning()

      return reg
    }),

  /**
   * Delete a regulation
   */
  delete: orgProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.member.role !== 'owner') {
        throw new Error('Only owners can delete regulations')
      }

      await ctx.db
        .delete(regulations)
        .where(and(
          eq(regulations.id, input.id),
          eq(regulations.organizationId, ctx.activeOrganizationId)
        ))

      return { success: true }
    }),

  /**
   * Get all unique jurisdictions for filtering
   */
  getJurisdictions: orgProcedure.query(async ({ ctx }) => {
    const result = await ctx.db
      .selectDistinct({ jurisdiction: regulations.jurisdiction })
      .from(regulations)
      .where(sql`${regulations.jurisdiction} IS NOT NULL`)

    return result.map(r => r.jurisdiction).filter(Boolean) as string[]
  }),
})
