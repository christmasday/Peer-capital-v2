"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { executeMigration } from "@/lib/actions/execute-migration"

export function CreateLenderReviewsTableButton() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleClick = async () => {
    setIsLoading(true)
    setResult(null)
    setError(null)

    try {
      const { success, message } = await executeMigration("create-lender-reviews-table.sql")
      if (success) {
        setResult(message || "Lender reviews table created successfully")
      } else {
        setError(message || "Failed to create lender reviews table")
      }
    } catch (err) {
      setError("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <Button onClick={handleClick} disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating Lender Reviews Table...
          </>
        ) : (
          "Create Lender Reviews Table"
        )}
      </Button>

      {result && <div className="p-3 bg-green-50 text-green-700 rounded-md text-sm">{result}</div>}
      {error && <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">{error}</div>}
    </div>
  )
}

export default CreateLenderReviewsTableButton
