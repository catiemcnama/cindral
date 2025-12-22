/**
 * Stripe billing utilities
 *
 * In production, this would use the actual Stripe SDK.
 * This is a stub implementation for development.
 */

import { logger } from '@/lib/logger'
import type { CheckoutSession, BillingPortalSession, PlanId } from './types'
import { PLANS } from './types'

// Check if Stripe is configured
const isStripeConfigured = () => {
  return Boolean(process.env.STRIPE_SECRET_KEY)
}

/**
 * Create a Stripe Checkout session for subscription
 */
export async function createCheckoutSession(options: {
  organizationId: string
  organizationName: string
  email: string
  planId: PlanId
  annual?: boolean
  successUrl: string
  cancelUrl: string
}): Promise<CheckoutSession> {
  const { organizationId, organizationName, email, planId, annual, successUrl, cancelUrl } = options

  const plan = PLANS[planId]

  if (!isStripeConfigured()) {
    logger.info('[Stripe] Checkout session created (stub)', { organizationId, planId })
    return {
      sessionId: `stub_session_${Date.now()}`,
      url: `${successUrl}?session_id=stub_session_${Date.now()}`,
    }
  }

  // In production with Stripe SDK:
  // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
  // 
  // const session = await stripe.checkout.sessions.create({
  //   mode: 'subscription',
  //   payment_method_types: ['card'],
  //   line_items: [
  //     {
  //       price: annual ? plan.stripeAnnualPriceId : plan.stripePriceId,
  //       quantity: 1,
  //     },
  //   ],
  //   customer_email: email,
  //   client_reference_id: organizationId,
  //   metadata: {
  //     organizationId,
  //     organizationName,
  //     planId,
  //   },
  //   success_url: successUrl,
  //   cancel_url: cancelUrl,
  //   allow_promotion_codes: true,
  //   billing_address_collection: 'required',
  //   subscription_data: {
  //     metadata: {
  //       organizationId,
  //     },
  //   },
  // })
  // 
  // return {
  //   sessionId: session.id,
  //   url: session.url!,
  // }

  // Stub response
  return {
    sessionId: `stub_session_${Date.now()}`,
    url: successUrl,
  }
}

/**
 * Create a Stripe Billing Portal session
 */
export async function createBillingPortalSession(options: {
  stripeCustomerId: string
  returnUrl: string
}): Promise<BillingPortalSession> {
  const { stripeCustomerId, returnUrl } = options

  if (!isStripeConfigured()) {
    logger.info('[Stripe] Billing portal session created (stub)', { stripeCustomerId })
    return {
      url: returnUrl,
    }
  }

  // In production with Stripe SDK:
  // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
  // 
  // const session = await stripe.billingPortal.sessions.create({
  //   customer: stripeCustomerId,
  //   return_url: returnUrl,
  // })
  // 
  // return {
  //   url: session.url,
  // }

  return {
    url: returnUrl,
  }
}

/**
 * Cancel a subscription at period end
 */
export async function cancelSubscription(stripeSubscriptionId: string): Promise<void> {
  if (!isStripeConfigured()) {
    logger.info('[Stripe] Subscription canceled (stub)', { stripeSubscriptionId })
    return
  }

  // In production:
  // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
  // await stripe.subscriptions.update(stripeSubscriptionId, {
  //   cancel_at_period_end: true,
  // })
}

/**
 * Resume a canceled subscription
 */
export async function resumeSubscription(stripeSubscriptionId: string): Promise<void> {
  if (!isStripeConfigured()) {
    logger.info('[Stripe] Subscription resumed (stub)', { stripeSubscriptionId })
    return
  }

  // In production:
  // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
  // await stripe.subscriptions.update(stripeSubscriptionId, {
  //   cancel_at_period_end: false,
  // })
}

/**
 * Get subscription details from Stripe
 */
export async function getSubscription(stripeSubscriptionId: string): Promise<{
  status: string
  currentPeriodEnd: Date
  cancelAtPeriodEnd: boolean
} | null> {
  if (!isStripeConfigured()) {
    logger.info('[Stripe] Getting subscription (stub)', { stripeSubscriptionId })
    return {
      status: 'active',
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      cancelAtPeriodEnd: false,
    }
  }

  // In production:
  // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
  // const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId)
  // return {
  //   status: subscription.status,
  //   currentPeriodEnd: new Date(subscription.current_period_end * 1000),
  //   cancelAtPeriodEnd: subscription.cancel_at_period_end,
  // }

  return null
}

/**
 * Get or create a Stripe customer for an organization
 */
export async function getOrCreateCustomer(options: {
  organizationId: string
  email: string
  name: string
}): Promise<string> {
  if (!isStripeConfigured()) {
    logger.info('[Stripe] Customer created (stub)', { organizationId: options.organizationId })
    return `stub_customer_${options.organizationId}`
  }

  // In production:
  // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
  // 
  // // Search for existing customer
  // const customers = await stripe.customers.list({
  //   email: options.email,
  //   limit: 1,
  // })
  // 
  // if (customers.data.length > 0) {
  //   return customers.data[0].id
  // }
  // 
  // // Create new customer
  // const customer = await stripe.customers.create({
  //   email: options.email,
  //   name: options.name,
  //   metadata: {
  //     organizationId: options.organizationId,
  //   },
  // })
  // 
  // return customer.id

  return `stub_customer_${options.organizationId}`
}

