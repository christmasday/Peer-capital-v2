import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { type, name, account_number, bank_code, currency } = body
    if (!type || !name || !account_number || !bank_code || !currency) {
      return NextResponse.json({ status: false, message: "Missing required fields" }, { status: 400 })
    }
    const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY
    if (!PAYSTACK_SECRET_KEY) {
      return NextResponse.json({ status: false, message: "Paystack secret key not configured" }, { status: 500 })
    }
    const res = await fetch("https://api.paystack.co/transferrecipient", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ type, name, account_number, bank_code, currency }),
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (err: any) {
    return NextResponse.json({ status: false, message: err.message || "Internal server error" }, { status: 500 })
  }
} 