import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { StarIcon } from "lucide-react"

interface UserReviewProps {
  reviewerName: string
  reviewerAvatar?: string
  rating: number
  date: string
  comment: string
}

export function UserReview({ reviewerName, reviewerAvatar, rating, date, comment }: UserReviewProps) {
  // Generate initials for avatar fallback
  const initials = reviewerName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2)

  return (
    <Card className="border-0 shadow-none">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <Avatar>
            <AvatarImage src={reviewerAvatar || "/placeholder.svg"} alt={reviewerName} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2">
              <div>
                <h4 className="font-medium">{reviewerName}</h4>
                <p className="text-sm text-muted-foreground">{date}</p>
              </div>

              <div className="flex items-center mt-1 sm:mt-0">
                {Array.from({ length: 5 }).map((_, i) => (
                  <StarIcon
                    key={i}
                    className={`h-4 w-4 ${i < rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
                  />
                ))}
              </div>
            </div>

            <p className="text-gray-700">{comment}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
