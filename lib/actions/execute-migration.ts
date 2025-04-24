"use server"

import { createAdminClient } from "@/lib/supabase/admin"

// Function to execute the migration to add ID verification and employment fields
export async function executeProfileMigration() {
  try {
    console.log("Executing profile migration to add ID verification and employment fields...")

    // Since adminClient.query is not available, we'll use the alternative approach directly
    // by executing individual ALTER TABLE statements
    return await executeIndividualMigrations()
  } catch (error) {
    console.error("Unexpected error executing profile migration:", error)

    // Log detailed error for debugging
    if (error instanceof Error) {
      console.error("Error details:", error.message, error.stack)
    }

    // If this fails, we'll handle the missing columns in the updateProfile function
    // So return a success anyway to avoid blocking the application
    return {
      success: false,
      warning: "Migration was not executed, but the application will try to adapt.",
      error: "An unexpected error occurred while executing the migration.",
    }
  }
}

// Execute individual ALTER TABLE statements one by one
async function executeIndividualMigrations() {
  try {
    console.log("Executing individual column migrations...")
    const adminClient = createAdminClient()

    // Execute individual ALTER TABLE statements one by one
    const alterTableStatements = [
      { column: "id_type", type: "VARCHAR(50)" },
      { column: "id_number", type: "VARCHAR(100)" },
      { column: "id_document_url", type: "VARCHAR(255)" },
      { column: "id_verified", type: "BOOLEAN", default: "DEFAULT FALSE" },
      { column: "id_verification_date", type: "TIMESTAMPTZ" },
      { column: "employment_status", type: "VARCHAR(50)" },
      { column: "employer_name", type: "VARCHAR(255)" },
      { column: "employer_address", type: "TEXT" },
      { column: "work_phone", type: "VARCHAR(20)" },
      { column: "job_title", type: "VARCHAR(100)" },
      { column: "monthly_income", type: "NUMERIC(15, 2)" },
      { column: "employment_start_date", type: "DATE" },
      { column: "employment_end_date", type: "DATE" },
      { column: "employment_verified", type: "BOOLEAN", default: "DEFAULT FALSE" },
    ]

    // Check which columns already exist
    const { data: existingColumns, error: columnsError } = await adminClient.from("profiles").select("*").limit(1)

    if (columnsError) {
      console.error("Error checking existing columns:", columnsError)
      return { success: false, error: "Failed to check existing columns" }
    }

    // Get column names from the first row
    const existingColumnNames = existingColumns && existingColumns.length > 0 ? Object.keys(existingColumns[0]) : []

    console.log("Existing columns:", existingColumnNames)

    // Track success/failure for each column
    const results = []

    // Add each missing column individually
    for (const { column, type, default: defaultValue } of alterTableStatements) {
      // Skip if column already exists
      if (existingColumnNames.includes(column)) {
        console.log(`Column ${column} already exists, skipping`)
        results.push({ column, success: true, skipped: true })
        continue
      }

      try {
        // Use the Supabase REST API to add the column
        const { error } = await adminClient.rpc("add_column_if_not_exists", {
          table_name: "profiles",
          column_name: column,
          column_type: type + (defaultValue ? ` ${defaultValue}` : ""),
        })

        if (error) {
          console.warn(`Failed to add column ${column}:`, error)
          results.push({ column, success: false, error: error.message })
        } else {
          console.log(`Successfully added column ${column}`)
          results.push({ column, success: true })
        }
      } catch (columnError) {
        console.warn(`Error adding column ${column}:`, columnError)
        results.push({ column, success: false, error: String(columnError) })
      }
    }

    // Check if any columns were successfully added
    const anySuccess = results.some((r) => r.success && !r.skipped)
    const allSkipped = results.every((r) => r.skipped)

    if (allSkipped) {
      return { success: true, message: "All columns already exist" }
    } else if (anySuccess) {
      return { success: true, message: "Some columns were added successfully", details: results }
    } else {
      return {
        success: false,
        warning: "Failed to add columns, but application will continue",
        details: results,
      }
    }
  } catch (error) {
    console.error("Unexpected error in executeIndividualMigrations:", error)
    return { success: false, error: "Migration failed, but application will continue" }
  }
}
