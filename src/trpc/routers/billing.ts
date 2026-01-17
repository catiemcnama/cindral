import { organization } from '@/db/schema'
import { createBillingPortalSession, createCheckoutSession, getPlan, PLANS, type PlanId } from '@/lib/billing'
import { NotFoundError, ValidationError } from '@/lib/errors'
import { requireMutatePermission } from '@/lib/tenancy'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { orgProcedure, router } from '../init'

export const billingRouter = router({
  /**
   * Get current organization's subscription status
   */
  getSubscription: orgProcedure.query(async ({ ctx }) => {
    const org = await ctx.db.query.organization.findFirst({
      where: eq(organization.id, ctx.activeOrganizationId),
    })

    if (!org) {
      throw new NotFoundError('Organization', ctx.activeOrganizationId)
    }

    // Get plan details
    const planId = (org.metadata as { plan?: PlanId })?.plan ?? 'free'
    const plan = getPlan(planId)

    // Get subscription status from metadata
    const metadata = org.metadata as {
      stripeCustomerId?: string
      stripeSubscriptionId?: string
      subscriptionStatus?: string
      currentPeriodEnd?: string
      cancelAtPeriodEnd?: boolean
    } | null

    return {
      planId,
      plan,
      status: metadata?.subscriptionStatus ?? 'active',
      stripeCustomerId: metadata?.stripeCustomerId,
      stripeSubscriptionId: metadata?.stripeSubscriptionId,
      currentPeriodEnd: metadata?.currentPeriodEnd ? new Date(metadata.currentPeriodEnd) : null,
      cancelAtPeriodEnd: metadata?.cancelAtPeriodEnd ?? false,
    }
  }),

  /**
   * Get all available plans
   */
  getPlans: orgProcedure.query(async () => {
    return Object.values(PLANS)
  }),

  /**
   * Create a Stripe Checkout session for subscription
   */
  createCheckoutSession: orgProcedure
    .input(
      z.object({
        planId: z.enum(['starter', 'professional']),
        annual: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      requireMutatePermission(ctx)

      const org = await ctx.db.query.organization.findFirst({
        where: eq(organization.id, ctx.activeOrganizationId),
      })

      if (!org) {
        throw new NotFoundError('Organization', ctx.activeOrganizationId)
      }

      const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

      const session = await createCheckoutSession({
        organizationId: ctx.activeOrganizationId,
        organizationName: org.name,
        email: ctx.user?.email ?? '',
        planId: input.planId,
        annual: input.annual,
        successUrl: `${baseUrl}/dashboard/settings?billing=success&session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${baseUrl}/dashboard/settings?billing=canceled`,
      })

      return session
    }),

  /**
   * Create a Stripe Billing Portal session
   */
  createBillingPortalSession: orgProcedure.mutation(async ({ ctx }) => {
    requireMutatePermission(ctx)

    const org = await ctx.db.query.organization.findFirst({
      where: eq(organization.id, ctx.activeOrganizationId),
    })

    if (!org) {
      throw new NotFoundError('Organization', ctx.activeOrganizationId)
    }

    const metadata = org.metadata as { stripeCustomerId?: string } | null

    if (!metadata?.stripeCustomerId) {
      throw new ValidationError('No Stripe customer found for this organization')
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

    const session = await createBillingPortalSession({
      stripeCustomerId: metadata.stripeCustomerId,
      returnUrl: `${baseUrl}/dashboard/settings`,
    })

    return session
  }),

  /**
   * Get usage statistics for the current billing period
   */
  getUsage: orgProcedure.query(async ({ ctx: _ctx }) => {
    void _ctx
    // In production, query actual usage from database
    // For now, return stub data
    return {
      users: {
        used: 3,
        limit: 10,
      },
      systems: {
        used: 12,
        limit: 25,
      },
      regulations: {
        used: 2,
        limit: 5,
      },
      alerts: {
        used: 45,
        limit: 500,
      },
      evidencePacks: {
        used: 3,
        limit: 25,
      },
      apiRequests: {
        used: 1234,
        limit: 10000,
      },
      periodStart: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      periodEnd: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
    }
  }),
})
