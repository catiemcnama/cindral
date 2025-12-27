#!/usr/bin/env tsx
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import postgres from 'postgres'
dotenv.config({ path: '.env.local' })

async function main() {
  const dbUrl = process.env.DATABASE_URL
  if (!dbUrl) throw new Error('DATABASE_URL not set')

  const drizzleDir = path.join(process.cwd(), 'drizzle')

  // Get all SQL files and sort them (0000 first, then 0001, etc.)
  const sqlFiles = fs
    .readdirSync(drizzleDir)
    .filter((f) => f.endsWith('.sql'))
    .sort()

  if (sqlFiles.length === 0) {
    throw new Error('No SQL migration files found in drizzle/')
  }

  console.log(`Found ${sqlFiles.length} migration files:`)
  sqlFiles.forEach((f) => console.log(`  - ${f}`))

  const sql = postgres(dbUrl, { max: 1 })

  try {
    for (const file of sqlFiles) {
      const sqlFile = path.join(drizzleDir, file)
      const sqlText = fs.readFileSync(sqlFile, 'utf8')

      console.log(`\nApplying migration: ${file}...`)

      // Run each statement separately to handle CREATE INDEX CONCURRENTLY
      // which can't run in a transaction
      const statements = sqlText
        .split(/;(?=\s*(?:--|CREATE|ALTER|DROP|INSERT|UPDATE|DELETE|DO|\n|$))/i)
        .map((s) => s.trim())
        .filter((s) => s.length > 0 && !s.startsWith('--'))

      for (const statement of statements) {
        if (!statement) continue
        try {
          // CONCURRENTLY statements can't be in a transaction
          if (statement.includes('CONCURRENTLY')) {
            await sql.unsafe(statement)
          } else {
            await sql.unsafe(statement)
          }
        } catch (err: unknown) {
          // Ignore "already exists" errors for idempotent migrations
          const errorMessage = err instanceof Error ? err.message : String(err)
          if (
            errorMessage.includes('already exists') ||
            errorMessage.includes('duplicate key') ||
            errorMessage.includes('does not exist') // For DROP IF EXISTS
          ) {
            console.log(`  (skipped: ${errorMessage.slice(0, 60)}...)`)
          } else {
            throw err
          }
        }
      }
      console.log(`  ✓ ${file} applied`)
    }

    console.log('\n✅ All migrations applied successfully')
    process.exit(0)
  } catch (err) {
    console.error('\n❌ Migration failed:', err)
    process.exit(1)
  } finally {
    await sql.end()
  }
}

main()
