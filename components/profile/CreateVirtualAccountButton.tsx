"use client"
import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
// Removed Paystack virtual account integration

export function CreateVirtualAccountButton() {
  const [loading, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleCreate = () => {}

  return (
    <div>
      <Button disabled className="w-full">Create Virtual Account</Button>
      {error && <div className="text-red-600 text-xs mt-2">{error}</div>}
      {success && <div className="text-green-600 text-xs mt-2">Virtual account created!</div>}
    </div>
  )
} 