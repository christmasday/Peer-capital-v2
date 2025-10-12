"use client"

import { useState, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { UserPlus, Users, Plus } from "lucide-react"
import { getFollowers, getFollowing } from "@/lib/actions/connections"
import { FollowButton } from "@/components/profile/follow-button"
import Link from "next/link"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

interface ConnectionsListProps {
  userId: string
  initialFollowersCount: number
  initialFollowingCount: number
  initialTab?: string
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

export function ConnectionsList({ userId, initialFollowersCount, initialFollowingCount, initialTab = "followers" }: ConnectionsListProps) {
  const [activeTab, setActiveTab] = useState(initialTab)
  const [followers, setFollowers] = useState<UserConnection[]>([])
  const [following, setFollowing] = useState<UserConnection[]>([])
  const [isLoadingFollowers, setIsLoadingFollowers] = useState(false)
  const [isLoadingFollowing, setIsLoadingFollowing] = useState(false)
  const [followersCount, setFollowersCount] = useState(initialFollowersCount)
  const [followingCount, setFollowingCount] = useState(initialFollowingCount)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [beneficiaries, setBeneficiaries] = useState<any[]>([])
  const [isBeneficiaryModalOpen, setIsBeneficiaryModalOpen] = useState(false)
  const [beneficiaryAccountNumber, setBeneficiaryAccountNumber] = useState("")
  const [beneficiaryBank, setBeneficiaryBank] = useState("")
  const [beneficiaryBanks, setBeneficiaryBanks] = useState<{ name: string; code: string }[]>([])
  const [beneficiaryAccountName, setBeneficiaryAccountName] = useState("")
  const [isResolving, setIsResolving] = useState(false)
  const [resolveError, setResolveError] = useState("")
  const [isAdding, setIsAdding] = useState(false)
  const [addError, setAddError] = useState("")
  const [isLoadingBeneficiaries, setIsLoadingBeneficiaries] = useState(false)
  const [beneficiariesError, setBeneficiariesError] = useState("")
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [removeError, setRemoveError] = useState("")

  useEffect(() => {
    if (activeTab === "followers") {
      loadFollowers(1)
    } else {
      loadFollowing(1)
    }
  }, [activeTab, userId])

  // Fetch beneficiaries and banks on mount
  useEffect(() => {
    // TODO: Fetch beneficiaries from API
    // setBeneficiaries(...)
    async function fetchBanks() {
      try {
        const res = await fetch("https://api.paystack.co/bank", {
          headers: { Authorization: `Bearer ${process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || ""}` },
        })
        const data = await res.json()
        if (data.status && Array.isArray(data.data)) {
          setBeneficiaryBanks(data.data.map((bank: any) => ({ name: bank.name, code: bank.code })))
        }
      } catch {}
    }
    fetchBanks()
  }, [])

  // Resolve account name
  useEffect(() => {
    async function resolveAccount() {
      if (beneficiaryBank && beneficiaryAccountNumber.length === 10) {
        setIsResolving(true)
        setResolveError("")
        try {
          const bankCode = beneficiaryBanks.find(b => b.name === beneficiaryBank)?.code
          const res = await fetch(`https://api.paystack.co/bank/resolve?account_number=${beneficiaryAccountNumber}&bank_code=${bankCode}`, {
            headers: { Authorization: `Bearer ${process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || ""}` },
          })
          const data = await res.json()
          if (data.status && data.data && data.data.account_name) {
            setBeneficiaryAccountName(data.data.account_name)
          } else {
            setResolveError("Could not resolve account name")
            setBeneficiaryAccountName("")
          }
        } catch {
          setResolveError("Could not resolve account name")
          setBeneficiaryAccountName("")
        } finally {
          setIsResolving(false)
        }
      } else {
        setBeneficiaryAccountName("")
        setResolveError("")
      }
    }
    resolveAccount()
  }, [beneficiaryBank, beneficiaryAccountNumber])

  // Fetch beneficiaries when tab is active
  useEffect(() => {
    if (activeTab === "beneficiaries") {
      setIsLoadingBeneficiaries(true)
      setBeneficiariesError("")
      fetch("/api/beneficiaries")
        .then(async (res) => {
          if (!res.ok) throw new Error("Failed to fetch beneficiaries")
          const data = await res.json()
          setBeneficiaries(data.beneficiaries || [])
        })
        .catch((err) => {
          setBeneficiariesError(err.message || "Failed to fetch beneficiaries")
        })
        .finally(() => setIsLoadingBeneficiaries(false))
    }
  }, [activeTab, isBeneficiaryModalOpen])

  const loadFollowers = async (page: number) => {
    setIsLoadingFollowers(true)
    setError(null)
    try {
      const result = await getFollowers(userId, page)
      if (result.error) {
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

  const handleAddBeneficiary = async () => {
    setIsAdding(true)
    setAddError("")
    try {
      // Call Paystack transferrecipient API
      const bankCode = beneficiaryBanks.find(b => b.name === beneficiaryBank)?.code
      const res = await fetch("/api/virtual-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "nuban",
          name: beneficiaryAccountName,
          account_number: beneficiaryAccountNumber,
          bank_code: bankCode,
          currency: "NGN",
        }),
      })
      const data = await res.json()
      if (!data.status || !data.data?.recipient_code) throw new Error(data.message || "Failed to add beneficiary")
      // Save beneficiary in DB
      const saveRes = await fetch("/api/beneficiaries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          account_name: beneficiaryAccountName,
          account_number: beneficiaryAccountNumber,
          bank_name: beneficiaryBank,
          bank_code: bankCode,
          recipient_code: data.data.recipient_code,
        }),
      })
      if (!saveRes.ok) {
        const errData = await saveRes.json()
        throw new Error(errData.error || "Failed to save beneficiary")
      }
      setIsBeneficiaryModalOpen(false)
      setBeneficiaryAccountNumber("")
      setBeneficiaryBank("")
      setBeneficiaryAccountName("")
      // Refresh beneficiaries list
      setIsLoadingBeneficiaries(true)
      fetch("/api/beneficiaries")
        .then(async (res) => {
          if (!res.ok) throw new Error("Failed to fetch beneficiaries")
          const data = await res.json()
          setBeneficiaries(data.beneficiaries || [])
        })
        .catch((err) => {
          setBeneficiariesError(err.message || "Failed to fetch beneficiaries")
        })
        .finally(() => setIsLoadingBeneficiaries(false))
    } catch (err: any) {
      setAddError(err.message || "Failed to add beneficiary")
    } finally {
      setIsAdding(false)
    }
  }

  const handleRemoveBeneficiary = async (id: string) => {
    setRemovingId(id)
    setRemoveError("")
    try {
      const res = await fetch("/api/beneficiaries", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })
      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || "Failed to remove beneficiary")
      }
      // Refresh beneficiaries list
      setIsLoadingBeneficiaries(true)
      fetch("/api/beneficiaries")
        .then(async (res) => {
          if (!res.ok) throw new Error("Failed to fetch beneficiaries")
          const data = await res.json()
          setBeneficiaries(data.beneficiaries || [])
        })
        .catch((err) => {
          setBeneficiariesError(err.message || "Failed to fetch beneficiaries")
        })
        .finally(() => setIsLoadingBeneficiaries(false))
    } catch (err: any) {
      setRemoveError(err.message || "Failed to remove beneficiary")
    } finally {
      setRemovingId(null)
    }
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
