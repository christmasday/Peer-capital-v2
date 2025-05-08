"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { createExecuteSqlFunction } from "@/lib/actions/database-functions"

export function CreateExecuteSqlFunctionButton() {
  const [isLoading, setIsLoading] = useState(false)

  const handleClick = async () => {
    setIsLoading(true)
    try {
      const result = await createExecuteSqlFunction()

      if (result.success) {
        toast({
          title: "Success",
          description: "execute_sql function created successfully",
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to create execute_sql function",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error creating execute_sql function:", error)
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
    <Button onClick={handleClick} disabled={isLoading}>
      {isLoading ? "Processing..." : "Create execute_sql Function"}
    </Button>
  )
}
