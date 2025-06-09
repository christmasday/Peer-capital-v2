"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { UserRound, Camera, Video, Calendar } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface CreatePostFormProps {
  userId: string
  userName: string
  userImage?: string | null
  onPostCreated?: () => void
}

export function CreatePostForm({ userId, userName, userImage, onPostCreated }: CreatePostFormProps) {
  const [content, setContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast({
        title: "Empty post",
        description: "Please write something before posting.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // In a real implementation, you would call an API to create the post
      // For now we'll just simulate a successful post
      await new Promise((resolve) => setTimeout(resolve, 1000))

      toast({
        title: "Post created",
        description: "Your post has been published successfully!",
        variant: "success",
      })

      setContent("")
      if (onPostCreated) {
        onPostCreated()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create post. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Avatar className="h-10 w-10">
          {userImage ? (
            <AvatarImage src={userImage || "/placeholder.svg"} alt={userName} />
          ) : (
            <AvatarFallback className="bg-blue-100">
              <UserRound className="h-5 w-5 text-blue-500" />
            </AvatarFallback>
          )}
        </Avatar>
        <div className="flex-grow">
          <Textarea
            placeholder="What's on your mind?"
            className="resize-none border-gray-300 rounded-full h-10 pt-2"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </div>
      </div>
      <Separator />
      <div className="flex justify-between">
        <Button variant="ghost" className="text-gray-700 hover:bg-gray-100 flex-1">
          <Video className="h-5 w-5 mr-2 text-red-500" />
          Live video
        </Button>
        <Button variant="ghost" className="text-gray-700 hover:bg-gray-100 flex-1">
          <Camera className="h-5 w-5 mr-2 text-green-500" />
          Photo/video
        </Button>
        <Button variant="ghost" className="text-gray-700 hover:bg-gray-100 flex-1">
          <Calendar className="h-5 w-5 mr-2 text-blue-500" />
          Life event
        </Button>
      </div>
      <div className="flex justify-end">
        <Button
          onClick={handleSubmit}
          disabled={!content.trim() || isSubmitting}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isSubmitting ? "Posting..." : "Post"}
        </Button>
      </div>
    </div>
  )
}
