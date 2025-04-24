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

interface LoanHelperSettingsFormProps {
  userId: string
}

export function LoanHelperSettingsForm({ userId }: LoanHelperSettingsFormProps) {
  const [loanAmount, setLoanAmount] = useState<number>(0)
  const [interestRate, setInterestRate] = useState<number>(0)
  const [repaymentTime, setRepaymentTime] = useState<number>(12)
  const [termsAndConditions, setTermsAndConditions] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const { toast } = useToast()

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const { success, error } = await updateLoanHelperSettings(
        userId,
        loanAmount,
        interestRate,
        repaymentTime,
        termsAndConditions,
      )

      if (error) {
        setError(error)
      } else {
        setSuccess(true)
        toast({
          title: "Loan Helper Settings Updated",
          description: "Your loan helper settings have been updated successfully.",
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
        <CardTitle>Loan Helper Settings</CardTitle>
        <CardDescription>Configure the settings for your loan offerings to other users.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert>
            <AlertDescription>Loan helper settings updated successfully!</AlertDescription>
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
              <Label htmlFor="repaymentTime">Repayment Time (months)</Label>
              <Input
                type="number"
                id="repaymentTime"
                placeholder="Enter repayment time"
                value={repaymentTime}
                onChange={(e) => setRepaymentTime(Number(e.target.value))}
              />
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
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Settings"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
