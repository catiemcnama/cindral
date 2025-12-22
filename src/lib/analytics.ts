/**
 * Analytics Events Tracking
 *
 * Provides a unified interface for user behavior tracking.
 * In development, logs to console. In production, sends to analytics provider.
 */

import { logger } from './logger'

// Event types
export type AnalyticsEvent =
  | 'page_view'
  | 'sign_up_started'
  | 'sign_up_completed'
  | 'sign_in'
  | 'sign_out'
  | 'onboarding_started'
  | 'onboarding_step_completed'
  | 'onboarding_completed'
  | 'onboarding_skipped'
  | 'regulation_viewed'
  | 'regulation_searched'
  | 'article_viewed'
  | 'article_summarized'
  | 'alert_created'
  | 'alert_assigned'
  | 'alert_resolved'
  | 'alert_dismissed'
  | 'obligation_status_changed'
  | 'evidence_pack_started'
  | 'evidence_pack_completed'
  | 'evidence_pack_downloaded'
  | 'system_created'
  | 'system_mapped'
  | 'system_map_exported'
  | 'search_performed'
  | 'integration_connected'
  | 'integration_synced'
  | 'subscription_started'
  | 'subscription_upgraded'
  | 'subscription_canceled'
  | 'feature_used'
  | 'error_occurred'

interface AnalyticsUser {
  id: string
  email?: string
  name?: string
  organizationId?: string
  organizationName?: string
  plan?: string
  createdAt?: string
}

interface AnalyticsContext {
  sessionId?: string
  referrer?: string
  userAgent?: string
  url?: string
}

// Current user and context
let currentUser: AnalyticsUser | null = null
let currentContext: AnalyticsContext = {}

// Check if analytics is configured
const AMPLITUDE_API_KEY = process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY
const MIXPANEL_TOKEN = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN
const IS_PRODUCTION = process.env.NODE_ENV === 'production'
const IS_ENABLED = IS_PRODUCTION && (!!AMPLITUDE_API_KEY || !!MIXPANEL_TOKEN)

// Analytics provider (lazy loaded)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let amplitudeClient: any = null

/**
 * Initialize analytics (call once at app startup)
 */
export async function initAnalytics() {
  if (!IS_ENABLED) {
    logger.debug('Analytics disabled (no API key configured or not in production)')
    return
  }

  try {
    if (AMPLITUDE_API_KEY) {
      // Dynamic import Amplitude - only loads if API key is configured
      // @ts-expect-error - Amplitude is optional dependency
      const amplitude = await import('@amplitude/analytics-browser')
      amplitudeClient = amplitude
      amplitudeClient.init(AMPLITUDE_API_KEY, undefined, {
        defaultTracking: {
          sessions: true,
          pageViews: true,
          formInteractions: true,
          fileDownloads: true,
        },
      })
      logger.info('Amplitude analytics initialized')
    }
    // Add Mixpanel initialization here if needed
  } catch (error) {
    // Amplitude not installed - that's fine, analytics is optional
    logger.debug('Analytics not initialized (Amplitude not available)', {
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

/**
 * Identify user for analytics
 */
export function identify(user: AnalyticsUser) {
  currentUser = user

  if (IS_PRODUCTION && amplitudeClient) {
    amplitudeClient.setUserId(user.id)

    const identifyEvent = new amplitudeClient.Identify()
    if (user.email) identifyEvent.set('email', user.email)
    if (user.name) identifyEvent.set('name', user.name)
    if (user.organizationId) identifyEvent.set('organization_id', user.organizationId)
    if (user.organizationName) identifyEvent.set('organization_name', user.organizationName)
    if (user.plan) identifyEvent.set('plan', user.plan)
    if (user.createdAt) identifyEvent.set('created_at', user.createdAt)

    amplitudeClient.identify(identifyEvent)
  }

  logger.debug('Analytics user identified', { userId: user.id })
}

/**
 * Set analytics context
 */
export function setContext(context: AnalyticsContext) {
  currentContext = { ...currentContext, ...context }
}

/**
 * Reset user (on sign out)
 */
export function reset() {
  currentUser = null

  if (IS_PRODUCTION && amplitudeClient) {
    amplitudeClient.reset()
  }

  logger.debug('Analytics user reset')
}

/**
 * Track an event
 */
export function track(event: AnalyticsEvent, properties?: Record<string, unknown>) {
  const eventData = {
    event,
    properties: {
      ...properties,
      ...currentContext,
      timestamp: new Date().toISOString(),
    },
    user: currentUser
      ? {
          id: currentUser.id,
          organizationId: currentUser.organizationId,
        }
      : null,
  }

  // Always log in development
  if (!IS_PRODUCTION) {
    logger.debug('Analytics event', eventData)
    return
  }

  // Send to provider
  if (amplitudeClient) {
    amplitudeClient.track(event, eventData.properties)
  }
}

/**
 * Track page view
 */
export function trackPageView(pageName: string, properties?: Record<string, unknown>) {
  track('page_view', {
    page_name: pageName,
    ...properties,
  })
}

// Convenience methods for common events

export function trackSignUp(method: 'email' | 'google' | 'microsoft' | 'github') {
  track('sign_up_completed', { method })
}

export function trackSignIn(method: 'email' | 'google' | 'microsoft' | 'github') {
  track('sign_in', { method })
}

export function trackOnboardingStep(step: number, stepName: string) {
  track('onboarding_step_completed', { step, step_name: stepName })
}

export function trackRegulationViewed(regulationId: string, regulationName: string) {
  track('regulation_viewed', { regulation_id: regulationId, regulation_name: regulationName })
}

export function trackAlertAction(
  action: 'created' | 'assigned' | 'resolved' | 'dismissed',
  alertId: string,
  severity?: string
) {
  const eventMap = {
    created: 'alert_created',
    assigned: 'alert_assigned',
    resolved: 'alert_resolved',
    dismissed: 'alert_dismissed',
  } as const

  track(eventMap[action], { alert_id: alertId, severity })
}

export function trackEvidencePack(action: 'started' | 'completed' | 'downloaded', packId?: string, format?: string) {
  const eventMap = {
    started: 'evidence_pack_started',
    completed: 'evidence_pack_completed',
    downloaded: 'evidence_pack_downloaded',
  } as const

  track(eventMap[action], { pack_id: packId, format })
}

export function trackSearch(query: string, resultCount: number, filters?: Record<string, unknown>) {
  track('search_performed', { query, result_count: resultCount, filters })
}

export function trackFeatureUsed(feature: string, properties?: Record<string, unknown>) {
  track('feature_used', { feature, ...properties })
}

export function trackError(error: string, context?: Record<string, unknown>) {
  track('error_occurred', { error, ...context })
}

/**
 * Flush pending events
 */
export async function flush(): Promise<void> {
  if (amplitudeClient) {
    await amplitudeClient.flush().promise
  }
}
