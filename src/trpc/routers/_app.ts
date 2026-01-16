import { z } from 'zod'
import { orgProcedure, protectedProcedure, publicProcedure, router } from '../init'

// Domain routers
import { aiRouter } from './ai'
import { alertsRouter } from './alerts'
import { articlesRouter } from './articles'
import { billingRouter } from './billing'
import { dashboardRouter } from './dashboard'
import { demoRouter } from './demo'
import { evidencePacksRouter } from './evidence-packs'
import { integrationsRouter } from './integrations'
import { magicDemoRouter } from './magic-demo'
import { obligationsRouter } from './obligations'
import { onboardingRouter } from './onboarding'
import { regulationsRouter } from './regulations'
import { searchRouter } from './search'
import { systemMapRouter } from './systemMap'
import { systemsRouter } from './systems'

export const appRouter = router({
  // Content: Regulations & Articles
  regulations: regulationsRouter,
  articles: articlesRouter,

  // Compliance: Obligations & Evidence
  obligations: obligationsRouter,
  evidencePacks: evidencePacksRouter,

  // Infrastructure: Systems
  systems: systemsRouter,
  systemMap: systemMapRouter,

  // Intelligence: AI
  ai: aiRouter,

  // Notifications
  alerts: alertsRouter,
  search: searchRouter,

  // UX
  dashboard: dashboardRouter,
  onboarding: onboardingRouter,

  // Admin
  billing: billingRouter,
  integrations: integrationsRouter,
  demo: demoRouter,

  // Public demo (no auth)
  magicDemo: magicDemoRouter,

  // Root procedures
  hello: publicProcedure
    .input(z.object({ text: z.string() }))
    .query((opts) => ({ greeting: `Hello ${opts.input.text}` })),

  getMe: protectedProcedure.query(async (opts) => opts.ctx.user),

  getMyOrganizations: protectedProcedure.query(async (opts) => {
    const memberships = await opts.ctx.db.query.member.findMany({
      where: (member, { eq }) => eq(member.userId, opts.ctx.user.id),
      with: { organization: true },
    })
    return memberships.map((m) => ({ ...m.organization, role: m.role }))
  }),

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
