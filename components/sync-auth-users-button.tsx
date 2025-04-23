"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { syncAuthUsers } from "@/lib/actions/sync-auth"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function SyncAuthUsersButton() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{ success?: boolean; message?: string; error?: string } | null>(null)

  const handleSync = async () => {
    try {
      setIsLoading(true)
      setResult(null)

      const syncResult = await syncAuthUsers()
      setResult(syncResult)
    } catch (error) {
      setResult({
        error: error instanceof Error ? error.message : "An unexpected error occurred",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <Button onClick={handleSync} disabled={isLoading} className="w-full">
        {isLoading ? "Syncing Users..." : "Sync Users from Supabase Auth"}
      </Button>

      {result && (
        <Alert variant={result.error ? "destructive" : "default"}>
          <AlertDescription>{result.error || result.message}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
