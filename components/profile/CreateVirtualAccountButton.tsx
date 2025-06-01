"use client"
import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { createVirtualAccount } from "@/lib/actions/paystack"

export function CreateVirtualAccountButton() {
  const [loading, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleCreate = () => {
    setError(null)
    setSuccess(false)
    startTransition(async () => {
      const result = await createVirtualAccount()
      if (result?.success) {
        setSuccess(true)
        window.location.reload()
      } else {
        setError(result?.error || result?.message || "Failed to create virtual account")
      }
    })
  }

  return (
    <div>
      <Button onClick={handleCreate} disabled={loading} className="w-full">
        {loading ? "Creating..." : "Create Virtual Account"}
      </Button>
      {error && <div className="text-red-600 text-xs mt-2">{error}</div>}
      {success && <div className="text-green-600 text-xs mt-2">Virtual account created!</div>}
    </div>
  )
} 