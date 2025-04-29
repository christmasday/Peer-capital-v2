"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { UserPlus, UserMinus, Loader2 } from "lucide-react"
import { followUser, unfollowUser } from "@/lib/actions/connections"
import { useToast } from "@/hooks/use-toast"

interface FollowButtonProps {
  userId: string
  initialFollowingState: boolean
  onFollowChange?: (isFollowing: boolean) => void
}

export function FollowButton({ userId, initialFollowingState, onFollowChange }: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialFollowingState)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleFollowToggle = async () => {
    setIsLoading(true)

    try {
      if (isFollowing) {
        // Unfollow user
        const result = await unfollowUser(userId)
        if (result.error) {
          toast({
            title: "Error",
            description: result.error,
            variant: "destructive",
          })
          return
        }
        setIsFollowing(false)
        toast({
          title: "Unfollowed",
          description: "You are no longer following this user",
        })
      } else {
        // Follow user
        const result = await followUser(userId)
        if (result.error) {
          toast({
            title: "Error",
            description: result.error,
            variant: "destructive",
          })
          return
        }
        setIsFollowing(true)
        toast({
          title: "Following",
          description: "You are now following this user",
        })
      }

      // Notify parent component of the change
      if (onFollowChange) {
        onFollowChange(!isFollowing)
      }
    } catch (error) {
      console.error("Error toggling follow:", error)
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
    <Button
      variant={isFollowing ? "outline" : "default"}
      className="flex gap-2 items-center"
      onClick={handleFollowToggle}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isFollowing ? (
        <UserMinus className="h-4 w-4" />
      ) : (
        <UserPlus className="h-4 w-4" />
      )}
      {isFollowing ? "Unfollow" : "Follow"}
    </Button>
  )
}
