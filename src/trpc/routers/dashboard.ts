import {
  alerts,
  articles,
  articleSystemImpacts,
  evidencePacks,
  obligations,
  regulations,
  regulatoryChanges,
  systems,
} from '@/db/schema'
import { CACHE_KEYS, cached, TTL } from '@/lib/cache'
import { and, count, desc, eq, isNull, sql } from 'drizzle-orm'
import { z } from 'zod'
import { orgProcedure, router } from '../init'

export const dashboardRouter = router({
  /**
   * Get main dashboard stats
   * Cached for 30s with stale-while-revalidate
   */
  getStats: orgProcedure.query(async ({ ctx }) => {
    const orgId = ctx.activeOrganizationId

    return cached(
      CACHE_KEYS.dashboardStats(orgId),
      async () => {
        // Get obligation stats (strict org scoping + soft-delete filter)
        const orgObligations = await ctx.db.query.obligations.findMany({
          where: and(eq(obligations.organizationId, orgId), isNull(obligations.deletedAt)),
          columns: { status: true },
        })

        const obligationStats = {
          total: orgObligations.length,
          notStarted: orgObligations.filter((o) => o.status === 'not_started').length,
          inProgress: orgObligations.filter((o) => o.status === 'in_progress').length,
          implemented: orgObligations.filter((o) => o.status === 'implemented').length,
          underReview: orgObligations.filter((o) => o.status === 'under_review').length,
          verified: orgObligations.filter((o) => o.status === 'verified').length,
        }

        // Controls at risk = not_started
        const controlsAtRisk = obligationStats.notStarted

        // Get system stats (strict org scoping + soft-delete filter)
        const systemsList = await ctx.db.query.systems.findMany({
          where: and(eq(systems.organizationId, orgId), isNull(systems.deletedAt)),
          columns: { id: true, criticality: true },
        })

        // Get systems with critical/high impacts
        const criticalImpacts = await ctx.db.query.articleSystemImpacts.findMany({
          where: and(
            eq(articleSystemImpacts.organizationId, orgId),
            sql`${articleSystemImpacts.impactLevel} IN ('critical', 'high')`
          ),
          columns: { systemId: true },
        })

        const impactedSystemIds = new Set(criticalImpacts.map((i) => i.systemId))
        const systemsImpacted = systemsList.filter((s) => impactedSystemIds.has(s.id)).length

        // Get active alerts count (soft-delete filter)
        const activeAlerts = await ctx.db
          .select({ count: count() })
          .from(alerts)
          .where(
            and(
              eq(alerts.organizationId, orgId),
              isNull(alerts.deletedAt),
              sql`${alerts.status} IN ('open', 'in_triage', 'in_progress')`
            )
          )

        // Calculate overall compliance rate (implemented + verified = compliant)
        const compliant = obligationStats.implemented + obligationStats.verified
        const complianceRate = obligationStats.total > 0 ? Math.round((compliant / obligationStats.total) * 100) : 100

        // Evidence packs count (soft-delete filter)
        const evidencePacksResult = await ctx.db
          .select({ count: count() })
          .from(evidencePacks)
          .where(and(eq(evidencePacks.organizationId, orgId), isNull(evidencePacks.deletedAt)))

        return {
          controlsAtRisk,
          systemsImpacted,
          evidencePacks: Number(evidencePacksResult[0]?.count ?? 0),
          activeAlerts: Number(activeAlerts[0]?.count ?? 0),
          complianceRate,
          totalSystems: systemsList.length,
          totalObligations: obligationStats.total,
          obligations: obligationStats,
        }
      },
      TTL.dashboard
    )
  }),

  /**
   * Get compliance breakdown by regulation
   * Cached for 60s
   */
  getComplianceByRegulation: orgProcedure.query(async ({ ctx }) => {
    // Get all regulations for this org (with soft-delete filter)
    const regs = await ctx.db.query.regulations.findMany({
      where: and(eq(regulations.organizationId, ctx.activeOrganizationId), isNull(regulations.deletedAt)),
      with: {
        articles: {
          where: isNull(articles.deletedAt),
          with: {
            obligations: {
              where: and(eq(obligations.organizationId, ctx.activeOrganizationId), isNull(obligations.deletedAt)),
            },
          },
        },
      },
    })

    return regs
      .map((reg) => {
        const allObligations = reg.articles.flatMap((a) => a.obligations)
        const total = allObligations.length
        const notStarted = allObligations.filter((o) => o.status === 'not_started').length
        const inProgress = allObligations.filter((o) => o.status === 'in_progress').length
        const implemented = allObligations.filter((o) => o.status === 'implemented').length
        const underReview = allObligations.filter((o) => o.status === 'under_review').length
        const verified = allObligations.filter((o) => o.status === 'verified').length

        const compliant = implemented + verified
        const complianceRate = total > 0 ? Math.round((compliant / total) * 100) : 100

        return {
          id: reg.id,
          name: reg.name,
          framework: reg.framework,
          jurisdiction: reg.jurisdiction,
          effectiveDate: reg.effectiveDate,
          total,
          notStarted,
          inProgress,
          implemented,
          underReview,
          verified,
          complianceRate,
        }
      })
      .sort((a, b) => a.complianceRate - b.complianceRate) // Worst compliance first
  }),

  /**
   * Get recent alerts for dashboard
   */
  getRecentAlerts: orgProcedure
    .input(z.object({ limit: z.number().min(1).max(20).default(5) }).optional())
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 5

      const recentAlerts = await ctx.db.query.alerts.findMany({
        where: and(eq(alerts.organizationId, ctx.activeOrganizationId), isNull(alerts.deletedAt)),
        limit,
        orderBy: desc(alerts.createdAt),
        with: {
          regulation: {
            columns: { id: true, name: true },
          },
          obligation: {
            columns: { id: true, title: true },
          },
          system: {
            columns: { id: true, name: true },
          },
        },
      })

      return recentAlerts
    }),

  /**
   * Get regulatory feed (recent changes)
   */
  getRegulatoryFeed: orgProcedure
    .input(z.object({ limit: z.number().min(1).max(20).default(10) }).optional())
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 10

      const changes = await ctx.db.query.regulatoryChanges.findMany({
        where: eq(regulatoryChanges.organizationId, ctx.activeOrganizationId),
        limit,
        orderBy: desc(regulatoryChanges.publishedAt),
        with: {
          regulation: {
            columns: { id: true, name: true, framework: true },
          },
        },
      })

      return changes
    }),

  /**
   * Get system impact overview
   */
  getSystemImpactOverview: orgProcedure.query(async ({ ctx }) => {
    const systemsList = await ctx.db.query.systems.findMany({
      where: and(eq(systems.organizationId, ctx.activeOrganizationId), isNull(systems.deletedAt)),
      with: {
        articleImpacts: {
          where: eq(articleSystemImpacts.organizationId, ctx.activeOrganizationId),
          with: {
            article: {
              with: {
                regulation: {
                  columns: { id: true, name: true, framework: true },
                },
              },
            },
          },
        },
        obligationMappings: {
          where: eq(systems.organizationId, ctx.activeOrganizationId),
          columns: { id: true },
        },
      },
    })

    return systemsList
      .map((system) => {
        const impactCounts = {
          critical: 0,
          high: 0,
          medium: 0,
          low: 0,
        }

        const regs = new Set<string>()

        system.articleImpacts.forEach((impact) => {
          impactCounts[impact.impactLevel]++
          if (impact.article?.regulation) {
            regs.add(impact.article.regulation.name)
          }
        })

        // Determine overall risk level
        let riskLevel: 'critical' | 'high' | 'medium' | 'low' = 'low'
        if (impactCounts.critical > 0) riskLevel = 'critical'
        else if (impactCounts.high > 0) riskLevel = 'high'
        else if (impactCounts.medium > 0) riskLevel = 'medium'

        return {
          id: system.id,
          name: system.name,
          category: system.category,
          criticality: system.criticality,
          impactCounts,
          totalImpacts: system.articleImpacts.length,
          obligationCount: system.obligationMappings?.length ?? 0,
          regulationsAffected: Array.from(regs),
          riskLevel,
        }
      })
      .sort((a, b) => {
        // Sort by risk level
        const levels = ['critical', 'high', 'medium', 'low']
        return levels.indexOf(a.riskLevel) - levels.indexOf(b.riskLevel)
      })
  }),

  /**
   * Get evidence pack summary
   */
  getEvidencePackSummary: orgProcedure.query(async ({ ctx }) => {
    const packs = await ctx.db.query.evidencePacks.findMany({
      where: and(eq(evidencePacks.organizationId, ctx.activeOrganizationId), isNull(evidencePacks.deletedAt)),
      with: {
        regulation: {
          columns: { id: true, name: true, framework: true },
        },
      },
      orderBy: desc(evidencePacks.generatedAt),
    })

    const byFormat: Record<string, number> = {}
    const byStatus: Record<string, number> = {}
    const byAudience: Record<string, number> = {}

    packs.forEach((p) => {
      const format = p.exportFormat ?? 'unknown'
      byFormat[format] = (byFormat[format] ?? 0) + 1

      const status = p.status ?? 'unknown'
      byStatus[status] = (byStatus[status] ?? 0) + 1

      const audience = p.intendedAudience ?? 'unknown'
      byAudience[audience] = (byAudience[audience] ?? 0) + 1
    })

    return {
      total: packs.length,
      byFormat,
      byStatus,
      byAudience,
      recent: packs.slice(0, 5),
    }
  }),

  /**
   * Get quick compliance summary
   */
  getQuickSummary: orgProcedure.query(async ({ ctx }) => {
    const [regsCount, obligationsCount, alertsCount, systemsCount] = await Promise.all([
      ctx.db.query.regulations.findMany({
        where: and(eq(regulations.organizationId, ctx.activeOrganizationId), isNull(regulations.deletedAt)),
        columns: { id: true },
      }),
      ctx.db.query.obligations.findMany({
        where: and(eq(obligations.organizationId, ctx.activeOrganizationId), isNull(obligations.deletedAt)),
        columns: { status: true },
      }),
      ctx.db.query.alerts.findMany({
        where: and(
          eq(alerts.organizationId, ctx.activeOrganizationId),
          isNull(alerts.deletedAt),
          sql`${alerts.status} NOT IN ('resolved', 'wont_fix')`
        ),
        columns: { severity: true },
      }),
      ctx.db.query.systems.findMany({
        where: and(eq(systems.organizationId, ctx.activeOrganizationId), isNull(systems.deletedAt)),
        columns: { id: true },
      }),
    ])

    const compliant = obligationsCount.filter((o) => o.status === 'verified' || o.status === 'implemented').length
    const total = obligationsCount.length

    return {
      regulations: regsCount.length,
      obligations: total,
      complianceRate: total > 0 ? Math.round((compliant / total) * 100) : 100,
      activeAlerts: alertsCount.length,
      criticalAlerts: alertsCount.filter((a) => a.severity === 'critical').length,
      systems: systemsCount.length,
    }
  }),
})
