"use client"

import { useState, useEffect } from "react"
import { Eye, EyeOff, Plus, ArrowRightLeft, TrendingUp, ArrowDown, Search, Loader2, AlertCircle, Info, CheckCircle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { HelperCard } from "@/components/helpers/helper-card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
  const [walletInfo, setWalletInfo] = useState<{ walletNumber: string, availableBalance: string } | null>(null)
  const [walletLoading, setWalletLoading] = useState(false)
  const [walletError, setWalletError] = useState<string | null>(null)
  const [timeline, setTimeline] = useState<any[]>([])
  const [timelineLoading, setTimelineLoading] = useState(true)
  const [newPost, setNewPost] = useState(0)
  const [postContent, setPostContent] = useState("")
  const [accountBalance, setAccountBalance] = useState<{ balance: number; loan_balance: number } | null>(null)
  const [showBalance, setShowBalance] = useState(true)
  const [showFundModal, setShowFundModal] = useState(false)
  const [fundAmount, setFundAmount] = useState("")
  const [isFunding, setIsFunding] = useState(false)
  const [onrampTransactionId, setOnrampTransactionId] = useState<string | null>(null)
  const [onrampCorrelationId, setOnrampCorrelationId] = useState<string | null>(null)
  const [onrampStatus, setOnrampStatus] = useState<string>('pending')
  const [showOnrampStatusModal, setShowOnrampStatusModal] = useState(false)
  const [onrampDetails, setOnrampDetails] = useState<any>(null)
  // New state for VA-based funding flow
  const [fundingRequestId, setFundingRequestId] = useState<string | null>(null)
  const [virtualAccountDetails, setVirtualAccountDetails] = useState<any>(null)
  const [isPollingVA, setIsPollingVA] = useState(false)
  const [hasConfirmedTransfer, setHasConfirmedTransfer] = useState(false)
  const [isPollingCompletion, setIsPollingCompletion] = useState(false)
  const [fundingCompleted, setFundingCompleted] = useState(false)
  const [baseWalletBalance, setBaseWalletBalance] = useState<string | null>(null)
  const [isLoadingBalance, setIsLoadingBalance] = useState(false)
  const [balanceError, setBalanceError] = useState<string | null>(null)
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false)
  const [withdrawalAmount, setWithdrawalAmount] = useState("")
  const [selectedBeneficiary, setSelectedBeneficiary] = useState<string>("")
  const [beneficiaries, setBeneficiaries] = useState<any[]>([])
  const [isLoadingBeneficiaries, setIsLoadingBeneficiaries] = useState(false)
  const [beneficiariesError, setBeneficiariesError] = useState<string | null>(null)
  const [isWithdrawing, setIsWithdrawing] = useState(false)

  // Lightweight delay helper for polling
  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 2,
    }).format(amount)
  }

  useEffect(() => {
    // Skip ALAT wallet fetching for now - we'll use database data instead
    setWalletLoading(false)
      setWalletError(null)
    // Load account balance and timeline
    ;(async () => {
      try {
        // Account balance API removed; leave zeros
        setAccountBalance({ balance: 0, loan_balance: 0 })

        // Fetch timeline
        const res = await fetch("/api/timeline", {
          credentials: 'include'
        })
        if (res.ok) {
        const data = await res.json()
          setTimeline(data.posts || [])
        }

        // Fetch BASE wallet balance if wallet address exists
        try {
          const walletResponse = await fetch('/api/stablesrail/wallet-address', {
            credentials: 'include'
          })
          
          if (walletResponse.ok) {
            const walletData = await walletResponse.json()
            if (walletData.success && walletData.walletAddresses?.base_address) {
              await fetchBaseWalletBalance(walletData.walletAddresses.base_address)
            }
          }
        } catch {}
      } finally {
        setTimelineLoading(false)
      }
    })()
  }, [])

  // Fetch beneficiaries when withdrawal modal opens
  useEffect(() => {
    if (showWithdrawalModal) {
      async function fetchBeneficiaries() {
        setIsLoadingBeneficiaries(true)
        setBeneficiariesError(null)
        try {
          const res = await fetch('/api/beneficiaries', {
            credentials: 'include'
          })
          const data = await res.json()
          
          if (data.success && Array.isArray(data.beneficiaries)) {
            setBeneficiaries(data.beneficiaries)
          } else {
            setBeneficiariesError("Failed to load repayment accounts")
          }
        } catch (error) {
          console.error('Failed to fetch beneficiaries:', error)
          setBeneficiariesError("Failed to load repayment accounts")
        } finally {
          setIsLoadingBeneficiaries(false)
        }
      }
      fetchBeneficiaries()
    } else {
      // Reset state when modal closes
      setSelectedBeneficiary("")
      setWithdrawalAmount("")
      setBeneficiariesError(null)
    }
  }, [showWithdrawalModal])

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

  const pollVirtualAccount = async (requestId: string) => {
    // Prevent multiple polling instances
    if (isPollingVA) {
      console.warn('Polling already in progress, skipping duplicate call')
      return
    }
    
    let attempts = 0
    const maxAttempts = 20 // Poll for up to 40 seconds (20 * 2 seconds)
    
    setIsPollingVA(true)
    
    const poll = async () => {
      if (attempts >= maxAttempts) {
        setIsPollingVA(false)
        toast({
          title: "Virtual Account Generation Timeout",
          description: "Virtual account is taking longer than expected. Please try again later.",
          variant: "destructive"
        })
        return
      }
      
      try {
        const response = await fetch('/api/stablesrail/virtual-account', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ requestId }),
          credentials: 'include'
        })
        
        const data = await response.json()
        
        if (response.ok && data.success && data.data?.virtualAccount) {
          // VA details are available
          setVirtualAccountDetails(data.data)
          setIsPollingVA(false)
          return
        }
        
        // If we get a 400 error, stop polling and show error
        if (!response.ok && response.status === 400) {
          setIsPollingVA(false)
          toast({
            title: "Virtual Account Error",
            description: data.error || "Failed to retrieve virtual account details. Please try again.",
            variant: "destructive"
          })
          return
        }
        
        // If VA not ready yet (but no error), continue polling
        attempts++
        if (attempts < maxAttempts) {
          setTimeout(poll, 2000) // Poll every 2 seconds
        } else {
          setIsPollingVA(false)
          toast({
            title: "Virtual Account Generation Timeout",
            description: "Virtual account is taking longer than expected. Please try again later.",
            variant: "destructive"
          })
        }
      } catch (error) {
        console.error('Error polling VA:', error)
        setIsPollingVA(false)
        toast({
          title: "Network Error",
          description: "Failed to check virtual account status. Please try again.",
          variant: "destructive"
        })
      }
    }
    
    poll()
  }

  const handleFund = async () => {
    if (!fundAmount || Number(fundAmount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount greater than 0.",
        variant: "destructive"
      })
      return
    }

    if (!userProfile.profile.sr_user_id) {
      toast({
        title: "Stablesrail ID Missing",
        description: "Please complete your profile verification first.",
        variant: "destructive"
      })
      return
    }

    setIsFunding(true)
    setVirtualAccountDetails(null)
    setFundingRequestId(null)
    setHasConfirmedTransfer(false)
    setFundingCompleted(false)

    try {
      // Call CNGN onramp with userId and amount
      const response = await fetch('/api/stablesrail/cngn-onramp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userProfile.profile.sr_user_id,
          amount: Number(fundAmount),
          network: "BASE"
        }),
        credentials: 'include'
      })

      const data = await response.json()

      if (response.ok && data.success && data.data?.requestId) {
        const requestId = data.data.requestId
        
        // Store requestId and initial fee breakdown
        setFundingRequestId(requestId)
        
        // Start polling for VA details
        pollVirtualAccount(requestId)
        
        toast({
          title: "Funding Request Initiated",
          description: "Bank account generation in progress. Use requestId to get the bank account details for payment.",
        })
      } else {
        throw new Error(data.error || 'Failed to initiate funding')
      }
    } catch (error) {
      console.error('❌ Funding failed:', error)
      toast({
        title: "Funding Failed",
        description: error instanceof Error ? error.message : "Failed to initiate funding. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsFunding(false)
    }
  }

  const handleConfirmTransfer = () => {
    setHasConfirmedTransfer(true)
    setIsPollingCompletion(true)
    
    // Start polling for transaction completion
    pollFundingCompletion()
    
    toast({
      title: "Transfer Confirmed",
      description: "Waiting for payment confirmation. This may take a few minutes.",
    })
  }

  const pollFundingCompletion = async () => {
    if (!fundingRequestId || !virtualAccountDetails) return
    
    // Get wallet address and request ID from VA details
    const walletAddress = virtualAccountDetails.walletAddress
    const requestId = virtualAccountDetails.requestId || fundingRequestId
    
    if (!walletAddress && !requestId) {
      toast({
        title: "Missing Information",
        description: "Unable to check transaction status. Please try again.",
        variant: "destructive"
      })
      setIsPollingCompletion(false)
      return
    }
    
    let attempts = 0
    const maxAttempts = 150 // Poll for up to 5 minutes (150 * 2 seconds)
    
    const poll = async () => {
      if (attempts >= maxAttempts) {
        setIsPollingCompletion(false)
        toast({
          title: "Status Check Timeout",
          description: "Transaction is taking longer than expected. Please check back later or contact support.",
          variant: "destructive"
        })
        return
      }
      
      try {
        // Poll /cngnrampstatus endpoint with wallet address and request ID
        const response = await fetch('/api/stablesrail/cngn-ramp-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            walletAddress,
            requestId
          }),
          credentials: 'include'
        })
        
        const data = await response.json()
        
        if (response.ok && data.success && data.data) {
          // Check the status from the response
          const status = data.data.status || data.data.data?.status
          
          // Check if funding is completed
          if (status === 'completed' || status === 'success' || status === 'confirmed') {
            setIsPollingCompletion(false)
            setFundingCompleted(true)
            
            toast({
              title: "Funding Completed!",
              description: "Your payment has been confirmed and your account has been funded successfully.",
            })
            
            // Optionally refresh balance or reload data
            return
          }
          
          // Check if transaction failed
          if (status === 'failed' || status === 'error') {
            setIsPollingCompletion(false)
            toast({
              title: "Transaction Failed",
              description: data.data.message || "The transaction could not be completed. Please try again.",
              variant: "destructive"
            })
            return
          }
        }
        
        attempts++
        if (attempts < maxAttempts) {
          setTimeout(poll, 2000) // Poll every 2 seconds
        } else {
          setIsPollingCompletion(false)
        }
      } catch (error) {
        console.error('Error polling funding completion:', error)
        attempts++
        if (attempts < maxAttempts) {
          setTimeout(poll, 2000) // Continue polling on error
        } else {
          setIsPollingCompletion(false)
        }
      }
    }
    
    poll()
  }

  const pollOnrampStatus = async (correlationId: string) => {
    let attempts = 0
    const maxAttempts = 60 // Poll for 5 minutes max (60 * 5 seconds)
    
    const poll = async () => {
      if (attempts >= maxAttempts) {
        toast({
          title: "Status Check Timeout",
          description: "Transaction is taking longer than expected. Please check back later.",
          variant: "destructive"
        })
        return
      }
      
      try {
        const response = await fetch(
          `/api/stablesrail/cngn-request-status?correlationId=${correlationId}`,
          { credentials: 'include' }
        )
        
        const data = await response.json()
        
        if (response.ok && data.success) {
          setOnrampStatus(data.data.status)
          
          // Update details if transaction hash is available
          if (data.data.transactionHash) {
            setOnrampDetails((prev: any) => ({
              ...prev,
              transactionHash: data.data.transactionHash
            }))
          }
          
          // Stop polling if completed or failed
          if (data.data.status === 'completed' || data.data.status === 'failed') {
            if (data.data.status === 'completed') {
              toast({
                title: "Funding Completed",
                description: "Your account has been funded successfully!",
              })
              
              // Refresh balance after successful funding
              const walletResponse = await fetch('/api/stablesrail/wallet-address', {
                credentials: 'include'
              })
              if (walletResponse.ok) {
                const walletData = await walletResponse.json()
                if (walletData.success && walletData.walletAddresses?.base_address) {
                  await fetchBaseWalletBalance(walletData.walletAddresses.base_address)
                }
              }
            }
            return
          }
          
          // Continue polling
          attempts++
          setTimeout(poll, 5000) // Poll every 5 seconds
        }
      } catch (error) {
        console.error('Error polling status:', error)
        attempts++
        setTimeout(poll, 5000)
      }
    }
    
    poll()
  }

  const fetchBaseWalletBalance = async (baseAddress: string) => {
    setIsLoadingBalance(true)
    setBalanceError(null)
    
    try {
      const response = await fetch(
        `/api/stablesrail/base-balance?address=${encodeURIComponent(baseAddress)}`,
        { credentials: 'include' }
      )
      
      const data = await response.json()
      
      if (response.ok && data.success) {
        setBaseWalletBalance(data.balance)
      } else {
        throw new Error(data.error || 'Failed to fetch balance')
      }
    } catch (error) {
      console.error('Error fetching BASE balance:', error)
      setBalanceError(error instanceof Error ? error.message : 'Failed to fetch balance')
      setBaseWalletBalance(null)
    } finally {
      setIsLoadingBalance(false)
    }
  }

  const handleWithdrawal = async () => {
    // Validation
    if (!withdrawalAmount || Number(withdrawalAmount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount greater than 0.",
        variant: "destructive"
      })
      return
    }

    if (!selectedBeneficiary) {
      toast({
        title: "Account Required",
        description: "Please select a repayment account.",
        variant: "destructive"
      })
      return
    }

    if (!userProfile.profile?.sr_user_id) {
      toast({
        title: "Account Required",
        description: "Please complete your profile setup first.",
        variant: "destructive"
      })
      return
    }

    // Find selected beneficiary
    const beneficiary = beneficiaries.find(b => b.id === selectedBeneficiary)
    if (!beneficiary || !beneficiary.bank_code || !beneficiary.account_number || !beneficiary.account_name) {
      toast({
        title: "Invalid Account",
        description: "Selected account is missing required information.",
        variant: "destructive"
      })
      return
    }

    setIsWithdrawing(true)

    try {
      // Call the CNGN offramp API with the correct payload structure
      const response = await fetch('/api/stablesrail/cngn-offramp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userProfile.profile.sr_user_id,
          amount: Number(withdrawalAmount),
          ticker: "CNGN",
          bankCode: beneficiary.bank_code,
          accountNumber: beneficiary.account_number,
          accountName: beneficiary.account_name,
        }),
        credentials: 'include'
      })

      const data = await response.json()

      if (response.ok && data.success) {
        toast({
          title: "Withdrawal Initiated",
          description: `Withdrawal request submitted successfully. ${data.data?.message || 'Transaction processing...'}`,
        })
        setShowWithdrawalModal(false)
        setWithdrawalAmount("")
        setSelectedBeneficiary("")
      } else {
        throw new Error(data.error || 'Failed to initiate withdrawal')
      }
    } catch (error) {
      console.error('❌ Withdrawal failed:', error)
      toast({
        title: "Withdrawal Failed",
        description: error instanceof Error ? error.message : "Failed to process withdrawal. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsWithdrawing(false)
    }
  }

  // Determine which lenders to display
  const displayLenders = searchResults !== null ? searchResults : loanHelpers

  return (
    <div className="max-w-7xl mx-auto">
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        {/* Welcome Section - Desktop */}
        {/* Dashboard + Quick Loan Request */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6 items-stretch">
          {/* Dashboard only (timeline removed) */}
          <div className="lg:col-span-2 h-full">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-0 h-full flex flex-col">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl h-full w-full flex flex-col items-center justify-center p-10">
                <div className="flex flex-col items-center justify-center w-full">
                  <p className="text-blue-100 text-lg mb-2">Account Balance</p>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-4xl font-bold">
                      {showBalance ? `₦${(accountBalance?.balance ?? 0).toLocaleString()}` : '₦****'}
                    </span>
                    <button className="text-white/80" onClick={() => setShowBalance(!showBalance)}>
                      {showBalance ? <EyeOff className="h-6 w-6" /> : <Eye className="h-6 w-6" />}
                  </button>
                </div>
                  <p className="text-blue-200 text-lg">& Loan Balance ₦{(accountBalance?.loan_balance ?? 0).toLocaleString()}</p>
                </div>
                <div className="grid grid-cols-3 gap-8 w-full mt-10">
                  <Button
                    variant="secondary"
                    className="w-full h-24 flex flex-col items-center justify-center gap-2 bg-white text-blue-600 hover:bg-gray-50 text-lg"
                    onClick={() => setShowFundModal(true)}
                  >
                    <Plus className="h-8 w-8" />
                    <span className="font-medium">Fund</span>
                  </Button>
                  <Button
                    variant="secondary"
                    className="w-full h-24 flex flex-col items-center justify-center gap-2 bg-white text-blue-600 hover:bg-gray-50 text-lg"
                    onClick={() => setShowWithdrawalModal(true)}
                  >
                    <ArrowDown className="h-8 w-8" />
                    <span className="font-medium">Withdrawal</span>
                  </Button>
                  <Link href="/timeline" className="w-full">
                    <Button
                      variant="secondary"
                      className="w-full h-24 flex flex-col items-center justify-center gap-2 bg-white text-blue-600 hover:bg-gray-50 text-lg"
                    >
                      <TrendingUp className="h-8 w-8" />
                      <span className="font-medium">Timeline</span>
                    </Button>
                  </Link>
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

      {/* Modals */}
      {/* Fund Modal */}
      {showFundModal && (
        <Dialog open={showFundModal} onOpenChange={(open) => {
          setShowFundModal(open)
          if (!open) {
            // Reset state when modal closes
            setFundAmount("")
            setVirtualAccountDetails(null)
            setFundingRequestId(null)
            setHasConfirmedTransfer(false)
            setFundingCompleted(false)
            setIsPollingVA(false)
            setIsPollingCompletion(false)
          }
        }}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Fund Account</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {!virtualAccountDetails ? (
                  // Show amount input form
                  <>
                    <p className="text-sm text-gray-600">
                      Fund your account with CNGN via Base network
                    </p>
                    {isPollingVA && (
                      <div className="flex items-center gap-2 text-sm text-blue-600">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Bank account generation in progress...</span>
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Amount (NGN)
                      </label>
                      <Input
                        type="number"
                        placeholder="Enter amount"
                        value={fundAmount}
                        onChange={(e) => setFundAmount(e.target.value)}
                        min="1"
                        step="0.01"
                        disabled={isFunding || isPollingVA}
                      />
                    </div>
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowFundModal(false)
                          setFundAmount("")
                        }}
                        className="flex-1"
                        disabled={isFunding || isPollingVA}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleFund}
                        disabled={isFunding || isPollingVA || !fundAmount || Number(fundAmount) <= 0}
                        className="flex-1"
                      >
                        {isFunding ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Initiating...
                          </>
                        ) : (
                          'Fund Account'
                        )}
                      </Button>
                    </div>
                  </>
                ) : (
                  // Show VA details
                  <>
                    <p className="text-sm text-yellow-600 bg-yellow-50 p-3 rounded-md">
                      Virtual account amount is before gateway fee. User must pay total amount including all fees.
                    </p>
                    
                    {fundingCompleted ? (
                      <div className="text-center py-6">
                        <div className="text-green-600 mb-2">✓</div>
                        <h3 className="font-semibold text-lg mb-2">Funding Completed!</h3>
                        <p className="text-sm text-gray-600 mb-4">
                          Your account has been funded successfully.
                        </p>
                        <Button
                          onClick={() => {
                            setShowFundModal(false)
                            setFundAmount("")
                            setVirtualAccountDetails(null)
                            setFundingRequestId(null)
                            setHasConfirmedTransfer(false)
                            setFundingCompleted(false)
                          }}
                          className="w-full"
                        >
                          Close
                        </Button>
                      </div>
                    ) : hasConfirmedTransfer ? (
                      <div className="text-center py-6">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
                        <h3 className="font-semibold text-lg mb-2">Waiting for Confirmation</h3>
                        <p className="text-sm text-gray-600">
                          We're waiting for your payment to be confirmed. This may take a few minutes.
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-4">
                          <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Account Number:</span>
                              <span className="font-mono text-sm font-semibold">
                                {virtualAccountDetails.virtualAccount?.accountNumber}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Bank Name:</span>
                              <span className="text-sm font-medium">
                                {virtualAccountDetails.virtualAccount?.bankName}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Account Name:</span>
                              <span className="text-sm font-medium">
                                {virtualAccountDetails.virtualAccount?.accountName}
                              </span>
                            </div>
                            <div className="flex justify-between items-center border-t pt-3">
                              <span className="text-sm font-medium text-gray-700">Amount to Transfer:</span>
                              <span className="text-lg font-bold text-blue-600">
                                ₦{virtualAccountDetails.virtualAccount?.totalAmountWithFee?.toLocaleString('en-NG', { minimumFractionDigits: 2 }) || '0.00'}
                              </span>
                            </div>
                            {virtualAccountDetails.virtualAccount?.feeBreakdown && (
                              <div className="pt-3 border-t">
                                <p className="text-xs text-gray-500 mb-2">Fee Breakdown:</p>
                                <div className="space-y-1 text-xs">
                                  <div className="flex justify-between">
                                    <span>Requested Amount:</span>
                                    <span>₦{virtualAccountDetails.virtualAccount.feeBreakdown.userRequestedAmount?.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Fintech Fee ({virtualAccountDetails.virtualAccount.feeBreakdown.fintechFeePercentage}%):</span>
                                    <span>₦{virtualAccountDetails.virtualAccount.feeBreakdown.fintechFeeAmount?.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Gateway Fee ({virtualAccountDetails.virtualAccount.feeBreakdown.gatewayFeePercentage}%):</span>
                                    <span>₦{virtualAccountDetails.virtualAccount.feeBreakdown.gatewayFeeAmount?.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Stablesrail Fee ({virtualAccountDetails.virtualAccount.feeBreakdown.stablesRailFeePercentage}%):</span>
                                    <span>₦{virtualAccountDetails.virtualAccount.feeBreakdown.stablesRailFeeAmount?.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>
                                  </div>
                                  <div className="flex justify-between font-semibold pt-1 border-t">
                                    <span>Total Fee:</span>
                                    <span>₦{virtualAccountDetails.virtualAccount.feeBreakdown.totalFeeAmount?.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <Button
                          onClick={handleConfirmTransfer}
                          className="w-full"
                          size="lg"
                        >
                          I have made the transfer
                        </Button>
                        
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowFundModal(false)
                            setFundAmount("")
                            setVirtualAccountDetails(null)
                            setFundingRequestId(null)
                          }}
                          className="w-full"
                        >
                          Cancel
                        </Button>
                      </>
                    )}
                  </>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}

      {/* Withdrawal Modal */}
      <Dialog open={showWithdrawalModal} onOpenChange={setShowWithdrawalModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Withdraw Funds</DialogTitle>
            </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Amount Input */}
            <div>
              <label htmlFor="withdrawal-amount" className="text-sm font-medium text-gray-700 mb-2 block">
                Amount (NGN)
              </label>
              <Input
                id="withdrawal-amount"
                type="number"
                placeholder="Enter amount"
                value={withdrawalAmount}
                onChange={(e) => setWithdrawalAmount(e.target.value)}
                disabled={isWithdrawing}
                min="1"
              />
            </div>

            {/* Beneficiary Selection Dropdown */}
            <div>
              <label htmlFor="withdrawal-beneficiary" className="text-sm font-medium text-gray-700 mb-2 block">
                Repayment Account
              </label>
              {beneficiariesError ? (
                <div className="text-sm text-red-600 mb-2">{beneficiariesError}</div>
              ) : null}
              <Select
                value={selectedBeneficiary}
                onValueChange={setSelectedBeneficiary}
                disabled={isWithdrawing || isLoadingBeneficiaries}
              >
                <SelectTrigger id="withdrawal-beneficiary" className="w-full">
                  <SelectValue placeholder={isLoadingBeneficiaries ? "Loading repayment accounts..." : beneficiaries.length === 0 ? "No repayment accounts found" : "Select repayment account"} />
                </SelectTrigger>
                <SelectContent>
                  {beneficiaries.map((beneficiary) => (
                    <SelectItem key={beneficiary.id} value={beneficiary.id}>
                      {beneficiary.account_name} - {beneficiary.bank_name} ({beneficiary.account_number})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {beneficiaries.length === 0 && !isLoadingBeneficiaries && !beneficiariesError && (
                <p className="text-xs text-gray-500 mt-1">
                  Add a repayment account in your profile settings first.
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowWithdrawalModal(false)
                  setWithdrawalAmount("")
                  setSelectedBeneficiary("")
                }}
                disabled={isWithdrawing}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleWithdrawal}
                disabled={
                  isWithdrawing || 
                  !withdrawalAmount || 
                  Number(withdrawalAmount) <= 0 ||
                  !selectedBeneficiary ||
                  beneficiaries.length === 0
                }
              >
                {isWithdrawing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Withdraw"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
        </Dialog>

      {/* Transaction Status Modal */}
      <Dialog open={showOnrampStatusModal} onOpenChange={setShowOnrampStatusModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Funding Transaction Status</DialogTitle>
            </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Transaction ID */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Transaction ID
              </label>
              <p className="text-sm text-gray-900 font-mono bg-gray-50 p-2 rounded">
                {onrampTransactionId || 'N/A'}
              </p>
            </div>

            {/* Status */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Status
              </label>
              <div className="flex items-center gap-2">
                {onrampStatus === 'pending' || onrampStatus === 'processing' ? (
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                ) : onrampStatus === 'completed' ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-600" />
                )}
                <span className="text-sm font-medium capitalize">
                  {onrampStatus}
                </span>
              </div>
            </div>

            {/* Amount */}
            {onrampDetails && (
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Amount
                </label>
                <p className="text-sm text-gray-900">
                  ₦{onrampDetails.amount?.toLocaleString()}
                </p>
              </div>
            )}

            {/* Network */}
            {onrampDetails && (
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Network
                </label>
                <p className="text-sm text-gray-900 font-medium">
                  {onrampDetails.network}
                </p>
              </div>
            )}

            {/* Wallet Address */}
            {onrampDetails && (
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Wallet Address
                </label>
                <p className="text-xs text-gray-900 font-mono bg-gray-50 p-2 rounded break-all">
                  {onrampDetails.walletAddress}
                </p>
              </div>
            )}

            {/* Transaction Hash (if available) */}
            {onrampDetails?.transactionHash && (
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Transaction Hash
                </label>
                <p className="text-xs text-gray-900 font-mono bg-gray-50 p-2 rounded break-all">
                  {onrampDetails.transactionHash}
                </p>
              </div>
            )}

            {/* Estimated Completion Time */}
            {onrampDetails?.estimatedCompletionTime && (
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Estimated Completion
                </label>
                <p className="text-sm text-gray-900">
                  {onrampDetails.estimatedCompletionTime}
                </p>
              </div>
            )}

            {/* Close Button */}
            <div className="pt-2">
              <Button
                className="w-full"
                onClick={() => setShowOnrampStatusModal(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
        </Dialog>
    </div>
  );
}
