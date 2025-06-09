"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { PostItem } from "./post-item"
import { getUserPosts } from "@/lib/actions/posts"
import { useToast } from "@/components/ui/use-toast"

interface PostsListProps {
  userId: string
  userName: string
  userImage?: string | null
  initialPosts: any[]
}

export function PostsList({ userId, userName, userImage, initialPosts = [] }: PostsListProps) {
  const [posts, setPosts] = useState<any[]>(initialPosts)
  const [isLoading, setIsLoading] = useState(false)
  const [offset, setOffset] = useState(initialPosts.length)
  const [hasMore, setHasMore] = useState(initialPosts.length >= 10)
  const { toast } = useToast()

  // Function to load more posts
  const loadMorePosts = async () => {
    if (isLoading || !hasMore) return

    setIsLoading(true)
    try {
      const result = await getUserPosts(userId, 10, offset)

      if (result.error) {
        throw new Error(result.error)
      }

      const newPosts = result.posts || []

      if (newPosts.length > 0) {
        setPosts((prev) => [...prev, ...newPosts])
        setOffset((prev) => prev + newPosts.length)
      }

      setHasMore(newPosts.length >= 10)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load more posts. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Function to handle post deletion
  const handlePostDeleted = (postId: string) => {
    setPosts((prev) => prev.filter((post) => post.id !== postId))
  }

  // Debug: Log the posts
  useEffect(() => {
  }, [posts])

  if (posts.length === 0) {
    return (
      <Card className="shadow-sm">
        <CardContent className="py-12 text-center">
          <p className="text-gray-500 mb-2">No posts yet</p>
          <p className="text-sm text-gray-400">Posts will appear here once created</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <PostItem
          key={post.id}
          id={post.id}
          userId={userId}
          userName={userName}
          userImage={userImage || undefined}
          content={post.content}
          imageUrl={post.image_url}
          imageSizes={post.image_sizes}
          createdAt={post.created_at}
          likesCount={post.likes_count || 0}
          commentsCount={post.comments_count || 0}
          sharesCount={post.shares_count || 0}
          isOwner={true}
          onDeleted={() => handlePostDeleted(post.id)}
        />
      ))}

      {hasMore && (
        <div className="flex justify-center mt-6">
          <Button variant="outline" onClick={loadMorePosts} disabled={isLoading} className="w-full max-w-xs">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              "Load More"
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
