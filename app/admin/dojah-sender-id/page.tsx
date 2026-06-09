"use client"

import { useEffect, useState } from "react"
import { AlertCircle, CheckCircle, RefreshCw, Save, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"

interface SenderIdEntry {
  sender_id?: string
  activated?: boolean
  createdAt?: string
}

export default function DojahSenderIdPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [senderId, setSenderId] = useState("")
  const [currentSenderId, setCurrentSenderId] = useState("")
  const [updatedAt, setUpdatedAt] = useState<string | null>(null)
  const [senderIds, setSenderIds] = useState<SenderIdEntry[]>([])
  const [updatedBy, setUpdatedBy] = useState<{ first_name?: string | null; last_name?: string | null; email?: string | null } | null>(null)
  const { toast } = useToast()

  const fetchSenderIds = async () => {
    try {
      const response = await fetch("/api/admin/dojah-sender-id", { credentials: "include" })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data?.error || "Failed to fetch Dojah sender ID config")
      }

      setCurrentSenderId(data.currentSenderId || "")
      setSenderId(data.currentSenderId || "")
      setUpdatedAt(data.updatedAt || null)
      setUpdatedBy(data.updatedBy || null)
      setSenderIds(Array.isArray(data.senderIds) ? data.senderIds : [])
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch Dojah sender ID config",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchSenderIds()
  }, [])

  const handleSave = async () => {
    if (!senderId.trim()) {
      toast({ title: "Error", description: "Sender ID is required", variant: "destructive" })
      return
    }

    setSaving(true)
    try {
      const response = await fetch("/api/admin/dojah-sender-id", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ senderId: senderId.trim() }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data?.error || "Failed to register sender ID")
      }

      toast({
        title: "Success",
        description: data.message || "Sender ID registration submitted",
      })

      await fetchSenderIds()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to register sender ID",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const formatDate = (value?: string | null) => {
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
          <h1 className="text-3xl font-bold text-slate-900">Dojah Sender ID</h1>
          <p className="text-slate-600 mt-1">Register and manage the approved sender ID used for Dojah OTP delivery.</p>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            setRefreshing(true)
            fetchSenderIds()
          }}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Sender ID Registration
          </CardTitle>
          <CardDescription>
            Dojah only allows sender ID registration in production. Submissions are reviewed by email before activation.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="sender-id">Sender ID</Label>
            <Input
              id="sender-id"
              value={senderId}
              onChange={(event) => setSenderId(event.target.value)}
              placeholder="Peer Capital"
              maxLength={11}
              className="mt-1"
            />
            <p className="text-sm text-slate-500 mt-2">Max 11 characters. This name is shown as the SMS sender for OTP delivery.</p>
          </div>

          <div className="flex gap-3">
            <Button onClick={handleSave} disabled={saving || !senderId.trim() || senderId.trim() === currentSenderId}>
              {saving ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Register Sender ID
                </>
              )}
            </Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 text-sm text-slate-600">
            <div><span className="font-medium text-slate-900">Current sender ID:</span> {currentSenderId || "Not configured"}</div>
            <div><span className="font-medium text-slate-900">Updated:</span> {formatDate(updatedAt)}</div>
            <div><span className="font-medium text-slate-900">Updated by:</span> {updatedBy ? `${updatedBy.first_name || ""} ${updatedBy.last_name || ""}`.trim() || updatedBy.email || "—" : "—"}</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Registered Sender IDs
          </CardTitle>
        </CardHeader>
        <CardContent>
          {senderIds.length === 0 ? (
            <div className="text-slate-500 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              No sender IDs returned from Dojah yet.
            </div>
          ) : (
            <div className="space-y-4">
              {senderIds.map((entry, index) => (
                <div key={`${entry.sender_id || index}`} className="rounded-lg border p-4 flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium text-slate-900">{entry.sender_id || "Unknown sender"}</div>
                    <div className="text-sm text-slate-500">Created: {formatDate(entry.createdAt)}</div>
                  </div>
                  <Badge variant={entry.activated ? "default" : "secondary"}>{entry.activated ? "Activated" : "Pending"}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}