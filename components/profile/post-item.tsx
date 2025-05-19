"use client"

import { useState } from "react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MessageSquare, Heart, Share2, MoreVertical, Trash2, Loader2, User } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import Image from "next/image"
import { deletePost } from "@/lib/actions/posts"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"

interface PostItemProps {
  id: string
  userId: string
  userName: string
  userImage?: string
  content: string
  imageUrl?: string | null
  imageSizes?: Record<string, string> | null
  createdAt: string
  likesCount: number
  commentsCount: number
  sharesCount: number
  isOwner: boolean
  onDeleted?: () => void
}

export function PostItem({
  id,
  userId,
  userName,
  userImage,
  content,
  imageUrl,
  imageSizes,
  createdAt,
  likesCount,
  commentsCount,
  sharesCount,
  isOwner,
  onDeleted,
}: PostItemProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this post?")) {
      setIsDeleting(true)
      try {
        const result = await deletePost(id)
        if (result.error) {
          throw new Error(result.error)
        }
        toast({
          title: "Post deleted",
          description: "Your post has been deleted successfully.",
        })
        if (onDeleted) {
          onDeleted()
        }
        router.refresh()
      } catch (error) {
        console.error("Error deleting post:", error)
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to delete post. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsDeleting(false)
      }
    }
  }

  // Get the best image URL based on available sizes
  const getBestImageUrl = () => {
    if (!imageUrl) return null

    // If we have image sizes, use the medium size for display
    if (imageSizes) {
      return imageSizes.medium || imageSizes.full || imageSizes.thumbnail || imageUrl
    }

    return imageUrl
  }

  // Get thumbnail for lazy loading
  const getThumbnailUrl = () => {
    if (!imageUrl) return null

    if (imageSizes && imageSizes.thumbnail) {
      return imageSizes.thumbnail
    }

    return imageUrl
  }

  // Format the date
  const formattedDate = () => {
    try {
      return formatDistanceToNow(new Date(createdAt), { addSuffix: true })
    } catch (error) {
      return "some time ago"
    }
  }

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              {userImage ? (
                <AvatarImage src={userImage || "/placeholder.svg"} alt={userName} />
              ) : (
                <AvatarFallback className="bg-blue-100">
                  <User className="h-5 w-5 text-blue-500" />
                </AvatarFallback>
              )}
            </Avatar>
            <div>
              <h3 className="font-medium">{userName}</h3>
              <p className="text-sm text-gray-500">{formattedDate()}</p>
            </div>
          </div>
          {isOwner && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" disabled={isDeleting}>
                  {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreVertical className="h-4 w-4" />}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleDelete} className="text-red-500">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete post
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        {content && <p className="mb-4 whitespace-pre-wrap">{content}</p>}
        {imageUrl && (
          <div className="relative rounded-md overflow-hidden mb-4">
            <div className="aspect-video relative">
              <Image
                src={getBestImageUrl() || "/placeholder.svg"}
                alt="Post image"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 768px"
                placeholder="blur"
                blurDataURL={getThumbnailUrl() || "/placeholder.svg"}
              />
            </div>
          </div>
        )}
        <div className="flex items-center justify-between text-sm text-gray-500 pt-2">
          <div>{likesCount > 0 && `${likesCount} likes`}</div>
          <div className="flex gap-4">
            {commentsCount > 0 && `${commentsCount} comments`}
            {sharesCount > 0 && `${sharesCount} shares`}
          </div>
        </div>
      </CardContent>
      <CardFooter className="border-t pt-2 pb-2">
        <div className="flex items-center justify-between w-full">
          <Button variant="ghost" size="sm" className="flex-1">
            <Heart className="h-5 w-5 mr-2" />
            Like
          </Button>
          <Button variant="ghost" size="sm" className="flex-1">
            <MessageSquare className="h-5 w-5 mr-2" />
            Comment
          </Button>
          <Button variant="ghost" size="sm" className="flex-1">
            <Share2 className="h-5 w-5 mr-2" />
            Share
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
