"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { executeSqlMigration } from "@/lib/actions/execute-migration"

export function EnsureLoanHelperSettingsButton() {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleClick = async () => {
    setIsLoading(true)
    try {
      const result = await executeSqlMigration("ensure-loan-helper-settings-table.sql")

      if (result.success) {
        toast({
          title: "Success",
          description: "Lending goals settings table has been created or verified.",
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to create lending goals settings table.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button onClick={handleClick} disabled={isLoading} variant="outline" className="w-full">
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Creating Lending Goals Settings Table...
        </>
      ) : (
        "Ensure Lending Goals Settings Table"
      )}
    </Button>
  )
}
