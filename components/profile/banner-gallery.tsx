"use client"

import { useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Check, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { selectBannerImage } from "@/lib/actions/profile"

// Define the banner images
const bannerImages = [
  {
    id: "abstract-blue",
    url: "/banners/abstract-blue.png",
    name: "Abstract Blue",
    description: "Blue abstract geometric pattern",
  },
  {
    id: "mountain-landscape",
    url: "/banners/mountain-landscape.png",
    name: "Mountain Landscape",
    description: "Serene mountain landscape at sunset",
  },
  {
    id: "city-skyline",
    url: "/banners/city-skyline.png",
    name: "City Skyline",
    description: "Modern city skyline at dusk",
  },
  {
    id: "ocean-waves",
    url: "/banners/ocean-waves.png",
    name: "Ocean Waves",
    description: "Calm ocean waves on a beach",
  },
  {
    id: "forest-path",
    url: "/banners/forest-path.png",
    name: "Forest Path",
    description: "Sunlit path through a green forest",
  },
  {
    id: "gradient-purple",
    url: "/banners/gradient-purple.png",
    name: "Purple Gradient",
    description: "Smooth purple gradient background",
  },
]

interface BannerGalleryProps {
  currentBannerId?: string
}

export function BannerGallery({ currentBannerId }: BannerGalleryProps) {
  const router = useRouter()
  const [selectedBannerId, setSelectedBannerId] = useState<string | null>(currentBannerId || null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSelectBanner = async () => {
    if (!selectedBannerId) {
      setError("Please select a banner image")
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)

      const selectedBanner = bannerImages.find((banner) => banner.id === selectedBannerId)

      if (!selectedBanner) {
        setError("Selected banner not found")
        return
      }

      const result = await selectBannerImage(selectedBanner.url)

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
    } catch (err) {
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {bannerImages.map((banner) => (
          <Card
            key={banner.id}
            className={`overflow-hidden cursor-pointer transition-all ${
              selectedBannerId === banner.id ? "ring-2 ring-blue-500 ring-offset-2" : "hover:shadow-md"
            }`}
            onClick={() => setSelectedBannerId(banner.id)}
          >
            <div className="relative h-32 w-full">
              <Image src={banner.url || "/placeholder.svg"} alt={banner.name} fill className="object-cover" />
              {selectedBannerId === banner.id && (
                <div className="absolute top-2 right-2 bg-blue-500 rounded-full p-1">
                  <Check className="h-4 w-4 text-white" />
                </div>
              )}
            </div>
            <CardContent className="p-3">
              <h3 className="font-medium">{banner.name}</h3>
              <p className="text-sm text-gray-500">{banner.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-end mt-6">
        <Button
          onClick={handleSelectBanner}
          disabled={!selectedBannerId || isSubmitting}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Applying...
            </>
          ) : (
            "Apply Selected Banner"
          )}
        </Button>
      </div>
    </div>
  )
}
