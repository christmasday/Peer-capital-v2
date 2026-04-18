import { NextRequest, NextResponse } from "next/server"
import { createStablesrailClient, StablesrailError } from "@/lib/stablesrail/client"
import { checkAuth } from "@/lib/auth-utils"
import { createAdminClient } from "@/lib/supabase/admin"
import { onboardUserSchema, ValidationError } from "@/lib/stablesrail/schemas"

export async function POST(req: NextRequest) {
  console.log('🟢 [API] onboard-user endpoint called')
  
  try {
    const body = await req.json()
    console.log('🟢 [API] Request body:', { bvn: body.bvn ? `${body.bvn.substring(0, 3)}...` : 'missing' })
    
    // Validate request using Zod schema
    const parseResult = onboardUserSchema.safeParse(body)
    if (!parseResult.success) {
      const fieldErrors = parseResult.error.flatten().fieldErrors
      console.error('🔴 [API] Validation failed:', fieldErrors)
      return NextResponse.json({ 
        error: "Validation failed", 
        fieldErrors 
      }, { status: 400 })
    }

    const validatedBody = parseResult.data

    console.log('🟢 [API] Creating Stablesrail client...')
    const stablesrail = createStablesrailClient()
    
    console.log('🟢 [API] Calling Stablesrail onboardUser...')
    const result = await stablesrail.onboardUser(validatedBody)
    console.log('🟢 [API] Stablesrail response:', result)

    // Extract requestId from response
    const requestId = (result as any)?.requestId || (result as any)?.data?.requestId
    const existingUser = Boolean((result as any)?.existingUser || (result as any)?.data?.existingUser)
    console.log('🟢 [API] Extracted requestId:', requestId)

    if (!requestId) {
      console.error('🔴 [API] No requestId found in Stablesrail response')
      return NextResponse.json({ 
        error: "No requestId received from Stablesrail",
        success: false 
      }, { status: 400 })
    }

    return NextResponse.json({ 
      success: true, 
      data: result,
      existingUser,
      requestId: requestId 
    })
  } catch (error) {
    if (error instanceof StablesrailError) {
      console.error('🔴 [API] StablesrailError:', error.message, error.responseCode)
      return NextResponse.json(
        { error: error.message, code: error.responseCode, details: error.details, success: false },
        { status: 400 }
      )
    }
    
    console.error('🔴 [API] Error in onboard-user:', error)
    return NextResponse.json({ error: "Internal server error", success: false }, { status: 500 })
  }
}
