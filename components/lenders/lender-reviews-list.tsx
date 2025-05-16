"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { StarIcon } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

type LenderReview = {
  id: string
  reviewer_id: string
  lender_id: string
  rating: number
  comment: string
  loan_id?: string | null
  created_at: string
  updated_at: string
  reviewer?: {
    first_name: string | null
    last_name: string | null
    profile_picture_url: string | null
  }
}

interface LenderReviewsListProps {
  reviews: LenderReview[]
}

export default function LenderReviewsList({ reviews }: LenderReviewsListProps) {
  const [sortBy, setSortBy] = useState<"newest" | "highest" | "lowest">("newest")

  const sortedReviews = [...reviews].sort((a, b) => {
    if (sortBy === "newest") {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    } else if (sortBy === "highest") {
      return b.rating - a.rating
    } else {
      return a.rating - b.rating
    }
  })

  const averageRating =
    reviews.length > 0 ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-col">
          <h3 className="text-2xl font-bold">Reviews ({reviews.length})</h3>
          {reviews.length > 0 && (
            <div className="flex items-center mt-1">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <StarIcon
                    key={star}
                    className={`h-5 w-5 ${
                      star <= Math.round(averageRating) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              <span className="ml-2 text-sm text-gray-600">{averageRating.toFixed(1)} out of 5</span>
            </div>
          )}
        </div>

        {reviews.length > 1 && (
          <div className="flex items-center">
            <span className="text-sm text-gray-600 mr-2">Sort by:</span>
            <select
              className="text-sm border rounded p-1"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
            >
              <option value="newest">Newest first</option>
              <option value="highest">Highest rating</option>
              <option value="lowest">Lowest rating</option>
            </select>
          </div>
        )}
      </div>

      {reviews.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-gray-500">No reviews yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sortedReviews.map((review) => (
            <Card key={review.id} className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Avatar className="h-10 w-10">
                    <AvatarImage
                      src={review.reviewer?.profile_picture_url || ""}
                      alt={`${review.reviewer?.first_name || ""} ${review.reviewer?.last_name || ""}`}
                    />
                    <AvatarFallback>
                      {review.reviewer?.first_name?.[0] || ""}
                      {review.reviewer?.last_name?.[0] || ""}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2">
                      <div>
                        <h4 className="font-medium">
                          {review.reviewer?.first_name || ""} {review.reviewer?.last_name || ""}
                        </h4>
                        <div className="flex items-center mt-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <StarIcon
                              key={star}
                              className={`h-4 w-4 ${
                                star <= review.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="text-sm text-gray-500 mt-1 sm:mt-0">
                        {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                        {review.loan_id && (
                          <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">
                            Verified loan
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-gray-700 mt-2">{review.comment}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
