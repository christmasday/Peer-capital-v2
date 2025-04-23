import { redirect } from "next/navigation"
import { MainLayout } from "@/components/layouts/main-layout"
import { getUserProfile } from "@/lib/actions/auth"
import { checkAuth } from "@/lib/auth-utils"
import { getTransactionById } from "@/lib/actions/transactions"
import { TransactionReceipt } from "@/components/receipts/transaction-receipt"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default async function TransactionReceiptPage({ params }: { params: { id: string } }) {
  // Check authentication
  await checkAuth()

  // Get user profile
  const userProfile = await getUserProfile()

  if (!userProfile) {
    redirect("/")
  }

  // Get transaction details
  const { transaction, error } = await getTransactionById(params.id)

  if (error || !transaction) {
    redirect("/transactions")
  }

  // Extract recipient details from description if it's a withdrawal
  let recipient = undefined
  if (transaction.type === "withdrawal") {
    const descriptionMatch = transaction.description.match(/Withdrawal to (.*) - (.*) $$(.*)$$/)
    if (descriptionMatch) {
      recipient = {
        bankName: descriptionMatch[1],
        accountNumber: descriptionMatch[2],
        accountName: descriptionMatch[3],
      }
    }
  }

  // Calculate fee for withdrawals (0.5% with min ₦100, max ₦1000)
  let fee = undefined
  if (transaction.type === "withdrawal") {
    fee = Math.min(Math.max(transaction.amount * 0.005, 100), 1000)
  }

  // Prepare transaction data for receipt
  const receiptData = {
    ...transaction,
    recipient,
    fee,
  }

  return (
    <MainLayout
      userName={userProfile.profile?.first_name || "User"}
      userImage={userProfile.profile?.profile_picture_url || "/vibrant-street-market.png"}
    >
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center mb-6">
          <Link href="/transactions">
            <Button variant="ghost" size="sm" className="gap-1">
              <ArrowLeft className="h-4 w-4" />
              Back to Transactions
            </Button>
          </Link>
        </div>

        <TransactionReceipt transaction={receiptData} />
      </div>
    </MainLayout>
  )
}
