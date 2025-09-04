"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Mail, MessageSquare, Clock, CheckCircle, AlertCircle, User, Calendar, Settings } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

interface SupportTicket {
  id: string
  category: string
  subject: string
  description: string
  status: string
  created_at: string
  email: string
  user_id?: string
}

export default function SupportInboxPage() {
  const { toast } = useToast()
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isStaff, setIsStaff] = useState(false)
  const [updatingTicket, setUpdatingTicket] = useState<string | null>(null)

  useEffect(() => {
    const checkAuthAndFetchTickets = async () => {
      try {
        // Check if user is authenticated
        const authResponse = await fetch("/api/auth/status")
        const authData = await authResponse.json()
        
        if (authData.authenticated) {
          setIsAuthenticated(true)
          
          // Check if user is staff
          const staffResponse = await fetch("/api/auth/check-staff")
          const staffData = await staffResponse.json()
          setIsStaff(staffData.isStaff || false)
          
          // Fetch user's tickets (or all tickets if staff)
          const ticketsResponse = await fetch("/api/support/tickets")
          if (ticketsResponse.ok) {
            const ticketsData = await ticketsResponse.json()
            setTickets(ticketsData.tickets || [])
          }
        }
      } catch (error) {
        console.error("Error fetching tickets:", error)
      } finally {
        setLoading(false)
      }
    }

    checkAuthAndFetchTickets()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-yellow-500 hover:bg-yellow-600'
      case 'in_progress':
        return 'bg-blue-500 hover:bg-blue-600'
      case 'resolved':
        return 'bg-green-500 hover:bg-green-600'
      case 'closed':
        return 'bg-gray-500 hover:bg-gray-600'
      default:
        return 'bg-gray-500 hover:bg-gray-600'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <AlertCircle className="h-4 w-4" />
      case 'in_progress':
        return <Clock className="h-4 w-4" />
      case 'resolved':
        return <CheckCircle className="h-4 w-4" />
      case 'closed':
        return <CheckCircle className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleStatusUpdate = async (ticketId: string, newStatus: string) => {
    setUpdatingTicket(ticketId)
    
    try {
      const response = await fetch(`/api/support/tickets/${ticketId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        // Update the ticket in the local state
        setTickets(prevTickets => 
          prevTickets.map(ticket => 
            ticket.id === ticketId 
              ? { ...ticket, status: newStatus }
              : ticket
          )
        )
        
        toast({
          title: "Status Updated",
          description: `Ticket status changed to ${newStatus.replace('_', ' ')}`,
        })
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to update ticket status",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update ticket status",
        variant: "destructive"
      })
    } finally {
      setUpdatingTicket(null)
    }
  }

  if (loading) {
    return (
      <div className="container max-w-4xl mx-auto py-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your support tickets...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-4xl mx-auto py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Support Inbox</h1>
            <p className="text-gray-600">View and manage your support tickets</p>
          </div>
          {isStaff && (
            <Badge variant="outline" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Staff Member
            </Badge>
          )}
        </div>
      </div>

      {!isAuthenticated ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Support Tickets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Sign in to view your tickets</h3>
              <p className="text-gray-600 mb-6">Please sign in to your account to view your support ticket history.</p>
              <div className="flex gap-4 justify-center">
                <Button asChild>
                  <Link href="/login">Sign In</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/report-problem">Report a Problem</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : tickets.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Support Tickets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No support tickets yet</h3>
              <p className="text-gray-600 mb-6">When you contact support, your conversations will appear here.</p>
              <div className="flex gap-4 justify-center">
                <Button asChild>
                  <Link href="/report-problem">Report a Problem</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/faq">Help Center</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {tickets.map((ticket) => (
            <Card key={ticket.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">{ticket.subject}</h3>
                      <Badge className={getStatusColor(ticket.status)}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(ticket.status)}
                          {ticket.status.replace('_', ' ').toUpperCase()}
                        </div>
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDate(ticket.created_at)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Mail className="h-4 w-4" />
                        {ticket.email}
                      </span>
                      <span className="capitalize">{ticket.category}</span>
                    </div>
                    <p className="text-gray-700 line-clamp-2">{ticket.description}</p>
                  </div>
                  <div className="ml-4 flex flex-col gap-2">
                    {isStaff && (
                      <div className="flex flex-col gap-2">
                        <Select
                          value={ticket.status}
                          onValueChange={(value) => handleStatusUpdate(ticket.id, value)}
                          disabled={updatingTicket === ticket.id}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="open">Open</SelectItem>
                            <SelectItem value="in_progress">Working</SelectItem>
                            <SelectItem value="resolved">Resolved</SelectItem>
                            <SelectItem value="closed">Closed</SelectItem>
                          </SelectContent>
                        </Select>
                        {updatingTicket === ticket.id && (
                          <div className="text-xs text-gray-500">Updating...</div>
                        )}
                      </div>
                    )}
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/support-inbox/${ticket.id}`}>View Details</Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="mt-8 flex justify-center">
        <Button asChild>
          <Link href="/report-problem">Create New Ticket</Link>
        </Button>
      </div>
    </div>
  )
}
