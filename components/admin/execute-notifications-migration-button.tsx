"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { executeMigration } from "@/lib/actions/execute-migration"

export default function ExecuteNotificationsMigrationButton() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{ success?: boolean; error?: string } | null>(null)

  const handleClick = async () => {
    setIsLoading(true)
    setResult(null)

    try {
      const migrationResult = await executeMigration("create-notifications-table.sql")
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
        {isLoading ? "Creating Notifications Table..." : "Create Notifications Table"}
      </Button>
      {result && (
        <div
          className={`p-2 text-sm rounded ${
            result.success ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          }`}
        >
          {result.success ? "Notifications table created successfully!" : result.error}
        </div>
      )}
    </div>
  )
}
