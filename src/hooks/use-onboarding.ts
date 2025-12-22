'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useEffect } from 'react'

import { useTRPC } from '@/trpc/client'
import { useQuery } from '@tanstack/react-query'
import { shouldBypassOnboarding } from '@/lib/onboarding-check'
import { useSession } from '@/lib/auth-client'

// =============================================================================
// Hook: useOnboardingStatus
// =============================================================================

/**
 * Hook to check onboarding status and optionally redirect
 *
 * @param options.redirectIfIncomplete - Redirect to onboarding if not complete
 * @returns Onboarding status and loading state
 */
export function useOnboardingStatus(options?: { redirectIfIncomplete?: boolean }) {
  const { redirectIfIncomplete = false } = options ?? {}

  const router = useRouter()
  const pathname = usePathname()
  const { data: session } = useSession()
  const trpc = useTRPC()

  // Only query if user is authenticated and has an active org
  const hasActiveOrg = !!session?.session?.activeOrganizationId

  const { data, isLoading, error } = useQuery({
    ...trpc.onboarding.isComplete.queryOptions(),
    enabled: hasActiveOrg,
    staleTime: 30000, // Cache for 30 seconds
  })

  // Redirect if incomplete and not on bypass route
  useEffect(() => {
    if (!redirectIfIncomplete) return
    if (isLoading) return
    if (!hasActiveOrg) return
    if (shouldBypassOnboarding(pathname)) return
    if (data?.isComplete) return

    // Redirect to onboarding
    router.push('/dashboard/onboarding')
  }, [redirectIfIncomplete, isLoading, hasActiveOrg, pathname, data?.isComplete, router])

  return {
    isComplete: data?.isComplete ?? false,
    completedAt: data?.completedAt ?? null,
    isLoading,
    error,
    isAuthenticated: hasActiveOrg,
  }
}

// =============================================================================
// Hook: useOnboardingState
// =============================================================================

/**
 * Hook to get full onboarding state with mutations
 */
export function useOnboardingState() {
  const trpc = useTRPC()
  const { data: session } = useSession()
  const hasActiveOrg = !!session?.session?.activeOrganizationId

  const { data, isLoading, error, refetch } = useQuery({
    ...trpc.onboarding.getState.queryOptions(),
    enabled: hasActiveOrg,
  })

  return {
    state: data,
    isLoading,
    error,
    refetch,
  }
}
