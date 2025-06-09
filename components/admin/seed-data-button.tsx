"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { seedTransactionData, seedLoanRequestData } from "@/lib/actions/seed-data"
import { useToast } from "@/hooks/use-toast"

interface SeedDataButtonProps {
  userId: string
}

export function SeedDataButton({ userId }: SeedDataButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleSeedData = async () => {
    try {
      setIsLoading(true)

      // Seed transactions
      const transactionResult = await seedTransactionData(userId)
      if (transactionResult.error) {
        toast({
          title: "Error seeding transactions",
          description: transactionResult.error,
          variant: "destructive",
        })
        return
      }

      // Seed loan requests
      const loanResult = await seedLoanRequestData(userId)
      if (loanResult.error) {
        toast({
          title: "Error seeding loan requests",
          description: loanResult.error,
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Sample data created",
        description: "Sample transactions and loan requests have been added to your account.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button onClick={handleSeedData} disabled={isLoading} variant="outline" size="sm">
      {isLoading ? "Creating Sample Data..." : "Create Sample Data"}
    </Button>
  )
}
