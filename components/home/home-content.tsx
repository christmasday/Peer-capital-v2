"use client"

import { useState, useEffect } from "react"
import { Eye, EyeOff, Plus, ArrowRightLeft, TrendingUp, ArrowDown, Search, Loader2, AlertCircle, Info, CheckCircle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { HelperCard } from "@/components/helpers/helper-card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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
  const [userVirtualAccount, setUserVirtualAccount] = useState<{ account_number: string; bank_name: string } | null>(null)
  const [isCreatingVA, setIsCreatingVA] = useState(false)
  const [showOnboardingModal, setShowOnboardingModal] = useState(false)
  const [onboardingStep, setOnboardingStep] = useState<'bvn' | 'otp' | 'complete'>('bvn')
  const [onboardingRequestId, setOnboardingRequestId] = useState<string | null>(null)
  const [otpInput, setOtpInput] = useState("")
  const [isSendingBVN, setIsSendingBVN] = useState(false)
  const [showFundModal, setShowFundModal] = useState(false)
  const [fundAmount, setFundAmount] = useState("")
  const [isFunding, setIsFunding] = useState(false)
  const [onrampTransactionId, setOnrampTransactionId] = useState<string | null>(null)
  const [onrampCorrelationId, setOnrampCorrelationId] = useState<string | null>(null)
  const [onrampStatus, setOnrampStatus] = useState<string>('pending')
  const [showOnrampStatusModal, setShowOnrampStatusModal] = useState(false)
  const [onrampDetails, setOnrampDetails] = useState<any>(null)
  const [baseWalletBalance, setBaseWalletBalance] = useState<string | null>(null)
  const [isLoadingBalance, setIsLoadingBalance] = useState(false)
  const [balanceError, setBalanceError] = useState<string | null>(null)
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false)
  const [withdrawalAmount, setWithdrawalAmount] = useState("")
  const [withdrawalBank, setWithdrawalBank] = useState("")
  const [withdrawalAccountNumber, setWithdrawalAccountNumber] = useState("")
  const [banks, setBanks] = useState<{ name: string; code: string }[]>([])
  const [isLoadingBanks, setIsLoadingBanks] = useState(false)
  const [isWithdrawing, setIsWithdrawing] = useState(false)

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

        // Fetch user's virtual account from DB via Stablesrail proxy
        try {
          const vaRes = await fetch('/api/stablesrail/virtual-account', { credentials: 'include' })
          if (vaRes.ok) {
            const vaJson = await vaRes.json()
            if (vaJson?.data?.account_number) {
              setUserVirtualAccount({
                account_number: vaJson.data.account_number,
                bank_name: vaJson.data.bank_name || 'Stablesrail',
              })
              
              // Fetch BASE wallet balance if virtual account exists
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
          }
        } catch {}
      } finally {
        setTimelineLoading(false)
      }
    })()
  }, [])

  // Fetch Nigerian banks for withdrawal from Stablesrail
  useEffect(() => {
    async function fetchBanks() {
      setIsLoadingBanks(true)
      try {
        const res = await fetch('/api/stablesrail/get-bank-codes', {
          credentials: 'include'
        })
        const data = await res.json()
        
        if (data.success && Array.isArray(data.data?.banks)) {
          setBanks(data.data.banks.map((bank: any) => ({ 
            name: bank.name, 
            code: bank.code 
          })))
        }
      } catch (error) {
        console.error('Failed to fetch banks:', error)
        toast({
          title: "Error",
          description: "Failed to load banks list",
          variant: "destructive"
        })
      } finally {
        setIsLoadingBanks(false)
      }
    }
    fetchBanks()
  }, [])

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

  // Handle virtual account creation
  const handleCreateVirtualAccount = async () => {
    setIsCreatingVA(true)
    
    try {
      // 1. Check if user has BVN
      if (!userProfile.profile?.bvn) {
        toast({
          title: "Profile Incomplete",
          description: "Please complete your profile and add your BVN, then try creating a virtual account again.",
          variant: "destructive",
        })
        return
      }
      
      // 2. Check if user has sr_user_id (already onboarded)
      if (userProfile.profile?.sr_user_id) {
        // User is onboarded, fetch details from user-details endpoint
        const response = await fetch(`/api/stablesrail/user-details?userId=${userProfile.profile.sr_user_id}`, {
          credentials: 'include'
        })
        
        const data = await response.json()
        
        if (data.success && data.data?.virtualAccount) {
          // Update local state with fetched virtual account
          setUserVirtualAccount({
            account_number: data.data.virtualAccount.accountNumber,
            bank_name: 'Stablesrail',
          })
          
          toast({
            title: "Success",
            description: "Virtual account details retrieved successfully!",
          })
        } else {
          throw new Error(data.error || 'Failed to fetch virtual account details')
        }
      } else {
        // 3. User has BVN but no sr_user_id - need to onboard
        // Show onboarding modal/flow
        setShowOnboardingModal(true)
      }
    } catch (error) {
      console.error('Error creating virtual account:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process request",
        variant: "destructive",
      })
    } finally {
      setIsCreatingVA(false)
    }
  }

  // Step 1: Onboard with BVN
  const handleBVNOnboarding = async () => {
    console.log('🔵 handleBVNOnboarding called')
    console.log('🔵 User BVN:', userProfile.profile?.bvn)
    
    setIsSendingBVN(true)
    
    try {
      console.log('🔵 Calling /api/stablesrail/onboard-user...')
      
      const response = await fetch('/api/stablesrail/onboard-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bvn: userProfile.profile.bvn }),
        credentials: 'include'
      })
      
      console.log('🔵 Response status:', response.status)
      
      const data = await response.json()
      console.log('🔵 Response data:', data)
      
      if (response.ok && data.success && data.requestId) {
        console.log('✅ BVN onboarding successful, requestId:', data.requestId)
        setOnboardingRequestId(data.requestId)
        setOnboardingStep('otp')
        toast({
          title: "OTP Sent",
          description: "Please check your phone for the verification code.",
        })
      } else {
        console.error('❌ BVN onboarding failed:', data.error)
        throw new Error(data.error || 'Failed to onboard')
      }
    } catch (error) {
      console.error('❌ Exception in handleBVNOnboarding:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to onboard",
        variant: "destructive",
      })
    } finally {
      setIsSendingBVN(false)
    }
  }

  // Step 2: Verify OTP
  const handleOTPVerification = async (otp: string) => {
    try {
      const response = await fetch('/api/stablesrail/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          sessionId: onboardingRequestId, 
          otp 
        }),
        credentials: 'include'
      })
      
      const data = await response.json()
      
      if (data.success && data.userId) {
        // Save sr_user_id to profile
        await fetch('/api/user-profile', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            sr_user_id: data.userId,
            correlation_id: onboardingRequestId,
            bvn_verified: true
          }),
          credentials: 'include'
        })
        
        setOnboardingStep('complete')
        
        // Now create virtual account
        await handleCreateVirtualAccount()
        
        setShowOnboardingModal(false)
      } else {
        throw new Error(data.error || 'Invalid OTP')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to verify OTP",
        variant: "destructive",
      })
    }
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

    setIsFunding(true)

    try {
      // Fetch BASE wallet address
      const walletResponse = await fetch('/api/stablesrail/wallet-address', {
        credentials: 'include'
      })

      if (!walletResponse.ok) {
        throw new Error('Failed to fetch wallet addresses')
      }

      const walletData = await walletResponse.json()

      if (!walletData.success || !walletData.walletAddresses?.base_address) {
        throw new Error('BASE wallet address not found. Please create a virtual account first.')
      }

      // Call CNGN onramp with explicit BASE network
      const response = await fetch('/api/stablesrail/cngn-onramp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userProfile.profile.sr_user_id,
          amount: Number(fundAmount),
          walletAddress: walletData.walletAddresses.base_address,
          network: "BASE" // Always use BASE network
        }),
        credentials: 'include'
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // Extract transaction details
        setOnrampTransactionId(data.data.transactionId)
        setOnrampCorrelationId(data.data.correlationId)
        setOnrampStatus(data.data.status || 'pending')
        setOnrampDetails({
          amount: Number(fundAmount),
          network: 'BASE',
          walletAddress: walletData.walletAddresses.base_address,
          estimatedCompletionTime: data.data.estimatedCompletionTime
        })
        
        // Close fund modal, open status modal
        setShowFundModal(false)
        setFundAmount("")
        setShowOnrampStatusModal(true)
        
        // Start polling if not completed
        if (data.data.status !== 'completed' && data.data.status !== 'failed') {
          pollOnrampStatus(data.data.correlationId)
        }
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

    if (!withdrawalBank) {
      toast({
        title: "Bank Required",
        description: "Please select a destination bank.",
        variant: "destructive"
      })
      return
    }

    if (!withdrawalAccountNumber || withdrawalAccountNumber.length !== 10) {
      toast({
        title: "Invalid Account Number",
        description: "Please enter a valid 10-digit account number.",
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

    setIsWithdrawing(true)

    try {
      // Find bank code from selected bank name
      const selectedBank = banks.find(b => b.name === withdrawalBank)
      if (!selectedBank) {
        throw new Error('Bank not found')
      }

      // Call the CNGN offramp API (as shown in screenshot)
      const response = await fetch('/api/stablesrail/cngn-offramp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userProfile.profile.sr_user_id,
          amount: Number(withdrawalAmount),
          bankAccountNumber: withdrawalAccountNumber,
          bankCode: selectedBank.code,
        }),
        credentials: 'include'
      })

      const data = await response.json()

      if (response.ok && data.success) {
        toast({
          title: "Withdrawal Initiated",
          description: `Withdrawal request submitted successfully. Transaction ID: ${data.data?.transactionId || 'N/A'}`,
        })
        setShowWithdrawalModal(false)
        setWithdrawalAmount("")
        setWithdrawalBank("")
        setWithdrawalAccountNumber("")
      } else {
        throw new Error(data.error || 'Failed to initiate withdrawal')
      }
    } catch (error) {
      console.error('❌ Withdrawal failed:', error)
      toast({
        title: "Withdrawal Failed",
        description: error instanceof Error ? error.message : "Failed to process withdrawal",
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
        <div className="hidden lg:flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {userProfile.profile?.first_name || "User"}
          </h1>
          {/* Removed the notification button with Bell icon */}
        </div>

        {/* Dashboard + Quick Loan Request */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
          {/* Dashboard only (timeline removed) */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="mb-5">
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl p-5">
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-center w-full">
                      <p className="text-blue-100 text-xs">Account Balance</p>
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-2xl font-bold">
                          {showBalance ? `₦${(accountBalance?.balance ?? 0).toLocaleString()}` : '₦****'}
                        </span>
                        <button className="text-white/80" onClick={() => setShowBalance(!showBalance)}>
                          {showBalance ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      <p className="text-blue-200 text-xs mt-1">& Loan Balance ₦{(accountBalance?.loan_balance ?? 0).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-blue-100 text-xs">Your Virtual Account:</p>
                    {userVirtualAccount?.account_number ? (
                      <>
                        <div className="flex items-center gap-2">
                          <span className="text-lg tracking-widest font-semibold">{userVirtualAccount.account_number}</span>
                          {userVirtualAccount.bank_name && (
                            <span className="text-blue-200 text-xs">{userVirtualAccount.bank_name}</span>
                          )}
                        </div>
                        
                        {/* Balance Display */}
                        <div className="mt-2 pt-2 border-t border-blue-400/30">
                          <p className="text-blue-100 text-xs mb-1">BASE Wallet Balance:</p>
                          {isLoadingBalance ? (
                            <div className="flex items-center gap-2">
                              <Loader2 className="h-3 w-3 animate-spin text-blue-200" />
                              <span className="text-sm text-blue-200">Loading balance...</span>
                            </div>
                          ) : balanceError ? (
                            <div className="flex items-center gap-2">
                              <AlertCircle className="h-3 w-3 text-red-300" />
                              <span className="text-xs text-red-200">{balanceError}</span>
                            </div>
                          ) : baseWalletBalance !== null ? (
                            <div className="flex items-center gap-2">
                              <span className="text-xl font-bold">
                                {baseWalletBalance} ETH
                              </span>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={async () => {
                                  const walletResponse = await fetch('/api/stablesrail/wallet-address', {
                                    credentials: 'include'
                                  })
                                  if (walletResponse.ok) {
                                    const walletData = await walletResponse.json()
                                    if (walletData.success && walletData.walletAddresses?.base_address) {
                                      await fetchBaseWalletBalance(walletData.walletAddresses.base_address)
                                    }
                                  }
                                }}
                                className="h-6 px-2 text-xs text-blue-200 hover:text-white hover:bg-blue-600"
                              >
                                Refresh
                              </Button>
                            </div>
                          ) : (
                            <span className="text-sm text-blue-200">—</span>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-lg tracking-widest font-semibold text-blue-200">— — — — — — — — —</span>
                        <Button
                          size="sm"
                          onClick={handleCreateVirtualAccount}
                          disabled={isCreatingVA}
                          className="bg-white text-blue-600 hover:bg-gray-50 text-xs px-3 py-1 h-auto"
                        >
                          {isCreatingVA ? (
                            <>
                              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                              Creating...
                            </>
                          ) : (
                            'Create Virtual Account'
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-4 mt-5">
                    <Button
                      variant="secondary"
                      className="w-full h-16 flex flex-col items-center justify-center gap-2 bg-white text-blue-600 hover:bg-gray-50"
                      onClick={() => setShowFundModal(true)}
                    >
                      <Plus className="h-6 w-6" />
                      <span className="text-sm font-medium">Fund</span>
                    </Button>
                    <Button
                      variant="secondary"
                      className="w-full h-16 flex flex-col items-center justify-center gap-2 bg-white text-blue-600 hover:bg-gray-50"
                      onClick={() => setShowWithdrawalModal(true)}
                    >
                      <ArrowDown className="h-6 w-6" />
                      <span className="text-sm font-medium">Withdrawal</span>
                    </Button>
                    <Link href="/timeline" className="w-full">
                      <Button
                        variant="secondary"
                        className="w-full h-16 flex flex-col items-center justify-center gap-2 bg-white text-blue-600 hover:bg-gray-50"
                      >
                        <TrendingUp className="h-6 w-6" />
                        <span className="text-sm font-medium">Timeline</span>
                      </Button>
                    </Link>
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

      {/* Onboarding Modal */}
      {showOnboardingModal && (
        <Dialog open={showOnboardingModal} onOpenChange={setShowOnboardingModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {onboardingStep === 'bvn' && 'Verify Your BVN'}
                {onboardingStep === 'otp' && 'Enter OTP'}
                {onboardingStep === 'complete' && 'Verification Complete'}
              </DialogTitle>
            </DialogHeader>
            
            {onboardingStep === 'bvn' && (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  We need to verify your BVN with Stablesrail before creating your virtual account.
                </p>
                <p className="text-sm font-medium">BVN: {userProfile.profile?.bvn}</p>
                <Button 
                  onClick={handleBVNOnboarding} 
                  disabled={isSendingBVN}
                  className="w-full"
                >
                  {isSendingBVN ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending Code...
                    </>
                  ) : (
                    'Send Verification Code'
                  )}
                </Button>
              </div>
            )}
            
            {onboardingStep === 'otp' && (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Enter the 6-digit code sent to your phone.
                </p>
                <Input
                  type="text"
                  placeholder="Enter OTP"
                  maxLength={6}
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value)}
                />
                <Button 
                  onClick={() => handleOTPVerification(otpInput)} 
                  className="w-full"
                  disabled={otpInput.length !== 6}
                >
                  Verify OTP
                </Button>
              </div>
            )}
            
            {onboardingStep === 'complete' && (
              <div className="text-center space-y-4">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
                <p className="text-sm text-gray-600">
                  Your BVN has been verified successfully!
                </p>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}

      {/* Fund Modal */}
      {showFundModal && (
        <Dialog open={showFundModal} onOpenChange={setShowFundModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Fund Account</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Fund your account with CNGN via Base network
              </p>
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
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleFund}
                  disabled={isFunding || !fundAmount || Number(fundAmount) <= 0}
                  className="flex-1"
                >
                  {isFunding ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Funding...
                    </>
                  ) : (
                    'Fund Account'
                  )}
                </Button>
              </div>
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
              />
            </div>

            {/* Bank Selection Dropdown */}
            <div>
              <label htmlFor="withdrawal-bank" className="text-sm font-medium text-gray-700 mb-2 block">
                Destination Bank
              </label>
              <select
                id="withdrawal-bank"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                value={withdrawalBank}
                onChange={(e) => setWithdrawalBank(e.target.value)}
                disabled={isWithdrawing || isLoadingBanks}
              >
                <option value="">
                  {isLoadingBanks ? 'Loading banks...' : 'Select bank'}
                </option>
                {banks.map((bank) => (
                  <option key={bank.code} value={bank.name}>
                    {bank.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Account Number Input */}
            <div>
              <label htmlFor="withdrawal-account" className="text-sm font-medium text-gray-700 mb-2 block">
                Account Number
              </label>
              <Input
                id="withdrawal-account"
                type="text"
                placeholder="Enter 10-digit account number"
                value={withdrawalAccountNumber}
                onChange={(e) => setWithdrawalAccountNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                disabled={isWithdrawing}
                maxLength={10}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowWithdrawalModal(false)
                  setWithdrawalAmount("")
                  setWithdrawalBank("")
                  setWithdrawalAccountNumber("")
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
                  !withdrawalBank ||
                  withdrawalAccountNumber.length !== 10
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
  )
}
