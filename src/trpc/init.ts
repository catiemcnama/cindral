import { db } from '@/db'
import { auth } from '@/lib/auth'
import { formatTRPCError } from '@/lib/errors'
import { logger } from '@/lib/logger'
import { TRPCError, initTRPC } from '@trpc/server'
import { headers } from 'next/headers'
import { cache } from 'react'
import superjson from 'superjson'
import { createRateLimitMiddleware, createTimingMiddleware } from './middleware'

// =============================================================================
// Context
// =============================================================================

export const createTRPCContext = cache(async () => {
  /**
   * Get the session from better-auth
   * @see: https://trpc.io/docs/server/context
   */
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  return {
    db,
    session,
    user: session?.user ?? null,
  }
})

// =============================================================================
// tRPC Initialization
// =============================================================================

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    // Use our custom error formatter
    const formatted = formatTRPCError(error)

    return {
      ...shape,
      data: {
        ...shape.data,
        ...formatted.data,
        code: formatted.code,
      },
    }
  },
})

// =============================================================================
// Base Middleware
// =============================================================================

/**
 * Timing middleware - adds request ID and duration logging
 */
const timingMiddleware = t.middleware(
  createTimingMiddleware({
    skipLogging: (path) => path === 'hello' || path.includes('health'),
  })
)

/**
 * Query rate limit middleware
 */
const queryRateLimitMiddleware = t.middleware(
  createRateLimitMiddleware({
    type: 'query',
    skip: (ctx) => process.env.NODE_ENV === 'test',
  })
)

/**
 * Mutation rate limit middleware
 */
const mutationRateLimitMiddleware = t.middleware(
  createRateLimitMiddleware({
    type: 'mutation',
    skip: (ctx) => process.env.NODE_ENV === 'test',
  })
)

/**
 * Bulk operation rate limit middleware
 */
const bulkRateLimitMiddleware = t.middleware(
  createRateLimitMiddleware({
    type: 'bulk',
    skip: (ctx) => process.env.NODE_ENV === 'test',
  })
)

// =============================================================================
// Exports
// =============================================================================

export const router = t.router

/**
 * Public procedure - no authentication required
 * Includes: timing
 */
export const publicProcedure = t.procedure.use(timingMiddleware)

/**
 * Protected procedure - requires authentication
 * Includes: timing, rate limiting (query)
 */
export const protectedProcedure = t.procedure
  .use(timingMiddleware)
  .use(queryRateLimitMiddleware)
  .use(async (opts) => {
    const { ctx } = opts

    if (!ctx.session || !ctx.user) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'You must be logged in to perform this action',
      })
    }

    return opts.next({
      ctx: {
        ...ctx,
        session: ctx.session,
        user: ctx.user,
      },
    })
  })

/**
 * Organization-protected procedure - requires active organization
 * Includes: timing, rate limiting (query), auth, org membership
 */
export const orgProcedure = protectedProcedure.use(async (opts) => {
  const { ctx } = opts

  const activeOrgId = ctx.session.session.activeOrganizationId

  if (!activeOrgId) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'You must have an active organization to perform this action',
    })
  }

  // Get the member record to check permissions
  const member = await ctx.db.query.member.findFirst({
    where: (member, { and, eq }) => and(eq(member.userId, ctx.user.id), eq(member.organizationId, activeOrgId)),
  })

  if (!member) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'You are not a member of this organization',
    })
  }

  return opts.next({
    ctx: {
      ...ctx,
      activeOrganizationId: activeOrgId,
      member,
    },
  })
})

/**
 * Mutation procedure - for data modifications
 * Includes: timing, rate limiting (mutation), auth, org membership
 */
export const mutationProcedure = t.procedure
  .use(timingMiddleware)
  .use(mutationRateLimitMiddleware)
  .use(async (opts) => {
    const { ctx } = opts

    if (!ctx.session || !ctx.user) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'You must be logged in to perform this action',
      })
    }

    const activeOrgId = ctx.session.session.activeOrganizationId

    if (!activeOrgId) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You must have an active organization to perform this action',
      })
    }

    const user = ctx.user!
    const member = await ctx.db.query.member.findFirst({
      where: (member, { and, eq }) => and(eq(member.userId, user.id), eq(member.organizationId, activeOrgId)),
    })

    if (!member) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You are not a member of this organization',
      })
    }

    return opts.next({
      ctx: {
        ...ctx,
        session: ctx.session,
        user,
        activeOrganizationId: activeOrgId,
        member,
      },
    })
  })

/**
 * Bulk operation procedure - stricter rate limiting
 * Includes: timing, rate limiting (bulk), auth, org membership
 */
export const bulkProcedure = t.procedure
  .use(timingMiddleware)
  .use(bulkRateLimitMiddleware)
  .use(async (opts) => {
    const { ctx } = opts

    if (!ctx.session || !ctx.user) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'You must be logged in to perform this action',
      })
    }

    const activeOrgId = ctx.session.session.activeOrganizationId

    if (!activeOrgId) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You must have an active organization to perform this action',
      })
    }

    const user = ctx.user!
    const member = await ctx.db.query.member.findFirst({
      where: (member, { and, eq }) => and(eq(member.userId, user.id), eq(member.organizationId, activeOrgId)),
    })

    if (!member) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You are not a member of this organization',
      })
    }

    // Log bulk operations
    logger.info('Bulk operation started', {
      userId: user.id,
      orgId: activeOrgId,
    })

    return opts.next({
      ctx: {
        ...ctx,
        session: ctx.session,
        user,
        activeOrganizationId: activeOrgId,
        member,
      },
    })
  })

export const createCallerFactory = t.createCallerFactory
