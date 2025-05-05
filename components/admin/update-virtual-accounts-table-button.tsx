"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { executeSql } from "@/lib/actions/execute-migration"

export function UpdateVirtualAccountsTableButton() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleClick = async () => {
    setIsLoading(true)
    setResult(null)
    setError(null)

    try {
      const response = await executeSql("update-virtual-accounts-table.sql")
      if (response.error) {
        setError(response.error)
      } else {
        setResult("Virtual accounts table updated successfully!")
      }
    } catch (err) {
      setError(`An error occurred: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <Button onClick={handleClick} disabled={isLoading}>
        {isLoading ? "Updating..." : "Update Virtual Accounts Table"}
      </Button>
      {result && <p className="text-green-600">{result}</p>}
      {error && <p className="text-red-600">{error}</p>}
    </div>
  )
}
