"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { executeSql } from "@/lib/actions/execute-migration"
import { toast } from "@/hooks/use-toast"

export function AddActivityNotificationPreferencesButton() {
  const [isLoading, setIsLoading] = useState(false)

  const handleClick = async () => {
    setIsLoading(true)
    try {
      const result = await executeSql("migrations/add-activity-notification-preferences.sql")

      if (result.success) {
        toast({
          title: "Success",
          description: "Activity notification preferences columns added successfully",
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to add activity notification preferences columns",
          variant: "destructive",
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
    <Button onClick={handleClick} disabled={isLoading} variant="outline" className="w-full">
      {isLoading ? "Adding Activity Notification Preferences..." : "Add Activity Notification Preferences"}
    </Button>
  )
}
