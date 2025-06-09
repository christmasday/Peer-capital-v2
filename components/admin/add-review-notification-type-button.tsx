"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { createAdminClient } from "@/lib/supabase/admin"
import { toast } from "@/hooks/use-toast"

export function AddReviewNotificationTypeButton() {
  const [isLoading, setIsLoading] = useState(false)

  const handleClick = async () => {
    setIsLoading(true)
    try {
      const adminClient = createAdminClient()

      // Execute the SQL to add the review notification type
      const { error } = await adminClient.rpc("execute_sql", {
        sql_query: `
          -- Add review notification type if it doesn't exist
          DO $$
          BEGIN
              -- Check if the review type already exists in the enum
              IF NOT EXISTS (
                  SELECT 1 
                  FROM pg_type 
                  JOIN pg_enum ON pg_enum.enumtypid = pg_type.oid 
                  WHERE pg_type.typname = 'notification_type' 
                  AND pg_enum.enumlabel = 'review'
              ) THEN
                  -- Add the review type to the enum
                  ALTER TYPE notification_type ADD VALUE 'review';
              END IF;
          END$$;
        `,
      })

      if (error) {
        toast({
          title: "Error",
          description: "Failed to add review notification type: " + error.message,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Success",
          description: "Review notification type added successfully",
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
      {isLoading ? "Adding..." : "Add Review Notification Type"}
    </Button>
  )
}
