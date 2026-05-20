"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useSupabaseClient } from "@/components/supabase/SupabaseProvider"

interface UseConversationTypingOptions {
  enabled?: boolean
}

interface TypingPayload {
  userId: string
  isTyping: boolean
}

function getConversationKey(userA: string, userB: string) {
  return [userA, userB].sort().join("-")
}

export function useConversationTyping(
  currentUserId?: string | null,
  otherUserId?: string | null,
  options: UseConversationTypingOptions = {},
) {
  const { supabase } = useSupabaseClient()
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false)
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const conversationKey = useMemo(() => {
    if (!currentUserId || !otherUserId) {
      return null
    }

    return getConversationKey(currentUserId, otherUserId)
  }, [currentUserId, otherUserId])

  const notifyTyping = useCallback(
    async (isTyping: boolean) => {
      if (!conversationKey || !currentUserId || !channelRef.current) {
        return
      }

      await channelRef.current.send({
        type: "broadcast",
        event: "typing",
        payload: {
          userId: currentUserId,
          isTyping,
        } satisfies TypingPayload,
      })
    },
    [conversationKey, currentUserId],
  )

  useEffect(() => {
    if (options.enabled === false || !conversationKey || !currentUserId || !otherUserId) {
      setIsOtherUserTyping(false)
      return
    }

    const channel = supabase.channel(`typing-${conversationKey}`)
    channelRef.current = channel

    channel.on("broadcast", { event: "typing" }, ({ payload }) => {
      const typingPayload = payload as TypingPayload | undefined
      if (!typingPayload || typingPayload.userId !== otherUserId) {
        return
      }

      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current)
      }

      setIsOtherUserTyping(Boolean(typingPayload.isTyping))

      if (typingPayload.isTyping) {
        resetTimerRef.current = setTimeout(() => {
          setIsOtherUserTyping(false)
        }, 2500)
      }
    })

    channel.subscribe()

    return () => {
      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current)
      }

      setIsOtherUserTyping(false)
      channelRef.current = null
      supabase.removeChannel(channel)
    }
  }, [supabase, conversationKey, currentUserId, otherUserId, options.enabled])

  return { isOtherUserTyping, notifyTyping }
}