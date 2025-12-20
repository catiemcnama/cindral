import { alerts } from '@/db/schema'
import { z } from 'zod'
import { orgProcedure, router } from '../init'
import { eq, and, sql, desc, asc } from 'drizzle-orm'

export const alertsRouter = router({
  /**
   * List alerts with filters
   */
  list: orgProcedure
    .input(
      z.object({
        severity: z.enum(['critical', 'high', 'medium', 'low']).optional(),
        status: z.enum(['open', 'in_progress', 'resolved']).optional(),
        regulationId: z.string().optional(),
        ownerId: z.string().optional(),
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
        sortBy: z.enum(['createdAt', 'severity', 'status']).default('createdAt'),
        sortOrder: z.enum(['asc', 'desc']).default('desc'),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const { 
        severity, 
        status, 
        regulationId, 
        ownerId,
        limit = 20, 
        offset = 0,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = input ?? {}

      const conditions = [
        eq(alerts.organizationId, ctx.activeOrganizationId),
      ]

      if (severity) {
        conditions.push(eq(alerts.severity, severity))
      }

      if (status) {
        conditions.push(eq(alerts.status, status))
      }

      if (regulationId) {
        conditions.push(eq(alerts.regulationId, regulationId))
      }

      if (ownerId) {
        conditions.push(eq(alerts.ownerId, ownerId))
      }

      const alertsList = await ctx.db.query.alerts.findMany({
        where: and(...conditions),
        limit,
        offset,
        orderBy: sortOrder === 'asc'
          ? asc(alerts[sortBy as keyof typeof alerts.$inferSelect])
          : desc(alerts[sortBy as keyof typeof alerts.$inferSelect]),
        with: {
          regulation: {
            columns: { id: true, name: true },
          },
          article: {
            columns: { id: true, articleNumber: true, sectionTitle: true },
          },
          owner: {
            columns: { id: true, name: true, email: true, image: true },
          },
        },
      })

      // Get total count
      const totalResult = await ctx.db
        .select({ count: sql<number>`count(*)` })
        .from(alerts)
        .where(and(...conditions))

      // Get counts by status for stats
      const openCount = await ctx.db
        .select({ count: sql<number>`count(*)` })
        .from(alerts)
        .where(and(
          eq(alerts.organizationId, ctx.activeOrganizationId),
          eq(alerts.status, 'open')
        ))

      const inProgressCount = await ctx.db
        .select({ count: sql<number>`count(*)` })
        .from(alerts)
        .where(and(
          eq(alerts.organizationId, ctx.activeOrganizationId),
          eq(alerts.status, 'in_progress')
        ))

      const criticalCount = await ctx.db
        .select({ count: sql<number>`count(*)` })
        .from(alerts)
        .where(and(
          eq(alerts.organizationId, ctx.activeOrganizationId),
          eq(alerts.severity, 'critical'),
          sql`${alerts.status} != 'resolved'`
        ))

      return {
        items: alertsList,
        total: Number(totalResult[0]?.count ?? 0),
        stats: {
          open: Number(openCount[0]?.count ?? 0),
          inProgress: Number(inProgressCount[0]?.count ?? 0),
          critical: Number(criticalCount[0]?.count ?? 0),
        },
        limit,
        offset,
      }
    }),

  /**
   * Get a single alert by ID with full details
   */
  getById: orgProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const alert = await ctx.db.query.alerts.findFirst({
        where: and(
          eq(alerts.id, input.id),
          eq(alerts.organizationId, ctx.activeOrganizationId)
        ),
        with: {
          regulation: true,
          article: {
            with: {
              obligations: true,
              systemImpacts: {
                with: {
                  system: true,
                },
              },
            },
          },
          owner: {
            columns: { id: true, name: true, email: true, image: true },
          },
        },
      })

      if (!alert) {
        throw new Error('Alert not found')
      }

      return alert
    }),

  /**
   * Create a new alert
   */
  create: orgProcedure
    .input(
      z.object({
        title: z.string().min(1).max(500),
        description: z.string().optional(),
        severity: z.enum(['critical', 'high', 'medium', 'low']),
        regulationId: z.string().optional(),
        articleId: z.string().optional(),
        ownerId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Generate alert ID
      const countResult = await ctx.db
        .select({ count: sql<number>`count(*)` })
        .from(alerts)
        .where(eq(alerts.organizationId, ctx.activeOrganizationId))

      const count = Number(countResult[0]?.count ?? 0)
      const id = `ALT-${String(count + 1).padStart(3, '0')}`

      const [alert] = await ctx.db
        .insert(alerts)
        .values({
          ...input,
          id,
          status: 'open',
          organizationId: ctx.activeOrganizationId,
        })
        .returning()

      return alert
    }),

  /**
   * Update alert status
   */
  updateStatus: orgProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(['open', 'in_progress', 'resolved']),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [alert] = await ctx.db
        .update(alerts)
        .set({ status: input.status })
        .where(and(
          eq(alerts.id, input.id),
          eq(alerts.organizationId, ctx.activeOrganizationId)
        ))
        .returning()

      return alert
    }),

  /**
   * Assign alert to a user
   */
  assign: orgProcedure
    .input(
      z.object({
        id: z.string(),
        ownerId: z.string().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [alert] = await ctx.db
        .update(alerts)
        .set({ ownerId: input.ownerId })
        .where(and(
          eq(alerts.id, input.id),
          eq(alerts.organizationId, ctx.activeOrganizationId)
        ))
        .returning()

      return alert
    }),

  /**
   * Update alert (full update)
   */
  update: orgProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1).max(500).optional(),
        description: z.string().optional(),
        severity: z.enum(['critical', 'high', 'medium', 'low']).optional(),
        status: z.enum(['open', 'in_progress', 'resolved']).optional(),
        ownerId: z.string().nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updates } = input

      const [alert] = await ctx.db
        .update(alerts)
        .set(updates)
        .where(and(
          eq(alerts.id, id),
          eq(alerts.organizationId, ctx.activeOrganizationId)
        ))
        .returning()

      return alert
    }),

  /**
   * Delete an alert
   */
  delete: orgProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(alerts)
        .where(and(
          eq(alerts.id, input.id),
          eq(alerts.organizationId, ctx.activeOrganizationId)
        ))

      return { success: true }
    }),

  /**
   * Bulk update alert status
   */
  bulkUpdateStatus: orgProcedure
    .input(
      z.object({
        ids: z.array(z.string()),
        status: z.enum(['open', 'in_progress', 'resolved']),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updated = await Promise.all(
        input.ids.map(id =>
          ctx.db
            .update(alerts)
            .set({ status: input.status })
            .where(and(
              eq(alerts.id, id),
              eq(alerts.organizationId, ctx.activeOrganizationId)
            ))
            .returning()
        )
      )

      return { updated: updated.flat().length }
    }),

  /**
   * Bulk assign alerts
   */
  bulkAssign: orgProcedure
    .input(
      z.object({
        ids: z.array(z.string()),
        ownerId: z.string().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updated = await Promise.all(
        input.ids.map(id =>
          ctx.db
            .update(alerts)
            .set({ ownerId: input.ownerId })
            .where(and(
              eq(alerts.id, id),
              eq(alerts.organizationId, ctx.activeOrganizationId)
            ))
            .returning()
        )
      )

      return { updated: updated.flat().length }
    }),
})
