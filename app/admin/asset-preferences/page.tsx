"use client"

import { useState, useEffect } from "react"
import { 
  Settings, 
  Save, 
  RefreshCw,
  Search,
  Edit,
  Check,
  X
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"

interface User {
  id: string
  username?: string | null
  first_name: string
  last_name: string
  email: string
  asset_preferences: any
  created_at: string
}

interface AssetPreferences {
  defaultAsset: string
  slippageTolerance: number
  autoApproveTransactions: boolean
  notifications: {
    priceAlerts: boolean
    transactionUpdates: boolean
    marketUpdates: boolean
  }
}

export default function AssetPreferencesManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState("")
  const [editingUser, setEditingUser] = useState<string | null>(null)
  const [preferences, setPreferences] = useState<AssetPreferences>({
    defaultAsset: 'USDC',
    slippageTolerance: 0.5,
    autoApproveTransactions: false,
    notifications: {
      priceAlerts: true,
      transactionUpdates: true,
      marketUpdates: false
    }
  })
  const { toast } = useToast()

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/asset-preferences', {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users)
      } else {
        console.error('Failed to fetch users')
        toast({
          title: "Error",
          description: "Failed to fetch users",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEditUser = (user: User) => {
    setEditingUser(user.id)
    setPreferences(user.asset_preferences || {
      defaultAsset: 'USDC',
      slippageTolerance: 0.5,
      autoApproveTransactions: false,
      notifications: {
        priceAlerts: true,
        transactionUpdates: true,
        marketUpdates: false
      }
    })
  }

  const handleSavePreferences = async () => {
    if (!editingUser) return

    setSaving(true)
    try {
      const response = await fetch('/api/admin/asset-preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: editingUser,
          preferences: preferences
        }),
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        toast({
          title: "Success",
          description: data.message,
        })
        setEditingUser(null)
        fetchUsers()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to save preferences",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error saving preferences:', error)
      toast({
        title: "Error",
        description: "Failed to save preferences",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleCancelEdit = () => {
    setEditingUser(null)
  }

  const filteredUsers = users.filter(user => 
    (user.username || "").toLowerCase().includes(search.toLowerCase()) ||
    user.first_name.toLowerCase().includes(search.toLowerCase()) ||
    user.last_name.toLowerCase().includes(search.toLowerCase()) ||
    user.email.toLowerCase().includes(search.toLowerCase())
  )

  useEffect(() => {
    fetchUsers()
  }, [])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Asset Preferences</h1>
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
          <h1 className="text-3xl font-bold text-gray-900">Asset Preferences</h1>
          <p className="text-gray-600 mt-1">Manage user asset preferences and trading settings</p>
        </div>
        <Button 
          onClick={fetchUsers}
          variant="outline"
          size="sm"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search users by name or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="h-5 w-5 mr-2" />
            Users ({filteredUsers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredUsers.length === 0 ? (
            <div className="text-center py-8">
              <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
              <p className="text-gray-500">Try adjusting your search criteria</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="font-medium text-gray-900">
                        {user.username ? `@${user.username}` : `${user.first_name} ${user.last_name}`}
                      </div>
                      {user.asset_preferences ? (
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          Configured
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                          Default
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 mb-1">{user.email}</div>
                    <div className="text-xs text-gray-500">
                      Joined {formatDate(user.created_at)}
                    </div>
                    {user.asset_preferences && (
                      <div className="mt-2 text-sm text-gray-600">
                        <span className="font-medium">Default Asset:</span> {user.asset_preferences.defaultAsset || 'USDC'} | 
                        <span className="font-medium ml-2">Slippage:</span> {user.asset_preferences.slippageTolerance || 0.5}%
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {editingUser === user.id ? (
                      <>
                        <Button
                          onClick={handleSavePreferences}
                          disabled={saving}
                          size="sm"
                        >
                          {saving ? (
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Check className="h-4 w-4 mr-2" />
                          )}
                          Save
                        </Button>
                        <Button
                          onClick={handleCancelEdit}
                          variant="outline"
                          size="sm"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <Button
                        onClick={() => handleEditUser(user)}
                        variant="outline"
                        size="sm"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Modal */}
      {editingUser && (
        <Card>
          <CardHeader>
            <CardTitle>Edit Asset Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="default-asset">Default Asset</Label>
              <Select value={preferences.defaultAsset} onValueChange={(value) => setPreferences(prev => ({ ...prev, defaultAsset: value }))}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USDC">USDC</SelectItem>
                  <SelectItem value="USDT">USDT</SelectItem>
                  <SelectItem value="NGN">NGN</SelectItem>
                  <SelectItem value="BTC">BTC</SelectItem>
                  <SelectItem value="ETH">ETH</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="slippage">Slippage Tolerance (%)</Label>
              <Input
                id="slippage"
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={preferences.slippageTolerance}
                onChange={(e) => setPreferences(prev => ({ ...prev, slippageTolerance: parseFloat(e.target.value) || 0 }))}
                className="mt-1"
              />
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Notifications</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="price-alerts">Price Alerts</Label>
                  <input
                    id="price-alerts"
                    type="checkbox"
                    checked={preferences.notifications.priceAlerts}
                    onChange={(e) => setPreferences(prev => ({
                      ...prev,
                      notifications: { ...prev.notifications, priceAlerts: e.target.checked }
                    }))}
                    className="rounded"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="transaction-updates">Transaction Updates</Label>
                  <input
                    id="transaction-updates"
                    type="checkbox"
                    checked={preferences.notifications.transactionUpdates}
                    onChange={(e) => setPreferences(prev => ({
                      ...prev,
                      notifications: { ...prev.notifications, transactionUpdates: e.target.checked }
                    }))}
                    className="rounded"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="market-updates">Market Updates</Label>
                  <input
                    id="market-updates"
                    type="checkbox"
                    checked={preferences.notifications.marketUpdates}
                    onChange={(e) => setPreferences(prev => ({
                      ...prev,
                      notifications: { ...prev.notifications, marketUpdates: e.target.checked }
                    }))}
                    className="rounded"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
