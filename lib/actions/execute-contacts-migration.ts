"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import fs from "fs"
import path from "path"

export async function executeContactsMigration() {
  try {
    const adminClient = createAdminClient()

    const migrationPath = path.join(process.cwd(), "migrations", "create-contacts-table.sql")
    const migrationSQL = fs.readFileSync(migrationPath, "utf8")

    const { error } = await adminClient.rpc("exec_sql", { sql: migrationSQL })

    if (error) {
      return { error: "Failed to execute migration: " + error.message }
    }

    return { success: true, message: "Contacts table created successfully" }
  } catch (error) {
    return { error: "An unexpected error occurred: " + (error as Error).message }
  }
}
