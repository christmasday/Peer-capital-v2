"use client"

import { useEffect, useCallback, useState } from "react"
import { refreshJWT } from "@/lib/actions/auth"
import { getJWTFromStorage, parseJWT, isJWTExpired } from "@/lib/jwt-client"

// Configuration
const REFRESH_INTERVAL = 5 * 60 * 1000 // Check every 5 minutes
const REFRESH_THRESHOLD = 15 * 60 // Refresh if less than 15 minutes left (in seconds)

export function useJwtRefresh() {
  const [lastRefreshed, setLastRefreshed] = useState<number>(0)
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false)
  const [refreshError, setRefreshError] = useState<string | null>(null)

  const checkAndRefreshToken = useCallback(async () => {
    try {
      // Skip if we've refreshed in the last minute (prevent rapid refreshes)
      if (Date.now() - lastRefreshed < 60000) {
        return
      }

      // Get the current JWT from storage
      const currentToken = getJWTFromStorage()

      if (!currentToken) {
        // No token to refresh
        return
      }

      // Check if token is expired or about to expire
      if (!isJWTExpired(currentToken)) {
        // Parse the token to get expiration time
        const payload = parseJWT(currentToken)

        if (!payload || !payload.exp) {
          console.error("Invalid JWT payload")
          return
        }

        // Calculate time until expiry in seconds
        const currentTime = Math.floor(Date.now() / 1000)
        const timeUntilExpiry = payload.exp - currentTime

        // Only refresh if token is about to expire (less than REFRESH_THRESHOLD)
        if (timeUntilExpiry > REFRESH_THRESHOLD) {
          return
        }
      }

      // Token needs refreshing
      setIsRefreshing(true)
      setRefreshError(null)

      const result = await refreshJWT(currentToken)

      if (result.error) {
        console.error("Error refreshing JWT:", result.error)
        setRefreshError(result.error)
      } else if (result.refreshed) {
        console.log("JWT refreshed successfully")
        setLastRefreshed(Date.now())
      }
    } catch (error) {
      console.error("Unexpected error in JWT refresh:", error)
      setRefreshError(error instanceof Error ? error.message : String(error))
    } finally {
      setIsRefreshing(false)
    }
  }, [lastRefreshed])

  // Set up interval to check and refresh token
  useEffect(() => {
    // Check immediately on mount
    checkAndRefreshToken()

    // Set up interval for regular checks
    const intervalId = setInterval(checkAndRefreshToken, REFRESH_INTERVAL)

    // Clean up interval on unmount
    return () => clearInterval(intervalId)
  }, [checkAndRefreshToken])

  // Also check when the window regains focus
  useEffect(() => {
    const handleFocus = () => {
      checkAndRefreshToken()
    }

    window.addEventListener("focus", handleFocus)

    return () => {
      window.removeEventListener("focus", handleFocus)
    }
  }, [checkAndRefreshToken])

  return {
    isRefreshing,
    refreshError,
    lastRefreshed,
    manualRefresh: checkAndRefreshToken,
  }
}
