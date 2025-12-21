#!/usr/bin/env tsx
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import postgres from 'postgres'
dotenv.config({ path: '.env.local' })

async function main() {
  const dbUrl = process.env.DATABASE_URL
  if (!dbUrl) throw new Error('DATABASE_URL not set')
  const sqlFile = path.join(process.cwd(), 'drizzle', '0001_day1.sql')
  if (!fs.existsSync(sqlFile)) throw new Error('SQL file not found: ' + sqlFile)
  const sqlText = fs.readFileSync(sqlFile, 'utf8')
  const sql = postgres(dbUrl, { max: 1 })
  try {
    console.log('Applying SQL migration...')
    await sql.begin(async (tx) => {
      // split on \n\n? we'll run as single statement
      await tx.unsafe(sqlText)
    })
    console.log('Migration applied successfully')
    process.exit(0)
  } catch (err) {
    console.error('Migration failed', err)
    process.exit(1)
  } finally {
    await sql.end()
  }
}

main()
