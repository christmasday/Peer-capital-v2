"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { Loader2, Camera, AlertCircle, User } from "lucide-react"
import { uploadProfilePicture } from "@/lib/actions/profile"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import imageCompression from 'browser-image-compression'

interface AvatarUploadDialogProps {
  userId: string
  currentAvatarUrl?: string | null
  userName?: string
  children?: React.ReactNode
}

// Utility to convert any image file to JPEG using a canvas
async function convertToJpeg(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0);
      canvas.toBlob((blob) => {
        if (!blob) return reject(new Error('Failed to convert image to JPEG'));
        const jpegFile = new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' });
        resolve(jpegFile);
      }, 'image/jpeg', 0.85);
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

export function AvatarUploadDialog({ userId, currentAvatarUrl, userName, children }: AvatarUploadDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [avatarImage, setAvatarImage] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateImageDimensions = async (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        // Check if image dimensions are reasonable (min 200x200)
        const isValid = img.width >= 200 && img.height >= 200
        if (!isValid) {
          setError("Image should be at least 200x200 pixels")
        }
        resolve(isValid)
      }
      img.onerror = () => {
        setError("Failed to load image. Please try another file.")
        resolve(false)
      }
      img.src = URL.createObjectURL(file)
    })
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setError(null)

    if (file) {
      // Validate file type (allow any image, but always convert to JPEG)
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file')
        return
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size should be less than 5MB')
        return
      }

      // Compress image
      const compressed = await imageCompression(file, { maxSizeMB: 1, maxWidthOrHeight: 512 })
      // Convert to JPEG
      const jpegFile = await convertToJpeg(compressed)
      setAvatarImage(jpegFile)

      // Set preview URL
      const reader = new FileReader()
      reader.onload = () => setPreviewUrl(reader.result as string)
      reader.onerror = () => setError("Failed to read the image file. Please try again.")
      reader.readAsDataURL(jpegFile)
    }
  }

  const handleUpload = async () => {
    if (!avatarImage) {
      setError("Please select an image to upload")
      return
    }

    try {
      setIsUploading(true)
      setError(null)

      // Check for storage bucket initialization
      const bucketCheckResult = await fetch("/api/storage/check-bucket?bucket=profiles", {
        method: "GET",
      })

      if (!bucketCheckResult.ok) {
        console.warn("Storage bucket check failed, attempting to initialize...")
        // Try to initialize storage if bucket check fails
        await fetch("/api/storage/initialize", { method: "POST" })
      }

      const result = await uploadProfilePicture(avatarImage)

      if (result.error) {
        console.error("Profile picture upload error:", result.error)
        setError(
          result.error.includes("storage") ? "Storage system error. Please try again in a few moments." : result.error,
        )
        return
      }

      setSuccess(true)

      // Update URL immediately to refresh the avatar without page reload
      if (result.url) {
        // Update any local state or cache that might be showing the old avatar
        const event = new CustomEvent("avatar-updated", {
          detail: { url: result.url },
        })
        window.dispatchEvent(event)
      }

      // Close dialog and refresh page after 1.5 seconds
      setTimeout(() => {
        setOpen(false)
        router.refresh()
      }, 1500)
    } catch (err) {
      console.error("Error uploading avatar:", err)
      setError(
        err instanceof Error ? `Upload failed: ${err.message}` : "An unexpected error occurred. Please try again.",
      )
    } finally {
      setIsUploading(false)
    }
  }

  const resetState = () => {
    setAvatarImage(null)
    setPreviewUrl(null)
    setError(null)
    setSuccess(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        setOpen(newOpen)
        if (!newOpen) resetState()
      }}
    >
      <DialogTrigger asChild>
        {children || (
          <Button
            variant="ghost"
            size="icon"
            className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full transition-colors"
          >
            <Camera className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Change Profile Picture</DialogTitle>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert>
            <AlertDescription>Profile picture updated successfully!</AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col items-center justify-center gap-4 py-4">
          {/* Current or Preview Image */}
          <div className="relative mb-4">
            <Avatar className="h-24 w-24 border-2 border-gray-200">
              {previewUrl ? (
                <AvatarImage src={previewUrl || "/placeholder.svg"} alt="Preview" className="object-cover" />
              ) : currentAvatarUrl ? (
                <AvatarImage
                  src={currentAvatarUrl || "/placeholder.svg"}
                  alt={userName || "User"}
                  className="object-cover"
                />
              ) : (
                <AvatarFallback className="bg-blue-100">
                  <User className="h-12 w-12 text-blue-500" />
                </AvatarFallback>
              )}
            </Avatar>
            {isUploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
              </div>
            )}
            {previewUrl && !isUploading && (
              <div className="absolute -right-2 -top-2">
                <Button
                  type="button"
                  size="icon"
                  variant="destructive"
                  className="h-6 w-6 rounded-full"
                  onClick={() => {
                    setPreviewUrl(null)
                    setAvatarImage(null)
                    if (fileInputRef.current) {
                      fileInputRef.current.value = ""
                    }
                  }}
                >
                  <span className="sr-only">Remove preview</span>×
                </Button>
              </div>
            )}
          </div>

          <div className="flex flex-col items-center gap-2 w-full">
            <Button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="w-full"
            >
              {previewUrl ? "Change Image" : "Select Image"}
            </Button>
            <Input
              ref={fileInputRef}
              id="avatar-image"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
              disabled={isUploading}
            />
            <p className="text-xs text-gray-500">JPEG, PNG or GIF (max. 5MB)</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isUploading}>
            Cancel
          </Button>
          <Button onClick={handleUpload} disabled={!avatarImage || isUploading}>
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              "Upload"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
