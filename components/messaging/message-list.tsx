"use client"

import { useState, useEffect, useRef } from "react"
import { type MessageWithProfile, getMessages } from "@/lib/actions/messages"
import { MessageItem } from "@/components/messaging/message-item"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { useSupabaseClient } from "@/components/supabase/SupabaseProvider"

interface MessageListProps {
  otherUserId: string
  currentUserId: string
  onNewMessage?: () => void
}

export function MessageList({ otherUserId, currentUserId, onNewMessage }: MessageListProps) {
  const [messages, setMessages] = useState<MessageWithProfile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { supabase } = useSupabaseClient()

  const fetchMessages = async (pageNum = 1, append = false) => {
    try {
      const result = await getMessages(otherUserId, pageNum)

      if (result.error) {
        setError(result.error)
        return
      }

      setHasMore(result.hasMore || false)

      if (append) {
        setMessages((prev) => [...prev, ...(result.messages || [])])
      } else {
        setMessages(result.messages || [])
      }
    } catch (err) {
      setError("Failed to load messages")
    }
  }

  const loadMessages = async () => {
    setIsLoading(true)
    await fetchMessages()
    setIsLoading(false)
  }

  const loadMoreMessages = async () => {
    if (isLoadingMore || !hasMore) return

    setIsLoadingMore(true)
    await fetchMessages(page + 1, true)
    setPage((prev) => prev + 1)
    setIsLoadingMore(false)
  }

  useEffect(() => {
    loadMessages()
    // Set up Supabase Realtime subscription for new messages
    if (!supabase || !currentUserId || !otherUserId) return
    const channel = supabase
      .channel('user-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `or(recipient_id.eq.${currentUserId},sender_id.eq.${currentUserId})`,
        },
        (payload) => {
          const msg = payload.new as MessageWithProfile
          // Only add if it's for this conversation
          if (
            (msg.sender_id === currentUserId && msg.recipient_id === otherUserId) ||
            (msg.sender_id === otherUserId && msg.recipient_id === currentUserId)
          ) {
            setMessages((prev) => [...prev, msg])
            setTimeout(() => {
              if (messagesEndRef.current) {
                messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
              }
            }, 100)
            new Audio("/message.mp3").play()
          }
        }
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, currentUserId, otherUserId])

  useEffect(() => {
    // Scroll to bottom when messages change
    if (messagesEndRef.current && messages.length > 0) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  useEffect(() => {
    if (onNewMessage) {
      onNewMessage()
    }
  }, [messages.length, onNewMessage])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center p-4 text-red-500">
        <p>{error}</p>
      </div>
    )
  }

  if (messages.length === 0) {
    return (
      <div className="text-center p-8 text-gray-500 h-96 flex flex-col justify-center">
        <p>No messages yet</p>
        <p className="text-sm mt-2">Start the conversation by sending a message</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {hasMore && (
        <div className="p-2 text-center">
          <Button variant="outline" size="sm" onClick={loadMoreMessages} disabled={isLoadingMore}>
            {isLoadingMore ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Loading...
              </>
            ) : (
              "Load more"
            )}
          </Button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <MessageItem key={message.id} message={message} currentUserId={currentUserId} />
        ))}
        <div ref={messagesEndRef} />
      </div>
    </div>
  )
}
