import { NextResponse } from "next/server"
import { getTransactionContacts } from "@/lib/actions/contacts"

export async function GET() {
  try {
    const result = await getTransactionContacts()
    return NextResponse.json({ success: true, contacts: result.contacts || [] })
  } catch (error) {
    console.error("/api/contacts error:", error)
    return NextResponse.json({ success: false, contacts: [] }, { status: 500 })
  }
}
