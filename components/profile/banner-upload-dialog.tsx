"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Upload, ImageIcon, Camera, AlertCircle, RefreshCw } from "lucide-react"
import { uploadBannerImage, selectBannerImage } from "@/lib/actions/profile"
import Cookies from "js-cookie"

// Predefined banner images
const BANNER_IMAGES = [
  { url: "/banners/abstract-blue.png", name: "Abstract Blue" },
  { url: "/banners/mountain-landscape.png", name: "Mountain Landscape" },
  { url: "/banners/city-skyline.png", name: "City Skyline" },
  { url: "/banners/ocean-waves.png", name: "Ocean Waves" },
  { url: "/banners/forest-path.png", name: "Forest Path" },
  { url: "/banners/gradient-purple.png", name: "Gradient Purple" },
]

interface BannerUploadDialogProps {
  userId: string
  currentBannerUrl?: string | null
  children?: React.ReactNode
}

export function BannerUploadDialog({ userId, currentBannerUrl, children }: BannerUploadDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [bannerImage, setBannerImage] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isSelecting, setIsSelecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Check authentication when dialog opens
  useEffect(() => {
    if (open) {
      checkAuthentication()
    }
  }, [open])

  const checkAuthentication = () => {
    // Check for auth cookies or tokens
    const hasAuthCookie =
      Cookies.get("auth-status") === "authenticated" ||
      Cookies.get("sb-auth-token") !== undefined ||
      Cookies.get("jwt-token") !== undefined ||
      Cookies.get("custom-auth-token") !== undefined

    if (!hasAuthCookie) {
      setError("Authentication error. Please refresh the page and try again.")
      return false
    }

    setAuthChecked(true)
    return true
  }

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

  const handleUpload = async () => {
    if (!bannerImage) {
      setError("Please select an image to upload")
      return
    }

    if (!authChecked && !checkAuthentication()) {
      return
    }

    try {
      setIsUploading(true)
      setError(null)

      const result = await uploadBannerImage(bannerImage)

      if (result.error) {
        // Handle specific errors
        if (result.error.includes("logged in")) {
          setError("Authentication error. Please refresh the page and try again.")
          return
        }

        if (result.error.includes("Bucket not found")) {
          setError("Storage setup error. Please try again in a few moments while we set up the storage.")
          // Increment retry count for the next attempt
          setRetryCount((prev) => prev + 1)
          return
        }

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
      console.error("Error uploading banner:", err)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsUploading(false)
    }
  }

  const handleSelectBanner = async (bannerUrl: string) => {
    if (!authChecked && !checkAuthentication()) {
      return
    }

    try {
      setIsSelecting(true)
      setError(null)

      const result = await selectBannerImage(bannerUrl)

      if (result.error) {
        if (result.error.includes("logged in")) {
          // Handle auth error specifically
          setError("Authentication error. Please refresh the page and try again.")
          return
        }
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
      console.error("Error selecting banner:", err)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsSelecting(false)
    }
  }

  const resetState = () => {
    setBannerImage(null)
    setPreviewUrl(null)
    setError(null)
    setSuccess(false)
    setAuthChecked(false)
    // Don't reset retry count to allow for progressive backoff
  }

  const handleRetry = () => {
    if (bannerImage) {
      handleUpload()
    }
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
            className="absolute bottom-4 right-4 bg-white rounded-full shadow-md hover:bg-gray-100"
          >
            <Camera className="h-5 w-5 text-gray-700" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Update Profile Banner</DialogTitle>
        </DialogHeader>

        {error && (
          <Alert variant="destructive" className="mt-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>{error}</span>
              {error.includes("Storage setup") && (
                <Button variant="outline" size="sm" onClick={handleRetry} className="ml-2" disabled={isUploading}>
                  {isUploading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-1" />
                  )}
                  Retry
                </Button>
              )}
            </AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mt-2">
            <AlertDescription>Your banner image has been updated successfully!</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="upload" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">Upload Image</TabsTrigger>
            <TabsTrigger value="gallery">Choose from Gallery</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4 mt-4">
            <div className="space-y-2">
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                {previewUrl ? (
                  <div className="space-y-4">
                    <div className="relative w-full h-48 rounded-lg overflow-hidden mx-auto">
                      <Image
                        src={previewUrl || "/placeholder.svg"}
                        alt="Banner Preview"
                        fill
                        className="object-cover"
                      />
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

            <div className="flex justify-end gap-3 mt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isUploading}>
                Cancel
              </Button>
              <Button onClick={handleUpload} disabled={!bannerImage || isUploading}>
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
          </TabsContent>

          <TabsContent value="gallery" className="mt-4">
            <div className="grid grid-cols-2 gap-4">
              {BANNER_IMAGES.map((banner) => (
                <div
                  key={banner.url}
                  className="relative cursor-pointer group rounded-lg overflow-hidden border border-gray-200 hover:border-blue-500 transition-colors"
                  onClick={() => !isSelecting && handleSelectBanner(banner.url)}
                >
                  <div className="relative h-32">
                    <Image
                      src={banner.url || "/placeholder.svg"}
                      alt={banner.name}
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                    />
                  </div>
                  <div className="p-2 bg-white border-t border-gray-200">
                    <p className="text-sm font-medium">{banner.name}</p>
                  </div>
                  {isSelecting && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <Loader2 className="h-8 w-8 text-white animate-spin" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
