/**
 * Magic Demo Router
 *
 * Public endpoint for the 60-second compliance analysis demo.
 * No auth required - this IS the sales conversion funnel.
 */

import { calculateOutcomePricing, runMagicDemo, type CompanyProfile } from '@/lib/magic-demo'
import { z } from 'zod'
import { publicProcedure, router } from '../init'

export const magicDemoRouter = router({
  /**
   * The Magic Demo - paste description, get compliance analysis in <60 seconds
   *
   * This is the demo that closes deals:
   * "My company uses AWS, runs Python APIs, stores customer data in Postgres"
   * → Every DORA article that applies
   * → Which systems are affected
   * → Generated compliance evidence
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
        employeeCount: z.number().min(1).max(100000).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const profile: CompanyProfile = {
        description: input.description,
        industry: input.industry,
        region: input.region,
        employeeCount: input.employeeCount,
      }

      const result = await runMagicDemo(profile)
      const pricing = calculateOutcomePricing(result.metrics)

      return {
        ...result,
        pricing,
      }
    }),

  /**
   * Quick system detection preview (no AI, instant)
   * Use for live typing feedback
   */
  detectSystems: publicProcedure
    .input(z.object({ description: z.string().min(5).max(2000) }))
    .query(async ({ input }) => {
      // Import inline to avoid circular deps
      const { runMagicDemo } = await import('@/lib/magic-demo')

      // Just run detection, skip AI
      const startTime = Date.now()
      const result = await runMagicDemo({
        description: input.description,
      })

      return {
        systems: result.detectedSystems,
        articleCount: result.applicableArticles.length,
        detectionTimeMs: Date.now() - startTime,
      }
    }),
})
