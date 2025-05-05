"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { createAdminClient } from "@/lib/supabase/admin"

interface WebhookEvent {
  id: string
  event_type: string
  payload: any
  processed: boolean
  created_at: string
}

export function WebhookEventsLog() {
  const [events, setEvents] = useState<WebhookEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const supabase = createAdminClient()
        const { data, error } = await supabase
          .from("webhook_events")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(20)

        if (error) throw error
        setEvents(data || [])
      } catch (err) {
        setError(`Failed to load webhook events: ${err instanceof Error ? err.message : String(err)}`)
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()

    // Set up a real-time subscription
    const supabase = createAdminClient()
    const subscription = supabase
      .channel("webhook_events_changes")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "webhook_events" }, (payload) => {
        setEvents((current) => [payload.new as WebhookEvent, ...current.slice(0, 19)])
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const getEventColor = (eventType: string) => {
    if (eventType.includes("success")) return "bg-green-100 text-green-800"
    if (eventType.includes("failed")) return "bg-red-100 text-red-800"
    return "bg-blue-100 text-blue-800"
  }

  if (loading) return <div>Loading webhook events...</div>
  if (error) return <div className="text-red-500">{error}</div>

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Webhook Events</CardTitle>
        <CardDescription>The most recent webhook events received from Paystack</CardDescription>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <p className="text-gray-500">No webhook events recorded yet</p>
        ) : (
          <div className="space-y-4">
            {events.map((event) => (
              <div key={event.id} className="border rounded-md p-4">
                <div className="flex justify-between items-start mb-2">
                  <Badge className={getEventColor(event.event_type)}>{event.event_type}</Badge>
                  <span className="text-sm text-gray-500">{new Date(event.created_at).toLocaleString()}</span>
                </div>
                <div className="mt-2">
                  <details>
                    <summary className="cursor-pointer text-sm font-medium">View payload</summary>
                    <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-60">
                      {JSON.stringify(event.payload, null, 2)}
                    </pre>
                  </details>
                </div>
                <div className="mt-2 text-sm">Status: {event.processed ? "Processed" : "Pending"}</div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
