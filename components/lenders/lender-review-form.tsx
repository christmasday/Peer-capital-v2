"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { StarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { submitLenderReview, getUserReviewForLender, getUserLoanHistory } from "@/lib/actions/lender-reviews"
import { useToast } from "@/hooks/use-toast"

interface LenderReviewFormProps {
  lenderId: string
  onReviewSubmitted?: () => void
}

export default function LenderReviewForm({ lenderId, onReviewSubmitted }: LenderReviewFormProps) {
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState("")
  const [selectedLoanId, setSelectedLoanId] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [existingReview, setExistingReview] = useState<any>(null)
  const [loans, setLoans] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      setError(null)

      try {
        // Check if user has already reviewed this lender
        const reviewResult = await getUserReviewForLender(lenderId)
        if (reviewResult.error) {
        } else if (reviewResult.data) {
          setExistingReview(reviewResult.data)
          setRating(reviewResult.data.rating)
          setComment(reviewResult.data.comment)
          setSelectedLoanId(reviewResult.data.loan_id || "")
        }

        // Get user's loan history with this lender
        const loansResult = await getUserLoanHistory(lenderId)
        if (loansResult.error) {
          setError("Failed to load loan history")
        } else if (loansResult.data) {
          setLoans(loansResult.data)

          // If no loan is selected and we have loans, select the first one
          if (!selectedLoanId && loansResult.data.length > 0) {
            setSelectedLoanId(loansResult.data[0].id)
          }
        }
      } catch (err) {
        setError("An error occurred while loading data")
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [lenderId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (rating === 0) {
      toast({
        title: "Rating required",
        description: "Please select a rating before submitting",
        variant: "destructive",
      })
      return
    }

    if (!comment.trim()) {
      toast({
        title: "Comment required",
        description: "Please provide a comment for your review",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const formData = new FormData()
      formData.append("lenderId", lenderId)
      formData.append("rating", rating.toString())
      formData.append("comment", comment)
      if (selectedLoanId) {
        formData.append("loanId", selectedLoanId)
      }

      const result = await submitLenderReview(formData)

      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Review submitted",
          description: existingReview ? "Your review has been updated" : "Your review has been submitted",
        })

        if (onReviewSubmitted) {
          onReviewSubmitted()
        }

        // Update the existing review state
        setExistingReview(result.data)
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-red-500">{error}</p>
        </CardContent>
      </Card>
    )
  }

  if (loans.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-gray-500">You can only review lenders you have borrowed from</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{existingReview ? "Update Your Review" : "Write a Review"}</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Select loan</label>
            <Select value={selectedLoanId} onValueChange={setSelectedLoanId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a loan" />
              </SelectTrigger>
              <SelectContent>
                {loans.map((loan) => (
                  <SelectItem key={loan.id} value={loan.id}>
                    ₦{loan.amount.toLocaleString()} - {loan.purpose} ({loan.status})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Rating</label>
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <StarIcon
                  key={star}
                  className={`h-8 w-8 cursor-pointer ${
                    star <= (hoverRating || rating) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
                  }`}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                />
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="comment" className="block text-sm font-medium mb-1">
              Comment
            </label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience with this lender..."
              rows={4}
            />
          </div>
        </CardContent>

        <CardFooter>
          <Button type="submit" disabled={isSubmitting || rating === 0 || !comment.trim()} className="w-full">
            {isSubmitting ? "Submitting..." : existingReview ? "Update Review" : "Submit Review"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
