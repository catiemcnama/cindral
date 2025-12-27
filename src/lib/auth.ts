import { db } from '@/db'
import { sendInvitationEmail, sendPasswordResetEmail, sendVerificationEmail, sendWelcomeEmail } from '@/lib/email'
import { logger } from '@/lib/logger'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { organization } from 'better-auth/plugins'

// Provide a dummy secret during build time to prevent BetterAuthError
// The real secret from env vars is used at runtime
const secret = process.env.BETTER_AUTH_SECRET || 'build-time-placeholder-secret-not-used-in-production'

// Email verification setting - enable in production
const requireEmailVerification = process.env.REQUIRE_EMAIL_VERIFICATION === 'true'

// #region agent log - Debug auth configuration
console.log('[DEBUG-AUTH-CONFIG] Auth configuration:', {
  BETTER_AUTH_URL: process.env.BETTER_AUTH_URL || 'http://localhost:3000',
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NODE_ENV: process.env.NODE_ENV,
  requireEmailVerification,
})
// #endregion

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
    async sendResetPassword({ user, url }) {
      logger.info('Password reset requested', {
        userId: user.id,
        email: user.email,
      })

      await sendPasswordResetEmail({
        to: user.email,
        name: user.name,
        resetUrl: url,
      })
    },
    async sendVerificationEmail({
      user,
      url,
    }: {
      user: { id: string; email: string; name?: string }
      url: string
      token: string
    }) {
      logger.info('Email verification requested', {
        userId: user.id,
        email: user.email,
      })

      await sendVerificationEmail({
        to: user.email,
        name: user.name,
        verifyUrl: url,
      })
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
  // Hooks for post-auth actions
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          // Send welcome email to new users (fire-and-forget, don't block signup)
          const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

          logger.info('New user created, sending welcome email', {
            userId: user.id,
            email: user.email,
          })

          // Don't await - send in background so signup isn't blocked if email fails
          sendWelcomeEmail({
            to: user.email,
            name: user.name ?? undefined,
            dashboardUrl: `${appUrl}/dashboard`,
          }).catch((error) => {
            logger.error('Failed to send welcome email', {
              userId: user.id,
              error: error instanceof Error ? error.message : 'Unknown error',
            })
          })
        },
      },
    },
  },
  plugins: [
    organization({
      // https://www.better-auth.com/docs/plugins/organization
      // Allow any authenticated user to create organizations
      allowUserToCreateOrganization: true,
      // Limit number of organizations a user can create (optional)
      organizationLimit: 10,
      // Send invitation emails
      async sendInvitationEmail(data) {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
        const inviteUrl = `${appUrl}/accept-invitation/${data.id}`

        logger.info('Organization invitation requested', {
          to: data.email,
          organization: data.organization.name,
          inviter: data.inviter.user.name,
        })

        await sendInvitationEmail({
          to: data.email,
          inviterName: data.inviter.user.name || 'A team member',
          organizationName: data.organization.name,
          inviteUrl,
          role: data.role,
        })
      },
    }),
  ],
})

// Export types for use throughout the app
export type Session = typeof auth.$Infer.Session
