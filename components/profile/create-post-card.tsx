"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { VideoIcon, Activity } from "lucide-react"
import { createPost } from "@/lib/actions/posts"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

interface CreatePostCardProps {
  userId: string
  userName: string
  userImage?: string
  onPostCreated?: () => void
}

export function CreatePostCard({ userId, userName, userImage, onPostCreated }: CreatePostCardProps) {
  const [content, setContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!content.trim()) {
      toast({
        title: "Empty post",
        description: "Please add some text or an image to your post.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const formData = new FormData()
      formData.append("content", content)

      const result = await createPost(formData)

      if (result.error) {
        throw new Error(result.error)
      }

      toast({
        title: "Post created",
        description: "Your post has been published successfully.",
      })

      // Reset form
      setContent("")

      // Callback if provided
      if (onPostCreated) {
        onPostCreated()
      }

      // Refresh the page to show the new post
      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create post. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit}>
          <div className="flex items-start gap-3 mb-4">
            <Avatar className="h-10 w-10">
              <AvatarImage src={userImage || "/placeholder.svg"} alt={userName} />
              <AvatarFallback>{userName.charAt(0)}</AvatarFallback>
            </Avatar>
            <Textarea
              placeholder={`What's on your mind, ${userName.split(" ")[0]}?`}
              className="flex-1 resize-none outline-none border-b-4 border-b-blue-600  focus-visible:border-b-green-600 focus-visible:outline-none focus-visible:ring-0"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="flex items-end justify-between border-t pt-3">
            {content.trim() && (
              <Button type="submit" disabled={isSubmitting || !content.trim()}>
                {isSubmitting ? "Posting..." : "Post"}
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
