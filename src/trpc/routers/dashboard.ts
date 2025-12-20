import { 
  obligations, 
  alerts, 
  systems, 
  articleSystemImpacts,
  regulatoryChanges,
  evidencePacks,
} from '@/db/schema'
import { z } from 'zod'
import { orgProcedure, router } from '../init'
import { eq, and, sql, desc, count } from 'drizzle-orm'

export const dashboardRouter = router({
  /**
   * Get main dashboard stats
   */
  getStats: orgProcedure.query(async ({ ctx }) => {
    // Get obligation stats
    const orgObligations = await ctx.db.query.obligations.findMany({
      where: sql`(${obligations.organizationId} IS NULL OR ${obligations.organizationId} = ${ctx.activeOrganizationId})`,
      columns: { status: true },
    })

    const obligationStats = {
      total: orgObligations.length,
      compliant: orgObligations.filter(o => o.status === 'compliant').length,
      pending: orgObligations.filter(o => o.status === 'pending').length,
      nonCompliant: orgObligations.filter(o => o.status === 'non_compliant').length,
    }

    // Calculate controls at risk (non-compliant + pending)
    const controlsAtRisk = obligationStats.nonCompliant

    // Get system stats
    const systemsList = await ctx.db.query.systems.findMany({
      where: sql`(${systems.organizationId} IS NULL OR ${systems.organizationId} = ${ctx.activeOrganizationId})`,
      columns: { id: true, criticality: true },
    })

    // Get systems with critical/high impacts
    const criticalImpacts = await ctx.db.query.articleSystemImpacts.findMany({
      where: sql`${articleSystemImpacts.impactLevel} IN ('critical', 'high')`,
      columns: { systemId: true },
    })

    const impactedSystemIds = new Set(criticalImpacts.map(i => i.systemId))
    const systemsImpacted = systemsList.filter(s => impactedSystemIds.has(s.id)).length

    // Get active alerts count
    const activeAlerts = await ctx.db
      .select({ count: count() })
      .from(alerts)
      .where(and(
        eq(alerts.organizationId, ctx.activeOrganizationId),
        sql`${alerts.status} IN ('open', 'in_progress')`
      ))

    // Calculate overall compliance rate
    const complianceRate = obligationStats.total > 0
      ? Math.round((obligationStats.compliant / obligationStats.total) * 100)
      : 0

    // Evidence packs count
    const evidencePacksResult = await ctx.db
      .select({ count: count() })
      .from(evidencePacks)
      .where(eq(evidencePacks.organizationId, ctx.activeOrganizationId))

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
  }),

  /**
   * Get compliance breakdown by regulation
   */
  getComplianceByRegulation: orgProcedure.query(async ({ ctx }) => {
    // Get all regulations with their obligations
    const regs = await ctx.db.query.regulations.findMany({
      with: {
        articles: {
          with: {
            obligations: {
              where: sql`(${obligations.organizationId} IS NULL OR ${obligations.organizationId} = ${ctx.activeOrganizationId})`,
            },
          },
        },
      },
    })

    return regs.map(reg => {
      const allObligations = reg.articles.flatMap(a => a.obligations)
      const total = allObligations.length
      const compliant = allObligations.filter(o => o.status === 'compliant').length
      const pending = allObligations.filter(o => o.status === 'pending').length
      const nonCompliant = allObligations.filter(o => o.status === 'non_compliant').length

      const complianceRate = total > 0
        ? Math.round((compliant / total) * 100)
        : 100

      return {
        id: reg.id,
        name: reg.name,
        jurisdiction: reg.jurisdiction,
        effectiveDate: reg.effectiveDate,
        total,
        compliant,
        pending,
        nonCompliant,
        complianceRate,
      }
    }).sort((a, b) => a.complianceRate - b.complianceRate) // Worst compliance first
  }),

  /**
   * Get recent alerts for dashboard
   */
  getRecentAlerts: orgProcedure
    .input(z.object({ limit: z.number().min(1).max(20).default(5) }).optional())
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 5

      const recentAlerts = await ctx.db.query.alerts.findMany({
        where: eq(alerts.organizationId, ctx.activeOrganizationId),
        limit,
        orderBy: desc(alerts.createdAt),
        with: {
          regulation: {
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
        limit,
        orderBy: desc(regulatoryChanges.publishedAt),
        with: {
          regulation: {
            columns: { id: true, name: true },
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
      where: sql`(${systems.organizationId} IS NULL OR ${systems.organizationId} = ${ctx.activeOrganizationId})`,
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

    return systemsList.map(system => {
      const impactCounts = {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
      }

      const regs = new Set<string>()

      system.articleImpacts.forEach(impact => {
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
        criticality: system.criticality,
        impactCounts,
        totalImpacts: system.articleImpacts.length,
        regulationsAffected: Array.from(regs),
        riskLevel,
      }
    }).sort((a, b) => {
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
      where: eq(evidencePacks.organizationId, ctx.activeOrganizationId),
      with: {
        regulation: {
          columns: { id: true, name: true },
        },
      },
      orderBy: desc(evidencePacks.generatedAt),
    })

    const byFormat: Record<string, number> = {}

    packs.forEach(p => {
      const format = p.exportFormat ?? 'unknown'
      byFormat[format] = (byFormat[format] ?? 0) + 1
    })

    return {
      total: packs.length,
      byFormat,
      recent: packs.slice(0, 5),
    }
  }),
})
