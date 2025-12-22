import { beforeEach, describe, expect, it } from 'vitest'
import {
  RATE_LIMITS,
  clearAllRateLimits,
  createRateLimitMiddleware,
  getRateLimitStatus,
  resetRateLimit,
} from '@/trpc/middleware/rate-limit'

describe('Rate Limiting', () => {
  beforeEach(() => {
    clearAllRateLimits()
  })

  describe('createRateLimitMiddleware', () => {
    it('allows requests within limit', async () => {
      const middleware = createRateLimitMiddleware({ type: 'query' })
      const ctx = { user: { id: 'user-1' } }
      let nextCalled = false

      await middleware({
        ctx,
        next: async () => {
          nextCalled = true
          return 'result'
        },
        path: 'test.query',
      })

      expect(nextCalled).toBe(true)
    })

    it('blocks requests over limit', async () => {
      const middleware = createRateLimitMiddleware({ type: 'auth' })
      const ctx = { user: { id: 'user-1' } }

      // Exhaust the limit (auth limit is 10)
      for (let i = 0; i < RATE_LIMITS.auth.limit; i++) {
        await middleware({
          ctx,
          next: async () => 'ok',
          path: 'auth.login',
        })
      }

      // Next request should be blocked
      await expect(
        middleware({
          ctx,
          next: async () => 'ok',
          path: 'auth.login',
        })
      ).rejects.toThrow('Rate limit exceeded')
    })

    it('uses user ID as key for authenticated users', async () => {
      const middleware = createRateLimitMiddleware({ type: 'mutation' })

      // User 1 makes requests
      const ctx1 = { user: { id: 'user-1' } }
      await middleware({ ctx: ctx1, next: async () => 'ok', path: 'test' })

      // User 2 should have separate limit
      const ctx2 = { user: { id: 'user-2' } }
      await middleware({ ctx: ctx2, next: async () => 'ok', path: 'test' })

      const status1 = getRateLimitStatus('user-1', 'mutation')
      const status2 = getRateLimitStatus('user-2', 'mutation')

      expect(status1?.remaining).toBe(RATE_LIMITS.mutation.limit - 1)
      expect(status2?.remaining).toBe(RATE_LIMITS.mutation.limit - 1)
    })

    it('skips rate limiting when skip function returns true', async () => {
      const middleware = createRateLimitMiddleware({
        type: 'auth',
        skip: (ctx) => ctx.user?.id === 'admin',
      })

      const adminCtx = { user: { id: 'admin' } }

      // Admin should bypass limit
      for (let i = 0; i < RATE_LIMITS.auth.limit + 5; i++) {
        await middleware({
          ctx: adminCtx,
          next: async () => 'ok',
          path: 'auth.test',
        })
      }

      // Should not have tracked admin
      expect(getRateLimitStatus('admin', 'auth')).toBeNull()
    })
  })

  describe('getRateLimitStatus', () => {
    it('returns null for users with no requests', () => {
      const status = getRateLimitStatus('new-user', 'query')
      expect(status).toBeNull()
    })

    it('returns current status after requests', async () => {
      const middleware = createRateLimitMiddleware({ type: 'query' })
      const ctx = { user: { id: 'status-user' } }

      await middleware({ ctx, next: async () => 'ok', path: 'test' })
      await middleware({ ctx, next: async () => 'ok', path: 'test' })

      const status = getRateLimitStatus('status-user', 'query')

      expect(status).not.toBeNull()
      expect(status?.limit).toBe(RATE_LIMITS.query.limit)
      expect(status?.remaining).toBe(RATE_LIMITS.query.limit - 2)
      expect(status?.allowed).toBe(true)
    })
  })

  describe('resetRateLimit', () => {
    it('resets rate limit for specific type', async () => {
      const queryMiddleware = createRateLimitMiddleware({ type: 'query' })
      const mutationMiddleware = createRateLimitMiddleware({ type: 'mutation' })
      const ctx = { user: { id: 'reset-user' } }

      await queryMiddleware({ ctx, next: async () => 'ok', path: 'test' })
      await mutationMiddleware({ ctx, next: async () => 'ok', path: 'test' })

      resetRateLimit('reset-user', 'query')

      expect(getRateLimitStatus('reset-user', 'query')).toBeNull()
      expect(getRateLimitStatus('reset-user', 'mutation')).not.toBeNull()
    })

    it('resets all types when type not specified', async () => {
      const queryMiddleware = createRateLimitMiddleware({ type: 'query' })
      const mutationMiddleware = createRateLimitMiddleware({ type: 'mutation' })
      const ctx = { user: { id: 'reset-all-user' } }

      await queryMiddleware({ ctx, next: async () => 'ok', path: 'test' })
      await mutationMiddleware({ ctx, next: async () => 'ok', path: 'test' })

      resetRateLimit('reset-all-user')

      expect(getRateLimitStatus('reset-all-user', 'query')).toBeNull()
      expect(getRateLimitStatus('reset-all-user', 'mutation')).toBeNull()
    })
  })

  describe('RATE_LIMITS configuration', () => {
    it('has expected limits', () => {
      expect(RATE_LIMITS.query.limit).toBe(300)
      expect(RATE_LIMITS.mutation.limit).toBe(60)
      expect(RATE_LIMITS.auth.limit).toBe(10)
      expect(RATE_LIMITS.bulk.limit).toBe(10)
      expect(RATE_LIMITS.expensive.limit).toBe(20)
    })

    it('has 60 second windows', () => {
      expect(RATE_LIMITS.query.windowSec).toBe(60)
      expect(RATE_LIMITS.mutation.windowSec).toBe(60)
      expect(RATE_LIMITS.auth.windowSec).toBe(60)
    })
  })
})
