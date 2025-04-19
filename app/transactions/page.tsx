import { redirect } from "next/navigation"
import { format } from "date-fns"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getUserTransactions } from "@/lib/actions/transactions"
import { MainLayout } from "@/components/layouts/main-layout"
import { getUserProfile } from "@/lib/actions/auth"
import { checkAuth } from "@/lib/auth-utils"

export default async function TransactionsPage() {
  // Check authentication
  await checkAuth()

  // Get user profile
  const userProfile = await getUserProfile()

  if (!userProfile) {
    redirect("/")
  }

  // Get the user's transactions
  const { transactions, error } = await getUserTransactions()

  if (error) {
    console.error("Error fetching transactions:", error)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "failed":
        return "bg-red-100 text-red-800"
      case "cancelled":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "deposit":
        return "↓"
      case "withdrawal":
        return "↑"
      case "loan_request":
        return "⟳"
      case "loan_repayment":
        return "⟲"
      case "transfer":
        return "↔"
      default:
        return "•"
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "deposit":
        return "text-green-600"
      case "withdrawal":
        return "text-red-600"
      case "loan_request":
        return "text-blue-600"
      case "loan_repayment":
        return "text-orange-600"
      case "transfer":
        return "text-purple-600"
      default:
        return "text-gray-600"
    }
  }

  return (
    <MainLayout
      userName={userProfile.profile?.first_name || "User"}
      userImage={userProfile.profile?.profile_picture_url || "/vibrant-street-market.png"}
    >
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Transaction History</h1>

        {transactions && transactions.length > 0 ? (
          <div className="space-y-4">
            {transactions.map((transaction: any) => (
              <Card key={transaction.id}>
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-0">
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-10 w-10 rounded-full flex items-center justify-center ${getTypeColor(transaction.type)} bg-opacity-10`}
                      >
                        <span className="text-xl">{getTypeIcon(transaction.type)}</span>
                      </div>
                      <div>
                        <h3 className="font-medium">{transaction.description}</h3>
                        <p className="text-sm text-gray-500">
                          {format(new Date(transaction.created_at), "MMM d, yyyy • h:mm a")}
                        </p>
                      </div>
                    </div>
                    <div className="text-right sm:ml-4">
                      <p
                        className={`font-bold ${transaction.type === "deposit" ? "text-green-600" : transaction.type === "withdrawal" ? "text-red-600" : "text-blue-600"}`}
                      >
                        {transaction.type === "deposit" ? "+" : transaction.type === "withdrawal" ? "-" : ""}
                        {formatCurrency(transaction.amount)}
                      </p>
                      <Badge className={`mt-1 ${getStatusColor(transaction.status)}`}>
                        {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <h3 className="text-lg font-medium mb-2">No Transactions</h3>
                <p className="text-gray-500">
                  You haven't made any transactions yet. Fund your account or request a loan to get started.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  )
}
