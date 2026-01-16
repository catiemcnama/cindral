/**
 * Demo tRPC Router
 *
 * Handles demo mode configuration and customization.
 * Only available when IS_DEMO=true in environment.
 */

import { db } from '@/db'
import { demoConfig } from '@/db/schema'
import { TRPCError } from '@trpc/server'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { orgProcedure, router } from '../init'

const isDemoMode = process.env.IS_DEMO === 'true'

export const demoRouter = router({
  getConfig: orgProcedure.query(async ({ ctx }) => {
    if (!isDemoMode) {
      return { isDemo: false, displayName: null, displayLogo: null, displayDomain: null }
    }

    const config = await db.query.demoConfig.findFirst({
      where: eq(demoConfig.organizationId, ctx.activeOrganizationId),
    })

    return {
      isDemo: config?.isDemo ?? isDemoMode,
      displayName: config?.displayName ?? null,
      displayLogo: config?.displayLogo ?? null,
      displayDomain: config?.displayDomain ?? null,
    }
  }),

  updateConfig: orgProcedure
    .input(
      z.object({
        displayName: z.string().nullable().optional(),
        displayDomain: z.string().nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!isDemoMode) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Demo mode is not enabled' })
      }

      const existing = await db.query.demoConfig.findFirst({
        where: eq(demoConfig.organizationId, ctx.activeOrganizationId),
      })

      const displayLogo = input.displayDomain ? `https://logo.clearbit.com/${input.displayDomain}` : null

      if (existing) {
        await db
          .update(demoConfig)
          .set({
            displayName: input.displayName,
            displayDomain: input.displayDomain,
            displayLogo,
            updatedAt: new Date(),
          })
          .where(eq(demoConfig.id, existing.id))
      } else {
        await db.insert(demoConfig).values({
          id: `demo-${ctx.activeOrganizationId}`,
          organizationId: ctx.activeOrganizationId,
          isDemo: true,
          displayName: input.displayName,
          displayDomain: input.displayDomain,
          displayLogo,
        })
      }

      return { success: true }
    }),
})
