import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set')
}

/**
 * Cache the database connection in development to avoid too many connections
 * This is a Next.js specific optimization for development hot reloading
 */
const globalForDb = globalThis as unknown as {
  conn: postgres.Sql | undefined
}

const conn = globalForDb.conn ?? postgres(process.env.DATABASE_URL)
if (process.env.NODE_ENV !== 'production') globalForDb.conn = conn

/**
 * Drizzle database instance with schema
 */
export const db = drizzle({ client: conn, schema })
