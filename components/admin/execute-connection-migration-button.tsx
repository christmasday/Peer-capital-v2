"use client"

import { Button } from "@/components/ui/button"
import { executeConnectionMigration } from "@/lib/actions/execute-connection-migration"
import { useState } from "react"
import { toast } from "@/components/ui/use-toast"

// Change to default export
export default function ExecuteConnectionMigrationButton() {
  const [isLoading, setIsLoading] = useState(false)

  const handleExecuteMigration = async () => {
    try {
      setIsLoading(true)
      const result = await executeConnectionMigration()

      if (result.error) {
        toast({
          title: "Migration Failed",
          description: result.error,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Migration Successful",
          description: result.message,
        })
      }
    } catch (error) {
      toast({
        title: "Migration Failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button onClick={handleExecuteMigration} disabled={isLoading}>
      {isLoading ? "Creating User Connections Table..." : "Create User Connections Table"}
    </Button>
  )
}

// Keep the named export for backward compatibility
export { ExecuteConnectionMigrationButton }
