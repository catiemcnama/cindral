'use client'

import { organizationClient } from 'better-auth/client/plugins'
import { createAuthClient } from 'better-auth/react'

// Don't set baseURL - better-auth will use relative URLs which work with any domain
export const authClient = createAuthClient({
  plugins: [organizationClient()],
})

export const { signIn, signUp, signOut, useSession, organization, useActiveOrganization } = authClient

// Password reset - call the correct endpoint directly
export const requestPasswordReset = async (params: { email: string; redirectTo?: string }) => {
  try {
    const response = await fetch('/api/auth/request-password-reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: params.email,
        redirectTo: params.redirectTo || '/reset-password',
      }),
    })

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      return { error: { message: data.message || 'Failed to send reset email' } }
    }

    return { error: null }
  } catch {
    return { error: { message: 'Failed to send reset email' } }
  }
}

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
