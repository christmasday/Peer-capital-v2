"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { executeMigration } from "@/lib/actions/execute-migration"

export function CreateVirtualAccountsTableButton() {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleClick = async () => {
    setIsLoading(true)
    try {
      const result = await executeMigration("create-virtual-accounts-table.sql")

      if (result.success) {
        toast({
          title: "Success",
          description: "Virtual accounts table created successfully",
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to create virtual accounts table",
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
    <Button onClick={handleClick} disabled={isLoading}>
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating Virtual Accounts Table...
        </>
      ) : (
        "Create Virtual Accounts Table"
      )}
    </Button>
  )
}
