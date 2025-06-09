"use client"

import { useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "./use-supabase"

export function useAuthState() {
  const { supabase, resetClient } = useSupabase()
  const router = useRouter()

  const checkAndRefreshSession = useCallback(async () => {
    if (!supabase) return

    try {
      const { data } = await supabase.auth.getSession()

      if (data.session) {
        // If session exists but is about to expire (less than 10 minutes), refresh it
        const expiresAt = data.session.expires_at
        const now = Math.floor(Date.now() / 1000)
        const timeUntilExpiry = expiresAt - now

        if (timeUntilExpiry < 600) {
          // 10 minutes
          const { data: refreshData, error } = await supabase.auth.refreshSession()

          if (error) {
            // If refresh fails, redirect to login
            router.push("/")
          } else if (refreshData.session) {
            try {
              localStorage.setItem(
                "auth_state",
                JSON.stringify({
                  isLoggedIn: true,
                  timestamp: Date.now(),
                }),
              )
            } catch (e) {
            }
          }
        }
      } else {

        // Check localStorage as fallback
        try {
          const authState = localStorage.getItem("auth_state")
          if (!authState) {
            router.push("/")
            return
          }

          const { isLoggedIn, timestamp } = JSON.parse(authState)
          const oneHourAgo = Date.now() - 60 * 60 * 1000

          if (!isLoggedIn || timestamp <= oneHourAgo) {
            router.push("/")
          }
        } catch (e) {
          router.push("/")
        }
      }
    } catch (error) {
    }
  }, [supabase, router])

  useEffect(() => {
    // Check session on mount
    checkAndRefreshSession()

    // Set up interval to check session periodically
    const intervalId = setInterval(checkAndRefreshSession, 5 * 60 * 1000) // Every 5 minutes

    return () => clearInterval(intervalId)
  }, [checkAndRefreshSession])

  useEffect(() => {
    // Check for signout cookie
    const checkSignoutCookie = () => {
      const cookies = document.cookie.split(";")
      const signoutCookie = cookies.find((cookie) => cookie.trim().startsWith("auth-signout="))

      if (signoutCookie) {
        // Clear the cookie
        document.cookie = "auth-signout=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"

        // Reset the client
        if (resetClient) {
          resetClient()
        }

        // Redirect to login
        router.push("/")
      }
    }

    checkSignoutCookie()

    // Check for signout URL parameter
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get("signout") === "true") {
      // Clear the parameter from URL without reloading
      window.history.replaceState({}, document.title, window.location.pathname)

      // Reset the client
      if (resetClient) {
        resetClient()
      }

      // Redirect to login
      router.push("/")
    }

    // Check for signout timestamp in localStorage
    try {
      const signoutTimestamp = localStorage.getItem("signout-timestamp")
      if (signoutTimestamp) {
        // Remove the timestamp
        localStorage.removeItem("signout-timestamp")

        // Reset the client
        if (resetClient) {
          resetClient()
        }

        // Redirect to login
        router.push("/")
      }
    } catch (error) {
    }

    // Set up auth state change listener
    let authListener: { data: { subscription: { unsubscribe: () => void } } } | undefined

    if (supabase) {
      try {
        authListener = supabase.auth.onAuthStateChange((event, session) => {

          if (event === "SIGNED_OUT") {
            // Clear local storage
            try {
              localStorage.removeItem("auth_state")
            } catch (e) {
            }

            // Redirect to login
            router.push("/")
          } else if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
            // Update local storage
            try {
              localStorage.setItem(
                "auth_state",
                JSON.stringify({
                  isLoggedIn: true,
                  timestamp: Date.now(),
                }),
              )
            } catch (e) {
            }
          }
        })
      } catch (error) {
      }
    }

    return () => {
      if (authListener?.data?.subscription) {
        try {
          authListener.data.subscription.unsubscribe()
        } catch (error) {
        }
      }
    }
  }, [resetClient, router, supabase])

  return null
}
