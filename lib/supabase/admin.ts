import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "./database.types"

// Circuit breaker pattern
let connectionFailures = 0
const MAX_FAILURES = 3
let lastFailureTime = 0
let isOfflineModeEnabled = false

// Export the offline mode check for use in other modules
export function isOfflineMode() {
  // Reset offline mode if it's been more than 5 minutes since the last failure
  if (isOfflineModeEnabled && Date.now() - lastFailureTime > 5 * 60 * 1000) {
    isOfflineModeEnabled = false
    connectionFailures = 0
  }
  return isOfflineModeEnabled
}

// Allow forcing offline mode from other modules
export function forceOfflineMode(value: boolean) {
  isOfflineModeEnabled = value
  if (value) {
    lastFailureTime = Date.now()
  }
}

// Create a mock client for offline mode
function createMockClient(): SupabaseClient<Database> {

  // Create a basic mock that won't throw errors
  return {
    from: (_table: string) => ({
      select: function () {
        return {
          eq: function () {
            return {
              single: async () => ({ data: null, error: null }),
              maybeSingle: async () => ({ data: null, error: null }),
              order: function () { return { data: [], error: null } },
            }
          },
          order: function () { return { data: [], error: null } },
          single: async () => ({ data: null, error: null }),
          maybeSingle: async () => ({ data: null, error: null }),
        }
      },
      insert: async () => ({ data: null, error: null }),
      update: function (_data: any) {
        // Return a query builder that supports .eq() chaining (thenable)
        const createQueryBuilder = (): any => ({
          eq: function (_column: string, _value: any) {
            return createQueryBuilder()
          },
          then: async (resolve: any) => resolve({ data: null, error: null }),
          catch: async (reject: any) => reject({ data: null, error: null })
        })
        return createQueryBuilder()
      },
      upsert: async () => ({ data: null, error: null }),
      delete: function () {
        // Return a query builder that supports .eq() chaining (thenable)
        const createQueryBuilder = (): any => ({
          eq: function (_column: string, _value: any) {
            return createQueryBuilder()
          },
          then: async (resolve: any) => resolve({ data: null, error: null }),
          catch: async (reject: any) => reject({ data: null, error: null })
        })
        return createQueryBuilder()
      },
    }),
    auth: {
      admin: {
        getUserById: async () => ({ data: { user: { user_metadata: {} } }, error: null }),
        listUsers: async () => ({ data: { users: [] }, error: null }),
        createUser: async (userData: any) => ({
          data: {
            user: {
              id: "mock-user-id",
              email: userData.email,
              user_metadata: userData.user_metadata || {},
            },
          },
          error: null,
        }),
      },
      getSession: async () => ({ data: { session: null }, error: null }),
    },
    storage: {
      from: (bucket: string) => ({
        upload: async () => ({ data: { path: "mock-path" }, error: null }),
        getPublicUrl: () => ({ data: { publicUrl: "/placeholder.svg" } }),
      }),
    },
  } as unknown as SupabaseClient<Database>
}

// Create a Supabase admin client
export function createAdminClient() {
  try {
    // Check if we're in offline mode
    if (isOfflineMode()) {
      return createMockClient()
    }

    // Get Supabase URL and service role key from environment variables
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    // Validate environment variables
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      forceOfflineMode(true)
      return createMockClient()
    }

    // Create the Supabase admin client with better error handling
    const adminClient = createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: {
        headers: {
          "x-admin-client-info": `@supabase/admin-client`,
        },
        fetch: (url, options) => {
          // Add timeout to fetch requests
          const controller = new AbortController()
          const timeoutId = setTimeout(() => {
            controller.abort()
            connectionFailures++
            if (connectionFailures >= MAX_FAILURES) {
              forceOfflineMode(true)
            }

            // Return a mock response instead of throwing
            return new Response(
              JSON.stringify({
                data: null,
                error: { message: "Request timed out - using fallback" },
              }),
              {
                headers: { "Content-Type": "application/json" },
                status: 200,
              },
            )
          }, 5000) // 5 second timeout

          return fetch(url, {
            ...options,
            signal: controller.signal,
          })
            .then((response) => {
              clearTimeout(timeoutId)
              // Reset failures on success
              connectionFailures = 0
              return response
            })
            .catch((error) => {
              clearTimeout(timeoutId)

              // Track failure for circuit breaker
              connectionFailures++

              // If we've hit the failure threshold, force offline mode
              if (connectionFailures >= MAX_FAILURES) {
                forceOfflineMode(true)
              }

              // Return a mock response instead of throwing
              return new Response(
                JSON.stringify({
                  data: null,
                  error: { message: "Network error - using fallback" },
                }),
                {
                  headers: { "Content-Type": "application/json" },
                  status: 200,
                },
              )
            })
        },
      },
    })

    return adminClient
  } catch (error) {
    forceOfflineMode(true)
    return createMockClient()
  }
}
