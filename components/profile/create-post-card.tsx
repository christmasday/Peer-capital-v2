"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ImageUpload } from "@/components/ui/image-upload"
import { VideoIcon, ImageIcon, Activity } from "lucide-react"
import { createPost } from "@/lib/actions/posts"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

interface CreatePostCardProps {
  userId: string
  userName: string
  userImage?: string
  onPostCreated?: () => void
}

interface ImageSizes {
  thumbnail?: string
  medium?: string
  full?: string
  [key: string]: string | undefined
}

export function CreatePostCard({ userId, userName, userImage, onPostCreated }: CreatePostCardProps) {
  const [content, setContent] = useState("")
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [imageSizes, setImageSizes] = useState<ImageSizes | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const handleImageChange = (url: string | null, sizes?: ImageSizes | null) => {
    setImageUrl(url)
    if (sizes) {
      setImageSizes(sizes)
    } else {
      setImageSizes(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!content.trim() && !imageUrl) {
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
      if (imageUrl) {
        formData.append("imageUrl", imageUrl)
      }
      if (imageSizes) {
        formData.append("imageSizes", JSON.stringify(imageSizes))
      }

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
      setImageUrl(null)
      setImageSizes(null)

      // Callback if provided
      if (onPostCreated) {
        onPostCreated()
      }

      // Refresh the page to show the new post
      router.refresh()
    } catch (error) {
      console.error("Error creating post:", error)
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
              className="flex-1 resize-none"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          {/* Image upload area */}
          {(imageUrl || content.trim()) && (
            <div className="mb-4">
              <ImageUpload
                value={imageUrl}
                onChange={handleImageChange}
                disabled={isSubmitting}
                aspectRatio="video"
                maxSize={10}
              />
            </div>
          )}

          <div className="flex items-center justify-between border-t pt-3">
            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-gray-500"
                onClick={() => document.getElementById("image-upload")?.click()}
                disabled={isSubmitting}
              >
                <ImageIcon className="h-5 w-5 mr-2" />
                Photo/video
              </Button>
              <Button type="button" variant="ghost" size="sm" className="text-gray-500" disabled={isSubmitting}>
                <Activity className="h-5 w-5 mr-2" />
                Life event
              </Button>
              <Button type="button" variant="ghost" size="sm" className="text-gray-500" disabled={isSubmitting}>
                <VideoIcon className="h-5 w-5 mr-2" />
                Live video
              </Button>
            </div>

            {/* Post button - only show when there's content or an image */}
            {(content.trim() || imageUrl) && (
              <Button type="submit" disabled={isSubmitting || (!content.trim() && !imageUrl)}>
                {isSubmitting ? "Posting..." : "Post"}
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
