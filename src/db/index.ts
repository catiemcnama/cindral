import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

// =============================================================================
// Configuration
// =============================================================================

const DATABASE_URL = process.env.DATABASE_URL
const POOL_SIZE = parseInt(process.env.DATABASE_POOL_SIZE || '10', 10)
const QUERY_TIMEOUT = parseInt(process.env.DATABASE_QUERY_TIMEOUT || '30000', 10) // 30s default
const SLOW_QUERY_THRESHOLD = parseInt(process.env.DATABASE_SLOW_QUERY_MS || '1000', 10) // 1s

if (!DATABASE_URL) {
  throw new Error(
    'DATABASE_URL is not defined. Add it to .env.local:\n' +
      'DATABASE_URL=postgresql://user:password@localhost:5432/cindral'
  )
}

// =============================================================================
// Connection Pool
// =============================================================================

/**
 * Cache the database connection in development
 * Prevents too many connections during hot reloading
 */
const globalForDb = globalThis as unknown as {
  conn: postgres.Sql | undefined
  isHealthy: boolean
}

/**
 * Slow query logger
 */
function logSlowQuery(query: string, durationMs: number) {
  if (durationMs > SLOW_QUERY_THRESHOLD) {
    console.warn(`[DB] Slow query (${durationMs}ms):`, query.slice(0, 200))
  }
}

/**
 * Connection pool configuration
 * Optimized for serverless/edge environments
 */
const conn =
  globalForDb.conn ??
  postgres(DATABASE_URL, {
    // Pool sizing
    max: process.env.NODE_ENV === 'production' ? POOL_SIZE : 5,

    // Timeouts
    idle_timeout: 20, // Close idle connections after 20s
    connect_timeout: 10, // Fail connection attempts after 10s
    max_lifetime: 60 * 30, // Refresh connections every 30 minutes

    // Query settings
    prepare: false, // Disable prepared statements for serverless

    // Notifications
    onnotice: () => {}, // Suppress notices

    // Debug logging in development
    debug:
      process.env.NODE_ENV === 'development' && process.env.DATABASE_DEBUG === 'true'
        ? (connection, query, params) => {
            console.log('[DB Query]', query.slice(0, 100), params?.slice(0, 3))
          }
        : undefined,

    // Connection event handlers
    onclose: () => {
      globalForDb.isHealthy = false
    },
  })

if (process.env.NODE_ENV !== 'production') {
  globalForDb.conn = conn
  globalForDb.isHealthy = true
}

// =============================================================================
// Exports
// =============================================================================

/**
 * Drizzle database instance with typed schema
 * Use this for all database operations
 */
export const db = drizzle({ client: conn, schema })

/**
 * Raw SQL client for direct queries
 * Use sparingly - prefer Drizzle query builder
 */
export const sql = conn

/**
 * Check database health
 * Returns connection status and latency
 */
export async function checkHealth(): Promise<{
  connected: boolean
  latencyMs: number
  poolSize: number
  error?: string
}> {
  const start = Date.now()
  try {
    await conn`SELECT 1`
    const latencyMs = Date.now() - start
    logSlowQuery('SELECT 1 (health check)', latencyMs)
    return {
      connected: true,
      latencyMs,
      poolSize: POOL_SIZE,
    }
  } catch (err) {
    return {
      connected: false,
      latencyMs: Date.now() - start,
      poolSize: POOL_SIZE,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

/**
 * Execute a query with timeout
 * Use for long-running operations
 */
export async function withTimeout<T>(operation: () => Promise<T>, timeoutMs: number = QUERY_TIMEOUT): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`Query timeout after ${timeoutMs}ms`)), timeoutMs)
  )
  return Promise.race([operation(), timeoutPromise])
}

/**
 * Close database connections gracefully
 * Call this on application shutdown
 */
export async function closeDb(): Promise<void> {
  globalForDb.isHealthy = false
  await conn.end()
}

/**
 * Database configuration info (for debugging)
 */
export const dbConfig = {
  poolSize: POOL_SIZE,
  queryTimeout: QUERY_TIMEOUT,
  slowQueryThreshold: SLOW_QUERY_THRESHOLD,
  isProduction: process.env.NODE_ENV === 'production',
} as const
