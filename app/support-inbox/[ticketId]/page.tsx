"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Calendar, Mail, MessageSquare, User, Loader2, Send } from "lucide-react"

interface SupportTicket {
  id: string
  category: string
  subject: string
  description: string
  status: string
  created_at: string
  updated_at: string
  email: string
  user_id?: string | null
  priority?: string
}

interface SupportTicketResponse {
  id: string
  ticket_id: string
  user_id: string | null
  is_staff_response: boolean
  message: string
  created_at: string
}

function getStatusColor(status: string) {
  switch (status) {
    case "open":
      return "bg-yellow-500 hover:bg-yellow-600"
    case "in_progress":
      return "bg-blue-500 hover:bg-blue-600"
    case "resolved":
      return "bg-green-500 hover:bg-green-600"
    case "closed":
      return "bg-gray-500 hover:bg-gray-600"
    default:
      return "bg-gray-500 hover:bg-gray-600"
  }
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default function SupportTicketDetailsPage() {
  const params = useParams<{ ticketId: string }>()
  const router = useRouter()
  const { toast } = useToast()
  const ticketId = params?.ticketId

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [ticket, setTicket] = useState<SupportTicket | null>(null)
  const [responses, setResponses] = useState<SupportTicketResponse[]>([])
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)

  useEffect(() => {
    const fetchTicket = async () => {
      if (!ticketId) {
        setError("Missing ticket id")
        setLoading(false)
        return
      }

      try {
        const response = await fetch(`/api/support/tickets/${ticketId}`, {
          credentials: "include",
        })

        if (!response.ok) {
          const body = await response.json().catch(() => ({}))
          throw new Error(body.error || "Failed to load ticket details")
        }

        const data = await response.json()
        setTicket(data.ticket || null)
        setResponses(data.responses || [])
        setCurrentUserId(data.currentUserId || null)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load ticket details")
      } finally {
        setLoading(false)
      }
    }

    fetchTicket()
  }, [ticketId])

  const handleSendMessage = async () => {
    const trimmedMessage = message.trim()
    if (!ticketId || !trimmedMessage || sending) {
      return
    }

    setSending(true)

    try {
      const response = await fetch(`/api/support/tickets/${ticketId}/responses`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: trimmedMessage }),
      })

      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        throw new Error(body.error || "Failed to send message")
      }

      const data = await response.json()
      if (data?.response) {
        setResponses((prev) => [...prev, data.response])
      }
      setMessage("")
      toast({
        title: "Message sent",
        description: "Your update was added to this ticket.",
      })
    } catch (err) {
      toast({
        title: "Failed to send",
        description: err instanceof Error ? err.message : "Unable to send message.",
        variant: "destructive",
      })
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="container max-w-4xl mx-auto py-8">
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <p className="mt-4 text-gray-600">Loading ticket details...</p>
        </div>
      </div>
    )
  }

  if (error || !ticket) {
    return (
      <div className="container max-w-4xl mx-auto py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Unable to load ticket</h2>
            <p className="text-gray-600 mb-6">{error || "Ticket not found"}</p>
            <div className="flex justify-center gap-3">
              <Button variant="outline" onClick={() => router.back()}>
                Go Back
              </Button>
              <Button asChild>
                <Link href="/support-inbox">Back to Support Inbox</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" asChild>
          <Link href="/support-inbox" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Support Inbox
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-2xl">{ticket.subject}</CardTitle>
              <p className="mt-2 text-sm text-gray-600">Ticket ID: {ticket.id}</p>
            </div>
            <Badge className={getStatusColor(ticket.status)}>{ticket.status.replace("_", " ").toUpperCase()}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Created: {formatDate(ticket.created_at)}
            </span>
            <span className="flex items-center gap-1">
              <Mail className="h-4 w-4" />
              {ticket.email}
            </span>
            <span className="capitalize">Category: {ticket.category}</span>
          </div>

          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Issue details</p>
            <p className="text-gray-800 whitespace-pre-wrap">{ticket.description}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <MessageSquare className="h-5 w-5" />
            Conversation
          </CardTitle>
        </CardHeader>
        <CardContent>
          {responses.length === 0 ? (
            <p className="text-gray-600">No responses yet. Our support team will update this ticket here.</p>
          ) : (
            <div className="space-y-3">
              {responses.map((response) => (
                <div
                  key={response.id}
                  className={`rounded-lg border p-4 ${response.is_staff_response ? "bg-blue-50 border-blue-200" : "bg-gray-50 border-gray-200"}`}
                >
                  <div className="mb-2 flex items-center justify-between text-xs text-gray-600">
                    <span className="flex items-center gap-1 font-medium">
                      <User className="h-3.5 w-3.5" />
                      {response.user_id && response.user_id === currentUserId
                        ? "You"
                        : response.is_staff_response
                          ? "Support Team"
                          : "User"}
                    </span>
                    <span>{formatDate(response.created_at)}</span>
                  </div>
                  <p className="text-sm text-gray-800 whitespace-pre-wrap">{response.message}</p>
                </div>
              ))}
            </div>
          )}

          <div className="mt-5 border-t border-gray-200 pt-4">
            <p className="mb-2 text-sm font-medium text-gray-800">Add a message</p>
            <Textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows={4}
              placeholder="Share additional details, questions, or updates for support."
              className="w-full"
            />
            <div className="mt-3 flex justify-end">
              <Button onClick={handleSendMessage} disabled={!message.trim() || sending}>
                {sending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Message
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
