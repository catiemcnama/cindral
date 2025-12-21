import { checkHealth, db, dbConfig } from '@/db'
import {
  alerts,
  articles,
  auditLog,
  evidencePacks,
  ingestJobs,
  obligations,
  obligationSystemMappings,
  organization,
  regulations,
  systems,
} from '@/db/schema'
import { desc, eq, sql } from 'drizzle-orm'
import fs from 'fs'
import { NextResponse } from 'next/server'
import path from 'path'

interface OrgSnapshot {
  organizationId: string
  organizationName: string
  counts: {
    regulations: number
    articles: number
    obligations: number
    systems: number
    obligationSystemMappings: number
    evidencePacks: number
    alerts: number
    auditLogEntries: number
  }
  lastIngest: {
    id: string
    status: string
    finishedAt: Date | null
  } | null
  complianceStats: {
    notStarted: number
    inProgress: number
    implemented: number
    underReview: number
    verified: number
    total: number
    compliancePercent: number
  }
}

interface HealthResponse {
  ok: boolean
  timestamp: string
  database: {
    connected: boolean
    latencyMs: number
    poolSize: number
    queryTimeout: number
    slowQueryThreshold: number
  }
  migration: {
    latest: string | null
    appliedAt: string | null
    totalMigrations: number
    pending: string[]
  }
  organizations: OrgSnapshot[]
  totals: {
    organizations: number
    regulations: number
    articles: number
    obligations: number
    systems: number
    alerts: number
    auditLogEntries: number
  }
}

/**
 * GET /api/health/db
 *
 * Returns database health status including:
 * - DB connectivity and latency
 * - Latest migration info
 * - Per-organization counts
 * - Compliance statistics
 */
export async function GET() {
  const startTime = Date.now()

  try {
    // Test DB connectivity
    const healthCheck = await checkHealth()
    if (!healthCheck.connected) {
      throw new Error(healthCheck.error || 'Database connection failed')
    }

    // Get migration info from drizzle folder and DB
    const migrationInfo = {
      latest: null as string | null,
      appliedAt: null as string | null,
      totalMigrations: 0,
      pending: [] as string[],
    }

    try {
      const drizzlePath = path.join(process.cwd(), 'drizzle')
      if (fs.existsSync(drizzlePath)) {
        const files = fs
          .readdirSync(drizzlePath)
          .filter((f) => f.endsWith('.sql'))
          .sort()

        migrationInfo.totalMigrations = files.length
        if (files.length > 0) {
          const latestFile = files[files.length - 1]
          migrationInfo.latest = latestFile.replace('.sql', '')

          const stats = fs.statSync(path.join(drizzlePath, latestFile))
          migrationInfo.appliedAt = stats.mtime.toISOString()
        }

        // Check for pending migrations by comparing with __drizzle_migrations table
        try {
          const applied = await db.execute(sql`
            SELECT name FROM "__drizzle_migrations" ORDER BY created_at
          `)
          const appliedNames = new Set((applied as unknown as { name: string }[]).map((r) => r.name))

          migrationInfo.pending = files.map((f) => f.replace('.sql', '')).filter((name) => !appliedNames.has(name))
        } catch {
          // Migration table might not exist yet
        }
      }
    } catch {
      // Ignore migration file errors
    }

    // Get all organizations
    const orgs = await db.select().from(organization)

    const orgSnapshots: OrgSnapshot[] = []
    let totalRegs = 0,
      totalArts = 0,
      totalObls = 0,
      totalSys = 0,
      totalAlerts = 0,
      totalAudit = 0

    for (const org of orgs) {
      const [regs, arts, obls, syss, mappings, packs, alts, audit, lastIngestResult] = await Promise.all([
        db
          .select({ count: sql<number>`count(*)` })
          .from(regulations)
          .where(eq(regulations.organizationId, org.id)),
        db
          .select({ count: sql<number>`count(*)` })
          .from(articles)
          .where(eq(articles.organizationId, org.id)),
        db.query.obligations.findMany({ where: eq(obligations.organizationId, org.id), columns: { status: true } }),
        db
          .select({ count: sql<number>`count(*)` })
          .from(systems)
          .where(eq(systems.organizationId, org.id)),
        db
          .select({ count: sql<number>`count(*)` })
          .from(obligationSystemMappings)
          .where(eq(obligationSystemMappings.organizationId, org.id)),
        db
          .select({ count: sql<number>`count(*)` })
          .from(evidencePacks)
          .where(eq(evidencePacks.organizationId, org.id)),
        db
          .select({ count: sql<number>`count(*)` })
          .from(alerts)
          .where(eq(alerts.organizationId, org.id)),
        db
          .select({ count: sql<number>`count(*)` })
          .from(auditLog)
          .where(eq(auditLog.organizationId, org.id)),
        db.query.ingestJobs.findFirst({
          where: eq(ingestJobs.organizationId, org.id),
          orderBy: desc(ingestJobs.startedAt),
        }),
      ])

      const regCount = Number(regs[0]?.count ?? 0)
      const artCount = Number(arts[0]?.count ?? 0)
      const sysCount = Number(syss[0]?.count ?? 0)
      const mappingCount = Number(mappings[0]?.count ?? 0)
      const packCount = Number(packs[0]?.count ?? 0)
      const alertCount = Number(alts[0]?.count ?? 0)
      const auditCount = Number(audit[0]?.count ?? 0)

      totalRegs += regCount
      totalArts += artCount
      totalObls += obls.length
      totalSys += sysCount
      totalAlerts += alertCount
      totalAudit += auditCount

      // Calculate compliance stats
      const complianceStats = {
        notStarted: obls.filter((o) => o.status === 'not_started').length,
        inProgress: obls.filter((o) => o.status === 'in_progress').length,
        implemented: obls.filter((o) => o.status === 'implemented').length,
        underReview: obls.filter((o) => o.status === 'under_review').length,
        verified: obls.filter((o) => o.status === 'verified').length,
        total: obls.length,
        compliancePercent: 0,
      }

      const compliant = complianceStats.verified + complianceStats.implemented
      complianceStats.compliancePercent =
        complianceStats.total > 0 ? Math.round((compliant / complianceStats.total) * 100) : 100

      orgSnapshots.push({
        organizationId: org.id,
        organizationName: org.name,
        counts: {
          regulations: regCount,
          articles: artCount,
          obligations: obls.length,
          systems: sysCount,
          obligationSystemMappings: mappingCount,
          evidencePacks: packCount,
          alerts: alertCount,
          auditLogEntries: auditCount,
        },
        lastIngest: lastIngestResult
          ? {
              id: lastIngestResult.id,
              status: lastIngestResult.status ?? 'unknown',
              finishedAt: lastIngestResult.finishedAt,
            }
          : null,
        complianceStats,
      })
    }

    const response: HealthResponse = {
      ok: true,
      timestamp: new Date().toISOString(),
      database: {
        connected: true,
        latencyMs: healthCheck.latencyMs,
        poolSize: dbConfig.poolSize,
        queryTimeout: dbConfig.queryTimeout,
        slowQueryThreshold: dbConfig.slowQueryThreshold,
      },
      migration: migrationInfo,
      organizations: orgSnapshots,
      totals: {
        organizations: orgs.length,
        regulations: totalRegs,
        articles: totalArts,
        obligations: totalObls,
        systems: totalSys,
        alerts: totalAlerts,
        auditLogEntries: totalAudit,
      },
    }

    return NextResponse.json(response)
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err)

    return NextResponse.json(
      {
        ok: false,
        timestamp: new Date().toISOString(),
        database: {
          connected: false,
          latencyMs: Date.now() - startTime,
        },
        error: errorMessage,
      },
      { status: 500 }
    )
  }
}
