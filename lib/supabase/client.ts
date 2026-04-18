import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "@/lib/supabase/database.types"

type BrowserSupabaseClient = ReturnType<typeof createClientComponentClient<Database>>

declare global {
  var __peerCapitalSupabaseClient: BrowserSupabaseClient | undefined
  var __peerCapitalSupabaseClientCreations: number | undefined
}

export const createBrowserClient = () => {
  // Browser-only helper; return a safe fallback on the server.
  if (typeof window === "undefined") {
    return createDummyClient()
  }

  if (!globalThis.__peerCapitalSupabaseClient) {
    const creations = (globalThis.__peerCapitalSupabaseClientCreations || 0) + 1
    globalThis.__peerCapitalSupabaseClientCreations = creations

    if (creations > 1) {
      console.warn(
        `Warning: createBrowserClient created ${creations} client instances. This may cause auth instability.`,
      )
    }

    try {
      globalThis.__peerCapitalSupabaseClient = createClientComponentClient<Database>({
        options: {
          global: {
            headers: {
              "x-client-info": "@supabase/auth-helpers-nextjs/client",
            },
          },
        },
        // If you want to customize storage, you can do so here (optional):
        // storage: {
        //   getItem: (key: string) => {
        //     try {
        //       return localStorage.getItem(key)
        //     } catch (error) {
        //       return null
        //     }
        //   },
        //   setItem: (key: string, value: string) => {
        //     try {
        //       localStorage.setItem(key, value)
        //     } catch (error) {}
        //   },
        //   removeItem: (key: string) => {
        //     try {
        //       localStorage.removeItem(key)
        //     } catch (error) {}
        //   },
        // },
      })
    } catch (error) {
      // Return a dummy client that won't throw errors
      return createDummyClient()
    }
  }

  return globalThis.__peerCapitalSupabaseClient
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
  if (globalThis.__peerCapitalSupabaseClient) {
    try {
      // Try to sign out before resetting, but don't wait for it
      const signOutPromise = globalThis.__peerCapitalSupabaseClient.auth.signOut({ scope: "global" })

      // Add a timeout to prevent hanging
      const timeoutPromise = new Promise((resolve) => {
        setTimeout(() => {
          resolve(null)
        }, 1000) // 1 second timeout
      })

      // Race the promises
      Promise.race([signOutPromise, timeoutPromise]).catch((error) => {
      })
    } catch (error) {
    }
  }

  // Reset the instance regardless of signout success
  globalThis.__peerCapitalSupabaseClient = undefined
  globalThis.__peerCapitalSupabaseClientCreations = 0
}
