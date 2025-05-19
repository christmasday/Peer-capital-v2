"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { addColumnIfNotExists } from "@/lib/actions/database-functions"
import { Loader2 } from "lucide-react"

export function AddImageSizesColumnButton() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  const handleClick = async () => {
    setIsLoading(true)
    setResult(null)

    try {
      const success = await addColumnIfNotExists("posts", "image_sizes", "JSONB")

      if (success) {
        setResult("Successfully added image_sizes column to posts table")
      } else {
        setResult("Failed to add image_sizes column to posts table")
      }
    } catch (error) {
      console.error("Error adding image_sizes column:", error)
      setResult(`Error: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <Button onClick={handleClick} disabled={isLoading} className="w-full">
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Adding image_sizes column...
          </>
        ) : (
          "Add image_sizes column to posts table"
        )}
      </Button>

      {result && (
        <div
          className={`p-2 rounded text-sm ${result.includes("Successfully") ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
        >
          {result}
        </div>
      )}
    </div>
  )
}
