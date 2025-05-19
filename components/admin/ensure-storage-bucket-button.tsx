"use client"

import { Button } from "@/components/ui/button"
import { useState } from "react"
import { ensureStorageBucket } from "@/lib/actions/ensure-storage"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"

export function EnsureStorageBucketButton() {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleClick = async () => {
    setIsLoading(true)
    try {
      const result = await ensureStorageBucket()

      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Success",
          description: "Storage bucket is ready for image uploads.",
        })
      }
    } catch (error) {
      console.error("Error ensuring storage bucket:", error)
      toast({
        title: "Error",
        description: "Failed to ensure storage bucket. Please try again.",
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
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Setting up storage...
        </>
      ) : (
        "Ensure Storage Bucket"
      )}
    </Button>
  )
}
