'use client'

import { organizationClient } from 'better-auth/client/plugins'
import { createAuthClient } from 'better-auth/react'

// Don't set baseURL - better-auth will use relative URLs which work with any domain
export const authClient = createAuthClient({
  plugins: [organizationClient()],
})

export const { signIn, signUp, signOut, useSession, organization, useActiveOrganization } = authClient

// Password reset - use type assertion for forgetPassword method
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const client = authClient as any
export const requestPasswordReset = (params: { email: string; redirectTo?: string }) =>
  client.forgetPassword({
    email: params.email,
    redirectTo: params.redirectTo || '/reset-password',
  })

export const resetPassword = (params: { token: string; newPassword: string }) =>
  authClient.resetPassword({ newPassword: params.newPassword, token: params.token })

export const verifyEmail = (params: { query: { token: string } }) => authClient.verifyEmail(params)

// OAuth sign-in helpers - redirect to dashboard after auth
export const signInWithGoogle = (callbackURL = '/dashboard') =>
  authClient.signIn.social({ provider: 'google', callbackURL })
export const signInWithMicrosoft = (callbackURL = '/dashboard') =>
  authClient.signIn.social({ provider: 'microsoft', callbackURL })
export const signInWithGitHub = (callbackURL = '/dashboard') =>
  authClient.signIn.social({ provider: 'github', callbackURL })
