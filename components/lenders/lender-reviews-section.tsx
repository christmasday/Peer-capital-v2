"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import LenderReviewsList from "./lender-reviews-list"
import LenderReviewForm from "./lender-review-form"
import { getLenderReviews } from "@/lib/actions/lender-reviews"

interface LenderReviewsSectionProps {
  lenderId: string
}

export default function LenderReviewsSection({ lenderId }: LenderReviewsSectionProps) {
  const [reviews, setReviews] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadReviews = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await getLenderReviews(lenderId)

      if (result.error) {
        setError(result.error)
      } else {
        setReviews(result.data || [])
      }
    } catch (err) {
      console.error(err)
      setError("An error occurred while loading reviews")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadReviews()
  }, [lenderId])

  const handleReviewSubmitted = () => {
    loadReviews()
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="py-8">
        <p className="text-center text-red-500">{error}</p>
      </div>
    )
  }

  return (
    <div className="py-6">
      <Tabs defaultValue="reviews">
        <TabsList className="mb-6">
          <TabsTrigger value="reviews">All Reviews ({reviews.length})</TabsTrigger>
          <TabsTrigger value="write">Write a Review</TabsTrigger>
        </TabsList>

        <TabsContent value="reviews">
          <LenderReviewsList reviews={reviews} />
        </TabsContent>

        <TabsContent value="write">
          <LenderReviewForm lenderId={lenderId} onReviewSubmitted={handleReviewSubmitted} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
