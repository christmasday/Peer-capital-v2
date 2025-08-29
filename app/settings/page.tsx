"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Eye, EyeOff, Lock, Bell, Shield, Search, User, Globe, Accessibility, MessageSquare, Users, CreditCard, VolumeX, Mail, Smartphone, AlertTriangle, Activity, FileText, Settings, Zap } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

type SettingsSection = "password" | "notifications" | "privacy" | "account" | "accessibility" | "language"

interface NotificationSettings {
  // Delivery methods
  emailNotifications: boolean
  smsNotifications: boolean
  pushNotifications: boolean
  marketingEmails: boolean
  
  // Alert types
  transactionAlerts: boolean
  securityAlerts: boolean
  
  // Activity types
  transactionActivity: boolean
  loanActivity: boolean
  connectionActivity: boolean
  messageActivity: boolean
  verificationActivity: boolean
  accountActivity: boolean
  systemActivity: boolean
  
  // Global mute
  muteAllNotifications: boolean
}

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<SettingsSection>("password")
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [isSavingNotifications, setIsSavingNotifications] = useState(false)
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    smsNotifications: true,
    pushNotifications: true,
    marketingEmails: false,
    transactionAlerts: true,
    securityAlerts: true,
    transactionActivity: true,
    loanActivity: true,
    connectionActivity: true,
    messageActivity: true,
    verificationActivity: true,
    accountActivity: true,
    systemActivity: true,
    muteAllNotifications: false,
  })
  const { toast } = useToast()

  // Load notification settings on component mount
  useEffect(() => {
    loadNotificationSettings()
  }, [])

  const loadNotificationSettings = async () => {
    try {
      const response = await fetch("/api/notifications/settings")
      if (response.ok) {
        const settings = await response.json()
        setNotificationSettings(settings)
      }
    } catch (error) {
      console.error("Failed to load notification settings:", error)
    }
  }

  const handleNotificationToggle = async (setting: keyof NotificationSettings, value: boolean) => {
    const newSettings = { ...notificationSettings, [setting]: value }
    
    // If mute all is enabled, disable all other notifications
    if (setting === "muteAllNotifications" && value) {
      newSettings.emailNotifications = false
      newSettings.smsNotifications = false
      newSettings.pushNotifications = false
      newSettings.marketingEmails = false
      newSettings.transactionAlerts = false
      newSettings.securityAlerts = false
      newSettings.transactionActivity = false
      newSettings.loanActivity = false
      newSettings.connectionActivity = false
      newSettings.messageActivity = false
      newSettings.verificationActivity = false
      newSettings.accountActivity = false
      newSettings.systemActivity = false
    }
    
    // If enabling any notification, disable mute all
    if (setting !== "muteAllNotifications" && value) {
      newSettings.muteAllNotifications = false
    }

    setNotificationSettings(newSettings)
    
    try {
      setIsSavingNotifications(true)
      const response = await fetch("/api/notifications/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newSettings),
      })

      if (response.ok) {
        toast({
          title: "Settings saved",
          description: "Your notification preferences have been updated",
        })
      } else {
        throw new Error("Failed to save settings")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save notification settings",
        variant: "destructive",
      })
      // Revert the change on error
      setNotificationSettings(notificationSettings)
    } finally {
      setIsSavingNotifications(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match",
        variant: "destructive",
      })
      return
    }

    if (passwordForm.newPassword.length < 8) {
      toast({
        title: "Error",
        description: "Password must be at least 8 characters long",
        variant: "destructive",
      })
      return
    }

    setIsChangingPassword(true)
    
    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Password changed successfully",
        })
        setPasswordForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        })
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.message || "Failed to change password",
          variant: "destructive",
        })
      }
    } catch {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsChangingPassword(false)
    }
  }

  const settingsSections = [
    {
      id: "password" as SettingsSection,
      title: "Password",
      icon: Lock,
      description: "Update your password to keep your account secure"
    },
    {
      id: "notifications" as SettingsSection,
      title: "Notifications",
      icon: Bell,
      description: "Choose how you want to receive notifications"
    },
    {
      id: "privacy" as SettingsSection,
      title: "Privacy",
      icon: Shield,
      description: "Control your privacy and data settings"
    },
    {
      id: "account" as SettingsSection,
      title: "Account",
      icon: User,
      description: "Manage your account information"
    },
    {
      id: "accessibility" as SettingsSection,
      title: "Accessibility",
      icon: Accessibility,
      description: "Customize accessibility settings"
    },
    {
      id: "language" as SettingsSection,
      title: "Language & Region",
      icon: Globe,
      description: "Set your language and regional preferences"
    }
  ]

  const renderContent = () => {
    switch (activeSection) {
      case "password":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-2">Change Password</h2>
              <p className="text-muted-foreground">Update your password to keep your account secure</p>
            </div>
            <Card>
              <CardContent className="pt-6">
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div>
                    <Label htmlFor="current-password">Current Password</Label>
                    <div className="relative">
                      <Input
                        id="current-password"
                        type={showCurrentPassword ? "text" : "password"}
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                        placeholder="Enter your current password"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      >
                        {showCurrentPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="new-password">New Password</Label>
                    <div className="relative">
                      <Input
                        id="new-password"
                        type={showNewPassword ? "text" : "password"}
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                        placeholder="Enter your new password"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Password must be at least 8 characters long
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                    <div className="relative">
                      <Input
                        id="confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        placeholder="Confirm your new password"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <Button type="submit" disabled={isChangingPassword}>
                    {isChangingPassword ? "Changing Password..." : "Change Password"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        )
      
      case "notifications":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-2">Notification Settings</h2>
              <p className="text-muted-foreground">Choose how you want to receive notifications</p>
            </div>
            
            <div className="grid gap-6">
              {/* Mute All Notifications */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <VolumeX className="h-5 w-5" />
                    Global Settings
                  </CardTitle>
                  <CardDescription>
                    Control all notifications at once
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                    <div className="flex items-center gap-3">
                      <VolumeX className="h-5 w-5 text-gray-600" />
                      <div>
                        <Label className="text-base font-medium">Mute All Notifications</Label>
                        <p className="text-sm text-gray-600">Turn off all notifications temporarily</p>
                      </div>
                    </div>
                    <Switch
                      checked={notificationSettings.muteAllNotifications}
                      onCheckedChange={(checked) => handleNotificationToggle("muteAllNotifications", checked)}
                      disabled={isSavingNotifications}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Delivery Methods */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Delivery Methods
                  </CardTitle>
                  <CardDescription>
                    Choose how you want to receive notifications
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-blue-600" />
                        <div>
                          <Label className="text-base font-medium">Email Notifications</Label>
                          <p className="text-sm text-gray-600">Receive notifications via email</p>
                        </div>
                      </div>
                      <Switch
                        checked={notificationSettings.emailNotifications}
                        onCheckedChange={(checked) => handleNotificationToggle("emailNotifications", checked)}
                        disabled={notificationSettings.muteAllNotifications || isSavingNotifications}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Smartphone className="h-5 w-5 text-green-600" />
                        <div>
                          <Label className="text-base font-medium">SMS Notifications</Label>
                          <p className="text-sm text-gray-600">Receive notifications via text message</p>
                        </div>
                      </div>
                      <Switch
                        checked={notificationSettings.smsNotifications}
                        onCheckedChange={(checked) => handleNotificationToggle("smsNotifications", checked)}
                        disabled={notificationSettings.muteAllNotifications || isSavingNotifications}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Zap className="h-5 w-5 text-yellow-600" />
                        <div>
                          <Label className="text-base font-medium">Push Notifications</Label>
                          <p className="text-sm text-gray-600">Receive notifications in your browser</p>
                        </div>
                      </div>
                      <Switch
                        checked={notificationSettings.pushNotifications}
                        onCheckedChange={(checked) => handleNotificationToggle("pushNotifications", checked)}
                        disabled={notificationSettings.muteAllNotifications || isSavingNotifications}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-purple-600" />
                        <div>
                          <Label className="text-base font-medium">Marketing Emails</Label>
                          <p className="text-sm text-gray-600">Receive promotional and marketing emails</p>
                        </div>
                      </div>
                      <Switch
                        checked={notificationSettings.marketingEmails}
                        onCheckedChange={(checked) => handleNotificationToggle("marketingEmails", checked)}
                        disabled={notificationSettings.muteAllNotifications || isSavingNotifications}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Alert Types */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Alert Types
                  </CardTitle>
                  <CardDescription>
                    Choose which types of alerts you want to receive
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <CreditCard className="h-5 w-5 text-green-600" />
                        <div>
                          <Label className="text-base font-medium">Transaction Alerts</Label>
                          <p className="text-sm text-gray-600">Get notified about account transactions</p>
                        </div>
                      </div>
                      <Switch
                        checked={notificationSettings.transactionAlerts}
                        onCheckedChange={(checked) => handleNotificationToggle("transactionAlerts", checked)}
                        disabled={notificationSettings.muteAllNotifications || isSavingNotifications}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Shield className="h-5 w-5 text-red-600" />
                        <div>
                          <Label className="text-base font-medium">Security Alerts</Label>
                          <p className="text-sm text-gray-600">Get notified about security-related events</p>
                        </div>
                      </div>
                      <Switch
                        checked={notificationSettings.securityAlerts}
                        onCheckedChange={(checked) => handleNotificationToggle("securityAlerts", checked)}
                        disabled={notificationSettings.muteAllNotifications || isSavingNotifications}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Activity Types */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Activity Notifications
                  </CardTitle>
                  <CardDescription>
                    Choose which activities you want to be notified about
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <CreditCard className="h-5 w-5 text-blue-600" />
                        <div>
                          <Label className="text-base font-medium">Transaction Activity</Label>
                          <p className="text-sm text-gray-600">Get notified about transaction updates</p>
                        </div>
                      </div>
                      <Switch
                        checked={notificationSettings.transactionActivity}
                        onCheckedChange={(checked) => handleNotificationToggle("transactionActivity", checked)}
                        disabled={notificationSettings.muteAllNotifications || isSavingNotifications}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <CreditCard className="h-5 w-5 text-purple-600" />
                        <div>
                          <Label className="text-base font-medium">Loan Activity</Label>
                          <p className="text-sm text-gray-600">Get notified about loan requests and updates</p>
                        </div>
                      </div>
                      <Switch
                        checked={notificationSettings.loanActivity}
                        onCheckedChange={(checked) => handleNotificationToggle("loanActivity", checked)}
                        disabled={notificationSettings.muteAllNotifications || isSavingNotifications}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Users className="h-5 w-5 text-green-600" />
                        <div>
                          <Label className="text-base font-medium">Connection Activity</Label>
                          <p className="text-sm text-gray-600">Get notified when someone follows you</p>
                        </div>
                      </div>
                      <Switch
                        checked={notificationSettings.connectionActivity}
                        onCheckedChange={(checked) => handleNotificationToggle("connectionActivity", checked)}
                        disabled={notificationSettings.muteAllNotifications || isSavingNotifications}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <MessageSquare className="h-5 w-5 text-blue-600" />
                        <div>
                          <Label className="text-base font-medium">Message Activity</Label>
                          <p className="text-sm text-gray-600">Get notified when you receive new messages</p>
                        </div>
                      </div>
                      <Switch
                        checked={notificationSettings.messageActivity}
                        onCheckedChange={(checked) => handleNotificationToggle("messageActivity", checked)}
                        disabled={notificationSettings.muteAllNotifications || isSavingNotifications}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-yellow-600" />
                        <div>
                          <Label className="text-base font-medium">Verification Activity</Label>
                          <p className="text-sm text-gray-600">Get notified about verification status updates</p>
                        </div>
                      </div>
                      <Switch
                        checked={notificationSettings.verificationActivity}
                        onCheckedChange={(checked) => handleNotificationToggle("verificationActivity", checked)}
                        disabled={notificationSettings.muteAllNotifications || isSavingNotifications}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <User className="h-5 w-5 text-indigo-600" />
                        <div>
                          <Label className="text-base font-medium">Account Activity</Label>
                          <p className="text-sm text-gray-600">Get notified about account changes</p>
                        </div>
                      </div>
                      <Switch
                        checked={notificationSettings.accountActivity}
                        onCheckedChange={(checked) => handleNotificationToggle("accountActivity", checked)}
                        disabled={notificationSettings.muteAllNotifications || isSavingNotifications}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Settings className="h-5 w-5 text-gray-600" />
                        <div>
                          <Label className="text-base font-medium">System Activity</Label>
                          <p className="text-sm text-gray-600">Get notified about system updates and maintenance</p>
                        </div>
                      </div>
                      <Switch
                        checked={notificationSettings.systemActivity}
                        onCheckedChange={(checked) => handleNotificationToggle("systemActivity", checked)}
                        disabled={notificationSettings.muteAllNotifications || isSavingNotifications}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {isSavingNotifications && (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-600">Saving settings...</p>
                </div>
              )}
            </div>
          </div>
        )
      
      case "privacy":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-2">Privacy Settings</h2>
              <p className="text-muted-foreground">Control your privacy and data settings</p>
            </div>
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground">
                  Privacy settings will be implemented in a future update.
                </p>
              </CardContent>
            </Card>
          </div>
        )
      
      case "account":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-2">Account Settings</h2>
              <p className="text-muted-foreground">Manage your account information</p>
            </div>
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground">
                  Account settings will be implemented in a future update.
                </p>
              </CardContent>
            </Card>
          </div>
        )
      
      case "accessibility":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-2">Accessibility Settings</h2>
              <p className="text-muted-foreground">Customize accessibility settings</p>
            </div>
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground">
                  Accessibility settings will be implemented in a future update.
                </p>
              </CardContent>
            </Card>
          </div>
        )
      
      case "language":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-2">Language & Region</h2>
              <p className="text-muted-foreground">Set your language and regional preferences</p>
            </div>
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground">
                  Language and region settings will be implemented in a future update.
                </p>
              </CardContent>
            </Card>
          </div>
        )
      
      default:
        return null
    }
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <div className="flex gap-8">
        {/* Left Sidebar */}
        <div className="w-80 flex-shrink-0">
          <div className="sticky top-8">
            <div className="mb-6">
              <h1 className="text-2xl font-bold mb-2">Settings & privacy</h1>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search settings"
                  className="pl-10 bg-gray-50 border-0 focus:bg-white focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <nav className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Account Settings</h3>
                <div className="space-y-1">
                  {settingsSections.map((section) => {
                    const Icon = section.icon
                    return (
                      <button
                        key={section.id}
                        onClick={() => setActiveSection(section.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                          activeSection === section.id
                            ? "bg-blue-50 text-blue-700 font-medium"
                            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                        <div>
                          <div className="font-medium">{section.title}</div>
                          <div className="text-xs text-gray-500">{section.description}</div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            </nav>
          </div>
        </div>

        {/* Right Content Area */}
        <div className="flex-1 min-w-0">
          {renderContent()}
        </div>
      </div>
    </div>
  )
}


