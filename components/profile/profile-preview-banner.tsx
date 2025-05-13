"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { EyeOff } from "lucide-react"
import { useRouter } from "next/navigation"

interface ProfilePreviewBannerProps {
  userId: string
}

export function ProfilePreviewBanner({ userId }: ProfilePreviewBannerProps) {
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const router = useRouter()

  const togglePreviewMode = () => {
    if (isPreviewMode) {
      // Exit preview mode - go back to normal profile
      router.push("/profile")
    } else {
      // Enter preview mode - view your profile as others would see it
      router.push(`/profile/${userId}?preview=true`)
    }
    setIsPreviewMode(!isPreviewMode)
  }

  // Only show the banner when in preview mode
  if (!isPreviewMode && !window.location.search.includes("preview=true")) {
    return null
  }

  return (
    <div className="fixed top-0 left-0 right-0 bg-amber-500 text-white py-2 px-4 z-50 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="font-medium">Preview Mode: Viewing your profile as others see it</span>
      </div>
      <Button
        onClick={togglePreviewMode}
        variant="outline"
        size="sm"
        className="bg-white text-amber-600 hover:bg-amber-50 border-white"
      >
        <EyeOff className="h-4 w-4 mr-1.5" />
        Exit Preview
      </Button>
    </div>
  )
}
