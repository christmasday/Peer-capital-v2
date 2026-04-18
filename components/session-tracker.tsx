"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"

interface SessionTrackerProps {
  userId: string
}

export function SessionTracker({ userId }: SessionTrackerProps) {
  const router = useRouter()
  const sessionTokenRef = useRef<string>(`session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`)
  const activityIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Track login when component mounts
  useEffect(() => {
    const trackLogin = async () => {
      try {
        await fetch("/api/session/track", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "login",
            sessionToken: sessionTokenRef.current,
            userAgent: navigator.userAgent,
          }),
        })
      } catch (error) {
        console.error("Error tracking login:", error)
      }
    }

    trackLogin()

    // Set up activity tracking
    const trackActivity = async () => {
      try {
        await fetch("/api/session/track", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "activity",
            sessionToken: sessionTokenRef.current,
          }),
        })
      } catch (error) {
        console.error("Error tracking activity:", error)
      }
    }

    // Track activity every 5 minutes
    activityIntervalRef.current = setInterval(trackActivity, 5 * 60 * 1000)

    // Track activity on user interactions
    const handleUserActivity = () => {
      trackActivity()
    }

    // Add event listeners for user activity
    const events = ["mousedown", "mousemove", "keypress", "scroll", "touchstart", "click"]
    events.forEach(event => {
      document.addEventListener(event, handleUserActivity, { passive: true })
    })

    // Cleanup function
    return () => {
      if (activityIntervalRef.current) {
        clearInterval(activityIntervalRef.current)
      }
      
      events.forEach(event => {
        document.removeEventListener(event, handleUserActivity)
      })

      // Track logout when component unmounts
      const trackLogout = async () => {
        try {
          await fetch("/api/session/track", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              action: "logout",
              sessionToken: sessionTokenRef.current,
            }),
          })
        } catch (error) {
          console.error("Error tracking logout:", error)
        }
      }

      trackLogout()
    }
  }, [userId])

  // Track logout on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Use sendBeacon for more reliable logout tracking
      const data = JSON.stringify({
        action: "logout",
        sessionToken: sessionTokenRef.current,
      })
      
      if (navigator.sendBeacon) {
        navigator.sendBeacon("/api/session/track", data)
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [])

  // This component doesn't render anything
  return null
}
