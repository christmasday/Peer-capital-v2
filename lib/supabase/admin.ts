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
    console.log("Resetting offline mode after 5 minutes of no failures")
    isOfflineModeEnabled = false
    connectionFailures = 0
  }
  return isOfflineModeEnabled
}

// Allow forcing offline mode from other modules
export function forceOfflineMode(value: boolean) {
  console.log(`Forcing offline mode: ${value}`)
  isOfflineModeEnabled = value
  if (value) {
    lastFailureTime = Date.now()
  }
}

// Create a mock client for offline mode
function createMockClient(): SupabaseClient<Database> {
  console.log("Creating mock Supabase admin client for offline mode")

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
      update: async () => ({ data: null, error: null }),
      upsert: async () => ({ data: null, error: null }),
      delete: async () => ({ data: null, error: null }),
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
      console.error("Missing Supabase environment variables for admin client")
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
            console.log("Admin client request timed out:", url.toString())
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
              console.error("Fetch error in admin client:", error.message || "Failed to fetch")

              // Track failure for circuit breaker
              connectionFailures++

              // If we've hit the failure threshold, force offline mode
              if (connectionFailures >= MAX_FAILURES) {
                console.log(`Circuit breaker tripped after ${connectionFailures} failures - enabling offline mode`)
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
    console.error("Error creating Supabase admin client:", error)
    forceOfflineMode(true)
    return createMockClient()
  }
}
