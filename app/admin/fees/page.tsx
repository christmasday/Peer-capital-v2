"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

export default function AdminFeesPage() {
  const { toast } = useToast()
  const [lenderFee, setLenderFee] = useState("")
  const [borrowerFee, setBorrowerFee] = useState("")
  const [lenderInterestRateMin, setLenderInterestRateMin] = useState("5")
  const [lenderInterestRateMax, setLenderInterestRateMax] = useState("20")
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [onrampPercentage, setOnrampPercentage] = useState("")
  const [onrampCap, setOnrampCap] = useState("")
  const [onrampEnabled, setOnrampEnabled] = useState(true)
  const [offrampPercentage, setOfframpPercentage] = useState("")
  const [offrampCap, setOfframpCap] = useState("")
  const [offrampEnabled, setOfframpEnabled] = useState(true)
  const [savingStablesrail, setSavingStablesrail] = useState(false)
  const [adminWalletAddress, setAdminWalletAddress] = useState("")
  const [savingWallet, setSavingWallet] = useState(false)

  useEffect(() => {
    fetchFees()
    fetchStablesrailFees()
    fetchAdminWalletAddress()
  }, [])

  const fetchFees = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/fees', {
        credentials: 'include'
      })
      const data = await res.json()
      
      if (data.success) {
        setLenderFee(data.fees.lender_fee.toString())
        setBorrowerFee(data.fees.borrower_fee.toString())
        setLenderInterestRateMin(data.lender_interest_rate_limits?.min_pct?.toString() || "5")
        setLenderInterestRateMax(data.lender_interest_rate_limits?.max_pct?.toString() || "20")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch fees",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchStablesrailFees = async () => {
    try {
      const res = await fetch('/api/sr/manage-fees', {
        credentials: 'include'
      })
      const data = await res.json()
      
      console.log('🔵 [Admin Fees] Full response:', JSON.stringify(data, null, 2))
      
      // The API returns: { success: true, fees: { feeConfiguration: {...} } }
      // where fees is the data object from Stablesrail
      const config = data.fees?.feeConfiguration || data.fees?.data?.feeConfiguration
      
      if (data.success && config) {
        console.log('🔵 [Admin Fees] Fee configuration found:', config)
        
        // Handle onramp fee
        if (config.onrampFee) {
          setOnrampPercentage(config.onrampFee.percentageFee?.toString() || "0")
          setOnrampCap(config.onrampFee.capFee?.toString() || "0")
          setOnrampEnabled(config.onrampFee.enabled !== false)
        } else {
          // Set default values if no onramp fee is configured
          setOnrampPercentage("0")
          setOnrampCap("500")
          setOnrampEnabled(true)
        }
        
        // Handle offramp fee
        if (config.offrampFee) {
          setOfframpPercentage(config.offrampFee.percentageFee?.toString() || "0")
          setOfframpCap(config.offrampFee.capFee?.toString() || "0")
          setOfframpEnabled(config.offrampFee.enabled !== false)
        } else {
          // Set default values if no offramp fee is configured
          setOfframpPercentage("2.0")
          setOfframpCap("500")
          setOfframpEnabled(true)
        }
      } else if (data.success === false) {
        // No fee configuration found, clear fields to show no configuration
        console.log("🔴 [Admin Fees] No fee configuration found in Stablesrail")
        setOnrampPercentage("")
        setOnrampCap("")
        setOnrampEnabled(true)
        setOfframpPercentage("")
        setOfframpCap("")
        setOfframpEnabled(true)
      } else {
        console.error("🔴 [Admin Fees] Unexpected response format:", data)
        // Try to extract anyway
        if (config) {
          if (config.onrampFee) {
            setOnrampPercentage(config.onrampFee.percentageFee?.toString() || "0")
            setOnrampCap(config.onrampFee.capFee?.toString() || "0")
            setOnrampEnabled(config.onrampFee.enabled !== false)
          }
          if (config.offrampFee) {
            setOfframpPercentage(config.offrampFee.percentageFee?.toString() || "0")
            setOfframpCap(config.offrampFee.capFee?.toString() || "0")
            setOfframpEnabled(config.offrampFee.enabled !== false)
          }
        }
      }
    } catch (error) {
      console.error("🔴 [Admin Fees] Failed to fetch Stablesrail fees:", error)
      // Clear fields on error to indicate no configuration
      setOnrampPercentage("")
      setOnrampCap("")
      setOnrampEnabled(true)
      setOfframpPercentage("")
      setOfframpCap("")
      setOfframpEnabled(true)
    }
  }

  const fetchAdminWalletAddress = async () => {
    try {
      const res = await fetch('/api/admin/wallet-address', {
        credentials: 'include'
      })
      const data = await res.json()
      
      if (data.success && data.walletAddress) {
        setAdminWalletAddress(data.walletAddress)
      }
    } catch (error) {
      console.error("Failed to fetch admin wallet address:", error)
    }
  }

  const handleSaveWalletAddress = async () => {
    // Basic validation - wallet address should be a valid Ethereum-style address (0x followed by 40 hex chars)
    const walletAddressTrimmed = adminWalletAddress.trim()
    
    if (!walletAddressTrimmed) {
      toast({
        title: "Invalid Wallet Address",
        description: "Wallet address cannot be empty",
        variant: "destructive"
      })
      return
    }

    // Basic format validation (0x followed by 40 hex characters)
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddressTrimmed)) {
      toast({
        title: "Invalid Wallet Address",
        description: "Wallet address must be a valid Ethereum-style address (0x followed by 40 hexadecimal characters)",
        variant: "destructive"
      })
      return
    }

    setSavingWallet(true)
    try {
      const res = await fetch('/api/admin/wallet-address', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          walletAddress: walletAddressTrimmed
        })
      })
      
      const data = await res.json()
      
      if (data.success) {
        toast({
          title: "Success",
          description: "Admin wallet address updated successfully"
        })
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update wallet address",
        variant: "destructive"
      })
    } finally {
      setSavingWallet(false)
    }
  }

  const handleSave = async () => {
    // Validation
    const lenderVal = parseFloat(lenderFee)
    const borrowerVal = parseFloat(borrowerFee)
    const lenderInterestMinVal = parseFloat(lenderInterestRateMin)
    const lenderInterestMaxVal = parseFloat(lenderInterestRateMax)
    
    if (isNaN(lenderVal) || lenderVal < 0 || lenderVal > 10) {
      toast({
        title: "Invalid Lender Fee",
        description: "Fee must be between 0% and 10%",
        variant: "destructive"
      })
      return
    }
    
    if (isNaN(borrowerVal) || borrowerVal < 0 || borrowerVal > 10) {
      toast({
        title: "Invalid Borrower Fee",
        description: "Fee must be between 0% and 10%",
        variant: "destructive"
      })
      return
    }

    if (isNaN(lenderInterestMinVal) || lenderInterestMinVal < 0 || lenderInterestMinVal > 20) {
      toast({
        title: "Invalid Lender Interest Minimum",
        description: "Minimum interest rate must be between 0% and 20%",
        variant: "destructive",
      })
      return
    }

    if (isNaN(lenderInterestMaxVal) || lenderInterestMaxVal < 0 || lenderInterestMaxVal > 20) {
      toast({
        title: "Invalid Lender Interest Maximum",
        description: "Maximum interest rate must be between 0% and 20%",
        variant: "destructive",
      })
      return
    }

    if (lenderInterestMinVal > lenderInterestMaxVal) {
      toast({
        title: "Invalid Lender Interest Range",
        description: "Minimum interest rate cannot exceed maximum interest rate",
        variant: "destructive",
      })
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/admin/fees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          lender_fee: lenderVal,
          borrower_fee: borrowerVal,
          lender_interest_rate_min_pct: lenderInterestMinVal,
          lender_interest_rate_max_pct: lenderInterestMaxVal,
        })
      })
      
      const data = await res.json()
      
      if (data.success) {
        toast({
          title: "Success",
          description: "Fee configuration updated successfully"
        })
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update fees",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const handleSaveStablesrailFees = async () => {
    const onrampPerc = parseFloat(onrampPercentage)
    const onrampCapVal = parseFloat(onrampCap)
    const offrampPerc = parseFloat(offrampPercentage)
    const offrampCapVal = parseFloat(offrampCap)
    
    if (isNaN(onrampPerc) || onrampPerc < 0) {
      toast({
        title: "Invalid Onramp Percentage",
        description: "Percentage must be a positive number",
        variant: "destructive"
      })
      return
    }
    
    if (isNaN(onrampCapVal) || onrampCapVal < 0) {
      toast({
        title: "Invalid Onramp Cap",
        description: "Cap must be a positive number",
        variant: "destructive"
      })
      return
    }

    if (isNaN(offrampPerc) || offrampPerc < 0) {
      toast({
        title: "Invalid Offramp Percentage",
        description: "Percentage must be a positive number",
        variant: "destructive"
      })
      return
    }
    
    if (isNaN(offrampCapVal) || offrampCapVal < 0) {
      toast({
        title: "Invalid Offramp Cap",
        description: "Cap must be a positive number",
        variant: "destructive"
      })
      return
    }

    setSavingStablesrail(true)
    try {
      const res = await fetch('/api/sr/manage-fees', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          onrampFee: {
            percentageFee: onrampPerc,
            capFee: onrampCapVal,
            enabled: onrampEnabled
          },
          offrampFee: {
            percentageFee: offrampPerc,
            capFee: offrampCapVal,
            enabled: offrampEnabled
          },
          metadata: {
            description: "Updated onramp/offramp fee configuration",
            notes: "Updated via admin panel"
          }
        })
      })
      
      const data = await res.json()
      
      if (data.success) {
        toast({
          title: "Success",
          description: "Onramp/Offramp fees updated successfully"
        })
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update fees",
        variant: "destructive"
      })
    } finally {
      setSavingStablesrail(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-start pt-8">
      <div className="w-full max-w-6xl mx-auto px-6">
        <h1 className="text-2xl font-bold mb-6 text-center">Admin Fee Configuration</h1>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Loan Transaction Fees</CardTitle>
              <CardDescription>
                Configure percentage fees charged to lenders and borrowers on loan disbursement
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="lenderFee">Lender Fee (%)</Label>
                <Input
                  id="lenderFee"
                  type="number"
                  step="0.01"
                  min="0"
                  max="10"
                  value={lenderFee}
                  onChange={(e) => setLenderFee(e.target.value)}
                  placeholder="1.50"
                  disabled={loading}
                />
                <p className="text-sm text-gray-500">
                  Percentage charged to the lender when approving a loan
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="borrowerFee">Borrower Fee (%)</Label>
                <Input
                  id="borrowerFee"
                  type="number"
                  step="0.01"
                  min="0"
                  max="10"
                  value={borrowerFee}
                  onChange={(e) => setBorrowerFee(e.target.value)}
                  placeholder="1.50"
                  disabled={loading}
                />
                <p className="text-sm text-gray-500">
                  Percentage charged to the borrower when receiving a loan
                </p>
              </div>

              <Button
                onClick={handleSave}
                disabled={loading || saving}
                className="w-full"
              >
                {saving ? "Saving..." : "Save Configuration"}
              </Button>
            </CardContent>
          </Card>

          <Card className="h-full">
            <CardHeader>
              <CardTitle>Lender Interest Rate Limits</CardTitle>
              <CardDescription>
                Configure the minimum and maximum interest rates lenders can set on their loan offers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="lenderInterestRateMin">Minimum Interest Rate (%)</Label>
                <Input
                  id="lenderInterestRateMin"
                  type="number"
                  step="0.01"
                  min="0"
                  max="20"
                  value={lenderInterestRateMin}
                  onChange={(e) => setLenderInterestRateMin(e.target.value)}
                  placeholder="5.00"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lenderInterestRateMax">Maximum Interest Rate (%)</Label>
                <Input
                  id="lenderInterestRateMax"
                  type="number"
                  step="0.01"
                  min="0"
                  max="20"
                  value={lenderInterestRateMax}
                  onChange={(e) => setLenderInterestRateMax(e.target.value)}
                  placeholder="20.00"
                  disabled={loading}
                />
              </div>

              <p className="text-sm text-gray-500">
                These limits are enforced when lenders save loan offers and when loans are approved.
              </p>
            </CardContent>
          </Card>

          <Card className="h-full lg:col-span-2">
            <CardHeader>
              <CardTitle>Onramp & Offramp Transaction Fees</CardTitle>
              <CardDescription>
                Configure Stablesrail onramp and offramp fee percentages and caps
              </CardDescription>
              {(!onrampPercentage && !offrampPercentage) && (
                <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-sm text-yellow-800">
                    <strong>No fee configuration found.</strong> Enter values below to create a new configuration.
                  </p>
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-4 border-b pb-4 md:border-b-0 md:pb-0 md:pr-6 md:border-r">
                  <h3 className="font-semibold">Onramp Fee</h3>
                  <div className="space-y-2">
                    <Label htmlFor="onrampPercentage">Percentage Fee (%)</Label>
                    <Input
                      id="onrampPercentage"
                      type="number"
                      step="0.01"
                      min="0"
                      value={onrampPercentage}
                      onChange={(e) => setOnrampPercentage(e.target.value)}
                      placeholder="1.5"
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="onrampCap">Cap Fee</Label>
                    <Input
                      id="onrampCap"
                      type="number"
                      step="1"
                      min="0"
                      value={onrampCap}
                      onChange={(e) => setOnrampCap(e.target.value)}
                      placeholder="500"
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold">Offramp Fee</h3>
                  <div className="space-y-2">
                    <Label htmlFor="offrampPercentage">Percentage Fee (%)</Label>
                    <Input
                      id="offrampPercentage"
                      type="number"
                      step="0.01"
                      min="0"
                      value={offrampPercentage}
                      onChange={(e) => setOfframpPercentage(e.target.value)}
                      placeholder="2.0"
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="offrampCap">Cap Fee</Label>
                    <Input
                      id="offrampCap"
                      type="number"
                      step="1"
                      min="0"
                      value={offrampCap}
                      onChange={(e) => setOfframpCap(e.target.value)}
                      placeholder="1000"
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              <Button
                onClick={handleSaveStablesrailFees}
                disabled={loading || savingStablesrail}
                className="w-full"
              >
                {savingStablesrail ? "Saving..." : "Save Configuration"}
              </Button>
            </CardContent>
          </Card>

          <Card className="h-full lg:col-span-2">
          <CardHeader>
            <CardTitle>Admin Wallet Address</CardTitle>
            <CardDescription>
              Set the wallet address where collected fees will be sent
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="adminWalletAddress">Wallet Address</Label>
              <Input
                id="adminWalletAddress"
                type="text"
                value={adminWalletAddress}
                onChange={(e) => setAdminWalletAddress(e.target.value)}
                placeholder="0x..."
                disabled={loading || savingWallet}
                className="font-mono"
              />
              <p className="text-sm text-gray-500">
                Ethereum-style wallet address (0x followed by 40 hexadecimal characters)
              </p>
            </div>

            <Button
              onClick={handleSaveWalletAddress}
              disabled={loading || savingWallet || !adminWalletAddress.trim()}
              className="w-full"
            >
              {savingWallet ? "Saving..." : "Save Wallet Address"}
            </Button>
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  )
}
