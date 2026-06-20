"use client"

import { useState } from "react"
import Image from "next/image"
import { ArrowRight, Star, Clock, TrendingUp, Percent, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { LoanRequestForm } from "@/components/loans/loan-request-form"

interface HelperCardProps {
  id: string
  name: string
  interestRate: string
  maxLoan: string
  loanIssued: string
  amountIssued: string
  profileImage: string
  rating?: number
  displayMetric?: "rating" | "loans-issued"
  loanAmount?: number
  repaymentTime?: number
  repaymentUnit?: string
  currentUser?: any
  isBorrowerResult?: boolean
}

export function HelperCard({
  id,
  name,
  interestRate,
  maxLoan,
  loanIssued,
  amountIssued,
  profileImage,
  rating = 4.5,
  displayMetric = "loans-issued",
  loanAmount,
  repaymentTime,
  repaymentUnit,
  isBorrowerResult = false,
}: HelperCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  // Offer form state
  const [offerAmount, setOfferAmount] = useState(String(loanAmount ?? ""))
  const [offerInterest, setOfferInterest] = useState("")
  const [offerDuration, setOfferDuration] = useState(String(repaymentTime ?? 6))
  const [offerDurationUnit, setOfferDurationUnit] = useState("months")

  const loansLabel = Number(loanIssued) === 1
    ? (isBorrowerResult ? "loan taken" : "loan Issued")
    : (isBorrowerResult ? "loans taken" : "loans Issued")

  const formatTenor = (time?: number, unit?: string, fallback?: string) => {
    if (time === undefined || time === null) return fallback || null
    if (!unit) return `${time}`
    const u = unit.toLowerCase()
    let base = u.includes("month") ? "month" : u.includes("week") ? "week" : u.includes("day") ? "day" : unit
    const label = time === 1 ? base : `${base}s`
    return `${time} ${label}`
  }

  const handleSubmitOffer = async () => {
    if (!offerAmount || Number(offerAmount) <= 0) {
      toast({ title: "Invalid amount", description: "Please enter a valid loan amount", variant: "destructive" })
      return
    }
    setIsSubmitting(true)
    try {
      const res = await fetch("/api/loan-offer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          borrowerId: id,
          amount: Number(offerAmount),
          interestRate: Number(offerInterest) || 0,
          duration: Number(offerDuration) || 6,
          durationUnit: offerDurationUnit,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast({ title: "Offer Sent", description: `Loan offer sent to ${name}` })
        setOpen(false)
      } else {
        toast({ title: "Failed to send offer", description: data.error || "Please try again", variant: "destructive" })
      }
    } catch {
      toast({ title: "Error", description: "Failed to send loan offer", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-300 h-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="relative h-10 w-10 sm:h-12 sm:w-12 rounded-full overflow-hidden border-2 border-blue-100">
                <Image
                  src={profileImage || "/placeholder.svg?height=100&width=100&query=person"}
                  alt={name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white text-xs font-bold rounded-full h-5 min-w-5 px-1 flex items-center justify-center border-2 border-white">
                {displayMetric === "rating" ? rating : loanIssued}
              </div>
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-gray-900 line-clamp-1">{name}</h3>
              {displayMetric === "rating" ? (
                <div className="flex items-center mt-1">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={12}
                        className={i < Math.floor(rating) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-gray-500 ml-1">{rating} rating</span>
                </div>
              ) : (
                <div className="mt-1 text-xs text-gray-500">{loanIssued} {loansLabel}</div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-gray-50 rounded-lg p-2 text-center">
            <div className="flex justify-center mb-1">
              <TrendingUp size={14} className="text-blue-600" />
            </div>
            <p className="text-xs sm:text-sm font-bold text-gray-900 line-clamp-1">{maxLoan}</p>
            <p className="text-xs text-gray-500">{isBorrowerResult ? "Total Loans Taken" : "Loan Amount"}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-2 text-center">
            <div className="flex justify-center mb-1">
              <Clock size={14} className="text-blue-600" />
            </div>
            <p className="text-xs sm:text-sm font-bold text-gray-900 line-clamp-1">{formatTenor(repaymentTime, isBorrowerResult ? "months" : repaymentUnit, loanIssued)}</p>
            <p className="text-xs text-gray-500">{isBorrowerResult ? "Avg Loan Tenor" : "Loan Tenor"}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-2 text-center">
            <div className="flex justify-center mb-1">
              <Percent size={14} className="text-blue-600" />
            </div>
            <p className="text-xs sm:text-sm font-bold text-blue-600 line-clamp-1">{interestRate ? (interestRate.toString().includes("%") ? interestRate : `${interestRate}%`) : amountIssued}</p>
            <p className="text-xs text-gray-500">{isBorrowerResult ? "Repayment Rate" : "Interest Rate"}</p>
          </div>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <Button
            className={`w-full group transition-all duration-300 text-sm py-2 h-auto ${
              isHovered ? "bg-blue-700" : "bg-blue-600"
            } hover:bg-blue-700`}
            onClick={() => setOpen(true)}
          >
            {isBorrowerResult ? "Offer Loan" : "Request Loan"}
            <ArrowRight
              size={14}
              className={`ml-2 transition-transform duration-300 ${isHovered ? "translate-x-1" : ""}`}
            />
          </Button>

          {isBorrowerResult ? (
            <DialogContent className="max-w-md w-full">
              <DialogHeader>
                <DialogTitle>Offer Loan to {name}</DialogTitle>
                <DialogDescription>
                  Set the terms for this loan offer. The borrower can review and respond.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label htmlFor="offer-amount">Loan Amount (₦)</Label>
                  <Input
                    id="offer-amount"
                    type="number"
                    placeholder="Enter amount"
                    value={offerAmount}
                    onChange={(e) => setOfferAmount(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="offer-interest">Interest Rate (%)</Label>
                  <Input
                    id="offer-interest"
                    type="number"
                    step="0.1"
                    placeholder="e.g. 5"
                    value={offerInterest}
                    onChange={(e) => setOfferInterest(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-7 gap-3">
                  <div className="col-span-4 space-y-2">
                    <Label htmlFor="offer-duration">Duration</Label>
                    <Input
                      id="offer-duration"
                      type="number"
                      placeholder="Duration"
                      value={offerDuration}
                      onChange={(e) => setOfferDuration(e.target.value)}
                    />
                  </div>
                  <div className="col-span-3 space-y-2">
                    <Label>Unit</Label>
                    <Select value={offerDurationUnit} onValueChange={setOfferDurationUnit}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="months">Months</SelectItem>
                        <SelectItem value="days">Days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button
                  className="w-full mt-2"
                  onClick={handleSubmitOffer}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending Offer...
                    </>
                  ) : (
                    "Send Offer"
                  )}
                </Button>
              </div>
            </DialogContent>
          ) : (
            <DialogContent className="max-w-lg w-full">
              <DialogHeader>
                <DialogTitle>Request Loan from {name}</DialogTitle>
              </DialogHeader>
              <LoanRequestForm
                helperId={id}
                helperName={name}
                interestRate={parseFloat(interestRate)}
                maxLoanAmount={loanAmount ?? parseFloat(maxLoan)}
                duration={repaymentTime ?? 0}
                durationUnit={repaymentUnit ?? "months"}
              />
            </DialogContent>
          )}
        </Dialog>
      </div>
    </motion.div>
  )
}
