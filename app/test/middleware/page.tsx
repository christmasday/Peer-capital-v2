"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TestNav } from "../components/test-nav"

export default function MiddlewareTest() {
  const [authData, setAuthData] = useState<any>(null)

  useEffect(() => {
    // Collect all authentication-related data
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
      },
      url: {
        pathname: window.location.pathname,
        search: window.location.search,
        hash: window.location.hash,
      },
    }

    setAuthData(data)
  }, [])

  return (
    <div className="container mx-auto py-10">
      <TestNav />

      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Middleware Test</CardTitle>
          <CardDescription>
            This page shows all authentication-related data to help debug middleware issues
          </CardDescription>
        </CardHeader>
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

              <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded">
                <p className="font-bold">Authentication Status</p>
                <p>
                  {authData.localStorage["is_authenticated"] === "true" ||
                  authData.cookies.parsed["auth-status"] === "authenticated"
                    ? "✅ Authenticated according to client-side data"
                    : "❌ Not authenticated according to client-side data"}
                </p>
                <p className="mt-2">If you can see this page, the middleware allowed access. This means either:</p>
                <ul className="list-disc ml-6 mt-1">
                  <li>You are properly authenticated</li>
                  <li>The auth-bypass cookie is active</li>
                  <li>The middleware fallback mechanism is working</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="text-center py-10">Loading authentication data...</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
