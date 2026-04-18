"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { AlertCircle, ArrowLeft, CheckCircle, Loader2, Mail } from "lucide-react"

type SignupDetails = {
  firstName: string
  lastName: string
  email: string
  phoneNumber: string
}

function DetailsStep({
  details,
  setDetails,
  onNext,
  loading,
  error,
}: {
  details: SignupDetails
  setDetails: React.Dispatch<React.SetStateAction<SignupDetails>>
  onNext: () => void
  loading: boolean
  error: string | null
}) {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const nextErrors: Record<string, string> = {}

    if (!details.firstName.trim()) nextErrors.firstName = "First name is required"
    if (!details.lastName.trim()) nextErrors.lastName = "Last name is required"

    if (!details.email.trim()) {
      nextErrors.email = "Email is required"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.email)) {
      nextErrors.email = "Please enter a valid email address"
    }

    if (!details.phoneNumber.trim()) {
      nextErrors.phoneNumber = "Phone number is required"
    } else if (!/^\d+$/.test(details.phoneNumber)) {
      nextErrors.phoneNumber = "Phone number must contain only digits"
    } else if (details.phoneNumber.length > 11) {
      nextErrors.phoneNumber = "Phone number must not exceed 11 digits"
    }

    setFieldErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleNext = () => {
    if (!validate()) {
      return
    }
    onNext()
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Details</h2>
        <p className="text-gray-600">Enter your details to continue to email confirmation</p>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">First Name</Label>
            <Input
              id="firstName"
              value={details.firstName}
              onChange={(e) => setDetails((prev) => ({ ...prev, firstName: e.target.value }))}
              className="mt-1"
              disabled={loading}
            />
            {fieldErrors.firstName && <p className="mt-1 text-sm text-red-600">{fieldErrors.firstName}</p>}
          </div>
          <div>
            <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">Last Name</Label>
            <Input
              id="lastName"
              value={details.lastName}
              onChange={(e) => setDetails((prev) => ({ ...prev, lastName: e.target.value }))}
              className="mt-1"
              disabled={loading}
            />
            {fieldErrors.lastName && <p className="mt-1 text-sm text-red-600">{fieldErrors.lastName}</p>}
          </div>
        </div>

        <div>
          <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email Address</Label>
          <Input
            id="email"
            type="email"
            value={details.email}
            onChange={(e) => setDetails((prev) => ({ ...prev, email: e.target.value }))}
            className="mt-1"
            disabled={loading}
          />
          {fieldErrors.email && <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>}
        </div>

        <div>
          <Label htmlFor="phoneNumber" className="text-sm font-medium text-gray-700">Phone Number</Label>
          <Input
            id="phoneNumber"
            type="tel"
            value={details.phoneNumber}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, "")
              if (value.length <= 11) {
                setDetails((prev) => ({ ...prev, phoneNumber: value }))
              }
            }}
            className="mt-1"
            disabled={loading}
            maxLength={11}
          />
          {fieldErrors.phoneNumber && <p className="mt-1 text-sm text-red-600">{fieldErrors.phoneNumber}</p>}
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Button onClick={handleNext} disabled={loading} className="w-full">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending confirmation code...
            </>
          ) : (
            "Next"
          )}
        </Button>
      </div>
    </div>
  )
}

function EmailConfirmationStep({
  email,
  code,
  setCode,
  onBack,
  onResend,
  onConfirm,
  loading,
  error,
}: {
  email: string
  code: string
  setCode: React.Dispatch<React.SetStateAction<string>>
  onBack, 
  onResend: () => void
  onConfirm: () => void
  loading, 
  error 
}) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Confirm Your Email</h2>
        <p className="text-gray-600">Enter the 6-digit code sent to {email}</p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="confirmationCode" className="text-sm font-medium text-gray-700">Confirmation Code</Label>
          <Input
            id="confirmationCode"
            value={code}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, "")
              if (value.length <= 6) setCode(value)
            }}
            maxLength={6}
            placeholder="Enter 6-digit code"
            className="mt-1"
            disabled={loading}
          />
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Alert>
          <Mail className="h-4 w-4" />
          <AlertDescription>Didn&apos;t get the email? Check your spam folder or resend the code.</AlertDescription>
        </Alert>

        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={onBack} disabled={loading} className="flex-1">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button type="button" variant="outline" onClick={onResend} disabled={loading} className="flex-1">
            Resend Code
          </Button>
        </div>

        <Button onClick={onConfirm} disabled={loading || code.length !== 6} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Confirming and creating account...
              </>
            ) : (
            "Confirm Email and Complete Signup"
            )}
        </Button>
      </div>
    </div>
  )
}

function SuccessStep({ message }: { message: string }) {
  return (
    <div className="text-center space-y-6">
      <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
        <CheckCircle className="w-8 h-8 text-green-600" />
      </div>
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Account Created Successfully!</h2>
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  )
}

export function SignupForm() {
  const router = useRouter()

  const [step, setStep] = useState(1)
  const totalSteps = 2

  const [details, setDetails] = useState<SignupDetails>({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
  })

  const [confirmationCode, setConfirmationCode] = useState("")
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")

  useEffect(() => {
    const savedStep = sessionStorage.getItem("signup_step")
    const savedDetails = sessionStorage.getItem("signup_details")

    if (savedStep) setStep(parseInt(savedStep, 10))
    if (savedDetails) {
      try {
        setDetails(JSON.parse(savedDetails))
      } catch {
        // ignore invalid session payload
      }
    }
  }, [])

  useEffect(() => {
    sessionStorage.setItem("signup_details", JSON.stringify(details))
  }, [details])

  const sendConfirmationCode = async () => {
    const response = await fetch("/api/auth/send-confirmation-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: details.email,
        firstName: details.firstName,
      }),
    })

    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.error || "Failed to send confirmation code")
    }
  }

  const handleDetailsNext = async () => {
    setLoading(true)
    setError(null)

    try {
      const availabilityResponse = await fetch("/api/auth/check-signup-availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: details.email,
          phoneNumber: details.phoneNumber,
        }),
      })

      const availabilityData = await availabilityResponse.json()

      if (!availabilityResponse.ok) {
        throw new Error(availabilityData.error || "Failed to check account availability")
      }

      if (!availabilityData.available) {
        setError(availabilityData.message || "An account with these details already exists. Please sign in instead.")
        return
      }

      await sendConfirmationCode()
      setStatusMessage(`Confirmation code sent to ${details.email}`)
      setStep(2)
      sessionStorage.setItem("signup_step", "2")
    } catch (err: any) {
      setError(err.message || "Failed to send confirmation code")
    } finally {
      setLoading(false)
    }
  }

  const handleResendCode = async () => {
    setLoading(true)
    setError(null)

    try {
      await sendConfirmationCode()
      setStatusMessage(`A new confirmation code was sent to ${details.email}`)
    } catch (err: any) {
      setError(err.message || "Failed to resend confirmation code")
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmAndCompleteSignup = async () => {
    setLoading(true)
    setError(null)

    if (!/^\d{6}$/.test(confirmationCode)) {
      setError("Please enter a valid 6-digit confirmation code")
      setLoading(false)
      return
    }

    try {
      const verifyResponse = await fetch("/api/auth/verify-confirmation-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: details.email, code: confirmationCode }),
      })

      const verifyData = await verifyResponse.json()
      if (!verifyResponse.ok || !verifyData.success) {
        setError(verifyData.error || "Email confirmation failed")
        return
      }

      const signupResponse = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: details.firstName,
          lastName: details.lastName,
          email: details.email,
          phoneNumber: details.phoneNumber,
        }),
        credentials: 'include'
      })

      const data = await signupResponse.json()

      if (data.success) {
        setSuccess(true)
        setSuccessMessage("Your account has been created successfully! Redirecting to login...")

        sessionStorage.removeItem("signup_step")
        sessionStorage.removeItem("signup_details")

        setTimeout(() => {
          router.push('/login')
        }, 2000)
      } else {
        setError(data.error || "Failed to create account")
      }
    } catch (err) {
      console.error('Account creation error:', err)
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
      sessionStorage.setItem("signup_step", (step - 1).toString())
      setConfirmationCode("")
      setError(null)
      setStatusMessage(null)
    }
  }

  const progress = (step / totalSteps) * 100

  if (success) {
    return <SuccessStep message={successMessage} />
  }

  return (
    <div className="w-full">
      <div className="space-y-2 mb-6">
        <h2 className="text-xl font-semibold text-center">
          Step {step} of {totalSteps}
        </h2>
        <Progress value={progress} className="h-2" />
        {statusMessage && (
          <p className="text-sm text-center text-muted-foreground animate-pulse">
            {statusMessage}
          </p>
        )}
      </div>

      {step === 1 && (
        <DetailsStep
          details={details}
          setDetails={setDetails}
          onNext={handleDetailsNext}
          loading={loading}
          error={error}
        />
      )}

      {step === 2 && (
        <EmailConfirmationStep
          email={details.email}
          code={confirmationCode}
          setCode={setConfirmationCode}
          onBack={handleBack}
          onResend={handleResendCode}
          onConfirm={handleConfirmAndCompleteSignup}
          loading={loading}
          error={error}
        />
      )}
    </div>
  )
}