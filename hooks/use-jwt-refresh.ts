"use client"

import { useEffect } from "react"
import { refreshJWT } from "@/lib/actions/auth"
import { getJWTFromStorage, isJWTExpired } from "@/lib/jwt-client"

export function useJWTRefresh() {
  useEffect(() => {
    // Function to check and refresh JWT if needed
    const checkAndRefreshJWT = async () => {
      try {
        const jwt = getJWTFromStorage()
        if (!jwt) return

        // Check if token is expired or about to expire (within 5 minutes)
        if (isJWTExpired(jwt, 300)) {
          // 300 seconds = 5 minutes
          console.log("JWT is expired or about to expire, refreshing...")
          const result = await refreshJWT(jwt)

          if (result.error) {
            console.error("Failed to refresh JWT:", result.error)
          } else if (result.success) {
            console.log("JWT refreshed successfully")
          }
        }
      } catch (error) {
        console.error("Error in JWT refresh check:", error)
      }
    }

    // Check immediately on mount
    checkAndRefreshJWT()

    // Set up interval to check periodically (every 5 minutes)
    const interval = setInterval(checkAndRefreshJWT, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [])
}
