import { NextRequest, NextResponse } from "next/server"
import { checkAuth } from "@/lib/auth-utils"
import { createAdminClient } from "@/lib/supabase/admin"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET(req: NextRequest) {
  const authResult = await checkAuth()
  if (!authResult.authenticated || !authResult.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const requestId = searchParams.get("requestId")
  if (!requestId) {
    return NextResponse.json({ error: "requestId query parameter is required" }, { status: 400 })
  }

  const userId = authResult.userId
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    start(controller) {
      const send = (event: string, data: unknown) => {
        try {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`))
        } catch {}
      }

      let active = true
      let attempts = 0
      const maxAttempts = 60
      const pollIntervalMs = 3000

      const cleanup = () => {
        active = false
        try { controller.close() } catch {}
      }

      req.signal.addEventListener("abort", cleanup)

      const poll = async () => {
        if (!active) return

        if (attempts >= maxAttempts) {
          send("timeout", { message: "Virtual account generation timed out. Please try again." })
          cleanup()
          return
        }

        attempts++

        try {
          const admin = createAdminClient()
          const { data: events } = await admin
            .from("webhook_events")
            .select("payload, created_at")
            .eq("event_type", "virtual.account.created")
            .order("created_at", { ascending: false })
            .limit(20)

          if (events) {
            const matched = events.find((evt: any) => {
              const p = typeof evt.payload === "string" ? JSON.parse(evt.payload) : evt.payload
              return p?.requestId === requestId
            })

            if (matched) {
              const p = typeof matched.payload === "string" ? JSON.parse(matched.payload) : matched.payload
              const vaPayload = p?.payload || {}

              try {
                const admin2 = createAdminClient()
                await admin2.from("virtual_accounts").upsert({
                  user_id: userId,
                  email: "",
                  account_number: String(vaPayload.accountNumber || ""),
                  account_name: String(vaPayload.accountName || ""),
                  bank_name: String(vaPayload.bankName || "Strails"),
                  bank_code: "STRAILS",
                  currency: "NGN",
                  assigned: true,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                }, { onConflict: "user_id" })
              } catch (err) {
                console.error("SSE: Error persisting VA:", err)
              }

              send("virtual-account-ready", {
                virtualAccount: {
                  accountNumber: vaPayload.accountNumber,
                  accountName: vaPayload.accountName,
                  bankName: vaPayload.bankName,
                  vaId: vaPayload.vaId,
                },
                requestId,
              })

              cleanup()
              return
            }
          }
        } catch (error) {
          console.error("SSE poll error:", error)
        }

        if (active) {
          setTimeout(poll, pollIntervalMs)
        }
      }

      send("connected", { message: "Watching for virtual account...", requestId })
      setTimeout(poll, pollIntervalMs)
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  })
}
