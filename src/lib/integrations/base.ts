/**
 * Base integration interface for third-party providers
 */

import type { IntegrationConfig, IntegrationSyncResult } from './types'

/**
 * Allowed external hosts for SSRF protection (A10:2021)
 * Only these hosts can be accessed by integration providers
 */
const ALLOWED_EXTERNAL_HOSTS = new Set([
  // Atlassian (Jira)
  'auth.atlassian.com',
  'api.atlassian.com',
  // Add other integration hosts here as needed:
  // 'api.github.com',
  // 'slack.com',
])

/**
 * Validate URL against SSRF attacks (OWASP A10:2021)
 * Ensures URL is HTTPS and points to an allowed external host
 */
function validateExternalUrl(url: string): void {
  try {
    const parsed = new URL(url)

    // Only allow HTTPS
    if (parsed.protocol !== 'https:') {
      throw new Error(`SSRF protection: Only HTTPS URLs are allowed, got ${parsed.protocol}`)
    }

    // Block internal/private IPs
    const hostname = parsed.hostname.toLowerCase()
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      hostname.startsWith('172.') ||
      hostname.endsWith('.local') ||
      hostname.endsWith('.internal')
    ) {
      throw new Error(`SSRF protection: Internal/private URLs are not allowed`)
    }

    // Check against allowlist
    // Allow subdomains of allowed hosts (e.g., your-domain.atlassian.net)
    const isAllowed = Array.from(ALLOWED_EXTERNAL_HOSTS).some(
      (allowed) => hostname === allowed || hostname.endsWith(`.${allowed.split('.').slice(-2).join('.')}`)
    )

    if (!isAllowed) {
      throw new Error(`SSRF protection: Host ${hostname} is not in the allowlist`)
    }
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('SSRF protection:')) {
      throw error
    }
    throw new Error(`SSRF protection: Invalid URL - ${url}`)
  }
}

export interface IntegrationProvider {
  /**
   * Provider identifier
   */
  readonly id: string

  /**
   * Initialize the OAuth flow - returns redirect URL
   */
  getAuthUrl(redirectUri: string, state: string): string

  /**
   * Exchange authorization code for tokens
   */
  exchangeCode(code: string, redirectUri: string): Promise<IntegrationConfig>

  /**
   * Refresh access token
   */
  refreshToken(config: IntegrationConfig): Promise<IntegrationConfig>

  /**
   * Test the connection
   */
  testConnection(config: IntegrationConfig): Promise<{ success: boolean; error?: string }>

  /**
   * Sync data from the provider
   */
  sync(config: IntegrationConfig): Promise<IntegrationSyncResult>
}

/**
 * Abstract base class for integration providers
 */
export abstract class BaseIntegrationProvider implements IntegrationProvider {
  abstract readonly id: string

  abstract getAuthUrl(redirectUri: string, state: string): string
  abstract exchangeCode(code: string, redirectUri: string): Promise<IntegrationConfig>
  abstract refreshToken(config: IntegrationConfig): Promise<IntegrationConfig>
  abstract testConnection(config: IntegrationConfig): Promise<{ success: boolean; error?: string }>
  abstract sync(config: IntegrationConfig): Promise<IntegrationSyncResult>

  /**
   * Helper to make authenticated requests with SSRF protection
   */
  protected async request<T>(url: string, config: IntegrationConfig, options?: RequestInit): Promise<T> {
    // Validate URL against SSRF attacks
    validateExternalUrl(url)

    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    })

    if (!response.ok) {
      throw new Error(`Integration request failed: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }
}
