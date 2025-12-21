#!/usr/bin/env tsx
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import postgres from 'postgres'
import process from 'process'

async function main(){
  const table = process.argv[2]
  if(!table){
    console.error('Usage: node describe-table <table>')
    process.exit(1)
  }
  const sql = postgres(process.env.DATABASE_URL!, { max: 1 })
  try{
    const cols = await sql`select column_name, data_type from information_schema.columns where table_name = ${table}`
    console.log('Columns for', table)
    console.table(cols)
  }catch(err){
    console.error(err)
  }finally{
    await sql.end()
  }
}

main()
