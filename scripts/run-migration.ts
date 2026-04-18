import { createAdminClient } from '../lib/supabase/admin'
import fs from 'fs'
import path from 'path'

async function runMigration() {
  try {
    const admin = createAdminClient()
    
    // Read the migration file
    const migrationPath = path.join(__dirname, '../migrations/2024-12-20T-wallet-address.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')
    
    // Split by semicolon and execute each statement
    const statements = migrationSQL.split(';').filter(stmt => stmt.trim())
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log('Executing:', statement.trim().substring(0, 50) + '...')
        await admin.rpc('exec_sql', { sql: statement.trim() })
      }
    }
    
    console.log('✅ Migration completed successfully!')
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

runMigration()
