"use server"

import { createAdminClient } from "@/lib/supabase/admin"

// Add the missing executeSql function as a named export
export async function executeSql(sql: string) {
  try {
    console.log("Executing SQL:", sql.substring(0, 100) + (sql.length > 100 ? "..." : ""))

    const adminClient = createAdminClient()

    // Execute the SQL using the execute_sql RPC function
    const { data, error } = await adminClient.rpc("execute_sql", { sql_query: sql })

    if (error) {
      console.error("Error executing SQL:", error)
      return { success: false, error: error.message }
    }

    console.log("SQL executed successfully")
    return { success: true, data }
  } catch (error) {
    console.error("Unexpected error executing SQL:", error)
    return {
      success: false,
      error: `An unexpected error occurred: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}

export async function executeMigration(migrationFile: string) {
  try {
    console.log(`Executing migration: ${migrationFile}`)

    const adminClient = createAdminClient()

    // Get the migration SQL
    const response = await fetch(`/migrations/${migrationFile}`)
    if (!response.ok) {
      console.error(`Failed to fetch migration file: ${migrationFile}`)
      return { error: `Failed to fetch migration file: ${migrationFile}` }
    }

    const sql = await response.text()

    // Execute the SQL
    const { error } = await adminClient.rpc("execute_sql", { sql_query: sql })

    if (error) {
      console.error(`Error executing migration: ${error.message}`)
      return { error: error.message }
    }

    console.log(`Migration ${migrationFile} executed successfully`)
    return { success: true }
  } catch (error) {
    console.error(`Unexpected error executing migration: ${error}`)
    return { error: `An unexpected error occurred: ${error instanceof Error ? error.message : String(error)}` }
  }
}

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

// Add a new function to execute a migration from a file
export async function executeMigrationFromFile(filename: string) {
  try {
    console.log(`Executing migration from file: ${filename}`)
    const adminClient = createAdminClient()

    // Get the SQL content from the migrations directory
    // In a real environment, we would read the file from the filesystem
    // But for this example, we'll use a switch statement to handle known migrations
    let sqlContent = ""

    switch (filename) {
      case "fix-notifications-schema.sql":
        sqlContent = `
          -- Check if the notifications table exists
          DO $$
          BEGIN
            IF NOT EXISTS (
              SELECT FROM information_schema.tables 
              WHERE table_schema = 'public' 
              AND table_name = 'notifications'
            ) THEN
              -- Create the notifications table if it doesn't exist
              CREATE TABLE public.notifications (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                user_id UUID NOT NULL,
                type VARCHAR(50) NOT NULL,
                title VARCHAR(255),
                message TEXT,
                data JSONB,
                is_read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW(),
                FOREIGN KEY (user_id) REFERENCES auth_users(id) ON DELETE CASCADE
              );
              
              -- Create index on user_id for faster queries
              CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
              
              -- Create index on is_read for faster filtering
              CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);
            ELSE
              -- Add missing columns if the table exists
              
              -- Add title column if it doesn't exist
              IF NOT EXISTS (
                SELECT FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'notifications' 
                AND column_name = 'title'
              ) THEN
                ALTER TABLE public.notifications ADD COLUMN title VARCHAR(255);
              END IF;
              
              -- Add message column if it doesn't exist
              IF NOT EXISTS (
                SELECT FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'notifications' 
                AND column_name = 'message'
              ) THEN
                ALTER TABLE public.notifications ADD COLUMN message TEXT;
              END IF;
              
              -- Add data column if it doesn't exist
              IF NOT EXISTS (
                SELECT FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'notifications' 
                AND column_name = 'data'
              ) THEN
                ALTER TABLE public.notifications ADD COLUMN data JSONB;
              END IF;
            END IF;
          END
          $$;
        `
        break
      case "create-check-table-exists-function.sql":
        sqlContent = `
          -- Create a function to check if a table exists
          CREATE OR REPLACE FUNCTION check_table_exists(table_name TEXT)
          RETURNS BOOLEAN AS $$
          DECLARE
            table_exists BOOLEAN;
          BEGIN
            SELECT EXISTS (
              SELECT FROM information_schema.tables 
              WHERE table_schema = 'public' 
              AND table_name = $1
            ) INTO table_exists;
            
            RETURN table_exists;
          END;
          $$ LANGUAGE plpgsql;
        `
        break
      default:
        return { success: false, error: `Unknown migration file: ${filename}` }
    }

    // Execute the SQL
    const { error } = await adminClient.rpc("execute_sql", { sql_query: sqlContent })

    if (error) {
      console.error(`Error executing migration ${filename}:`, error)
      return { success: false, error: `Failed to execute migration: ${error.message}` }
    }

    return { success: true, message: `Migration ${filename} executed successfully` }
  } catch (error) {
    console.error(`Unexpected error executing migration ${filename}:`, error)
    return { success: false, error: `An unexpected error occurred: ${String(error)}` }
  }
}
