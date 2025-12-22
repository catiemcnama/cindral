/**
 * Stripe Webhook Handler
 *
 * Handles Stripe events for subscription lifecycle management.
 * In production, this would verify the webhook signature and process events.
 */

import { db } from '@/db'
import { organization } from '@/db/schema'
import { logger } from '@/lib/logger'
import { eq, sql } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'

// Stripe event types we care about
type StripeEventType =
  | 'checkout.session.completed'
  | 'customer.subscription.created'
  | 'customer.subscription.updated'
  | 'customer.subscription.deleted'
  | 'invoice.payment_succeeded'
  | 'invoice.payment_failed'

interface StripeEvent {
  id: string
  type: StripeEventType
  data: {
    object: {
      id: string
      customer: string
      subscription?: string
      client_reference_id?: string
      metadata?: {
        organizationId?: string
        planId?: string
      }
      status?: string
      current_period_start?: number
      current_period_end?: number
      cancel_at_period_end?: boolean
    }
  }
}

/**
 * POST /api/webhooks/stripe
 */
export async function POST(req: NextRequest) {
  const body = await req.text()

  // In production, verify the webhook signature:
  // const signature = req.headers.get('stripe-signature')
  // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
  // const event = stripe.webhooks.constructEvent(
  //   body,
  //   signature!,
  //   process.env.STRIPE_WEBHOOK_SECRET!
  // )

  // For development, parse the JSON directly
  let event: StripeEvent
  try {
    event = JSON.parse(body) as StripeEvent
  } catch {
    logger.error('[Stripe Webhook] Invalid JSON body')
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  logger.info('[Stripe Webhook] Received event', { type: event.type, id: event.id })

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutComplete(event)
        break

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(event)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event)
        break

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event)
        break

      case 'invoice.payment_failed':
        await handlePaymentFailed(event)
        break

      default:
        logger.info('[Stripe Webhook] Unhandled event type', { type: event.type })
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    logger.error('[Stripe Webhook] Error processing event', { error, type: event.type })
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

/**
 * Handle successful checkout - activate subscription
 */
async function handleCheckoutComplete(event: StripeEvent) {
  const session = event.data.object
  const organizationId = session.client_reference_id ?? session.metadata?.organizationId

  if (!organizationId) {
    logger.warn('[Stripe Webhook] No organizationId in checkout session')
    return
  }

  const planId = session.metadata?.planId ?? 'starter'

  // Update organization with subscription details
  await db
    .update(organization)
    .set({
      metadata: sql`jsonb_set(
        COALESCE(${organization.metadata}, '{}'),
        '{plan}',
        ${JSON.stringify(planId)}
      ) || jsonb_build_object(
        'stripeCustomerId', ${session.customer},
        'stripeSubscriptionId', ${session.subscription ?? ''},
        'subscriptionStatus', 'active'
      )`,
    })
    .where(eq(organization.id, organizationId))

  logger.info('[Stripe Webhook] Subscription activated', { organizationId, planId })
}

/**
 * Handle subscription update
 */
async function handleSubscriptionUpdate(event: StripeEvent) {
  const subscription = event.data.object
  const organizationId = subscription.metadata?.organizationId

  if (!organizationId) {
    logger.warn('[Stripe Webhook] No organizationId in subscription metadata')
    return
  }

  // Update subscription status in organization metadata
  await db
    .update(organization)
    .set({
      metadata: sql`COALESCE(${organization.metadata}, '{}') || jsonb_build_object(
        'subscriptionStatus', ${subscription.status ?? 'active'},
        'currentPeriodEnd', ${subscription.current_period_end ? new Date(subscription.current_period_end * 1000).toISOString() : null},
        'cancelAtPeriodEnd', ${subscription.cancel_at_period_end ?? false}
      )`,
    })
    .where(eq(organization.id, organizationId))

  logger.info('[Stripe Webhook] Subscription updated', {
    organizationId,
    status: subscription.status,
  })
}

/**
 * Handle subscription deletion
 */
async function handleSubscriptionDeleted(event: StripeEvent) {
  const subscription = event.data.object
  const organizationId = subscription.metadata?.organizationId

  if (!organizationId) {
    logger.warn('[Stripe Webhook] No organizationId in subscription metadata')
    return
  }

  // Downgrade to free plan
  await db
    .update(organization)
    .set({
      metadata: sql`COALESCE(${organization.metadata}, '{}') || jsonb_build_object(
        'plan', 'free',
        'subscriptionStatus', 'canceled',
        'stripeSubscriptionId', null
      )`,
    })
    .where(eq(organization.id, organizationId))

  logger.info('[Stripe Webhook] Subscription canceled, downgraded to free', { organizationId })
}

/**
 * Handle successful payment
 */
async function handlePaymentSucceeded(event: StripeEvent) {
  const invoice = event.data.object
  logger.info('[Stripe Webhook] Payment succeeded', { invoiceId: invoice.id })
  // Could trigger email notification, etc.
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(event: StripeEvent) {
  const invoice = event.data.object
  logger.warn('[Stripe Webhook] Payment failed', { invoiceId: invoice.id })
  // Could trigger email notification, update subscription status, etc.
}

