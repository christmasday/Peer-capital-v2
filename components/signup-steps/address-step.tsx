"use client"

import type React from "react"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { SignupFormData } from "@/components/signup-form"

interface AddressStepProps {
  formData: SignupFormData
  updateFormData: (data: Partial<SignupFormData>) => void
}

export function AddressStep({ formData, updateFormData }: AddressStepProps) {
  const [errors, setErrors] = useState({
    address: "",
    city: "",
    state: "",
  })

  const validateField = (name: string, value: string) => {
    let error = ""

    if (!value.trim()) {
      error = `${name.charAt(0).toUpperCase() + name.slice(1)} is required`
    }

    setErrors((prev) => ({ ...prev, [name]: error }))
    return error
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    updateFormData({ [name]: value })
  }

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    validateField(name, value)
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="address">
          Street Address <span className="text-red-500">*</span>
        </Label>
        <Input
          id="address"
          name="address"
          value={formData.address}
          onChange={handleChange}
          onBlur={handleBlur}
          className={errors.address ? "border-red-500" : ""}
        />
        {errors.address && <p className="text-sm text-red-500">{errors.address}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="city">
          City <span className="text-red-500">*</span>
        </Label>
        <Input
          id="city"
          name="city"
          value={formData.city}
          onChange={handleChange}
          onBlur={handleBlur}
          className={errors.city ? "border-red-500" : ""}
        />
        {errors.city && <p className="text-sm text-red-500">{errors.city}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="state">
          State <span className="text-red-500">*</span>
        </Label>
        <Input
          id="state"
          name="state"
          value={formData.state}
          onChange={handleChange}
          onBlur={handleBlur}
          className={errors.state ? "border-red-500" : ""}
        />
        {errors.state && <p className="text-sm text-red-500">{errors.state}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="zipCode">Zip/Postal Code</Label>
        <Input id="zipCode" name="zipCode" value={formData.zipCode} onChange={handleChange} />
      </div>
    </div>
  )
}
