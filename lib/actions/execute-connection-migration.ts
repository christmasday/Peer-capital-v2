"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import fs from "fs"
import path from "path"

export async function executeConnectionMigration() {
  try {
    const adminClient = createAdminClient()

    // Read the migration SQL file
    const migrationPath = path.join(process.cwd(), "migrations", "create-user-connections-table.sql")
    const migrationSQL = fs.readFileSync(migrationPath, "utf8")

    // Execute the migration
    const { error } = await adminClient.rpc("exec_sql", { sql: migrationSQL })

    if (error) {
      console.error("Error executing migration:", error)
      return { error: "Failed to execute migration: " + error.message }
    }

    return { success: true, message: "User connections table created successfully" }
  } catch (error) {
    console.error("Unexpected error executing migration:", error)
    return { error: "An unexpected error occurred: " + (error as Error).message }
  }
}
