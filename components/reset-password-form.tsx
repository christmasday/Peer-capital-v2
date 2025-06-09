"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff } from "lucide-react"
import { verifyResetToken, resetPasswordWithToken } from "@/lib/actions/auth"

export function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams?.get("token") || ""

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordError, setPasswordError] = useState("")
  const [confirmPasswordError, setConfirmPasswordError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isVerifying, setIsVerifying] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [tokenValid, setTokenValid] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Verify the token when the component mounts
  useEffect(() => {
    async function checkToken() {
      if (!token) {
        setError("No reset token provided. Please request a new password reset link.")
        setIsVerifying(false)
        return
      }

      try {
        const result = await verifyResetToken(token)
        if (result.error) {
          setError(result.error)
          setTokenValid(false)
        } else {
          setTokenValid(true)
        }
      } catch (err) {
        setError("An unexpected error occurred while verifying your reset token.")
      } finally {
        setIsVerifying(false)
      }
    }

    if (token) {
      checkToken()
    } else {
      setIsVerifying(false)
      setError("No reset token provided. Please request a new password reset link.")
    }
  }, [token])

  const validatePassword = (value: string) => {
    if (!value) {
      setPasswordError("Password is required")
      return false
    }
    if (value.length < 8) {
      setPasswordError("Password must be at least 8 characters")
      return false
    }
    if (!/[A-Z]/.test(value)) {
      setPasswordError("Password must contain at least one uppercase letter")
      return false
    }
    if (!/[a-z]/.test(value)) {
      setPasswordError("Password must contain at least one lowercase letter")
      return false
    }
    if (!/[0-9]/.test(value)) {
      setPasswordError("Password must contain at least one number")
      return false
    }
    if (!/[^A-Za-z0-9]/.test(value)) {
      setPasswordError("Password must contain at least one special character")
      return false
    }
    setPasswordError("")
    return true
  }

  const validateConfirmPassword = (value: string) => {
    if (!value) {
      setConfirmPasswordError("Please confirm your password")
      return false
    }
    if (value !== password) {
      setConfirmPasswordError("Passwords do not match")
      return false
    }
    setConfirmPasswordError("")
    return true
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setPassword(value)
    validatePassword(value)
  }

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setConfirmPassword(value)
    validateConfirmPassword(value)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError("")

    try {
      if (password !== confirmPassword) {
        setError("Passwords do not match")
        setIsSubmitting(false)
        return
      }

      const result = await resetPasswordWithToken(token, password)

      if (result.success) {
        setSuccess(true)
        // Redirect to login after a delay
        setTimeout(() => {
          router.push("/login")
        }, 3000)
      } else {
        setError(result.error || "Failed to reset password")
      }
    } catch (error) {
      setError("An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isVerifying) {
    return (
      <div className="space-y-4">
        <div className="text-center py-4">
          <div className="h-8 w-8 mx-auto animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
          <p className="text-sm text-muted-foreground mt-2">Verifying your reset link...</p>
        </div>
      </div>
    )
  }

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success ? (
            <Alert>
              <AlertDescription>
                Your password has been reset successfully! You will be redirected to the login page.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              {!tokenValid ? (
                <Alert variant="destructive">
                  <AlertDescription>
                    This password reset link is invalid or has expired. Please request a new one.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">New Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={handlePasswordChange}
                        className={passwordError ? "border-red-500 pr-10" : "pr-10"}
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {passwordError && <p className="text-sm text-red-500">{passwordError}</p>}
                    <div className="text-xs text-muted-foreground mt-2">
                      <p>Password must:</p>
                      <ul className="list-disc pl-5 space-y-1 mt-1">
                        <li>Be at least 8 characters long</li>
                        <li>Include at least one uppercase letter</li>
                        <li>Include at least one lowercase letter</li>
                        <li>Include at least one number</li>
                        <li>Include at least one special character</li>
                      </ul>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={handleConfirmPasswordChange}
                        className={confirmPasswordError ? "border-red-500 pr-10" : "pr-10"}
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {confirmPasswordError && <p className="text-sm text-red-500">{confirmPasswordError}</p>}
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-3">
          {!success && tokenValid && (
            <Button type="submit" className="w-full" disabled={isSubmitting || !tokenValid}>
              {isSubmitting ? "Resetting Password..." : "Reset Password"}
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
