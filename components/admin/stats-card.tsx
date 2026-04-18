import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface StatsCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  change?: number
  changeLabel?: string
  className?: string
}

export function StatsCard({ 
  title, 
  value, 
  icon: Icon, 
  change, 
  changeLabel,
  className 
}: StatsCardProps) {
  const isPositive = change && change > 0
  const isNegative = change && change < 0
  const TrendIcon = isPositive ? TrendingUp : TrendingDown

  return (
    <Card className={cn("transition-all duration-200 hover:shadow-lg hover:scale-105 bg-white border border-slate-200 shadow-sm", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-slate-600">
          {title}
        </CardTitle>
        <div className="p-2 rounded-lg bg-blue-100">
          <Icon className="h-4 w-4 text-blue-600" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-slate-900 mb-2">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>
        {change !== undefined && (
          <div className={cn(
            "flex items-center text-sm font-medium",
            isPositive ? "text-blue-600" : isNegative ? "text-red-600" : "text-slate-500"
          )}>
            {change !== 0 && <TrendIcon className="h-4 w-4 mr-1" />}
            <span>
              {change > 0 ? '+' : ''}{change}%
              {changeLabel && ` ${changeLabel}`}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
