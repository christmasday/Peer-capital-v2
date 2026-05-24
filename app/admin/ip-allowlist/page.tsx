"use client"

import { useState, useEffect } from "react"
import { 
  Globe, 
  Plus, 
  Trash2, 
  RefreshCw,
  AlertCircle,
  Clock
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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

interface IPAddress {
  id: string
  ip_address: string
  description: string
  created_at: string
  updated_at: string
  created_by: string
  profiles: {
    username?: string | null
    first_name: string
    last_name: string
    email: string
  }
}

export default function IPAllowlistManagement() {
  const [ipAddresses, setIpAddresses] = useState<IPAddress[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [newIpAddress, setNewIpAddress] = useState("")
  const [newDescription, setNewDescription] = useState("")
  const [adding, setAdding] = useState(false)
  const { toast } = useToast()

  const fetchIPAddresses = async () => {
    try {
      const response = await fetch('/api/admin/ip-allowlist', {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setIpAddresses(data.ipAddresses)
      } else {
        console.error('Failed to fetch IP addresses')
        toast({
          title: "Error",
          description: "Failed to fetch IP addresses",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error fetching IP addresses:', error)
      toast({
        title: "Error",
        description: "Failed to fetch IP addresses",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleAddIP = async () => {
    if (!newIpAddress.trim()) {
      toast({
        title: "Error",
        description: "IP address is required",
        variant: "destructive",
      })
      return
    }

    setAdding(true)
    try {
      const response = await fetch('/api/admin/ip-allowlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ipAddress: newIpAddress.trim(),
          description: newDescription.trim()
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
        setNewIpAddress("")
        setNewDescription("")
        fetchIPAddresses()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to add IP address",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error adding IP address:', error)
      toast({
        title: "Error",
        description: "Failed to add IP address",
        variant: "destructive",
      })
    } finally {
      setAdding(false)
    }
  }

  const handleRemoveIP = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/ip-allowlist?id=${id}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        toast({
          title: "Success",
          description: data.message,
        })
        fetchIPAddresses()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to remove IP address",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error removing IP address:', error)
      toast({
        title: "Error",
        description: "Failed to remove IP address",
        variant: "destructive",
      })
    }
  }

  const handleRefresh = () => {
    setRefreshing(true)
    fetchIPAddresses()
  }

  useEffect(() => {
    fetchIPAddresses()
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
          <h1 className="text-3xl font-bold text-gray-900">IP Allowlist Management</h1>
          <Skeleton className="h-10 w-24" />
        </div>
        
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
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
          <h1 className="text-3xl font-bold text-gray-900">IP Allowlist Management</h1>
          <p className="text-gray-600 mt-1">Manage IP addresses allowed to access API endpoints</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add IP Address
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add IP Address</DialogTitle>
                <DialogDescription>
                  Add a new IP address to the allowlist. Newly whitelisted IP addresses may take up to 5 minutes to become active.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="ip-address">IP Address</Label>
                  <Input
                    id="ip-address"
                    placeholder="192.168.1.100"
                    value={newIpAddress}
                    onChange={(e) => setNewIpAddress(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Office network IP"
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddIP} disabled={adding}>
                  {adding ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    'Add IP Address'
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

      {/* Info Alert */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-blue-800">Propagation Delay</h3>
              <p className="text-sm text-blue-700 mt-1">
                Newly whitelisted IP addresses may take up to <strong>5 minutes</strong> to become active across all systems. 
                Please allow for this propagation delay before testing access.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* IP Addresses List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Globe className="h-5 w-5 mr-2" />
            Allowed IP Addresses ({ipAddresses.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {ipAddresses.length === 0 ? (
            <div className="text-center py-8">
              <Globe className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No IP addresses configured</h3>
              <p className="text-gray-500 mb-4">Add IP addresses to restrict API access</p>
              <Button onClick={() => setAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First IP Address
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {ipAddresses.map((ip) => (
                <div key={ip.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="font-mono text-lg font-semibold text-gray-900">
                        {ip.ip_address}
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <Clock className="h-4 w-4 mr-1" />
                        Added {formatDate(ip.created_at)}
                      </div>
                    </div>
                    {ip.description && (
                      <p className="text-sm text-gray-600 mt-1">{ip.description}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Added by {ip.profiles.username ? `@${ip.profiles.username}` : `${ip.profiles.first_name} ${ip.profiles.last_name}`} ({ip.profiles.email})
                    </p>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remove IP Address</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to remove <strong>{ip.ip_address}</strong> from the allowlist? 
                          This action cannot be undone and will immediately revoke access for this IP address.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => handleRemoveIP(ip.id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Remove IP Address
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
