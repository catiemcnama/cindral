/**
 * Global Search Router
 *
 * Provides fuzzy search across all entity types with pg_trgm for similarity matching.
 */

import { alerts, articles, obligations, regulations, systems } from '@/db/schema'
import { and, eq, ilike, or } from 'drizzle-orm'
import { z } from 'zod'

import { orgProcedure, router } from '../init'

// =============================================================================
// Types
// =============================================================================

const searchInputSchema = z.object({
  query: z.string().min(1).max(200),
  types: z.array(z.enum(['regulations', 'articles', 'obligations', 'systems', 'alerts'])).optional(),
  limit: z.number().min(1).max(50).default(10),
})

// =============================================================================
// Search Router
// =============================================================================

export const searchRouter = router({
  /**
   * Global search across all entity types
   * Uses ILIKE for pattern matching (pg_trgm can be added via migration)
   */
  global: orgProcedure.input(searchInputSchema).query(async ({ ctx, input }) => {
    const { query, types, limit } = input
    const orgId = ctx.activeOrganizationId

    // Escape LIKE special characters and prepare search pattern
    const escapedQuery = query.replace(/[%_\\]/g, '\\$&')
    const pattern = `%${escapedQuery}%`

    // Determine which types to search
    const searchTypes = types ?? ['regulations', 'articles', 'obligations', 'systems', 'alerts']

    // Execute searches in parallel
    const [regsResult, articlesResult, oblsResult, systemsResult, alertsResult] = await Promise.all([
      // Regulations search
      searchTypes.includes('regulations')
        ? ctx.db.query.regulations.findMany({
            where: and(
              eq(regulations.organizationId, orgId),
              or(
                ilike(regulations.name, pattern),
                ilike(regulations.fullTitle, pattern),
                ilike(regulations.framework, pattern)
              )
            ),
            limit,
            columns: {
              id: true,
              name: true,
              fullTitle: true,
              framework: true,
              jurisdiction: true,
            },
          })
        : Promise.resolve([]),

      // Articles search
      searchTypes.includes('articles')
        ? ctx.db.query.articles.findMany({
            where: and(
              eq(articles.organizationId, orgId),
              or(
                ilike(articles.articleNumber, pattern),
                ilike(articles.title, pattern),
                ilike(articles.aiSummary, pattern)
              )
            ),
            limit,
            columns: {
              id: true,
              articleNumber: true,
              title: true,
              regulationId: true,
            },
            with: {
              regulation: {
                columns: { id: true, name: true },
              },
            },
          })
        : Promise.resolve([]),

      // Obligations search
      searchTypes.includes('obligations')
        ? ctx.db.query.obligations.findMany({
            where: and(
              eq(obligations.organizationId, orgId),
              or(ilike(obligations.title, pattern), ilike(obligations.summary, pattern))
            ),
            limit,
            columns: {
              id: true,
              title: true,
              status: true,
            },
          })
        : Promise.resolve([]),

      // Systems search
      searchTypes.includes('systems')
        ? ctx.db.query.systems.findMany({
            where: and(
              eq(systems.organizationId, orgId),
              or(ilike(systems.name, pattern), ilike(systems.description, pattern), ilike(systems.category, pattern))
            ),
            limit,
            columns: {
              id: true,
              name: true,
              category: true,
              criticality: true,
            },
          })
        : Promise.resolve([]),

      // Alerts search
      searchTypes.includes('alerts')
        ? ctx.db.query.alerts.findMany({
            where: and(
              eq(alerts.organizationId, orgId),
              or(ilike(alerts.title, pattern), ilike(alerts.description, pattern))
            ),
            limit,
            columns: {
              id: true,
              title: true,
              severity: true,
              status: true,
            },
          })
        : Promise.resolve([]),
    ])

    return {
      regulations: regsResult.map((r) => ({
        id: r.id,
        name: r.name,
        subtitle: r.framework ?? r.jurisdiction ?? undefined,
        match: extractMatch(query, r.name, r.fullTitle),
      })),
      articles: articlesResult.map((a) => ({
        id: a.id,
        title: a.title ?? `Article ${a.articleNumber}`,
        regulationName: a.regulation?.name ?? 'Unknown',
        regulationId: a.regulationId,
        match: extractMatch(query, a.title, a.articleNumber),
      })),
      obligations: oblsResult.map((o) => ({
        id: o.id,
        title: o.title,
        status: o.status,
        match: extractMatch(query, o.title),
      })),
      systems: systemsResult.map((s) => ({
        id: s.id,
        name: s.name,
        category: s.category,
        criticality: s.criticality,
        match: extractMatch(query, s.name),
      })),
      alerts: alertsResult.map((a) => ({
        id: a.id,
        title: a.title,
        severity: a.severity,
        status: a.status,
        match: extractMatch(query, a.title),
      })),
      query,
      totalResults:
        regsResult.length + articlesResult.length + oblsResult.length + systemsResult.length + alertsResult.length,
    }
  }),

  /**
   * Quick search suggestions (lightweight, for autocomplete)
   */
  suggestions: orgProcedure
    .input(z.object({ query: z.string().min(1).max(100), limit: z.number().min(1).max(10).default(5) }))
    .query(async ({ ctx, input }) => {
      const { query, limit } = input
      const orgId = ctx.activeOrganizationId
      const pattern = `%${query}%`

      // Search regulations and systems only for quick suggestions
      const [regs, syss] = await Promise.all([
        ctx.db.query.regulations.findMany({
          where: and(eq(regulations.organizationId, orgId), ilike(regulations.name, pattern)),
          limit,
          columns: { id: true, name: true },
        }),
        ctx.db.query.systems.findMany({
          where: and(eq(systems.organizationId, orgId), ilike(systems.name, pattern)),
          limit,
          columns: { id: true, name: true },
        }),
      ])

      return [
        ...regs.map((r) => ({ type: 'regulation' as const, id: r.id, name: r.name })),
        ...syss.map((s) => ({ type: 'system' as const, id: s.id, name: s.name })),
      ].slice(0, limit)
    }),
})

// =============================================================================
// Helpers
// =============================================================================

/**
 * Extract a snippet showing where the query matched
 */
function extractMatch(query: string, ...fields: (string | null | undefined)[]): string {
  const lowerQuery = query.toLowerCase()

  for (const field of fields) {
    if (!field) continue
    const lowerField = field.toLowerCase()
    const idx = lowerField.indexOf(lowerQuery)
    if (idx !== -1) {
      const start = Math.max(0, idx - 20)
      const end = Math.min(field.length, idx + query.length + 40)
      let snippet = field.slice(start, end)
      if (start > 0) snippet = '...' + snippet
      if (end < field.length) snippet = snippet + '...'
      return snippet
    }
  }

  // No match found, return first field truncated
  const first = fields.find(Boolean)
  if (first && first.length > 60) {
    return first.slice(0, 60) + '...'
  }
  return first ?? ''
}
