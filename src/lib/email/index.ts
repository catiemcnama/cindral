/**
 * Email Service
 *
 * Transactional email sending via Resend.
 * Handles: password resets, email verification, org invitations, alerts.
 */

import { logger } from '@/lib/logger'

// =============================================================================
// Types
// =============================================================================

export interface EmailOptions {
  to: string | string[]
  subject: string
  html: string
  text?: string
  replyTo?: string
  tags?: { name: string; value: string }[]
}

export interface SendResult {
  success: boolean
  id?: string
  error?: string
}

// =============================================================================
// Configuration
// =============================================================================

const FROM_EMAIL = process.env.EMAIL_FROM || 'Cindral <notifications@trycindral.com>'
const RESEND_API_KEY = process.env.RESEND_API_KEY

function isConfigured(): boolean {
  return Boolean(RESEND_API_KEY)
}

// =============================================================================
// Core Send Function
// =============================================================================

/**
 * Send an email via Resend
 */
export async function sendEmail(options: EmailOptions): Promise<SendResult> {
  const { to, subject, html, text, replyTo, tags } = options

  // Development mode - log to console
  if (!isConfigured()) {
    logger.info('[Email] Would send email (not configured)', {
      to,
      subject,
      preview: html.substring(0, 200),
    })

    // In dev, also log to console for easy access
    console.log('\n' + '='.repeat(60))
    console.log('📧 EMAIL (dev mode - not actually sent)')
    console.log('='.repeat(60))
    console.log(`To: ${Array.isArray(to) ? to.join(', ') : to}`)
    console.log(`Subject: ${subject}`)
    console.log(`Body preview: ${html.replace(/<[^>]*>/g, '').substring(0, 300)}...`)
    console.log('='.repeat(60) + '\n')

    return { success: true, id: `dev-${Date.now()}` }
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
        text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML for plain text
        reply_to: replyTo,
        tags,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `HTTP ${response.status}`)
    }

    const data = await response.json()

    logger.info('Email sent successfully', {
      id: data.id,
      to: Array.isArray(to) ? to : [to],
      subject,
    })

    return { success: true, id: data.id }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'

    logger.error('Failed to send email', {
      error: message,
      to,
      subject,
    })

    return { success: false, error: message }
  }
}

// =============================================================================
// Convenience Methods
// =============================================================================

/**
 * Send a password reset email
 */
export async function sendPasswordResetEmail(params: {
  to: string
  name: string | undefined
  resetUrl: string
}): Promise<SendResult> {
  const { to, name, resetUrl } = params
  const displayName = name || 'there'

  return sendEmail({
    to,
    subject: 'Reset your Cindral password',
    html: getPasswordResetTemplate(displayName, resetUrl),
    tags: [{ name: 'category', value: 'password-reset' }],
  })
}

/**
 * Send an email verification email
 */
export async function sendVerificationEmail(params: {
  to: string
  name: string | undefined
  verifyUrl: string
}): Promise<SendResult> {
  const { to, name, verifyUrl } = params
  const displayName = name || 'there'

  return sendEmail({
    to,
    subject: 'Verify your Cindral email',
    html: getVerificationTemplate(displayName, verifyUrl),
    tags: [{ name: 'category', value: 'email-verification' }],
  })
}

/**
 * Send an organization invitation email
 */
export async function sendInvitationEmail(params: {
  to: string
  inviterName: string
  organizationName: string
  inviteUrl: string
  role: string
}): Promise<SendResult> {
  const { to, inviterName, organizationName, inviteUrl, role } = params

  return sendEmail({
    to,
    subject: `Join ${organizationName} on Cindral`,
    html: getInvitationTemplate(inviterName, organizationName, inviteUrl, role),
    tags: [{ name: 'category', value: 'invitation' }],
  })
}

/**
 * Send an alert assignment notification
 */
export async function sendAlertAssignmentEmail(params: {
  to: string
  assigneeName: string
  alertTitle: string
  alertSeverity: string
  alertUrl: string
  assignerName: string
}): Promise<SendResult> {
  const { to, assigneeName, alertTitle, alertSeverity, alertUrl, assignerName } = params

  return sendEmail({
    to,
    subject: `[${alertSeverity.toUpperCase()}] Alert assigned to you: ${alertTitle}`,
    html: getAlertAssignmentTemplate(assigneeName, alertTitle, alertSeverity, alertUrl, assignerName),
    tags: [
      { name: 'category', value: 'alert-assignment' },
      { name: 'severity', value: alertSeverity },
    ],
  })
}

/**
 * Send a welcome email after signup
 */
export async function sendWelcomeEmail(params: {
  to: string
  name: string | undefined
  dashboardUrl: string
}): Promise<SendResult> {
  const { to, name, dashboardUrl } = params
  const displayName = name || 'there'

  return sendEmail({
    to,
    subject: 'Welcome to Cindral! 🎉',
    html: getWelcomeTemplate(displayName, dashboardUrl),
    tags: [{ name: 'category', value: 'welcome' }],
  })
}

/**
 * Send a due date reminder for obligations
 */
export async function sendDueDateReminderEmail(params: {
  to: string
  userName: string
  obligations: Array<{
    title: string
    dueDate: string
    regulation: string
    url: string
  }>
  dashboardUrl: string
}): Promise<SendResult> {
  const { to, userName, obligations, dashboardUrl } = params

  const subject =
    obligations.length === 1
      ? `Reminder: "${obligations[0].title}" is due soon`
      : `Reminder: ${obligations.length} obligations are due soon`

  return sendEmail({
    to,
    subject,
    html: getDueDateReminderTemplate(userName, obligations, dashboardUrl),
    tags: [{ name: 'category', value: 'due-date-reminder' }],
  })
}

/**
 * Send notification when evidence pack is ready
 */
export async function sendEvidencePackReadyEmail(params: {
  to: string
  userName: string
  packTitle: string
  regulation: string
  downloadUrl: string
  dashboardUrl: string
}): Promise<SendResult> {
  const { to, userName, packTitle, regulation, downloadUrl, dashboardUrl } = params

  return sendEmail({
    to,
    subject: `Your evidence pack is ready: ${packTitle}`,
    html: getEvidencePackReadyTemplate(userName, packTitle, regulation, downloadUrl, dashboardUrl),
    tags: [{ name: 'category', value: 'evidence-pack-ready' }],
  })
}

// =============================================================================
// Email Templates
// =============================================================================

const baseStyles = `
  body { 
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    line-height: 1.6;
    color: #1a1a1a;
    margin: 0;
    padding: 0;
    background-color: #f5f5f5;
  }
  .container {
    max-width: 560px;
    margin: 0 auto;
    padding: 40px 20px;
  }
  .card {
    background: #ffffff;
    border-radius: 12px;
    padding: 40px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  }
  .logo {
    font-size: 24px;
    font-weight: 700;
    color: #0ea5e9;
    margin-bottom: 32px;
  }
  h1 {
    font-size: 22px;
    font-weight: 600;
    color: #1a1a1a;
    margin: 0 0 16px 0;
  }
  p {
    margin: 0 0 16px 0;
    color: #4a4a4a;
  }
  .button {
    display: inline-block;
    background: #0ea5e9;
    color: #ffffff !important;
    padding: 14px 28px;
    border-radius: 8px;
    text-decoration: none;
    font-weight: 600;
    margin: 24px 0;
  }
  .button:hover {
    background: #0284c7;
  }
  .muted {
    color: #6b7280;
    font-size: 14px;
  }
  .footer {
    margin-top: 32px;
    padding-top: 24px;
    border-top: 1px solid #e5e7eb;
    font-size: 13px;
    color: #9ca3af;
  }
  .link {
    color: #0ea5e9;
    word-break: break-all;
  }
  .badge {
    display: inline-block;
    padding: 4px 12px;
    border-radius: 9999px;
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
  }
  .badge-critical { background: #fef2f2; color: #dc2626; }
  .badge-high { background: #fff7ed; color: #ea580c; }
  .badge-medium { background: #fefce8; color: #ca8a04; }
  .badge-low { background: #f0fdf4; color: #16a34a; }
`

function wrapTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>${baseStyles}</style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="logo">Cindral</div>
      ${content}
      <div class="footer">
        <p>© ${new Date().getFullYear()} Cindral. All rights reserved.</p>
        <p>You're receiving this because you have an account at <a href="https://trycindral.com" class="link">trycindral.com</a></p>
      </div>
    </div>
  </div>
</body>
</html>
`
}

function getPasswordResetTemplate(name: string, resetUrl: string): string {
  return wrapTemplate(`
    <h1>Reset your password</h1>
    <p>Hi ${name},</p>
    <p>We received a request to reset your password. Click the button below to choose a new one:</p>
    <a href="${resetUrl}" class="button">Reset Password</a>
    <p class="muted">This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>
    <p class="muted" style="margin-top: 24px;">
      If the button doesn't work, copy and paste this URL:<br>
      <a href="${resetUrl}" class="link">${resetUrl}</a>
    </p>
  `)
}

function getVerificationTemplate(name: string, verifyUrl: string): string {
  return wrapTemplate(`
    <h1>Verify your email</h1>
    <p>Hi ${name},</p>
    <p>Thanks for signing up for Cindral! Please verify your email address by clicking the button below:</p>
    <a href="${verifyUrl}" class="button">Verify Email</a>
    <p class="muted">This link expires in 24 hours.</p>
    <p class="muted" style="margin-top: 24px;">
      If the button doesn't work, copy and paste this URL:<br>
      <a href="${verifyUrl}" class="link">${verifyUrl}</a>
    </p>
  `)
}

function getInvitationTemplate(inviterName: string, orgName: string, inviteUrl: string, role: string): string {
  return wrapTemplate(`
    <h1>You're invited to ${orgName}</h1>
    <p><strong>${inviterName}</strong> has invited you to join <strong>${orgName}</strong> on Cindral as a <strong>${role}</strong>.</p>
    <p>Cindral helps teams manage regulatory compliance, track obligations, and generate evidence packs.</p>
    <a href="${inviteUrl}" class="button">Accept Invitation</a>
    <p class="muted">This invitation expires in 7 days.</p>
    <p class="muted" style="margin-top: 24px;">
      If the button doesn't work, copy and paste this URL:<br>
      <a href="${inviteUrl}" class="link">${inviteUrl}</a>
    </p>
  `)
}

function getAlertAssignmentTemplate(
  assigneeName: string,
  alertTitle: string,
  severity: string,
  alertUrl: string,
  assignerName: string
): string {
  const severityClass = `badge-${severity}`

  return wrapTemplate(`
    <h1>Alert assigned to you</h1>
    <p>Hi ${assigneeName},</p>
    <p><strong>${assignerName}</strong> has assigned you an alert:</p>
    <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <p style="margin: 0 0 8px 0;"><span class="badge ${severityClass}">${severity}</span></p>
      <p style="margin: 0; font-weight: 600; font-size: 18px;">${alertTitle}</p>
    </div>
    <a href="${alertUrl}" class="button">View Alert</a>
    <p class="muted">Please review and take appropriate action.</p>
  `)
}
