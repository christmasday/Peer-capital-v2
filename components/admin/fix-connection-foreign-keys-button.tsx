"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { fixConnectionForeignKeys } from "@/lib/actions/fix-connection-foreign-keys"
import { toast } from "@/components/ui/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

// Change to default export
export default function FixConnectionForeignKeysButton() {
  const [isLoading, setIsLoading] = useState(false)

  const handleClick = async () => {
    try {
      setIsLoading(true)
      const result = await fixConnectionForeignKeys()

      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Success",
          description: "Connection foreign keys fixed successfully",
        })
      }
    } catch (error) {
      console.error("Error fixing connection foreign keys:", error)
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
    <Card>
      <CardHeader>
        <CardTitle>Fix Connection Foreign Keys</CardTitle>
        <CardDescription>
          Fix the foreign key constraints on the user_connections table to reference the profiles table instead of
          auth.users
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={handleClick} disabled={isLoading}>
          {isLoading ? "Fixing..." : "Fix Foreign Keys"}
        </Button>
      </CardContent>
    </Card>
  )
}

// Keep the named export for backward compatibility
export { FixConnectionForeignKeysButton }
