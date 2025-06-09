"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

export function BeneficiariesList({ userId }: { userId: string }) {
  const [beneficiaries, setBeneficiaries] = useState<any[]>([])
  const [isBeneficiaryModalOpen, setIsBeneficiaryModalOpen] = useState(false)
  const [beneficiaryAccountNumber, setBeneficiaryAccountNumber] = useState("")
  const [beneficiaryBank, setBeneficiaryBank] = useState("")
  const [beneficiaryBanks, setBeneficiaryBanks] = useState<{ name: string; code: string }[]>([])
  const [beneficiaryAccountName, setBeneficiaryAccountName] = useState("")
  const [isResolving, setIsResolving] = useState(false)
  const [resolveError, setResolveError] = useState("")
  const [isAdding, setIsAdding] = useState(false)
  const [addError, setAddError] = useState("")
  const [isLoadingBeneficiaries, setIsLoadingBeneficiaries] = useState(false)
  const [beneficiariesError, setBeneficiariesError] = useState("")
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [removeError, setRemoveError] = useState("")

  // Fetch banks on mount
  useEffect(() => {
    async function fetchBanks() {
      try {
        const res = await fetch("https://api.paystack.co/bank", {
          headers: { Authorization: `Bearer ${process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || ""}` },
        })
        const data = await res.json()
        if (data.status && Array.isArray(data.data)) {
          setBeneficiaryBanks(data.data.map((bank: any) => ({ name: bank.name, code: bank.code })))
        }
      } catch {}
    }
    fetchBanks()
  }, [])

  // Resolve account name
  useEffect(() => {
    async function resolveAccount() {
      if (beneficiaryBank && beneficiaryAccountNumber.length === 10) {
        setIsResolving(true)
        setResolveError("")
        try {
          const bankCode = beneficiaryBanks.find(b => b.name === beneficiaryBank)?.code
          const res = await fetch("/api/paystack/resolve-account", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ account_number: beneficiaryAccountNumber, bank_code: bankCode }),
          })
          const data = await res.json()
          if (data.status && data.data && data.data.account_name) {
            setBeneficiaryAccountName(data.data.account_name)
          } else {
            setResolveError("Could not resolve account name")
            setBeneficiaryAccountName("")
          }
        } catch {
          setResolveError("Could not resolve account name")
          setBeneficiaryAccountName("")
        } finally {
          setIsResolving(false)
        }
      } else {
        setBeneficiaryAccountName("")
        setResolveError("")
      }
    }
    resolveAccount()
  }, [beneficiaryBank, beneficiaryAccountNumber])

  // Fetch beneficiaries on mount and when modal closes
  useEffect(() => {
    setIsLoadingBeneficiaries(true)
    setBeneficiariesError("")
    fetch("/api/beneficiaries", { credentials: "include" })
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to fetch beneficiaries")
        const data = await res.json()
        setBeneficiaries(data.beneficiaries || [])
      })
      .catch((err) => {
        setBeneficiariesError(err.message || "Failed to fetch beneficiaries")
      })
      .finally(() => setIsLoadingBeneficiaries(false))
  }, [isBeneficiaryModalOpen])

  const handleAddBeneficiary = async () => {
    setIsAdding(true)
    setAddError("")
    try {
      // Call Paystack transferrecipient API
      const bankCode = beneficiaryBanks.find(b => b.name === beneficiaryBank)?.code
      const res = await fetch("/api/paystack/transferrecipient", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "nuban",
          name: beneficiaryAccountName,
          account_number: beneficiaryAccountNumber,
          bank_code: bankCode,
          currency: "NGN",
        }),
      })
      const data = await res.json()
      if (!data.status || !data.data?.recipient_code) throw new Error(data.message || "Failed to add beneficiary")
      // Save beneficiary in DB
      const saveRes = await fetch("/api/beneficiaries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          account_name: beneficiaryAccountName,
          account_number: beneficiaryAccountNumber,
          bank_name: beneficiaryBank,
          bank_code: bankCode,
          recipient_code: data.data.recipient_code,
        }),
        credentials: "include",
      })
      if (!saveRes.ok) {
        const errData = await saveRes.json()
        throw new Error(errData.error || "Failed to save beneficiary")
      }
      setIsBeneficiaryModalOpen(false)
      setBeneficiaryAccountNumber("")
      setBeneficiaryBank("")
      setBeneficiaryAccountName("")
      // Refresh beneficiaries list
      setIsLoadingBeneficiaries(true)
      fetch("/api/beneficiaries", { credentials: "include" })
        .then(async (res) => {
          if (!res.ok) throw new Error("Failed to fetch beneficiaries")
          const data = await res.json()
          setBeneficiaries(data.beneficiaries || [])
        })
        .catch((err) => {
          setBeneficiariesError(err.message || "Failed to fetch beneficiaries")
        })
        .finally(() => setIsLoadingBeneficiaries(false))
    } catch (err: any) {
      setAddError(err.message || "Failed to add beneficiary")
    } finally {
      setIsAdding(false)
    }
  }

  const handleRemoveBeneficiary = async (id: string) => {
    setRemovingId(id)
    setRemoveError("")
    try {
      const res = await fetch("/api/beneficiaries", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
        credentials: "include",
      })
      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || "Failed to remove beneficiary")
      }
      // Refresh beneficiaries list
      setIsLoadingBeneficiaries(true)
      fetch("/api/beneficiaries", { credentials: "include" })
        .then(async (res) => {
          if (!res.ok) throw new Error("Failed to fetch beneficiaries")
          const data = await res.json()
          setBeneficiaries(data.beneficiaries || [])
        })
        .catch((err) => {
          setBeneficiariesError(err.message || "Failed to fetch beneficiaries")
        })
        .finally(() => setIsLoadingBeneficiaries(false))
    } catch (err: any) {
      setRemoveError(err.message || "Failed to remove beneficiary")
    } finally {
      setRemovingId(null)
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Saved Beneficiaries</h3>
        <Dialog open={isBeneficiaryModalOpen} onOpenChange={setIsBeneficiaryModalOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="icon" className="rounded-full h-12 w-12 flex items-center justify-center text-2xl" onClick={() => setIsBeneficiaryModalOpen(true)}>
              <Plus className="h-8 w-8" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Beneficiary</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label>Account Number</label>
                <input type="text" value={beneficiaryAccountNumber} onChange={e => setBeneficiaryAccountNumber(e.target.value)} maxLength={10} className="w-full border p-2 rounded" />
              </div>
              <div>
                <label>Bank</label>
                <select value={beneficiaryBank} onChange={e => setBeneficiaryBank(e.target.value)} className="w-full border p-2 rounded">
                  <option value="">Select Bank</option>
                  {beneficiaryBanks.map(bank => <option key={bank.code} value={bank.name}>{bank.name}</option>)}
                </select>
              </div>
              <div>
                <label>Account Name</label>
                <input type="text" value={beneficiaryAccountName} disabled className="w-full border p-2 rounded bg-gray-100" />
                {isResolving && <div className="text-xs text-blue-500 mt-1">Resolving account name...</div>}
                {resolveError && <div className="text-xs text-red-500 mt-1">{resolveError}</div>}
              </div>
              <Button onClick={handleAddBeneficiary} disabled={isAdding || !beneficiaryAccountName || isResolving} className="w-full">
                {isAdding ? "Adding..." : "Add Beneficiary"}
              </Button>
              {addError && <div className="text-xs text-red-500 mt-1 text-red-600">{addError}</div>}
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="space-y-2">
        {isLoadingBeneficiaries ? (
          <div className="text-gray-500">Loading beneficiaries...</div>
        ) : beneficiariesError ? (
          <div className="text-red-500">{beneficiariesError}</div>
        ) : beneficiaries.length === 0 ? (
          <div className="text-gray-500">No beneficiaries saved yet.</div>
        ) : beneficiaries.map(b => (
          <div key={b.id} className="border p-3 rounded flex items-center justify-between">
            <div>
              <div className="font-medium">{b.account_name}</div>
              <div className="text-sm text-gray-500">{b.account_number} - {b.bank_name}</div>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleRemoveBeneficiary(b.id)}
              disabled={removingId === b.id}
            >
              {removingId === b.id ? "Removing..." : "Remove"}
            </Button>
          </div>
        ))}
        {removeError && <div className="text-xs text-red-500 mt-1">{removeError}</div>}
      </div>
    </div>
  )
} 