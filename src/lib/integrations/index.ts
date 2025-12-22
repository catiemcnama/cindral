export * from './types'
export { BaseIntegrationProvider } from './base'
export { jiraIntegration } from './jira'
export { confluenceIntegration } from './confluence'

import { jiraIntegration } from './jira'
import { confluenceIntegration } from './confluence'
import type { IntegrationProvider } from './types'

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
      // TODO: Implement ServiceNow integration
      throw new Error('ServiceNow integration not yet implemented')
    case 'slack':
      // TODO: Implement Slack integration
      throw new Error('Slack integration not yet implemented')
    case 'teams':
      // TODO: Implement Teams integration
      throw new Error('Teams integration not yet implemented')
    default:
      throw new Error(`Unknown integration provider: ${provider}`)
  }
}

