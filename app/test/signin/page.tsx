"use client"

import { useState } from "react"
import { signIn } from "@/lib/actions/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { TestNav } from "../components/test-nav"

export default function SignInTest() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [results, setResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  async function runTest() {
    setLoading(true)
    setResults(null)

    try {
      // Test with provided credentials
      const formData = new FormData()
      formData.append("email", email)
      formData.append("password", password)

      const result = await signIn(formData)

      // Format the result for display
      const displayResult = {
        ...result,
        jwt: result.jwt ? "[JWT PRESENT]" : null,
        session: result.session
          ? {
              id: result.session.id,
              user: result.session.user
                ? {
                    id: result.session.user.id,
                    email: result.session.user.email,
                  }
                : null,
              // Omit sensitive data
              access_token: "[REDACTED]",
              refresh_token: "[REDACTED]",
            }
          : null,
      }

      setResults(displayResult)

      // If login was successful, store auth data
      if (result.success) {
        // Store JWT in localStorage if available
        if (result.jwt) {
          localStorage.setItem("jwt-token", result.jwt)
        }

        // Set auth bypass cookie
        document.cookie = "auth-bypass=true; path=/; max-age=300; SameSite=Lax"

        // Store user info in localStorage as a fallback
        localStorage.setItem("user_email", email)
        localStorage.setItem("user_id", result.user?.id || "unknown")

        // Set a simple auth flag that doesn't depend on Supabase
        localStorage.setItem("is_authenticated", "true")
      }
    } catch (error) {
      setResults({
        error: `Test failed with error: ${error instanceof Error ? error.message : String(error)}`,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-10">
      <TestNav />

      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Sign-In Test</CardTitle>
          <CardDescription>Test the sign-in process with real credentials</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="test@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-start space-y-4">
          <Button onClick={runTest} disabled={loading}>
            {loading ? "Testing..." : "Run Sign-In Test"}
          </Button>

          {results && (
            <div className="w-full">
              <h3 className="font-medium mb-2">Test Results:</h3>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto max-h-96">
                {JSON.stringify(results, null, 2)}
              </pre>
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
