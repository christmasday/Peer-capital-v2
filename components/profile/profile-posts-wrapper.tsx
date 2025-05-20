"use client"

import { useState } from "react"
import { CreatePostCard } from "./create-post-card"
import { PostsList } from "./posts-list"

interface ProfilePostsWrapperProps {
  userId: string
  userName: string
  userImage?: string
  initialPosts: any[]
}

export function ProfilePostsWrapper({
  userId,
  userName,
  userImage,
  initialPosts,
}: ProfilePostsWrapperProps) {
  // State to trigger refresh
  const [refreshKey, setRefreshKey] = useState(0)

  // Handler to refresh posts after a new post is created
  const handlePostCreated = () => {
    setRefreshKey((prev) => prev + 1)
  }

  return (
    <div>
      <CreatePostCard
        userId={userId}
        userName={userName}
        userImage={userImage}
        onPostCreated={handlePostCreated}
      />
      <PostsList
        key={refreshKey} // This will re-mount PostsList when refreshKey changes
        userId={userId}
        userName={userName}
        userImage={userImage}
        initialPosts={initialPosts}
      />
    </div>
  )
} 