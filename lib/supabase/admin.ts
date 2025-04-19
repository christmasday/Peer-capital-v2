import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/supabase/database.types"

// Track failed connection attempts to implement circuit breaker
let connectionFailures = 0
const MAX_FAILURES = 3
let lastFailureTime = 0
const CIRCUIT_RESET_TIME = 30000 // 30 seconds
let isOfflineModeForced = false

// Create a mock client that doesn't make actual network requests
const createMockClient = () => {
  console.log("Creating mock Supabase admin client (offline mode)")

  // This is a mock client that returns empty results for all operations
  return {
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => ({ data: null, error: null }),
          limit: async () => ({ data: [], error: null }),
        }),
        limit: async () => ({ data: [], error: null }),
        order: () => ({
          limit: async () => ({ data: [], error: null }),
        }),
      }),
      insert: async () => ({ data: null, error: null }),
      update: async () => ({ data: null, error: null }),
    }),
    storage: {
      listBuckets: async () => ({ data: [], error: null }),
      createBucket: async () => ({ data: null, error: null }),
      from: () => ({
        upload: async () => ({ data: { path: "" }, error: null }),
        createPolicy: async () => ({ data: null, error: null }),
        getPublicUrl: () => ({ data: { publicUrl: "/vibrant-street-market.png" } }),
      }),
    },
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      signInWithPassword: async () => ({ data: { user: null, session: null }, error: { message: "Offline mode" } }),
      signUp: async () => ({ data: { user: null }, error: null }),
      signOut: async () => ({ error: null }),
      admin: {
        getUserById: async () => ({ data: { user: { user_metadata: {} } }, error: null }),
      },
    },
  } as unknown as ReturnType<typeof createClient<Database>>
}

// Force offline mode (useful for testing or when we know the network is down)
export const forceOfflineMode = (force = true) => {
  isOfflineModeForced = force
  console.log(`Offline mode ${force ? "enabled" : "disabled"} manually`)
  return isOfflineModeForced
}

// Create a Supabase client with the service role key for admin operations
export const createAdminClient = () => {
  // Check if offline mode is forced
  if (isOfflineModeForced) {
    console.log("Offline mode is forced - using mock client")
    return createMockClient()
  }

  // Check if circuit is open (too many recent failures)
  const now = Date.now()
  if (connectionFailures >= MAX_FAILURES && now - lastFailureTime < CIRCUIT_RESET_TIME) {
    console.log("Circuit breaker open - using mock client")
    return createMockClient()
  }

  // Check if required environment variables are available
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing required Supabase environment variables for admin client")
    return createMockClient()
  }

  try {
    // Create a real client with error handling
    const client = createClient<Database>(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      // Add shorter timeout to prevent hanging requests
      global: {
        fetch: (url, options) => {
          // Use a shorter timeout for admin operations
          const controller = new AbortController()
          const timeoutId = setTimeout(() => {
            controller.abort()
            console.log("Request timed out:", url.toString())

            // Track failure for circuit breaker
            connectionFailures++
            lastFailureTime = Date.now()

            // If we've hit the failure threshold, force offline mode
            if (connectionFailures >= MAX_FAILURES) {
              console.log(`Circuit breaker tripped after timeout - enabling offline mode`)
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
          }, 3000) // 3 second timeout

          return fetch(url, {
            ...options,
            signal: controller.signal,
          })
            .then((response) => {
              clearTimeout(timeoutId)
              // Reset failure count on success
              connectionFailures = 0
              return response
            })
            .catch((error) => {
              clearTimeout(timeoutId)
              console.error("Fetch error in admin client:", error.message || "Failed to fetch")

              // Track failure for circuit breaker
              connectionFailures++
              lastFailureTime = Date.now()

              // If we've hit the failure threshold, force offline mode
              if (connectionFailures >= MAX_FAILURES) {
                console.log(`Circuit breaker tripped after ${MAX_FAILURES} failures - enabling offline mode`)
                forceOfflineMode(true)
              }

              // Instead of throwing, return a mock response
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

    // Test the connection with a simple ping
    // We'll do this asynchronously to not block the client creation
    setTimeout(async () => {
      try {
        const pingPromise = client.from("profiles").select("count", { count: "exact", head: true }).limit(1)

        // Add a timeout to the ping
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error("Ping timed out")), 2000)
        })

        const { error } = (await Promise.race([pingPromise, timeoutPromise])) as any

        if (error) {
          console.warn("Admin client ping failed:", error.message)
          connectionFailures++
          lastFailureTime = Date.now()

          // If we've hit the failure threshold, force offline mode
          if (connectionFailures >= MAX_FAILURES) {
            console.log(`Circuit breaker tripped after ping failure - enabling offline mode`)
            forceOfflineMode(true)
          }
        }
      } catch (e) {
        console.error("Admin client ping error:", e instanceof Error ? e.message : String(e))
        connectionFailures++
        lastFailureTime = Date.now()

        // If we've hit the failure threshold, force offline mode
        if (connectionFailures >= MAX_FAILURES) {
          console.log(`Circuit breaker tripped after ping error - enabling offline mode`)
          forceOfflineMode(true)
        }
      }
    }, 0)

    return client
  } catch (error) {
    console.error("Error creating Supabase admin client:", error instanceof Error ? error.message : String(error))
    connectionFailures++
    lastFailureTime = Date.now()
    return createMockClient()
  }
}

// Function to check if we're in offline mode
export const isOfflineMode = () => {
  return isOfflineModeForced || connectionFailures >= MAX_FAILURES
}

// Function to reset the circuit breaker
export const resetCircuitBreaker = () => {
  connectionFailures = 0
  lastFailureTime = 0
  isOfflineModeForced = false
  console.log("Circuit breaker reset - offline mode disabled")
}
