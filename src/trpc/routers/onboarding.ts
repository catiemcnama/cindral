/**
 * Onboarding Router
 *
 * Handles onboarding wizard persistence and completion.
 */

import { onboardingState, systems } from '@/db/schema'
import { NotFoundError } from '@/lib/errors'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

import { orgProcedure, router } from '../init'

// =============================================================================
// Input Schemas
// =============================================================================

const customSystemSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
})

const pendingInviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(['owner', 'admin', 'member']),
})

const updateStepSchema = z.object({
  currentStep: z.number().min(1).max(4).optional(),
  industry: z.string().optional(),
  selectedRegulations: z.array(z.string()).optional(),
  regulationsCustomized: z.boolean().optional(),
  selectedSystemTemplates: z.array(z.string()).optional(),
  customSystems: z.array(customSystemSchema).optional(),
  systemsCustomized: z.boolean().optional(),
  pendingInvites: z.array(pendingInviteSchema).optional(),
})

// =============================================================================
// Onboarding Router
// =============================================================================

export const onboardingRouter = router({
  /**
   * Get current onboarding state for organization
   */
  getState: orgProcedure.query(async ({ ctx }) => {
    const state = await ctx.db.query.onboardingState.findFirst({
      where: eq(onboardingState.organizationId, ctx.activeOrganizationId),
    })

    if (!state) {
      // Create default state if not exists
      const [newState] = await ctx.db
        .insert(onboardingState)
        .values({
          organizationId: ctx.activeOrganizationId,
          currentStep: 1,
        })
        .returning()

      return {
        id: newState.id,
        currentStep: newState.currentStep,
        completedAt: newState.completedAt,
        industry: newState.industry,
        selectedRegulations: newState.selectedRegulations ?? [],
        regulationsCustomized: newState.regulationsCustomized === 1,
        selectedSystemTemplates: newState.selectedSystemTemplates ?? [],
        customSystems: newState.customSystems ?? [],
        systemsCustomized: newState.systemsCustomized === 1,
        pendingInvites: newState.pendingInvites ?? [],
        isComplete: false,
      }
    }

    return {
      id: state.id,
      currentStep: state.currentStep,
      completedAt: state.completedAt,
      industry: state.industry,
      selectedRegulations: state.selectedRegulations ?? [],
      regulationsCustomized: state.regulationsCustomized === 1,
      selectedSystemTemplates: state.selectedSystemTemplates ?? [],
      customSystems: state.customSystems ?? [],
      systemsCustomized: state.systemsCustomized === 1,
      pendingInvites: state.pendingInvites ?? [],
      isComplete: state.completedAt !== null,
    }
  }),

  /**
   * Update onboarding step progress
   */
  updateStep: orgProcedure.input(updateStepSchema).mutation(async ({ ctx, input }) => {
    const existing = await ctx.db.query.onboardingState.findFirst({
      where: eq(onboardingState.organizationId, ctx.activeOrganizationId),
    })

    const updateData: Partial<typeof onboardingState.$inferInsert> = {
      updatedAt: new Date(),
    }

    if (input.currentStep !== undefined) updateData.currentStep = input.currentStep
    if (input.industry !== undefined) updateData.industry = input.industry
    if (input.selectedRegulations !== undefined) updateData.selectedRegulations = input.selectedRegulations
    if (input.regulationsCustomized !== undefined)
      updateData.regulationsCustomized = input.regulationsCustomized ? 1 : 0
    if (input.selectedSystemTemplates !== undefined) updateData.selectedSystemTemplates = input.selectedSystemTemplates
    if (input.customSystems !== undefined) updateData.customSystems = input.customSystems
    if (input.systemsCustomized !== undefined) updateData.systemsCustomized = input.systemsCustomized ? 1 : 0
    if (input.pendingInvites !== undefined) updateData.pendingInvites = input.pendingInvites

    if (existing) {
      const [updated] = await ctx.db
        .update(onboardingState)
        .set(updateData)
        .where(eq(onboardingState.organizationId, ctx.activeOrganizationId))
        .returning()

      return { success: true, state: updated }
    }

    // Create if not exists
    const [created] = await ctx.db
      .insert(onboardingState)
      .values({
        organizationId: ctx.activeOrganizationId,
        ...updateData,
      })
      .returning()

    return { success: true, state: created }
  }),

  /**
   * Complete onboarding - triggers setup actions
   */
  complete: orgProcedure.mutation(async ({ ctx }) => {
    // Get or create onboarding state
    let state = await ctx.db.query.onboardingState.findFirst({
      where: eq(onboardingState.organizationId, ctx.activeOrganizationId),
    })

    // If no state exists, create a default one first
    if (!state) {
      const [newState] = await ctx.db
        .insert(onboardingState)
        .values({
          organizationId: ctx.activeOrganizationId,
          currentStep: 4, // Mark as on final step
        })
        .returning()
      state = newState
    }

    // Mark as complete
    await ctx.db
      .update(onboardingState)
      .set({
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(onboardingState.organizationId, ctx.activeOrganizationId))

    // Create systems from templates (if any selected)
    const systemTemplates = state.selectedSystemTemplates ?? []
    const customSystems = (state.customSystems ?? []) as Array<{ id: string; name: string; description: string }>

    // Map template criticality to DB severity enum
    const criticalityToSeverity: Record<string, 'critical' | 'high' | 'medium' | 'low'> = {
      core: 'critical',
      important: 'high',
      support: 'medium',
    }

    let systemsCreated = 0

    // Create template-based systems
    for (const templateId of systemTemplates) {
      const template = SYSTEM_TEMPLATES[templateId]
      if (template) {
        try {
          await ctx.db
            .insert(systems)
            .values({
              id: `${ctx.activeOrganizationId}-${templateId}`,
              organizationId: ctx.activeOrganizationId,
              name: template.name,
              description: template.description,
              category: template.category,
              criticality: criticalityToSeverity[template.criticality] ?? 'medium',
              tags: template.tags,
            })
            .onConflictDoNothing()
          systemsCreated++
        } catch {
          // Ignore duplicate/conflict errors
        }
      }
    }

    // Create custom systems
    for (const custom of customSystems) {
      try {
        await ctx.db
          .insert(systems)
          .values({
            id: `${ctx.activeOrganizationId}-custom-${custom.id}`,
            organizationId: ctx.activeOrganizationId,
            name: custom.name,
            description: custom.description || '',
            category: 'Custom',
            criticality: 'high',
          })
          .onConflictDoNothing()
        systemsCreated++
      } catch {
        // Ignore duplicate/conflict errors
      }
    }

    return {
      success: true,
      message: 'Onboarding completed successfully',
      regulationsSelected: state.selectedRegulations?.length ?? 0,
      systemsCreated,
      invitesPending: (state.pendingInvites as Array<unknown>)?.length ?? 0,
    }
  }),

  /**
   * Check if onboarding is complete
   */
  isComplete: orgProcedure.query(async ({ ctx }) => {
    const state = await ctx.db.query.onboardingState.findFirst({
      where: eq(onboardingState.organizationId, ctx.activeOrganizationId),
      columns: { completedAt: true },
    })

    // Use !! to properly check for truthy completedAt
    // (state?.completedAt !== null would return true for undefined)
    return {
      isComplete: !!state?.completedAt,
      completedAt: state?.completedAt ?? null,
    }
  }),
})

// =============================================================================
// System Templates (reference data)
// =============================================================================

const SYSTEM_TEMPLATES: Record<
  string,
  { name: string; description: string; category: string; criticality: 'core' | 'important' | 'support'; tags: string[] }
> = {
  'core-platform': {
    name: 'Core Platform',
    description: 'Core transaction processing, policy admin, or account ledgers.',
    category: 'Core',
    criticality: 'core',
    tags: ['Ledger', 'Accounts', 'Transactions'],
  },
  'payments-gateway': {
    name: 'Payments Gateway',
    description: 'Card issuing, payment routing, and settlement workflows.',
    category: 'Payments',
    criticality: 'core',
    tags: ['Processing', 'Settlement', 'ISO 20022'],
  },
  'identity-access': {
    name: 'Identity & Access',
    description: 'SSO, MFA, privileged access, and access review workflows.',
    category: 'Security',
    criticality: 'core',
    tags: ['IAM', 'MFA', 'Access reviews'],
  },
  'cloud-infrastructure': {
    name: 'Cloud Infrastructure',
    description: 'Hosting, runtime environments, and infrastructure tooling.',
    category: 'Infrastructure',
    criticality: 'core',
    tags: ['AWS', 'Azure', 'GCP'],
  },
  'data-warehouse': {
    name: 'Data Warehouse',
    description: 'Analytics, reporting, audit exports, and data governance.',
    category: 'Data',
    criticality: 'important',
    tags: ['BI', 'Reporting', 'Audit'],
  },
  'backup-recovery': {
    name: 'Backup & Recovery',
    description: 'Disaster recovery, backups, and resilience tooling.',
    category: 'Resilience',
    criticality: 'important',
    tags: ['DR', 'RPO/RTO', 'Archival'],
  },
  'ai-platform': {
    name: 'AI/ML Platform',
    description: 'Model training, inference services, and governance controls.',
    category: 'AI',
    criticality: 'support',
    tags: ['Model risk', 'Explainability'],
  },
}
