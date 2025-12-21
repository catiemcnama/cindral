import dotenv from 'dotenv'
import postgres from 'postgres'

dotenv.config({ path: '.env.local' })
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL missing')

const sql = postgres(process.env.DATABASE_URL)

async function run() {
  console.log('Altering alerts table to add context column if missing...')
  await sql`ALTER TABLE alerts ADD COLUMN IF NOT EXISTS context json`
  console.log('Done.')
  await sql.end({ timeout: 5 })
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
