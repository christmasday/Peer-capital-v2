import { Star } from "lucide-react"
import type { ProfileMetrics } from "@/lib/actions/profile-metrics"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface ProfileMetricsCardProps {
  metrics: ProfileMetrics
  compact?: boolean
}

function renderStars(rating: number) {
  return Array.from({ length: 5 }, (_, index) => (
    <Star
      key={index}
      className={index < rating ? "h-4 w-4 fill-yellow-400 text-yellow-400" : "h-4 w-4 text-gray-300"}
    />
  ))
}

export function ProfileMetricsCard({ metrics, compact = false }: ProfileMetricsCardProps) {
  if (compact) {
    return (
      <div className="mt-3 w-full">
        <div className="flex gap-6 items-center text-sm text-gray-700">
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Loans Taken</span>
            <span className="font-medium">{metrics.loansTaken}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Loans Given</span>
            <span className="font-medium">{metrics.loansGiven}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Payback</span>
            <span className="flex items-center gap-1">{renderStars(metrics.paybackRating)} <span className="text-xs text-muted-foreground">{metrics.paybackRating}/5</span></span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Credit Level</span>
            <span className="font-medium">{metrics.creditLevel}</span>
          </div>
          <div className="flex flex-col ml-auto">
            <span className="text-xs text-muted-foreground">Funding Tier</span>
            <Badge variant="secondary">{metrics.fundingTier}</Badge>
          </div>
        </div>
      </div>
    )
  }

  return (
    <Card className="shadow-sm border-gray-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Profile Metrics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="rounded-lg border bg-muted/30 p-4">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Loans Taken</div>
            <div className="mt-2 text-2xl font-bold">{metrics.loansTaken}</div>
          </div>
          <div className="rounded-lg border bg-muted/30 p-4">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Loans Given</div>
            <div className="mt-2 text-2xl font-bold">{metrics.loansGiven}</div>
          </div>
          <div className="rounded-lg border bg-muted/30 p-4">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Payback Rating</div>
            <div className="mt-2 flex items-center gap-1">{renderStars(metrics.paybackRating)}</div>
            <div className="mt-1 text-sm text-muted-foreground">{metrics.paybackRating}/5 stars</div>
          </div>
          <div className="rounded-lg border bg-muted/30 p-4">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Credit Level</div>
            <div className="mt-2 flex items-center gap-2">
              <div className="text-2xl font-bold">{metrics.creditLevel}</div>
              <Badge variant="secondary">1-11</Badge>
            </div>
          </div>
          <div className="rounded-lg border bg-muted/30 p-4">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Funding Tier</div>
            <div className="mt-2 flex items-center gap-2">
              <div className="text-2xl font-bold">{metrics.fundingTier}</div>
              <Badge variant="secondary">1-3</Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
