"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { SignoutButton } from "@/components/auth/signout-button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Info, AlertCircle, CheckCircle, XCircle } from "lucide-react"

export default function LogoutTest() {
  const [authData, setAuthData] = useState<any>(null)
  const [testResults, setTestResults] = useState<any>({})
  const [activeAuthMethod, setActiveAuthMethod] = useState<string | null>(null)

  // Collect all authentication-related data
  useEffect(() => {
    const collectAuthData = () => {
      try {
        const data = {
          cookies: {
            // Parse document.cookie
            parsed: document.cookie.split(";").reduce(
              (acc, cookie) => {
                const [key, value] = cookie.trim().split("=")
                if (key) acc[key] = value
                return acc
              },
              {} as Record<string, string>,
            ),
            raw: document.cookie,
          },
          localStorage: {
            "jwt-token": localStorage.getItem("jwt-token"),
            auth_bypass: localStorage.getItem("auth_bypass"),
            auth_bypass_time: localStorage.getItem("auth_bypass_time"),
            user_email: localStorage.getItem("user_email"),
            user_id: localStorage.getItem("user_id"),
            is_authenticated: localStorage.getItem("is_authenticated"),
            redirect_count: localStorage.getItem("redirect_count"),
            last_redirect: localStorage.getItem("last_redirect"),
            "signout-timestamp": localStorage.getItem("signout-timestamp"),
          },
          url: {
            pathname: window.location.pathname,
            search: window.location.search,
            hash: window.location.hash,
          },
        }

        setAuthData(data)

        // Determine active auth method
        let method = null
        if (data.localStorage["jwt-token"]) {
          method = "JWT"
        } else if (data.cookies.parsed["auth-status"] === "authenticated" || data.cookies.parsed["sb-auth-token"]) {
          method = "Cookies"
        } else if (data.localStorage.is_authenticated === "true" || data.localStorage.auth_bypass === "true") {
          method = "LocalStorage"
        }
        setActiveAuthMethod(method)
      } catch (error) {
      }
    }

    collectAuthData()
    // Set up interval to refresh data
    const intervalId = setInterval(collectAuthData, 2000)

    return () => clearInterval(intervalId)
  }, [])

  // Run tests to check authentication state
  useEffect(() => {
    if (!authData) return

    const results = {
      jwtToken: {
        status: !authData.localStorage["jwt-token"] ? "passed" : "failed",
        message: !authData.localStorage["jwt-token"]
          ? "JWT token not found in localStorage (good)"
          : "JWT token still exists in localStorage",
      },
      authCookies: {
        status:
          !authData.cookies.parsed["auth-status"] &&
          !authData.cookies.parsed["auth-bypass"] &&
          !authData.cookies.parsed["sb-auth-token"]
            ? "passed"
            : "warning",
        message:
          !authData.cookies.parsed["auth-status"] &&
          !authData.cookies.parsed["auth-bypass"] &&
          !authData.cookies.parsed["sb-auth-token"]
            ? "No auth cookies found (good)"
            : "Some auth cookies still exist",
        details: Object.entries(authData.cookies.parsed)
          .filter(([key]) => key.includes("auth") || key.includes("sb-"))
          .map(([key, value]) => `${key}=${value}`)
          .join(", "),
      },
      localStorageFlags: {
        status: !authData.localStorage.is_authenticated && !authData.localStorage.auth_bypass ? "passed" : "warning",
        message:
          !authData.localStorage.is_authenticated && !authData.localStorage.auth_bypass
            ? "No auth flags found in localStorage (good)"
            : "Some auth flags still exist in localStorage",
        details: Object.entries(authData.localStorage)
          .filter(([key, value]) => value !== null && (key.includes("auth") || key.includes("user")))
          .map(([key, value]) => `${key}=${value}`)
          .join(", "),
      },
      signoutTimestamp: {
        status: authData.localStorage["signout-timestamp"] ? "passed" : "warning",
        message: authData.localStorage["signout-timestamp"]
          ? "Signout timestamp found (good)"
          : "No signout timestamp found",
      },
    }

    setTestResults(results)
  }, [authData])

  const clearAllAuthData = () => {
    // Clear localStorage
    localStorage.removeItem("jwt-token")
    localStorage.removeItem("auth_bypass")
    localStorage.removeItem("auth_bypass_time")
    localStorage.removeItem("user_email")
    localStorage.removeItem("user_id")
    localStorage.removeItem("is_authenticated")
    localStorage.removeItem("signout-timestamp")

    // Clear cookies
    document.cookie.split(";").forEach((cookie) => {
      const [name] = cookie.trim().split("=")
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`
    })

    // Refresh the page to update the data
    window.location.reload()
  }

  const simulateJWTAuth = () => {
    // Set JWT in localStorage
    localStorage.setItem(
      "jwt-token",
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJmYWtlLXVzZXItaWQiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJyb2xlIjoidXNlciIsImlhdCI6MTcxMzc5NjQwMCwiZXhwIjoxNzEzODgyODAwfQ.fake-signature",
    )

    // Set minimal cookies
    document.cookie = "auth-status=authenticated; path=/; max-age=86400"

    // Refresh the page to update the data
    window.location.reload()
  }

  const simulateCookieAuth = () => {
    // Set cookies
    document.cookie = "auth-status=authenticated; path=/; max-age=86400"
    document.cookie = "auth-bypass=true; path=/; max-age=300"
    document.cookie = "sb-auth-token=fake-token; path=/; max-age=86400"

    // Refresh the page to update the data
    window.location.reload()
  }

  const simulateLocalStorageAuth = () => {
    // Set localStorage
    localStorage.setItem("auth_bypass", "true")
    localStorage.setItem("auth_bypass_time", Date.now().toString())
    localStorage.setItem("user_email", "test@example.com")
    localStorage.setItem("user_id", "fake-user-id")
    localStorage.setItem("is_authenticated", "true")

    // Refresh the page to update the data
    window.location.reload()
  }

  return (
    <div className="container mx-auto py-10">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Logout Functionality Test</CardTitle>
          <CardDescription>
            Test if the logout functionality properly clears all authentication data across different auth methods
          </CardDescription>
        </CardHeader>

        <Tabs defaultValue="test">
          <TabsList className="mx-6">
            <TabsTrigger value="test">Test Logout</TabsTrigger>
            <TabsTrigger value="data">Auth Data</TabsTrigger>
          </TabsList>

          <TabsContent value="test">
            <CardContent className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <div className="flex items-start">
                  <Info className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
                  <div>
                    <h3 className="text-lg font-medium text-blue-800">Current Authentication Status</h3>
                    <p className="text-blue-700 mt-1">
                      {activeAuthMethod ? (
                        <>
                          You are currently authenticated using <Badge variant="outline">{activeAuthMethod}</Badge>
                        </>
                      ) : (
                        "You are not currently authenticated"
                      )}
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-medium mb-4">Step 1: Choose an authentication method to test</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button onClick={simulateJWTAuth} variant="outline" className="h-auto py-4 flex flex-col">
                    <span className="font-bold mb-1">JWT Authentication</span>
                    <span className="text-xs text-gray-500">Sets JWT token in localStorage</span>
                  </Button>

                  <Button onClick={simulateCookieAuth} variant="outline" className="h-auto py-4 flex flex-col">
                    <span className="font-bold mb-1">Cookie Authentication</span>
                    <span className="text-xs text-gray-500">Sets auth cookies</span>
                  </Button>

                  <Button onClick={simulateLocalStorageAuth} variant="outline" className="h-auto py-4 flex flex-col">
                    <span className="font-bold mb-1">LocalStorage Authentication</span>
                    <span className="text-xs text-gray-500">Sets auth flags in localStorage</span>
                  </Button>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-medium mb-4">Step 2: Test logout functionality</h3>
                <div className="flex justify-center">
                  <SignoutButton variant="destructive" className="px-8 py-6 text-lg">
                    Test Logout
                  </SignoutButton>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-medium mb-4">Test Results</h3>

                {Object.entries(testResults).map(([key, result]: [string, any]) => (
                  <Alert
                    key={key}
                    variant={
                      result.status === "passed" ? "default" : result.status === "warning" ? "default" : "destructive"
                    }
                    className={`mb-3 ${
                      result.status === "passed"
                        ? "bg-green-50 border-green-200"
                        : result.status === "warning"
                          ? "bg-yellow-50 border-yellow-200"
                          : "bg-red-50 border-red-200"
                    }`}
                  >
                    <AlertDescription>
                      <div className="flex items-start">
                        {result.status === "passed" ? (
                          <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                        ) : result.status === "warning" ? (
                          <AlertCircle className="h-5 w-5 text-yellow-500 mr-2 mt-0.5" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
                        )}
                        <div>
                          <p className="font-medium">
                            {key
                              .replace(/([A-Z])/g, " $1")
                              .split(" ")
                              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                              .join(" ")}
                            :{" "}
                            <span
                              className={
                                result.status === "passed"
                                  ? "text-green-700"
                                  : result.status === "warning"
                                    ? "text-yellow-700"
                                    : "text-red-700"
                              }
                            >
                              {result.status.toUpperCase()}
                            </span>
                          </p>
                          <p className="text-sm mt-1">{result.message}</p>
                          {result.details && <p className="text-xs mt-1 text-gray-500">{result.details}</p>}
                        </div>
                      </div>
                    </AlertDescription>
                  </Alert>
                ))}
              </div>

              <div className="flex justify-end">
                <Button onClick={clearAllAuthData} variant="outline" className="text-red-600">
                  Force Clear All Auth Data
                </Button>
              </div>
            </CardContent>
          </TabsContent>

          <TabsContent value="data">
            <CardContent>
              {authData ? (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Cookies</h3>
                    <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto max-h-40">
                      {JSON.stringify(authData.cookies.parsed, null, 2)}
                    </pre>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-2">Local Storage</h3>
                    <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto max-h-40">
                      {JSON.stringify(authData.localStorage, null, 2)}
                    </pre>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-2">URL</h3>
                    <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto max-h-40">
                      {JSON.stringify(authData.url, null, 2)}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="text-center py-10">Loading authentication data...</div>
              )}
            </CardContent>
          </TabsContent>
        </Tabs>

        <CardFooter className="flex justify-between">
          <p className="text-sm text-gray-500">
            This test page helps verify that the logout functionality properly clears all authentication data.
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
