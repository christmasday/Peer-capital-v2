"use client"

import { useState, useEffect } from "react"
import { 
  Webhook, 
  Save, 
  RefreshCw,
  TestTube,
  AlertCircle,
  CheckCircle,
  ExternalLink,
  Eye,
  EyeOff
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"

interface WebhookConfig {
  id: string
  webhook_url: string
  secret: string
  enabled: boolean
  created_at: string
  updated_at: string
  created_by: string
  profiles: {
    first_name: string
    last_name: string
    email: string
  }
}

export default function WebhookConfiguration() {
  const [webhookConfig, setWebhookConfig] = useState<WebhookConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [webhookUrl, setWebhookUrl] = useState("")
  const [webhookSecret, setWebhookSecret] = useState("")
  const [webhookEnabled, setWebhookEnabled] = useState(true)
  const [showSecret, setShowSecret] = useState(false)
  const { toast } = useToast()

  const fetchWebhookConfig = async () => {
    try {
      const response = await fetch('/api/admin/webhook-config', {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setWebhookConfig(data.webhookConfig)
        if (data.webhookConfig) {
          setWebhookUrl(data.webhookConfig.webhook_url)
          setWebhookSecret(data.webhookConfig.secret)
          setWebhookEnabled(data.webhookConfig.enabled)
        }
      } else {
        console.error('Failed to fetch webhook config')
        toast({
          title: "Error",
          description: "Failed to fetch webhook configuration",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error fetching webhook config:', error)
      toast({
        title: "Error",
        description: "Failed to fetch webhook configuration",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveConfig = async () => {
    if (!webhookUrl.trim() || !webhookSecret.trim()) {
      toast({
        title: "Error",
        description: "Webhook URL and secret are required",
        variant: "destructive",
      })
      return
    }

    setSaving(true)
    try {
      const response = await fetch('/api/admin/webhook-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          webhookUrl: webhookUrl.trim(),
          secret: webhookSecret.trim(),
          enabled: webhookEnabled
        }),
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        toast({
          title: "Success",
          description: data.message,
        })
        fetchWebhookConfig()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to save webhook configuration",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error saving webhook config:', error)
      toast({
        title: "Error",
        description: "Failed to save webhook configuration",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleTestWebhook = async () => {
    if (!webhookUrl.trim()) {
      toast({
        title: "Error",
        description: "Please configure webhook URL first",
        variant: "destructive",
      })
      return
    }

    setTesting(true)
    try {
      // Send a test webhook event
      const testEvent = {
        event: "webhook.test",
        timestamp: new Date().toISOString(),
        data: {
          message: "This is a test webhook event",
          test: true
        }
      }

      const response = await fetch('/api/admin/webhook-config/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: testEvent }),
        credentials: 'include'
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Test webhook sent successfully",
        })
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to send test webhook",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error testing webhook:', error)
      toast({
        title: "Error",
        description: "Failed to send test webhook",
        variant: "destructive",
      })
    } finally {
      setTesting(false)
    }
  }

  const generateSecret = () => {
    const secret = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
    setWebhookSecret(secret)
  }

  useEffect(() => {
    fetchWebhookConfig()
  }, [])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Webhook Configuration</h1>
          <Skeleton className="h-10 w-24" />
        </div>
        
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-6 w-32" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Webhook Configuration</h1>
          <p className="text-gray-600 mt-1">Configure webhook URLs and settings for receiving real-time notifications</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={handleTestWebhook}
            disabled={testing || !webhookUrl.trim()}
            variant="outline"
            size="sm"
          >
            <TestTube className={`h-4 w-4 mr-2 ${testing ? 'animate-spin' : ''}`} />
            Test Webhook
          </Button>
          <Button 
            onClick={fetchWebhookConfig}
            variant="outline"
            size="sm"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Configuration Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Webhook className="h-5 w-5 mr-2" />
            Webhook Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="webhook-url">Webhook URL</Label>
            <Input
              id="webhook-url"
              placeholder="https://your-domain.com/webhook"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              className="mt-1"
            />
            <p className="text-sm text-gray-500 mt-1">
              The URL where webhook events will be sent
            </p>
          </div>

          <div>
            <Label htmlFor="webhook-secret">Webhook Secret</Label>
            <div className="flex gap-2 mt-1">
              <div className="flex-1 relative">
                <Input
                  id="webhook-secret"
                  type={showSecret ? "text" : "password"}
                  placeholder="your_webhook_secret_key"
                  value={webhookSecret}
                  onChange={(e) => setWebhookSecret(e.target.value)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                  onClick={() => setShowSecret(!showSecret)}
                >
                  {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={generateSecret}
              >
                Generate
              </Button>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Secret key for webhook signature verification
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="webhook-enabled">Enable Webhooks</Label>
              <p className="text-sm text-gray-500">
                Enable or disable webhook event delivery
              </p>
            </div>
            <Switch
              id="webhook-enabled"
              checked={webhookEnabled}
              onCheckedChange={setWebhookEnabled}
            />
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={handleSaveConfig}
              disabled={saving || !webhookUrl.trim() || !webhookSecret.trim()}
            >
              {saving ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Configuration
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Current Configuration */}
      {webhookConfig && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
              Current Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">Status</div>
                  <Badge variant={webhookConfig.enabled ? "default" : "secondary"}>
                    {webhookConfig.enabled ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
                <div className="text-sm text-gray-500">
                  Last updated {formatDate(webhookConfig.updated_at)}
                </div>
              </div>
              
              <div>
                <div className="font-medium text-gray-900 mb-1">Webhook URL</div>
                <div className="font-mono text-sm text-gray-600 break-all">
                  {webhookConfig.webhook_url}
                </div>
              </div>

              <div>
                <div className="font-medium text-gray-900 mb-1">Secret</div>
                <div className="font-mono text-sm text-gray-600">
                  {webhookConfig.secret.substring(0, 8)}...{webhookConfig.secret.substring(webhookConfig.secret.length - 8)}
                </div>
              </div>

              <div>
                <div className="font-medium text-gray-900 mb-1">Created by</div>
                <div className="text-sm text-gray-600">
                  {webhookConfig.profiles.first_name} {webhookConfig.profiles.last_name} ({webhookConfig.profiles.email})
                </div>
                <div className="text-xs text-gray-500">
                  Created {formatDate(webhookConfig.created_at)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Webhook Events Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertCircle className="h-5 w-5 mr-2 text-blue-500" />
            Webhook Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Your webhook endpoint will receive POST requests with the following structure:
            </p>
            
            <div className="bg-gray-100 p-4 rounded-lg">
              <pre className="text-sm text-gray-800">
{`{
  "event": "event.type",
  "timestamp": "2025-01-XX...",
  "data": {
    // Event-specific data
  }
}`}
              </pre>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">Supported Events:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• <code className="bg-gray-100 px-1 rounded">user.created</code> - New user registration</li>
                <li>• <code className="bg-gray-100 px-1 rounded">user.updated</code> - User profile updates</li>
                <li>• <code className="bg-gray-100 px-1 rounded">transaction.created</code> - New transaction</li>
                <li>• <code className="bg-gray-100 px-1 rounded">transaction.updated</code> - Transaction status changes</li>
                <li>• <code className="bg-gray-100 px-1 rounded">webhook.test</code> - Test event</li>
              </ul>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-600">
              <ExternalLink className="h-4 w-4" />
              <span>Webhook endpoint: <code className="bg-gray-100 px-1 rounded">/api/webhook</code></span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}