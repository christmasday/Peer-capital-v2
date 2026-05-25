import { NextRequest, NextResponse } from "next/server"
import { getCurrentUserId } from "@/lib/auth-utils"
import { createLoanOfferFromSearchAlert } from "@/lib/actions/loan-offers"

export async function GET(request: NextRequest) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.redirect(new URL("/login?from=loan-offer", request.url))
    }

    const { searchParams } = new URL(request.url)
    const subscriptionId = searchParams.get("subscriptionId")
    const entityId = searchParams.get("entityId")

    if (!subscriptionId || !entityId) {
      return NextResponse.json({ error: "Missing subscriptionId or entityId" }, { status: 400 })
    }

    const result = await createLoanOfferFromSearchAlert({
      subscriptionId,
      lenderUserId: userId,
      deliveryEntityId: entityId,
    })

    if (!result.success || !result.offer) {
      return NextResponse.redirect(new URL("/loans?offer=failed", request.url))
    }

    return NextResponse.redirect(new URL(`/loan-offers/${result.offer.id}`, request.url))
  } catch (error) {
    return NextResponse.redirect(new URL("/loans?offer=failed", request.url))
  }
}
