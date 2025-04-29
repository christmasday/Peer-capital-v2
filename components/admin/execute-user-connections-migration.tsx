"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { executeConnectionMigration } from "@/lib/actions/execute-connection-migration"
import { toast } from "@/hooks/use-toast"

export function ExecuteUserConnectionsMigration() {
  const [isLoading, setIsLoading] = useState(false)

  const handleExecuteMigration = async () => {
    try {
      setIsLoading(true)
      const result = await executeConnectionMigration()

      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Success",
          description: "User connections table created successfully!",
        })
      }
    } catch (error) {
      console.error("Error executing migration:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-4 border rounded-lg mb-4">
      <h3 className="text-lg font-medium mb-2">User Connections Migration</h3>
      <p className="text-sm text-gray-500 mb-4">
        This will create the user_connections table needed for the follow/unfollow functionality.
      </p>
      <Button onClick={handleExecuteMigration} disabled={isLoading}>
        {isLoading ? "Executing..." : "Execute Migration"}
      </Button>
    </div>
  )
}
