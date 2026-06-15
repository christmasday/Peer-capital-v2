"use client"

import { useState, useEffect, useRef } from "react"
import { Eye, EyeOff, Plus, ArrowRightLeft, History, ArrowDown, Search, Loader2, AlertCircle, Info, CheckCircle, TrendingUp } from "lucide-react"
import { Input } from "@/components/ui/input"
import { HelperCard } from "@/components/helpers/helper-card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { durationToDays } from "@/lib/loan-limits"
import { findBorrowers } from "@/lib/actions/find-borrowers"

interface HomeContentProps {
  userProfile: any
  loanHelpers: any[]
}

type BorrowerPolicy = {
  level?: number
  min: number
  max: number
  minTenorDays: number
  maxTenorDays: number
  interestMinPct: number
  interestMaxPct: number
}

type LenderCardData = {
  id: string
  name: string
  interestRate: number
  maxLoanAmount: number
  loanAmount: number
  loanIssued: number
  amountIssued: number
  profileImage: string
  rating: number
  repaymentTime: number
  repaymentUnit: string
}

function normalizeLenderCard(helper: any, fallbackRating = 4.5): LenderCardData {
  const loanAmount = Number(helper.loanAmount ?? helper.max_loan_amount ?? 0)
  const loanIssued = Number(helper.loans_issued ?? 0)
  const amountIssued = Number(helper.amount_issued ?? 0)
  const repaymentTime = Number(helper.repaymentTime ?? helper.repayment_time ?? 0)
  const repaymentUnit = helper.repaymentUnit ?? helper.repayment_unit ?? "months"
  const interestRate = Number.parseFloat(String(helper.interest_rate ?? helper.interestRate ?? 0))
  const rating = Number(helper.rating ?? fallbackRating)

  return {
    id: String(helper.id),
    name: String(helper.name ?? "Loan Helper"),
    interestRate,
    maxLoanAmount: loanAmount,
    loanAmount,
    loanIssued,
    amountIssued,
    profileImage: String(helper.profile_image_url ?? helper.profileImage ?? "/vibrant-street-market.png"),
    rating,
    repaymentTime,
    repaymentUnit,
  }
}

function normalizeBorrowerCard(borrower: any, fallbackRating = 4.5): LenderCardData {
  return {
    id: String(borrower.id),
    name: String(borrower.name ?? "Borrower"),
    interestRate: Number(borrower.expected_interest_rate ?? 0),
    maxLoanAmount: Number(borrower.requested_amount ?? 0),
    loanAmount: Number(borrower.requested_amount ?? 0),
    loanIssued: 0,
    amountIssued: 0,
    profileImage: String(borrower.profile_image_url ?? "/vibrant-street-market.png"),
    rating: Number(borrower.rating ?? fallbackRating),
    repaymentTime: Number(borrower.requested_duration ?? 0),
    repaymentUnit: borrower.requested_duration_unit ?? "months",
  }
}

const LoanRequestForm = ({ 
  loanAmount, setLoanAmount, 
  loanDuration, setLoanDuration, 
  loanDurationUnit, setLoanDurationUnit,
  amountError, durationError,
  loanLimits, loanLimitsLoading,
  activePolicy,
  canSearch,
  isSearching,
  onSearch,
  searchButtonText,
  searchTab
}: any) => (
  <div className="space-y-3">
    <div>
      <label htmlFor="loan-amount" className="block text-xs font-medium text-gray-700 mb-1">
        {searchTab === 'borrower' ? "How much do you want? (optional)" : "Target loan amount (optional)"}
      </label>
      <Input
        id="loan-amount"
        placeholder="Enter amount"
        className={`w-full py-2 px-3 text-sm rounded-lg transition-colors border border-transparent border-b-2 ${amountError ? "border-b-red-500 bg-red-50 focus-visible:ring-red-500" : "border-b-gray-200 focus-visible:ring-blue-500"}`}
        value={loanAmount}
        onChange={(e) => setLoanAmount(e.target.value)}
        type="number"
        min="1000"
        max={loanLimits?.borrowerMaxAmount}
        aria-invalid={Boolean(amountError)}
      />
      {amountError && (
        <p className="mt-1 text-xs text-red-600">{amountError}</p>
      )}
    </div>
    <div>
      <label htmlFor="loan-duration" className="block text-xs font-medium text-gray-700 mb-1">
        Duration (optional)
      </label>
      <div className={`grid items-stretch rounded-lg border border-transparent border-b-2 transition-colors group ${durationError ? "border-b-red-500 bg-red-50 focus-within:border-b-red-500" : "border-b-gray-200 bg-white focus-within:border-b-blue-500"}`} style={{ gridTemplateColumns: "7fr 3fr" }}>
        <Input
          id="loan-duration"
          placeholder="Enter duration"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          className={`w-full border-0 bg-transparent py-2 px-3 text-sm rounded-r-none shadow-none focus-visible:ring-0 ${durationError ? "text-red-900 placeholder:text-red-300" : "text-gray-900 placeholder:text-gray-400"}`}
          value={loanDuration}
          onChange={(e) => setLoanDuration(e.target.value)}
          aria-invalid={Boolean(durationError)}
        />
        <Select value={loanDurationUnit} onValueChange={(value) => setLoanDurationUnit(value as "days" | "months")}> 
            <SelectTrigger className={`h-full w-full border-l rounded-l-none rounded-r-lg bg-white px-3 py-2 text-sm shadow-none focus:ring-0 ${durationError ? "text-red-700 justify-end pr-2 border-l-transparent" : "text-gray-700 justify-end pr-2 border-l-gray-200 group-focus-within:border-l-blue-500"}`}>
              <SelectValue placeholder="Unit" className="text-right" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="days">Days</SelectItem>
              <SelectItem value="months">Months</SelectItem>
            </SelectContent>
          </Select>
      </div>
      {durationError && (
        <p className="mt-1 text-xs text-red-600">{durationError}</p>
      )}
    </div>
    {!loanLimitsLoading && loanLimits && (
      <p className="text-[11px] text-gray-500 leading-relaxed">
        Current limit: up to ₦{loanLimits.borrowerMaxAmount.toLocaleString()} and a tenor of up to {loanLimits.currentBorrowerPolicy.maxTenorDays} days
        {" "}
        ({Math.max(1, Math.ceil(loanLimits.currentBorrowerPolicy.maxTenorDays / 30))} month(s)).
      </p>
    )}
    {loanLimitsLoading && (
      <p className="text-[11px] text-gray-500">Loading your current limits...</p>
    )}
    <Button
      onClick={onSearch}
      disabled={isSearching || !canSearch}
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
          {searchButtonText}
        </>
      )}
    </Button>
  </div>
)

export function HomeContent({ userProfile, loanHelpers }: HomeContentProps) {
  const { toast } = useToast()
  const searchResultsSentinelRef = useRef<HTMLDivElement | null>(null)
  const SEARCH_PAGE_SIZE = 12
  const [loanAmount, setLoanAmount] = useState<string>("")
  const [loanDuration, setLoanDuration] = useState<string>("")
  const [loanDurationUnit, setLoanDurationUnit] = useState<"days" | "months">("months")
  const [isSearching, setIsSearching] = useState(false)
  const [isLoadingMoreLenders, setIsLoadingMoreLenders] = useState(false)
  const [searchResults, setSearchResults] = useState<any[] | null>(null)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [hasSearched, setHasSearched] = useState(false)
  const [searchPage, setSearchPage] = useState(1)
  const [searchHasMore, setSearchHasMore] = useState(false)
  const [searchQuery, setSearchQuery] = useState<{
    loanAmount?: number
    loanDuration?: number
    loanDurationUnit: "days" | "months"
  } | null>(null)
  const [searchTab, setSearchTab] = useState<"borrower" | "lender">("borrower")
  const [loanLimits, setLoanLimits] = useState<{
    borrowerMaxAmount: number
    borrowerPolicies: BorrowerPolicy[]
    currentBorrowerPolicy: BorrowerPolicy
  } | null>(null)
  const [loanLimitsLoading, setLoanLimitsLoading] = useState(true)
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
  const [virtualAccountError, setVirtualAccountError] = useState<string | null>(null)
  const [vaRetryCount, setVaRetryCount] = useState(0)
  const VA_MAX_RETRIES = 3
  const [hasConfirmedTransfer, setHasConfirmedTransfer] = useState(false)
  const [isPollingCompletion, setIsPollingCompletion] = useState(false)
  const [fundingCompleted, setFundingCompleted] = useState(false)
  const [onrampWalletAddress, setOnrampWalletAddress] = useState<string | null>(null)
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

  useEffect(() => {
    let cancelled = false

    async function loadLoanLimits() {
      setLoanLimitsLoading(true)
      try {
        const response = await fetch("/api/loan-limits", { credentials: "include" })
        const data = await response.json()

        if (!cancelled && response.ok) {
          setLoanLimits(data)
        } else if (!cancelled) {
          setLoanLimits(null)
        }
      } catch (error) {
        if (!cancelled) {
          setLoanLimits(null)
        }
      } finally {
        if (!cancelled) {
          setLoanLimitsLoading(false)
        }
      }
    }

    loadLoanLimits()

    return () => {
      cancelled = true
    }
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

  const fetchLenderSearchPage = async (pageToLoad: number, replaceResults: boolean, queryOverride?: typeof searchQuery) => {
    const query = queryOverride || searchQuery

    if (!query) {
      return
    }

    if (replaceResults) {
      setIsSearching(true)
      setSearchError(null)
    } else {
      setIsLoadingMoreLenders(true)
    }

    try {
      const res = await fetch("/api/find-lenders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          loanAmount: query.loanAmount,
          loanDuration: query.loanDuration,
          loanDurationUnit: query.loanDurationUnit,
          page: pageToLoad,
          pageSize: SEARCH_PAGE_SIZE,
        }),
        credentials: "include",
      })

      const { lenders, error, hasMore, page } = await res.json()

      if (error) {
        if (replaceResults || !searchResults?.length) {
          setSearchError(error)
          toast({
            title: "No Matches Found",
            description: error,
            variant: "destructive",
          })
          setSearchResults([])
          if (replaceResults && query && error.toLowerCase().includes("no lenders found")) {
            void persistSearchAlert(query)
          }
        } else {
          toast({
            title: "Search Paused",
            description: error,
            variant: "destructive",
          })
        }
        setSearchHasMore(false)
        return
      }

      if (replaceResults) {
        if (lenders.length === 0) {
          const message = "No lenders found matching your criteria. Try adjusting your search."
          setSearchError(message)
          setSearchResults([])
          if (query) {
            void persistSearchAlert(query)
          }
          toast({
            title: "No Matches Found",
            description: message,
            variant: "destructive",
          })
        } else {
          setSearchResults(lenders)
          toast({
            title: "Lenders Found",
            description: `Found ${lenders.length} lenders matching your criteria`,
          })
        }
      } else {
        setSearchResults((current) => [...(current || []), ...lenders])
      }

      setSearchPage(page || pageToLoad)
      setSearchHasMore(Boolean(hasMore))
    } catch (error) {
      const message = "An unexpected error occurred"
      if (replaceResults || !searchResults?.length) {
        setSearchError(message)
        setSearchResults([])
        toast({
          title: "Error",
          description: "Failed to find lenders. Please try again.",
          variant: "destructive",
        })
      }
      setSearchHasMore(false)
    } finally {
      setIsSearching(false)
      setIsLoadingMoreLenders(false)
    }
  }

  const persistSearchAlert = async (query: NonNullable<typeof searchQuery>) => {
    try {
      const res = await fetch("/api/search-alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          searchKind: "lender_search",
          loanAmount: query.loanAmount,
          loanDuration: query.loanDuration,
          loanDurationUnit: query.loanDurationUnit,
        }),
      })

      if (res.ok) {
        toast({
          title: "Search saved",
          description: "We’ll alert you for the next 7 days if a lender matches your criteria.",
        })
      }
    } catch {
      // Best-effort only.
    }
  }

  const fetchBorrowerSearchPage = async (pageToLoad: number, replaceResults: boolean, queryOverride?: typeof searchQuery) => {
    const query = queryOverride || searchQuery

    if (!query) {
      return
    }

    if (replaceResults) {
      setIsSearching(true)
      setSearchError(null)
    } else {
      setIsLoadingMoreLenders(true)
    }

    try {
      const result = await findBorrowers({
        amount: query.loanAmount || 0,
        duration: query.loanDuration || 0,
        durationUnit: query.loanDurationUnit,
      })

      if (result.error) {
        if (replaceResults || !searchResults?.length) {
          setSearchError(result.error)
          toast({
            title: "No Matches Found",
            description: result.error,
            variant: "destructive",
          })
          setSearchResults([])
          if (replaceResults && query && result.error.toLowerCase().includes("no borrowers found")) {
            void persistBorrowerSearchAlert(query)
          }
        } else {
          toast({
            title: "Search Paused",
            description: result.error,
            variant: "destructive",
          })
        }
        setSearchHasMore(false)
        return
      }

      const borrowers = result.borrowers || []

      if (replaceResults) {
        if (borrowers.length === 0) {
          const message = "No borrowers found matching your criteria. Try adjusting your search."
          setSearchError(message)
          setSearchResults([])
          if (query) {
            void persistBorrowerSearchAlert(query)
          }
          toast({
            title: "No Matches Found",
            description: message,
            variant: "destructive",
          })
        } else {
          setSearchResults(borrowers)
          toast({
            title: "Borrowers Found",
            description: `Found ${borrowers.length} borrowers matching your criteria`,
          })
        }
      } else {
        setSearchResults((current) => [...(current || []), ...borrowers])
      }

      // Server action currently doesn't return page/hasMore, defaulting to current values
      setSearchPage(pageToLoad)
      setSearchHasMore(false) 
    } catch (error) {
      const message = "An unexpected error occurred"
      if (replaceResults || !searchResults?.length) {
        setSearchError(message)
        setSearchResults([])
        toast({
          title: "Error",
          description: "Failed to find borrowers. Please try again.",
          variant: "destructive",
        })
      }
      setSearchHasMore(false)
    } finally {
      setIsSearching(false)
      setIsLoadingMoreLenders(false)
    }
  }

  const persistBorrowerSearchAlert = async (query: NonNullable<typeof searchQuery>) => {
    try {
      const res = await fetch("/api/search-alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          searchKind: "borrower_search",
          loanAmount: query.loanAmount,
          loanDuration: query.loanDuration,
          loanDurationUnit: query.loanDurationUnit,
        }),
      })

      if (res.ok) {
        toast({
          title: "Search saved",
          description: "We’ll alert you for the next 7 days if a borrower matches your criteria.",
        })
      }
    } catch {
      // Best-effort only.
    }
  }

  const handleFindLenders = async () => {
    setIsSearching(true)
    setSearchError(null)
    setHasSearched(true)
    setSearchResults(null)
    setSearchPage(1)
    setSearchHasMore(false)

    try {
      const amount = loanAmount ? Number.parseFloat(loanAmount) : undefined
      const duration = loanDuration ? Number.parseInt(loanDuration) : undefined

      if ((!amount || amount <= 0) && (!duration || duration <= 0)) {
        setSearchError("Please enter either a loan amount or duration")
        setIsSearching(false)
        return
      }

      const nextQuery = {
        loanAmount: amount && amount > 0 ? amount : undefined,
        loanDuration: duration && duration > 0 ? duration : undefined,
        loanDurationUnit,
      }

      setSearchQuery(nextQuery)
      await fetchLenderSearchPage(1, true, nextQuery)
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

  const handleFindBorrowers = async () => {
    setIsSearching(true)
    setSearchError(null)
    setHasSearched(true)
    setSearchResults(null)
    setSearchPage(1)
    setSearchHasMore(false)

    try {
      const amount = loanAmount ? Number.parseFloat(loanAmount) : undefined
      const duration = loanDuration ? Number.parseInt(loanDuration) : undefined

      if ((!amount || amount <= 0) && (!duration || duration <= 0)) {
        setSearchError("Please enter either a loan amount or duration")
        setIsSearching(false)
        return
      }

      const nextQuery = {
        loanAmount: amount && amount > 0 ? amount : undefined,
        loanDuration: duration && duration > 0 ? duration : undefined,
        loanDurationUnit,
      }

      setSearchQuery(nextQuery)
      await fetchBorrowerSearchPage(1, true, nextQuery)
    } catch (error) {
      setSearchError("An unexpected error occurred")
      setSearchResults([])
      toast({
        title: "Error",
        description: "Failed to find borrowers. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSearching(false)
    }
  }

  useEffect(() => {
    if (!hasSearched || !searchHasMore || isSearching || isLoadingMoreLenders) {
      return
    }

    const sentinel = searchResultsSentinelRef.current
    if (!sentinel) {
      return
    }

    const observer = new IntersectionObserver((entries) => {
      const [entry] = entries
      if (entry?.isIntersecting && searchQuery) {
        if (searchTab === "lender") {
          void fetchLenderSearchPage(searchPage + 1, false)
        } else {
          void fetchBorrowerSearchPage(searchPage + 1, false)
        }
      }
    }, {
      root: null,
      rootMargin: "240px",
      threshold: 0.1,
    })

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasSearched, searchHasMore, isSearching, isLoadingMoreLenders, searchPage, searchQuery, searchTab])

  const parsedLoanAmount = loanAmount ? Number.parseFloat(loanAmount) : undefined
  const parsedLoanDuration = loanDuration ? Number.parseInt(loanDuration, 10) : undefined
  const activeDurationDays = parsedLoanDuration && parsedLoanDuration > 0
    ? durationToDays(parsedLoanDuration, loanDurationUnit)
    : undefined

  const getPolicyForAmount = (amount?: number) => {
    if (!loanLimits) {
      return null
    }

    if (amount && amount > 0) {
      return loanLimits.borrowerPolicies.find((policy) => amount >= policy.min && amount <= policy.max) ?? null
    }

    return loanLimits.currentBorrowerPolicy
  }

  const activePolicy = getPolicyForAmount(parsedLoanAmount)
  const amountError = (() => {
    if (!loanAmount) return null
    if (Number.isNaN(parsedLoanAmount) || parsedLoanAmount === undefined || parsedLoanAmount <= 0) {
      return "Enter a valid amount"
    }
    if (loanLimitsLoading) {
      return null
    }
    if (!loanLimits) {
      return "Unable to load your current limits"
    }
    if (parsedLoanAmount > loanLimits.borrowerMaxAmount) {
      return `Amount exceeds your current limit of ₦${loanLimits.borrowerMaxAmount.toLocaleString()}`
    }
    return null
  })()

  const durationError = (() => {
    if (!loanDuration) return null
    if (Number.isNaN(parsedLoanDuration) || parsedLoanDuration === undefined || parsedLoanDuration <= 0) {
      return "Enter a valid duration"
    }
    if (loanLimitsLoading) {
      return null
    }
    if (!loanLimits) {
      return "Unable to load your current limits"
    }

    const policy = activePolicy ?? loanLimits.currentBorrowerPolicy
    if (!policy) {
      return null
    }

    if ((activeDurationDays ?? 0) < policy.minTenorDays) {
      return `Duration is below your minimum of ${policy.minTenorDays} days`
    }
    if ((activeDurationDays ?? 0) > policy.maxTenorDays) {
      return `Duration exceeds your maximum of ${policy.maxTenorDays} days`
    }
    return null
  })()

  const canSearch =
    !loanLimitsLoading &&
    !!loanLimits &&
    !amountError &&
    !durationError &&
    (Boolean(loanAmount?.trim()) || Boolean(loanDuration?.trim()))

  // Reset search results and show all lenders
  const handleResetSearch = () => {
    setSearchResults(null)
    setSearchError(null)
    setLoanAmount("")
    setLoanDuration("")
    setLoanDurationUnit("months")
    setHasSearched(false)
    setSearchQuery(null)
    setSearchPage(1)
    setSearchHasMore(false)
  }

  const normalizeBorrowerCard = (borrower: any, fallbackRating = 4.5): LenderCardData => {
    return {
      id: String(borrower.id),
      name: String(borrower.name ?? "Borrower"),
      interestRate: Number(borrower.expected_interest_rate ?? 0),
      maxLoanAmount: Number(borrower.requested_amount ?? 0),
      loanAmount: Number(borrower.requested_amount ?? 0),
      loanIssued: 0,
      amountIssued: 0,
      profileImage: String(borrower.profile_image_url ?? "/vibrant-street-market.png"),
      rating: Number(borrower.rating ?? fallbackRating),
      repaymentTime: Number(borrower.requested_duration ?? 0),
      repaymentUnit: borrower.requested_duration_unit ?? "months",
    }
  }

  const pollVirtualAccount = async (requestId: string) => {
    // Prevent multiple polling instances
    if (isPollingVA) {
      console.warn('Polling already in progress, skipping duplicate call')
      return
    }
    
    let attempts = 0
    const maxAttempts = 10 // Poll for up to 30 seconds (10 * 3 seconds)
    let lastError: string | null = null
    
    setIsPollingVA(true)
    console.log(`[pollVirtualAccount] Starting to poll for requestId: ${requestId}`)
    
    const poll = async () => {
      attempts++
      console.log(`[pollVirtualAccount] Attempt ${attempts}/${maxAttempts} for requestId: ${requestId}`)
      
      if (attempts > maxAttempts) {
        console.log(`[pollVirtualAccount] Max attempts reached, stopping polling`)
        setIsPollingVA(false)
        // If automatic retries remain, schedule another poll
        if (vaRetryCount < VA_MAX_RETRIES) {
          const nextRetry = vaRetryCount + 1
          setVaRetryCount(nextRetry)
          console.log(`[pollVirtualAccount] Scheduling automatic retry ${nextRetry}/${VA_MAX_RETRIES}`)
          toast({
            title: 'Retrying Virtual Account Generation',
            description: `Attempt ${nextRetry} of ${VA_MAX_RETRIES}...`,
          })
          setTimeout(() => {
            setVirtualAccountError(null)
            pollVirtualAccount(requestId)
          }, 2000)
          return
        }

        // No retries left — surface final timeout
        toast({
          title: "Virtual Account Generation Timeout",
          description: lastError || "Virtual account is taking longer than expected. Please try again later.",
          variant: "destructive"
        })
        setVirtualAccountError(lastError)
        return
      }
      
      try {
        console.log(`[pollVirtualAccount] Calling /api/stablesrail/virtual-account with requestId: ${requestId}`)
        const response = await fetch('/api/stablesrail/virtual-account', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ requestId }),
          credentials: 'include'
        })
        
        console.log(`[pollVirtualAccount] Response status: ${response.status}, ok: ${response.ok}`)
        const data = await response.json()
        console.log(`[pollVirtualAccount] Response data:`, data)
        
        // If the response is a 4xx, this is likely a transient "not ready yet" state — retry automatically
        if (!response.ok && response.status >= 400 && response.status < 500) {
          lastError = data.error || data.message || data.details?.error || `HTTP ${response.status}`
          const friendly = `Virtual account not ready yet — retrying automatically (attempt ${attempts}/${maxAttempts})...`
          setVirtualAccountError(friendly)
          console.log(`[pollVirtualAccount] Received ${response.status} — will retry immediately (short delay). Error: ${lastError}`)
          // Immediate short retry (500ms) to reduce wait when backend returns quick 4xx
          if (attempts < maxAttempts) {
            setTimeout(() => poll(), 500)
            return
          }
          // else fall through to exhaustion handling below
        }

        if (response.ok && data.success && data.data?.virtualAccount) {
          // VA details are available
          console.log(`[pollVirtualAccount] Virtual account found!`, data.data)
          setVirtualAccountDetails(data.data)
          setVirtualAccountError(null)
          setIsPollingVA(false)
          return
        }

        // Capture last error but continue polling until maxAttempts
        lastError = data.error || data.message || data.details?.error || lastError || "Virtual account not ready yet. Still checking..."
        // Show a friendly retrying message with attempt counts so user understands we're retrying
        const friendly = `Virtual account not ready yet — still checking (attempt ${attempts}/${maxAttempts})...`
        setVirtualAccountError(friendly)
        console.log(`[pollVirtualAccount] VA not ready yet. Error: ${lastError}. Will continue polling...`)

        if (attempts < maxAttempts) {
          setTimeout(() => {
            poll()
          }, 3000) // Poll every 3 seconds
        } // else handled at top of loop
      } catch (error) {
        console.error('[pollVirtualAccount] Error polling VA:', error)
        lastError = error instanceof Error ? error.message : 'Network error while polling virtual account.'
        // Show friendly retrying message if we will retry
        if (attempts < maxAttempts) {
          const friendly = `Network error while checking virtual account — retrying (attempt ${attempts + 1}/${maxAttempts})...`
          setVirtualAccountError(friendly)
          console.log(`[pollVirtualAccount] Network error, scheduling next poll in 3 seconds (attempt ${attempts + 1}/${maxAttempts})`)
          setTimeout(() => {
            console.log(`[pollVirtualAccount] Executing scheduled poll after error (attempt ${attempts + 1})`)
            poll()
          }, 3000)
        } else {
          console.log(`[pollVirtualAccount] Max attempts reached after error, stopping polling`)
          setIsPollingVA(false)
          // If retries remain, schedule automatic retry
          if (vaRetryCount < VA_MAX_RETRIES) {
            const nextRetry = vaRetryCount + 1
            setVaRetryCount(nextRetry)
            toast({
              title: 'Retrying Virtual Account Generation',
              description: `Attempt ${nextRetry} of ${VA_MAX_RETRIES} after error...`,
            })
            setTimeout(() => {
              setVirtualAccountError(null)
              pollVirtualAccount(requestId)
            }, 2000)
            return
          }

          setVirtualAccountError(lastError)
          toast({
            title: "Virtual Account Error",
            description: lastError || "Failed to check virtual account status. Please try again.",
            variant: "destructive"
          })
        }
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
          network: "BASE",
          ownerid: ""
        }),
        credentials: 'include'
      })

      const data = await response.json()

      if (response.ok && data.success && data.data?.requestId) {
        const requestId = data.data.requestId
        
        // Store requestId and initial fee breakdown
        setFundingRequestId(requestId)
        // Capture wallet address from onramp response if present — use this for status polling
        if (data.data.walletAddress) {
          setOnrampWalletAddress(data.data.walletAddress)
        } else if (data.data.walletAddresses?.base_address) {
          setOnrampWalletAddress(data.data.walletAddresses.base_address)
        }
        // Clear any previous VA error and reset retry counter, then wait 4 seconds before polling
        setVirtualAccountError(null)
        setVaRetryCount(0)
        await sleep(4000)
        // Start polling for VA details (will retry automatically up to VA_MAX_RETRIES)
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

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(String(text))
      toast({ title: 'Copied', description: 'Copied to clipboard.' })
    } catch (e) {
      console.error('Copy failed', e)
      toast({ title: 'Copy Failed', description: 'Could not copy to clipboard.', variant: 'destructive' })
    }
  }

  const pollFundingCompletion = async () => {
    // Use only the wallet address returned from the initial /cngn-onramp response
    if (!onrampWalletAddress) {
      toast({
        title: "Missing Wallet Address",
        description: "Cannot check transaction status because the onramp response did not include a wallet address.",
        variant: "destructive"
      })
      setIsPollingCompletion(false)
      return
    }
    const walletAddress = onrampWalletAddress
    
    let attempts = 0
    const maxAttempts = 100 // Poll for up to ~5 minutes (100 * 3 seconds)
    
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
          body: JSON.stringify({ walletAddress }),
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
              description: data.data.message || data.error || "The transaction could not be completed. Please try again.",
              variant: "destructive"
            })
            return
          }
        }
        
        attempts++
        if (attempts < maxAttempts) {
          setTimeout(poll, 3000) // Poll every 3 seconds
        } else {
          setIsPollingCompletion(false)
          toast({
            title: 'Status Check Timeout',
            description: 'We could not confirm the payment within the expected time. Please check with your bank or try again later.',
            variant: 'destructive'
          })
        }
      } catch (error) {
        console.error('Error polling funding completion:', error)
        attempts++
        if (attempts < maxAttempts) {
          setTimeout(poll, 3000) // Continue polling on error
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
      // Include CNGN contract address from env as a query param when available
      const cngnContract = process.env.NEXT_PUBLIC_CNGN_CONTRACT_ADDRESS || process.env.CNGN_CONTRACT_ADDRESS || ''
      const contractQuery = cngnContract ? `&contract=${encodeURIComponent(cngnContract)}` : ''
      const response = await fetch(
        `/api/stablesrail/base-balance?address=${encodeURIComponent(baseAddress)}${contractQuery}`,
        { credentials: 'include' }
      )
      
      const data = await response.json()
      
      if (response.ok && data.success) {
        setBaseWalletBalance(data.balance)
        // Keep the account balance displayed in the blue card in sync
        // with the on-chain wallet balance we just fetched.
        const parsed = Number.parseFloat(String(data.balance)) || 0
        setAccountBalance((prev) => ({ balance: parsed, loan_balance: prev?.loan_balance ?? 0 }))
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

  // Determine which results to display
  const displayResults = searchResults !== null ? searchResults : (searchTab === 'borrower' ? loanHelpers : [])
  const normalizedResults = displayResults.map((item, index) => 
    searchTab === 'borrower' 
      ? normalizeLenderCard(item, 4.5 - index * 0.2)
      : normalizeBorrowerCard(item, 4.5 - index * 0.2)
  )

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
                <div className="grid grid-cols-3 gap-2 sm:gap-4 md:gap-8 w-full mt-6 sm:mt-10 px-2 sm:px-0">
                  <Button
                    variant="secondary"
                    className="w-full h-16 sm:h-20 md:h-24 flex flex-col items-center justify-center gap-1 sm:gap-2 bg-white text-blue-600 hover:bg-gray-50 text-xs sm:text-sm md:text-lg"
                    onClick={() => setShowFundModal(true)}
                  >
                    <Plus className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8" />
                    <span className="font-medium">Fund</span>
                  </Button>
                  <Button
                    variant="secondary"
                    className="w-full h-16 sm:h-20 md:h-24 flex flex-col items-center justify-center gap-1 sm:gap-2 bg-white text-blue-600 hover:bg-gray-50 text-xs sm:text-sm md:text-lg"
                    onClick={() => setShowWithdrawalModal(true)}
                  >
                    <ArrowDown className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8" />
                    <span className="font-medium">Withdrawal</span>
                  </Button>
                  <Link href="/transactions" className="w-full">
                    <Button
                      variant="secondary"
                      className="w-full h-16 sm:h-20 md:h-24 flex flex-col items-center justify-center gap-1 sm:gap-2 bg-white text-blue-600 hover:bg-gray-50 text-xs sm:text-sm md:text-lg"
                    >
                      <History className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8" />
                      <span className="font-medium">History</span>
                    </Button>
                  </Link>
                </div>
                    </div>
            </div>
          </div>

          {/* Quick Loan Request */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 h-full">
            <Tabs value={searchTab} onValueChange={(v) => setSearchTab(v as "borrower" | "lender")} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4 bg-gray-100 rounded-lg p-1">
                  <TabsTrigger 
                    value="borrower" 
                    className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm rounded-md transition-all duration-200 font-medium"
                  >
                    Borrower
                  </TabsTrigger>
                  <TabsTrigger 
                    value="lender" 
                    className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm rounded-md transition-all duration-200 font-medium"
                  >
                    Find Borrowers
                  </TabsTrigger>
                </TabsList>
              
              <TabsContent value="borrower" className="mt-0 space-y-4">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Loan Request</h2>
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-4">
                  <div className="flex items-start">
                    <Info className="h-4 w-4 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                    <p className="text-xs text-blue-700">
                      Enter either a loan amount, duration, or both to find matching lenders.
                    </p>
                  </div>
                </div>
                <LoanRequestForm 
                  loanAmount={loanAmount} setLoanAmount={setLoanAmount}
                  loanDuration={loanDuration} setLoanDuration={setLoanDuration}
                  loanDurationUnit={loanDurationUnit} setLoanDurationUnit={setLoanDurationUnit}
                  amountError={amountError} durationError={durationError}
                  loanLimits={loanLimits} loanLimitsLoading={loanLimitsLoading}
                  activePolicy={activePolicy}
                  searchTab={searchTab}
                  canSearch={canSearch}
                  isSearching={isSearching}
                  onSearch={handleFindLenders}
                  searchButtonText="Find Lenders"
                />
              </TabsContent>

              <TabsContent value="lender" className="mt-0 space-y-4">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Find Borrowers</h2>
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-4">
                  <div className="flex items-start">
                    <Info className="h-4 w-4 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                    <p className="text-xs text-blue-700">
                      Enter a loan amount or duration to find borrowers who have recently searched for these terms.
                    </p>
                  </div>
                </div>
                <LoanRequestForm 
                  loanAmount={loanAmount} setLoanAmount={setLoanAmount}
                  loanDuration={loanDuration} setLoanDuration={setLoanDuration}
                  loanDurationUnit={loanDurationUnit} setLoanDurationUnit={setLoanDurationUnit}
                  amountError={amountError} durationError={durationError}
                  loanLimits={loanLimits} loanLimitsLoading={loanLimitsLoading}
                  activePolicy={activePolicy}
                  searchTab={searchTab}
                  canSearch={canSearch}
                  isSearching={isSearching}
                  onSearch={handleFindBorrowers}
                  searchButtonText="Find borrowers"
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Results Section */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-gray-900 mb-4 md:mb-0">
              {hasSearched 
                ? "Search Results" 
                : (searchTab === 'borrower' ? "Loan offers you may like" : "Borrowers you may like")}
            </h2>
            {hasSearched && (
              <Button variant="outline" onClick={handleResetSearch} className="text-sm py-2 h-auto">
                Show All {searchTab === 'borrower' ? 'Lenders' : 'Borrowers'}
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
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No matching {searchTab === 'borrower' ? 'lenders' : 'borrowers'} found
                </h3>
                <p className="text-sm text-gray-500 max-w-md mx-auto mb-4">
                  We couldn't find any {searchTab === 'borrower' ? 'lenders' : 'borrowers'} matching your criteria. Try adjusting your search parameters.
                </p>
                <div className="flex gap-3">
                  <Button size="sm" className="text-sm py-2 h-auto" onClick={handleResetSearch}>
                    Show All {searchTab === 'borrower' ? 'Lenders' : 'Borrowers'}
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
          ) : displayResults && displayResults.length > 0 ? (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {normalizedResults.map((helper) => (
                  <HelperCard
                    key={helper.id}
                    id={helper.id}
                    name={helper.name}
                    interestRate={helper.interestRate.toString()}
                    maxLoan={formatCurrency(helper.maxLoanAmount)}
                    loanIssued={helper.loanIssued.toString()}
                    amountIssued={formatCurrency(helper.amountIssued)}
                    profileImage={helper.profileImage}
                    rating={helper.rating}
                    displayMetric="loans-issued"
                    loanAmount={helper.loanAmount}
                    repaymentTime={helper.repaymentTime}
                    repaymentUnit={helper.repaymentUnit}
                    currentUser={userProfile}
                  />
                ))}
              </div>

              <div ref={searchResultsSentinelRef} className="h-1 w-full" aria-hidden="true" />

              {isLoadingMoreLenders && (
                <div className="flex items-center justify-center py-5 text-sm text-gray-500">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin text-blue-500" />
                  Loading more {searchTab === 'borrower' ? 'lenders' : 'borrowers'}...
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
              <div className="flex flex-col items-center justify-center">
                <div className="bg-blue-50 p-3 rounded-full mb-3">
                  <TrendingUp className="h-6 w-6 text-blue-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No {searchTab === 'borrower' ? 'lenders' : 'borrowers'} available
                </h3>
                <p className="text-sm text-gray-500 max-w-md mx-auto mb-4">
                  We couldn't find any {searchTab === 'borrower' ? 'lenders' : 'borrowers'} at the moment. Please check back later.
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
                        <span>Generating account... this may take a few seconds.</span>
                      </div>
                    )}
                    {virtualAccountError && (
                      <div className="text-sm text-red-600 mt-2">
                        {virtualAccountError}
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
                    {/* Manual retry button removed - automatic retries are handled programmatically */}
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
                              <div className="flex items-center">
                                <span className="font-mono text-sm font-semibold">
                                  {virtualAccountDetails.virtualAccount?.accountNumber}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(virtualAccountDetails.virtualAccount?.accountNumber)}
                                  className="ml-3 text-sm text-blue-600 hover:underline"
                                  title="Copy account number"
                                >
                                  Copy
                                </button>
                              </div>
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
                              <div className="flex items-center">
                                <span className="text-lg font-bold text-blue-600">
                                  ₦{virtualAccountDetails.virtualAccount?.totalAmountWithFee?.toLocaleString('en-NG', { minimumFractionDigits: 2 }) || '0.00'}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(virtualAccountDetails.virtualAccount?.totalAmountWithFee)}
                                  className="ml-3 text-sm text-blue-600 hover:underline"
                                  title="Copy amount"
                                >
                                  Copy
                                </button>
                              </div>
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
                          disabled={isPollingCompletion}
                        >
                          {isPollingCompletion ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Waiting for confirmation...
                            </>
                          ) : (
                            'I have made the transfer'
                          )}
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
