/**
 * Cursor-Based Pagination Utilities
 *
 * Provides:
 * - Cursor encoding/decoding (base64 JSON)
 * - Type-safe pagination helpers
 * - Standard pagination response format
 * - Migration path from offset to cursor pagination
 */

// =============================================================================
// Types
// =============================================================================

/**
 * Cursor pagination input
 */
export interface CursorPaginationInput {
  /** Opaque cursor string (base64 encoded) */
  cursor?: string | null
  /** Number of items to fetch */
  limit: number
  /** Direction of pagination */
  direction?: 'forward' | 'backward'
}

/**
 * Page info for cursor pagination
 */
export interface PageInfo {
  /** Whether there are more items after this page */
  hasNextPage: boolean
  /** Whether there are items before this page */
  hasPreviousPage: boolean
  /** Cursor of the first item (null if empty) */
  startCursor: string | null
  /** Cursor of the last item (null if empty) */
  endCursor: string | null
}

/**
 * Cursor pagination result
 */
export interface CursorPaginatedResult<T> {
  /** Items in the current page */
  items: T[]
  /** Pagination metadata */
  pageInfo: PageInfo
  /** Total count (optional, expensive to compute) */
  totalCount?: number
}

/**
 * Decoded cursor structure
 */
interface DecodedCursor {
  /** Primary sort value (e.g., createdAt timestamp) */
  v: string | number
  /** Entity ID for tie-breaking */
  id: string
  /** Direction hint */
  d?: 'f' | 'b'
}

// =============================================================================
// Cursor Encoding/Decoding
// =============================================================================

/**
 * Encode a cursor from values
 */
export function encodeCursor(value: string | number | Date, id: string, direction?: 'forward' | 'backward'): string {
  const cursor: DecodedCursor = {
    v: value instanceof Date ? value.toISOString() : value,
    id,
    d: direction === 'backward' ? 'b' : 'f',
  }

  return Buffer.from(JSON.stringify(cursor)).toString('base64')
}

/**
 * Decode a cursor string
 */
export function decodeCursor(cursor: string): DecodedCursor | null {
  try {
    const decoded = JSON.parse(Buffer.from(cursor, 'base64').toString('utf-8'))

    if (typeof decoded !== 'object' || !decoded.v || !decoded.id) {
      return null
    }

    return decoded as DecodedCursor
  } catch {
    return null
  }
}

/**
 * Parse cursor value back to Date if it's an ISO string
 */
export function parseCursorValue(value: string | number): Date | string | number {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
    return new Date(value)
  }
  return value
}

// =============================================================================
// Pagination Helpers
// =============================================================================

/**
 * Build cursor pagination result from items
 *
 * @param items - Fetched items (should be limit + 1 to check hasNextPage)
 * @param limit - Requested limit
 * @param getCursorValue - Function to extract cursor value from item
 * @param getId - Function to extract ID from item
 * @param hasPreviousPage - Whether there are items before (from input cursor)
 */
export function buildCursorResult<T>(
  items: T[],
  limit: number,
  getCursorValue: (item: T) => string | number | Date,
  getId: (item: T) => string,
  hasPreviousPage: boolean = false,
  totalCount?: number
): CursorPaginatedResult<T> {
  // Check if we have more items than requested
  const hasNextPage = items.length > limit
  const pageItems = hasNextPage ? items.slice(0, limit) : items

  // Build page info
  const pageInfo: PageInfo = {
    hasNextPage,
    hasPreviousPage,
    startCursor: pageItems.length > 0 ? encodeCursor(getCursorValue(pageItems[0]), getId(pageItems[0])) : null,
    endCursor:
      pageItems.length > 0
        ? encodeCursor(getCursorValue(pageItems[pageItems.length - 1]), getId(pageItems[pageItems.length - 1]))
        : null,
  }

  return {
    items: pageItems,
    pageInfo,
    totalCount,
  }
}

/**
 * Apply cursor to a query condition
 * Returns SQL conditions for "after this cursor" pagination
 */
export function getCursorCondition<T>(
  cursor: string | null | undefined,
  direction: 'forward' | 'backward' = 'forward'
): { value: string | number | Date; id: string; direction: 'forward' | 'backward' } | null {
  if (!cursor) return null

  const decoded = decodeCursor(cursor)
  if (!decoded) return null

  return {
    value: parseCursorValue(decoded.v),
    id: decoded.id,
    direction: decoded.d === 'b' ? 'backward' : direction,
  }
}

// =============================================================================
// Offset Pagination Helpers
// =============================================================================

/**
 * Standard offset pagination result
 */
export interface OffsetPaginatedResult<T> {
  items: T[]
  total: number
  limit: number
  offset: number
  hasMore: boolean
}

/**
 * Build offset pagination result
 */
export function buildOffsetResult<T>(
  items: T[],
  total: number,
  limit: number,
  offset: number
): OffsetPaginatedResult<T> {
  return {
    items,
    total,
    limit,
    offset,
    hasMore: offset + items.length < total,
  }
}

/**
 * Calculate page numbers for offset pagination
 */
export function getPageNumbers(
  total: number,
  limit: number,
  currentOffset: number
): {
  currentPage: number
  totalPages: number
  pages: number[]
} {
  const totalPages = Math.ceil(total / limit)
  const currentPage = Math.floor(currentOffset / limit) + 1

  // Generate page numbers to show (max 7 pages)
  const maxPages = 7
  let startPage = Math.max(1, currentPage - 3)
  const endPage = Math.min(totalPages, startPage + maxPages - 1)

  if (endPage - startPage < maxPages - 1) {
    startPage = Math.max(1, endPage - maxPages + 1)
  }

  const pages: number[] = []
  for (let i = startPage; i <= endPage; i++) {
    pages.push(i)
  }

  return { currentPage, totalPages, pages }
}

// =============================================================================
// Hybrid Pagination (supports both cursor and offset)
// =============================================================================

/**
 * Unified pagination input that supports both methods
 */
export interface HybridPaginationInput {
  /** Cursor for cursor-based pagination */
  cursor?: string | null
  /** Offset for offset-based pagination */
  offset?: number
  /** Limit (required) */
  limit: number
  /** Direction for cursor pagination */
  direction?: 'forward' | 'backward'
}

/**
 * Determine pagination mode from input
 */
export function getPaginationMode(input: HybridPaginationInput): 'cursor' | 'offset' {
  if (input.cursor !== undefined && input.cursor !== null) {
    return 'cursor'
  }
  return 'offset'
}

// =============================================================================
// SQL Helpers for Drizzle
// =============================================================================

/**
 * Create cursor conditions for Drizzle queries
 *
 * Usage with Drizzle:
 * ```ts
 * const cursorCondition = getCursorCondition(input.cursor)
 * const conditions = [
 *   eq(table.organizationId, orgId),
 *   ...(cursorCondition ? [
 *     sql`(${table.createdAt}, ${table.id}) ${cursorCondition.direction === 'forward' ? sql`<` : sql`>`} (${cursorCondition.value}, ${cursorCondition.id})`
 *   ] : [])
 * ]
 * ```
 */
export function formatCursorCondition(
  cursor: ReturnType<typeof getCursorCondition>,
  sortDirection: 'asc' | 'desc' = 'desc'
): string | null {
  if (!cursor) return null

  // For descending order (newest first), "forward" means "less than"
  // For ascending order (oldest first), "forward" means "greater than"
  const operator =
    (sortDirection === 'desc' && cursor.direction === 'forward') ||
    (sortDirection === 'asc' && cursor.direction === 'backward')
      ? '<'
      : '>'

  return operator
}

// =============================================================================
// Constants
// =============================================================================

/** Default page size */
export const DEFAULT_LIMIT = 20

/** Maximum page size */
export const MAX_LIMIT = 100

/** Clamp limit to allowed range */
export function clampLimit(limit: number | undefined): number {
  if (limit === undefined) return DEFAULT_LIMIT
  return Math.min(Math.max(1, limit), MAX_LIMIT)
}
