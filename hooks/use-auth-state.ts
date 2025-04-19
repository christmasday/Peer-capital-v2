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
          console.log("Session expiring soon, refreshing...")
          const { data: refreshData, error } = await supabase.auth.refreshSession()

          if (error) {
            console.error("Error refreshing session:", error)
            // If refresh fails, redirect to login
            router.push("/")
          } else if (refreshData.session) {
            console.log("Session refreshed successfully")
            try {
              localStorage.setItem(
                "auth_state",
                JSON.stringify({
                  isLoggedIn: true,
                  timestamp: Date.now(),
                }),
              )
            } catch (e) {
              console.error("Error setting localStorage:", e)
            }
          }
        }
      } else {
        console.log("No session found in useAuthState")

        // Check localStorage as fallback
        try {
          const authState = localStorage.getItem("auth_state")
          if (!authState) {
            console.log("No auth state in localStorage, redirecting")
            router.push("/")
            return
          }

          const { isLoggedIn, timestamp } = JSON.parse(authState)
          const oneHourAgo = Date.now() - 60 * 60 * 1000

          if (!isLoggedIn || timestamp <= oneHourAgo) {
            console.log("Auth state expired or invalid, redirecting")
            router.push("/")
          }
        } catch (e) {
          console.error("Error checking localStorage:", e)
          router.push("/")
        }
      }
    } catch (error) {
      console.error("Error in checkAndRefreshSession:", error)
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
      console.error("Error checking signout timestamp:", error)
    }

    // Set up auth state change listener
    let authListener: { data: { subscription: { unsubscribe: () => void } } } | undefined

    if (supabase) {
      try {
        authListener = supabase.auth.onAuthStateChange((event, session) => {
          console.log("Auth state changed:", event)

          if (event === "SIGNED_OUT") {
            // Clear local storage
            try {
              localStorage.removeItem("auth_state")
            } catch (e) {
              console.error("Error clearing localStorage:", e)
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
              console.error("Error setting localStorage:", e)
            }
          }
        })
      } catch (error) {
        console.error("Error setting up auth state change listener:", error)
      }
    }

    return () => {
      if (authListener?.data?.subscription) {
        try {
          authListener.data.subscription.unsubscribe()
        } catch (error) {
          console.error("Error unsubscribing from auth state changes:", error)
        }
      }
    }
  }, [resetClient, router, supabase])

  return null
}
