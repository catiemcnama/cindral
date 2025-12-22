/**
 * Base integration interface for third-party providers
 */

import type { IntegrationConfig, IntegrationSyncResult } from './types'

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
   * Helper to make authenticated requests
   */
  protected async request<T>(
    url: string,
    config: IntegrationConfig,
    options?: RequestInit
  ): Promise<T> {
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

