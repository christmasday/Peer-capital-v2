"use client"

import { Bell, Eye, Plus, ArrowRightLeft, TrendingUp, Search, Filter } from "lucide-react"
import { Input } from "@/components/ui/input"
import { HelperCard } from "@/components/helpers/helper-card"
import { Button } from "@/components/ui/button"
import { useState } from "react"

interface HomeContentProps {
  userProfile: any
  loanHelpers: any[]
}

export function HomeContent({ userProfile, loanHelpers }: HomeContentProps) {
  const [searchQuery, setSearchQuery] = useState("")

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 2,
    }).format(amount)
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        {/* Welcome Section - Desktop */}
        <div className="hidden lg:flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {userProfile.profile?.first_name || "User"}
          </h1>
          <div className="flex items-center gap-4">
            <button className="p-2 relative bg-white rounded-full shadow-sm">
              <Bell className="h-5 w-5 text-gray-700" />
              <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
            </button>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
          {/* Account Card */}
          <div className="lg:col-span-2">
            <div className="w-full rounded-xl bg-blue-700 p-5 text-white overflow-hidden relative h-full">
              <div className="absolute bottom-0 right-0 w-64 h-64 bg-blue-600 rounded-full -mr-20 -mb-20"></div>

              <div className="relative z-10">
                <div className="flex justify-between items-center mb-3">
                  <div className="text-base font-medium">Account Balance</div>
                  <button className="text-white">
                    <Eye className="h-4 w-4" />
                  </button>
                </div>

                <div className="text-2xl font-bold mb-2">{formatCurrency(userProfile.account?.balance || 0)}</div>

                <div className="text-sm opacity-90 mb-6">
                  &amp; Loan Balance {formatCurrency(userProfile.account?.loan_balance || 0)}
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex flex-col items-center">
                    <div className="bg-white p-2 rounded-lg mb-2">
                      <Plus className="h-4 w-4 text-blue-700" />
                    </div>
                    <span className="text-xs">Fund Account</span>
                  </div>

                  <div className="flex flex-col items-center">
                    <div className="bg-white p-2 rounded-lg mb-2">
                      <ArrowRightLeft className="h-4 w-4 text-blue-700" />
                    </div>
                    <span className="text-xs">Transfer</span>
                  </div>

                  <div className="flex flex-col items-center">
                    <div className="bg-white p-2 rounded-lg mb-2">
                      <TrendingUp className="h-4 w-4 text-blue-700" />
                    </div>
                    <span className="text-xs">Loans</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Loan Request */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 h-full">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Loan Request</h2>
            <div className="space-y-3">
              <div>
                <label htmlFor="loan-amount" className="block text-xs font-medium text-gray-700 mb-1">
                  How much do you want?
                </label>
                <Input
                  id="loan-amount"
                  placeholder="Enter amount"
                  className="w-full py-2 px-3 text-sm border-2 rounded-lg"
                />
              </div>
              <div>
                <label htmlFor="loan-duration" className="block text-xs font-medium text-gray-700 mb-1">
                  Duration (months)
                </label>
                <Input
                  id="loan-duration"
                  placeholder="Enter duration"
                  type="number"
                  min="1"
                  max="12"
                  className="w-full py-2 px-3 text-sm border-2 rounded-lg"
                />
              </div>
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-3 text-sm rounded-lg transition-colors">
                Find Lenders
              </button>
            </div>
          </div>
        </div>

        {/* Top Helpers Section */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-gray-900 mb-4 md:mb-0">Top Helpers</h2>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <Input
                  placeholder="Search helpers"
                  className="pl-9 pr-3 py-2 w-full sm:w-60 rounded-lg border-gray-200 focus:border-blue-500 text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button variant="outline" className="flex items-center gap-2 text-sm py-2 h-auto">
                <Filter size={14} />
                <span>Filter</span>
              </Button>
            </div>
          </div>

          {loanHelpers && loanHelpers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {loanHelpers
                .filter((helper) => searchQuery === "" || helper.name.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((helper, index) => (
                  <HelperCard
                    key={helper.id}
                    id={helper.id}
                    name={helper.name}
                    interestRate={helper.interest_rate.toString()}
                    maxLoan={formatCurrency(helper.max_loan_amount)}
                    loanIssued={helper.loans_issued.toString()}
                    amountIssued={formatCurrency(helper.amount_issued)}
                    profileImage={helper.profile_image_url || "/vibrant-street-market.png"}
                    rating={4.5 - index * 0.2} // Just for visual variety
                  />
                ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
              <div className="flex flex-col items-center justify-center">
                <div className="bg-blue-50 p-3 rounded-full mb-3">
                  <Search className="h-6 w-6 text-blue-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No loan helpers available</h3>
                <p className="text-sm text-gray-500 max-w-md mx-auto mb-4">
                  We couldn't find any loan helpers at the moment. Please check back later or try adjusting your search
                  criteria.
                </p>
                <Button size="sm" className="text-sm py-2 h-auto">
                  Refresh
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
