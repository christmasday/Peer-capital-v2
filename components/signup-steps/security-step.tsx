"use client"

import type React from "react"

import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { SignupFormData } from "@/components/signup-form"

interface SecurityStepProps {
  formData: SignupFormData
  updateFormData: (data: Partial<SignupFormData>) => void
}

export function SecurityStep({ formData, updateFormData }: SecurityStepProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errors, setErrors] = useState({
    password: "",
    confirmPassword: "",
  })

  const validatePassword = (password: string) => {
    if (!password) {
      return "Password is required"
    }
    if (password.length < 8) {
      return "Password must be at least 8 characters"
    }
    if (!/[A-Z]/.test(password)) {
      return "Password must contain at least one uppercase letter"
    }
    if (!/[a-z]/.test(password)) {
      return "Password must contain at least one lowercase letter"
    }
    if (!/[0-9]/.test(password)) {
      return "Password must contain at least one number"
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
      return "Password must contain at least one special character"
    }
    return ""
  }

  const validateConfirmPassword = (password: string, confirmPassword: string) => {
    if (!confirmPassword) {
      return "Please confirm your password"
    }
    if (password !== confirmPassword) {
      return "Passwords do not match"
    }
    return ""
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target
    updateFormData({ password: value })

    const passwordError = validatePassword(value)
    setErrors((prev) => ({
      ...prev,
      password: passwordError,
      confirmPassword: formData.confirmPassword
        ? validateConfirmPassword(value, formData.confirmPassword)
        : prev.confirmPassword,
    }))
  }

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target
    updateFormData({ confirmPassword: value })

    const confirmPasswordError = validateConfirmPassword(formData.password, value)
    setErrors((prev) => ({ ...prev, confirmPassword: confirmPasswordError }))
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="password">
          Password <span className="text-red-500">*</span>
        </Label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            value={formData.password}
            onChange={handlePasswordChange}
            className={errors.password ? "border-red-500 pr-10" : "pr-10"}
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
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
        <Label htmlFor="confirmPassword">
          Confirm Password <span className="text-red-500">*</span>
        </Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            value={formData.confirmPassword}
            onChange={handleConfirmPasswordChange}
            className={errors.confirmPassword ? "border-red-500 pr-10" : "pr-10"}
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {errors.confirmPassword && <p className="text-sm text-red-500">{errors.confirmPassword}</p>}
      </div>
    </div>
  )
}
