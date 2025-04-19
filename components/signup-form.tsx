"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { PersonalInfoStep } from "@/components/signup-steps/personal-info-step"
import { AddressStep } from "@/components/signup-steps/address-step"
import { SecurityStep } from "@/components/signup-steps/security-step"
import { FinalStep } from "@/components/signup-steps/final-step"
import { signUp } from "@/lib/actions/auth"
import { initializeStorage } from "@/lib/actions/storage"
import { uploadProfilePicture } from "@/lib/actions/upload"

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
  password: string
  confirmPassword: string
  profilePicture: File | null
  acceptTerms: boolean
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
    password: "",
    confirmPassword: "",
    profilePicture: null,
    acceptTerms: false,
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
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null)
  const [signupSuccess, setSignupSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [storageInitialized, setStorageInitialized] = useState(false)

  const totalSteps = 4
  const progress = (currentStep / totalSteps) * 100

  const updateFormData = (data: Partial<SignupFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }))
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

  const handleNext = () => {
    const isStepValid = validateStep(currentStep)

    if (isStepValid) {
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
        console.log("Starting signup process...")

        // Upload profile picture if exists using the server action
        let pictureUrl = null
        if (formData.profilePicture) {
          console.log("Uploading profile picture...")

          try {
            // Use the server action for file upload
            const uploadResult = await uploadProfilePicture(formData.profilePicture)

            if (typeof uploadResult === "string") {
              pictureUrl = uploadResult
              console.log("Profile picture uploaded:", pictureUrl)
            } else if (uploadResult && uploadResult.error) {
              console.warn("Profile picture upload warning:", uploadResult.error)
              // Continue with signup without the profile picture
            }
          } catch (uploadError) {
            console.error("Error uploading profile picture:", uploadError)
            // Continue with signup without the profile picture
          }
        }

        // Register user with Supabase
        console.log("Registering user with Supabase...")

        const result = await signUp({
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
          profilePictureUrl: pictureUrl,
        })

        if (result.error) {
          console.error("Signup error:", result.error)
          setFormErrors([result.error])
          return
        }

        if (result.warning) {
          console.warn("Signup warning:", result.warning)
        }

        console.log("Signup successful:", result)
        setSignupSuccess(true)
        setSuccessMessage(
          result.message || "Account created successfully! You will be redirected to the login page in a moment.",
        )

        // Redirect to login page on successful signup after 2 seconds
        setTimeout(() => {
          router.push("/")
        }, 2000)
      } catch (error) {
        console.error("Unexpected signup error:", error)
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
          console.log("Initializing storage...")

          // Add a timeout to prevent hanging
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Storage initialization timed out")), 5000),
          )

          // Race between the actual initialization and the timeout
          const result = (await Promise.race([initializeStorage(), timeoutPromise])) as {
            success: boolean
            message?: string
            error?: string
          }

          if (result.success) {
            console.log("Storage initialized:", result.message || "Success")
          } else {
            console.warn("Storage initialization failed:", result.error)
          }
        } catch (error) {
          console.error("Failed to initialize storage from signup form:", error)
        } finally {
          // Mark as initialized regardless of success to prevent retries
          setStorageInitialized(true)
        }
      }
    }

    init()
  }, [storageInitialized])

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <PersonalInfoStep formData={formData} updateFormData={updateFormData} />
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

  return (
    <Card className="w-full">
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-center">
              Step {currentStep} of {totalSteps}
            </h2>
            <Progress value={progress} className="h-2" />
          </div>
        </CardHeader>
        <CardContent>
          {signupSuccess ? (
            <Alert className="mb-4">
              <AlertDescription>{successMessage}</AlertDescription>
            </Alert>
          ) : (
            <>
              {formErrors.length > 0 && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="mt-2">
                      <p className="font-medium">Please fix the following errors:</p>
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

              {renderStep()}
            </>
          )}
        </CardContent>
        {!signupSuccess && (
          <CardFooter className="flex justify-between">
            {currentStep > 1 ? (
              <Button type="button" variant="outline" onClick={handlePrevious} disabled={isSubmitting}>
                Previous
              </Button>
            ) : (
              <Button type="button" variant="outline" onClick={() => router.push("/")} disabled={isSubmitting}>
                Cancel
              </Button>
            )}
            {currentStep < totalSteps ? (
              <Button type="button" onClick={handleNext} disabled={isSubmitting}>
                Next
              </Button>
            ) : (
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating Account..." : "Submit"}
              </Button>
            )}
          </CardFooter>
        )}
      </form>
    </Card>
  )
}
