import { NextResponse } from "next/server"
import { getCurrentUserId } from "@/lib/auth-utils"
import { getBorrowerMaxAmount, getLoanPolicySnapshot } from "@/lib/loan-policies.server"

export async function GET() {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const [borrowerMaxAmount, policySnapshot] = await Promise.all([
      getBorrowerMaxAmount(userId),
      getLoanPolicySnapshot(),
    ])

    const currentBorrowerPolicy =
      policySnapshot.borrowerPolicies.find((policy) => borrowerMaxAmount >= policy.min && borrowerMaxAmount <= policy.max) ??
      policySnapshot.borrowerPolicies[policySnapshot.borrowerPolicies.length - 1]

    return NextResponse.json({
      borrowerMaxAmount,
      borrowerPolicies: policySnapshot.borrowerPolicies,
      currentBorrowerPolicy,
    })
  } catch (error) {
    console.error("Failed to load loan limits:", error)
    return NextResponse.json({ error: "Failed to load loan limits" }, { status: 500 })
  }
}