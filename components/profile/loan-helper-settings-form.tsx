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
  lendingLicenseUrl?: string | null
}

export function LoanHelperSettingsForm({ userId, onSave, onCancel, lendingLicenseUrl }: LoanHelperSettingsFormProps) {
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
  const [accountBalance, setAccountBalance] = useState<number | null>(null)
  const [interestRateLimits, setInterestRateLimits] = useState<{ minPct: number; maxPct: number } | null>(null)
  const isDisabled = !lendingLicenseUrl;

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
    // Fetch account balance
    async function fetchBalance() {
      const { data, error } = await getAccountBalance(userId);
      if (!error && data && typeof data.balance === 'number') {
        setAccountBalance(data.balance);
      }
    }
    fetchBalance();
  }, [userId]);

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
            title: "Lending Goals Settings Updated",
            description: "Your lending goals settings have been updated successfully.",
          })
        }
      } else {
        // Remove from loan_helpers
        await fetch(`/api/loan-helper-status?userId=${userId}`, { method: "DELETE" })
        if (onSave) onSave()
        toast({
          title: "Lending Goals Disabled",
          description: "You are no longer listed in Lending Goals.",
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
        {isDisabled && (
          <Alert variant="default">
            <AlertDescription>
              You must upload a valid lending license to your profile before you can enable or edit Lending Goals.
            </AlertDescription>
          </Alert>
        )}
        <div className="flex items-center gap-3 mb-2">
          <Switch checked={isHelperEnabled} onCheckedChange={setIsHelperEnabled} id="helper-enabled-switch" disabled={isDisabled || accountBalance === 0} />
          <Label htmlFor="helper-enabled-switch">Enable Lending Goals</Label>
        </div>
        {accountBalance === 0 && (
          <Alert variant="default">
            <AlertDescription>
              You too need help. You must have a positive account balance before you can offer loans.
            </AlertDescription>
          </Alert>
        )}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {loanAmountExceedsBalance && (
          <Alert variant="destructive">
            <AlertDescription>
              You no get money to lend. Who you wan impress?
              Loan offer cannot exceed your account balance (₦{accountBalance?.toLocaleString()}).
            </AlertDescription>
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
                disabled={isDisabled}
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
                disabled={isDisabled}
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
                  disabled={isDisabled}
                />
                <Select value={repaymentUnit} onValueChange={setRepaymentUnit} disabled={isDisabled}>
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
                disabled={isDisabled}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading || isDisabled}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading || isDisabled || loanAmountExceedsBalance}>
                {isLoading ? "Saving..." : "Save Settings"}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
