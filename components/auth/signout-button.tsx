"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { signOut } from "@/lib/actions/auth"
import { clearJWTFromStorage } from "@/lib/jwt-client"

interface SignoutButtonProps {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  className?: string
  children?: React.ReactNode
  onClick?: () => void
}

export function SignoutButton({ variant = "ghost", className, children, onClick }: SignoutButtonProps) {
  const [isSigningOut, setIsSigningOut] = useState(false)

  const handleSignOut = async () => {
    if (isSigningOut) return // Prevent multiple clicks

    try {
      setIsSigningOut(true)

      if (onClick) {
        onClick()
      }

      // Clear JWT from localStorage
      clearJWTFromStorage()

      // Set a local storage flag to indicate signout
      if (typeof window !== "undefined") {
        localStorage.setItem("signout-timestamp", Date.now().toString())

        // Clear authentication flags
        localStorage.removeItem("auth_bypass")
        localStorage.removeItem("auth_bypass_time")
        localStorage.removeItem("is_authenticated")
      }

      // Call the server action
      const result = await signOut()

      // Use a timeout to ensure the UI has time to update before redirect
      setTimeout(() => {
        // Force a full page reload to clear all client state
        window.location.href = result.redirectUrl || "/?signout=true"
      }, 100)
    } catch (error) {
      console.error("Error during sign out:", error)
      // Fallback to direct navigation after a short delay
      setTimeout(() => {
        window.location.href = "/?signout=true"
      }, 100)
    }
  }

  return (
    <Button type="button" variant={variant} className={className} disabled={isSigningOut} onClick={handleSignOut}>
      {isSigningOut ? (
        "Signing out..."
      ) : (
        <>
          <LogOut className="mr-2 h-4 w-4" />
          {children || <span>Log out</span>}
        </>
      )}
    </Button>
  )
}
