"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ensureAdminAuditLogsTable } from "@/lib/actions/admin"
import { toast } from "@/components/ui/use-toast"

export function EnsureAdminAuditLogsTableButton() {
  const [isLoading, setIsLoading] = useState(false)

  const handleClick = async () => {
    setIsLoading(true)
    try {
      const result = await ensureAdminAuditLogsTable()

      if (result) {
        toast({
          title: "Success",
          description: "Admin audit logs table created or verified successfully",
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to create admin audit logs table",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error creating admin audit logs table:", error)
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
      {isLoading ? "Processing..." : "Create Admin Audit Logs Table"}
    </Button>
  )
}
