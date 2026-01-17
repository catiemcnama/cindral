/**
 * Billing & Subscription Management
 *
 * This module provides the foundation for Stripe integration.
 * In development mode, it uses mock data. In production, it connects to Stripe.
 */

import { logger } from './logger'

// Plan definitions
export const PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    description: 'For individuals and small teams getting started',
    price: { monthly: 0, annual: 0 },
    features: ['Up to 3 users', '5 regulations', '10 systems', '100 alerts', 'Community support'],
    limits: {
      users: 3,
      regulations: 5,
      systems: 10,
      alerts: 100,
      evidencePacks: 5,
      apiRequests: 1000,
    },
  },
  starter: {
    id: 'starter',
    name: 'Starter',
    description: 'For growing teams with more compliance needs',
    price: { monthly: 49, annual: 470 },
    stripePriceIds: {
      monthly: process.env.STRIPE_PRICE_ID_STARTER_MONTHLY,
      annual: process.env.STRIPE_PRICE_ID_STARTER_ANNUAL,
    },
    features: [
      'Up to 10 users',
      '15 regulations',
      '50 systems',
      '500 alerts',
      'Email support',
      'API access',
      'Evidence pack generation',
    ],
    limits: {
      users: 10,
      regulations: 15,
      systems: 50,
      alerts: 500,
      evidencePacks: 25,
      apiRequests: 10000,
    },
  },
  professional: {
    id: 'professional',
    name: 'Professional',
    description: 'For organizations requiring full compliance capabilities',
    price: { monthly: 149, annual: 1430 },
    stripePriceIds: {
      monthly: process.env.STRIPE_PRICE_ID_PRO_MONTHLY,
      annual: process.env.STRIPE_PRICE_ID_PRO_ANNUAL,
    },
    features: [
      'Unlimited users',
      'Unlimited regulations',
      'Unlimited systems',
      'Unlimited alerts',
      'Priority support',
      'Full API access',
      'Advanced analytics',
      'Custom integrations',
      'SSO/SAML',
      'Audit logs',
    ],
    limits: {
      users: Infinity,
      regulations: Infinity,
      systems: Infinity,
      alerts: Infinity,
      evidencePacks: Infinity,
      apiRequests: Infinity,
    },
  },
} as const

export type PlanId = keyof typeof PLANS
export type Plan = (typeof PLANS)[PlanId]

/**
 * Get plan details by ID
 */
export function getPlan(planId: PlanId): Plan {
  return PLANS[planId] ?? PLANS.free
}

/**
 * Check if a plan has a specific feature
 */
export function planHasFeature(planId: PlanId, feature: string): boolean {
  const plan = getPlan(planId)
  return (plan.features as readonly string[]).includes(feature)
}

/**
 * Get the appropriate Stripe price ID for a plan
 */
export function getStripePriceId(planId: PlanId, annual: boolean): string | undefined {
  const plan = PLANS[planId]
  if (!('stripePriceIds' in plan)) return undefined
  return annual ? plan.stripePriceIds.annual : plan.stripePriceIds.monthly
}

// Stripe client initialization (lazy loaded)
let stripeClient: unknown = null

async function getStripe() {
  if (!stripeClient) {
    const stripeKey = process.env.STRIPE_SECRET_KEY
    if (!stripeKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured')
    }
    // Dynamic import to avoid loading Stripe in non-billing contexts
    const { default: Stripe } = await import('stripe')
    stripeClient = new Stripe(stripeKey, {
      apiVersion: '2025-12-15.clover',
    })
  }
  return stripeClient as import('stripe').default
}

/**
 * Create a Stripe Checkout session for subscription
 */
export async function createCheckoutSession(options: {
  organizationId: string
  organizationName: string
  email: string
  planId: 'starter' | 'professional'
  annual: boolean
  successUrl: string
  cancelUrl: string
}): Promise<{ url: string | null; sessionId: string }> {
  const priceId = getStripePriceId(options.planId, options.annual)

  if (!priceId) {
    // Only allow mock in development
    if (process.env.NODE_ENV === 'development') {
      logger.warn('[Billing] No Stripe price ID - returning mock session (dev only)', {
        planId: options.planId,
        annual: options.annual,
      })
      return {
        url: `${options.successUrl}?mock=true`,
        sessionId: `mock_session_${Date.now()}`,
      }
    }
    // In production, this is a configuration error
    throw new Error(
      `Stripe price ID not configured for plan '${options.planId}'. ` +
        `Set STRIPE_PRICE_ID_${options.planId.toUpperCase()}_${options.annual ? 'ANNUAL' : 'MONTHLY'} environment variable.`
    )
  }

  const stripe = await getStripe()

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    customer_email: options.email,
    client_reference_id: options.organizationId,
    metadata: {
      organizationId: options.organizationId,
      organizationName: options.organizationName,
      planId: options.planId,
      billingCycle: options.annual ? 'annual' : 'monthly',
    },
    success_url: options.successUrl,
    cancel_url: options.cancelUrl,
    subscription_data: {
      metadata: {
        organizationId: options.organizationId,
        planId: options.planId,
      },
    },
    allow_promotion_codes: true,
  })

  logger.info('Created Stripe checkout session', {
    sessionId: session.id,
    organizationId: options.organizationId,
    planId: options.planId,
  })

  return {
    url: session.url,
    sessionId: session.id,
  }
}

/**
 * Create a Stripe Billing Portal session
 */
export async function createBillingPortalSession(options: {
  stripeCustomerId: string
  returnUrl: string
}): Promise<{ url: string }> {
  // Only allow mock in development
  if (!process.env.STRIPE_SECRET_KEY) {
    if (process.env.NODE_ENV === 'development') {
      logger.warn('[Billing] No Stripe key - returning mock portal URL (dev only)')
      return {
        url: `${options.returnUrl}?billing_portal=mock`,
      }
    }
    // In production, this is a configuration error
    throw new Error('STRIPE_SECRET_KEY is required in production')
  }

  const stripe = await getStripe()

  const session = await stripe.billingPortal.sessions.create({
    customer: options.stripeCustomerId,
    return_url: options.returnUrl,
  })

  logger.info('Created Stripe billing portal session', {
    customerId: options.stripeCustomerId,
  })

  return {
    url: session.url,
  }
}

/**
 * Handle Stripe webhook events
 */
export async function handleStripeWebhook(
  payload: string,
  signature: string
): Promise<{
  type: string
  handled: boolean
  data?: Record<string, unknown>
}> {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not configured')
  }

  const stripe = await getStripe()
  const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret)

  logger.info('Received Stripe webhook', { type: event.type })

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object
      return {
        type: event.type,
        handled: true,
        data: {
          organizationId: session.client_reference_id,
          customerId: session.customer,
          subscriptionId: session.subscription,
          metadata: session.metadata,
        },
      }
    }

    case 'customer.subscription.updated': {
      // Type assertion needed due to Stripe's dynamic event types
      const subscription = event.data.object as unknown as Record<string, unknown>
      const currentPeriodEnd = subscription.current_period_end as number | undefined
      return {
        type: event.type,
        handled: true,
        data: {
          subscriptionId: subscription.id,
          customerId: subscription.customer,
          status: subscription.status,
          currentPeriodEnd: currentPeriodEnd ? new Date(currentPeriodEnd * 1000).toISOString() : undefined,
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          metadata: subscription.metadata,
        },
      }
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as unknown as Record<string, unknown>
      return {
        type: event.type,
        handled: true,
        data: {
          subscriptionId: subscription.id,
          customerId: subscription.customer,
          status: 'canceled',
          metadata: subscription.metadata,
        },
      }
    }

    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as unknown as Record<string, unknown>
      return {
        type: event.type,
        handled: true,
        data: {
          invoiceId: invoice.id,
          customerId: invoice.customer,
          subscriptionId: invoice.subscription,
          amountPaid: invoice.amount_paid,
          currency: invoice.currency,
        },
      }
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as unknown as Record<string, unknown>
      return {
        type: event.type,
        handled: true,
        data: {
          invoiceId: invoice.id,
          customerId: invoice.customer,
          subscriptionId: invoice.subscription,
          attemptCount: invoice.attempt_count,
        },
      }
    }

    default:
      logger.debug('Unhandled Stripe webhook event', { type: event.type })
      return { type: event.type, handled: false }
  }
}

/**
 * Cancel a subscription at period end
 */
export async function cancelSubscription(subscriptionId: string): Promise<void> {
  const stripe = await getStripe()

  await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  })

  logger.info('Subscription set to cancel at period end', { subscriptionId })
}

/**
 * Resume a canceled subscription
 */
export async function resumeSubscription(subscriptionId: string): Promise<void> {
  const stripe = await getStripe()

  await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: false,
  })

  logger.info('Subscription cancellation reverted', { subscriptionId })
}

/**
 * Get subscription details from Stripe
 */
export async function getSubscriptionDetails(subscriptionId: string) {
  const stripe = await getStripe()

  const subscription = (await stripe.subscriptions.retrieve(subscriptionId)) as unknown as {
    id: string
    status: string
    current_period_start: number
    current_period_end: number
    cancel_at_period_end: boolean
    canceled_at: number | null
  }

  return {
    id: subscription.id,
    status: subscription.status,
    currentPeriodStart: new Date(subscription.current_period_start * 1000),
    currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
  }
}
