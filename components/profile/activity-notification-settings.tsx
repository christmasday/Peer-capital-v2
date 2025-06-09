"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Bell, MessageSquare, Users, CreditCard, CheckCircle, Wallet, AlertCircle } from "lucide-react"
import {
  getNotificationPreferences,
  updateNotificationPreferences,
  type NotificationPreferences,
} from "@/lib/actions/notifications"
import { toast } from "@/hooks/use-toast"

export function ActivityNotificationSettings() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Fetch notification preferences on component mount
  useEffect(() => {
    async function fetchPreferences() {
      setIsLoading(true)
      setError(null)

      try {
        const result = await getNotificationPreferences()

        if (result.error) {
          setError(result.error.message || "Failed to load notification preferences")
        } else if (result.preferences) {
          setPreferences(result.preferences)
        }
      } catch (err) {
        setError("Failed to load notification preferences")
      } finally {
        setIsLoading(false)
      }
    }

    fetchPreferences()
  }, [])

  // Handle form submission
  const handleSubmit = async () => {
    if (!preferences) return

    setIsSaving(true)

    try {
      const result = await updateNotificationPreferences(preferences)

      if (result.error) {
        toast({
          title: "Error",
          description: result.error.message || "Failed to update notification preferences",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Success",
          description: "Activity notification preferences updated successfully",
        })
        router.refresh()
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Handle preference toggle
  const handleToggle = (key: keyof NotificationPreferences, value: boolean) => {
    if (!preferences) return

    setPreferences({
      ...preferences,
      [key]: value,
    })
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Activity Notification Settings</CardTitle>
          <CardDescription>Loading your activity notification settings...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Activity Notification Settings</CardTitle>
          <CardDescription className="text-red-500">{error}</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (!preferences) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Activity Notification Settings</CardTitle>
          <CardDescription>No notification preferences found</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Activity Notification Settings
        </CardTitle>
        <CardDescription>Choose which activities you want to be notified about</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CreditCard className="h-4 w-4 text-green-500" />
              <Label htmlFor="transaction-activity" className="flex-1">
                Transaction Activity
                <p className="text-sm text-gray-500">Get notified about deposits, withdrawals, and transfers</p>
              </Label>
            </div>
            <Switch
              id="transaction-activity"
              checked={preferences.transaction_activity}
              onCheckedChange={(checked) => handleToggle("transaction_activity", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CreditCard className="h-4 w-4 text-blue-500" />
              <Label htmlFor="loan-activity" className="flex-1">
                Loan Activity
                <p className="text-sm text-gray-500">Get notified about loan requests, approvals, and repayments</p>
              </Label>
            </div>
            <Switch
              id="loan-activity"
              checked={preferences.loan_activity}
              onCheckedChange={(checked) => handleToggle("loan_activity", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-purple-500" />
              <Label htmlFor="connection-activity" className="flex-1">
                Connection Activity
                <p className="text-sm text-gray-500">Get notified about new followers and connection requests</p>
              </Label>
            </div>
            <Switch
              id="connection-activity"
              checked={preferences.connection_activity}
              onCheckedChange={(checked) => handleToggle("connection_activity", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-4 w-4 text-indigo-500" />
              <Label htmlFor="message-activity" className="flex-1">
                Message Activity
                <p className="text-sm text-gray-500">Get notified about new messages and conversations</p>
              </Label>
            </div>
            <Switch
              id="message-activity"
              checked={preferences.message_activity}
              onCheckedChange={(checked) => handleToggle("message_activity", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-teal-500" />
              <Label htmlFor="verification-activity" className="flex-1">
                Verification Activity
                <p className="text-sm text-gray-500">Get notified about identity and document verification status</p>
              </Label>
            </div>
            <Switch
              id="verification-activity"
              checked={preferences.verification_activity}
              onCheckedChange={(checked) => handleToggle("verification_activity", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Wallet className="h-4 w-4 text-amber-500" />
              <Label htmlFor="account-activity" className="flex-1">
                Account Activity
                <p className="text-sm text-gray-500">Get notified about account changes and updates</p>
              </Label>
            </div>
            <Switch
              id="account-activity"
              checked={preferences.account_activity}
              onCheckedChange={(checked) => handleToggle("account_activity", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <Label htmlFor="system-activity" className="flex-1">
                System Activity
                <p className="text-sm text-gray-500">Get notified about important system announcements and updates</p>
              </Label>
            </div>
            <Switch
              id="system-activity"
              checked={preferences.system_activity}
              onCheckedChange={(checked) => handleToggle("system_activity", checked)}
            />
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex justify-end space-x-2">
        <Button variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={isSaving}>
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </CardFooter>
    </Card>
  )
}
