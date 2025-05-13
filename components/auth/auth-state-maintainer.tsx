"use client"

import { useEffect } from "react"
import Cookies from "js-cookie"
import { useRouter } from "next/navigation"

export function AuthStateMaintainer() {
  const router = useRouter()

  useEffect(() => {
    // Check for authentication tokens
    const checkAndRefreshAuth = () => {
      const jwtToken = localStorage.getItem("jwt-token")
      const authStatus = Cookies.get("auth-status")
      const supabaseToken = Cookies.get("sb-auth-token")
      const customAuthToken = Cookies.get("custom-auth-token")

      // If we have a JWT in localStorage but not in cookies, restore it
      if (jwtToken && !Cookies.get("jwt-token")) {
        Cookies.set("jwt-token", jwtToken, { path: "/", sameSite: "Lax" })
        console.log("Restored JWT token from localStorage to cookies")
      }

      // If we have auth status in localStorage but not in cookies, restore it
      const localAuthStatus = localStorage.getItem("is_authenticated")
      if (localAuthStatus === "true" && !authStatus) {
        Cookies.set("auth-status", "authenticated", { path: "/", sameSite: "Lax" })
        console.log("Restored auth status from localStorage to cookies")
      }

      // If we have any form of authentication, ensure the auth-status cookie is set
      if ((jwtToken || supabaseToken || customAuthToken) && !authStatus) {
        Cookies.set("auth-status", "authenticated", { path: "/", sameSite: "Lax" })
        console.log("Set auth-status cookie based on existing tokens")
      }
    }

    // Run on mount and periodically
    checkAndRefreshAuth()
    const interval = setInterval(checkAndRefreshAuth, 60000) // Check every minute

    return () => clearInterval(interval)
  }, [router])

  return null // This component doesn't render anything
}
