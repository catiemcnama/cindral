import { articleSystemImpacts, systems } from '@/db/schema'
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
          criticality: z.enum(['critical', 'high', 'medium', 'low']).optional(),
          search: z.string().optional(),
          limit: z.number().min(1).max(100).default(50),
          offset: z.number().min(0).default(0),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const { criticality, search, limit = 50, offset = 0 } = input ?? {}

      const conditions = [
        sql`(${systems.organizationId} IS NULL OR ${systems.organizationId} = ${ctx.activeOrganizationId})`,
      ]

      if (criticality) {
        conditions.push(eq(systems.criticality, criticality))
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
      where: and(
        eq(systems.id, input.id),
        sql`(${systems.organizationId} IS NULL OR ${systems.organizationId} = ${ctx.activeOrganizationId})`
      ),
      with: {
        articleImpacts: {
          with: {
            article: {
              with: {
                regulation: true,
                obligations: {
                  where: sql`(organization_id IS NULL OR organization_id = ${ctx.activeOrganizationId})`,
                },
              },
            },
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
        criticality: z.enum(['critical', 'high', 'medium', 'low']).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Generate ID from name
      const id = input.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')

      const [system] = await ctx.db
        .insert(systems)
        .values({
          ...input,
          id,
          organizationId: ctx.activeOrganizationId,
        })
        .returning()

      return system
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
        criticality: z.enum(['critical', 'high', 'medium', 'low']).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updates } = input

      const [system] = await ctx.db
        .update(systems)
        .set(updates)
        .where(and(eq(systems.id, id), eq(systems.organizationId, ctx.activeOrganizationId)))
        .returning()

      return system
    }),

  /**
   * Delete a system
   */
  delete: orgProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    // First delete all impacts
    await ctx.db.delete(articleSystemImpacts).where(eq(articleSystemImpacts.systemId, input.id))

    // Then delete system
    await ctx.db
      .delete(systems)
      .where(and(eq(systems.id, input.id), eq(systems.organizationId, ctx.activeOrganizationId)))

    return { success: true }
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
      const [impact] = await ctx.db.insert(articleSystemImpacts).values(input).returning()

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
      await ctx.db
        .delete(articleSystemImpacts)
        .where(
          and(eq(articleSystemImpacts.systemId, input.systemId), eq(articleSystemImpacts.articleId, input.articleId))
        )

      return { success: true }
    }),

  /**
   * Get systems impacted by a specific article
   */
  getByArticle: orgProcedure.input(z.object({ articleId: z.string() })).query(async ({ ctx, input }) => {
    const impacts = await ctx.db.query.articleSystemImpacts.findMany({
      where: eq(articleSystemImpacts.articleId, input.articleId),
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
      where: eq(articleSystemImpacts.systemId, input.systemId),
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
})
