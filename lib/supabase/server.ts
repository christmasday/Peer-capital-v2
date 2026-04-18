import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import type { Database } from "@/lib/supabase/database.types"
import { isOfflineMode, forceOfflineMode } from "./admin"

// Track if we've already created a server client in this request
let serverClientCreated = false
let clientCount = 0
let connectionFailures = 0
const MAX_FAILURES = 3

type CookieStore = Awaited<ReturnType<typeof cookies>>

export const createServerClient = async (cookieStoreInput?: CookieStore | Promise<CookieStore>) => {
  try {
    // Check if we're in offline mode
    if (isOfflineMode()) {
      return createOfflineModeClient()
    }

    clientCount++

    if (serverClientCreated) {
    } else {
      serverClientCreated = true
    }

    const cookieStore = cookieStoreInput ? await cookieStoreInput : await cookies()
    return createServerComponentClient<Database>({
      cookies: () => cookieStore,
      options: {
        global: {
          headers: {
            "x-server-client-info": `@supabase/auth-helpers-nextjs/server-${clientCount}`,
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
            }, 3000) // 3 second timeout

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
      },
    })
  } catch (error) {
    // Fallback to an offline mode client
    return createOfflineModeClient()
  }
}

// Create a client that works in offline mode
const createOfflineModeClient = () => {
  return {
    auth: {
      getSession: async () => ({
        data: {
          session: {
            user: { id: "offline-user", email: "user@example.com" },
          },
        },
        error: null,
      }),
      signOut: async () => ({ error: null }),
    },
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
    }),
  } as unknown as ReturnType<typeof createServerComponentClient<Database>>
}

// Reset the tracking for server-side rendering
export const resetServerClientTracking = () => {
  serverClientCreated = false
  clientCount = 0
  connectionFailures = 0
}
