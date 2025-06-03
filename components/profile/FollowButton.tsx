"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { isFollowingUser, followUser, unfollowUser } from "@/lib/actions/connections"

export function FollowButton({ userId, currentUserId }: { userId: string, currentUserId: string }) {
  const [isFollowing, setIsFollowing] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let mounted = true
    async function fetchFollowState() {
      setLoading(true)
      const result = await isFollowingUser(userId)
      if (mounted && result && typeof result.following === "boolean") {
        setIsFollowing(result.following)
      }
      setLoading(false)
    }
    fetchFollowState()
    return () => { mounted = false }
  }, [userId])

  const handleToggleFollow = async () => {
    setLoading(true)
    if (isFollowing) {
      await unfollowUser(userId)
      setIsFollowing(false)
    } else {
      await followUser(userId)
      setIsFollowing(true)
    }
    setLoading(false)
  }

  return (
    <Button onClick={handleToggleFollow} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
      {isFollowing ? "Unfollow" : "Follow"}
    </Button>
  )
} 