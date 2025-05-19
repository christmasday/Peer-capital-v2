"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { X, ImageIcon, Loader2 } from "lucide-react"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface ImageSizes {
  thumbnail?: string
  medium?: string
  full?: string
  [key: string]: string | undefined
}

interface ImageUploadProps {
  onChange: (url: string | null, sizes?: ImageSizes | null) => void
  value: string | null
  sizes?: ImageSizes | null
  disabled?: boolean
  className?: string
  maxSize?: number // in MB
  aspectRatio?: "square" | "video" | "auto"
}

export function ImageUpload({
  onChange,
  value,
  sizes,
  disabled,
  className,
  maxSize = 5,
  aspectRatio = "auto",
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(value)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Basic validation
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file")
      return
    }

    if (file.size > maxSize * 1024 * 1024) {
      alert(`File size should be less than ${maxSize}MB`)
      return
    }

    setIsUploading(true)
    setUploadProgress(10) // Start progress

    try {
      // Create a local preview
      const localPreview = URL.createObjectURL(file)
      setPreview(localPreview)
      setUploadProgress(30) // Preview created

      // Create form data for upload
      const formData = new FormData()
      formData.append("file", file)
      setUploadProgress(50) // Form data ready

      // Upload the file
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      setUploadProgress(90) // Upload complete

      if (!response.ok) {
        throw new Error("Failed to upload image")
      }

      const data = await response.json()
      setUploadProgress(100) // Processing complete

      // Handle both old and new response formats
      if (data.urls) {
        onChange(data.url, data.urls)
      } else {
        onChange(data.url)
      }
    } catch (error) {
      console.error("Error uploading image:", error)
      setPreview(null)
      onChange(null, null)
      alert("Failed to upload image. Please try again.")
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleRemove = () => {
    setPreview(null)
    onChange(null, null)
  }

  const handleClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const getAspectRatioClass = () => {
    switch (aspectRatio) {
      case "square":
        return "aspect-square"
      case "video":
        return "aspect-video"
      default:
        return "aspect-auto"
    }
  }

  return (
    <div className={cn("space-y-2", className)}>
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        ref={fileInputRef}
        className="hidden"
        disabled={disabled || isUploading}
      />

      {preview ? (
        <div className="relative rounded-md overflow-hidden">
          <div className={cn("relative", getAspectRatioClass())}>
            <Image src={preview || "/placeholder.svg"} alt="Upload preview" fill className="object-cover" />
          </div>
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 h-6 w-6 rounded-full"
            onClick={handleRemove}
            disabled={disabled || isUploading}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div
          onClick={handleClick}
          className={cn(
            "border-2 border-dashed rounded-md p-4 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-gray-400 transition",
            disabled && "opacity-50 cursor-not-allowed",
            className,
          )}
        >
          {isUploading ? (
            <>
              <Loader2 className="h-10 w-10 text-gray-400 animate-spin" />
              <p className="text-sm text-gray-500">Uploading... {uploadProgress}%</p>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all duration-300 ease-in-out"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </>
          ) : (
            <>
              <ImageIcon className="h-10 w-10 text-gray-400" />
              <p className="text-sm text-gray-500">Click to upload an image</p>
              <p className="text-xs text-gray-400">PNG, JPG, GIF up to {maxSize}MB</p>
            </>
          )}
        </div>
      )}
    </div>
  )
}
