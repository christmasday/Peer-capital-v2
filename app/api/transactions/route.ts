import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getCurrentUserId } from "@/lib/auth-utils"

export async function GET() {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const admin = createAdminClient()

    const { data: profile } = await admin
      .from("profiles")
      .select("sr_user_id")
      .eq("id", userId)
      .maybeSingle()

    const srUserId = profile?.sr_user_id || null
    const eventTypes = [
      "payments.confirmed",
      "wallet.funding.success",
      "wallet.funding.completed",
      "swaps.completed",
      "swaps.failed",
      "vault.return.transfer.confirmed",
      "vault.return.payout.completed",
      "vault.return.payout.failed",
    ]

    const { data, error } = await admin
      .from("webhook_events")
      .select("id, event_type, payload, processed, created_at")
      .in("event_type", eventTypes)
      .order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 })
    }

    const matchesUser = (payload: any) => {
      const affectedUserId = payload?.handlerResult?.affectedUserId
      const matchedUserId = payload?.matchedUserId
      const eventUserId = payload?.userId
      return (
        affectedUserId === userId ||
        matchedUserId === userId ||
        (Boolean(srUserId) && eventUserId === srUserId)
      )
    }

    const getStatus = (eventType: string) => {
      switch (eventType) {
        case "wallet.funding.success":
        case "wallet.funding.completed":
        case "swaps.completed":
        case "vault.return.payout.completed":
          return "completed"
        case "swaps.failed":
        case "vault.return.payout.failed":
          return "failed"
        default:
          return "pending"
      }
    }

    const getType = (eventType: string) => {
      if (eventType.startsWith("wallet.funding") || eventType === "payments.confirmed") {
        return "deposit"
      }
      if (eventType.startsWith("vault.return")) {
        return "withdrawal"
      }
      if (eventType.startsWith("swaps")) {
        return "swap"
      }
      return "transfer"
    }

    const getAmount = (payload: any) => {
      const value = payload?.amount ?? payload?.amountOut ?? payload?.amountIn ?? payload?.tokenAmount
      const parsed = Number(value)
      return Number.isFinite(parsed) ? parsed : 0
    }

    const getAsset = (payload: any, eventType: string) => {
      if (eventType.startsWith("swaps")) {
        return payload?.buyToken || payload?.sellToken || "cNGN"
      }
      return payload?.currency || "cNGN"
    }

    const getReference = (payload: any) => {
      return (
        payload?.transactionHash ||
        payload?.swapTxHash ||
        payload?.txRef ||
        payload?.requestId ||
        payload?.transactionReference ||
        payload?.transferId ||
        payload?.payoutId ||
        payload?.vaultReturnId ||
        ""
      )
    }

    const getDescription = (eventType: string, payload: any) => {
      switch (eventType) {
        case "payments.confirmed":
          return "Fiat payment confirmed for wallet funding"
        case "wallet.funding.success":
        case "wallet.funding.completed":
          return "Crypto wallet funded"
        case "swaps.completed":
          return `Asset swap ${payload?.sellToken || "asset"} to ${payload?.buyToken || "asset"}`
        case "swaps.failed":
          return `Asset swap failed: ${payload?.reason || "Unknown reason"}`
        case "vault.return.transfer.confirmed":
          return "Vault return transfer confirmed"
        case "vault.return.payout.completed":
          return "Offramp payout completed"
        case "vault.return.payout.failed":
          return `Offramp payout failed: ${payload?.reason || "Unknown reason"}`
        default:
          return eventType
      }
    }

    const seen = new Set<string>()
    const transactions = (data || [])
      .map((event: any) => {
        const payload = typeof event.payload === "string" ? JSON.parse(event.payload) : event.payload || {}
        return { event, payload }
      })
      .filter(({ payload }) => matchesUser(payload))
      .map(({ event, payload }) => {
        const reference = getReference(payload)
        const dedupeKey = `${event.event_type}:${reference}:${payload?.amount || payload?.amountOut || payload?.amountIn || ""}`
        if (seen.has(dedupeKey)) {
          return null
        }
        seen.add(dedupeKey)

        return {
          id: event.id,
          type: getType(event.event_type),
          status: getStatus(event.event_type),
          amount: getAmount(payload),
          asset: getAsset(payload, event.event_type),
          network: payload?.network || null,
          description: getDescription(event.event_type, payload),
          reference,
          transaction_hash: payload?.transactionHash || payload?.swapTxHash || null,
          event_type: event.event_type,
          created_at: event.created_at,
        }
      })
      .filter(Boolean)

    return NextResponse.json({ transactions })
  } catch {
    return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 })
  }
}
