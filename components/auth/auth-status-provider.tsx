"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"

type AuthStatus = {
  isAuthenticated: boolean
  userId: string | null
  isLoading: boolean
}

const AuthStatusContext = createContext<AuthStatus>({
  isAuthenticated: false,
  userId: null,
  isLoading: true,
})

export function useAuthStatus() {
  return useContext(AuthStatusContext)
}

export function AuthStatusProvider({ children }: { children: React.ReactNode }) {
  const [authStatus, setAuthStatus] = useState<AuthStatus>({
    isAuthenticated: false,
    userId: null,
    isLoading: true,
  })
  const router = useRouter()

  useEffect(() => {
    async function checkAuth() {
      try {
        // Check for JWT in localStorage
        const jwt = localStorage.getItem("jwt-token")
        if (jwt) {
          // Verify JWT (simplified check)
          try {
            const parts = jwt.split(".")
            if (parts.length === 3) {
              const payload = JSON.parse(atob(parts[1]))
              const userId = payload.sub || payload.userId
              if (userId) {
                setAuthStatus({
                  isAuthenticated: true,
                  userId,
                  isLoading: false,
                })
                return
              }
            }
          } catch (e) {
          }
        }

        // Check auth status from server
        const response = await fetch("/api/auth/status", {
          credentials: "include",
        })

        if (response.ok) {
          const data = await response.json()
          setAuthStatus({
            isAuthenticated: data.authenticated,
            userId: data.userId || null,
            isLoading: false,
          })
        } else {
          setAuthStatus({
            isAuthenticated: false,
            userId: null,
            isLoading: false,
          })
        }
      } catch (error) {
        setAuthStatus({
          isAuthenticated: false,
          userId: null,
          isLoading: false,
        })
      }
    }

    checkAuth()
  }, [router])

  return <AuthStatusContext.Provider value={authStatus}>{children}</AuthStatusContext.Provider>
}
