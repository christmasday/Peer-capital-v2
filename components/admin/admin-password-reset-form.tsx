"use client"

import type React from "react"

import { useState } from "react"
import { adminResetUserPassword } from "@/lib/actions/admin"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { toast } from "@/components/ui/use-toast"
import { AlertCircle, CheckCircle2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface AdminPasswordResetFormProps {
  userId: string
  userEmail: string
}

export function AdminPasswordResetForm({ userId, userEmail }: AdminPasswordResetFormProps) {
  const [resetMethod, setResetMethod] = useState<string>("reset_link")
  const [newPassword, setNewPassword] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [result, setResult] = useState<{ success?: boolean; message?: string; error?: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append("userId", userId)
      formData.append("resetMethod", resetMethod)

      if (resetMethod === "temporary_password") {
        formData.append("newPassword", newPassword)
      }

      const response = await adminResetUserPassword(formData)

      if (response.error) {
        setResult({ error: response.error })
        toast({
          title: "Error",
          description: response.error,
          variant: "destructive",
        })
      } else {
        setResult({ success: true, message: response.message })
        toast({
          title: "Success",
          description: response.message,
        })

        // Reset form if successful
        if (resetMethod === "temporary_password") {
          setNewPassword("")
        }
      }
    } catch (error) {
      console.error("Error resetting password:", error)
      setResult({ error: "An unexpected error occurred" })
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reset Password</CardTitle>
        <CardDescription>
          Reset password for user: <span className="font-medium">{userEmail}</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        {result && (
          <Alert className={`mb-4 ${result.success ? "bg-green-50" : "bg-red-50"}`}>
            {result.success ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
            <AlertTitle>{result.success ? "Success" : "Error"}</AlertTitle>
            <AlertDescription>{result.message || result.error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="reset-method">Reset Method</Label>
              <RadioGroup
                id="reset-method"
                value={resetMethod}
                onValueChange={setResetMethod}
                className="mt-2 space-y-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="reset_link" id="reset-link" />
                  <Label htmlFor="reset-link" className="cursor-pointer">
                    Send password reset link
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="temporary_password" id="temp-password" />
                  <Label htmlFor="temp-password" className="cursor-pointer">
                    Set temporary password
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {resetMethod === "temporary_password" && (
              <div>
                <Label htmlFor="new-password">Temporary Password</Label>
                <Input
                  id="new-password"
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="mt-1"
                  placeholder="Enter temporary password"
                  required
                  minLength={8}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Minimum 8 characters. User will be required to change this on next login.
                </p>
              </div>
            )}

            <Button
              type="submit"
              disabled={
                isSubmitting || (resetMethod === "temporary_password" && (!newPassword || newPassword.length < 8))
              }
              className="w-full"
            >
              {isSubmitting ? "Processing..." : "Reset Password"}
            </Button>
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col items-start text-xs text-muted-foreground">
        <p>This action will be logged for security and audit purposes.</p>
        {resetMethod === "reset_link" && <p className="mt-1">A password reset link will be sent to {userEmail}.</p>}
        {resetMethod === "temporary_password" && (
          <p className="mt-1">The user will be required to change their password on next login.</p>
        )}
      </CardFooter>
    </Card>
  )
}
