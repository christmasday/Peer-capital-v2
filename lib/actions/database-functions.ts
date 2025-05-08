"use server"

import { createAdminClient } from "@/lib/supabase/admin"

/**
 * Checks if a table exists in the database.
 *
 * @param {string} tableName - The name of the table to check.
 * @returns {Promise<boolean>} - Returns true if the table exists, false otherwise.
 *
 * @example
 * // Check if the 'users' table exists
 * const exists = await checkTableExists('users');
 * if (exists) {
 *   console.log('Users table exists');
 * }
 */
export async function checkTableExists(tableName: string): Promise<boolean> {
  try {
    console.log(`Checking if table ${tableName} exists`)
    const adminClient = createAdminClient()

    // Method 1: Try to select from the table
    try {
      const { data, error } = await adminClient.from(tableName).select("*").limit(1)

      if (!error) {
        console.log(`Table ${tableName} exists (method 1)`)
        return true
      }
    } catch (error) {
      console.log(`Error checking table ${tableName} with method 1:`, error)
      // Continue to next method
    }

    // Method 2: Try using information_schema
    try {
      const { data, error } = await adminClient
        .from("information_schema.tables")
        .select("table_name")
        .eq("table_name", tableName)
        .eq("table_schema", "public")
        .limit(1)

      if (!error && data && data.length > 0) {
        console.log(`Table ${tableName} exists (method 2)`)
        return true
      }
    } catch (error) {
      console.log(`Error checking table ${tableName} with method 2:`, error)
      // Continue to next method
    }

    // Method 3: Try using SQL query
    try {
      const checkTableSQL = `
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = '${tableName}'
        );
      `

      const { success, result } = await executeSQL(checkTableSQL)

      if (success && result && result.length > 0) {
        const exists = result[0].exists
        console.log(`Table ${tableName} exists: ${exists} (method 3)`)
        return exists
      }
    } catch (error) {
      console.log(`Error checking table ${tableName} with method 3:`, error)
    }

    console.log(`Table ${tableName} does not exist or could not be verified`)
    return false
  } catch (error) {
    console.error(`Unexpected error checking if table ${tableName} exists:`, error)
    return false
  }
}

/**
 * Executes a SQL query on the database.
 * Tries multiple methods to execute the query, falling back to alternatives if one fails.
 *
 * @param {string} sql - The SQL query to execute.
 * @returns {Promise<{success: boolean, result?: any[], error?: string}>} - Object containing:
 *   - success: Whether the query executed successfully
 *   - result: Array of results (if successful)
 *   - error: Error message (if unsuccessful)
 *
 * @example
 * // Execute a simple SELECT query
 * const { success, result, error } = await executeSQL('SELECT * FROM users LIMIT 10');
 * if (success) {
 *   console.log('Query results:', result);
 * } else {
 *   console.error('Query failed:', error);
 * }
 */
export async function executeSQL(sql: string): Promise<{ success: boolean; result?: any[]; error?: string }> {
  try {
    console.log("Executing SQL:", sql.substring(0, 100) + (sql.length > 100 ? "..." : ""))
    const adminClient = createAdminClient()

    // Method 1: Try using the execute_sql function if it exists
    try {
      const { data: result, error } = await adminClient.rpc("execute_sql", { sql_query: sql })

      if (!error) {
        console.log("SQL executed successfully using execute_sql function")
        return { success: true, result }
      } else {
        console.log("Error executing SQL with execute_sql function:", error)
        // Continue to next method
      }
    } catch (error) {
      console.log("Error calling execute_sql function:", error)
      // Continue to next method
    }

    // Method 2: Try using the sql RPC function
    try {
      const { data: result, error } = await adminClient.rpc("sql", { query: sql })

      if (!error) {
        console.log("SQL executed successfully using sql RPC")
        return { success: true, result }
      } else {
        console.log("Error executing SQL with sql RPC:", error)
        // Continue to next method
      }
    } catch (error) {
      console.log("Error calling sql RPC:", error)
      // Continue to next method
    }

    // Method 3: Try using the pgfunction RPC
    try {
      const { data: result, error } = await adminClient.rpc("pgfunction", { query: sql })

      if (!error) {
        console.log("SQL executed successfully using pgfunction RPC")
        return { success: true, result }
      } else {
        console.log("Error executing SQL with pgfunction RPC:", error)
        // Continue to next method
      }
    } catch (error) {
      console.log("Error calling pgfunction RPC:", error)
      // Continue to next method
    }

    // Method 4: Try using raw SQL query if available
    try {
      // This is a placeholder - Supabase JS client doesn't support raw SQL queries directly
      // In a real implementation, you might use a server-side PostgreSQL client
      console.log("No more methods available to execute SQL")
      return { success: false, error: "No available method to execute SQL" }
    } catch (error) {
      console.log("Error with raw SQL execution:", error)
    }

    return { success: false, error: "All SQL execution methods failed" }
  } catch (error) {
    console.error("Unexpected error executing SQL:", error)
    return { success: false, error: String(error) }
  }
}

/**
 * Checks if a database function exists.
 *
 * @param {string} functionName - The name of the function to check.
 * @returns {Promise<boolean>} - Returns true if the function exists, false otherwise.
 *
 * @example
 * // Check if the 'execute_sql' function exists
 * const exists = await checkFunctionExists('execute_sql');
 * if (!exists) {
 *   // Create the function if it doesn't exist
 *   await createExecuteSqlFunction();
 * }
 */
export async function checkFunctionExists(functionName: string): Promise<boolean> {
  try {
    console.log(`Checking if function ${functionName} exists`)

    // Try to call the function with a simple query to see if it exists
    const testResult = await executeSQL(`SELECT ${functionName}('SELECT 1') AS result`)

    if (testResult.success) {
      console.log(`Function ${functionName} exists`)
      return true
    }

    console.log(`Function ${functionName} does not exist or could not be verified`)
    return false
  } catch (error) {
    console.log(`Error checking if function ${functionName} exists:`, error)
    return false
  }
}

/**
 * Creates the check_table_exists database function if it doesn't already exist.
 * This function allows checking if a table exists directly from SQL.
 *
 * @returns {Promise<{success: boolean, message?: string, error?: string}>} - Object containing:
 *   - success: Whether the function was created successfully
 *   - message: Success message (if successful)
 *   - error: Error message (if unsuccessful)
 *
 * @example
 * // Create the check_table_exists function
 * const { success, message, error } = await createCheckTableExistsFunction();
 * if (success) {
 *   console.log(message);
 * } else {
 *   console.error(error);
 * }
 */
export async function createCheckTableExistsFunction(): Promise<{
  success: boolean
  message?: string
  error?: string
}> {
  try {
    console.log("Creating check_table_exists function")

    // Check if the function already exists
    const functionExists = await checkFunctionExists("check_table_exists")
    if (functionExists) {
      return { success: true, message: "check_table_exists function already exists" }
    }

    // SQL to create the function
    const createFunctionSQL = `
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

    // Execute the SQL
    const result = await executeSQL(createFunctionSQL)

    if (result.success) {
      return { success: true, message: "check_table_exists function created successfully" }
    } else {
      return { success: false, error: result.error || "Failed to create check_table_exists function" }
    }
  } catch (error) {
    console.error("Unexpected error creating check_table_exists function:", error)
    return {
      success: false,
      error: `An unexpected error occurred: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}

/**
 * Creates the execute_sql database function if it doesn't already exist.
 * This function allows executing arbitrary SQL queries from within the database.
 *
 * @returns {Promise<{success: boolean, message?: string, error?: string}>} - Object containing:
 *   - success: Whether the function was created successfully
 *   - message: Success message (if successful)
 *   - error: Error message (if unsuccessful)
 *
 * @example
 * // Create the execute_sql function
 * const { success, message, error } = await createExecuteSqlFunction();
 * if (success) {
 *   console.log(message);
 *   // Now you can use the execute_sql function in your database
 * } else {
 *   console.error(error);
 * }
 *
 * @security This function creates a SECURITY DEFINER function that runs with elevated privileges.
 * Be careful about who has permission to call this function as it can execute arbitrary SQL.
 */
export async function createExecuteSqlFunction(): Promise<{
  success: boolean
  message?: string
  error?: string
}> {
  try {
    console.log("Creating execute_sql function")

    // Check if the function already exists
    const functionExists = await checkFunctionExists("execute_sql")
    if (functionExists) {
      return { success: true, message: "execute_sql function already exists" }
    }

    // SQL to create the function
    const createFunctionSQL = `
      CREATE OR REPLACE FUNCTION public.execute_sql(sql_query TEXT)
      RETURNS JSONB AS $$
      DECLARE
        result JSONB;
      BEGIN
        EXECUTE 'WITH query_result AS (' || sql_query || ') SELECT jsonb_agg(row_to_json(query_result)) FROM query_result' INTO result;
        RETURN COALESCE(result, '[]'::JSONB);
      EXCEPTION
        WHEN OTHERS THEN
          RAISE EXCEPTION 'Error executing SQL: %', SQLERRM;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `

    // Execute the SQL
    const result = await executeSQL(createFunctionSQL)

    if (result.success) {
      return { success: true, message: "execute_sql function created successfully" }
    } else {
      return { success: false, error: result.error || "Failed to create execute_sql function" }
    }
  } catch (error) {
    console.error("Unexpected error creating execute_sql function:", error)
    return {
      success: false,
      error: `An unexpected error occurred: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}
