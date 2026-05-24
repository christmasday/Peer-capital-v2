"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useSupabaseClient } from "@/components/supabase/SupabaseProvider"

export type NotificationRealtimeEvent = "INSERT" | "UPDATE" | "DELETE"

interface UseNotificationRealtimeOptions {
  enabled?: boolean
  eventTypes?: NotificationRealtimeEvent[]
}

export function useNotificationRealtime(
  onChange?: (eventType: NotificationRealtimeEvent) => void,
  options: UseNotificationRealtimeOptions = {},
) {
  const { supabase, session } = useSupabaseClient()
  const callbackRef = useRef(onChange)
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false)
  const eventTypes = useMemo<NotificationRealtimeEvent[]>(
    () => options.eventTypes || ["INSERT", "UPDATE", "DELETE"],
    [options.eventTypes],
  )

  useEffect(() => {
    callbackRef.current = onChange
  }, [onChange])

  useEffect(() => {
    const userId = session?.user?.id
    if (options.enabled === false || !userId) {
      setIsRealtimeConnected(false)
      return
    }

    const channelName = `notifications-${userId}`
    const channel = supabase.channel(channelName)

    for (const eventType of eventTypes) {
      channel.on(
        "postgres_changes",
        {
          event: eventType,
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          callbackRef.current?.(eventType)
        },
      )
    }

    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        setIsRealtimeConnected(true)
        return
      }

      if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
        setIsRealtimeConnected(false)
      }
    })

    return () => {
      setIsRealtimeConnected(false)
      supabase.removeChannel(channel)
    }
  }, [supabase, session?.user?.id, options.enabled, eventTypes])

  return { isRealtimeConnected }
}
