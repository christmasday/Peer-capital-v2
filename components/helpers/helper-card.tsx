"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Star, Clock, TrendingUp, Percent } from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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
}: HelperCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [open, setOpen] = useState(false)
  const loansIssuedLabel = Number(loanIssued) === 1 ? "loan Issued" : "loans Issued"

  const formatTenor = (time?: number, unit?: string, fallback?: string) => {
    if (time === undefined || time === null) return fallback || null
    // If no unit provided, just return the number
    if (!unit) return `${time}`
    const u = unit.toLowerCase()
    let base = u.includes("month") ? "month" : u.includes("week") ? "week" : u.includes("day") ? "day" : unit
    // pluralize
    const label = time === 1 ? base : `${base}s`
    return `${time} ${label}`
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
                <div className="mt-1 text-xs text-gray-500">{loanIssued} {loansIssuedLabel}</div>
              )}
            </div>
          </div>
          {/* top-right interest badge removed per design */}
        </div>

        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-gray-50 rounded-lg p-2 text-center">
            <div className="flex justify-center mb-1">
              <TrendingUp size={14} className="text-blue-600" />
            </div>
            <p className="text-xs sm:text-sm font-bold text-gray-900 line-clamp-1">{maxLoan}</p>
            <p className="text-xs text-gray-500">Loan Amount</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-2 text-center">
            <div className="flex justify-center mb-1">
              <Clock size={14} className="text-blue-600" />
            </div>
            <p className="text-xs sm:text-sm font-bold text-gray-900 line-clamp-1">{formatTenor(repaymentTime, repaymentUnit, loanIssued)}</p>
            <p className="text-xs text-gray-500">Loan Tenor</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-2 text-center">
            <div className="flex justify-center mb-1">
              <Percent size={14} className="text-blue-600" />
            </div>
            <p className="text-xs sm:text-sm font-bold text-blue-600 line-clamp-1">{interestRate ? (interestRate.toString().includes("%") ? interestRate : `${interestRate}%`) : amountIssued}</p>
            <p className="text-xs text-gray-500">Interest Rate</p>
          </div>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <Button
            className={`w-full group transition-all duration-300 text-sm py-2 h-auto ${
              isHovered ? "bg-blue-700" : "bg-blue-600"
            } hover:bg-blue-700`}
            onClick={() => setOpen(true)}
          >
            Request Loan
            <ArrowRight
              size={14}
              className={`ml-2 transition-transform duration-300 ${isHovered ? "translate-x-1" : ""}`}
            />
          </Button>
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
        </Dialog>
      </div>
    </motion.div>
  )
}
