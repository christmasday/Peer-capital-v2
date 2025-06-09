"use client"

import { useState, useEffect, useCallback } from "react"
import { getConversations } from "@/lib/actions/messages"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { UserRound, Loader2, RefreshCcw } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

interface Conversation {
  user_id: string
  first_name: string | null
  last_name: string | null
  profile_picture_url: string | null
  last_message: string
  last_message_time: string
  unread_count: number
}

export function ConversationList() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAuthError, setIsAuthError] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  const fetchConversations = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    setIsAuthError(false)

    try {
      const result = await getConversations()

      if (result.error) {
        setError(result.error)
        // Check if it's an auth-related error
        if (result.error.includes("logged in") || result.error.includes("auth")) {
          setIsAuthError(true)
        }
      } else {
        setConversations(result.conversations || [])
      }
    } catch (err) {
      setError("Failed to load conversations")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchConversations()

    // Set up polling for new messages, but only if initial fetch was successful
    let interval: NodeJS.Timeout | null = null

    if (!error) {
      interval = setInterval(fetchConversations, 30000) // Poll every 30 seconds
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [fetchConversations, error])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center p-4">
        <p className="text-red-500 mb-2">{error}</p>
        {isAuthError ? (
          <Button variant="outline" onClick={() => router.push("/")} className="mt-2">
            Go to Login
          </Button>
        ) : (
          <Button variant="outline" onClick={fetchConversations} className="mt-2 flex items-center gap-2">
            <RefreshCcw className="h-4 w-4" /> Retry
          </Button>
        )}
      </div>
    )
  }

  if (conversations.length === 0) {
    return (
      <div className="text-center p-8 text-gray-500">
        <p>No conversations yet</p>
        <p className="text-sm mt-2">Start messaging someone to see your conversations here</p>
      </div>
    )
  }

  return (
    <div className="divide-y">
      {conversations.map((conversation) => {
        const fullName = `${conversation.first_name || ""} ${conversation.last_name || ""}`.trim() || "User"
        const initials = fullName
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
        const isActive = pathname === `/messages/${conversation.user_id}`

        return (
          <Link
            key={conversation.user_id}
            href={`/messages/${conversation.user_id}`}
            className={cn("flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors", isActive && "bg-blue-50")}
          >
            <div className="relative">
              <Avatar className="h-12 w-12">
                {conversation.profile_picture_url ? (
                  <AvatarImage src={conversation.profile_picture_url || "/placeholder.svg"} alt={fullName} />
                ) : (
                  <AvatarFallback className="bg-blue-100">
                    {initials || <UserRound className="h-6 w-6 text-blue-500" />}
                  </AvatarFallback>
                )}
              </Avatar>
              {conversation.unread_count > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {conversation.unread_count}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-baseline">
                <h3 className="font-medium truncate">{fullName}</h3>
                <span className="text-xs text-gray-500 ml-2 whitespace-nowrap">
                  {formatDistanceToNow(new Date(conversation.last_message_time), { addSuffix: true })}
                </span>
              </div>
              <p className="text-sm text-gray-600 truncate">{conversation.last_message}</p>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
