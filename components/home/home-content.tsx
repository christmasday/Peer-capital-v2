"use client"

import { useState } from "react"
import { Eye, Plus, ArrowRightLeft, TrendingUp, ArrowDown, Search, Loader2, AlertCircle, Info } from "lucide-react"
import { Input } from "@/components/ui/input"
import { HelperCard } from "@/components/helpers/helper-card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

interface HomeContentProps {
  userProfile: any
  loanHelpers: any[]
}

export function HomeContent({ userProfile, loanHelpers }: HomeContentProps) {
  const { toast } = useToast()
  const [loanAmount, setLoanAmount] = useState<string>("")
  const [loanDuration, setLoanDuration] = useState<string>("")
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<any[] | null>(null)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [hasSearched, setHasSearched] = useState(false)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const handleFindLenders = async () => {
    setIsSearching(true)
    setSearchError(null)
    setHasSearched(true)

    try {
      // Parse inputs
      const amount = loanAmount ? Number.parseFloat(loanAmount) : undefined
      const duration = loanDuration ? Number.parseInt(loanDuration) : undefined

      // Validate that at least one parameter is provided
      if ((!amount || amount <= 0) && (!duration || duration <= 0)) {
        setSearchError("Please enter either a loan amount or duration")
        setIsSearching(false)
        return
      }

      // Call the API route to find lenders
      const res = await fetch("/api/find-lenders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loanAmount: amount && amount > 0 ? amount : undefined, loanDuration: duration && duration > 0 ? duration : undefined }),
        credentials: "include"
      })
      const { lenders, error } = await res.json()

      if (error) {
        setSearchError(error)
        toast({
          title: "No Matches Found",
          description: error,
          variant: "destructive",
        })
        setSearchResults([])
      } else if (lenders.length === 0) {
        setSearchError("No lenders found matching your criteria. Try adjusting your search.")
        setSearchResults([])
      } else {
        setSearchResults(lenders)
        toast({
          title: "Lenders Found",
          description: `Found ${lenders.length} lenders matching your criteria`,
        })
      }
    } catch (error) {
      setSearchError("An unexpected error occurred")
      setSearchResults([])
      toast({
        title: "Error",
        description: "Failed to find lenders. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSearching(false)
    }
  }

  // Reset search results and show all helpers
  const handleResetSearch = () => {
    setSearchResults(null)
    setSearchError(null)
    setLoanAmount("")
    setLoanDuration("")
    setHasSearched(false)
  }

  // Determine which lenders to display
  const displayLenders = searchResults !== null ? searchResults : loanHelpers

  return (
    <div className="max-w-7xl mx-auto">
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        {/* Welcome Section - Desktop */}
        <div className="hidden lg:flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {userProfile.profile?.first_name || "User"}
          </h1>
          {/* Removed the notification button with Bell icon */}
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
                  <Link href="/account/fund" className="flex flex-col items-center">
                    <div className="bg-white p-2 rounded-lg mb-2">
                      <Plus className="h-12 w-12 text-blue-700" />
                    </div>
                    <span className="text-xs">Fund</span>
                  </Link>

                  <Link href="/account/transfer" className="flex flex-col items-center">
                    <div className="bg-white p-2 rounded-lg mb-2">
                      <ArrowRightLeft className="h-12 w-12 text-blue-700" />
                    </div>
                    <span className="text-xs">Transfer</span>
                  </Link>

                  <div className="flex flex-col items-center">
                    <div className="bg-white p-2 rounded-lg mb-2">
                      <TrendingUp className="h-12 w-12 text-blue-700" />
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

            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-4">
              <div className="flex items-start">
                <Info className="h-4 w-4 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                <p className="text-xs text-blue-700">
                  Enter either a loan amount, duration, or both to find matching lenders.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label htmlFor="loan-amount" className="block text-xs font-medium text-gray-700 mb-1">
                  How much do you want? (optional)
                </label>
                <Input
                  id="loan-amount"
                  placeholder="Enter amount"
                  className="w-full py-2 px-3 text-sm border-2 rounded-lg"
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(e.target.value)}
                  type="number"
                  min="1000"
                />
              </div>
              <div>
                <label htmlFor="loan-duration" className="block text-xs font-medium text-gray-700 mb-1">
                  Duration in months (optional)
                </label>
                <Input
                  id="loan-duration"
                  placeholder="Enter duration"
                  type="number"
                  min="1"
                  max="12"
                  className="w-full py-2 px-3 text-sm border-2 rounded-lg"
                  value={loanDuration}
                  onChange={(e) => setLoanDuration(e.target.value)}
                />
              </div>
              <Button
                onClick={handleFindLenders}
                disabled={isSearching}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-3 text-sm rounded-lg transition-colors flex items-center justify-center"
              >
                {isSearching ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Find Lenders
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Lenders Section */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-gray-900 mb-4 md:mb-0">
              {hasSearched ? "Search Results" : "Loan Offers from People You Follow"}
            </h2>
            {hasSearched && (
              <Button variant="outline" onClick={handleResetSearch} className="text-sm py-2 h-auto">
                Show All Helpers
              </Button>
            )}
          </div>

          {searchError && (
            <div className="bg-red-50 border border-red-100 rounded-lg p-4 mb-5">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                <p className="text-red-600 text-sm">{searchError}</p>
              </div>
            </div>
          )}

          {/* No results after search */}
          {hasSearched && searchResults && searchResults.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
              <div className="flex flex-col items-center justify-center">
                <div className="bg-blue-50 p-3 rounded-full mb-3">
                  <Search className="h-6 w-6 text-blue-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No matching lenders found</h3>
                <p className="text-sm text-gray-500 max-w-md mx-auto mb-4">
                  We couldn't find any lenders matching your criteria. Try adjusting your search parameters.
                </p>
                <div className="flex gap-3">
                  <Button size="sm" className="text-sm py-2 h-auto" onClick={handleResetSearch}>
                    Show All Helpers
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-sm py-2 h-auto"
                    onClick={() => {
                      setLoanAmount("")
                      setLoanDuration("")
                    }}
                  >
                    Clear Search
                  </Button>
                </div>
              </div>
            </div>
          ) : displayLenders && displayLenders.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {displayLenders.map((helper, index) => (
                <HelperCard
                  key={helper.id}
                  id={helper.id}
                  name={helper.name}
                  interestRate={helper.interest_rate.toString()}
                  maxLoan={formatCurrency(helper.loanAmount)}
                  loanIssued={helper.loans_issued.toString()}
                  amountIssued={formatCurrency(helper.amount_issued)}
                  profileImage={helper.profile_image_url || "/vibrant-street-market.png"}
                  rating={helper.rating || 4.5 - index * 0.2}
                  loanAmount={helper.loanAmount}
                  repaymentTime={helper.repayment_time}
                  repaymentUnit={helper.repayment_unit}
                  currentUser={userProfile}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
              <div className="flex flex-col items-center justify-center">
                <div className="bg-blue-50 p-3 rounded-full mb-3">
                  <TrendingUp className="h-6 w-6 text-blue-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No loan helpers available</h3>
                <p className="text-sm text-gray-500 max-w-md mx-auto mb-4">
                  We couldn't find any loan helpers at the moment. Please check back later.
                </p>
                <Button size="sm" className="text-sm py-2 h-auto" onClick={handleResetSearch}>
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
