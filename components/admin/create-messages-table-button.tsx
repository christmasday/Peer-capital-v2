"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { executeMigrationFromFile } from "@/lib/actions/execute-migration"
import { Loader2 } from "lucide-react"

export function CreateMessagesTableButton() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{ success?: boolean; error?: string } | null>(null)

  const handleClick = async () => {
    setIsLoading(true)
    try {
      const migrationResult = await executeMigrationFromFile("create-messages-table.sql")
      setResult(migrationResult)
    } catch (error) {
      console.error("Error executing migration:", error)
      setResult({ error: "An unexpected error occurred" })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <Button onClick={handleClick} disabled={isLoading} className="w-full">
        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Create Messages Table
      </Button>
      {result && (
        <div
          className={`text-sm p-2 rounded ${
            result.success ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          }`}
        >
          {result.success ? "Messages table created successfully!" : result.error}
        </div>
      )}
    </div>
  )
}
