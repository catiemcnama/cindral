/**
 * Onboarding Check Utilities
 *
 * Client-safe utilities for onboarding status.
 * Server-side database checks should be done in tRPC routers.
 */

// =============================================================================
// Types
// =============================================================================

export interface OnboardingStatus {
  isComplete: boolean
  currentStep: number
  completedAt: Date | null
}

// =============================================================================
// Routes that bypass onboarding check
// =============================================================================

export const ONBOARDING_BYPASS_ROUTES = ['/dashboard/onboarding', '/dashboard/settings', '/api/', '/signin', '/signup']

/**
 * Check if a path should bypass onboarding enforcement
 */
export function shouldBypassOnboarding(pathname: string): boolean {
  return ONBOARDING_BYPASS_ROUTES.some((route) => pathname === route || pathname.startsWith(route))
}

// =============================================================================
// Onboarding progress helpers
// =============================================================================

/**
 * Get human-readable progress status
 */
export function getOnboardingProgress(currentStep: number, totalSteps = 4): string {
  if (currentStep >= totalSteps) {
    return 'Complete'
  }
  return `${currentStep}/${totalSteps} steps`
}

/**
 * Get step name by number
 */
export function getStepName(step: number): string {
  const steps: Record<number, string> = {
    1: 'Industry',
    2: 'Regulations',
    3: 'Systems',
    4: 'Team',
  }
  return steps[step] ?? 'Unknown'
}
