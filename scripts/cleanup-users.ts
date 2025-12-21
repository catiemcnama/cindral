#!/usr/bin/env tsx
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import postgres from 'postgres'

async function main(){
  const sql = postgres(process.env.DATABASE_URL!, { max: 1 })
  try{
    console.log('Deleting test users if they exist...')
    await sql`delete from "user" where id in ('finbank-admin','finbank-comp','finbank-auditor','finbank-viewer','paytech-admin','paytech-comp','paytech-auditor','paytech-viewer')`
    console.log('Deleted (if existed)')
  }catch(err){
    console.error(err)
  }finally{
    await sql.end()
  }
}

main()
