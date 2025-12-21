#!/usr/bin/env tsx
/**
 * Database Migration Runner
 *
 * Provides a controlled migration workflow with:
 * - Status checking
 * - Dry-run mode
 * - Rollback support (via backup/restore)
 * - Transaction wrapping
 *
 * Usage:
 *   npm run db:migrate:status    # Show migration status
 *   npm run db:migrate:up        # Apply pending migrations
 *   npm run db:migrate:up -- --dry-run  # Preview changes
 */

import { existsSync, readdirSync, readFileSync } from 'fs'
import { join } from 'path'
import postgres from 'postgres'

// =============================================================================
// Configuration
// =============================================================================

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL is not set')
  process.exit(1)
}

const MIGRATIONS_DIR = join(process.cwd(), 'drizzle')
const MIGRATIONS_TABLE = '__drizzle_migrations'

// =============================================================================
// Database Connection
// =============================================================================

const sql = postgres(DATABASE_URL, {
  max: 1,
  connect_timeout: 10,
})

// =============================================================================
// Types
// =============================================================================

interface Migration {
  name: string
  path: string
  content: string
}

interface AppliedMigration {
  id: number
  name: string
  created_at: Date
}

// =============================================================================
// Migration Functions
// =============================================================================

async function ensureMigrationsTable(): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS ${sql(MIGRATIONS_TABLE)} (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `
}

async function getAppliedMigrations(): Promise<AppliedMigration[]> {
  await ensureMigrationsTable()
  const result = await sql<AppliedMigration[]>`
    SELECT id, name, created_at 
    FROM ${sql(MIGRATIONS_TABLE)} 
    ORDER BY created_at ASC
  `
  return result
}

function getLocalMigrations(): Migration[] {
  if (!existsSync(MIGRATIONS_DIR)) {
    return []
  }

  return readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort()
    .map((name) => ({
      name: name.replace('.sql', ''),
      path: join(MIGRATIONS_DIR, name),
      content: readFileSync(join(MIGRATIONS_DIR, name), 'utf-8'),
    }))
}

async function getPendingMigrations(): Promise<Migration[]> {
  const applied = await getAppliedMigrations()
  const appliedNames = new Set(applied.map((m) => m.name))
  const local = getLocalMigrations()

  return local.filter((m) => !appliedNames.has(m.name))
}

// =============================================================================
// Commands
// =============================================================================

async function status(): Promise<void> {
  console.log('📊 Migration Status\n')

  const applied = await getAppliedMigrations()
  const local = getLocalMigrations()
  const pending = await getPendingMigrations()

  console.log(`Migrations directory: ${MIGRATIONS_DIR}`)
  console.log(`Total local migrations: ${local.length}`)
  console.log(`Applied migrations: ${applied.length}`)
  console.log(`Pending migrations: ${pending.length}`)

  if (applied.length > 0) {
    console.log('\n✅ Applied:')
    for (const m of applied) {
      const date = m.created_at.toISOString().split('T')[0]
      console.log(`   ${m.name} (${date})`)
    }
  }

  if (pending.length > 0) {
    console.log('\n⏳ Pending:')
    for (const m of pending) {
      console.log(`   ${m.name}`)
    }
  } else {
    console.log('\n✅ All migrations applied!')
  }
}

async function up(dryRun: boolean = false): Promise<void> {
  const pending = await getPendingMigrations()

  if (pending.length === 0) {
    console.log('✅ No pending migrations')
    return
  }

  console.log(`🚀 ${dryRun ? '[DRY RUN] ' : ''}Applying ${pending.length} migration(s)...\n`)

  for (const migration of pending) {
    console.log(`📦 ${migration.name}`)

    if (dryRun) {
      console.log('   Preview:')
      const preview = migration.content
        .split('\n')
        .slice(0, 10)
        .map((line) => `   ${line}`)
        .join('\n')
      console.log(preview)
      if (migration.content.split('\n').length > 10) {
        console.log('   ... (truncated)')
      }
      console.log('')
      continue
    }

    try {
      // Run migration in a transaction
      await sql.begin(async (tx) => {
        // Split by semicolons and run each statement
        const statements = migration.content
          .split(';')
          .map((s) => s.trim())
          .filter((s) => s.length > 0 && !s.startsWith('--'))

        for (const statement of statements) {
          await tx.unsafe(statement)
        }

        // Record the migration
        await tx`
          INSERT INTO ${sql(MIGRATIONS_TABLE)} (name)
          VALUES (${migration.name})
        `
      })

      console.log('   ✅ Applied\n')
    } catch (err) {
      console.error(`   ❌ Failed: ${err instanceof Error ? err.message : err}`)
      throw err
    }
  }

  if (!dryRun) {
    console.log(`\n✅ Successfully applied ${pending.length} migration(s)`)
  }
}

async function rollbackInfo(): Promise<void> {
  console.log('⚠️  Rollback Instructions\n')
  console.log('Drizzle migrations are forward-only. To rollback:')
  console.log('')
  console.log('1. Restore from backup:')
  console.log('   npm run db:restore -- backups/cindral_YYYYMMDD_HHMMSS.sql')
  console.log('')
  console.log('2. Or manually reverse the migration:')
  console.log('   - Write a new migration that undoes the changes')
  console.log('   - npm run db:migrate:up')
  console.log('')
  console.log('3. Remove migration record (use with caution):')
  console.log('   psql $DATABASE_URL -c "DELETE FROM __drizzle_migrations WHERE name = \'0003_...\'"')
  console.log('')

  const applied = await getAppliedMigrations()
  if (applied.length > 0) {
    const latest = applied[applied.length - 1]
    console.log(`Latest applied migration: ${latest.name}`)
  }
}

// =============================================================================
// CLI
// =============================================================================

async function main(): Promise<void> {
  const args = process.argv.slice(2)
  const command = args[0] || 'status'
  const dryRun = args.includes('--dry-run')

  try {
    switch (command) {
      case 'status':
        await status()
        break
      case 'up':
        await up(dryRun)
        break
      case 'rollback':
        await rollbackInfo()
        break
      default:
        console.log('Usage:')
        console.log('  db-migrate.ts status     Show migration status')
        console.log('  db-migrate.ts up         Apply pending migrations')
        console.log('  db-migrate.ts up --dry-run  Preview migrations')
        console.log('  db-migrate.ts rollback   Show rollback instructions')
        process.exit(1)
    }
  } finally {
    await sql.end()
  }
}

main().catch((err) => {
  console.error('Migration failed:', err)
  process.exit(1)
})
