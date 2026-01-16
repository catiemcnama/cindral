import { db } from '@/db'
import { organization } from '@/db/schema'
import { handleStripeWebhook } from '@/lib/billing'
import { logger } from '@/lib/logger'
import { eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Safely parse organization metadata JSON
 * Returns empty object on parse error instead of throwing
 */
function safeParseMetadata(metadata: string | null | undefined): Record<string, unknown> {
  if (!metadata) return {}
  try {
    const parsed = JSON.parse(metadata)
    return typeof parsed === 'object' && parsed !== null ? parsed : {}
  } catch {
    logger.warn('Failed to parse organization metadata', { metadata: metadata.substring(0, 100) })
    return {}
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = await req.text()
    const signature = req.headers.get('stripe-signature')

    if (!signature) {
      return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
    }

    const result = await handleStripeWebhook(payload, signature)

    if (!result.handled) {
      // Acknowledge unhandled events
      return NextResponse.json({ received: true, handled: false })
    }

    // Process the webhook based on event type
    switch (result.type) {
      case 'checkout.session.completed': {
        const { organizationId, customerId, subscriptionId, metadata } = result.data as {
          organizationId: string
          customerId: string
          subscriptionId: string
          metadata: { planId: string }
        }

        if (organizationId) {
          // Update organization with Stripe details
          const org = await db.query.organization.findFirst({
            where: eq(organization.id, organizationId),
          })

          if (org) {
            const existingMetadata = safeParseMetadata(org.metadata)
            await db
              .update(organization)
              .set({
                metadata: JSON.stringify({
                  ...existingMetadata,
                  stripeCustomerId: customerId,
                  stripeSubscriptionId: subscriptionId,
                  subscriptionStatus: 'active',
                  plan: metadata.planId,
                }),
              })
              .where(eq(organization.id, organizationId))

            logger.info('Updated organization with subscription', {
              organizationId,
              planId: metadata.planId,
            })
          }
        }
        break
      }

      case 'customer.subscription.updated': {
        const { status, currentPeriodEnd, cancelAtPeriodEnd, metadata } = result.data as {
          status: string
          currentPeriodEnd: string
          cancelAtPeriodEnd: boolean
          metadata: { organizationId: string; planId: string }
        }

        if (metadata?.organizationId) {
          const org = await db.query.organization.findFirst({
            where: eq(organization.id, metadata.organizationId),
          })

          if (org) {
            const existingMetadata = safeParseMetadata(org.metadata)
            await db
              .update(organization)
              .set({
                metadata: JSON.stringify({
                  ...existingMetadata,
                  subscriptionStatus: status,
                  currentPeriodEnd,
                  cancelAtPeriodEnd,
                  plan: metadata.planId,
                }),
              })
              .where(eq(organization.id, metadata.organizationId))

            logger.info('Updated subscription status', {
              organizationId: metadata.organizationId,
              status,
            })
          }
        }
        break
      }

      case 'customer.subscription.deleted': {
        const { metadata } = result.data as {
          metadata: { organizationId: string }
        }

        if (metadata?.organizationId) {
          const org = await db.query.organization.findFirst({
            where: eq(organization.id, metadata.organizationId),
          })

          if (org) {
            const existingMetadata = safeParseMetadata(org.metadata)
            await db
              .update(organization)
              .set({
                metadata: JSON.stringify({
                  ...existingMetadata,
                  subscriptionStatus: 'canceled',
                  plan: 'free', // Downgrade to free
                  canceledAt: new Date().toISOString(),
                }),
              })
              .where(eq(organization.id, metadata.organizationId))

            logger.info('Subscription canceled, downgraded to free', {
              organizationId: metadata.organizationId,
            })
          }
        }
        break
      }

      case 'invoice.payment_failed': {
        const { customerId, attemptCount } = result.data as {
          customerId: string
          attemptCount: number
        }

        logger.warn('Invoice payment failed', { customerId, attemptCount })
        // Payment failure notifications will be handled by Stripe's built-in dunning emails
        // See: https://stripe.com/docs/billing/revenue-recovery/smart-retries
        break
      }
    }

    return NextResponse.json({ received: true, handled: true })
  } catch (error) {
    logger.error('Stripe webhook error', { error })

    if (error instanceof Error && error.message.includes('signature')) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}
