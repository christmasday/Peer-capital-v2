"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AlertCircle, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { PersonalInfoStep } from "@/components/signup-steps/personal-info-step"
import { AddressStep } from "@/components/signup-steps/address-step"
import { SecurityStep } from "@/components/signup-steps/security-step"
import { FinalStep } from "@/components/signup-steps/final-step"
import { signUp, checkUserExists } from "@/lib/actions/auth"
import { initializeStorage } from "@/lib/actions/storage"
import { uploadProfilePicture } from "@/lib/actions/upload"
import Link from "next/link"

export type SignupFormData = {
  firstName: string
  middleName: string
  lastName: string
  email: string
  phoneNumber: string
  bvn: string
  dateOfBirth: string
  address: string
  city: string
  state: string
  zipCode: string
  country: string
  bankCode: string
  password: string
  confirmPassword: string
  profilePicture: File | null
  acceptTerms: boolean
  referralCode: string
}

export function SignupForm() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<SignupFormData>({
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    bvn: "",
    dateOfBirth: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "Nigeria", // Default to Nigeria
    bankCode: "",
    password: "",
    confirmPassword: "",
    profilePicture: null,
    acceptTerms: false,
    referralCode: "",
  })
  const [formErrors, setFormErrors] = useState<string[]>([])
  const [stepErrors, setStepErrors] = useState<{ [key: number]: boolean }>({
    1: false,
    2: false,
    3: false,
    4: false,
  })
  const [attemptedSubmit, setAttemptedSubmit] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCheckingExistence, setIsCheckingExistence] = useState(false)
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null)
  const [signupSuccess, setSignupSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [storageInitialized, setStorageInitialized] = useState(false)
  const [existingUserInfo, setExistingUserInfo] = useState<{
    exists: boolean
    field?: string
    message?: string
  } | null>(null)

  const totalSteps = 4
  const progress = (currentStep / totalSteps) * 100

  const updateFormData = (data: Partial<SignupFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }))

    // Clear existing user error when email, phone, or BVN is changed
    if (existingUserInfo && (data.email || data.phoneNumber || data.bvn)) {
      setExistingUserInfo(null)
    }
  }

  // Validate current step
  const validateStep = (step: number): boolean => {
    let isValid = true
    const errors: string[] = []

    switch (step) {
      case 1:
        // Personal Info validation
        if (!formData.firstName.trim()) {
          errors.push("First name is required")
          isValid = false
        }
        if (!formData.lastName.trim()) {
          errors.push("Last name is required")
          isValid = false
        }
        if (!formData.email.trim()) {
          errors.push("Email address is required")
          isValid = false
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          errors.push("Please enter a valid email address")
          isValid = false
        }
        if (!formData.phoneNumber.trim()) {
          errors.push("Phone number is required")
          isValid = false
        } else if (!/^\d+$/.test(formData.phoneNumber)) {
          errors.push("Phone number must contain only digits")
          isValid = false
        } else if (formData.phoneNumber.length > 11) {
          errors.push("Phone number must not exceed 11 digits")
          isValid = false
        }
        if (!formData.bvn.trim()) {
          errors.push("BVN is required")
          isValid = false
        } else if (!/^\d{11}$/.test(formData.bvn)) {
          errors.push("BVN must be exactly 11 digits")
          isValid = false
        }
        if (!formData.dateOfBirth) {
          errors.push("Date of birth is required")
          isValid = false
        } else {
          const dob = new Date(formData.dateOfBirth)
          const today = new Date()
          const age = today.getFullYear() - dob.getFullYear()
          if (age < 18) {
            errors.push("You must be at least 18 years old")
            isValid = false
          }
        }
        if (!formData.referralCode.trim()) {
          errors.push("Referral code is required")
          isValid = false
        }
        break
      case 2:
        // Address validation
        if (!formData.address.trim()) {
          errors.push("Street address is required")
          isValid = false
        }
        if (!formData.city.trim()) {
          errors.push("City is required")
          isValid = false
        }
        if (!formData.state.trim()) {
          errors.push("State is required")
          isValid = false
        }
        if (!formData.country.trim()) {
          errors.push("Country is required")
          isValid = false
        }
        break
      case 3:
        // Security validation
        if (!formData.password) {
          errors.push("Password is required")
          isValid = false
        } else {
          if (formData.password.length < 8) {
            errors.push("Password must be at least 8 characters")
            isValid = false
          }
          if (!/[A-Z]/.test(formData.password)) {
            errors.push("Password must contain at least one uppercase letter")
            isValid = false
          }
          if (!/[a-z]/.test(formData.password)) {
            errors.push("Password must contain at least one lowercase letter")
            isValid = false
          }
          if (!/[0-9]/.test(formData.password)) {
            errors.push("Password must contain at least one number")
            isValid = false
          }
          if (!/[^A-Za-z0-9]/.test(formData.password)) {
            errors.push("Password must contain at least one special character")
            isValid = false
          }
        }
        if (!formData.confirmPassword) {
          errors.push("Please confirm your password")
          isValid = false
        } else if (formData.password !== formData.confirmPassword) {
          errors.push("Passwords do not match")
          isValid = false
        }
        break
      case 4:
        // Final step validation
        if (!formData.acceptTerms) {
          errors.push("You must accept the terms and conditions")
          isValid = false
        }
        break
    }

    setFormErrors(errors)
    setStepErrors((prev) => ({ ...prev, [step]: !isValid }))
    return isValid
  }

  // Validate all steps for final submission
  const validateAllSteps = (): boolean => {
    // Store all validation errors
    const allErrors: string[] = []

    // Validate personal info
    if (!formData.firstName.trim()) allErrors.push("First name is required")
    if (!formData.lastName.trim()) allErrors.push("Last name is required")
    if (!formData.email.trim()) {
      allErrors.push("Email address is required")
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      allErrors.push("Please enter a valid email address")
    }
    if (!formData.phoneNumber.trim()) {
      allErrors.push("Phone number is required")
    } else if (!/^\d+$/.test(formData.phoneNumber)) {
      allErrors.push("Phone number must contain only digits")
    } else if (formData.phoneNumber.length > 11) {
      allErrors.push("Phone number must not exceed 11 digits")
    }
    if (!formData.bvn.trim()) {
      allErrors.push("BVN is required")
    } else if (!/^\d{11}$/.test(formData.bvn)) {
      allErrors.push("BVN must be exactly 11 digits")
    }
    if (!formData.dateOfBirth) {
      allErrors.push("Date of birth is required")
    } else {
      const dob = new Date(formData.dateOfBirth)
      const today = new Date()
      const age = today.getFullYear() - dob.getFullYear()
      if (age < 18) allErrors.push("You must be at least 18 years old")
    }

    // Validate address
    if (!formData.address.trim()) allErrors.push("Street address is required")
    if (!formData.city.trim()) allErrors.push("City is required")
    if (!formData.state.trim()) allErrors.push("State is required")
    if (!formData.country.trim()) allErrors.push("Country is required")

    // Validate security
    if (!formData.password) {
      allErrors.push("Password is required")
    } else {
      if (formData.password.length < 8) allErrors.push("Password must be at least 8 characters")
      if (!/[A-Z]/.test(formData.password)) allErrors.push("Password must contain at least one uppercase letter")
      if (!/[a-z]/.test(formData.password)) allErrors.push("Password must contain at least one lowercase letter")
      if (!/[0-9]/.test(formData.password)) allErrors.push("Password must contain at least one number")
      if (!/[^A-Za-z0-9]/.test(formData.password))
        allErrors.push("Password must contain at least one special character")
    }
    if (!formData.confirmPassword) {
      allErrors.push("Please confirm your password")
    } else if (formData.password !== formData.confirmPassword) {
      allErrors.push("Passwords do not match")
    }

    // Validate final step
    if (!formData.acceptTerms) allErrors.push("You must accept the terms and conditions")

    setFormErrors(allErrors)
    return allErrors.length === 0
  }

  const handleNext = async () => {
    const isStepValid = validateStep(currentStep)

    if (isStepValid) {
      // If we're on the personal info step, check if email, phone, or BVN already exists
      if (currentStep === 1) {
        try {
          setIsCheckingExistence(true)
          setFormErrors([]) // Clear any previous errors

          // Add a loading message
          setFormErrors(["Checking if user exists... This may take a moment."])

          // Add timeout to prevent hanging with a longer timeout
          // const checkPromise = checkUserExists(formData.email, formData.phoneNumber, formData.bvn)
          // const timeoutPromise = new Promise<{ exists: boolean; error?: string }>((resolve) => {
          //   setTimeout(() => {
          //     resolve({
          //       exists: false,
          //       error: "Connection is slow, but you can continue. We'll verify again before account creation.",
          //     })
          //   }, 15000) // 15 seconds timeout
          // })

          // const existsCheck = await Promise.race([checkPromise, timeoutPromise])
          const existsCheck = await checkUserExists(formData.email, formData.phoneNumber, formData.bvn)

          // Clear the loading message
          setFormErrors([])

          // Show a non-blocking warning if there was a timeout or error
          if (existsCheck.error) {
            // Show a warning but still allow continuing
            setFormErrors([existsCheck.error])

            // Wait a moment to show the message before proceeding
            await new Promise((resolve) => setTimeout(resolve, 1500))

            // Continue to next step despite the error
            setCurrentStep(currentStep + 1)
            setFormErrors([])
            window.scrollTo(0, 0)
            setIsCheckingExistence(false)
            return
          }

          if (existsCheck.exists) {
            setExistingUserInfo(existsCheck)
            setFormErrors([existsCheck.message || "This user already exists"])
            setIsCheckingExistence(false)
            return
          }

          setExistingUserInfo(null)
        } catch (error) {
          // Continue anyway, the server will check again during signup
          setFormErrors(["Unable to verify if user exists. You can continue, but we'll check again during signup."])

          // Wait a moment to show the message before proceeding
          await new Promise((resolve) => setTimeout(resolve, 1500))
        } finally {
          setIsCheckingExistence(false)
        }
      }

      if (currentStep < totalSteps) {
        setCurrentStep(currentStep + 1)
        setFormErrors([])
        window.scrollTo(0, 0)
      }
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
      setFormErrors([])
      window.scrollTo(0, 0)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setAttemptedSubmit(true)

    // Validate all steps before submission
    const isValid = validateAllSteps()

    if (isValid) {
      try {
        setIsSubmitting(true)

        // Check if user already exists before proceeding
        try {
          setIsCheckingExistence(true)
          setFormErrors(["Verifying account information... This may take a moment."])

          const existsCheck = await checkUserExists(formData.email, formData.phoneNumber, formData.bvn)

          // Clear the loading message
          setFormErrors([])

          // If there was an error but we're continuing anyway
          if (existsCheck.error) {
            // Show a warning but continue with signup
            setFormErrors([existsCheck.error])
            // Wait a moment to show the message
            await new Promise((resolve) => setTimeout(resolve, 1500))
            setFormErrors([])
          }

          if (existsCheck.exists) {
            setExistingUserInfo(existsCheck)
            setFormErrors([existsCheck.message || "This user already exists"])
            setIsSubmitting(false)
            setIsCheckingExistence(false)
            return
          }

          setExistingUserInfo(null)
        } catch (error) {
          // Continue anyway, the server will check again during signup
          setFormErrors(["Unable to verify if user exists. Continuing with signup anyway."])
          await new Promise((resolve) => setTimeout(resolve, 1500))
          setFormErrors([])
        } finally {
          setIsCheckingExistence(false)
        }

        // Upload profile picture if exists using the server action
        let pictureUrl = null
        if (formData.profilePicture) {

          try {
            // Use the server action for file upload with timeout
            const uploadPromise = uploadProfilePicture(formData.profilePicture)
            const uploadTimeoutPromise = new Promise<{ error: string }>((resolve) => {
              setTimeout(() => {
                resolve({ error: "Upload timed out" })
              }, 3000)
            })

            const uploadResult = await Promise.race([uploadPromise, uploadTimeoutPromise])

            if (typeof uploadResult === "string") {
              pictureUrl = uploadResult
            } else if (uploadResult && uploadResult.error) {
              // Continue with signup without the profile picture
            }
          } catch (uploadError) {
            // Continue with signup without the profile picture
          }
        }

        // Register user with Supabase

        try {
          // Add timeout to prevent hanging
          const signupResult = await signUp({
            email: formData.email,
            password: formData.password,
            firstName: formData.firstName,
            middleName: formData.middleName,
            lastName: formData.lastName,
            phoneNumber: formData.phoneNumber,
            bvn: formData.bvn,
            dateOfBirth: formData.dateOfBirth,
            address: formData.address,
            city: formData.city,
            state: formData.state,
            zipCode: formData.zipCode,
            country: formData.country,
            bankCode: formData.bankCode,
            profilePictureUrl: pictureUrl,
            referralCode: formData.referralCode,
          })

          const signupTimeoutPromise = new Promise<{ error: string }>((resolve) => {
            setTimeout(() => {
              resolve({ error: "Signup request timed out. Please try again later." })
            }, 15000)
          })

          const result = await Promise.race([signupResult, signupTimeoutPromise])

          if (result.error) {

            // Check if it's an existing user error
            if (result.error.includes("already exists") || result.error.includes("already registered")) {
              setExistingUserInfo({
                exists: true,
                message: result.error,
              })
            }

            // Add more detailed error message for database errors
            if (result.error.includes("Database error")) {
              setFormErrors([
                result.error,
                "This could be due to a temporary issue. Please try again in a few moments or contact support if the problem persists.",
              ])
            } else {
              setFormErrors([result.error])
            }
            return
          }

            // Only set signup success and message if result is an object with 'success' and 'message'
            if (result && typeof result === 'object' && 'success' in result && 'message' in result) {
              setSignupSuccess(result.success === true)
              setSuccessMessage(
                typeof result.message === 'string'
                  ? result.message
                  : 'Account created successfully! You will be redirected to the login page in a moment.'
              )
            }

            // Redirect to login page on successful signup after 2 seconds
            setTimeout(() => {
              router.push("/")
            }, 2000)
          } catch (signupError) {
            setFormErrors(["An error occurred during signup. Please try again later."])
          }
        } catch (error) {
          setFormErrors(["An unexpected error occurred. Please try again."])
        } finally {
          setIsSubmitting(false)
        }
      } else {
        // Find the first step with errors and navigate to it
        for (let i = 1; i <= totalSteps; i++) {
          const stepValid = validateStep(i)
          if (!stepValid) {
            setCurrentStep(i)
            window.scrollTo(0, 0)
            break
          }
        }
      }
    }
  

  // Validate current step when it changes or when form data changes
  useEffect(() => {
    if (attemptedSubmit) {
      validateStep(currentStep)
    }
  }, [currentStep, formData, attemptedSubmit])

  // Initialize storage when component mounts
  useEffect(() => {
    const init = async () => {
      if (!storageInitialized) {
        try {

          // Add a shorter timeout to prevent hanging
          const timeoutPromise = new Promise(
            (_, reject) =>
              setTimeout(() => {
                return { success: true, message: "Timed out but continuing" }
              }, 2000), // Reduced from 5000ms to 2000ms
          )

          // Race between the actual initialization and the timeout
          try {
            const result = (await Promise.race([initializeStorage(), timeoutPromise])) as {
              success: boolean
              message?: string
              error?: string
            }

            if (result && result.success) {
            } else if (result && result.error) {
            }
          } catch (raceError) {
            // Continue anyway
          }
        } catch (error) {
        } finally {
          // Mark as initialized regardless of success to prevent retries
          setStorageInitialized(true)
        }
      }
    }

    // Initialize but don't wait for it to complete
    init().catch((error) => {
      setStorageInitialized(true) // Mark as initialized to prevent retries
    })
  }, [storageInitialized])

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <>
            <PersonalInfoStep formData={formData} updateFormData={updateFormData} />
            <div className="mb-4">
              <label htmlFor="referralCode" className="block text-sm font-medium text-gray-700">
                Referral Code
              </label>
              <input
                id="referralCode"
                name="referralCode"
                type="text"
                autoComplete="off"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                value={formData.referralCode}
                onChange={e => updateFormData({ referralCode: e.target.value })}
                required
              />
            </div>
          </>
        )
      case 2:
        return <AddressStep formData={formData} updateFormData={updateFormData} />
      case 3:
        return <SecurityStep formData={formData} updateFormData={updateFormData} />
      case 4:
        return <FinalStep formData={formData} updateFormData={updateFormData} />
      default:
        return null
    }
  }

  // Ensure the function returns JSX
  return (
    <div className="w-full">
      <form onSubmit={handleSubmit}>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-center">
            Step {currentStep} of {totalSteps}
          </h2>
          <Progress value={progress} className="h-2" />
        </div>
        <div className="mt-4">
          {signupSuccess ? (
            <Alert className="mb-4">
              <AlertDescription>{successMessage}</AlertDescription>
            </Alert>
          ) : (
            <>
              {formErrors.length > 0 && (
                <Alert
                  variant={formErrors.some((err) => err.includes("Connection is slow")) ? "default" : "destructive"}
                  className={`mb-4 ${formErrors.some((err) => err.includes("Connection is slow")) ? "bg-yellow-50 border-yellow-200" : ""}`}
                >
                  {formErrors.some((err) => err.includes("Connection is slow")) ? (
                    <Info className="h-4 w-4 text-yellow-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  <AlertDescription>
                    <div className="mt-2">
                      <p className="font-medium">
                        {formErrors.some((err) => err.includes("Connection is slow"))
                          ? "Notice:"
                          : "Please fix the following errors:"}
                      </p>
                      <ul className="list-disc pl-5 mt-1 space-y-1">
                        {formErrors.map((error, index) => (
                          <li key={index} className="text-sm">
                            {error}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {existingUserInfo?.exists && (
                <Alert className="mb-4 bg-blue-50 border-blue-200">
                  <Info className="h-4 w-4 text-blue-500" />
                  <AlertDescription>
                    <div className="mt-2">
                      <p className="font-medium">Already have an account?</p>
                      <p className="text-sm mt-1">
                        <Link href="/" className="text-blue-600 hover:text-blue-800">
                          Click here to log in
                        </Link>{" "}
                        instead.
                      </p>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {renderStep()}
            </>
          )}
        </div>
        {!signupSuccess && (
          <div className="flex justify-between mt-6">
            {currentStep > 1 ? (
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevious}
                disabled={isSubmitting || isCheckingExistence}
              >
                Previous
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/")}
                disabled={isSubmitting || isCheckingExistence}
              >
                Cancel
              </Button>
            )}
            {currentStep < totalSteps ? (
              <Button type="button" onClick={handleNext} disabled={isSubmitting || isCheckingExistence}>
                {isCheckingExistence ? "Checking..." : "Next"}
              </Button>
            ) : (
              <Button type="submit" className="w-full" disabled={isSubmitting || isCheckingExistence}>
                {isSubmitting ? "Creating Account..." : isCheckingExistence ? "Checking..." : "Create Account"}
              </Button>
            )}
          </div>
        )}
      </form>
    </div>
  )
}

