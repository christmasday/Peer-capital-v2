"use client"

import { useState, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { UserPlus, Users } from "lucide-react"
import { getFollowers, getFollowing } from "@/lib/actions/connections"
import { FollowButton } from "@/components/profile/follow-button"
import Link from "next/link"

interface ConnectionsListProps {
  userId: string
  initialFollowersCount: number
  initialFollowingCount: number
}

interface UserConnection {
  connectionId: string
  userId: string
  firstName: string | null
  lastName: string | null
  email: string | null
  profilePictureUrl: string | null
  followedAt: string
}

export function ConnectionsList({ userId, initialFollowersCount, initialFollowingCount }: ConnectionsListProps) {
  const [activeTab, setActiveTab] = useState("followers")
  const [followers, setFollowers] = useState<UserConnection[]>([])
  const [following, setFollowing] = useState<UserConnection[]>([])
  const [isLoadingFollowers, setIsLoadingFollowers] = useState(false)
  const [isLoadingFollowing, setIsLoadingFollowing] = useState(false)
  const [followersCount, setFollowersCount] = useState(initialFollowersCount)
  const [followingCount, setFollowingCount] = useState(initialFollowingCount)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (activeTab === "followers") {
      loadFollowers(1)
    } else {
      loadFollowing(1)
    }
  }, [activeTab, userId])

  const loadFollowers = async (page: number) => {
    setIsLoadingFollowers(true)
    setError(null)
    try {
      const result = await getFollowers(userId, page)
      if (result.error) {
        console.error("Error loading followers:", result.error)
        setError(result.error)
        return
      }

      if (page === 1) {
        setFollowers(result.followers || [])
      } else {
        setFollowers((prev) => [...prev, ...(result.followers || [])])
      }

      setHasMore((result.followers || []).length === 10) // Assuming 10 is the limit
      setCurrentPage(page)
    } catch (error) {
      console.error("Error loading followers:", error)
      setError("Failed to load followers.")
    } finally {
      setIsLoadingFollowers(false)
    }
  }

  const loadFollowing = async (page: number) => {
    setIsLoadingFollowing(true)
    setError(null)
    try {
      const result = await getFollowing(userId, page)
      if (result.error) {
        console.error("Error loading following:", result.error)
        setError(result.error)
        return
      }

      if (page === 1) {
        setFollowing(result.following || [])
      } else {
        setFollowing((prev) => [...prev, ...(result.following || [])])
      }

      setHasMore((result.following || []).length === 10) // Assuming 10 is the limit
      setCurrentPage(page)
    } catch (error) {
      console.error("Error loading following:", error)
      setError("Failed to load following.")
    } finally {
      setIsLoadingFollowing(false)
    }
  }

  const handleLoadMore = () => {
    const nextPage = currentPage + 1
    if (activeTab === "followers") {
      loadFollowers(nextPage)
    } else {
      loadFollowing(nextPage)
    }
  }

  const handleFollowChange = (userId: string, isFollowing: boolean) => {
    // Update the following list if a user is unfollowed
    if (!isFollowing) {
      setFollowing((prev) => prev.filter((user) => user.userId !== userId))
      setFollowingCount((prev) => prev - 1)
    }
  }

  const getFullName = (user: UserConnection) => {
    return [user.firstName, user.lastName].filter(Boolean).join(" ") || "User"
  }

  const getInitials = (user: UserConnection) => {
    if (!user.firstName && !user.lastName) {
      return user.email ? user.email.substring(0, 2).toUpperCase() : "U"
    }

    return [user.firstName, user.lastName]
      .filter(Boolean)
      .map((name) => name?.[0])
      .join("")
      .toUpperCase()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Connections</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="followers" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="followers" className="flex gap-2 items-center">
              <Users className="h-4 w-4" />
              Followers ({followersCount})
            </TabsTrigger>
            <TabsTrigger value="following" className="flex gap-2 items-center">
              <UserPlus className="h-4 w-4" />
              Following ({followingCount})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="followers" className="mt-4">
            {error && (
              <div className="p-4 text-center">
                <p className="text-red-500">{error}</p>
                {error.includes("not available yet") && (
                  <p className="mt-2 text-sm text-gray-500">
                    The connections feature needs to be set up by an administrator.
                  </p>
                )}
              </div>
            )}
            {!error && followers?.length === 0 && <div className="p-4 text-center text-gray-500">No followers yet</div>}
            {isLoadingFollowers && followers.length === 0 && !error ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[200px]" />
                      <Skeleton className="h-4 w-[150px]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : followers.length > 0 ? (
              <div className="space-y-4">
                {followers.map((follower) => (
                  <div key={follower.connectionId} className="flex items-center justify-between">
                    <Link
                      href={`/profile/${follower.userId}`}
                      className="flex items-center gap-3 hover:underline flex-1"
                    >
                      <Avatar>
                        <AvatarImage src={follower.profilePictureUrl || ""} alt={getFullName(follower)} />
                        <AvatarFallback>{getInitials(follower)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{getFullName(follower)}</p>
                        <p className="text-sm text-muted-foreground">{follower.email}</p>
                      </div>
                    </Link>
                    <FollowButton
                      userId={follower.userId}
                      initialFollowingState={following.some(f => f.userId === follower.userId)}
                      onFollowChange={(isFollowing) => handleFollowChange(follower.userId, isFollowing)}
                    />
                  </div>
                ))}

                {hasMore && (
                  <div className="text-center pt-4">
                    <Button variant="outline" onClick={handleLoadMore} disabled={isLoadingFollowers}>
                      {isLoadingFollowers ? "Loading..." : "Load More"}
                    </Button>
                  </div>
                )}
              </div>
            ) : null}
          </TabsContent>

          <TabsContent value="following" className="mt-4">
            {error && (
              <div className="p-4 text-center">
                <p className="text-red-500">{error}</p>
                {error.includes("not available yet") && (
                  <p className="mt-2 text-sm text-gray-500">
                    The connections feature needs to be set up by an administrator.
                  </p>
                )}
              </div>
            )}
            {!error && following?.length === 0 && (
              <div className="p-4 text-center text-gray-500">Not following anyone yet</div>
            )}
            {isLoadingFollowing && following.length === 0 && !error ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[200px]" />
                      <Skeleton className="h-4 w-[150px]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : following.length > 0 ? (
              <div className="space-y-4">
                {following.map((follow) => (
                  <div key={follow.connectionId} className="flex items-center justify-between">
                    <Link href={`/profile/${follow.userId}`} className="flex items-center gap-3 hover:underline flex-1">
                      <Avatar>
                        <AvatarImage src={follow.profilePictureUrl || ""} alt={getFullName(follow)} />
                        <AvatarFallback>{getInitials(follow)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{getFullName(follow)}</p>
                        <p className="text-sm text-muted-foreground">{follow.email}</p>
                      </div>
                    </Link>
                    <FollowButton
                      userId={follow.userId}
                      initialFollowingState={true}
                      onFollowChange={(isFollowing) => handleFollowChange(follow.userId, isFollowing)}
                    />
                  </div>
                ))}

                {hasMore && (
                  <div className="text-center pt-4">
                    <Button variant="outline" onClick={handleLoadMore} disabled={isLoadingFollowing}>
                      {isLoadingFollowing ? "Loading..." : "Load More"}
                    </Button>
                  </div>
                )}
              </div>
            ) : null}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
