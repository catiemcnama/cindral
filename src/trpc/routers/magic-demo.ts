/**
 * Magic Demo Router
 *
 * Public endpoint for the 60-second compliance analysis demo.
 * No auth required - this IS the sales conversion funnel.
 */

import { logger } from '@/lib/logger'
import { runMagicDemo, suggestPlan } from '@/lib/magic-demo'
import { z } from 'zod'
import { publicProcedure, router } from '../init'

export const magicDemoRouter = router({
  /**
   * The Magic Demo - paste description, get AI-powered compliance analysis
   */
  analyze: publicProcedure
    .input(
      z.object({
        description: z
          .string()
          .min(20, 'Please provide more detail about your tech stack')
          .max(2000, 'Description too long'),
        industry: z.enum(['fintech', 'banking', 'insurance', 'healthcare', 'saas', 'other']).optional(),
        region: z.enum(['EU', 'US', 'UK', 'APAC', 'other']).optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const result = await runMagicDemo({
          description: input.description,
          industry: input.industry,
          region: input.region,
        })

        return {
          ...result,
          pricing: suggestPlan(result.metrics),
        }
      } catch (error) {
        logger.error('Magic demo analysis failed', {
          error: error instanceof Error ? error.message : 'Unknown',
        })
        // Sanitized error for users
        throw new Error('Analysis temporarily unavailable. Please try again.')
      }
    }),
})
