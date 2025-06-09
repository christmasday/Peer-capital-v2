"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { createCheckTableExistsFunction } from "@/lib/actions/database-functions"

export function CreateCheckTableExistsFunctionButton() {
  const [isLoading, setIsLoading] = useState(false)

  const handleClick = async () => {
    setIsLoading(true)
    try {
      const result = await createCheckTableExistsFunction()

      if (result.success) {
        toast({
          title: "Success",
          description: result.message || "check_table_exists function created successfully",
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to create check_table_exists function",
          variant: "destructive",
        })
      }
    } catch (error) {
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
    <Button onClick={handleClick} disabled={isLoading} className="w-full">
      {isLoading ? "Creating..." : "Create Check Table Exists Function"}
    </Button>
  )
}

// Also export as default for backward compatibility
export default CreateCheckTableExistsFunctionButton
