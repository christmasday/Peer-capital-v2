"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getLoanHelperSettings, updateLoanHelperSettings } from "@/lib/actions/loan-helper-settings"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"

interface LoanHelperSettingsFormProps {
  userId: string
  onSave?: () => void
  onCancel?: () => void
}

export function LoanHelperSettingsForm({ userId, onSave, onCancel }: LoanHelperSettingsFormProps) {
  const [loanAmount, setLoanAmount] = useState<number>(0)
  const [interestRate, setInterestRate] = useState<number>(0)
  const [repaymentTime, setRepaymentTime] = useState<number>(12)
  const [repaymentUnit, setRepaymentUnit] = useState<string>("months")
  const [termsAndConditions, setTermsAndConditions] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const { toast } = useToast()
  const [isHelperEnabled, setIsHelperEnabled] = useState(false)

  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const { data, error } = await getLoanHelperSettings(userId)
        if (error) {
          setError(error)
        } else if (data) {
          setLoanAmount(data.loan_amount)
          setInterestRate(data.interest_rate)
          setRepaymentTime(data.repayment_time)
          setRepaymentUnit(data.repayment_unit || "months")
          setTermsAndConditions(data.terms_and_conditions || "")
        }
      } catch (e: any) {
        setError(e.message || "An unexpected error occurred")
      } finally {
        setIsLoading(false)
      }
    }

    fetchSettings()
  }, [userId])

  useEffect(() => {
    // Fetch if user is currently a loan helper
    async function fetchHelperStatus() {
      const res = await fetch(`/api/loan-helper-status?userId=${userId}`)
      const { enabled } = await res.json()
      setIsHelperEnabled(enabled)
    }
    fetchHelperStatus()
  }, [userId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    try {
      if (isHelperEnabled) {
        const { success, error } = await updateLoanHelperSettings(
          userId,
          loanAmount,
          interestRate,
          repaymentTime,
          repaymentUnit,
          termsAndConditions,
        )
        if (onSave) onSave()
        if (error) {
          setError(error)
        } else {
          toast({
            title: "Helper Settings Updated",
            description: "Your helper settings have been updated successfully.",
          })
        }
      } else {
        // Remove from loan_helpers
        await fetch(`/api/loan-helper-status?userId=${userId}`, { method: "DELETE" })
        if (onSave) onSave()
        toast({
          title: "Helper Disabled",
          description: "You are no longer listed as a loan helper.",
        })
      }
    } catch (e: any) {
      setError(e.message || "An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle></CardTitle>
        <CardDescription>Configure the settings for your loan offering to other users.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <Switch checked={isHelperEnabled} onCheckedChange={setIsHelperEnabled} id="helper-enabled-switch" />
          <Label htmlFor="helper-enabled-switch">Enable Loan Helper</Label>
        </div>
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {isLoading ? (
          <p>Loading settings...</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="loanAmount">Loan Amount</Label>
              <Input
                type="number"
                id="loanAmount"
                placeholder="Enter loan amount"
                value={loanAmount}
                onChange={(e) => setLoanAmount(Number(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="interestRate">Interest Rate</Label>
              <Input
                type="number"
                id="interestRate"
                placeholder="Enter interest rate"
                value={interestRate}
                onChange={(e) => setInterestRate(Number(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="repaymentTime">Repayment Duration</Label>
              <div className="flex gap-2 items-center">
                <Input
                  type="number"
                  id="repaymentTime"
                  placeholder="Enter duration"
                  value={repaymentTime}
                  onChange={(e) => setRepaymentTime(Number(e.target.value))}
                  min={1}
                />
                <Select value={repaymentUnit} onValueChange={setRepaymentUnit}>
                  <SelectTrigger className="w-28">
                    <SelectValue placeholder="Unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="days">Days</SelectItem>
                    <SelectItem value="weeks">Weeks</SelectItem>
                    <SelectItem value="months">Months</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="termsAndConditions">Terms and Conditions</Label>
              <Textarea
                id="termsAndConditions"
                placeholder="Enter terms and conditions"
                value={termsAndConditions}
                onChange={(e) => setTermsAndConditions(e.target.value)}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : "Save Settings"}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
