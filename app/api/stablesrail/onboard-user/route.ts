import { NextRequest, NextResponse } from "next/server"
import { createStablesrailClient, StablesrailError } from "@/lib/stablesrail/client"
import { checkAuth } from "@/lib/auth-utils"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(req: NextRequest) {
  console.log('🟢 [API] onboard-user endpoint called')
  
  try {
    const body = await req.json()
    console.log('🟢 [API] Request body:', { bvn: body.bvn ? `${body.bvn.substring(0, 3)}...` : 'missing' })
    
    // Basic validation
    if (!body || typeof body !== "object") {
      console.error('🔴 [API] Invalid request body')
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }

    // Validate BVN if provided
    if (body.bvn && !/^\d{11}$/.test(body.bvn)) {
      console.error('🔴 [API] Invalid BVN format:', body.bvn)
      return NextResponse.json({ error: "BVN must be exactly 11 digits" }, { status: 400 })
    }

    console.log('🟢 [API] Creating Stablesrail client...')
    const stablesrail = createStablesrailClient()
    
    console.log('🟢 [API] Calling Stablesrail onboardUser...')
    const result = await stablesrail.onboardUser(body)
    console.log('🟢 [API] Stablesrail response:', result)

    // Extract requestId from response
    const requestId = (result as any)?.requestId || (result as any)?.data?.requestId
    console.log('🟢 [API] Extracted requestId:', requestId)

    return NextResponse.json({ 
      success: true, 
      data: result,
      requestId: requestId 
    })
  } catch (error) {
    if (error instanceof StablesrailError) {
      console.error('🔴 [API] StablesrailError:', error.message, error.responseCode)
      return NextResponse.json(
        { error: error.message, code: error.responseCode, details: error.details },
        { status: 400 }
      )
    }
    
    console.error('🔴 [API] Error in onboard-user:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
