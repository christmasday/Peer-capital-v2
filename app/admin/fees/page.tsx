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
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [onrampPercentage, setOnrampPercentage] = useState("")
  const [onrampCap, setOnrampCap] = useState("")
  const [onrampEnabled, setOnrampEnabled] = useState(true)
  const [offrampPercentage, setOfframpPercentage] = useState("")
  const [offrampCap, setOfframpCap] = useState("")
  const [offrampEnabled, setOfframpEnabled] = useState(true)
  const [savingStablesrail, setSavingStablesrail] = useState(false)

  useEffect(() => {
    fetchFees()
    fetchStablesrailFees()
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
      const res = await fetch('/api/stablesrail/manage-fees', {
        credentials: 'include'
      })
      const data = await res.json()
      
      if (data.success && data.fees?.data?.feeConfiguration) {
        const config = data.fees.data.feeConfiguration
        if (config.onrampFee) {
          setOnrampPercentage(config.onrampFee.percentageFee.toString())
          setOnrampCap(config.onrampFee.capFee.toString())
          setOnrampEnabled(config.onrampFee.enabled)
        } else {
          // Set default values if no onramp fee is configured
          setOnrampPercentage("0")
          setOnrampCap("500")
          setOnrampEnabled(true)
        }
        if (config.offrampFee) {
          setOfframpPercentage(config.offrampFee.percentageFee.toString())
          setOfframpCap(config.offrampFee.capFee.toString())
          setOfframpEnabled(config.offrampFee.enabled)
        } else {
          // Set default values if no offramp fee is configured
          setOfframpPercentage("2.0")
          setOfframpCap("500")
          setOfframpEnabled(true)
        }
      } else if (data.success === false) {
        // No fee configuration found, clear fields to show no configuration
        console.log("No fee configuration found in Stablesrail")
        setOnrampPercentage("")
        setOnrampCap("")
        setOnrampEnabled(true)
        setOfframpPercentage("")
        setOfframpCap("")
        setOfframpEnabled(true)
      } else {
        console.error("Unexpected response format:", data)
      }
    } catch (error) {
      console.error("Failed to fetch Stablesrail fees:", error)
      // Clear fields on error to indicate no configuration
      setOnrampPercentage("")
      setOnrampCap("")
      setOnrampEnabled(true)
      setOfframpPercentage("")
      setOfframpCap("")
      setOfframpEnabled(true)
    }
  }

  const handleSave = async () => {
    // Validation
    const lenderVal = parseFloat(lenderFee)
    const borrowerVal = parseFloat(borrowerFee)
    
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

    setSaving(true)
    try {
      const res = await fetch('/api/admin/fees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          lender_fee: lenderVal,
          borrower_fee: borrowerVal
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
      const res = await fetch('/api/stablesrail/manage-fees', {
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
      <div className="w-full max-w-2xl mx-auto px-6">
        <h1 className="text-2xl font-bold mb-6 text-center">Admin Fee Configuration</h1>
        
        <Card>
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

        <Card className="mt-6">
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
            <div className="space-y-4 border-b pb-4">
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

            <Button
              onClick={handleSaveStablesrailFees}
              disabled={loading || savingStablesrail}
              className="w-full"
            >
              {savingStablesrail ? "Saving..." : "Save Configuration"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
