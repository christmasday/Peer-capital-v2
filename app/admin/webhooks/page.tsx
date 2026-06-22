"use client"

import { useState, useEffect } from "react"
import { 
  Webhook, 
  Save, 
  RefreshCw,
  TestTube,
  AlertCircle,
  CheckCircle,
  ExternalLink
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
  webhookUrl: string
  enabled: boolean
  lastVerifiedAt?: string
  updatedAt?: string
}

export default function WebhookConfiguration() {
  const [webhookConfig, setWebhookConfig] = useState<WebhookConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [webhookUrl, setWebhookUrl] = useState("")
  const [webhookEnabled, setWebhookEnabled] = useState(true)
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
          setWebhookUrl(data.webhookConfig.webhookUrl)
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
    if (!webhookUrl.trim()) {
      toast({
        title: "Error",
        description: "Webhook URL is required",
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  useEffect(() => {
    fetchWebhookConfig()
  }, [])

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 space-y-6">
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
    <div className="max-w-4xl mx-auto px-4 space-y-6">
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
              The URL where Stablesrail webhook events will be sent
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
              disabled={saving || !webhookUrl.trim()}
            >
              {saving ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Set Webhook URL
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
                  {webhookConfig.updatedAt && `Last updated ${formatDate(webhookConfig.updatedAt)}`}
                </div>
              </div>
              
              <div>
                <div className="font-medium text-gray-900 mb-1">Webhook URL</div>
                <div className="font-mono text-sm text-gray-600 break-all">
                  {webhookConfig.webhookUrl}
                </div>
              </div>

              {webhookConfig.lastVerifiedAt && (
                <div>
                  <div className="font-medium text-gray-900 mb-1">Last Verified</div>
                  <div className="text-sm text-gray-600">
                    {formatDate(webhookConfig.lastVerifiedAt)}
                  </div>
                </div>
              )}
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
              <h4 className="font-medium text-gray-900">Supported Stablesrail Events:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• <code className="bg-gray-100 px-1 rounded">virtual.account.created</code> - Virtual account creation</li>
                <li>• <code className="bg-gray-100 px-1 rounded">payments.confirmed</code> - Payment confirmation</li>
                <li>• <code className="bg-gray-100 px-1 rounded">wallet.funding.completed</code> - Wallet funding completion</li>
                <li>• <code className="bg-gray-100 px-1 rounded">swap.completed</code> - Successful token swap</li>
                <li>• <code className="bg-gray-100 px-1 rounded">swap.failed</code> - Failed token swap</li>
                <li>• <code className="bg-gray-100 px-1 rounded">fintech.virtual_account.deposit.received</code> - Virtual account deposit received</li>
                <li>• <code className="bg-gray-100 px-1 rounded">fintech.user.deposit.received</code> - User deposit received</li>
                <li>• <code className="bg-gray-100 px-1 rounded">fintech.user.deposit.funding.completed</code> - User deposit funding completed</li>
                <li>• <code className="bg-gray-100 px-1 rounded">fintech.user.deposit.refunded</code> - User deposit refunded</li>
                <li>• <code className="bg-gray-100 px-1 rounded">fintech.asset.transfer.completed</code> - Asset transfer completed</li>
                <li>• <code className="bg-gray-100 px-1 rounded">fintech.asset.transfer.failed</code> - Asset transfer failed</li>
                <li>• <code className="bg-gray-100 px-1 rounded">fintech.user.asset.transfer.completed</code> - User asset transfer completed</li>
                <li>• <code className="bg-gray-100 px-1 rounded">fintech.user.asset.transfer.failed</code> - User asset transfer failed</li>
                <li>• <code className="bg-gray-100 px-1 rounded">fintech.offramp.initiated</code> - Offramp initiated</li>
                <li>• <code className="bg-gray-100 px-1 rounded">fintech.offramp.transfer.completed</code> - Offramp transfer completed</li>
                <li>• <code className="bg-gray-100 px-1 rounded">fintech.offramp.payout.initiated</code> - Offramp payout initiated</li>
                <li>• <code className="bg-gray-100 px-1 rounded">fintech.offramp.completed</code> - Offramp completed</li>
                <li>• <code className="bg-gray-100 px-1 rounded">fintech.offramp.failed</code> - Offramp failed</li>
              </ul>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-600">
              <ExternalLink className="h-4 w-4" />
              <span>Webhook endpoint: <code className="bg-gray-100 px-1 rounded">/api/sr/webhook</code></span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}