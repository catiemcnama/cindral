/**
 * Resend Webhook Handler
 *
 * Handles email delivery events: bounces, complaints, deliveries.
 * Set up webhook at: https://resend.com/webhooks
 *
 * Events to enable:
 * - email.bounced (required)
 * - email.complained (required)
 * - email.delivered (optional, for tracking)
 */

import { logger } from '@/lib/logger'
import { NextRequest, NextResponse } from 'next/server'

// Resend webhook event types
interface ResendWebhookEvent {
  type: 'email.sent' | 'email.delivered' | 'email.bounced' | 'email.complained' | 'email.opened' | 'email.clicked'
  created_at: string
  data: {
    email_id: string
    from: string
    to: string[]
    subject: string
    // Bounce-specific
    bounce?: {
      message: string
    }
  }
}

// In production, verify webhook signature using RESEND_WEBHOOK_SECRET
// const WEBHOOK_SECRET = process.env.RESEND_WEBHOOK_SECRET

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ResendWebhookEvent

    logger.info('Resend webhook received', {
      type: body.type,
      emailId: body.data.email_id,
      to: body.data.to,
    })

    switch (body.type) {
      case 'email.bounced':
        await handleBounce(body)
        break

      case 'email.complained':
        await handleComplaint(body)
        break

      case 'email.delivered':
        // Optional: Track successful deliveries
        logger.info('Email delivered', {
          emailId: body.data.email_id,
          to: body.data.to,
        })
        break

      default:
        // Other events (opened, clicked) - optional tracking
        break
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    logger.error('Resend webhook error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    })

    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

/**
 * Handle bounced emails
 * Mark the email as invalid in your database
 */
async function handleBounce(event: ResendWebhookEvent) {
  const { to, subject } = event.data
  const bounceMessage = event.data.bounce?.message || 'Unknown bounce reason'

  logger.warn('Email bounced', {
    to,
    subject,
    reason: bounceMessage,
  })

  // TODO: Mark email as invalid in user table
  // This prevents sending to bad addresses and hurting deliverability
  //
  // await db.update(user)
  //   .set({ emailBounced: true, emailBouncedAt: new Date() })
  //   .where(eq(user.email, to[0]))
  //
  // For invitations, you might want to notify the inviter:
  // await notifyInviterOfBounce(to[0])
}

/**
 * Handle spam complaints
 * User marked your email as spam - stop emailing them
 */
async function handleComplaint(event: ResendWebhookEvent) {
  const { to, subject } = event.data

  logger.warn('Email marked as spam', {
    to,
    subject,
  })

  // TODO: Unsubscribe user from all emails
  // This is required by law (CAN-SPAM, GDPR)
  //
  // await db.update(user)
  //   .set({ emailOptOut: true, emailOptOutAt: new Date() })
  //   .where(eq(user.email, to[0]))
}
