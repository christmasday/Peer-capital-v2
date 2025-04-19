"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Star, Shield, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"

interface HelperCardProps {
  id: string
  name: string
  interestRate: string
  maxLoan: string
  loanIssued: string
  amountIssued: string
  profileImage: string
  rating?: number
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
}: HelperCardProps) {
  const [isHovered, setIsHovered] = useState(false)

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
              <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center border-2 border-white">
                {rating}
              </div>
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-gray-900 line-clamp-1">{name}</h3>
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
            </div>
          </div>
          <div className="bg-blue-50 px-2 py-1 rounded-full">
            <p className="text-blue-700 font-semibold text-xs">{interestRate}% interest</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-gray-50 rounded-lg p-2 text-center">
            <div className="flex justify-center mb-1">
              <TrendingUp size={14} className="text-blue-600" />
            </div>
            <p className="text-xs sm:text-sm font-bold text-gray-900 line-clamp-1">{maxLoan}</p>
            <p className="text-xs text-gray-500">Max Loan</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-2 text-center">
            <div className="flex justify-center mb-1">
              <Shield size={14} className="text-blue-600" />
            </div>
            <p className="text-xs sm:text-sm font-bold text-gray-900 line-clamp-1">{loanIssued}</p>
            <p className="text-xs text-gray-500">Loans Issued</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-2 text-center">
            <div className="flex justify-center mb-1">
              <Star size={14} className="text-blue-600" />
            </div>
            <p className="text-xs sm:text-sm font-bold text-gray-900 line-clamp-1">{amountIssued}</p>
            <p className="text-xs text-gray-500">Amount Issued</p>
          </div>
        </div>

        <Link href={`/loans/request/${id}`}>
          <Button
            className={`w-full group transition-all duration-300 text-sm py-2 h-auto ${
              isHovered ? "bg-blue-700" : "bg-blue-600"
            } hover:bg-blue-700`}
          >
            Request Loan
            <ArrowRight
              size={14}
              className={`ml-2 transition-transform duration-300 ${isHovered ? "translate-x-1" : ""}`}
            />
          </Button>
        </Link>
      </div>
    </motion.div>
  )
}
