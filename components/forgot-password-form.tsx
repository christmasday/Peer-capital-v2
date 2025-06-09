"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { resetPassword } from "@/lib/actions/auth"

export function ForgotPasswordForm() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [emailError, setEmailError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setEmail(value)

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (value.length > 0 && !emailRegex.test(value)) {
      setEmailError("Please enter a valid email address")
    } else {
      setEmailError("")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setEmailError("Please enter a valid email address")
      return
    }

    try {
      setIsLoading(true)
      const formData = new FormData()
      formData.append("email", email)

      const result = await resetPassword(formData)

      if (result.error) {
        setError(result.error)
        return
      }

      setSuccess(true)
    } catch (err) {
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <CardHeader>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success ? (
            <Alert>
              <AlertDescription>Password reset instructions have been sent. Please check your email.</AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="email-reset">Email Address</Label>
              <Input
                id="email-reset"
                name="email"
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={handleEmailChange}
                className={emailError ? "border-red-500" : ""}
              />
              {emailError && <p className="text-sm text-red-500">{emailError}</p>}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-3">
          {!success && (
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Processing..." : "Reset Password"}
            </Button>
          )}
          <Link href="/" className="text-sm text-center text-blue-600 hover:text-blue-800 w-full">
            Back to Login
          </Link>
        </CardFooter>
      </form>
    </Card>
  )
}
