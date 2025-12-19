import { db } from '@/db'
import { auth } from '@/lib/auth'
import { TRPCError, initTRPC } from '@trpc/server'
import { headers } from 'next/headers'
import { cache } from 'react'
import superjson from 'superjson'

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

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
})

export const router = t.router
export const publicProcedure = t.procedure

/**
 * Protected procedure - requires authentication
 */
export const protectedProcedure = t.procedure.use(async (opts) => {
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

export const createCallerFactory = t.createCallerFactory
