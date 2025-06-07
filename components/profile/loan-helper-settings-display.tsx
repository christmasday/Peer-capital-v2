"use client"

import { useState, useEffect } from "react"
import { getLoanHelperSettings } from "@/lib/actions/loan-helper-settings"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertTriangle, HelpCircle } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface LoanHelperSettingsDisplayProps {
  userId: string
}

export function LoanHelperSettingsDisplay({ userId }: LoanHelperSettingsDisplayProps) {
  const [settings, setSettings] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const { data, error } = await getLoanHelperSettings(userId)
        if (error) {
          setError(error)
        } else if (data) {
          setSettings(data)
        }
      } catch (e: any) {
        setError(e.message || "An unexpected error occurred")
      } finally {
        setIsLoading(false)
      }
    }

    fetchSettings()
  }, [userId])

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 2,
    }).format(amount)
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-10 w-full" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
        <div className="flex gap-2 items-center text-amber-600">
          <AlertTriangle className="h-5 w-5" />
          <h3 className="font-medium">Error loading helper settings</h3>
        </div>
        <p className="mt-2 text-sm">{error}</p>
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
        <div className="flex flex-col items-center justify-center">
          <div className="bg-gray-100 p-3 rounded-full mb-3">
            <HelpCircle className="h-6 w-6 text-gray-500" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No Settings Configured</h3>
          <p className="text-gray-500 max-w-md mb-4">
            You haven't configured your helper settings yet. Configure your settings to become a lender on the platform.
          </p>
          <a href="/profile/loan-helper" className="text-blue-600 hover:text-blue-800 font-medium">
            Configure Settings
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-medium">Maximum Loan Amount</h4>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircle className="h-4 w-4 text-blue-500" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm max-w-xs">The maximum amount you're willing to lend to borrowers</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <p className="text-2xl font-bold text-blue-700">{formatCurrency(settings?.loan_amount || 0)}</p>
        </div>

        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-medium">Interest Rate</h4>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircle className="h-4 w-4 text-blue-500" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm max-w-xs">Annual interest rate you charge on loans</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <p className="text-2xl font-bold text-blue-700">{settings?.interest_rate || 0}%</p>
        </div>
      </div>

      <div className="bg-blue-50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-1">
          <h4 className="font-medium">Repayment Period</h4>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <HelpCircle className="h-4 w-4 text-blue-500" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-sm max-w-xs">Maximum duration for loan repayment</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <p className="text-2xl font-bold text-blue-700">{settings?.repayment_time || 0} {settings?.repayment_unit || 'months'}</p>
      </div>

      {settings?.terms_and_conditions && (
        <div>
          <h4 className="font-medium mb-2">Terms and Conditions</h4>
          <div className="bg-white border border-gray-200 rounded-lg p-4 text-gray-700 text-sm">
            {settings.terms_and_conditions}
          </div>
        </div>
      )}
    </div>
  )
}
