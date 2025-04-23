"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, AlertCircle, CheckCircle } from "lucide-react"
import { changePassword } from "@/lib/actions/auth"

export function ChangePasswordForm() {
  const router = useRouter()
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [currentPasswordError, setCurrentPasswordError] = useState("")
  const [newPasswordError, setNewPasswordError] = useState("")
  const [confirmPasswordError, setConfirmPasswordError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [debugInfo, setDebugInfo] = useState<string | null>(null)

  const validateCurrentPassword = (value: string) => {
    if (!value) {
      setCurrentPasswordError("Current password is required")
      return false
    }
    setCurrentPasswordError("")
    return true
  }

  const validateNewPassword = (value: string) => {
    if (!value) {
      setNewPasswordError("New password is required")
      return false
    }
    if (value.length < 8) {
      setNewPasswordError("Password must be at least 8 characters")
      return false
    }
    if (!/[A-Z]/.test(value)) {
      setNewPasswordError("Password must contain at least one uppercase letter")
      return false
    }
    if (!/[a-z]/.test(value)) {
      setNewPasswordError("Password must contain at least one lowercase letter")
      return false
    }
    if (!/[0-9]/.test(value)) {
      setNewPasswordError("Password must contain at least one number")
      return false
    }
    if (!/[^A-Za-z0-9]/.test(value)) {
      setNewPasswordError("Password must contain at least one special character")
      return false
    }
    if (value === currentPassword) {
      setNewPasswordError("New password must be different from current password")
      return false
    }
    setNewPasswordError("")
    return true
  }

  const validateConfirmPassword = (value: string) => {
    if (!value) {
      setConfirmPasswordError("Please confirm your new password")
      return false
    }
    if (value !== newPassword) {
      setConfirmPasswordError("Passwords do not match")
      return false
    }
    setConfirmPasswordError("")
    return true
  }

  const handleCurrentPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setCurrentPassword(value)
    validateCurrentPassword(value)
  }

  const handleNewPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setNewPassword(value)
    validateNewPassword(value)
    if (confirmPassword) {
      validateConfirmPassword(confirmPassword)
    }
  }

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setConfirmPassword(value)
    validateConfirmPassword(value)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setDebugInfo(null)

    // Validate inputs
    const isCurrentPasswordValid = validateCurrentPassword(currentPassword)
    const isNewPasswordValid = validateNewPassword(newPassword)
    const isConfirmPasswordValid = validateConfirmPassword(confirmPassword)

    if (!isCurrentPasswordValid || !isNewPasswordValid || !isConfirmPasswordValid) {
      return
    }

    try {
      setIsLoading(true)

      // Check authentication status
      const authStatus = {
        jwt: localStorage.getItem("jwt-token") ? true : false,
        authCookie: document.cookie.includes("auth-status=authenticated") || document.cookie.includes("sb-auth-token="),
        authBypass: localStorage.getItem("auth_bypass") === "true",
        isAuthenticated: localStorage.getItem("is_authenticated") === "true",
      }

      setDebugInfo(
        `Auth status: JWT: ${authStatus.jwt}, Cookie: ${authStatus.authCookie}, Bypass: ${authStatus.authBypass}, IsAuth: ${authStatus.isAuthenticated}`,
      )

      const result = await changePassword(currentPassword, newPassword)

      if (result.error) {
        setError(result.error)
        return
      }

      setSuccess(true)

      // Clear form
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")

      // Redirect to profile page after 3 seconds
      setTimeout(() => {
        router.push("/profile")
      }, 3000)
    } catch (err) {
      setError("An unexpected error occurred. Please try again.")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Change Password</CardTitle>
        <CardDescription>Update your password to keep your account secure</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {debugInfo && (
            <Alert className="bg-yellow-50 border-yellow-200">
              <AlertCircle className="h-4 w-4 text-yellow-500" />
              <AlertDescription className="text-yellow-700">{debugInfo}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Your password has been changed successfully! You will be redirected to your profile page.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current Password</Label>
            <div className="relative">
              <Input
                id="currentPassword"
                name="currentPassword"
                type={showCurrentPassword ? "text" : "password"}
                value={currentPassword}
                onChange={handleCurrentPasswordChange}
                className={currentPasswordError ? "border-red-500 pr-10" : "pr-10"}
                disabled={isLoading || success}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                disabled={isLoading || success}
              >
                {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {currentPasswordError && <p className="text-sm text-red-500">{currentPasswordError}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <div className="relative">
              <Input
                id="newPassword"
                name="newPassword"
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={handleNewPasswordChange}
                className={newPasswordError ? "border-red-500 pr-10" : "pr-10"}
                disabled={isLoading || success}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                onClick={() => setShowNewPassword(!showNewPassword)}
                disabled={isLoading || success}
              >
                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {newPasswordError && <p className="text-sm text-red-500">{newPasswordError}</p>}
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
                disabled={isLoading || success}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={isLoading || success}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {confirmPasswordError && <p className="text-sm text-red-500">{confirmPasswordError}</p>}
          </div>
        </CardContent>
        <CardFooter>
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isLoading || success}
              className="sm:flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || success} className="sm:flex-1">
              {isLoading ? "Changing Password..." : "Change Password"}
            </Button>
          </div>
        </CardFooter>
      </form>
    </Card>
  )
}
