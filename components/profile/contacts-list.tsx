"use client"

import { useEffect, useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Check, X, UserPlus } from "lucide-react"
import { getPendingRequests, acceptContactRequest, rejectContactRequest, getContacts } from "@/lib/actions/contact-requests"
import { toast } from "@/hooks/use-toast"
import { UserPreviewModal } from "@/components/profile/user-preview-modal"

const EmptyStateAnimation = () => {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        @keyframes rotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .float-animation {
          animation: float 3s ease-in-out infinite;
        }
        .pulse-glow {
          animation: pulse-glow 2s ease-in-out infinite;
        }
        .rotate-animation {
          animation: rotate 4s linear infinite;
        }
      `}</style>
      
      <div className="relative mb-6">
        {/* Outer rotating circle */}
        <div className="absolute inset-0 w-32 h-32 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full blur-xl opacity-20 rotate-animation"></div>
        
        {/* Main floating container */}
        <div className="relative float-animation">
          <div className="w-32 h-32 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full flex items-center justify-center border-2 border-blue-200">
            <div className="text-6xl pulse-glow">👥</div>
          </div>
        </div>
      </div>
      
      <h3 className="text-2xl font-bold text-gray-800 mb-2">No Contacts Yet</h3>
      <p className="text-gray-500 text-center max-w-sm">
        Start transacting with other users to build your contact list. Your transaction counterparties will appear here.
      </p>
      
      <div className="mt-8 flex gap-2">
        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
        <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
      </div>
    </div>
  )
}

interface ContactsListProps {
  currentUserId?: string
}

export function ContactsList({ currentUserId }: ContactsListProps) {
  const [contacts, setContacts] = useState<any[]>([])
  const [pendingRequests, setPendingRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [showUserPreview, setShowUserPreview] = useState(false)

  const fetchPendingRequests = async () => {
    try {
      const result = await getPendingRequests()
      if (result.success && result.requests) {
        setPendingRequests(result.requests)
      }
    } catch (err) {
      console.error("Failed to fetch pending requests:", err)
    }
  }

  const fetchContacts = async () => {
    try {
      const result = await getContacts()
      if (result.success && result.contacts) {
        setContacts(result.contacts)
      }
    } catch (err) {
      console.error("Failed to fetch contacts:", err)
    }
  }

  useEffect(() => {
    let mounted = true
    setLoading(true)
    
    Promise.all([
      fetchContacts(),
      fetchPendingRequests(),
    ])
      .catch((err) => {
        if (mounted) {
          setError(err.message || "Failed to load contacts")
          setContacts([])
        }
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [])

  const handleAccept = async (requestId: string) => {
    setActionLoading(requestId)
    const result = await acceptContactRequest(requestId)
    if (result.success) {
      toast({ title: "Contact accepted!", description: "You are now connected." })
      setPendingRequests((prev) => prev.filter((r) => r.id !== requestId))
      await fetchContacts()
    } else {
      toast({ title: "Error", description: result.error || "Failed to accept", variant: "destructive" })
    }
    setActionLoading(null)
  }

  const handleReject = async (requestId: string) => {
    setActionLoading(requestId)
    const result = await rejectContactRequest(requestId)
    if (result.success) {
      toast({ title: "Contact request declined" })
      setPendingRequests((prev) => prev.filter((r) => r.id !== requestId))
    } else {
      toast({ title: "Error", description: result.error || "Failed to decline", variant: "destructive" })
    }
    setActionLoading(null)
  }

  const formatCurrency = (amount: number) => {
    try {
      return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0 }).format(amount)
    } catch {
      return String(amount)
    }
  }

  return (
    <>
    <Card className="w-full">
      <CardContent className="min-h-[500px]">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="p-4 border rounded-lg">
                <Skeleton className="h-12 w-12 rounded-full mb-3" />
                <Skeleton className="h-4 w-[150px] mb-2" />
                <Skeleton className="h-3 w-[120px]" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-8 text-center bg-red-50 text-red-700 rounded-lg border border-red-200">
            <p className="font-semibold text-lg">Error loading contacts</p>
            <p className="text-sm mt-2">{error}</p>
          </div>
        ) : (
          <>
            {/* Pending Connection Requests */}
            {pendingRequests.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <UserPlus className="h-5 w-5 text-blue-500" />
                  <h3 className="font-semibold text-lg">Connection Requests</h3>
                  <Badge variant="secondary" className="ml-1">{pendingRequests.length}</Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pendingRequests.map((request) => (
                    <div key={request.id} className="p-4 border border-blue-200 rounded-lg bg-blue-50">
                      <div className="flex flex-col items-center text-center">
                        <Avatar className="h-16 w-16 mb-3">
                          <AvatarImage src={request.requesterAvatar || ""} alt={request.requesterName} />
                          <AvatarFallback>{request.requesterName?.charAt(0) || "U"}</AvatarFallback>
                        </Avatar>
                        <p className="font-semibold text-sm">{request.requesterName}</p>
                        <p className="text-xs text-muted-foreground mt-1">Wants to connect with you</p>
                        <div className="flex gap-2 mt-3 w-full">
                          <Button
                            variant="default"
                            size="sm"
                            className="flex-1"
                            onClick={() => handleAccept(request.id)}
                            disabled={actionLoading === request.id}
                          >
                            <Check className="h-4 w-4 mr-1" /> Accept
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => handleReject(request.id)}
                            disabled={actionLoading === request.id}
                          >
                            <X className="h-4 w-4 mr-1" /> Decline
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Existing Contacts */}
            {contacts.length === 0 && pendingRequests.length === 0 ? (
              <EmptyStateAnimation />
            ) : contacts.length > 0 ? (
              <>
                <h3 className="font-semibold text-lg mb-4">Contacts</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {contacts.map((c) => (
                    <div
                      key={c.id}
                      className="block p-4 border rounded-lg hover:shadow-lg transition-shadow hover:border-blue-400 cursor-pointer"
                      onClick={() => { setSelectedUserId(c.id); setShowUserPreview(true) }}
                    >
                      <div className="flex flex-col items-center text-center">
                        <Avatar className="h-16 w-16 mb-3">
                          <AvatarImage src={c.profile_picture_url || ""} alt={c.username ? `@${c.username}` : `${c.first_name || ""} ${c.last_name || ""}`} />
                          <AvatarFallback>{c.username ? (c.username.slice(0,2).toUpperCase()) : ((c.first_name || "")[0] || "U") + ((c.last_name || "")[0] || "")}</AvatarFallback>
                        </Avatar>
                        <p className="font-semibold text-sm">{c.username ? `@${c.username}` : [c.first_name, c.last_name].filter(Boolean).join(" ") || "User"}</p>
                        {c.bio && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{c.bio}</p>}

                        {c.loan_goal && (
                          <div className="mt-3 w-full">
                            <Badge className="bg-green-500 hover:bg-green-600 mb-2">Lending Goals</Badge>
                            <div className="text-xs text-green-700 bg-green-50 px-2 py-1 rounded-md whitespace-nowrap">
                              {formatCurrency(c.loan_goal.loan_amount)} @ {c.loan_goal.interest_rate}%
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>

    <UserPreviewModal
      userId={selectedUserId}
      currentUserId={currentUserId}
      open={showUserPreview}
      onOpenChange={setShowUserPreview}
    />
    </>
  )
}
