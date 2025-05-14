import { type NextRequest, NextResponse } from "next/server"
import { checkBucketExists } from "@/lib/supabase/storage-setup"

export async function GET(request: NextRequest) {
  const bucketName = request.nextUrl.searchParams.get("bucket") || "profiles"

  try {
    console.log(`Checking if ${bucketName} bucket exists...`)

    const { exists, error } = await checkBucketExists(bucketName)

    if (error) {
      console.error(`Error checking bucket ${bucketName}:`, error)
      return NextResponse.json({ error: `Failed to check if ${bucketName} bucket exists: ${error}` }, { status: 500 })
    }

    if (!exists) {
      return NextResponse.json({ exists: false, message: `Bucket ${bucketName} does not exist` }, { status: 404 })
    }

    return NextResponse.json({ exists: true, message: `Bucket ${bucketName} exists` })
  } catch (error) {
    console.error(`Unexpected error checking bucket ${bucketName}:`, error)
    return NextResponse.json({ error: "An unexpected error occurred while checking the bucket" }, { status: 500 })
  }
}
