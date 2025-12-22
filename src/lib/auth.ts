import { db } from '@/db'
import { logger } from '@/lib/logger'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { organization } from 'better-auth/plugins'

// Provide a dummy secret during build time to prevent BetterAuthError
// The real secret from env vars is used at runtime
const secret = process.env.BETTER_AUTH_SECRET || 'build-time-placeholder-secret-not-used-in-production'

// Email verification setting - enable in production
const requireEmailVerification = process.env.REQUIRE_EMAIL_VERIFICATION === 'true'

export const auth = betterAuth({
  secret,
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3000',
  trustedOrigins: [
    'https://trycindral.com',
    'https://www.trycindral.com',
    process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  ].filter(Boolean),
  database: drizzleAdapter(db, {
    provider: 'pg',
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification,
    resetPasswordTokenExpiresIn: 3600, // 1 hour
    verificationTokenExpiresIn: 86400, // 24 hours
    async sendResetPassword({ user, url, token }) {
      logger.info('Password reset requested', {
        userId: user.id,
        email: user.email,
        resetUrl: url,
        token,
      })

      // In production, integrate with your email provider (Resend, SendGrid, etc.)
      // await sendEmail({
      //   to: user.email,
      //   subject: 'Reset your Cindral password',
      //   html: getPasswordResetEmailTemplate(user.name, url),
      // })

      console.log(`[DEV] Password reset link for ${user.email}: ${url}`)
    },
    async sendVerificationEmail({
      user,
      url,
      token,
    }: {
      user: { id: string; email: string; name?: string }
      url: string
      token: string
    }) {
      logger.info('Email verification requested', {
        userId: user.id,
        email: user.email,
        verificationUrl: url,
        token,
      })

      // In production, integrate with your email provider (Resend, SendGrid, etc.)
      // await sendEmail({
      //   to: user.email,
      //   subject: 'Verify your Cindral email',
      //   html: getVerificationEmailTemplate(user.name, url),
      // })

      console.log(`[DEV] Email verification link for ${user.email}: ${url}`)
    },
  },
  socialProviders: {
    // Google OAuth - configure in Google Cloud Console
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? {
          google: {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          },
        }
      : {}),
    // Microsoft OAuth - configure in Azure AD
    ...(process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET
      ? {
          microsoft: {
            clientId: process.env.MICROSOFT_CLIENT_ID,
            clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
            tenantId: process.env.MICROSOFT_TENANT_ID || 'common',
          },
        }
      : {}),
    // GitHub OAuth - configure in GitHub Developer Settings
    ...(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
      ? {
          github: {
            clientId: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
          },
        }
      : {}),
  },
  // Rate limiting for auth endpoints
  rateLimit: {
    window: 60, // 1 minute
    max: 10, // 10 requests per minute for auth endpoints
  },
  // Session configuration
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // Update session every 24 hours
  },
  plugins: [
    organization({
      // https://www.better-auth.com/docs/plugins/organization
      // Allow any authenticated user to create organizations
      allowUserToCreateOrganization: true,
      // Limit number of organizations a user can create (optional)
      organizationLimit: 10,
      // Optional: Send invitation emails
      async sendInvitationEmail(data) {
        // TODO: Implement email sending logic
        // For now, we'll log the invitation
        console.log('Invitation sent:', {
          to: data.email,
          organization: data.organization.name,
          inviter: data.inviter.user.name,
          invitationId: data.id,
        })

        // When you implement email:
        // await sendEmail({
        //   to: data.email,
        //   subject: `Join ${data.organization.name}`,
        //   html: `${data.inviter.user.name} invited you to join ${data.organization.name}. <a href="${process.env.NEXT_PUBLIC_APP_URL}/accept-invitation/${data.id}">Accept invitation</a>`,
        // });
      },
    }),
  ],
})

// Export types for use throughout the app
export type Session = typeof auth.$Infer.Session
