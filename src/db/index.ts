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

// =============================================================================
// Connection Pool (Lazy Initialization)
// =============================================================================

/**
 * Global cache for connection and drizzle instance
 * Prevents too many connections during hot reloading
 */
const globalForDb = globalThis as unknown as {
  conn: postgres.Sql | undefined
  db: ReturnType<typeof drizzle<typeof schema>> | undefined
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
 * Get or create database connection
 * Lazily initialized to allow build without DATABASE_URL
 */
function getConnection(): postgres.Sql {
  if (globalForDb.conn) {
    return globalForDb.conn
  }

  if (!DATABASE_URL) {
    throw new Error(
      'DATABASE_URL is not defined. Add it to .env.local:\n' +
        'DATABASE_URL=postgresql://user:password@localhost:5432/cindral'
    )
  }

  const conn = postgres(DATABASE_URL, {
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

  globalForDb.conn = conn
  globalForDb.isHealthy = true
  return conn
}

/**
 * Get or create Drizzle instance
 * Lazily initialized to allow build without DATABASE_URL
 */
function getDrizzle(): ReturnType<typeof drizzle<typeof schema>> {
  if (globalForDb.db) {
    return globalForDb.db
  }

  const instance = drizzle({ client: getConnection(), schema })
  globalForDb.db = instance
  return instance
}

// =============================================================================
// Exports
// =============================================================================

/**
 * Drizzle database instance with typed schema
 * Use this for all database operations
 *
 * Note: Connection is established lazily on first property access.
 * This allows Next.js build to succeed without DATABASE_URL.
 */
export const db = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
  get(_, prop) {
    return Reflect.get(getDrizzle(), prop)
  },
})

/**
 * Raw SQL client for direct queries
 * Use sparingly - prefer Drizzle query builder
 *
 * Note: Connection is established lazily on first use.
 */
export const sql = new Proxy({} as postgres.Sql, {
  get(_, prop) {
    return Reflect.get(getConnection(), prop)
  },
})

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
    const conn = getConnection()
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
  if (globalForDb.conn) {
    globalForDb.isHealthy = false
    await globalForDb.conn.end()
    globalForDb.conn = undefined
    globalForDb.db = undefined
  }
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
