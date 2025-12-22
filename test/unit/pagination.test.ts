import { describe, expect, it } from 'vitest'
import {
  buildCursorResult,
  buildOffsetResult,
  clampLimit,
  decodeCursor,
  DEFAULT_LIMIT,
  encodeCursor,
  formatCursorCondition,
  getCursorCondition,
  getPageNumbers,
  MAX_LIMIT,
  parseCursorValue,
} from '@/lib/pagination'

describe('Cursor Encoding/Decoding', () => {
  describe('encodeCursor', () => {
    it('encodes string values', () => {
      const cursor = encodeCursor('value', 'id-1')
      expect(cursor).toBeTruthy()
      expect(typeof cursor).toBe('string')
    })

    it('encodes number values', () => {
      const cursor = encodeCursor(12345, 'id-1')
      expect(cursor).toBeTruthy()
    })

    it('encodes Date values', () => {
      const date = new Date('2024-01-15T10:00:00Z')
      const cursor = encodeCursor(date, 'id-1')

      const decoded = decodeCursor(cursor)
      expect(decoded?.v).toBe(date.toISOString())
    })

    it('includes direction hint', () => {
      const forwardCursor = encodeCursor('value', 'id-1', 'forward')
      const backwardCursor = encodeCursor('value', 'id-1', 'backward')

      const forwardDecoded = decodeCursor(forwardCursor)
      const backwardDecoded = decodeCursor(backwardCursor)

      expect(forwardDecoded?.d).toBe('f')
      expect(backwardDecoded?.d).toBe('b')
    })
  })

  describe('decodeCursor', () => {
    it('decodes valid cursors', () => {
      const cursor = encodeCursor('value', 'id-1')
      const decoded = decodeCursor(cursor)

      expect(decoded).not.toBeNull()
      expect(decoded?.v).toBe('value')
      expect(decoded?.id).toBe('id-1')
    })

    it('returns null for invalid base64', () => {
      const decoded = decodeCursor('not-valid-base64!!!')
      expect(decoded).toBeNull()
    })

    it('returns null for malformed JSON', () => {
      const cursor = Buffer.from('not json').toString('base64')
      const decoded = decodeCursor(cursor)
      expect(decoded).toBeNull()
    })

    it('returns null for missing required fields', () => {
      const cursor = Buffer.from(JSON.stringify({ foo: 'bar' })).toString('base64')
      const decoded = decodeCursor(cursor)
      expect(decoded).toBeNull()
    })
  })

  describe('parseCursorValue', () => {
    it('parses ISO date strings to Date', () => {
      const result = parseCursorValue('2024-01-15T10:00:00.000Z')
      expect(result).toBeInstanceOf(Date)
    })

    it('returns strings as-is for non-dates', () => {
      const result = parseCursorValue('just-a-string')
      expect(result).toBe('just-a-string')
    })

    it('returns numbers as-is', () => {
      const result = parseCursorValue(12345)
      expect(result).toBe(12345)
    })
  })
})

describe('buildCursorResult', () => {
  it('builds result with correct page info', () => {
    const items = [
      { id: '1', createdAt: new Date('2024-01-15') },
      { id: '2', createdAt: new Date('2024-01-14') },
    ]

    const result = buildCursorResult(
      items,
      10,
      (item) => item.createdAt,
      (item) => item.id,
      false
    )

    expect(result.items).toHaveLength(2)
    expect(result.pageInfo.hasNextPage).toBe(false)
    expect(result.pageInfo.hasPreviousPage).toBe(false)
    expect(result.pageInfo.startCursor).toBeTruthy()
    expect(result.pageInfo.endCursor).toBeTruthy()
  })

  it('detects hasNextPage when items exceed limit', () => {
    const items = [
      { id: '1', createdAt: new Date('2024-01-15') },
      { id: '2', createdAt: new Date('2024-01-14') },
      { id: '3', createdAt: new Date('2024-01-13') },
    ]

    const result = buildCursorResult(
      items,
      2, // Only want 2 items, but we have 3
      (item) => item.createdAt,
      (item) => item.id,
      false
    )

    expect(result.items).toHaveLength(2)
    expect(result.pageInfo.hasNextPage).toBe(true)
  })

  it('handles empty results', () => {
    const result = buildCursorResult(
      [],
      10,
      (item: { createdAt: Date }) => item.createdAt,
      (item: { id: string }) => item.id,
      true
    )

    expect(result.items).toHaveLength(0)
    expect(result.pageInfo.hasNextPage).toBe(false)
    expect(result.pageInfo.hasPreviousPage).toBe(true)
    expect(result.pageInfo.startCursor).toBeNull()
    expect(result.pageInfo.endCursor).toBeNull()
  })

  it('includes totalCount when provided', () => {
    const items = [{ id: '1', createdAt: new Date() }]

    const result = buildCursorResult(
      items,
      10,
      (item) => item.createdAt,
      (item) => item.id,
      false,
      100
    )

    expect(result.totalCount).toBe(100)
  })
})

describe('getCursorCondition', () => {
  it('returns null for null/undefined cursor', () => {
    expect(getCursorCondition(null)).toBeNull()
    expect(getCursorCondition(undefined)).toBeNull()
  })

  it('parses valid cursor', () => {
    const cursor = encodeCursor('2024-01-15T10:00:00Z', 'id-1')
    const condition = getCursorCondition(cursor)

    expect(condition).not.toBeNull()
    expect(condition?.id).toBe('id-1')
    expect(condition?.direction).toBe('forward')
  })

  it('respects direction from cursor', () => {
    const cursor = encodeCursor('value', 'id-1', 'backward')
    const condition = getCursorCondition(cursor)

    expect(condition?.direction).toBe('backward')
  })
})

describe('formatCursorCondition', () => {
  it('returns null for null cursor', () => {
    expect(formatCursorCondition(null)).toBeNull()
  })

  it('returns < for descending forward pagination', () => {
    const cursor = encodeCursor('value', 'id')
    const condition = getCursorCondition(cursor)
    const operator = formatCursorCondition(condition, 'desc')

    expect(operator).toBe('<')
  })

  it('returns > for ascending forward pagination', () => {
    const cursor = encodeCursor('value', 'id', 'forward')
    const condition = getCursorCondition(cursor)
    const operator = formatCursorCondition(condition, 'asc')

    expect(operator).toBe('>')
  })
})

describe('Offset Pagination', () => {
  describe('buildOffsetResult', () => {
    it('builds result with correct metadata', () => {
      const items = [{ id: '1' }, { id: '2' }]
      const result = buildOffsetResult(items, 100, 20, 0)

      expect(result.items).toHaveLength(2)
      expect(result.total).toBe(100)
      expect(result.limit).toBe(20)
      expect(result.offset).toBe(0)
      expect(result.hasMore).toBe(true)
    })

    it('calculates hasMore correctly', () => {
      const items = [{ id: '1' }, { id: '2' }]

      const hasMore = buildOffsetResult(items, 2, 10, 0)
      const noMore = buildOffsetResult(items, 12, 10, 10)

      expect(hasMore.hasMore).toBe(false)
      expect(noMore.hasMore).toBe(false)
    })
  })

  describe('getPageNumbers', () => {
    it('calculates current page correctly', () => {
      const result = getPageNumbers(100, 10, 0)
      expect(result.currentPage).toBe(1)

      const result2 = getPageNumbers(100, 10, 20)
      expect(result2.currentPage).toBe(3)
    })

    it('calculates total pages correctly', () => {
      const result = getPageNumbers(100, 10, 0)
      expect(result.totalPages).toBe(10)

      const result2 = getPageNumbers(95, 10, 0)
      expect(result2.totalPages).toBe(10)
    })

    it('generates page numbers array', () => {
      const result = getPageNumbers(100, 10, 0)
      expect(result.pages).toContain(1)
      expect(result.pages.length).toBeLessThanOrEqual(7)
    })
  })
})

describe('Limit utilities', () => {
  describe('clampLimit', () => {
    it('returns default for undefined', () => {
      expect(clampLimit(undefined)).toBe(DEFAULT_LIMIT)
    })

    it('clamps to minimum', () => {
      expect(clampLimit(0)).toBe(1)
      expect(clampLimit(-5)).toBe(1)
    })

    it('clamps to maximum', () => {
      expect(clampLimit(200)).toBe(MAX_LIMIT)
      expect(clampLimit(1000)).toBe(MAX_LIMIT)
    })

    it('passes through valid values', () => {
      expect(clampLimit(50)).toBe(50)
      expect(clampLimit(1)).toBe(1)
      expect(clampLimit(100)).toBe(100)
    })
  })

  describe('constants', () => {
    it('has expected values', () => {
      expect(DEFAULT_LIMIT).toBe(20)
      expect(MAX_LIMIT).toBe(100)
    })
  })
})
