"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { createVirtualAccount } from "@/lib/actions/paystack"
import { Loader2, Copy, CheckCircle, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { VirtualAccountTransactions } from "./virtual-account-transactions"

interface VirtualAccount {
  id: string
  account_number: string
  account_name: string
  bank_name: string
  bank_code: string
  currency: string
  assigned: boolean
  created_at: string
  updated_at: string
}

interface VirtualAccountButtonProps {
  userId: string
  existingAccount?: VirtualAccount | null
}

export function VirtualAccountButton({ userId, existingAccount }: VirtualAccountButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [virtualAccount, setVirtualAccount] = useState<VirtualAccount | null>(existingAccount || null)
  const [copied, setCopied] = useState<string | null>(null)
  const { toast } = useToast()

  const handleCreateVirtualAccount = async () => {
    setIsLoading(true)
    setError(null)

    try {
      console.log("Initiating virtual account creation for user ID:", userId)
      const result = await createVirtualAccount()
      console.log("Virtual account creation result:", result)

      if (result.error) {
        setError(result.error)
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        })
      } else if (result.virtualAccount) {
        setVirtualAccount(result.virtualAccount as VirtualAccount)
        toast({
          title: "Success",
          description: "Virtual account created successfully",
        })
      } else if (result.message) {
        // Handle case where there's a message but no error or virtualAccount
        toast({
          title: "Notice",
          description: result.message,
        })
        if (result.success === false) {
          setError(result.message)
        }
      } else {
        // Handle unexpected response format
        setError("Received invalid response from server")
        toast({
          title: "Error",
          description: "Received invalid response from server",
          variant: "destructive",
        })
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred"
      console.error("Error creating virtual account:", errorMessage)
      setError(`An unexpected error occurred: ${errorMessage}`)
      toast({
        title: "Error",
        description: `An unexpected error occurred: ${errorMessage}`,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopied(field)
    toast({
      title: "Copied!",
      description: `${field} copied to clipboard`,
    })
    setTimeout(() => setCopied(null), 3000)
  }

  if (virtualAccount) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Your Virtual Account</CardTitle>
            <CardDescription>Use these details to receive funds directly to your Peer Capital wallet</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-500">Account Number</p>
                  <div className="flex items-center justify-between rounded-md border p-2">
                    <p className="font-mono text-lg">{virtualAccount.account_number}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(virtualAccount.account_number, "Account Number")}
                    >
                      {copied === "Account Number" ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-500">Bank Name</p>
                  <div className="flex items-center justify-between rounded-md border p-2">
                    <p className="text-lg">{virtualAccount.bank_name}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(virtualAccount.bank_name, "Bank Name")}
                    >
                      {copied === "Bank Name" ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-500">Account Name</p>
                <div className="flex items-center justify-between rounded-md border p-2">
                  <p className="text-lg">{virtualAccount.account_name}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(virtualAccount.account_name, "Account Name")}
                  >
                    {copied === "Account Name" ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <p className="text-sm text-gray-500">
              Funds sent to this account will be automatically credited to your Peer Capital wallet.
            </p>
          </CardFooter>
        </Card>

        <VirtualAccountTransactions userId={userId} />
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Virtual Account</CardTitle>
        <CardDescription>
          Get a dedicated bank account number for easy deposits to your Peer Capital wallet
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center p-6">
          <img
            src="/abstract-geometric-shapes.png"
            alt="Virtual Account Illustration"
            className="h-48 w-auto rounded-lg object-cover"
          />
        </div>
        <div className="space-y-4 text-center">
          <p>
            A virtual account allows you to receive funds directly to your Peer Capital wallet without manual transfers.
          </p>
          <p>
            When someone sends money to your virtual account, it will be automatically credited to your wallet balance.
          </p>
          {error && (
            <div className="flex items-center justify-center rounded-md bg-red-50 p-3 text-red-800">
              <AlertCircle className="mr-2 h-5 w-5" />
              <p>{error}</p>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-center">
        <Button onClick={handleCreateVirtualAccount} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating Account...
            </>
          ) : (
            "Create Virtual Account"
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
