/**
 * Integration provider configuration and types
 */

export type IntegrationProvider = 'jira' | 'confluence' | 'servicenow' | 'slack' | 'teams'

export interface IntegrationConfig {
  accessToken?: string
  refreshToken?: string
  instanceUrl?: string
  projectKey?: string
  spaceKey?: string
}

export interface ProviderInfo {
  id: IntegrationProvider
  name: string
  description: string
  icon: string
  oauthUrl?: string
  scopes?: string[]
  capabilities: IntegrationCapability[]
}

export type IntegrationCapability =
  | 'export_alerts'
  | 'import_issues'
  | 'export_evidence'
  | 'notifications'
  | 'bidirectional_sync'

export interface JiraIssue {
  key: string
  summary: string
  description?: string
  status: string
  priority: string
  assignee?: string
  labels?: string[]
}

export interface ConfluencePage {
  id: string
  title: string
  spaceKey: string
  body: string
  ancestors?: { id: string }[]
}

export interface IntegrationSyncResult {
  success: boolean
  itemsSynced: number
  errors: string[]
  syncedAt: Date
}

/**
 * Provider metadata for UI
 */
export const PROVIDER_INFO: Record<IntegrationProvider, ProviderInfo> = {
  jira: {
    id: 'jira',
    name: 'Jira',
    description: 'Export alerts as Jira issues and sync status updates',
    icon: 'JiraIcon',
    capabilities: ['export_alerts', 'import_issues', 'bidirectional_sync'],
  },
  confluence: {
    id: 'confluence',
    name: 'Confluence',
    description: 'Export evidence packs as Confluence pages',
    icon: 'ConfluenceIcon',
    capabilities: ['export_evidence'],
  },
  servicenow: {
    id: 'servicenow',
    name: 'ServiceNow',
    description: 'Sync with ServiceNow incidents and CMDB',
    icon: 'ServiceNowIcon',
    capabilities: ['export_alerts', 'import_issues', 'bidirectional_sync'],
  },
  slack: {
    id: 'slack',
    name: 'Slack',
    description: 'Send notifications to Slack channels',
    icon: 'SlackIcon',
    capabilities: ['notifications'],
  },
  teams: {
    id: 'teams',
    name: 'Microsoft Teams',
    description: 'Send notifications to Teams channels',
    icon: 'TeamsIcon',
    capabilities: ['notifications'],
  },
}

