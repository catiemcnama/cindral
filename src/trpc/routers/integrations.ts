import { integrations } from '@/db/schema'
import { recordAudit } from '@/lib/audit'
import { decryptObject, encryptObject, storeOAuthState, verifyOAuthState } from '@/lib/crypto'
import { AlreadyExistsError, NotFoundError, ValidationError } from '@/lib/errors'
import { getIntegration, PROVIDER_INFO, type IntegrationProvider } from '@/lib/integrations'
import type { IntegrationConfig } from '@/lib/integrations/types'
import { requireMutatePermission } from '@/lib/tenancy'
import { and, eq } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { z } from 'zod'
import { orgProcedure, router } from '../init'

export const integrationsRouter = router({
  /**
   * List all available integrations and their status
   */
  list: orgProcedure.query(async ({ ctx }) => {
    const orgIntegrations = await ctx.db.query.integrations.findMany({
      where: eq(integrations.organizationId, ctx.activeOrganizationId),
    })

    // Build a map of connected integrations
    const connectedMap = new Map(orgIntegrations.map((i) => [i.provider, i]))

    // Return all providers with their status
    return Object.values(PROVIDER_INFO).map((provider) => {
      const connected = connectedMap.get(provider.id as IntegrationProvider)
      return {
        ...provider,
        status: connected?.status ?? 'disconnected',
        lastSyncAt: connected?.lastSyncAt,
        lastError: connected?.lastError,
        integrationId: connected?.id,
      }
    })
  }),

  /**
   * Get details of a specific integration
   */
  getById: orgProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    const integration = await ctx.db.query.integrations.findFirst({
      where: and(eq(integrations.id, input.id), eq(integrations.organizationId, ctx.activeOrganizationId)),
    })

    if (!integration) {
      throw new NotFoundError('Integration', input.id)
    }

    return integration
  }),

  /**
   * Initiate OAuth connection for a provider
   */
  connect: orgProcedure
    .input(
      z.object({
        provider: z.enum(['jira', 'confluence', 'servicenow', 'slack', 'teams']),
      })
    )
    .mutation(async ({ ctx, input }) => {
      requireMutatePermission(ctx)

      const provider = input.provider as IntegrationProvider

      // Check if already connected
      const existing = await ctx.db.query.integrations.findFirst({
        where: and(eq(integrations.provider, provider), eq(integrations.organizationId, ctx.activeOrganizationId)),
      })

      if (existing && existing.status === 'connected') {
        throw new AlreadyExistsError('Integration', `${PROVIDER_INFO[provider].name}`)
      }

      // Generate OAuth state for CSRF protection
      const state = nanoid(32)
      const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/callback`

      // Get the integration handler
      const integration = getIntegration(provider)
      const authUrl = integration.getAuthUrl(redirectUri, state)

      // Store OAuth state for CSRF verification on callback
      storeOAuthState(state, ctx.activeOrganizationId, provider)

      // Store pending integration
      const id = nanoid()
      if (existing) {
        await ctx.db
          .update(integrations)
          .set({
            status: 'pending',
            lastError: null,
          })
          .where(eq(integrations.id, existing.id))
      } else {
        await ctx.db.insert(integrations).values({
          id,
          organizationId: ctx.activeOrganizationId,
          provider,
          name: PROVIDER_INFO[provider].name,
          status: 'pending',
          createdByUserId: ctx.user?.id,
        })
      }

      await recordAudit({
        ctx,
        action: 'create_regulation', // Reusing existing action type
        entityType: 'organization',
        entityId: ctx.activeOrganizationId,
        after: { action: 'integration_connect_initiated', provider },
      })

      return {
        authUrl,
        state,
        integrationId: existing?.id ?? id,
      }
    }),

  /**
   * Complete OAuth callback
   */
  completeCallback: orgProcedure
    .input(
      z.object({
        provider: z.enum(['jira', 'confluence', 'servicenow', 'slack', 'teams']),
        code: z.string(),
        state: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      requireMutatePermission(ctx)

      // Verify OAuth state to prevent CSRF attacks
      const provider = input.provider as IntegrationProvider
      const isValidState = verifyOAuthState(input.state, ctx.activeOrganizationId, provider)

      if (!isValidState) {
        throw new ValidationError('Invalid or expired OAuth state. Please try connecting again.')
      }
      const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/callback`

      // Get the integration handler
      const integration = getIntegration(provider)

      // Exchange code for tokens
      const config = await integration.exchangeCode(input.code, redirectUri)

      // Test the connection
      const testResult = await integration.testConnection(config)

      // Find the pending integration
      const pending = await ctx.db.query.integrations.findFirst({
        where: and(
          eq(integrations.provider, provider),
          eq(integrations.organizationId, ctx.activeOrganizationId),
          eq(integrations.status, 'pending')
        ),
      })

      if (!pending) {
        throw new NotFoundError('Pending integration', provider)
      }

      // Encrypt tokens before storing
      const encryptedConfig = encryptObject(config)

      // Update with encrypted connection details
      // Store encrypted config as a wrapper object
      await ctx.db
        .update(integrations)
        .set({
          config: { encrypted: encryptedConfig } as unknown as IntegrationConfig,
          status: testResult.success ? 'connected' : 'error',
          lastError: testResult.error,
          lastSyncAt: testResult.success ? new Date() : null,
        })
        .where(eq(integrations.id, pending.id))

      return {
        success: testResult.success,
        error: testResult.error,
      }
    }),

  /**
   * Disconnect an integration
   */
  disconnect: orgProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    requireMutatePermission(ctx)

    const integration = await ctx.db.query.integrations.findFirst({
      where: and(eq(integrations.id, input.id), eq(integrations.organizationId, ctx.activeOrganizationId)),
    })

    if (!integration) {
      throw new NotFoundError('Integration', input.id)
    }

    // Soft-disconnect (keep record for re-connection)
    await ctx.db
      .update(integrations)
      .set({
        status: 'disconnected',
        config: null,
        lastSyncAt: null,
      })
      .where(eq(integrations.id, input.id))

    await recordAudit({
      ctx,
      action: 'delete_regulation', // Reusing existing action type
      entityType: 'organization',
      entityId: ctx.activeOrganizationId,
      before: { action: 'integration_disconnected', provider: integration.provider },
    })

    return { success: true }
  }),

  /**
   * Trigger manual sync for an integration
   */
  sync: orgProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    requireMutatePermission(ctx)

    const integration = await ctx.db.query.integrations.findFirst({
      where: and(eq(integrations.id, input.id), eq(integrations.organizationId, ctx.activeOrganizationId)),
    })

    if (!integration) {
      throw new NotFoundError('Integration', input.id)
    }

    if (integration.status !== 'connected') {
      throw new ValidationError('Integration is not connected')
    }

    if (!integration.config) {
      throw new ValidationError('Integration config is missing')
    }

    // Decrypt the stored config
    const storedConfig = integration.config as { encrypted?: string } | IntegrationConfig
    let decryptedConfig: IntegrationConfig

    if ('encrypted' in storedConfig && storedConfig.encrypted) {
      const decrypted = decryptObject<IntegrationConfig>(storedConfig.encrypted)
      if (!decrypted) {
        throw new ValidationError('Failed to decrypt integration config')
      }
      decryptedConfig = decrypted
    } else {
      // Legacy unencrypted config (for backwards compatibility)
      decryptedConfig = storedConfig as IntegrationConfig
    }

    // Get the integration handler and sync
    const handler = getIntegration(integration.provider as IntegrationProvider)
    const result = await handler.sync(decryptedConfig)

    // Update sync timestamp
    await ctx.db
      .update(integrations)
      .set({
        lastSyncAt: result.syncedAt,
        lastError: result.errors.length > 0 ? result.errors.join('; ') : null,
        status: result.success ? 'connected' : 'error',
      })
      .where(eq(integrations.id, input.id))

    return result
  }),

  /**
   * Test integration connection
   */
  test: orgProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    const integration = await ctx.db.query.integrations.findFirst({
      where: and(eq(integrations.id, input.id), eq(integrations.organizationId, ctx.activeOrganizationId)),
    })

    if (!integration) {
      throw new NotFoundError('Integration', input.id)
    }

    if (!integration.config) {
      return { success: false, error: 'Not configured' }
    }

    // Decrypt the stored config
    const storedConfig = integration.config as { encrypted?: string } | IntegrationConfig
    let decryptedConfig: IntegrationConfig

    if ('encrypted' in storedConfig && storedConfig.encrypted) {
      const decrypted = decryptObject<IntegrationConfig>(storedConfig.encrypted)
      if (!decrypted) {
        return { success: false, error: 'Failed to decrypt config' }
      }
      decryptedConfig = decrypted
    } else {
      // Legacy unencrypted config
      decryptedConfig = storedConfig as IntegrationConfig
    }

    const handler = getIntegration(integration.provider as IntegrationProvider)
    return handler.testConnection(decryptedConfig)
  }),
})
