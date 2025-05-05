"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Settings } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  COOKIE_CATEGORIES,
  type CookieCategoryConfig,
  acceptEssentialOnly,
  acceptCustomPreferences,
  getPreferences,
} from "@/lib/cookies/cookie-manager"

export function ManageCookiesButton({
  variant = "outline",
  size = "sm",
}: { variant?: "outline" | "link" | "default"; size?: "sm" | "default" }) {
  const [open, setOpen] = useState(false)
  const [cookieCategories, setCookieCategories] = useState<(CookieCategoryConfig & { checked: boolean })[]>([])

  // Load cookie preferences when dialog opens
  useEffect(() => {
    if (open) {
      const preferences = getPreferences()
      setCookieCategories(
        COOKIE_CATEGORIES.map((category) => ({
          ...category,
          checked: preferences[category.id] || category.required,
        })),
      )
    }
  }, [open])

  const handleSavePreferences = () => {
    const customPreferences = cookieCategories.reduce(
      (prefs, category) => ({
        ...prefs,
        [category.id]: category.checked,
      }),
      {},
    )

    acceptCustomPreferences(customPreferences)
    setOpen(false)
  }

  const handleAcceptEssential = () => {
    acceptEssentialOnly()
    setCookieCategories(
      COOKIE_CATEGORIES.map((category) => ({
        ...category,
        checked: category.required,
      })),
    )
    setOpen(false)
  }

  const handleToggle = (id: string, checked: boolean) => {
    setCookieCategories((prev) =>
      prev.map((category) =>
        category.id === id ? { ...category, checked: category.required ? true : checked } : category,
      ),
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size}>
          <Settings size={16} className="mr-1" />
          Manage Cookies
        </Button>
      </DialogTrigger>
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
                  id={`cookie-manage-${category.id}`}
                  checked={category.checked}
                  onCheckedChange={(checked) => handleToggle(category.id, checked)}
                  disabled={category.required}
                />
              </div>
              <Label htmlFor={`cookie-manage-${category.id}`} className="text-sm text-gray-500 mt-1 block">
                {category.description}
                {category.required && <span className="text-xs text-green-600 ml-1">(Required)</span>}
              </Label>
            </div>
          ))}
        </div>
        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => setOpen(false)} className="sm:order-1">
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
  )
}
