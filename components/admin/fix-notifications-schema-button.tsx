"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { executeMigrationFromFile } from "@/lib/actions/execute-migration"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

export function FixNotificationsSchemaButton() {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleClick = async () => {
    setIsLoading(true)
    try {
      const result = await executeMigrationFromFile("fix-notifications-schema.sql")

      if (result.error) {
        toast({
          title: "Migration Failed",
          description: result.error,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Migration Successful",
          description: "Notifications schema fixed successfully!",
        })
      }
    } catch (error) {
      toast({
        title: "Migration Failed",
        description: `An unexpected error occurred: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button onClick={handleClick} disabled={isLoading} className="w-full">
      {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
      {isLoading ? "Fixing..." : "Fix Notifications Schema"}
    </Button>
  )
}

// Also export as default for backward compatibility
export default FixNotificationsSchemaButton
