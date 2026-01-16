import { z } from 'zod'
import { orgProcedure, protectedProcedure, publicProcedure, router } from '../init'

/**
 * Consolidated Router Structure
 *
 * 8 logical domains:
 * 1. regulations  - Regulations + Articles
 * 2. compliance   - Obligations + Evidence Packs
 * 3. systems      - Systems + System Map
 * 4. ai           - AI Agent + AI operations
 * 5. alerts       - Alerts + Search
 * 6. dashboard    - Dashboard + Onboarding
 * 7. admin        - Billing + Integrations + Demo
 * 8. (root)       - User/org management
 */

// Domain routers - CONSOLIDATED
import { aiRouter } from './ai'
import { alertsRouter } from './alerts'
import { articlesRouter } from './articles'
import { billingRouter } from './billing'
import { dashboardRouter } from './dashboard'
import { demoRouter } from './demo'
import { evidencePacksRouter } from './evidence-packs'
import { integrationsRouter } from './integrations'
import { obligationsRouter } from './obligations'
import { onboardingRouter } from './onboarding'
import { regulationsRouter } from './regulations'
import { searchRouter } from './search'
import { systemMapRouter } from './systemMap'
import { systemsRouter } from './systems'

export const appRouter = router({
  // ==========================================================================
  // CONSOLIDATED DOMAIN ROUTERS
  // ==========================================================================

  // Content Domain: Regulations & Articles
  regulations: regulationsRouter,
  articles: articlesRouter, // TODO: Merge into regulations.articles

  // Compliance Domain: Obligations & Evidence
  obligations: obligationsRouter,
  evidencePacks: evidencePacksRouter, // TODO: Merge into compliance.evidence

  // Infrastructure Domain: Systems & Mapping
  systems: systemsRouter,
  systemMap: systemMapRouter, // TODO: Merge into systems.map

  // Intelligence Domain: AI Agent & Operations
  ai: aiRouter,

  // Notifications Domain: Alerts & Discovery
  alerts: alertsRouter,
  search: searchRouter, // TODO: Merge into root or alerts.search

  // UX Domain: Dashboard & Onboarding
  dashboard: dashboardRouter,
  onboarding: onboardingRouter, // TODO: Merge into dashboard.onboarding

  // Admin Domain: Billing, Integrations, Demo
  billing: billingRouter,
  integrations: integrationsRouter, // TODO: Merge into admin.integrations
  demo: demoRouter, // TODO: Merge into admin.demo

  // ==========================================================================
  // ROOT PROCEDURES
  // ==========================================================================

  // Public procedures
  hello: publicProcedure
    .input(
      z.object({
        text: z.string(),
      })
    )
    .query((opts) => {
      return {
        greeting: `Hello ${opts.input.text}`,
      }
    }),

  // Protected procedures - require authentication
  getMe: protectedProcedure.query(async (opts) => {
    return opts.ctx.user
  }),

  getMyOrganizations: protectedProcedure.query(async (opts) => {
    const memberships = await opts.ctx.db.query.member.findMany({
      where: (member, { eq }) => eq(member.userId, opts.ctx.user.id),
      with: {
        organization: true,
      },
    })

    return memberships.map((m) => ({
      ...m.organization,
      role: m.role,
    }))
  }),

  // Organization-scoped procedures
  getOrgMembers: orgProcedure.query(async (opts) => {
    const members = await opts.ctx.db.query.member.findMany({
      where: (member, { eq }) => eq(member.organizationId, opts.ctx.activeOrganizationId),
      with: {
        user: true,
      },
    })

    return members
  }),
})

export type AppRouter = typeof appRouter
