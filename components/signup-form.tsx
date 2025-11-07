"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, AlertCircle, Loader2, ArrowLeft } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

// Step 1: BVN Verification
function BVNVerificationStep({ 
  bvn, 
  setBvn, 
  onNext, 
  loading, 
  error 
}: {
  bvn: string
  setBvn: (bvn: string) => void
  onNext: () => void
  loading: boolean
  error: string | null
}) {
  const [bvnError, setBvnError] = useState<string | null>(null)

  const validateBVN = (value: string) => {
    if (!value.trim()) {
      return "BVN is required"
    }
    if (!/^\d{11}$/.test(value)) {
      return "BVN must be exactly 11 digits"
    }
    return null
  }

  const handleVerify = () => {
    const validationError = validateBVN(bvn)
    if (validationError) {
      setBvnError(validationError)
      return
    }
    setBvnError(null)
    onNext()
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Verify Your BVN</h2>
        <p className="text-gray-600">Enter your Bank Verification Number to begin account creation</p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="bvn" className="text-sm font-medium text-gray-700">
            Bank Verification Number (BVN)
          </Label>
          <Input
            id="bvn"
            type="text"
            placeholder="Enter your 11-digit BVN"
            value={bvn}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, '') // Only allow digits
              if (value.length <= 11) {
                setBvn(value)
                setBvnError(null)
              }
            }}
            className="mt-1"
            maxLength={11}
            disabled={loading}
          />
          {bvnError && (
            <p className="mt-1 text-sm text-red-600">{bvnError}</p>
          )}
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Button 
          onClick={handleVerify} 
          disabled={loading || !bvn.trim()}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Verifying BVN...
            </>
          ) : (
            "Verify BVN"
          )}
        </Button>
      </div>
    </div>
  )
}

// Step 2: OTP Verification Modal
function OTPVerificationStep({ 
  otp, 
  setOtp, 
  onNext, 
  onBack, 
  loading, 
  error,
  requestId 
}: {
  otp: string
  setOtp: (otp: string) => void
  onNext: () => void
  onBack: () => void
  loading: boolean
  error: string | null
  requestId: string | null
}) {
  const [otpError, setOtpError] = useState<string | null>(null)

  const validateOTP = (value: string) => {
    if (!value.trim()) {
      return "OTP is required"
    }
    if (!/^\d{6}$/.test(value)) {
      return "OTP must be exactly 6 digits"
    }
    return null
  }

  const handleVerifyOTP = () => {
    const validationError = validateOTP(otp)
    if (validationError) {
      setOtpError(validationError)
      return
    }
    setOtpError(null)
    onNext()
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Verify OTP</h2>
        <p className="text-gray-600">Enter the 6-digit OTP sent to your registered phone number</p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="otp" className="text-sm font-medium text-gray-700">
            One-Time Password (OTP)
          </Label>
          <Input
            id="otp"
            type="text"
            placeholder="Enter 6-digit OTP"
            value={otp}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, '') // Only allow digits
              if (value.length <= 6) {
                setOtp(value)
                setOtpError(null)
              }
            }}
            className="mt-1 text-center text-2xl tracking-widest"
            maxLength={6}
            disabled={loading}
          />
          {otpError && (
            <p className="mt-1 text-sm text-red-600">{otpError}</p>
          )}
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex gap-3">
          <Button 
            type="button"
            variant="outline" 
            onClick={onBack}
            disabled={loading}
            className="flex-1"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button 
            onClick={handleVerifyOTP} 
            disabled={loading || !otp.trim()}
            className="flex-1"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              "Verify OTP"
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

// Step 3: User Details Collection
function UserDetailsStep({ 
  formData, 
  setFormData, 
  onSubmit, 
  onBack, 
  loading, 
  error 
}: {
  formData: {
    firstName: string
    middleName: string
    lastName: string
    email: string
    phoneNumber: string
    dateOfBirth: string
    referralCode: string
  }
  setFormData: (data: any) => void
  onSubmit: () => void
  onBack: () => void
  loading: boolean
  error: string | null
}) {
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  const validateField = (name: string, value: string) => {
    switch (name) {
      case 'firstName':
      case 'lastName':
        return !value.trim() ? `${name === 'firstName' ? 'First' : 'Last'} name is required` : ''
      case 'email':
        if (!value.trim()) return 'Email is required'
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Please enter a valid email address'
        return ''
      case 'phoneNumber':
        if (!value.trim()) return 'Phone number is required'
        if (!/^\d+$/.test(value)) return 'Phone number must contain only digits'
        if (value.length > 11) return 'Phone number must not exceed 11 digits'
        return ''
      case 'dateOfBirth':
        if (!value) return 'Date of birth is required'
        const dob = new Date(value)
        const today = new Date()
        const age = today.getFullYear() - dob.getFullYear()
        if (age < 18) return 'You must be at least 18 years old'
        return ''
      default:
        return ''
    }
  }

  const handleFieldChange = (name: string, value: string) => {
    setFormData((prev: any) => ({ ...prev, [name]: value }))
    
    const error = validateField(name, value)
    setValidationErrors(prev => ({ ...prev, [name]: error }))
  }

  const handleSubmit = () => {
    const errors: Record<string, string> = {}
    Object.keys(formData).forEach(key => {
      if (key !== 'middleName' && key !== 'referralCode') {
        const error = validateField(key, formData[key as keyof typeof formData])
        if (error) errors[key] = error
      }
    })
    
    setValidationErrors(errors)
    
    if (Object.keys(errors).length === 0) {
      onSubmit()
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Complete Your Profile</h2>
        <p className="text-gray-600">Enter your personal information to complete account creation</p>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">
              First Name *
            </Label>
            <Input
              id="firstName"
              type="text"
              value={formData.firstName}
              onChange={(e) => handleFieldChange('firstName', e.target.value)}
              className="mt-1"
              disabled={loading}
            />
            {validationErrors.firstName && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.firstName}</p>
            )}
          </div>

          <div>
            <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">
              Last Name *
            </Label>
            <Input
              id="lastName"
              type="text"
              value={formData.lastName}
              onChange={(e) => handleFieldChange('lastName', e.target.value)}
              className="mt-1"
              disabled={loading}
            />
            {validationErrors.lastName && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.lastName}</p>
            )}
          </div>
        </div>

        <div>
          <Label htmlFor="middleName" className="text-sm font-medium text-gray-700">
            Middle Name (Optional)
          </Label>
          <Input
            id="middleName"
            type="text"
            value={formData.middleName}
            onChange={(e) => handleFieldChange('middleName', e.target.value)}
            className="mt-1"
            disabled={loading}
          />
        </div>

        <div>
          <Label htmlFor="email" className="text-sm font-medium text-gray-700">
            Email Address *
          </Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleFieldChange('email', e.target.value)}
            className="mt-1"
            disabled={loading}
          />
          {validationErrors.email && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.email}</p>
          )}
        </div>

        <div>
          <Label htmlFor="phoneNumber" className="text-sm font-medium text-gray-700">
            Phone Number *
          </Label>
          <Input
            id="phoneNumber"
            type="tel"
            value={formData.phoneNumber}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, '')
              if (value.length <= 11) {
                handleFieldChange('phoneNumber', value)
              }
            }}
            className="mt-1"
            disabled={loading}
            maxLength={11}
          />
          {validationErrors.phoneNumber && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.phoneNumber}</p>
          )}
        </div>

        <div>
          <Label htmlFor="dateOfBirth" className="text-sm font-medium text-gray-700">
            Date of Birth *
          </Label>
          <Input
            id="dateOfBirth"
            type="date"
            value={formData.dateOfBirth}
            onChange={(e) => handleFieldChange('dateOfBirth', e.target.value)}
            className="mt-1"
            disabled={loading}
          />
          {validationErrors.dateOfBirth && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.dateOfBirth}</p>
          )}
        </div>

        <div>
          <Label htmlFor="referralCode" className="text-sm font-medium text-gray-700">
            Referral Code (Optional)
          </Label>
          <Input
            id="referralCode"
            type="text"
            value={formData.referralCode}
            onChange={(e) => handleFieldChange('referralCode', e.target.value)}
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

        <div className="flex gap-3">
          <Button 
            type="button"
            variant="outline" 
            onClick={onBack}
            disabled={loading}
            className="flex-1"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={loading}
            className="flex-1"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Account...
              </>
            ) : (
              "Create Account"
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

// Success Step
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

// Main Signup Form Component
export function SignupForm() {
  const router = useRouter()
  const { toast } = useToast()
  
  // Step management
  const [step, setStep] = useState(1)
  const totalSteps = 3
  
  // Form data
  const [bvn, setBvn] = useState("")
  const [otp, setOtp] = useState("")
  const [requestId, setRequestId] = useState<string | null>(null)
  const [srUserId, setSrUserId] = useState<string | null>(null)
  const [userDetails, setUserDetails] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    dateOfBirth: "",
    referralCode: ""
  })
  
  // Loading and error states
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")

  // Load data from sessionStorage on mount
  useEffect(() => {
    const savedRequestId = sessionStorage.getItem('signup_requestId')
    const savedSrUserId = sessionStorage.getItem('signup_srUserId')
    const savedStep = sessionStorage.getItem('signup_step')
    
    if (savedRequestId) setRequestId(savedRequestId)
    if (savedSrUserId) setSrUserId(savedSrUserId)
    if (savedStep) setStep(parseInt(savedStep))
  }, [])

  // Save data to sessionStorage
  const saveToSession = (key: string, value: string) => {
    sessionStorage.setItem(`signup_${key}`, value)
  }

  // Step 1: BVN Verification
  const handleBVNVerification = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // 1. Call /onboarduser with BVN
      const response = await fetch('/api/stablesrail/onboard-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bvn })
      })
      
      const data = await response.json()
      
      if (!response.ok || !data.success) {
        setError(data.error || "Failed to initiate BVN verification")
        return
      }

      // Extract requestId from response
      const requestId = data.requestId || data.data?.requestId
      if (!requestId) {
        setError("Invalid response from verification service")
        return
      }

      setRequestId(requestId)
      saveToSession('requestId', requestId)

      // 2. Poll /onboardstatus to get sessionID
      let sessionId: string | null = null
      const maxAttempts = 8 // ~10 seconds at 1.2s interval
      
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        await new Promise(resolve => setTimeout(resolve, 1200)) // Wait 1.2 seconds
        
        try {
          const statusResponse = await fetch('/api/stablesrail/onboard-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ requestId })
          })
          
          const statusData = await statusResponse.json()
          
          if (statusResponse.ok && statusData.success && statusData.data?.sessionId) {
            sessionId = statusData.data.sessionId
            break
          }
        } catch (pollError) {
          console.warn(`Polling attempt ${attempt} failed:`, pollError)
        }
      }

      if (sessionId) {
        // Save sessionId to requestId state (will be used for OTP verification)
        setRequestId(sessionId)
        saveToSession('requestId', sessionId)
        saveToSession('step', '2')
        setStep(2)
        toast({
          title: "BVN Verification Initiated",
          description: "Please check your phone for the OTP code.",
        })
      } else {
        setError("Failed to get verification session. Please try again.")
      }
    } catch (err) {
      console.error('BVN verification error:', err)
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // Step 2: OTP Verification
  const handleOTPVerification = async () => {
    if (!requestId) {
      setError("Session ID not found. Please start over.")
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      // 3. Call /verifyotp with sessionID (from onboardstatus) and code
      const response = await fetch('/api/stablesrail/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          sessionId: requestId, // This is the sessionID from onboardstatus
          code: otp 
        })
      })
      
      const data = await response.json()
      
      if (!response.ok || !data.success) {
        setError(data.error || "Invalid OTP. Please try again.")
        return
      }

      // Extract userId from response
      const userId = data.userId || data.data?.userId || data.data?.data?.userId
      if (!userId) {
        setError("Invalid response from verification service")
        return
      }

      // 4. Save sr_user_id to database
      try {
        const saveResponse = await fetch('/api/user-profile', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            sr_user_id: userId,
            bvn_verified: true
          }),
          credentials: 'include'
        })

        if (!saveResponse.ok) {
          console.warn('Failed to save sr_user_id, but continuing with signup')
        }
      } catch (saveError) {
        console.warn('Error saving sr_user_id:', saveError)
        // Continue anyway - will be saved during account creation
      }

      setSrUserId(userId)
      saveToSession('srUserId', userId)
      saveToSession('step', '3')
      
      toast({
        title: "BVN Verified Successfully",
        description: "Your BVN has been verified. Please complete your profile.",
      })
      
      // Move to next step immediately
      setStep(3)
    } catch (err) {
      console.error('OTP verification error:', err)
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // Step 3: Account Creation
  const handleAccountCreation = async () => {
    if (!srUserId) {
      setError("Verification data not found. Please start over.")
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...userDetails,
          bvn: bvn, // Include BVN in signup
          sr_user_id: srUserId,
          bvn_verified: true
        }),
        credentials: 'include'
      })
      
      const data = await response.json()
      
      if (data.success) {
        setSuccess(true)
        setSuccessMessage("Your account has been created successfully! Redirecting to login...")
        
        // Clear session storage
        sessionStorage.removeItem('signup_requestId')
        sessionStorage.removeItem('signup_srUserId')
        sessionStorage.removeItem('signup_step')
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push('/login')
        }, 3000)
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
      saveToSession('step', (step - 1).toString())
      setError(null)
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
      </div>

      {step === 1 && (
        <BVNVerificationStep
          bvn={bvn}
          setBvn={setBvn}
          onNext={handleBVNVerification}
          loading={loading}
          error={error}
        />
      )}

      {step === 2 && (
        <OTPVerificationStep
          otp={otp}
          setOtp={setOtp}
          onNext={handleOTPVerification}
          onBack={handleBack}
          loading={loading}
          error={error}
          requestId={requestId} // This is actually sessionID now
        />
      )}

      {step === 3 && (
        <UserDetailsStep
          formData={userDetails}
          setFormData={setUserDetails}
          onSubmit={handleAccountCreation}
          onBack={handleBack}
          loading={loading}
          error={error}
        />
      )}
    </div>
  )
}