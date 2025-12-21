#!/usr/bin/env tsx
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import postgres from 'postgres'

async function main(){
  const sql = postgres(process.env.DATABASE_URL!, { max: 1 })
  try{
    const rows = await sql`select id, name, slug from organization`
    console.log(rows)
  }catch(err){
    console.error(err)
  }finally{
    await sql.end()
  }
}

main()
