"use client"

import type React from "react"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { SignupFormData } from "@/components/signup-form"
import { cn } from "@/lib/utils"

interface AddressStepProps {
  formData: SignupFormData
  updateFormData: (data: Partial<SignupFormData>) => void
}

// List of countries - focusing on African countries first with Nigeria at the top
const countries = [
  "Nigeria",
  "Algeria",
  "Angola",
  "Benin",
  "Botswana",
  "Burkina Faso",
  "Burundi",
  "Cabo Verde",
  "Cameroon",
  "Central African Republic",
  "Chad",
  "Comoros",
  "Congo",
  "Côte d'Ivoire",
  "Djibouti",
  "Egypt",
  "Equatorial Guinea",
  "Eritrea",
  "Eswatini",
  "Ethiopia",
  "Gabon",
  "Gambia",
  "Ghana",
  "Guinea",
  "Guinea-Bissau",
  "Kenya",
  "Lesotho",
  "Liberia",
  "Libya",
  "Madagascar",
  "Malawi",
  "Mali",
  "Mauritania",
  "Mauritius",
  "Morocco",
  "Mozambique",
  "Namibia",
  "Niger",
  "Rwanda",
  "Sao Tome and Principe",
  "Senegal",
  "Seychelles",
  "Sierra Leone",
  "Somalia",
  "South Africa",
  "South Sudan",
  "Sudan",
  "Tanzania",
  "Togo",
  "Tunisia",
  "Uganda",
  "Zambia",
  "Zimbabwe",
  // Other major countries
  "United States",
  "United Kingdom",
  "Canada",
  "Australia",
  "China",
  "India",
  "Germany",
  "France",
  "Japan",
  "Brazil",
]

export function AddressStep({ formData, updateFormData }: AddressStepProps) {
  const [errors, setErrors] = useState({
    address: "",
    city: "",
    state: "",
    country: "",
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

  const handleCountryChange = (value: string) => {
    updateFormData({ country: value })
    validateField("country", value)
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="country">
          Country of Residence <span className="text-red-500">*</span>
        </Label>
        <Select value={formData.country} onValueChange={handleCountryChange}>
          <SelectTrigger id="country"
            className="w-full"
            isError={!!errors.country}
          >
            <SelectValue placeholder="Select your country" />
          </SelectTrigger>
          <SelectContent>
            {countries.map((country) => (
              <SelectItem key={country} value={country}>
                {country}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.country && <p className="text-sm text-red-500">{errors.country}</p>}
      </div>

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
          className="w-full"
          isError={!!errors.address}
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
          className="w-full"
          isError={!!errors.city}
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
          className="w-full"
          isError={!!errors.state}
        />
        {errors.state && <p className="text-sm text-red-500">{errors.state}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="zipCode">Zip/Postal Code</Label>
        <Input id="zipCode" name="zipCode" value={formData.zipCode} onChange={handleChange} className="w-full" />
      </div>
    </div>
  )
}
