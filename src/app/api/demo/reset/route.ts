/**
 * Demo Reset API Endpoint
 *
 * POST /api/demo/reset
 *
 * Resets the current organization's demo data back to the seeded state.
 * Only available when IS_DEMO=true in environment.
 */

import { db } from '@/db'
import {
  alerts,
  articles,
  articleSystemImpacts,
  auditLog,
  demoConfig,
  evidencePacks,
  ingestJobs,
  obligations,
  obligationSystemMappings,
  regulations,
  systems,
} from '@/db/schema'
import { auth } from '@/lib/auth'
import { logger } from '@/lib/logger'
import { eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'

// Demo mode check
const isDemoMode = process.env.IS_DEMO === 'true'

export async function POST() {
  // Check demo mode
  if (!isDemoMode) {
    return NextResponse.json({ error: 'Demo mode is not enabled' }, { status: 403 })
  }

  // Get session
  const reqHeaders = await headers()
  const session = await auth.api.getSession({ headers: reqHeaders })

  if (!session?.session?.activeOrganizationId) {
    return NextResponse.json({ error: 'No active organization' }, { status: 401 })
  }

  const orgId = session.session.activeOrganizationId

  logger.info('[Demo] Resetting demo data', { orgId, userId: session.user.id })

  try {
    // Clear organization data in reverse dependency order
    // This preserves the org, users, and memberships but clears compliance data

    await db.delete(auditLog).where(eq(auditLog.organizationId, orgId))
    await db.delete(evidencePacks).where(eq(evidencePacks.organizationId, orgId))
    await db.delete(alerts).where(eq(alerts.organizationId, orgId))

    // Get all obligations for this org to clear mappings
    const orgObligations = await db.query.obligations.findMany({
      where: eq(obligations.organizationId, orgId),
      columns: { id: true },
    })
    if (orgObligations.length > 0) {
      const obligationIds = orgObligations.map((o) => o.id)
      for (const oblId of obligationIds) {
        await db.delete(obligationSystemMappings).where(eq(obligationSystemMappings.obligationId, oblId))
      }
    }

    // Get all articles to clear impacts
    const orgArticles = await db.query.articles.findMany({
      where: eq(articles.organizationId, orgId),
      columns: { id: true },
    })
    if (orgArticles.length > 0) {
      for (const art of orgArticles) {
        await db.delete(articleSystemImpacts).where(eq(articleSystemImpacts.articleId, art.id))
      }
    }

    await db.delete(obligations).where(eq(obligations.organizationId, orgId))
    await db.delete(articles).where(eq(articles.organizationId, orgId))
    await db.delete(regulations).where(eq(regulations.organizationId, orgId))
    await db.delete(ingestJobs).where(eq(ingestJobs.organizationId, orgId))
    await db.delete(systems).where(eq(systems.organizationId, orgId))

    // Update demo config reset count
    const existingConfig = await db.query.demoConfig.findFirst({
      where: eq(demoConfig.organizationId, orgId),
    })

    if (existingConfig) {
      await db
        .update(demoConfig)
        .set({
          lastResetAt: new Date(),
          resetCount: existingConfig.resetCount + 1,
        })
        .where(eq(demoConfig.id, existingConfig.id))
    } else {
      await db.insert(demoConfig).values({
        id: `demo-${orgId}`,
        organizationId: orgId,
        isDemo: true,
        lastResetAt: new Date(),
        resetCount: 1,
      })
    }

    logger.info('[Demo] Demo data reset complete', { orgId })

    return NextResponse.json({
      success: true,
      message: 'Demo data has been reset. Use the onboarding wizard to set up new data.',
      resetAt: new Date().toISOString(),
    })
  } catch (error) {
    logger.error('[Demo] Failed to reset demo data', {
      orgId,
      error: error instanceof Error ? error.message : 'Unknown error',
    })

    return NextResponse.json({ error: 'Failed to reset demo data' }, { status: 500 })
  }
}
