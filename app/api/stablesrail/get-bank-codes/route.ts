import { NextRequest, NextResponse } from "next/server"
import { createStablesrailClient, StablesrailError } from "@/lib/stablesrail/client"
import { checkAuth } from "@/lib/auth-utils"

export async function GET(req: NextRequest) {
  try {
    const auth = await checkAuth()
    if (!auth.authenticated || !auth.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const stablesrail = createStablesrailClient()
    const result: any = await stablesrail.getBankCodes()
    
    // Normalize bank data structure - handle both 'name'/'bank_name' and 'code'/'bank_code'
    let banks = []
    if (result?.banks && Array.isArray(result.banks)) {
      banks = result.banks.map((bank: any) => ({
        name: bank.name || bank.bank_name || bank.BankName || '',
        code: bank.code || bank.bank_code || bank.BankCode || ''
      })).filter((bank: { name: string; code: string }) => bank.name && bank.code)
    } else if (result?.data?.banks && Array.isArray(result.data.banks)) {
      banks = result.data.banks.map((bank: any) => ({
        name: bank.name || bank.bank_name || bank.BankName || '',
        code: bank.code || bank.bank_code || bank.BankCode || ''
      })).filter((bank: { name: string; code: string }) => bank.name && bank.code)
    }
    
    // Sort banks alphabetically by name (case-insensitive)
    banks.sort((a: { name: string; code: string }, b: { name: string; code: string }) => 
      a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
    )
    
    return NextResponse.json({ 
      success: true, 
      data: {
        ...result,
        banks: banks.length > 0 ? banks : (result?.banks || result?.data?.banks || [])
      }
    })
  } catch (error) {
    if (error instanceof StablesrailError) {
      return NextResponse.json(
        { error: error.message, code: error.responseCode, details: error.details },
        { status: 400 },
      )
    }
    console.error("Error fetching bank codes:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
