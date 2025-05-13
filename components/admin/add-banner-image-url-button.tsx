"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { executeMigration } from "@/lib/actions/execute-migration"

export function AddBannerImageUrlButton() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleClick = async () => {
    setIsLoading(true)
    setResult(null)
    setError(null)

    try {
      const migrationResult = await executeMigration("add-banner-image-url-to-profiles.sql")

      if (migrationResult.error) {
        setError(migrationResult.error)
      } else {
        setResult("Successfully added banner_image_url column to profiles table")
      }
    } catch (err) {
      console.error("Error executing migration:", err)
      setError("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <Button onClick={handleClick} disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Adding Banner Image URL Column...
          </>
        ) : (
          "Add Banner Image URL Column"
        )}
      </Button>

      {result && <p className="text-green-600 text-sm">{result}</p>}
      {error && <p className="text-red-600 text-sm">{error}</p>}
    </div>
  )
}
