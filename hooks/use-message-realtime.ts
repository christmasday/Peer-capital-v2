"use client"

// Messaging realtime disabled. Provide a no-op hook that preserves the API
// so callers can continue to use it safely.

import { useEffect, useState } from "react"

interface UseMessageRealtimeOptions {
  enabled?: boolean
  eventTypes?: string[]
  otherUserId?: string
}

export function useMessageRealtime(_onChange?: (...args: any[]) => void, _options: UseMessageRealtimeOptions = {}) {
  const [isRealtimeConnected] = useState(false)

  useEffect(() => {
    if (_options.enabled === false) return
    // no-op
  }, [_options.enabled])

  return { isRealtimeConnected }
}