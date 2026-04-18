"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Star } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { createBrowserClient } from "@/lib/supabase/client"

interface LoanHistoryWithLenderProps {
  lenderId: string
  onSelectLoan?: (loanId: string) => void
}

export function LoanHistoryWithLender({ lenderId, onSelectLoan }: LoanHistoryWithLenderProps) {
  const [loans, setLoans] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  const supabase = createBrowserClient()

  useEffect(() => {
    const fetchLoans = async () => {
      try {
        setIsLoading(true)

        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session) {
          setError("You must be logged in to view loan history")
          return
        }

        const { data, error } = await supabase
          .from("loans")
          .select(`
            id,
            amount,
            duration,
            interest_rate,
            status,
            created_at
          `)
          .eq("borrower_id", session.user.id)
          .eq("lender_id", lenderId)
          .in("status", ["COMPLETED", "ACTIVE", "REPAID"])
          .order("created_at", { ascending: false })

        if (error) {
          throw error
        }

        setLoans(data || [])
      } catch (err) {
        setError("Failed to load loan history")
        toast({
          title: "Error",
          description: "Failed to load loan history",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchLoans()
  }, [lenderId, supabase, toast])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amount)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
      case "REPAID":
        return "text-green-600 bg-green-100"
      case "ACTIVE":
        return "text-blue-600 bg-blue-100"
      default:
        return "text-gray-600 bg-gray-100"
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-6">
          <p className="text-red-500">{error}</p>
        </CardContent>
      </Card>
    )
  }

  if (loans.length === 0) {
    return (
      <Card>
        <CardContent className="py-6">
          <p className="text-center text-gray-500">
            You haven't taken any loans from this lender yet. You can only review lenders you've borrowed from.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Your Loan History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {loans.map((loan) => (
            <div key={loan.id} className="border rounded-md p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-medium">{formatCurrency(loan.amount)}</p>
                  <p className="text-sm text-gray-500">
                    {loan.duration} {loan.duration === 1 ? "month" : "months"} at {loan.interest_rate}% interest
                  </p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(loan.status)}`}>
                  {loan.status}
                </span>
              </div>
              <div className="flex justify-between items-center mt-3">
                <span className="text-xs text-gray-500">Taken on {formatDate(loan.created_at)}</span>
                {onSelectLoan && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onSelectLoan(loan.id)}
                    className="flex items-center gap-1"
                  >
                    <Star className="h-3 w-3" />
                    Review This Loan
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
