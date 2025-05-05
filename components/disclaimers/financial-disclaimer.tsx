import { AlertTriangle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface FinancialDisclaimerProps {
  variant?: "default" | "compact" | "inline"
  showIcon?: boolean
}

export function FinancialDisclaimer({ variant = "default", showIcon = true }: FinancialDisclaimerProps) {
  if (variant === "compact") {
    return (
      <Alert className="bg-amber-50 border-amber-200 text-amber-800 text-sm">
        {showIcon && <AlertTriangle className="h-4 w-4 text-amber-600" />}
        <AlertTitle className="font-medium">Important Financial Disclaimer</AlertTitle>
        <AlertDescription className="mt-1">
          Peer Capital is not a bank or licensed financial institution. Investments involve risk, including possible
          loss of principal. Past performance is not a guarantee of future results. Please read our full{" "}
          <a href="/disclaimers" className="font-medium underline hover:text-amber-900">
            financial disclaimers
          </a>
          .
        </AlertDescription>
      </Alert>
    )
  }

  if (variant === "inline") {
    return (
      <p className="text-sm text-gray-600 italic">
        <span className="font-medium">Disclaimer:</span> Peer Capital is not a bank or licensed financial institution.
        Investments involve risk. Please read our{" "}
        <a href="/disclaimers" className="text-blue-600 hover:underline">
          full disclaimers
        </a>
        .
      </p>
    )
  }

  // Default full version
  return (
    <Alert className="bg-amber-50 border-amber-200 text-amber-800">
      {showIcon && <AlertTriangle className="h-5 w-5 text-amber-600" />}
      <AlertTitle className="text-lg font-semibold">Important Financial Disclaimer</AlertTitle>
      <AlertDescription className="mt-2">
        <p className="mb-2">
          Peer Capital is not a bank or licensed financial institution. Our platform facilitates peer-to-peer lending
          between users. All investments involve risk, including the possible loss of principal. Past performance is not
          a guarantee of future results.
        </p>
        <p>
          Before making any investment decisions, please carefully consider your investment objectives, risk tolerance,
          and financial situation. For more information, please read our{" "}
          <a href="/disclaimers" className="font-medium underline hover:text-amber-900">
            complete financial disclaimers
          </a>
          .
        </p>
      </AlertDescription>
    </Alert>
  )
}
