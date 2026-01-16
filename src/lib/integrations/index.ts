export { BaseIntegrationProvider } from './base'
export { confluenceIntegration } from './confluence'
export { jiraIntegration } from './jira'
export * from './types'

import { confluenceIntegration } from './confluence'
import { jiraIntegration } from './jira'
import type { IntegrationProvider } from './types'

/**
 * Integrations that are planned but not yet available
 */
const COMING_SOON_INTEGRATIONS = ['servicenow', 'slack', 'teams'] as const

/**
 * Get integration instance by provider name
 */
export function getIntegration(provider: IntegrationProvider) {
  switch (provider) {
    case 'jira':
      return jiraIntegration
    case 'confluence':
      return confluenceIntegration
    case 'servicenow':
    case 'slack':
    case 'teams':
      throw new Error(
        `${provider.charAt(0).toUpperCase() + provider.slice(1)} integration coming soon. Contact support@cindral.com for early access.`
      )
    default:
      throw new Error(`Unknown integration provider: ${provider}`)
  }
}

/**
 * Check if an integration is available
 */
export function isIntegrationAvailable(provider: string): boolean {
  return !COMING_SOON_INTEGRATIONS.includes(provider as (typeof COMING_SOON_INTEGRATIONS)[number])
}
