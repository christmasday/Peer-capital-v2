"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function EnsureLoanStatisticsButton() {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleClick = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/admin/execute-migration", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          migrationName: "ensure-loan-statistics-tables.sql",
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Success",
          description: "Loan statistics tables have been created or updated successfully.",
        })
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to create loan statistics tables.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error executing migration:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred while creating loan statistics tables.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button onClick={handleClick} disabled={isLoading} className="w-full">
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating Loan Statistics Tables...
        </>
      ) : (
        "Create Loan Statistics Tables"
      )}
    </Button>
  )
}
