import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "@/lib/supabase/database.types"

// Create a single supabase client for the entire client-side application
let supabaseInstance: ReturnType<typeof createClientComponentClient<Database>> | null = null
let instanceCount = 0

export const createBrowserClient = () => {
  instanceCount++

  // Log a warning if multiple instances are being created
  if (instanceCount > 1) {
    console.warn(
      `Warning: createBrowserClient called ${instanceCount} times. This may cause issues with authentication.`,
    )
  }

  if (!supabaseInstance) {
    console.log("Creating new Supabase browser client instance")
    try {
      supabaseInstance = createClientComponentClient<Database>({
        options: {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
            storageKey: "supabase-auth-token",
            storage: {
              getItem: (key) => {
                try {
                  return localStorage.getItem(key)
                } catch (error) {
                  console.error("Error accessing localStorage:", error)
                  return null
                }
              },
              setItem: (key, value) => {
                try {
                  localStorage.setItem(key, value)
                } catch (error) {
                  console.error("Error writing to localStorage:", error)
                }
              },
              removeItem: (key) => {
                try {
                  localStorage.removeItem(key)
                } catch (error) {
                  console.error("Error removing from localStorage:", error)
                }
              },
            },
          },
          global: {
            headers: {
              "x-client-info": `@supabase/auth-helpers-nextjs/client-${instanceCount}`,
            },
          },
        },
      })
    } catch (error) {
      console.error("Error creating Supabase browser client:", error)
      // Return a dummy client that won't throw errors
      return createDummyClient()
    }
  } else {
    console.log("Reusing existing Supabase browser client instance")
  }

  return supabaseInstance
}

// Create a dummy client for error cases
const createDummyClient = () => {
  return {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      getUser: async () => ({ data: { user: null }, error: null }),
      signInWithPassword: async () => ({
        data: { user: null, session: null },
        error: { message: "Client unavailable" },
      }),
      signOut: async () => ({ error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } }, error: null }),
    },
  } as unknown as ReturnType<typeof createClientComponentClient<Database>>
}

// Reset the instance (useful for testing or when signing out)
export const resetBrowserClient = () => {
  if (supabaseInstance) {
    try {
      // Try to sign out before resetting, but don't wait for it
      const signOutPromise = supabaseInstance.auth.signOut({ scope: "global" })

      // Add a timeout to prevent hanging
      const timeoutPromise = new Promise((resolve) => {
        setTimeout(() => {
          console.log("Client reset signout timed out, continuing anyway")
          resolve(null)
        }, 1000) // 1 second timeout
      })

      // Race the promises
      Promise.race([signOutPromise, timeoutPromise]).catch((error) => {
        console.log("Error during client reset signout:", error)
      })
    } catch (error) {
      console.error("Error during client reset:", error)
    }
  }

  // Reset the instance regardless of signout success
  supabaseInstance = null
  instanceCount = 0
  console.log("Supabase browser client instance reset")
}
