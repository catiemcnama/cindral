import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

/**
 * Database connection configuration
 * Uses typed environment variables for safety
 */
const DATABASE_URL = process.env.DATABASE_URL
const POOL_SIZE = parseInt(process.env.DATABASE_POOL_SIZE || '10', 10)

if (!DATABASE_URL) {
  throw new Error(
    'DATABASE_URL is not defined. Add it to .env.local:\n' +
      'DATABASE_URL=postgresql://user:password@localhost:5432/cindral'
  )
}

/**
 * Cache the database connection in development
 * Prevents too many connections during hot reloading
 */
const globalForDb = globalThis as unknown as {
  conn: postgres.Sql | undefined
}

/**
 * Connection pool configuration
 * Optimized for serverless/edge environments
 */
const conn =
  globalForDb.conn ??
  postgres(DATABASE_URL, {
    max: process.env.NODE_ENV === 'production' ? POOL_SIZE : 5,
    idle_timeout: 20, // Close idle connections after 20s
    connect_timeout: 10, // Fail connection attempts after 10s
    max_lifetime: 60 * 30, // Refresh connections every 30 minutes
    prepare: false, // Disable prepared statements for serverless
    onnotice: () => {}, // Suppress notices
  })

if (process.env.NODE_ENV !== 'production') {
  globalForDb.conn = conn
}

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
 * Close database connections gracefully
 * Call this on application shutdown
 */
export async function closeDb(): Promise<void> {
  await conn.end()
}
