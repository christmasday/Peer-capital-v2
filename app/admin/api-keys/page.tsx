"use client"

import { useState, useEffect } from "react"
import { 
  Key, 
  Plus, 
  Copy, 
  RotateCcw, 
  Trash2, 
  RefreshCw,
  Eye,
  EyeOff,
  Check,
  AlertCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"

interface APIKey {
  id: string
  key_preview: string
  name: string
  description: string
  created_at: string
  last_rotated_at: string | null
  expires_at: string | null
  is_active: boolean
  created_by: string
  profiles: {
    username?: string | null
    first_name: string
    last_name: string
    email: string
  }
}

export default function APIKeyManagement() {
  const [apiKeys, setApiKeys] = useState<APIKey[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [newKeyName, setNewKeyName] = useState("")
  const [newKeyDescription, setNewKeyDescription] = useState("")
  const [adding, setAdding] = useState(false)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [showFullKey, setShowFullKey] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchAPIKeys = async () => {
    try {
      const response = await fetch('/api/admin/api-keys', {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setApiKeys(data.apiKeys)
      } else {
        console.error('Failed to fetch API keys')
        toast({
          title: "Error",
          description: "Failed to fetch API keys",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error fetching API keys:', error)
      toast({
        title: "Error",
        description: "Failed to fetch API keys",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleCreateKey = async () => {
    if (!newKeyName.trim()) {
      toast({
        title: "Error",
        description: "Key name is required",
        variant: "destructive",
      })
      return
    }

    setAdding(true)
    try {
      const response = await fetch('/api/admin/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newKeyName.trim(),
          description: newKeyDescription.trim()
        }),
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        toast({
          title: "Success",
          description: data.message,
        })
        setAddDialogOpen(false)
        setNewKeyName("")
        setNewKeyDescription("")
        fetchAPIKeys()
        
        // Show the full key in a modal
        if (data.fullKey) {
          setShowFullKey(data.fullKey)
        }
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to create API key",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error creating API key:', error)
      toast({
        title: "Error",
        description: "Failed to create API key",
        variant: "destructive",
      })
    } finally {
      setAdding(false)
    }
  }

  const handleKeyAction = async (id: string, action: string) => {
    try {
      const response = await fetch('/api/admin/api-keys', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action }),
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        toast({
          title: "Success",
          description: data.message,
        })
        fetchAPIKeys()
        
        // Show the full key for regeneration
        if (action === 'regenerate' && data.fullKey) {
          setShowFullKey(data.fullKey)
        }
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to update API key",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error updating API key:', error)
      toast({
        title: "Error",
        description: "Failed to update API key",
        variant: "destructive",
      })
    }
  }

  const handleDeleteKey = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/api-keys?id=${id}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        toast({
          title: "Success",
          description: data.message,
        })
        fetchAPIKeys()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to delete API key",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error deleting API key:', error)
      toast({
        title: "Error",
        description: "Failed to delete API key",
        variant: "destructive",
      })
    }
  }

  const handleCopyKey = async (key: string) => {
    try {
      await navigator.clipboard.writeText(key)
      setCopiedKey(key)
      toast({
        title: "Copied",
        description: "API key copied to clipboard",
      })
      setTimeout(() => setCopiedKey(null), 2000)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy API key",
        variant: "destructive",
      })
    }
  }

  const handleRefresh = () => {
    setRefreshing(true)
    fetchAPIKeys()
  }

  useEffect(() => {
    fetchAPIKeys()
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
          <h1 className="text-3xl font-bold text-gray-900">API Key Management</h1>
          <Skeleton className="h-10 w-24" />
        </div>
        
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
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
          <h1 className="text-3xl font-bold text-gray-900">API Key Management</h1>
          <p className="text-gray-600 mt-1">Generate and manage API keys for system access</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Generate Key
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Generate New API Key</DialogTitle>
                <DialogDescription>
                  Create a new API key for system access. The key will be shown only once.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="key-name">Key Name</Label>
                  <Input
                    id="key-name"
                    placeholder="Production API Key"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="key-description">Description (Optional)</Label>
                  <Textarea
                    id="key-description"
                    placeholder="API key for production environment"
                    value={newKeyDescription}
                    onChange={(e) => setNewKeyDescription(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateKey} disabled={adding}>
                  {adding ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    'Generate Key'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button 
            onClick={handleRefresh} 
            disabled={refreshing}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* API Keys List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Key className="h-5 w-5 mr-2" />
            API Keys ({apiKeys.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {apiKeys.length === 0 ? (
            <div className="text-center py-8">
              <Key className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No API keys configured</h3>
              <p className="text-gray-500 mb-4">Generate your first API key to get started</p>
              <Button onClick={() => setAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Generate First Key
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {apiKeys.map((key) => (
                <div key={key.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="font-medium text-gray-900">{key.name}</div>
                      <Badge variant={key.is_active ? "default" : "secondary"}>
                        {key.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div className="font-mono text-sm text-gray-600 mb-1">
                      {key.key_preview}
                    </div>
                    {key.description && (
                      <p className="text-sm text-gray-500 mb-1">{key.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>Created {formatDate(key.created_at)}</span>
                      {key.last_rotated_at && (
                        <span>Rotated {formatDate(key.last_rotated_at)}</span>
                      )}
                      <span>by {key.profiles.username ? `@${key.profiles.username}` : `${key.profiles.first_name} ${key.profiles.last_name}`}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleKeyAction(key.id, key.is_active ? 'deactivate' : 'activate')}
                    >
                      {key.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      {key.is_active ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleKeyAction(key.id, 'regenerate')}
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Regenerate
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete API Key</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete <strong>{key.name}</strong>? 
                            This action cannot be undone and will immediately revoke access for this key.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handleDeleteKey(key.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete Key
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Full Key Display Modal */}
      {showFullKey && (
        <Dialog open={!!showFullKey} onOpenChange={() => setShowFullKey(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <AlertCircle className="h-5 w-5 mr-2 text-yellow-500" />
                Important: Save Your API Key
              </DialogTitle>
              <DialogDescription>
                This is the only time you'll see the full API key. Make sure to copy and save it securely.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-4 bg-gray-100 rounded-lg">
                <div className="font-mono text-sm break-all">
                  {showFullKey}
                </div>
              </div>
              <Button
                onClick={() => handleCopyKey(showFullKey)}
                className="w-full"
              >
                {copiedKey === showFullKey ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy to Clipboard
                  </>
                )}
              </Button>
            </div>
            <DialogFooter>
              <Button onClick={() => setShowFullKey(null)}>
                I've Saved the Key
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
