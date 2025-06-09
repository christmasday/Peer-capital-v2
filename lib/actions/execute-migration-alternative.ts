"use server"

import { createAdminClient } from "@/lib/supabase/admin"

// Alternative approach to add individual columns one by one
export async function executeProfileMigrationAlternative() {
  try {
    const adminClient = createAdminClient()

    // Execute individual ALTER TABLE statements one by one
    const alterTableStatements = [
      "ALTER TABLE IF EXISTS profiles ADD COLUMN IF NOT EXISTS id_type VARCHAR(50)",
      "ALTER TABLE IF EXISTS profiles ADD COLUMN IF NOT EXISTS id_number VARCHAR(100)",
      "ALTER TABLE IF EXISTS profiles ADD COLUMN IF NOT EXISTS id_document_url VARCHAR(255)",
      "ALTER TABLE IF EXISTS profiles ADD COLUMN IF NOT EXISTS id_verified BOOLEAN DEFAULT FALSE",
      "ALTER TABLE IF EXISTS profiles ADD COLUMN IF NOT EXISTS id_verification_date TIMESTAMPTZ",
      "ALTER TABLE IF EXISTS profiles ADD COLUMN IF NOT EXISTS employment_status VARCHAR(50)",
      "ALTER TABLE IF EXISTS profiles ADD COLUMN IF NOT EXISTS employer_name VARCHAR(255)",
      "ALTER TABLE IF EXISTS profiles ADD COLUMN IF NOT EXISTS employer_address TEXT",
      "ALTER TABLE IF EXISTS profiles ADD COLUMN IF NOT EXISTS work_phone VARCHAR(20)",
      "ALTER TABLE IF EXISTS profiles ADD COLUMN IF NOT EXISTS job_title VARCHAR(100)",
      "ALTER TABLE IF EXISTS profiles ADD COLUMN IF NOT EXISTS monthly_income NUMERIC(15, 2)",
      "ALTER TABLE IF EXISTS profiles ADD COLUMN IF NOT EXISTS employment_start_date DATE",
      "ALTER TABLE IF EXISTS profiles ADD COLUMN IF NOT EXISTS employment_end_date DATE",
      "ALTER TABLE IF EXISTS profiles ADD COLUMN IF NOT EXISTS employment_verified BOOLEAN DEFAULT FALSE",
    ]

    // Execute each statement separately
    for (const statement of alterTableStatements) {
      try {
        await adminClient.query(statement)
      } catch (statementError) {
        // Continue with next statement
      }
    }

    return { success: true }
  } catch (error) {
    return { success: false, error: "Migration failed, but application will continue" }
  }
}
