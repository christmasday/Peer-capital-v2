"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import fs from "fs"
import path from "path"

export async function executeNotificationsMigration() {
  try {
    const adminClient = createAdminClient()

    // Read the SQL file
    const sqlPath = path.join(process.cwd(), "migrations", "create-notifications-table.sql")
    const sql = fs.readFileSync(sqlPath, "utf8")

    // Execute the SQL
    const { error } = await adminClient.rpc("exec_sql", { sql })

    if (error) {
      return { error: `Failed to execute migration: ${error.message}` }
    }

    return { success: true }
  } catch (error) {
    return { error: `An unexpected error occurred: ${error instanceof Error ? error.message : String(error)}` }
  }
}
