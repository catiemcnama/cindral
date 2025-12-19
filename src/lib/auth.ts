import { db } from '@/db'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { organization } from 'better-auth/plugins'

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  database: drizzleAdapter(db, {
    provider: 'pg',
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Set to true if you want email verification
  },
  socialProviders: {
    // You can add OAuth providers here later
    // github: {
    //   clientId: process.env.GITHUB_CLIENT_ID!,
    //   clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    // },
    // google: {
    //   clientId: process.env.GOOGLE_CLIENT_ID!,
    //   clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    // },
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
