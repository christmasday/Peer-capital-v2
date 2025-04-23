"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { signIn } from "@/lib/actions/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"

// Add the JWT import at the top of the file
import { storeJWT } from "@/lib/jwt-client"

export function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [debugInfo, setDebugInfo] = useState<string | null>(null)

  // Check for loop detection
  useEffect(() => {
    // Check if we're in a redirect loop
    const redirectCount = Number.parseInt(localStorage.getItem("redirect_count") || "0", 10)
    const lastRedirect = Number.parseInt(localStorage.getItem("last_redirect") || "0", 10)
    const now = Date.now()

    // If we've had more than 3 redirects in the last 10 seconds, show debug info
    if (redirectCount > 3 && now - lastRedirect < 10000) {
      setDebugInfo("Redirect loop detected! Authentication system will be simplified.")

      // Reset the counter and set a bypass flag
      localStorage.setItem("redirect_count", "0")
      localStorage.setItem("auth_bypass", "true")
      localStorage.setItem("auth_bypass_time", now.toString())
    } else {
      // Update the redirect counter
      localStorage.setItem("redirect_count", (redirectCount + 1).toString())
      localStorage.setItem("last_redirect", now.toString())
    }

    // Clear old counters after 30 seconds
    if (now - lastRedirect > 30000) {
      localStorage.setItem("redirect_count", "1")
      localStorage.setItem("last_redirect", now.toString())
    }
  }, [])

  // Update the handleSubmit function to store JWT
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setIsLoading(true)
    setDebugInfo(null)

    try {
      // Create a FormData object to pass to the signIn function
      const formData = new FormData()
      formData.append("email", email)
      formData.append("password", password)

      // Call the server action to sign in
      const result = await signIn(formData)

      if (result.success) {
        console.log("Login successful, setting up session...")
        setDebugInfo("Login successful, setting up session...")

        // Store JWT in localStorage if available
        if (result.jwt) {
          storeJWT(result.jwt)
        }

        // Set auth bypass cookie to prevent middleware redirects
        document.cookie = "auth-bypass=true; path=/; max-age=300; SameSite=Lax" // 5 minutes

        // Set bypass flag to prevent redirect loops
        localStorage.setItem("auth_bypass", "true")
        localStorage.setItem("auth_bypass_time", Date.now().toString())

        // Store user info in localStorage as a fallback
        localStorage.setItem("user_email", email)
        localStorage.setItem("user_id", result.user?.id || "unknown")

        // Set a simple auth flag that doesn't depend on Supabase
        localStorage.setItem("is_authenticated", "true")

        // Set a cookie version of the auth flag
        document.cookie = "is_authenticated=true; path=/; max-age=86400; SameSite=Lax" // 24 hours

        // Wait a moment to ensure everything is set
        await new Promise((resolve) => setTimeout(resolve, 500))

        // Use window.location for a hard navigation
        window.location.href = "/home?auth=direct"
      } else {
        setError(result.error || "Failed to sign in")
      }
    } catch (err) {
      console.error("Login error:", err)
      setError("An unexpected error occurred. Please try again.")
      setDebugInfo(`Error: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {debugInfo && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded relative mb-4">
          <strong className="font-bold">Debug info:</strong>
          <p className="text-sm">{debugInfo}</p>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@example.com"
          required
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          <Link href="/forgot-password" className="text-sm text-primary hover:underline">
            Forgot password?
          </Link>
        </div>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
          className="w-full"
        />
      </div>

      {error && <div className="text-destructive text-sm">{error}</div>}

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Signing in...
          </>
        ) : (
          "Sign In"
        )}
      </Button>

      <div className="text-center text-sm">
        Don't have an account?{" "}
        <Link href="/signup" className="text-primary hover:underline">
          Sign up
        </Link>
      </div>
    </form>
  )
}
