#!/usr/bin/env tsx
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import postgres from 'postgres'

async function main(){
  const sql = postgres(process.env.DATABASE_URL!, { max: 1 })
  try{
    console.log('Deleting test organizations if they exist...')
    await sql`delete from organization where id in ('finbank-eu','paytech-uk')`
    console.log('Deleted (if existed)')
  }catch(err){
    console.error(err)
  }finally{
    await sql.end()
  }
}

main()
