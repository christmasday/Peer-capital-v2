"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"
import {
  BarChart2,
  CreditCard,
  Users,
  MessageSquare,
  ArrowUpRight,
  ArrowDownLeft,
  FileText,
  Briefcase,
  BanknoteIcon as Bank,
  AlertCircle,
  CheckCircle2,
  Building,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ActivityDetailModal, type ActivityItem } from "./activity-detail-modal"

interface ActivityTimelineProps {
  userId: string
}

export function ActivityTimeline({ userId }: ActivityTimelineProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedActivity, setSelectedActivity] = useState<ActivityItem | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    // Simulate loading activities from an API
    const loadActivities = async () => {
      setLoading(true)

      // In a real implementation, you would fetch from an API
      // const response = await fetch(`/api/activities?userId=${userId}`)
      // const data = await response.json()
      // setActivities(data.activities || [])

      // For now, we'll use mock data
      setTimeout(() => {
        setActivities([
          {
            id: "1",
            type: "transaction",
            title: "Account Funded",
            description: "You added ₦50,000 to your account",
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
            status: "completed",
            amount: 50000,
            icon: "deposit",
            reference: "TRX-12345678",
          },
          {
            id: "va1",
            type: "virtual_account",
            title: "Virtual Account Funded",
            description: "₦25,000 received in your virtual account",
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(), // 12 hours ago
            status: "completed",
            amount: 25000,
            icon: "virtual_deposit",
            reference: "VA-87654321",
            accountNumber: "9876543210",
            bankName: "Providus Bank",
            accountName: "John Doe",
          },
          {
            id: "2",
            type: "connection",
            title: "New Connection",
            description: "Adebayo Olamide started following you",
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
            icon: "connection",
            userId: "user-123",
            userName: "Adebayo Olamide",
          },
          {
            id: "va2",
            type: "virtual_account",
            title: "Virtual Account Created",
            description: "Your virtual account was successfully created",
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1.5).toISOString(), // 1.5 days ago
            status: "completed",
            icon: "virtual_account_created",
            accountNumber: "9876543210",
            bankName: "Providus Bank",
            accountName: "John Doe",
          },
          {
            id: "3",
            type: "profile",
            title: "Profile Updated",
            description: "You updated your employment information",
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
            icon: "profile",
          },
          {
            id: "4",
            type: "verification",
            title: "ID Verification",
            description: "Your ID verification is pending review",
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 days ago
            status: "pending",
            icon: "verification",
          },
          {
            id: "va3",
            type: "virtual_account",
            title: "Virtual Account Request",
            description: "You requested a virtual account",
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(), // 4 days ago
            status: "processing",
            icon: "virtual_account_request",
          },
          {
            id: "5",
            type: "transaction",
            title: "Withdrawal",
            description: "You withdrew ₦20,000 to your bank account",
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), // 5 days ago
            status: "completed",
            amount: -20000,
            icon: "withdrawal",
            reference: "TRX-87654321",
          },
          {
            id: "6",
            type: "message",
            title: "New Message",
            description: "You received a message from Chioma Nwosu",
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(), // 7 days ago
            icon: "message",
            userId: "user-456",
            userName: "Chioma Nwosu",
          },
          {
            id: "7",
            type: "account",
            title: "Account Created",
            description: "Welcome to Peer Capital!",
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(), // 14 days ago
            icon: "account",
          },
        ])
        setLoading(false)
      }, 1000)
    }

    loadActivities()
  }, [userId])

  const handleActivityClick = (activity: ActivityItem) => {
    setSelectedActivity(activity)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
  }

  const getActivityIcon = (activity: ActivityItem) => {
    switch (activity.icon) {
      case "deposit":
        return <ArrowDownLeft className="h-5 w-5 text-green-500" />
      case "withdrawal":
        return <ArrowUpRight className="h-5 w-5 text-orange-500" />
      case "connection":
        return <Users className="h-5 w-5 text-blue-500" />
      case "message":
        return <MessageSquare className="h-5 w-5 text-purple-500" />
      case "profile":
        return <Briefcase className="h-5 w-5 text-indigo-500" />
      case "verification":
        return <FileText className="h-5 w-5 text-yellow-500" />
      case "account":
        return <CreditCard className="h-5 w-5 text-blue-600" />
      // Virtual account specific icons
      case "virtual_account_created":
        return <Bank className="h-5 w-5 text-emerald-600" />
      case "virtual_account_request":
        return <Building className="h-5 w-5 text-blue-600" />
      case "virtual_deposit":
        return <CheckCircle2 className="h-5 w-5 text-green-600" />
      case "virtual_account_error":
        return <AlertCircle className="h-5 w-5 text-red-500" />
      default:
        return <BarChart2 className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusBadge = (status?: string) => {
    if (!status) return null

    switch (status.toLowerCase()) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Completed</Badge>
      case "pending":
        return (
          <Badge variant="outline" className="border-yellow-300 text-yellow-700">
            Pending
          </Badge>
        )
      case "processing":
        return (
          <Badge variant="outline" className="border-blue-300 text-blue-700">
            Processing
          </Badge>
        )
      case "failed":
        return <Badge variant="destructive">Failed</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatAmount = (amount?: number) => {
    if (amount === undefined) return null

    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 2,
    }).format(Math.abs(amount))
  }

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <BarChart2 className="h-5 w-5 mr-2 text-blue-600" />
            Activity Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center">
            <BarChart2 className="h-5 w-5 mr-2 text-blue-600" />
            Activity Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activities.length === 0 ? (
            <div className="text-center py-12">
              <BarChart2 className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 mb-3">No activity to display yet</p>
              <p className="text-sm text-gray-400 max-w-xs mx-auto">
                Your recent actions and account activities will appear here
              </p>
            </div>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-5 top-1 bottom-0 w-0.5 bg-gray-200"></div>

              <div className="space-y-6">
                {activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex gap-4 relative cursor-pointer hover:bg-gray-50 rounded-lg p-2 -ml-2 transition-colors"
                    onClick={() => handleActivityClick(activity)}
                  >
                    {/* Icon circle */}
                    <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center z-10">
                      {getActivityIcon(activity)}
                    </div>

                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-1">
                        <h4 className="font-medium">{activity.title}</h4>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                          {getStatusBadge(activity.status)}
                        </div>
                      </div>
                      <p className="text-gray-600">{activity.description}</p>
                      {activity.amount !== undefined && (
                        <p className={`font-medium mt-1 ${activity.amount > 0 ? "text-green-600" : "text-orange-600"}`}>
                          {activity.amount > 0 ? "+" : "-"} {formatAmount(activity.amount)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 text-center">
                <Button variant="outline" size="sm">
                  View All Activity
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <ActivityDetailModal activity={selectedActivity} isOpen={isModalOpen} onClose={handleCloseModal} />
    </>
  )
}
