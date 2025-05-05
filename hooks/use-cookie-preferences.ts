"use client"

import { useState, useEffect } from "react"
import {
  type CookieCategory,
  type CookiePreferences,
  getPreferences,
  isCategoryEnabled,
  acceptCustomPreferences,
  acceptAllCookies,
  acceptEssentialOnly,
} from "@/lib/cookies/cookie-manager"

export function useCookiePreferences() {
  const [preferences, setPreferences] = useState<CookiePreferences>(getPreferences())

  // Update local state when preferences change
  useEffect(() => {
    const handleStorageChange = () => {
      setPreferences(getPreferences())
    }

    // Listen for storage events (when preferences are updated in another tab)
    window.addEventListener("storage", handleStorageChange)
    return () => {
      window.removeEventListener("storage", handleStorageChange)
    }
  }, [])

  // Check if a specific category is enabled
  const isEnabled = (category: CookieCategory) => {
    return isCategoryEnabled(category)
  }

  // Update a specific category
  const updateCategory = (category: CookieCategory, enabled: boolean) => {
    const newPreferences = {
      ...preferences,
      [category]: enabled,
    }

    acceptCustomPreferences(newPreferences)
    setPreferences(getPreferences()) // Refresh from storage
  }

  // Accept all cookies
  const acceptAll = () => {
    acceptAllCookies()
    setPreferences(getPreferences()) // Refresh from storage
  }

  // Accept only essential cookies
  const acceptEssential = () => {
    acceptEssentialOnly()
    setPreferences(getPreferences()) // Refresh from storage
  }

  return {
    preferences,
    isEnabled,
    updateCategory,
    acceptAll,
    acceptEssential,
  }
}
