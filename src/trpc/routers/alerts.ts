import { alerts, auditLog } from '@/db/schema'
import { withAudit, withCreateAudit, withDeleteAudit } from '@/lib/audit'
import { NotFoundError } from '@/lib/errors'
import { requireMutatePermission, scopedAnd, scopedAndActive } from '@/lib/tenancy'
import { and, asc, desc, eq, isNull, sql } from 'drizzle-orm'
import { z } from 'zod'
import { orgProcedure, router } from '../init'

export const alertsRouter = router({
  /**
   * List alerts with filters
   */
  list: orgProcedure
    .input(
      z
        .object({
          type: z
            .enum(['obligation_overdue', 'regulation_changed', 'evidence_pack_failed', 'system_unmapped'])
            .optional(),
          severity: z.enum(['info', 'low', 'medium', 'high', 'critical']).optional(),
          status: z.enum(['open', 'in_triage', 'in_progress', 'resolved', 'wont_fix']).optional(),
          regulationId: z.string().optional(),
          assignedToUserId: z.string().optional(),
          limit: z.number().min(1).max(100).default(20),
          offset: z.number().min(0).default(0),
          sortBy: z.enum(['createdAt', 'severity', 'status', 'dueDate']).default('createdAt'),
          sortOrder: z.enum(['asc', 'desc']).default('desc'),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const {
        type,
        severity,
        status,
        regulationId,
        assignedToUserId,
        limit = 20,
        offset = 0,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = input ?? {}

      // Start with org-scoped condition + soft-delete filter (strict tenancy)
      const conditions = [eq(alerts.organizationId, ctx.activeOrganizationId), isNull(alerts.deletedAt)]

      if (type) {
        conditions.push(eq(alerts.type, type))
      }

      if (severity) {
        conditions.push(eq(alerts.severity, severity))
      }

      if (status) {
        conditions.push(eq(alerts.status, status))
      }

      if (regulationId) {
        conditions.push(eq(alerts.regulationId, regulationId))
      }

      if (assignedToUserId) {
        conditions.push(eq(alerts.assignedToUserId, assignedToUserId))
      }

      const alertsList = await ctx.db.query.alerts.findMany({
        where: and(...conditions),
        limit,
        offset,
        orderBy:
          sortOrder === 'asc'
            ? asc(alerts[sortBy as keyof typeof alerts.$inferSelect])
            : desc(alerts[sortBy as keyof typeof alerts.$inferSelect]),
        with: {
          regulation: {
            columns: { id: true, name: true },
          },
          article: {
            columns: { id: true, articleNumber: true, sectionTitle: true },
          },
          obligation: {
            columns: { id: true, title: true, status: true },
          },
          system: {
            columns: { id: true, name: true },
          },
          assignedTo: {
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
      const [openCount, inTriageCount, inProgressCount, criticalCount] = await Promise.all([
        ctx.db
          .select({ count: sql<number>`count(*)` })
          .from(alerts)
          .where(and(eq(alerts.organizationId, ctx.activeOrganizationId), eq(alerts.status, 'open'))),
        ctx.db
          .select({ count: sql<number>`count(*)` })
          .from(alerts)
          .where(and(eq(alerts.organizationId, ctx.activeOrganizationId), eq(alerts.status, 'in_triage'))),
        ctx.db
          .select({ count: sql<number>`count(*)` })
          .from(alerts)
          .where(and(eq(alerts.organizationId, ctx.activeOrganizationId), eq(alerts.status, 'in_progress'))),
        ctx.db
          .select({ count: sql<number>`count(*)` })
          .from(alerts)
          .where(
            and(
              eq(alerts.organizationId, ctx.activeOrganizationId),
              eq(alerts.severity, 'critical'),
              sql`${alerts.status} NOT IN ('resolved', 'wont_fix')`
            )
          ),
      ])

      return {
        items: alertsList,
        total: Number(totalResult[0]?.count ?? 0),
        stats: {
          open: Number(openCount[0]?.count ?? 0),
          inTriage: Number(inTriageCount[0]?.count ?? 0),
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
  getById: orgProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    const alert = await ctx.db.query.alerts.findFirst({
      where: scopedAndActive(alerts, ctx, eq(alerts.id, input.id)),
      with: {
        regulation: true,
        article: {
          with: {
            obligations: {
              where: eq(alerts.organizationId, ctx.activeOrganizationId),
            },
            systemImpacts: {
              with: {
                system: true,
              },
            },
          },
        },
        obligation: true,
        system: true,
        evidencePack: true,
        assignedTo: {
          columns: { id: true, name: true, email: true, image: true },
        },
        resolvedBy: {
          columns: { id: true, name: true, email: true },
        },
      },
    })

    if (!alert) {
      throw new NotFoundError('Alert', input.id)
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
        type: z.enum(['obligation_overdue', 'regulation_changed', 'evidence_pack_failed', 'system_unmapped']),
        severity: z.enum(['info', 'low', 'medium', 'high', 'critical']),
        regulationId: z.string().optional(),
        articleId: z.string().optional(),
        obligationId: z.string().optional(),
        systemId: z.string().optional(),
        assignedToUserId: z.string().optional(),
        dueDate: z.date().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      requireMutatePermission(ctx)

      return withCreateAudit(ctx, 'create_alert', 'alert', async () => {
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
      })
    }),

  /**
   * Update alert status
   */
  updateStatus: orgProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(['open', 'in_triage', 'in_progress', 'resolved', 'wont_fix']),
        resolutionNotes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      requireMutatePermission(ctx)

      return withAudit(ctx, 'update_alert_status', 'alert', input.id, async () => {
        const before = await ctx.db.query.alerts.findFirst({
          where: scopedAnd(alerts, ctx, eq(alerts.id, input.id)),
        })

        const updateData: Record<string, unknown> = { status: input.status }

        // If resolving, set resolution fields
        if (input.status === 'resolved' || input.status === 'wont_fix') {
          updateData.resolvedAt = new Date()
          updateData.resolvedByUserId = ctx.user.id
          if (input.resolutionNotes) {
            updateData.resolutionNotes = input.resolutionNotes
          }
        }

        const [after] = await ctx.db
          .update(alerts)
          .set(updateData)
          .where(scopedAnd(alerts, ctx, eq(alerts.id, input.id)))
          .returning()

        return { before, after, result: after }
      })
    }),

  /**
   * Assign alert to a user
   */
  assign: orgProcedure
    .input(
      z.object({
        id: z.string(),
        assignedToUserId: z.string().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      requireMutatePermission(ctx)

      return withAudit(ctx, 'assign_alert', 'alert', input.id, async () => {
        const before = await ctx.db.query.alerts.findFirst({
          where: scopedAnd(alerts, ctx, eq(alerts.id, input.id)),
        })

        const [after] = await ctx.db
          .update(alerts)
          .set({ assignedToUserId: input.assignedToUserId })
          .where(scopedAnd(alerts, ctx, eq(alerts.id, input.id)))
          .returning()

        return { before, after, result: after }
      })
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
        type: z
          .enum(['obligation_overdue', 'regulation_changed', 'evidence_pack_failed', 'system_unmapped'])
          .optional(),
        severity: z.enum(['info', 'low', 'medium', 'high', 'critical']).optional(),
        status: z.enum(['open', 'in_triage', 'in_progress', 'resolved', 'wont_fix']).optional(),
        assignedToUserId: z.string().nullable().optional(),
        dueDate: z.date().nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      requireMutatePermission(ctx)

      return withAudit(ctx, 'update_alert', 'alert', input.id, async () => {
        const { id, ...updates } = input

        const before = await ctx.db.query.alerts.findFirst({
          where: scopedAnd(alerts, ctx, eq(alerts.id, id)),
        })

        const [after] = await ctx.db
          .update(alerts)
          .set(updates)
          .where(scopedAnd(alerts, ctx, eq(alerts.id, id)))
          .returning()

        return { before, after, result: after }
      })
    }),

  /**
   * Delete an alert
   */
  delete: orgProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    requireMutatePermission(ctx)

    return withDeleteAudit(
      ctx,
      'delete_alert',
      'alert',
      input.id,
      () =>
        ctx.db.query.alerts.findFirst({
          where: scopedAnd(alerts, ctx, eq(alerts.id, input.id)),
        }),
      () => ctx.db.delete(alerts).where(scopedAnd(alerts, ctx, eq(alerts.id, input.id)))
    )
  }),

  /**
   * Bulk update alert status
   */
  bulkUpdateStatus: orgProcedure
    .input(
      z.object({
        ids: z.array(z.string()).min(1).max(100),
        status: z.enum(['open', 'in_triage', 'in_progress', 'resolved', 'wont_fix']),
      })
    )
    .mutation(async ({ ctx, input }) => {
      requireMutatePermission(ctx)

      // Use transaction to ensure atomicity
      return ctx.db.transaction(async (tx) => {
        const results: Array<{ id: string; success: boolean }> = []

        for (const id of input.ids) {
          const before = await tx.query.alerts.findFirst({
            where: scopedAnd(alerts, ctx, eq(alerts.id, id)),
          })

          if (!before) {
            results.push({ id, success: false })
            continue
          }

          const [after] = await tx
            .update(alerts)
            .set({ status: input.status })
            .where(scopedAnd(alerts, ctx, eq(alerts.id, id)))
            .returning()

          if (after) {
            await tx.insert(auditLog).values({
              organizationId: ctx.activeOrganizationId,
              actorUserId: ctx.user.id,
              action: 'update_alert_status',
              entityType: 'alert',
              entityId: id,
              diff: { before, after },
            })
            results.push({ id, success: true })
          }
        }

        return { updated: results.filter((r) => r.success).length, results }
      })
    }),

  /**
   * Bulk assign alerts
   */
  bulkAssign: orgProcedure
    .input(
      z.object({
        ids: z.array(z.string()).min(1).max(100),
        assignedToUserId: z.string().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      requireMutatePermission(ctx)

      // Use transaction to ensure atomicity
      return ctx.db.transaction(async (tx) => {
        const results: Array<{ id: string; success: boolean }> = []

        for (const id of input.ids) {
          const before = await tx.query.alerts.findFirst({
            where: scopedAnd(alerts, ctx, eq(alerts.id, id)),
          })

          if (!before) {
            results.push({ id, success: false })
            continue
          }

          const [after] = await tx
            .update(alerts)
            .set({ assignedToUserId: input.assignedToUserId })
            .where(scopedAnd(alerts, ctx, eq(alerts.id, id)))
            .returning()

          if (after) {
            await tx.insert(auditLog).values({
              organizationId: ctx.activeOrganizationId,
              actorUserId: ctx.user.id,
              action: 'assign_alert',
              entityType: 'alert',
              entityId: id,
              diff: { before, after },
            })
            results.push({ id, success: true })
          }
        }

        return { updated: results.filter((r) => r.success).length, results }
      })
    }),
})
