"use client"

import { useEffect, useState } from "react"
import { AlertCircle, CheckCircle, RefreshCw, Save, Webhook } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"

interface DojahSubscription {
  app_id?: string
  endpoint?: string
  environment?: string
  service?: string
  confirmation_status?: string
  date_created?: string
  date_updated?: string
}

const defaultServices = [
  { id: "sms", label: "SMS OTP" },
  { id: "kyc_widget", label: "KYC Widget" },
]

export default function DojahWebhooksPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [webhookUrl, setWebhookUrl] = useState("")
  const [enabled, setEnabled] = useState(true)
  const [selectedServices, setSelectedServices] = useState<string[]>(defaultServices.map((service) => service.id))
  const [subscriptions, setSubscriptions] = useState<DojahSubscription[]>([])
  const { toast } = useToast()

  const fetchSubscriptions = async () => {
    try {
      const response = await fetch("/api/admin/dojah-webhooks", { credentials: "include" })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data?.error || "Failed to fetch Dojah webhook subscriptions")
      }

      setWebhookUrl(data.callbackUrl || "")
      setSubscriptions(Array.isArray(data.subscriptions) ? data.subscriptions : [])
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch Dojah webhook subscriptions",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchSubscriptions()
  }, [])

  const handleSubscribe = async () => {
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
      const response = await fetch("/api/admin/dojah-webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          webhookUrl: webhookUrl.trim(),
          enabled,
          services: selectedServices,
        }),
      })

      const data = await response.json()

      if (!response.ok && response.status !== 207) {
        throw new Error(data?.error || "Failed to subscribe to Dojah webhooks")
      }

      toast({
        title: data.success ? "Success" : "Partial Success",
        description: data.message || "Dojah webhook subscription updated",
      })

      await fetchSubscriptions()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to subscribe to Dojah webhooks",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const toggleService = (serviceId: string) => {
    setSelectedServices((current) =>
      current.includes(serviceId)
        ? current.filter((value) => value !== serviceId)
        : [...current, serviceId]
    )
  }

  const formatDate = (value?: string) => {
    if (!value) return "—"
    return new Date(value).toLocaleString()
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <Skeleton className="h-10 w-64 mb-2" />
            <Skeleton className="h-5 w-96" />
          </div>
          <Skeleton className="h-10 w-24" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-12 w-full mb-4" />
            <Skeleton className="h-10 w-40" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dojah Webhooks</h1>
          <p className="text-slate-600 mt-1">Subscribe the app to Dojah KYC and messaging webhook events.</p>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            setRefreshing(true)
            fetchSubscriptions()
          }}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Webhook className="h-5 w-5" />
            Subscription Setup
          </CardTitle>
          <CardDescription>
            Dojah subscribes per URL and service type. This page configures the callback URL and checks the current subscriptions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="dojah-webhook-url">Callback URL</Label>
            <Input
              id="dojah-webhook-url"
              value={webhookUrl}
              onChange={(event) => setWebhookUrl(event.target.value)}
              placeholder="https://your-domain.com/api/dojah/webhook"
              className="mt-1"
            />
            <p className="text-sm text-slate-500 mt-2">Dojah will POST webhook events to this URL.</p>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <div className="font-medium text-slate-900">Enable subscription</div>
              <div className="text-sm text-slate-500">Disable this if you only want to inspect the current webhook list.</div>
            </div>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>

          <div>
            <div className="font-medium text-slate-900 mb-3">Services</div>
            <div className="grid gap-3 sm:grid-cols-2">
              {defaultServices.map((service) => {
                const checked = selectedServices.includes(service.id)
                return (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() => toggleService(service.id)}
                    className={`flex items-center justify-between rounded-lg border px-4 py-3 text-left transition-colors ${checked ? "border-blue-500 bg-blue-50" : "border-slate-200 bg-white"}`}
                  >
                    <div>
                      <div className="font-medium text-slate-900">{service.label}</div>
                      <div className="text-sm text-slate-500">{service.id}</div>
                    </div>
                    <Badge variant={checked ? "default" : "secondary"}>{checked ? "On" : "Off"}</Badge>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex gap-3">
            <Button onClick={handleSubscribe} disabled={saving || !webhookUrl.trim() || selectedServices.length === 0}>
              {saving ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Subscribe to Dojah
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Current Subscriptions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {subscriptions.length === 0 ? (
            <div className="text-slate-500 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              No webhook subscriptions found for this Dojah app yet.
            </div>
          ) : (
            <div className="space-y-4">
              {subscriptions.map((subscription, index) => (
                <div key={`${subscription.endpoint || subscription.service || index}`} className="rounded-lg border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="font-medium text-slate-900">{subscription.service || "Unknown service"}</div>
                      <div className="text-sm text-slate-500 break-all">{subscription.endpoint}</div>
                    </div>
                    <Badge variant={subscription.confirmation_status === "DELIVERED" ? "default" : "secondary"}>
                      {subscription.confirmation_status || "Unknown"}
                    </Badge>
                  </div>
                  <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                    <div><span className="font-medium text-slate-900">Environment:</span> {subscription.environment || "—"}</div>
                    <div><span className="font-medium text-slate-900">Created:</span> {formatDate(subscription.date_created)}</div>
                    <div><span className="font-medium text-slate-900">Updated:</span> {formatDate(subscription.date_updated)}</div>
                    <div><span className="font-medium text-slate-900">App ID:</span> {subscription.app_id || "—"}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}