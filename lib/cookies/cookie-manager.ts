"use client"

// Cookie categories and preferences types
export type CookieCategory = "essential" | "functional" | "analytics" | "marketing"

export interface CookieCategoryConfig {
  id: CookieCategory
  name: string
  description: string
  required: boolean
}

export interface CookiePreferences {
  essential: boolean
  functional: boolean
  analytics: boolean
  marketing: boolean
  lastUpdated: number
}

export interface CookieOptions {
  expires?: Date | number
  path?: string
  domain?: string
  secure?: boolean
  sameSite?: "strict" | "lax" | "none"
}

// Default cookie preferences
export const DEFAULT_PREFERENCES: CookiePreferences = {
  essential: true, // Always required
  functional: false,
  analytics: false,
  marketing: false,
  lastUpdated: 0,
}

// Cookie categories configuration
export const COOKIE_CATEGORIES: CookieCategoryConfig[] = [
  {
    id: "essential",
    name: "Essential Cookies",
    description: "These cookies are necessary for the website to function and cannot be switched off.",
    required: true,
  },
  {
    id: "functional",
    name: "Functional Cookies",
    description: "These cookies enable personalized features and functionality.",
    required: false,
  },
  {
    id: "analytics",
    name: "Analytics Cookies",
    description: "These cookies help us understand how visitors interact with our website.",
    required: false,
  },
  {
    id: "marketing",
    name: "Marketing Cookies",
    description: "These cookies are used to track visitors across websites for advertising purposes.",
    required: false,
  },
]

// Cookie consent expiration - 6 months
export const CONSENT_EXPIRATION = 6 * 30 * 24 * 60 * 60 * 1000

// Cookie utility functions
export function setCookie(name: string, value: string, options: CookieOptions = {}): void {
  if (typeof document === "undefined") return

  const cookieOptions: CookieOptions = {
    path: "/",
    ...options,
  }

  let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`

  if (cookieOptions.expires) {
    if (typeof cookieOptions.expires === "number") {
      const date = new Date()
      date.setTime(date.getTime() + cookieOptions.expires * 1000)
      cookieOptions.expires = date
    }
    cookieString += `; expires=${cookieOptions.expires.toUTCString()}`
  }

  if (cookieOptions.path) {
    cookieString += `; path=${cookieOptions.path}`
  }

  if (cookieOptions.domain) {
    cookieString += `; domain=${cookieOptions.domain}`
  }

  if (cookieOptions.secure) {
    cookieString += "; secure"
  }

  if (cookieOptions.sameSite) {
    cookieString += `; samesite=${cookieOptions.sameSite}`
  }

  document.cookie = cookieString
}

export function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null

  const matches = document.cookie.match(new RegExp(`(?:^|; )${name.replace(/([.$?*|{}()[\]\\/+^])/g, "\\$1")}=([^;]*)`))
  return matches ? decodeURIComponent(matches[1]) : null
}

export function deleteCookie(name: string, options: Omit<CookieOptions, "expires"> = {}): void {
  setCookie(name, "", {
    ...options,
    expires: -1,
  })
}

// Cookie preferences management
export function getPreferences(): CookiePreferences {
  if (typeof window === "undefined") {
    return DEFAULT_PREFERENCES
  }

  try {
    const savedPreferences = localStorage.getItem("cookiePreferences")
    if (!savedPreferences) {
      return DEFAULT_PREFERENCES
    }

    return JSON.parse(savedPreferences) as CookiePreferences
  } catch (error) {
    console.error("Error loading cookie preferences:", error)
    return DEFAULT_PREFERENCES
  }
}

export function savePreferences(preferences: CookiePreferences): void {
  if (typeof window === "undefined") return

  try {
    localStorage.setItem("cookiePreferences", JSON.stringify(preferences))
    applyPreferences(preferences)
  } catch (error) {
    console.error("Error saving cookie preferences:", error)
  }
}

export function hasConsent(): boolean {
  if (typeof window === "undefined") return false

  try {
    const savedPreferences = localStorage.getItem("cookiePreferences")
    if (!savedPreferences) {
      return false
    }

    const preferences = JSON.parse(savedPreferences) as CookiePreferences
    const now = Date.now()

    // Check if consent has expired
    return now - preferences.lastUpdated <= CONSENT_EXPIRATION
  } catch (error) {
    console.error("Error checking cookie consent:", error)
    return false
  }
}

export function isCategoryEnabled(category: CookieCategory): boolean {
  const preferences = getPreferences()
  return preferences[category]
}

// Apply cookie preferences by initializing or removing cookies
export function applyPreferences(preferences: CookiePreferences): void {
  // Essential cookies are always enabled
  // Initialize or remove functional cookies
  if (preferences.functional) {
    initializeFunctionalCookies()
  } else {
    removeFunctionalCookies()
  }

  // Initialize or remove analytics cookies
  if (preferences.analytics) {
    initializeAnalyticsCookies()
  } else {
    removeAnalyticsCookies()
  }

  // Initialize or remove marketing cookies
  if (preferences.marketing) {
    initializeMarketingCookies()
  } else {
    removeMarketingCookies()
  }
}

// Cookie initialization functions
function initializeFunctionalCookies(): void {
  // Example: Set functional cookies
  setCookie("functional_theme", "light", { expires: 30 * 24 * 60 * 60 }) // 30 days
  // Add more functional cookies as needed
}

function initializeAnalyticsCookies(): void {
  // Example: Set analytics cookies
  setCookie("analytics_session", generateSessionId(), { expires: 30 * 60 }) // 30 minutes
  // In a real implementation, you would initialize analytics services like Google Analytics
}

function initializeMarketingCookies(): void {
  // Example: Set marketing cookies
  setCookie("marketing_source", getUtmSource() || "direct", { expires: 30 * 24 * 60 * 60 }) // 30 days
  // In a real implementation, you would initialize marketing services like Facebook Pixel
}

// Cookie removal functions
function removeFunctionalCookies(): void {
  // Example: Remove functional cookies
  deleteCookie("functional_theme")
  // Remove more functional cookies as needed
}

function removeAnalyticsCookies(): void {
  // Example: Remove analytics cookies
  deleteCookie("analytics_session")
  // In a real implementation, you would disable analytics services
}

function removeMarketingCookies(): void {
  // Example: Remove marketing cookies
  deleteCookie("marketing_source")
  // In a real implementation, you would disable marketing services
}

// Helper functions
function generateSessionId(): string {
  return Math.random().toString(36).substring(2, 15)
}

function getUtmSource(): string | null {
  if (typeof window === "undefined") return null

  const urlParams = new URLSearchParams(window.location.search)
  return urlParams.get("utm_source")
}

// Convenience functions for accepting different levels of cookies
export function acceptAllCookies(): void {
  const preferences: CookiePreferences = {
    essential: true,
    functional: true,
    analytics: true,
    marketing: true,
    lastUpdated: Date.now(),
  }
  savePreferences(preferences)
}

export function acceptEssentialOnly(): void {
  const preferences: CookiePreferences = {
    essential: true,
    functional: false,
    analytics: false,
    marketing: false,
    lastUpdated: Date.now(),
  }
  savePreferences(preferences)
}

export function acceptCustomPreferences(customPreferences: Partial<Omit<CookiePreferences, "lastUpdated">>): void {
  const preferences: CookiePreferences = {
    ...DEFAULT_PREFERENCES,
    ...customPreferences,
    lastUpdated: Date.now(),
  }
  savePreferences(preferences)
}
