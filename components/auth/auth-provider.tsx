"use client"

import { useJwtRefresh } from "@/hooks/use-jwt-refresh"
import { useAuthState } from "@/hooks/use-auth-state"
import { type ReactNode, createContext, useContext } from "react"

type AuthContextType = {
  isRefreshing: boolean
  refreshError: string | null
  lastRefreshed: number
  manualRefresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  // Use the auth state hook for session management
  useAuthState()

  // Use the JWT refresh hook for token refreshing
  const jwtRefresh = useJwtRefresh()

  return <AuthContext.Provider value={jwtRefresh}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }

  return context
}
