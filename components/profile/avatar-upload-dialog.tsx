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

interface AvatarUploadDialogProps {
  userId: string
  currentAvatarUrl?: string | null
  userName?: string
  children?: React.ReactNode
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setError(null)

    if (file) {
      // Validate file type
      const validTypes = ["image/jpeg", "image/png", "image/gif"]
      if (!validTypes.includes(file.type)) {
        setError("Please select a valid image file (JPEG, PNG, or GIF)")
        return
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size should be less than 5MB")
        return
      }

      setAvatarImage(file)

      // Create preview URL
      const reader = new FileReader()
      reader.onload = () => {
        setPreviewUrl(reader.result as string)
      }
      reader.onerror = () => {
        setError("Failed to read the image file. Please try again.")
      }
      reader.readAsDataURL(file)
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

      const result = await uploadProfilePicture(avatarImage)

      if (result.error) {
        setError(result.error)
        return
      }

      setSuccess(true)

      // Close dialog and refresh page after 1.5 seconds
      setTimeout(() => {
        setOpen(false)
        router.refresh()
      }, 1500)
    } catch (err) {
      console.error("Error uploading avatar:", err)
      setError("An unexpected error occurred. Please try again.")
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
          <div className="relative mb-2">
            <Avatar className="h-24 w-24 border-2 border-gray-200">
              {previewUrl ? (
                <AvatarImage src={previewUrl || "/placeholder.svg"} alt="Preview" />
              ) : currentAvatarUrl ? (
                <AvatarImage src={currentAvatarUrl || "/placeholder.svg"} alt={userName || "User"} />
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
