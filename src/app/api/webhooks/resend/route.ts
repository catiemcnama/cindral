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
import crypto from 'crypto'
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

const WEBHOOK_SECRET = process.env.RESEND_WEBHOOK_SECRET

/**
 * Verify Resend webhook signature using HMAC-SHA256
 * @see https://resend.com/docs/webhooks#verify-webhooks
 */
function verifyWebhookSignature(payload: string, signature: string | null, timestamp: string | null): boolean {
  if (!WEBHOOK_SECRET) {
    // In development without secret, log warning and allow
    if (process.env.NODE_ENV === 'development') {
      logger.warn('RESEND_WEBHOOK_SECRET not configured - skipping signature verification in development')
      return true
    }
    return false
  }

  if (!signature || !timestamp) {
    return false
  }

  // Resend uses "v1,signature" format
  const signatureParts = signature.split(',')
  const signatureHash = signatureParts.find((part) => part.startsWith('v1='))?.replace('v1=', '')

  if (!signatureHash) {
    return false
  }

  // Create the signed payload string
  const signedPayload = `${timestamp}.${payload}`

  // Compute HMAC-SHA256
  const expectedSignature = crypto.createHmac('sha256', WEBHOOK_SECRET).update(signedPayload).digest('hex')

  // Constant-time comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(Buffer.from(signatureHash, 'hex'), Buffer.from(expectedSignature, 'hex'))
  } catch {
    return false
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const payload = await request.text()
    const signature = request.headers.get('svix-signature')
    const timestamp = request.headers.get('svix-timestamp')

    // Verify webhook signature
    if (!verifyWebhookSignature(payload, signature, timestamp)) {
      logger.warn('Resend webhook signature verification failed')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    // Check timestamp to prevent replay attacks (5 minute tolerance)
    if (timestamp) {
      const webhookTime = parseInt(timestamp, 10) * 1000
      const now = Date.now()
      const fiveMinutes = 5 * 60 * 1000
      if (Math.abs(now - webhookTime) > fiveMinutes) {
        logger.warn('Resend webhook timestamp too old', { timestamp, now })
        return NextResponse.json({ error: 'Timestamp too old' }, { status: 401 })
      }
    }

    const body = JSON.parse(payload) as ResendWebhookEvent

    logger.info('Resend webhook received', {
      type: body.type,
      emailId: body.data.email_id,
      // Mask email addresses in logs
      toCount: body.data.to.length,
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
          toCount: body.data.to.length,
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
  const { subject } = event.data
  const bounceMessage = event.data.bounce?.message || 'Unknown bounce reason'

  logger.warn('Email bounced', {
    subject,
    reason: bounceMessage,
    // Don't log full email addresses
    recipientCount: event.data.to.length,
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
  const { subject } = event.data

  logger.warn('Email marked as spam', {
    subject,
    // Don't log full email addresses
    recipientCount: event.data.to.length,
  })

  // TODO: Unsubscribe user from all emails
  // This is required by law (CAN-SPAM, GDPR)
  //
  // await db.update(user)
  //   .set({ emailOptOut: true, emailOptOutAt: new Date() })
  //   .where(eq(user.email, to[0]))
}
