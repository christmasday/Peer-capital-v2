"use client"

import type React from "react"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { SignupFormData } from "@/components/signup-form"
import { cn } from "@/lib/utils"

interface PersonalInfoStepProps {
  formData: SignupFormData
  updateFormData: (data: Partial<SignupFormData>) => void
}

export function PersonalInfoStep({ formData, updateFormData }: PersonalInfoStepProps) {
  const [errors, setErrors] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    bvn: "",
    dateOfBirth: "",
  })

  const validateField = (name: string, value: string) => {
    let error = ""

    switch (name) {
      case "firstName":
      case "lastName":
        if (!value.trim()) {
          error = `${name === "firstName" ? "First" : "Last"} name is required`
        }
        break
      case "email":
        if (!value.trim()) {
          error = "Email address is required"
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          error = "Please enter a valid email address"
        }
        break
      case "phoneNumber":
        if (!value.trim()) {
          error = "Phone number is required"
        } else if (!/^\d+$/.test(value)) {
          error = "Phone number must contain only digits"
        } else if (value.length > 11) {
          error = "Phone number must not exceed 11 digits"
        }
        break
      case "bvn":
        if (!value.trim()) {
          error = "BVN is required"
        } else if (!/^\d{11}$/.test(value)) {
          error = "BVN must be exactly 11 digits"
        }
        break
      case "dateOfBirth":
        if (!value) {
          error = "Date of birth is required"
        } else {
          const dob = new Date(value)
          const today = new Date()
          const age = today.getFullYear() - dob.getFullYear()
          if (age < 18) {
            error = "You must be at least 18 years old"
          }
          // If dateOfBirth exists and needs formatting
          if (formData.dateOfBirth) {
            // Parse the date (handles various input formats)
            const date = new Date(formData.dateOfBirth)
            // Format as YYYY-MM-DD
            formData.dateOfBirth = date.toISOString().split("T")[0]
          }
        }
        break
    }

    setErrors((prev) => ({ ...prev, [name]: error }))
    return error
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target

    if (name === "phoneNumber" || name === "bvn") {
      // Only allow digits
      const digitsOnly = value.replace(/\D/g, "")

      // Apply max length
      const maxLength = name === "bvn" ? 11 : name === "phoneNumber" ? 11 : undefined
      const truncatedValue = maxLength ? digitsOnly.slice(0, maxLength) : digitsOnly

      updateFormData({ [name]: truncatedValue })
      validateField(name, truncatedValue)
    } else {
      updateFormData({ [name]: value })
      validateField(name, value)
    }
  }

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    validateField(name, value)
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="firstName">
          First Name <span className="text-red-500">*</span>
        </Label>
        <Input
          id="firstName"
          name="firstName"
          value={formData.firstName}
          onChange={handleChange}
          onBlur={handleBlur}
          className="w-full"
          isError={!!errors.firstName}
        />
        {errors.firstName && <p className="text-sm text-red-500">{errors.firstName}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="middleName">Middle Name</Label>
        <Input
          id="middleName"
          name="middleName"
          value={formData.middleName}
          onChange={(e) => updateFormData({ middleName: e.target.value })}
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="lastName">
          Last Name <span className="text-red-500">*</span>
        </Label>
        <Input
          id="lastName"
          name="lastName"
          value={formData.lastName}
          onChange={handleChange}
          onBlur={handleBlur}
          className="w-full"
          isError={!!errors.lastName}
        />
        {errors.lastName && <p className="text-sm text-red-500">{errors.lastName}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">
          Email Address <span className="text-red-500">*</span>
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          onBlur={handleBlur}
          className="w-full"
          isError={!!errors.email}
        />
        {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="phoneNumber">
          Phone Number (max 11 digits) <span className="text-red-500">*</span>
        </Label>
        <Input
          id="phoneNumber"
          name="phoneNumber"
          type="tel"
          value={formData.phoneNumber}
          onChange={handleChange}
          onBlur={handleBlur}
          maxLength={11}
          className="w-full"
          isError={!!errors.phoneNumber}
        />
        {errors.phoneNumber && <p className="text-sm text-red-500">{errors.phoneNumber}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="bvn">
          BVN (11 digits) <span className="text-red-500">*</span>
        </Label>
        <Input
          id="bvn"
          name="bvn"
          value={formData.bvn}
          onChange={handleChange}
          onBlur={handleBlur}
          maxLength={11}
          className="w-full"
          isError={!!errors.bvn}
        />
        {errors.bvn && <p className="text-sm text-red-500">{errors.bvn}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="dateOfBirth">
          Date of Birth <span className="text-red-500">*</span>
        </Label>
        <Input
          id="dateOfBirth"
          name="dateOfBirth"
          type="date"
          value={formData.dateOfBirth}
          onChange={handleChange}
          onBlur={handleBlur}
          className="w-full"
          isError={!!errors.dateOfBirth}
        />
        {errors.dateOfBirth && <p className="text-sm text-red-500">{errors.dateOfBirth}</p>}
      </div>
    </div>
  )
}
