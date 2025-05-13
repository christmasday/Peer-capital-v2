import { NextResponse } from "next/server"
import { setupStorage } from "@/lib/supabase/storage-setup"

export async function POST() {
  try {
    console.log("Storage initialization API route called")

    const result = await setupStorage()

    if (result.error) {
      console.error("Error initializing storage:", result.error)
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Storage initialized successfully" })
  } catch (error) {
    console.error("Unexpected error in storage initialization API route:", error)
    return NextResponse.json({ error: "An unexpected error occurred during storage initialization" }, { status: 500 })
  }
}
