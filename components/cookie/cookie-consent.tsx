"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Check, Settings, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  COOKIE_CATEGORIES,
  type CookieCategoryConfig,
  acceptAllCookies,
  acceptEssentialOnly,
  acceptCustomPreferences,
  getPreferences,
  hasConsent,
} from "@/lib/cookies/cookie-manager"

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false)
  const [showPreferences, setShowPreferences] = useState(false)
  const [cookieCategories, setCookieCategories] = useState<(CookieCategoryConfig & { checked: boolean })[]>([])

  // Load cookie preferences on mount
  useEffect(() => {
    const checkCookieConsent = () => {
      if (!hasConsent()) {
        setShowBanner(true)
      }

      // Initialize cookie categories with current preferences
      const preferences = getPreferences()
      setCookieCategories(
        COOKIE_CATEGORIES.map((category) => ({
          ...category,
          checked: preferences[category.id] || category.required,
        })),
      )
    }

    checkCookieConsent()
  }, [])

  const handleAcceptAll = () => {
    acceptAllCookies()
    setCookieCategories(
      COOKIE_CATEGORIES.map((category) => ({
        ...category,
        checked: true,
      })),
    )
    setShowBanner(false)
    setShowPreferences(false)
  }

  const handleAcceptEssential = () => {
    acceptEssentialOnly()
    setCookieCategories(
      COOKIE_CATEGORIES.map((category) => ({
        ...category,
        checked: category.required,
      })),
    )
    setShowBanner(false)
    setShowPreferences(false)
  }

  const handleToggle = (id: string, checked: boolean) => {
    setCookieCategories((prev) =>
      prev.map((category) =>
        category.id === id ? { ...category, checked: category.required ? true : checked } : category,
      ),
    )
  }

  const handleSavePreferences = () => {
    const customPreferences = cookieCategories.reduce(
      (prefs, category) => ({
        ...prefs,
        [category.id]: category.checked,
      }),
      {},
    )

    acceptCustomPreferences(customPreferences)
    setShowBanner(false)
    setShowPreferences(false)
  }

  const openPreferences = () => {
    setShowPreferences(true)
  }

  if (!showBanner && !showPreferences) return null

  return (
    <>
      {/* Main Cookie Banner */}
      {showBanner && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg p-4 md:p-6">
          <div className="container mx-auto max-w-7xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Info size={20} className="text-green-600" />
                  Cookie Consent
                </h2>
                <p className="mt-2 text-sm text-gray-600">
                  We use cookies to enhance your browsing experience, serve personalized ads or content, and analyze our
                  traffic. By clicking "Accept All", you consent to our use of cookies. Visit our{" "}
                  <Link href="/cookie-policy" className="text-green-600 hover:underline">
                    Cookie Policy
                  </Link>{" "}
                  to learn more.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 mt-4 md:mt-0">
                <Button variant="outline" size="sm" onClick={handleAcceptEssential} className="text-xs sm:text-sm">
                  Essential Only
                </Button>
                <Button variant="outline" size="sm" onClick={openPreferences} className="text-xs sm:text-sm">
                  <Settings size={16} className="mr-1" />
                  Preferences
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleAcceptAll}
                  className="bg-green-600 hover:bg-green-700 text-xs sm:text-sm"
                >
                  <Check size={16} className="mr-1" />
                  Accept All
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cookie Preferences Dialog */}
      <Dialog open={showPreferences} onOpenChange={setShowPreferences}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Cookie Preferences</DialogTitle>
            <DialogDescription>
              Customize your cookie preferences. Essential cookies cannot be disabled as they are necessary for the
              website to function properly.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 my-4 max-h-[60vh] overflow-y-auto pr-2">
            {cookieCategories.map((category) => (
              <div key={category.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{category.name}</div>
                  <Switch
                    id={`cookie-${category.id}`}
                    checked={category.checked}
                    onCheckedChange={(checked) => handleToggle(category.id, checked)}
                    disabled={category.required}
                  />
                </div>
                <Label htmlFor={`cookie-${category.id}`} className="text-sm text-gray-500 mt-1 block">
                  {category.description}
                  {category.required && <span className="text-xs text-green-600 ml-1">(Required)</span>}
                </Label>
              </div>
            ))}
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowPreferences(false)} className="sm:order-1">
              Cancel
            </Button>
            <Button variant="outline" onClick={handleAcceptEssential} className="sm:order-2">
              Essential Only
            </Button>
            <Button onClick={handleSavePreferences} className="bg-green-600 hover:bg-green-700 sm:order-3">
              Save Preferences
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
