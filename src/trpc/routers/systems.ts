import { articleSystemImpacts, obligationSystemMappings, systems } from '@/db/schema'
import { recordAudit, withAudit, withCreateAudit, withDeleteAudit } from '@/lib/audit'
import { requireMutatePermission, scopedAnd } from '@/lib/tenancy'
import { and, desc, eq, sql } from 'drizzle-orm'
import { z } from 'zod'
import { orgProcedure, router } from '../init'

export const systemsRouter = router({
  /**
   * List all systems for the organization
   */
  list: orgProcedure
    .input(
      z
        .object({
          criticality: z.enum(['critical', 'high', 'medium', 'low', 'info']).optional(),
          category: z.string().optional(),
          search: z.string().optional(),
          limit: z.number().min(1).max(100).default(50),
          offset: z.number().min(0).default(0),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const { criticality, category, search, limit = 50, offset = 0 } = input ?? {}

      // Strict org scoping
      const conditions = [eq(systems.organizationId, ctx.activeOrganizationId)]

      if (criticality) {
        conditions.push(eq(systems.criticality, criticality))
      }

      if (category) {
        conditions.push(eq(systems.category, category))
      }

      if (search) {
        conditions.push(sql`(${systems.name} ILIKE ${`%${search}%`} OR ${systems.description} ILIKE ${`%${search}%`})`)
      }

      const systemsList = await ctx.db.query.systems.findMany({
        where: and(...conditions),
        limit,
        offset,
        orderBy: desc(systems.criticality),
        with: {
          articleImpacts: {
            where: eq(articleSystemImpacts.organizationId, ctx.activeOrganizationId),
            with: {
              article: {
                with: {
                  regulation: {
                    columns: { id: true, name: true },
                  },
                },
              },
            },
          },
          obligationMappings: {
            where: eq(obligationSystemMappings.organizationId, ctx.activeOrganizationId),
            with: {
              obligation: {
                columns: { id: true, title: true, status: true },
              },
            },
          },
          owner: {
            columns: { id: true, name: true, email: true },
          },
        },
      })

      // Calculate impact stats for each system
      const systemsWithStats = systemsList.map((system) => {
        const impactCounts = {
          critical: 0,
          high: 0,
          medium: 0,
          low: 0,
        }

        const regulations = new Set<string>()

        system.articleImpacts.forEach((impact) => {
          impactCounts[impact.impactLevel]++
          if (impact.article?.regulation) {
            regulations.add(impact.article.regulation.name)
          }
        })

        return {
          ...system,
          impactCounts,
          regulationsAffected: Array.from(regulations),
          totalImpacts: system.articleImpacts.length,
          obligationCount: system.obligationMappings.length,
        }
      })

      // Get total count
      const totalResult = await ctx.db
        .select({ count: sql<number>`count(*)` })
        .from(systems)
        .where(and(...conditions))

      return {
        items: systemsWithStats,
        total: Number(totalResult[0]?.count ?? 0),
        limit,
        offset,
      }
    }),

  /**
   * Get a single system by ID with all related data
   */
  getById: orgProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    const system = await ctx.db.query.systems.findFirst({
      where: scopedAnd(systems, ctx, eq(systems.id, input.id)),
      with: {
        owner: {
          columns: { id: true, name: true, email: true },
        },
        articleImpacts: {
          where: eq(articleSystemImpacts.organizationId, ctx.activeOrganizationId),
          with: {
            article: {
              with: {
                regulation: true,
                obligations: {
                  where: eq(systems.organizationId, ctx.activeOrganizationId),
                },
              },
            },
          },
        },
        obligationMappings: {
          where: eq(obligationSystemMappings.organizationId, ctx.activeOrganizationId),
          with: {
            obligation: true,
          },
        },
      },
    })

    if (!system) {
      throw new Error('System not found')
    }

    // Group impacts by regulation
    const regulationImpacts = new Map<
      string,
      {
        regulation: { id: string; name: string }
        articles: Array<{ id: string; impactLevel: string }>
        impactLevel: string
      }
    >()

    system.articleImpacts.forEach((impact) => {
      const reg = impact.article?.regulation
      if (!reg) return

      if (!regulationImpacts.has(reg.id)) {
        regulationImpacts.set(reg.id, {
          regulation: reg,
          articles: [],
          impactLevel: impact.impactLevel,
        })
      }

      const existing = regulationImpacts.get(reg.id)!
      existing.articles.push({
        ...impact.article,
        impactLevel: impact.impactLevel,
      })

      // Upgrade impact level if higher
      const levels = ['low', 'medium', 'high', 'critical']
      if (levels.indexOf(impact.impactLevel) > levels.indexOf(existing.impactLevel)) {
        existing.impactLevel = impact.impactLevel
      }
    })

    return {
      ...system,
      regulationImpacts: Array.from(regulationImpacts.values()),
    }
  }),

  /**
   * Create a new system
   */
  create: orgProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        description: z.string().optional(),
        category: z.string().optional(),
        criticality: z.enum(['critical', 'high', 'medium', 'low', 'info']).optional(),
        dataClassification: z.string().optional(),
        ownerTeam: z.string().optional(),
        ownerUserId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      requireMutatePermission(ctx)

      return withCreateAudit(ctx, 'create_system', 'system', async () => {
        // Generate ID from name
        const id = input.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')

        const slug = id

        const [system] = await ctx.db
          .insert(systems)
          .values({
            ...input,
            id,
            slug,
            organizationId: ctx.activeOrganizationId,
          })
          .returning()

        return system
      })
    }),

  /**
   * Update a system
   */
  update: orgProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).max(255).optional(),
        description: z.string().optional(),
        category: z.string().optional(),
        criticality: z.enum(['critical', 'high', 'medium', 'low', 'info']).optional(),
        dataClassification: z.string().optional(),
        ownerTeam: z.string().optional(),
        ownerUserId: z.string().nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      requireMutatePermission(ctx)

      return withAudit(ctx, 'update_system', 'system', input.id, async () => {
        const { id, ...updates } = input

        const before = await ctx.db.query.systems.findFirst({
          where: scopedAnd(systems, ctx, eq(systems.id, id)),
        })

        const [after] = await ctx.db
          .update(systems)
          .set(updates)
          .where(scopedAnd(systems, ctx, eq(systems.id, id)))
          .returning()

        return { before, after, result: after }
      })
    }),

  /**
   * Delete a system
   */
  delete: orgProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    requireMutatePermission(ctx)

    return withDeleteAudit(
      ctx,
      'delete_system',
      'system',
      input.id,
      () =>
        ctx.db.query.systems.findFirst({
          where: scopedAnd(systems, ctx, eq(systems.id, input.id)),
        }),
      async () => {
        // First delete all impacts and mappings
        await ctx.db
          .delete(articleSystemImpacts)
          .where(
            and(
              eq(articleSystemImpacts.systemId, input.id),
              eq(articleSystemImpacts.organizationId, ctx.activeOrganizationId)
            )
          )
        await ctx.db
          .delete(obligationSystemMappings)
          .where(
            and(
              eq(obligationSystemMappings.systemId, input.id),
              eq(obligationSystemMappings.organizationId, ctx.activeOrganizationId)
            )
          )
        // Then delete system
        await ctx.db.delete(systems).where(scopedAnd(systems, ctx, eq(systems.id, input.id)))
      }
    )
  }),

  /**
   * Add an article impact to a system
   */
  addImpact: orgProcedure
    .input(
      z.object({
        systemId: z.string(),
        articleId: z.string(),
        impactLevel: z.enum(['critical', 'high', 'medium', 'low']),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      requireMutatePermission(ctx)

      const [impact] = await ctx.db
        .insert(articleSystemImpacts)
        .values({
          ...input,
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
   * Remove an article impact from a system
   */
  removeImpact: orgProcedure
    .input(
      z.object({
        systemId: z.string(),
        articleId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      requireMutatePermission(ctx)

      const before = await ctx.db.query.articleSystemImpacts.findFirst({
        where: and(
          eq(articleSystemImpacts.systemId, input.systemId),
          eq(articleSystemImpacts.articleId, input.articleId),
          eq(articleSystemImpacts.organizationId, ctx.activeOrganizationId)
        ),
      })

      await ctx.db
        .delete(articleSystemImpacts)
        .where(
          and(
            eq(articleSystemImpacts.systemId, input.systemId),
            eq(articleSystemImpacts.articleId, input.articleId),
            eq(articleSystemImpacts.organizationId, ctx.activeOrganizationId)
          )
        )

      if (before) {
        await recordAudit({
          ctx,
          action: 'remove_system_impact',
          entityType: 'article_system_impact',
          entityId: before.id,
          before,
        })
      }

      return { success: true }
    }),

  /**
   * Get systems impacted by a specific article
   */
  getByArticle: orgProcedure.input(z.object({ articleId: z.string() })).query(async ({ ctx, input }) => {
    const impacts = await ctx.db.query.articleSystemImpacts.findMany({
      where: and(
        eq(articleSystemImpacts.articleId, input.articleId),
        eq(articleSystemImpacts.organizationId, ctx.activeOrganizationId)
      ),
      with: {
        system: true,
      },
    })

    return impacts.map((i) => ({
      ...i.system,
      impactLevel: i.impactLevel,
      notes: i.notes,
    }))
  }),

  /**
   * Get articles impacting a specific system
   */
  getArticlesForSystem: orgProcedure.input(z.object({ systemId: z.string() })).query(async ({ ctx, input }) => {
    const impacts = await ctx.db.query.articleSystemImpacts.findMany({
      where: and(
        eq(articleSystemImpacts.systemId, input.systemId),
        eq(articleSystemImpacts.organizationId, ctx.activeOrganizationId)
      ),
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

    return impacts.map((i) => ({
      ...i.article,
      impactLevel: i.impactLevel,
      notes: i.notes,
    }))
  }),

  /**
   * Get unique categories
   */
  getCategories: orgProcedure.query(async ({ ctx }) => {
    const result = await ctx.db
      .selectDistinct({ category: systems.category })
      .from(systems)
      .where(and(eq(systems.organizationId, ctx.activeOrganizationId), sql`${systems.category} IS NOT NULL`))

    return result.map((r) => r.category).filter(Boolean) as string[]
  }),
})
