"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { executeMigrationFromFile } from "@/lib/actions/execute-migration"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

export default function CreateExecuteSqlFunctionButton() {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleClick = async () => {
    setIsLoading(true)
    try {
      const result = await executeMigrationFromFile("create-execute-sql-function.sql")

      if (result.error) {
        toast({
          title: "Migration Failed",
          description: result.error,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Migration Successful",
          description: "Execute SQL function created successfully!",
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
      {isLoading ? "Creating..." : "Create Execute SQL Function"}
    </Button>
  )
}
