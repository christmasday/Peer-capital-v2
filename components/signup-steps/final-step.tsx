"use client"

import type React from "react"

import { useState, useRef } from "react"
import Image from "next/image"
import { Camera, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import type { SignupFormData } from "@/components/signup-form"

interface FinalStepProps {
  formData: SignupFormData
  updateFormData: (data: Partial<SignupFormData>) => void
}

export function FinalStep({ formData, updateFormData }: FinalStepProps) {
  const [errors, setErrors] = useState({
    profilePicture: "",
    acceptTerms: "",
  })
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setIsUploading(true)

    if (file) {
      // Validate file type
      const validTypes = ["image/jpeg", "image/png", "image/gif"]
      if (!validTypes.includes(file.type)) {
        setErrors((prev) => ({
          ...prev,
          profilePicture: "Please select a valid image file (JPEG, PNG, or GIF)",
        }))
        setIsUploading(false)
        return
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({
          ...prev,
          profilePicture: "Image size should be less than 5MB",
        }))
        setIsUploading(false)
        return
      }

      // Clear error and update form data
      setErrors((prev) => ({ ...prev, profilePicture: "" }))
      updateFormData({ profilePicture: file })

      // Create preview URL
      const reader = new FileReader()
      reader.onload = () => {
        setPreviewUrl(reader.result as string)
        setIsUploading(false)
      }
      reader.onerror = () => {
        setErrors((prev) => ({
          ...prev,
          profilePicture: "Failed to read the image file. Please try again.",
        }))
        setIsUploading(false)
      }
      reader.readAsDataURL(file)
    } else {
      setIsUploading(false)
    }
  }

  const handleTermsChange = (checked: boolean) => {
    updateFormData({ acceptTerms: checked })

    if (!checked) {
      setErrors((prev) => ({
        ...prev,
        acceptTerms: "You must accept the terms and conditions",
      }))
    } else {
      setErrors((prev) => ({ ...prev, acceptTerms: "" }))
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  const removePhoto = () => {
    setPreviewUrl(null)
    updateFormData({ profilePicture: null })
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="text-center">
          <Label className="text-xl font-medium block">Profile Picture</Label>
          <p className="text-sm text-muted-foreground mt-1">Upload a photo to personalize your profile</p>
        </div>

        <div className="flex flex-col items-center space-y-4">
          <div
            className="relative w-48 h-48 rounded-full border-3 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 cursor-pointer overflow-hidden transition-all hover:border-gray-400 shadow-sm hover:shadow-md"
            onClick={triggerFileInput}
          >
            {isUploading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-gray-600"></div>
              </div>
            ) : previewUrl ? (
              <>
                <Image
                  src={previewUrl || "/placeholder.svg"}
                  alt="Profile preview"
                  fill
                  className="rounded-full object-cover"
                />
                <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-all flex items-center justify-center opacity-0 hover:opacity-100">
                  <Camera className="h-10 w-10 text-white" />
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center w-full h-full">
                <div className="rounded-full bg-gray-100 p-3 mb-2">
                  <Camera className="h-10 w-10 text-gray-400" />
                </div>
                <span className="text-sm font-medium text-gray-600">Add Profile Photo</span>
                <span className="text-xs text-gray-500 mt-1">Click to browse</span>
              </div>
            )}
          </div>

          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

          <div className="flex space-x-3 justify-center">
            <Button type="button" variant="outline" size="sm" onClick={triggerFileInput}>
              <Upload className="h-4 w-4 mr-2" />
              {previewUrl ? "Change Photo" : "Upload Photo"}
            </Button>

            {previewUrl && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={removePhoto}
                className="text-red-500 hover:text-red-700 hover:bg-red-50"
              >
                Remove
              </Button>
            )}
          </div>

          {errors.profilePicture && <p className="text-sm text-red-500 text-center">{errors.profilePicture}</p>}

          <div className="text-xs text-muted-foreground text-center">
            Supported formats: JPEG, PNG, GIF. Max size: 5MB
          </div>
        </div>
      </div>

      <div className="space-y-4 pt-4 border-t">
        <div className="flex items-start space-x-2">
          <Checkbox id="terms" checked={formData.acceptTerms} onCheckedChange={handleTermsChange} />
          <div className="grid gap-1.5 leading-none">
            <Label
              htmlFor="terms"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Accept terms and conditions <span className="text-red-500">*</span>
            </Label>
            <p className="text-sm text-muted-foreground">
              By creating an account, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        </div>
        {errors.acceptTerms && <p className="text-sm text-red-500">{errors.acceptTerms}</p>}
      </div>
    </div>
  )
}
