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
import { getAccountBalance } from "@/lib/actions/account"

interface LoanHelperSettingsFormProps {
  userId: string
  onSave?: () => void
  onCancel?: () => void
  isVerified?: boolean
  initialData?: any
  initialBalance?: number | null
}

export function LoanHelperSettingsForm({ userId, onSave, onCancel, isVerified, initialData, initialBalance }: LoanHelperSettingsFormProps) {
  const [loanAmount, setLoanAmount] = useState<number>(initialData?.loan_amount ?? 0)
  const [interestRate, setInterestRate] = useState<number>(initialData?.interest_rate ?? 0)
  const [repaymentTime, setRepaymentTime] = useState<number>(initialData?.repayment_time ?? 12)
  const [repaymentUnit, setRepaymentUnit] = useState<string>(initialData?.repayment_unit || "months")
  const [termsAndConditions, setTermsAndConditions] = useState<string>(initialData?.terms_and_conditions || "")
  const [isLoading, setIsLoading] = useState(!initialData)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const { toast } = useToast()
  const [isHelperEnabled, setIsHelperEnabled] = useState(false)
  const [accountBalance, setAccountBalance] = useState<number | null>(initialBalance ?? null)
  const [interestRateLimits, setInterestRateLimits] = useState<{ minPct: number; maxPct: number } | null>(null)

  useEffect(() => {
    if (initialData) return
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
  }, [userId, initialData])

  useEffect(() => {
    async function fetchInterestRateLimits() {
      try {
        const response = await fetch("/api/loan-limits", { credentials: "include" })
        const data = await response.json()

        if (response.ok && data?.lenderInterestRateLimits) {
          setInterestRateLimits({
            minPct: Number(data.lenderInterestRateLimits.min_pct ?? 5),
            maxPct: Number(data.lenderInterestRateLimits.max_pct ?? 20),
          })
        }
      } catch (error) {
        setInterestRateLimits({ minPct: 5, maxPct: 20 })
      }
    }

    fetchInterestRateLimits()
  }, [])

  useEffect(() => {
    // Fetch if user is currently a loan helper
    async function fetchHelperStatus() {
      const res = await fetch(`/api/loan-helper-status?userId=${userId}`)
      const { enabled } = await res.json()
      setIsHelperEnabled(enabled)
    }
    fetchHelperStatus()
  }, [userId])

  useEffect(() => {
    if (initialBalance !== undefined && initialBalance !== null) return
    async function fetchBalance() {
      const { data, error } = await getAccountBalance(userId);
      if (!error && data && typeof data.balance === 'number') {
        setAccountBalance(data.balance);
      }
    }
    fetchBalance();
  }, [userId, initialBalance]);

  // Turn off helper if balance is 0
  useEffect(() => {
    if (accountBalance === 0 && isHelperEnabled) {
      setIsHelperEnabled(false);
    }
  }, [accountBalance]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    if (interestRateLimits) {
      if (interestRate < interestRateLimits.minPct || interestRate > interestRateLimits.maxPct) {
        setError(`Interest rate must be between ${interestRateLimits.minPct}% and ${interestRateLimits.maxPct}%`)
        setIsLoading(false)
        return
      }
    }

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
            title: "Lending goals updated",
            description: "Your lending goals have been updated successfully.",
          })
        }
      } else {
        // Remove from loan_helpers
        await fetch(`/api/loan-helper-status?userId=${userId}`, { method: "DELETE" })
        if (onSave) onSave()
        toast({
          title: "Lending goals disabled",
          description: "You are no longer listed in lending goals.",
        })
      }
    } catch (e: any) {
      setError(e.message || "An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const loanAmountExceedsBalance = accountBalance !== null && loanAmount > accountBalance;

  return (
    <Card>
      <CardHeader>
        <CardTitle></CardTitle>
        <CardDescription>Configure the settings for your loan offering to other users.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <Switch checked={isHelperEnabled} onCheckedChange={setIsHelperEnabled} id="helper-enabled-switch" disabled={accountBalance === 0} />
          <Label htmlFor="helper-enabled-switch">Enable lending goals</Label>
        </div>
        {accountBalance === 0 && (
          <Alert variant="default">
            <AlertDescription>
              You must have a positive account balance before you can offer loans.
            </AlertDescription>
          </Alert>
        )}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {!isVerified && (
          <Alert variant="default">
            <AlertDescription>
              You need to complete your profile verification before you can save lending settings. You can still edit the fields below.
            </AlertDescription>
          </Alert>
        )}
        {loanAmountExceedsBalance && (
          <Alert variant="destructive">
            <AlertDescription>
              Loan offer cannot exceed your account balance (₦{accountBalance?.toLocaleString()}).
            </AlertDescription>
          </Alert>
        )}
        {isLoading ? (
          <p>Loading settings...</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
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
                  min={interestRateLimits?.minPct ?? 5}
                  max={interestRateLimits?.maxPct ?? 20}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Allowed range: {interestRateLimits?.minPct ?? 5}% - {interestRateLimits?.maxPct ?? 20}%
                </p>
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
            </div>
            <div>
              <Label htmlFor="termsAndConditions">Terms and Conditions</Label>
              <Textarea
                id="termsAndConditions"
                placeholder="Enter terms and conditions"
                value={termsAndConditions}
                onChange={(e) => setTermsAndConditions(e.target.value)}
                className="border-b-2 border-blue-600 focus:border-green-600 outline-none"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading || loanAmountExceedsBalance || !isVerified}>
                {isLoading ? "Saving..." : "Save Settings"}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
