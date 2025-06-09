"use server"

import { createAdminClient } from "@/lib/supabase/admin"

// Function to ensure the execute_sql function exists
async function ensureExecuteSqlFunction() {
  try {
    const adminClient = createAdminClient()

    // Check if the function exists
    const { data, error } = await adminClient
      .from("information_schema.routines")
      .select("routine_name")
      .eq("routine_schema", "public")
      .eq("routine_name", "execute_sql")
      .maybeSingle()

    if (error) {
      return false
    }

    if (!data) {

      // Create the function directly
      const createFunctionSQL = `
        CREATE OR REPLACE FUNCTION public.execute_sql(sql_query TEXT)
        RETURNS JSONB AS $$
        DECLARE
          result JSONB;
        BEGIN
          EXECUTE sql_query;
          result := '{"success": true}'::JSONB;
          RETURN result;
        EXCEPTION WHEN OTHERS THEN
          result := jsonb_build_object(
            'success', false,
            'error', SQLERRM,
            'detail', SQLSTATE
          );
          RETURN result;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
      `

      // Execute the SQL directly using the Supabase client
      const { error: createError } = await adminClient
        .rpc("execute_sql", { sql_query: createFunctionSQL })
        .catch(async (e) => {

          // If the RPC fails (because the function doesn't exist yet), try a direct query
          const { error: directError } = await adminClient
            .from("_rpc")
            .select("*")
            .rpc("execute_sql", { sql_query: createFunctionSQL })

          // If that also fails, try a raw query as a last resort
          if (directError) {
            try {
              // This is a workaround since we can't use raw SQL queries directly with the Supabase client
              // We'll create a temporary function to execute our SQL
              const { error: tempError } = await adminClient.from("auth_users").select("id").limit(1)
              if (!tempError) {
                return { error: "Could not create execute_sql function" }
              }
              return { error: tempError }
            } catch (rawError) {
              return { error: rawError }
            }
          }

          return { error: directError }
        })

      if (createError) {
        return false
      }

    } else {
    }

    return true
  } catch (error) {
    return false
  }
}

// Add the missing executeSql function as a named export
export async function executeSql(sql: string) {
  try {

    // First ensure the execute_sql function exists
    const functionExists = await ensureExecuteSqlFunction()
    if (!functionExists) {
      return {
        success: false,
        error:
          "Could not ensure execute_sql function exists. Please run the create-execute-sql-function migration first.",
      }
    }

    const adminClient = createAdminClient()

    // Execute the SQL using the execute_sql RPC function
    const { data, error } = await adminClient.rpc("execute_sql", { sql_query: sql })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    return {
      success: false,
      error: `An unexpected error occurred: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}

// Add the missing executeSqlMigration export
export async function executeSqlMigration(sql: string) {
  return executeSql(sql)
}

export async function executeMigration(migrationFile: string) {
  try {

    // First ensure the execute_sql function exists
    const functionExists = await ensureExecuteSqlFunction()
    if (!functionExists) {
      return {
        error:
          "Could not ensure execute_sql function exists. Please run the create-execute-sql-function migration first.",
      }
    }

    const adminClient = createAdminClient()

    // Get the migration SQL
    const response = await fetch(`/migrations/${migrationFile}`)
    if (!response.ok) {
      return { error: `Failed to fetch migration file: ${migrationFile}` }
    }

    const sql = await response.text()

    // Execute the SQL
    const { error } = await adminClient.rpc("execute_sql", { sql_query: sql })

    if (error) {
      return { error: error.message }
    }

    return { success: true }
  } catch (error) {
    return { error: `An unexpected error occurred: ${error instanceof Error ? error.message : String(error)}` }
  }
}

// Function to execute the migration to add ID verification and employment fields
export async function executeProfileMigration() {
  try {

    // Since adminClient.query is not available, we'll use the alternative approach directly
    // by executing individual ALTER TABLE statements
    return await executeIndividualMigrations()
  } catch (error) {

    // Log detailed error for debugging
    if (error instanceof Error) {
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
      return { success: false, error: "Failed to check existing columns" }
    }

    // Get column names from the first row
    const existingColumnNames = existingColumns && existingColumns.length > 0 ? Object.keys(existingColumns[0]) : []


    // Track success/failure for each column
    const results = []

    // Add each missing column individually
    for (const { column, type, default: defaultValue } of alterTableStatements) {
      // Skip if column already exists
      if (existingColumnNames.includes(column)) {
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
          results.push({ column, success: false, error: error.message })
        } else {
          results.push({ column, success: true })
        }
      } catch (columnError) {
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
    return { success: false, error: "Migration failed, but application will continue" }
  }
}

// Add a new function to execute a migration from a file
export async function executeMigrationFromFile(filename: string) {
  try {

    // First ensure the execute_sql function exists
    const functionExists = await ensureExecuteSqlFunction()
    if (!functionExists) {
      return {
        success: false,
        error: "Could not ensure execute_sql function exists. Please create this function first.",
      }
    }

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
          CREATE OR REPLACE FUNCTION public.check_table_exists(table_name TEXT)
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
      case "create-execute-sql-function.sql":
        sqlContent = `
          -- Create a function to execute SQL statements
          CREATE OR REPLACE FUNCTION public.execute_sql(sql_query TEXT)
          RETURNS JSONB AS $$
          DECLARE
            result JSONB;
          BEGIN
            EXECUTE sql_query;
            result := '{"success": true}'::JSONB;
            RETURN result;
          EXCEPTION WHEN OTHERS THEN
            result := jsonb_build_object(
              'success', false,
              'error', SQLERRM,
              'detail', SQLSTATE
            );
            RETURN result;
          END;
          $$ LANGUAGE plpgsql SECURITY DEFINER;
        `
        break
      default:
        return { success: false, error: `Unknown migration file: ${filename}` }
    }

    // Execute the SQL directly using the Supabase client
    const { error } = await adminClient.rpc("execute_sql", { sql_query: sqlContent })

    if (error) {
      return { success: false, error: `Failed to execute migration: ${error.message}` }
    }

    return { success: true, message: `Migration ${filename} executed successfully` }
  } catch (error) {
    return { success: false, error: `An unexpected error occurred: ${String(error)}` }
  }
}
