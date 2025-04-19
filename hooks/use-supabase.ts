"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { createBrowserClient, resetBrowserClient } from "@/lib/supabase/client"
import type { SupabaseClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "@/lib/supabase/database.types"
import type { Session } from "@supabase/supabase-js"

export function useSupabase() {
  // Use ref to ensure we always use the same client instance
  const supabaseRef = useRef<SupabaseClient<Database> | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const resetAttemptedRef = useRef(false)

  // Initialize the client only once
  if (!supabaseRef.current) {
    supabaseRef.current = createBrowserClient()
  }

  // Memoize the resetClient function to prevent unnecessary re-renders
  const resetClient = useCallback(() => {
    try {
      // Prevent multiple reset attempts
      if (resetAttemptedRef.current) {
        return true
      }

      resetAttemptedRef.current = true

      // Reset the browser client
      resetBrowserClient()

      // Update the ref with a new client
      supabaseRef.current = createBrowserClient()

      // Update the session state
      setSession(null)

      console.log("Client reset successfully")
      return true
    } catch (error) {
      console.error("Error resetting client:", error)
      return false
    } finally {
      // Reset the attempt flag after a delay
      setTimeout(() => {
        resetAttemptedRef.current = false
      }, 5000)
    }
  }, [])

  useEffect(() => {
    // Get the initial session
    const getSession = async () => {
      try {
        if (!supabaseRef.current) return

        const { data, error } = await supabaseRef.current.auth.getSession()

        if (error) {
          console.error("Error getting session:", error)
        } else {
          setSession(data.session)

          // If we have a session but it's about to expire, refresh it
          if (data.session) {
            const expiresAt = data.session.expires_at
            const now = Math.floor(Date.now() / 1000)
            const timeUntilExpiry = expiresAt - now

            // If session expires in less than 5 minutes, refresh it
            if (timeUntilExpiry < 300) {
              console.log("Session about to expire, refreshing...")
              try {
                const { data: refreshData, error: refreshError } = await supabaseRef.current.auth.refreshSession()
                if (refreshError) {
                  console.error("Error refreshing session:", refreshError)
                } else if (refreshData.session) {
                  setSession(refreshData.session)
                  console.log("Session refreshed successfully")
                }
              } catch (refreshError) {
                console.error("Unexpected error refreshing session:", refreshError)
              }
            }
          }
        }
      } catch (error) {
        console.error("Unexpected error getting session:", error)
      } finally {
        setLoading(false)
      }
    }

    getSession()

    // Set up auth state change listener
    let subscription: { unsubscribe: () => void } | undefined

    try {
      if (supabaseRef.current) {
        const { data } = supabaseRef.current.auth.onAuthStateChange((_event, session) => {
          setSession(session)
        })
        subscription = data.subscription
      }
    } catch (error) {
      console.error("Error setting up auth state change listener:", error)
    }

    // Check for signout URL parameter
    const checkSignoutParam = () => {
      const urlParams = new URLSearchParams(window.location.search)
      if (urlParams.get("signout") === "true") {
        // Clear the parameter from URL without reloading
        const newUrl = window.location.pathname + window.location.hash
        window.history.replaceState({}, document.title, newUrl)

        // Reset the client
        resetClient()
      }
    }

    checkSignoutParam()

    // Check for signout timestamp in localStorage
    const checkSignoutTimestamp = () => {
      try {
        const signoutTimestamp = localStorage.getItem("signout-timestamp")
        if (signoutTimestamp) {
          // Remove the timestamp
          localStorage.removeItem("signout-timestamp")

          // Reset the client
          resetClient()
        }
      } catch (error) {
        console.error("Error checking signout timestamp:", error)
      }
    }

    checkSignoutTimestamp()

    // Clean up subscription on unmount
    return () => {
      if (subscription) {
        try {
          subscription.unsubscribe()
        } catch (error) {
          console.error("Error unsubscribing from auth state changes:", error)
        }
      }
    }
  }, [resetClient])

  return {
    supabase: supabaseRef.current,
    session,
    loading,
    resetClient,
  }
}
