/**
 * AI Router
 *
 * Provides AI-powered features for the compliance platform.
 */

import { articles, regulations, systems } from '@/db/schema'
import { assessImpact, clearCache, extractObligations, getCacheStats, summarize } from '@/lib/ai'
import { NotFoundError } from '@/lib/errors'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { orgProcedure, router } from '../init'

export const aiRouter = router({
  /**
   * Summarize an article
   */
  summarizeArticle: orgProcedure
    .input(
      z.object({
        articleId: z.string(),
        maxLength: z.number().min(50).max(500).optional().default(200),
        format: z.enum(['paragraph', 'bullets', 'structured']).optional().default('paragraph'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Get article
      const article = await ctx.db.query.articles.findFirst({
        where: and(eq(articles.id, input.articleId), eq(articles.organizationId, ctx.activeOrganizationId)),
        with: {
          regulation: true,
        },
      })

      if (!article) {
        throw new NotFoundError('Article', input.articleId)
      }

      // Get text to summarize
      const textToSummarize = article.normalizedText || article.rawText || article.description
      if (!textToSummarize) {
        throw new Error('Article has no text content to summarize')
      }

      // Generate summary
      const result = await summarize(textToSummarize, {
        maxLength: input.maxLength,
        format: input.format,
      })

      // Optionally update article with AI summary
      if (!article.aiSummary && !result.cached) {
        await ctx.db.update(articles).set({ aiSummary: result.data }).where(eq(articles.id, input.articleId))
      }

      return {
        articleId: input.articleId,
        articleTitle: article.title,
        regulationName: article.regulation?.name,
        summary: result.data,
        cached: result.cached,
        generatedAt: result.generatedAt,
        tokensUsed: result.tokensUsed,
      }
    }),

  /**
   * Extract obligations from an article
   */
  extractObligations: orgProcedure
    .input(
      z.object({
        articleId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const article = await ctx.db.query.articles.findFirst({
        where: and(eq(articles.id, input.articleId), eq(articles.organizationId, ctx.activeOrganizationId)),
      })

      if (!article) {
        throw new NotFoundError('Article', input.articleId)
      }

      const textToAnalyze = article.normalizedText || article.rawText
      if (!textToAnalyze) {
        throw new Error('Article has no text content to analyze')
      }

      const result = await extractObligations(textToAnalyze)

      return {
        articleId: input.articleId,
        obligations: result.data,
        cached: result.cached,
        generatedAt: result.generatedAt,
        tokensUsed: result.tokensUsed,
      }
    }),

  /**
   * Assess impact of a regulation on a system
   */
  assessImpact: orgProcedure
    .input(
      z.object({
        articleId: z.string(),
        systemId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Get article
      const article = await ctx.db.query.articles.findFirst({
        where: and(eq(articles.id, input.articleId), eq(articles.organizationId, ctx.activeOrganizationId)),
      })

      if (!article) {
        throw new NotFoundError('Article', input.articleId)
      }

      // Get system
      const system = await ctx.db.query.systems.findFirst({
        where: and(eq(systems.id, input.systemId), eq(systems.organizationId, ctx.activeOrganizationId)),
      })

      if (!system) {
        throw new NotFoundError('System', input.systemId)
      }

      const articleText = article.normalizedText || article.rawText || article.description
      if (!articleText) {
        throw new Error('Article has no text content to analyze')
      }

      const systemDescription = `
System: ${system.name}
Category: ${system.category || 'Not specified'}
Criticality: ${system.criticality || 'Not specified'}
Data Classification: ${system.dataClassification || 'Not specified'}
Description: ${system.description || 'No description provided'}
Owner: ${system.ownerTeam || 'Not specified'}
      `.trim()

      const result = await assessImpact(articleText, systemDescription)

      return {
        articleId: input.articleId,
        systemId: input.systemId,
        assessment: result.data,
        cached: result.cached,
        generatedAt: result.generatedAt,
        tokensUsed: result.tokensUsed,
      }
    }),

  /**
   * Summarize a full regulation
   */
  summarizeRegulation: orgProcedure
    .input(
      z.object({
        regulationId: z.string(),
        maxLength: z.number().min(100).max(1000).optional().default(500),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const regulation = await ctx.db.query.regulations.findFirst({
        where: and(eq(regulations.id, input.regulationId), eq(regulations.organizationId, ctx.activeOrganizationId)),
        with: {
          articles: {
            limit: 20, // First 20 articles
            orderBy: (articles, { asc }) => [asc(articles.articleNumber)],
          },
        },
      })

      if (!regulation) {
        throw new NotFoundError('Regulation', input.regulationId)
      }

      // Combine article summaries or text
      const articleTexts = regulation.articles
        .map((a) => {
          const text = a.aiSummary || a.normalizedText || a.rawText
          return text ? `Article ${a.articleNumber}: ${text.substring(0, 500)}` : null
        })
        .filter(Boolean)
        .join('\n\n')

      if (!articleTexts) {
        throw new Error('Regulation has no article content to summarize')
      }

      const textToSummarize = `
Regulation: ${regulation.name}
Framework: ${regulation.framework}
Full Title: ${regulation.fullTitle}

Key Articles:
${articleTexts}
      `.trim()

      const result = await summarize(textToSummarize, {
        maxLength: input.maxLength,
        format: 'structured',
      })

      return {
        regulationId: input.regulationId,
        regulationName: regulation.name,
        summary: result.data,
        articleCount: regulation.articles.length,
        cached: result.cached,
        generatedAt: result.generatedAt,
        tokensUsed: result.tokensUsed,
      }
    }),

  /**
   * Get AI cache statistics
   */
  getCacheStats: orgProcedure.query(async () => {
    return getCacheStats()
  }),

  /**
   * Clear AI cache
   */
  clearCache: orgProcedure
    .input(
      z.object({
        operation: z.enum(['summarize', 'extractObligations', 'assessImpact']).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const cleared = clearCache(input.operation)
      return { cleared }
    }),
})
