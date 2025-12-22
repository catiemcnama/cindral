import { user } from '@/db/schema'
import { z } from 'zod'
import { orgProcedure, protectedProcedure, publicProcedure, router } from '../init'

// Domain routers
import { alertsRouter } from './alerts'
import { articlesRouter } from './articles'
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
  onboarding: onboardingRouter,

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

  // Admin examples
  getAllUsers: publicProcedure.query(async (opts) => {
    // Note: In production, this should be protected and check for admin role
    const allUsers = await opts.ctx.db.select().from(user)
    return allUsers
  }),
})

export type AppRouter = typeof appRouter
