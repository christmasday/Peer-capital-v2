"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Upload, ImageIcon, Grid } from "lucide-react"
import { uploadBannerImage } from "@/lib/actions/profile"

interface BannerUploadFormProps {
  userId: string
  currentBannerUrl?: string | null
}

export function BannerUploadForm({ userId, currentBannerUrl }: BannerUploadFormProps) {
  const router = useRouter()
  const [bannerImage, setBannerImage] = useState<File | null>(null)
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

      setBannerImage(file)

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!bannerImage) {
      setError("Please select an image to upload")
      return
    }

    try {
      setIsUploading(true)
      setError(null)

      const result = await uploadBannerImage(bannerImage)

      if (result.error) {
        setError(result.error)
        return
      }

      setSuccess(true)

      // Redirect back to profile after 2 seconds
      setTimeout(() => {
        router.push("/profile")
        router.refresh()
      }, 2000)
    } catch (error) {
      console.error("Error uploading banner:", error)
      setError("An error occurred while uploading your banner. Please try again.")
      setIsUploading(false)
      return
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertDescription>
            Your banner image has been updated successfully! You will be redirected to your profile page.
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="banner-image">Upload Banner Image</Label>
        <div
          className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 cursor-pointer transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          {previewUrl ? (
            <div className="space-y-4">
              <div className="relative w-full h-48 rounded-lg overflow-hidden mx-auto">
                <Image src={previewUrl || "/placeholder.svg"} alt="Banner Preview" fill className="object-cover" />
              </div>
              <p className="text-sm text-gray-500">Click to change image</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-col items-center justify-center">
                <div className="bg-gray-100 p-3 rounded-full mb-2">
                  <ImageIcon className="h-8 w-8 text-gray-500" />
                </div>
                <p className="text-lg font-medium">Click to upload banner image</p>
                <p className="text-sm text-gray-500 mt-1">Recommended size: 1500x500 pixels. Max size: 5MB.</p>
              </div>
            </div>
          )}
          <Input
            ref={fileInputRef}
            id="banner-image"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
            disabled={isUploading}
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <Link href="/profile/banner-gallery" className="flex items-center text-blue-600 hover:text-blue-800 text-sm">
          <Grid className="h-4 w-4 mr-1" />
          Or choose from our banner gallery
        </Link>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => router.push("/profile")} disabled={isUploading}>
            Cancel
          </Button>
          <Button type="submit" disabled={!bannerImage || isUploading}>
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload Banner
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  )
}
