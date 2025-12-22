import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cache, cached, CACHE_KEYS, hashParams, invalidate, TTL } from '@/lib/cache'

describe('Cache', () => {
  beforeEach(() => {
    cache.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Basic operations', () => {
    it('sets and gets values', () => {
      cache.set('key', 'value')
      const result = cache.get<string>('key')

      expect(result).not.toBeNull()
      expect(result?.value).toBe('value')
      expect(result?.isStale).toBe(false)
    })

    it('returns null for missing keys', () => {
      const result = cache.get('missing')
      expect(result).toBeNull()
    })

    it('deletes values', () => {
      cache.set('key', 'value')
      expect(cache.has('key')).toBe(true)

      cache.delete('key')
      expect(cache.has('key')).toBe(false)
    })

    it('clears all values', () => {
      cache.set('key1', 'value1')
      cache.set('key2', 'value2')

      cache.clear()

      expect(cache.has('key1')).toBe(false)
      expect(cache.has('key2')).toBe(false)
    })
  })

  describe('TTL behavior', () => {
    it('expires entries after TTL', () => {
      vi.useFakeTimers()

      cache.set('key', 'value', { ttlSec: 1 })
      expect(cache.get('key')).not.toBeNull()

      vi.advanceTimersByTime(1500) // 1.5 seconds

      expect(cache.get('key')).toBeNull()

      vi.useRealTimers()
    })

    it('supports stale-while-revalidate', () => {
      vi.useFakeTimers()

      cache.set('key', 'value', { ttlSec: 1, staleWhileRevalidateSec: 2 })

      // Fresh
      vi.advanceTimersByTime(500)
      let result = cache.get<string>('key')
      expect(result?.isStale).toBe(false)

      // Stale but valid
      vi.advanceTimersByTime(1000) // Now at 1.5s
      result = cache.get<string>('key')
      expect(result?.value).toBe('value')
      expect(result?.isStale).toBe(true)

      // Expired
      vi.advanceTimersByTime(2000) // Now at 3.5s
      expect(cache.get('key')).toBeNull()

      vi.useRealTimers()
    })
  })

  describe('Pattern deletion', () => {
    it('deletes keys matching pattern', () => {
      cache.set('dashboard:stats:org-1', 'stats1')
      cache.set('dashboard:stats:org-2', 'stats2')
      cache.set('systems:list:org-1', 'systems1')

      const deleted = cache.deletePattern('dashboard:*')

      expect(deleted).toBe(2)
      expect(cache.has('dashboard:stats:org-1')).toBe(false)
      expect(cache.has('dashboard:stats:org-2')).toBe(false)
      expect(cache.has('systems:list:org-1')).toBe(true)
    })
  })

  describe('Cache stats', () => {
    it('tracks hits and misses', () => {
      cache.set('key', 'value')

      cache.get('key') // hit
      cache.get('key') // hit
      cache.get('missing') // miss

      const stats = cache.getStats()
      expect(stats.hits).toBe(2)
      expect(stats.misses).toBe(1)
    })
  })
})

describe('cached helper', () => {
  beforeEach(() => {
    cache.clear()
  })

  it('caches function results', async () => {
    let callCount = 0
    const fn = async () => {
      callCount++
      return 'result'
    }

    const result1 = await cached('key', fn)
    const result2 = await cached('key', fn)

    expect(result1).toBe('result')
    expect(result2).toBe('result')
    expect(callCount).toBe(1) // Only called once
  })

  it('refreshes on cache miss', async () => {
    let callCount = 0
    const fn = async () => {
      callCount++
      return `result-${callCount}`
    }

    const result1 = await cached('key', fn)
    cache.delete('key')
    const result2 = await cached('key', fn)

    expect(result1).toBe('result-1')
    expect(result2).toBe('result-2')
    expect(callCount).toBe(2)
  })
})

describe('CACHE_KEYS', () => {
  it('generates consistent keys', () => {
    expect(CACHE_KEYS.dashboardStats('org-1')).toBe('dashboard:stats:org-1')
    expect(CACHE_KEYS.systemsList('org-1')).toBe('systems:list:org-1')
    expect(CACHE_KEYS.alertCounts('org-1')).toBe('alerts:counts:org-1')
  })
})

describe('hashParams', () => {
  it('generates consistent hashes', () => {
    const hash1 = hashParams({ limit: 20, offset: 0 })
    const hash2 = hashParams({ limit: 20, offset: 0 })
    const hash3 = hashParams({ limit: 20, offset: 10 })

    expect(hash1).toBe(hash2)
    expect(hash1).not.toBe(hash3)
  })

  it('ignores undefined values', () => {
    const hash1 = hashParams({ limit: 20, search: undefined })
    const hash2 = hashParams({ limit: 20 })

    expect(hash1).toBe(hash2)
  })

  it('sorts keys for consistency', () => {
    const hash1 = hashParams({ a: 1, b: 2 })
    const hash2 = hashParams({ b: 2, a: 1 })

    expect(hash1).toBe(hash2)
  })
})

describe('invalidate helpers', () => {
  beforeEach(() => {
    cache.clear()
  })

  it('invalidates dashboard cache', () => {
    const orgId = 'org-1'
    cache.set(CACHE_KEYS.dashboardStats(orgId), 'stats')
    cache.set(CACHE_KEYS.dashboardSummary(orgId), 'summary')
    cache.set(CACHE_KEYS.complianceByRegulation(orgId), 'compliance')

    invalidate.dashboard(orgId)

    expect(cache.has(CACHE_KEYS.dashboardStats(orgId))).toBe(false)
    expect(cache.has(CACHE_KEYS.dashboardSummary(orgId))).toBe(false)
    expect(cache.has(CACHE_KEYS.complianceByRegulation(orgId))).toBe(false)
  })

  it('invalidates alerts cache', () => {
    const orgId = 'org-1'
    cache.set(CACHE_KEYS.alertCounts(orgId), 'counts')
    cache.set(CACHE_KEYS.dashboardStats(orgId), 'stats')

    invalidate.alerts(orgId)

    expect(cache.has(CACHE_KEYS.alertCounts(orgId))).toBe(false)
    expect(cache.has(CACHE_KEYS.dashboardStats(orgId))).toBe(false)
  })

  it('invalidates systems cache', () => {
    const orgId = 'org-1'
    cache.set(CACHE_KEYS.systemsList(orgId), 'list')
    cache.set(CACHE_KEYS.systemImpactOverview(orgId), 'impact')

    invalidate.systems(orgId)

    expect(cache.has(CACHE_KEYS.systemsList(orgId))).toBe(false)
    expect(cache.has(CACHE_KEYS.systemImpactOverview(orgId))).toBe(false)
  })
})

describe('TTL presets', () => {
  it('has appropriate values', () => {
    expect(TTL.dashboard.ttlSec).toBe(30)
    expect(TTL.list.ttlSec).toBe(60)
    expect(TTL.entity.ttlSec).toBe(300)
    expect(TTL.metadata.ttlSec).toBe(3600)
  })
})
