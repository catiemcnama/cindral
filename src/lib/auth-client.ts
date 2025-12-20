'use client'

import { organizationClient } from 'better-auth/client/plugins'
import { createAuthClient } from 'better-auth/react'

export const authClient = createAuthClient({
  // Use relative URLs - this works on any domain (localhost, preview, production)
  // The browser will automatically use the current origin
  plugins: [organizationClient()],
})

export const { signIn, signUp, signOut, useSession, organization, useActiveOrganization } = authClient
