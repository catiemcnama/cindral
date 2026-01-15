import { z } from 'zod'
import { orgProcedure, protectedProcedure, publicProcedure, router } from '../init'

// Domain routers
import { aiRouter } from './ai'
import { alertsRouter } from './alerts'
import { articlesRouter } from './articles'
import { billingRouter } from './billing'
import { dashboardRouter } from './dashboard'
import { evidencePacksRouter } from './evidence-packs'
import { integrationsRouter } from './integrations'
import { obligationsRouter } from './obligations'
import { onboardingRouter } from './onboarding'
import { regulationsRouter } from './regulations'
import { searchRouter } from './search'
import { systemMapRouter } from './systemMap'
import { systemsRouter } from './systems'

export const appRouter = router({
  // Domain routers
  regulations: regulationsRouter,
  articles: articlesRouter,
  alerts: alertsRouter,
  obligations: obligationsRouter,
  systems: systemsRouter,
  evidencePacks: evidencePacksRouter,
  dashboard: dashboardRouter,
  search: searchRouter,
  systemMap: systemMapRouter,
  integrations: integrationsRouter,
  billing: billingRouter,
  onboarding: onboardingRouter,
  ai: aiRouter,

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
