'use client'

import { organizationClient } from 'better-auth/client/plugins'
import { createAuthClient } from 'better-auth/react'

// Use current origin in browser to avoid CORS issues with www/non-www mismatch
const getBaseURL = () => {
  if (typeof window !== 'undefined') {
    return window.location.origin
  }
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
}

export const authClient = createAuthClient({
  baseURL: getBaseURL(),
  plugins: [organizationClient()],
})

export const {
  signIn,
  signUp,
  signOut,
  useSession,
  organization,
  useActiveOrganization,
  requestPasswordReset,
  resetPassword,
  verifyEmail,
} = authClient

// OAuth sign-in helpers
export const signInWithGoogle = () => authClient.signIn.social({ provider: 'google' })
export const signInWithMicrosoft = () => authClient.signIn.social({ provider: 'microsoft' })
export const signInWithGitHub = () => authClient.signIn.social({ provider: 'github' })
