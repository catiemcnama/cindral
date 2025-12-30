import { articles, articleSystemImpacts, regulations, systems, userPreferences } from '@/db/schema'
import { recordAudit } from '@/lib/audit'
import { NotFoundError } from '@/lib/errors'
import { requireMutatePermission } from '@/lib/tenancy'
import { and, eq, isNull, sql } from 'drizzle-orm'
import { z } from 'zod'
import { orgProcedure, router } from '../init'

export const systemMapRouter = router({
  /**
   * Get all data needed for the system map visualization
   */
  getData: orgProcedure.query(async ({ ctx }) => {
    const orgId = ctx.activeOrganizationId

    // Get regulations with article counts
    const regsWithCounts = await ctx.db
      .select({
        id: regulations.id,
        name: regulations.name,
        framework: regulations.framework,
        status: regulations.status,
        articleCount: sql<number>`count(${articles.id})::int`,
      })
      .from(regulations)
      .leftJoin(articles, and(eq(articles.regulationId, regulations.id), isNull(articles.deletedAt)))
      .where(and(eq(regulations.organizationId, orgId), isNull(regulations.deletedAt)))
      .groupBy(regulations.id)

    // Get articles with impact counts
    const articlesWithCounts = await ctx.db
      .select({
        id: articles.id,
        articleNumber: articles.articleNumber,
        title: articles.title,
        regulationId: articles.regulationId,
        impactedSystemsCount: sql<number>`count(${articleSystemImpacts.id})::int`,
      })
      .from(articles)
      .leftJoin(
        articleSystemImpacts,
        and(eq(articleSystemImpacts.articleId, articles.id), eq(articleSystemImpacts.organizationId, orgId))
      )
      .where(and(eq(articles.organizationId, orgId), isNull(articles.deletedAt)))
      .groupBy(articles.id)

    // Build regulation name lookup
    const regNameMap = new Map(regsWithCounts.map((r) => [r.id, r.name]))

    // Get systems
    const systemsList = await ctx.db.query.systems.findMany({
      where: and(eq(systems.organizationId, orgId), isNull(systems.deletedAt)),
      columns: {
        id: true,
        name: true,
        category: true,
        criticality: true,
      },
    })

    // Get all impacts
    const impacts = await ctx.db.query.articleSystemImpacts.findMany({
      where: eq(articleSystemImpacts.organizationId, orgId),
      columns: {
        articleId: true,
        systemId: true,
        impactLevel: true,
        notes: true,
      },
    })

    return {
      regulations: regsWithCounts,
      articles: articlesWithCounts.map((a) => ({
        ...a,
        regulationName: regNameMap.get(a.regulationId) ?? 'Unknown',
      })),
      systems: systemsList,
      impacts,
    }
  }),

  /**
   * Get saved node positions for the map
   */
  getPositions: orgProcedure.query(async ({ ctx }) => {
    const prefs = await ctx.db.query.userPreferences.findFirst({
      where: and(
        eq(userPreferences.userId, ctx.session.user.id),
        eq(userPreferences.organizationId, ctx.activeOrganizationId)
      ),
    })

    return {
      positions: (prefs?.systemMapPositions ?? []) as Array<{ nodeId: string; x: number; y: number }>,
    }
  }),

  /**
   * Save node positions
   */
  savePositions: orgProcedure
    .input(
      z.object({
        positions: z.array(
          z.object({
            nodeId: z.string(),
            x: z.number(),
            y: z.number(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if preferences exist for this user+org
      const existing = await ctx.db.query.userPreferences.findFirst({
        where: and(
          eq(userPreferences.userId, ctx.session.user.id),
          eq(userPreferences.organizationId, ctx.activeOrganizationId)
        ),
      })

      if (existing) {
        // Update existing
        await ctx.db
          .update(userPreferences)
          .set({
            systemMapPositions: input.positions,
            updatedAt: new Date(),
          })
          .where(eq(userPreferences.id, existing.id))
      } else {
        // Create new
        await ctx.db.insert(userPreferences).values({
          userId: ctx.session.user.id,
          organizationId: ctx.activeOrganizationId,
          systemMapPositions: input.positions,
        })
      }

      return { success: true, savedCount: input.positions.length }
    }),

  /**
   * Create a new impact connection between article and system
   */
  createImpact: orgProcedure
    .input(
      z.object({
        articleId: z.string(),
        systemId: z.string(),
        impactLevel: z.enum(['critical', 'high', 'medium', 'low']),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      requireMutatePermission(ctx)

      // Verify article exists
      const article = await ctx.db.query.articles.findFirst({
        where: and(eq(articles.id, input.articleId), eq(articles.organizationId, ctx.activeOrganizationId)),
      })
      if (!article) {
        throw new NotFoundError('Article', input.articleId)
      }

      // Verify system exists
      const system = await ctx.db.query.systems.findFirst({
        where: and(eq(systems.id, input.systemId), eq(systems.organizationId, ctx.activeOrganizationId)),
      })
      if (!system) {
        throw new NotFoundError('System', input.systemId)
      }

      // Check if impact already exists
      const existing = await ctx.db.query.articleSystemImpacts.findFirst({
        where: and(
          eq(articleSystemImpacts.articleId, input.articleId),
          eq(articleSystemImpacts.systemId, input.systemId),
          eq(articleSystemImpacts.organizationId, ctx.activeOrganizationId)
        ),
      })

      if (existing) {
        // Update existing
        const [updated] = await ctx.db
          .update(articleSystemImpacts)
          .set({
            impactLevel: input.impactLevel,
            notes: input.notes,
          })
          .where(eq(articleSystemImpacts.id, existing.id))
          .returning()

        await recordAudit({
          ctx,
          action: 'add_system_impact',
          entityType: 'article_system_impact',
          entityId: existing.id,
          before: existing,
          after: updated,
        })

        return updated
      }

      // Create new
      const [impact] = await ctx.db
        .insert(articleSystemImpacts)
        .values({
          articleId: input.articleId,
          systemId: input.systemId,
          impactLevel: input.impactLevel,
          notes: input.notes,
          organizationId: ctx.activeOrganizationId,
        })
        .returning()

      await recordAudit({
        ctx,
        action: 'add_system_impact',
        entityType: 'article_system_impact',
        entityId: impact.id,
        after: impact,
      })

      return impact
    }),

  /**
   * Delete an impact connection
   */
  deleteImpact: orgProcedure
    .input(
      z.object({
        articleId: z.string(),
        systemId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      requireMutatePermission(ctx)

      const existing = await ctx.db.query.articleSystemImpacts.findFirst({
        where: and(
          eq(articleSystemImpacts.articleId, input.articleId),
          eq(articleSystemImpacts.systemId, input.systemId),
          eq(articleSystemImpacts.organizationId, ctx.activeOrganizationId)
        ),
      })

      if (!existing) {
        throw new NotFoundError('Impact', `${input.articleId}-${input.systemId}`)
      }

      await ctx.db.delete(articleSystemImpacts).where(eq(articleSystemImpacts.id, existing.id))

      await recordAudit({
        ctx,
        action: 'remove_system_impact',
        entityType: 'article_system_impact',
        entityId: existing.id,
        before: existing,
      })

      return { success: true }
    }),

  /**
   * Update impact level
   */
  updateImpact: orgProcedure
    .input(
      z.object({
        articleId: z.string(),
        systemId: z.string(),
        impactLevel: z.enum(['critical', 'high', 'medium', 'low']),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      requireMutatePermission(ctx)

      const existing = await ctx.db.query.articleSystemImpacts.findFirst({
        where: and(
          eq(articleSystemImpacts.articleId, input.articleId),
          eq(articleSystemImpacts.systemId, input.systemId),
          eq(articleSystemImpacts.organizationId, ctx.activeOrganizationId)
        ),
      })

      if (!existing) {
        throw new NotFoundError('Impact', `${input.articleId}-${input.systemId}`)
      }

      const [updated] = await ctx.db
        .update(articleSystemImpacts)
        .set({
          impactLevel: input.impactLevel,
          notes: input.notes ?? existing.notes,
        })
        .where(eq(articleSystemImpacts.id, existing.id))
        .returning()

      await recordAudit({
        ctx,
        action: 'add_system_impact',
        entityType: 'article_system_impact',
        entityId: existing.id,
        before: existing,
        after: updated,
      })

      return updated
    }),
})
