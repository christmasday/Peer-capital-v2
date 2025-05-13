"use client"

import { useEffect, useState } from "react"

export function SupabaseStorageInitializer() {
  const [isInitialized, setIsInitialized] = useState(false)
  const [isInitializing, setIsInitializing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const MAX_RETRIES = 3

  useEffect(() => {
    const initialize = async () => {
      // Avoid multiple initialization attempts
      if (isInitializing || isInitialized) return

      setIsInitializing(true)

      try {
        console.log("Initializing storage from client component")

        // Call the API route to initialize storage
        const response = await fetch("/api/storage/initialize", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Failed to initialize storage")
        }

        const data = await response.json()
        console.log("Storage initialization result:", data)

        setIsInitialized(true)
      } catch (error) {
        console.error("Failed to initialize storage from client:", error)

        // Retry logic
        if (retryCount < MAX_RETRIES) {
          console.log(`Retrying storage initialization (${retryCount + 1}/${MAX_RETRIES})...`)
          setRetryCount((prev) => prev + 1)

          // Wait before retrying
          setTimeout(
            () => {
              setIsInitializing(false)
            },
            2000 * (retryCount + 1),
          ) // Exponential backoff
        } else {
          // Max retries reached, mark as initialized anyway to prevent further attempts
          console.warn("Max retries reached for storage initialization")
          setIsInitialized(true)
        }
      } finally {
        if (retryCount >= MAX_RETRIES) {
          setIsInitializing(false)
        }
      }
    }

    // Only run once or when retrying
    if (!isInitialized && !isInitializing) {
      initialize()
    }

    // Add a fallback timeout to ensure initialization is marked as complete
    // even if something goes wrong with the initialization process
    const fallbackTimer = setTimeout(() => {
      if (!isInitialized) {
        console.warn("Storage initialization fallback timeout triggered")
        setIsInitialized(true)
        setIsInitializing(false)
      }
    }, 10000)

    return () => clearTimeout(fallbackTimer)
  }, [isInitialized, isInitializing, retryCount])

  // This component doesn't render anything visible
  return null
}
