"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Bell, Mail, MessageSquare, Shield, CreditCard } from "lucide-react"
import {
  getNotificationPreferences,
  updateNotificationPreferences,
  type NotificationPreferences,
} from "@/lib/actions/notifications"
import { toast } from "@/hooks/use-toast"

export function NotificationPreferencesForm() {
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
          setError(result.error)
        } else if (result.preferences) {
          setPreferences(result.preferences)
        }
      } catch (err) {
        setError("Failed to load notification preferences")
        console.error(err)
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
          description: result.error,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Success",
          description: "Notification preferences updated successfully",
        })
        router.refresh()
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
      console.error(err)
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
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>Loading your notification preferences...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription className="text-red-500">{error}</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (!preferences) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
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
          Notification Preferences
        </CardTitle>
        <CardDescription>Manage how you receive notifications from Peer Capital</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Notification Channels</h3>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Mail className="h-4 w-4 text-gray-500" />
              <Label htmlFor="email-notifications" className="flex-1">
                Email Notifications
                <p className="text-sm text-gray-500">Receive notifications via email</p>
              </Label>
            </div>
            <Switch
              id="email-notifications"
              checked={preferences.email_notifications}
              onCheckedChange={(checked) => handleToggle("email_notifications", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-4 w-4 text-gray-500" />
              <Label htmlFor="sms-notifications" className="flex-1">
                SMS Notifications
                <p className="text-sm text-gray-500">Receive notifications via SMS</p>
              </Label>
            </div>
            <Switch
              id="sms-notifications"
              checked={preferences.sms_notifications}
              onCheckedChange={(checked) => handleToggle("sms_notifications", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bell className="h-4 w-4 text-gray-500" />
              <Label htmlFor="push-notifications" className="flex-1">
                Push Notifications
                <p className="text-sm text-gray-500">Receive push notifications on your device</p>
              </Label>
            </div>
            <Switch
              id="push-notifications"
              checked={preferences.push_notifications}
              onCheckedChange={(checked) => handleToggle("push_notifications", checked)}
            />
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Notification Types</h3>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Mail className="h-4 w-4 text-gray-500" />
              <Label htmlFor="marketing-emails" className="flex-1">
                Marketing Emails
                <p className="text-sm text-gray-500">Receive promotional emails and offers</p>
              </Label>
            </div>
            <Switch
              id="marketing-emails"
              checked={preferences.marketing_emails}
              onCheckedChange={(checked) => handleToggle("marketing_emails", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CreditCard className="h-4 w-4 text-gray-500" />
              <Label htmlFor="transaction-alerts" className="flex-1">
                Transaction Alerts
                <p className="text-sm text-gray-500">Get notified about account transactions</p>
              </Label>
            </div>
            <Switch
              id="transaction-alerts"
              checked={preferences.transaction_alerts}
              onCheckedChange={(checked) => handleToggle("transaction_alerts", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Shield className="h-4 w-4 text-gray-500" />
              <Label htmlFor="security-alerts" className="flex-1">
                Security Alerts
                <p className="text-sm text-gray-500">Get notified about security events</p>
              </Label>
            </div>
            <Switch
              id="security-alerts"
              checked={preferences.security_alerts}
              onCheckedChange={(checked) => handleToggle("security_alerts", checked)}
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
