"use client"

import { Label } from "@/components/ui/label"
import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import {
  Camera,
  Loader2,
  Upload,
  FileText,
  Briefcase,
  CreditCard,
  User,
  MapPin,
  Phone,
  Calendar,
  Shield,
  Check,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { updateProfile, uploadProfilePicture, uploadIdDocument } from "@/lib/actions/profile"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "@/components/ui/use-toast"
import { Progress } from "@/components/ui/progress"

interface ProfileEditFormProps {
  profile: any
  initialTab?: string
}

export function ProfileEditForm({ profile, initialTab = "personal" }: ProfileEditFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [activeTab, setActiveTab] = useState(initialTab)

  // Personal Information
  const [firstName, setFirstName] = useState(profile?.first_name || "")
  const [middleName, setMiddleName] = useState(profile?.middle_name || "")
  const [lastName, setLastName] = useState(profile?.last_name || "")
  const [phoneNumber, setPhoneNumber] = useState(profile?.phone_number || "")
  const [address, setAddress] = useState(profile?.address || "")
  const [city, setCity] = useState(profile?.city || "")
  const [state, setState] = useState(profile?.state || "")
  const [zipCode, setZipCode] = useState(profile?.zip_code || "")

  // ID Verification
  const [idType, setIdType] = useState(profile?.id_type || "")
  const [idNumber, setIdNumber] = useState(profile?.id_number || "")

  // Employment Information
  const [employmentStatus, setEmploymentStatus] = useState(profile?.employment_status || "")
  const [employerName, setEmployerName] = useState(profile?.employer_name || "")
  const [employerAddress, setEmployerAddress] = useState(profile?.employer_address || "")
  const [workPhone, setWorkPhone] = useState(profile?.work_phone || "")
  const [jobTitle, setJobTitle] = useState(profile?.job_title || "")
  const [monthlyIncome, setMonthlyIncome] = useState<number | undefined>(profile?.monthly_income)
  const [employmentStartDate, setEmploymentStartDate] = useState(
    profile?.employment_start_date ? new Date(profile.employment_start_date).toISOString().split("T")[0] : "",
  )
  const [employmentEndDate, setEmploymentEndDate] = useState(
    profile?.employment_end_date ? new Date(profile.employment_end_date).toISOString().split("T")[0] : "",
  )

  // Withdrawal Account Information
  const [bankName, setBankName] = useState(profile?.bank_name || "")
  const [accountNumber, setAccountNumber] = useState(profile?.account_number || "")
  const [accountName, setAccountName] = useState(profile?.account_name || "")

  // Profile picture state
  const [profilePicture, setProfilePicture] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(profile?.profile_picture_url || null)
  const [isUploading, setIsUploading] = useState(false)

  // ID document state
  const [idDocument, setIdDocument] = useState<File | null>(null)
  const [idDocumentName, setIdDocumentName] = useState<string | null>(null)
  const [isUploadingId, setIsUploadingId] = useState(false)

  // Calculate progress
  const getProgress = () => {
    const tabIndex = ["personal", "id", "employment", "withdrawal"].indexOf(activeTab)
    return ((tabIndex + 1) / 4) * 100
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setError(null) // Clear previous errors

    if (file) {
      // Validate file type
      const validTypes = ["image/jpeg", "image/png", "image/gif"]
      if (!validTypes.includes(file.type)) {
        setError("Please select a valid image file (JPEG, PNG, or GIF)")
        return
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size should be less than 5MB")
        return
      }

      setProfilePicture(file)

      // Create preview URL
      const reader = new FileReader()
      reader.onload = () => {
        setPreviewUrl(reader.result as string)
      }
      reader.onerror = () => {
        setError("Failed to read the image file. Please try again.")
      }
      reader.readAsDataURL(file)
    }
  }

  const handleIdDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null

    if (file) {
      // Validate file type
      const validTypes = ["image/jpeg", "image/png", "application/pdf"]
      if (!validTypes.includes(file.type)) {
        setError("Please select a valid document file (JPEG, PNG, or PDF)")
        return
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError("Document size should be less than 10MB")
        return
      }

      setIdDocument(file)
      setIdDocumentName(file.name)
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()

    const confirmSubmit = window.confirm("Are you sure you want to save these changes?")
    if (!confirmSubmit) {
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)

      // Upload profile picture if changed
      let pictureUrl = profile?.profile_picture_url

      if (profilePicture) {
        setIsUploading(true)
        const uploadResult = await uploadProfilePicture(profilePicture)

        if (uploadResult.error) {
          setError(uploadResult.error)
          setIsSubmitting(false)
          setIsUploading(false)
          return
        }

        pictureUrl = uploadResult.url
        setIsUploading(false)
      }

      // Upload ID document if provided
      let idDocumentUrl = profile?.id_document_url

      if (idDocument) {
        setIsUploadingId(true)
        const uploadResult = await uploadIdDocument(idDocument)

        if (uploadResult.error) {
          setError(uploadResult.error)
          setIsSubmitting(false)
          setIsUploadingId(false)
          return
        }

        idDocumentUrl = uploadResult.url
        setIsUploadingId(false)
      }

      // Update profile with all fields
      const result = await updateProfile({
        firstName: firstName,
        middleName: middleName,
        lastName: lastName,
        phoneNumber: phoneNumber,
        address: address,
        city: city,
        state: state,
        zipCode: zipCode,
        profilePictureUrl: pictureUrl,
        bvn: profile?.bvn || undefined,
        dateOfBirth: profile?.date_of_birth || undefined,
        idType: idType,
        idNumber: idNumber,
        idDocumentUrl: idDocumentUrl,
        employmentStatus: employmentStatus,
        employerName: employerName,
        employerAddress: employerAddress,
        workPhone: workPhone,
        jobTitle: jobTitle,
        monthlyIncome: monthlyIncome,
        employmentStartDate: employmentStartDate,
        employmentEndDate: employmentEndDate,
        bankName: bankName,
        accountNumber: accountNumber,
        accountName: accountName,
      })

      if (result.error) {
        setError(result.error)
        return
      }

      if (result.success) {
        setSuccess(true)

        // Show toast notification
        toast({
          title: "Profile Updated",
          description: "Your profile has been updated successfully!",
          variant: "success",
        })

        // Redirect back to profile page after 2 seconds
        setTimeout(() => {
          router.push("/profile")
        }, 2000)
      }
    } catch (err) {
      console.error("Error updating profile:", err)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Get tab completion status
  const isPersonalComplete = () => firstName && lastName && phoneNumber && address && city && state
  const isIdComplete = () => idType && idNumber
  const isEmploymentComplete = () => (employmentStatus ? true : false)
  const isWithdrawalComplete = () => bankName && accountNumber && accountName

  // Get tab status icon
  const getTabStatusIcon = (tab: string) => {
    switch (tab) {
      case "personal":
        return isPersonalComplete() ? <Check className="h-4 w-4 text-green-500" /> : null
      case "id":
        return isIdComplete() ? <Check className="h-4 w-4 text-green-500" /> : null
      case "employment":
        return isEmploymentComplete() ? <Check className="h-4 w-4 text-green-500" /> : null
      case "withdrawal":
        return isWithdrawalComplete() ? <Check className="h-4 w-4 text-green-500" /> : null
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertDescription>
            Your profile has been updated successfully! You will be redirected to your profile page.
          </AlertDescription>
        </Alert>
      )}

      <Card className="overflow-hidden border-none shadow-md">
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-6 text-white">
          <h2 className="text-xl font-semibold">Complete Your Profile</h2>
          <p className="text-blue-100 mt-1">Provide your information to unlock all features</p>

          <div className="mt-4">
            <Progress value={getProgress()} className="h-2 bg-blue-400" />
            <div className="flex justify-between mt-1 text-xs text-blue-100">
              <span>Step {["personal", "id", "employment", "withdrawal"].indexOf(activeTab) + 1} of 4</span>
              <span>{Math.round(getProgress())}% Complete</span>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="px-6 pt-6 overflow-x-auto">
            <TabsList className="grid w-full grid-cols-4 mb-6 h-auto p-1 bg-gray-100">
              <TabsTrigger
                value="personal"
                className="flex items-center justify-center py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <User className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Personal</span>
                <span className="ml-2">{getTabStatusIcon("personal")}</span>
              </TabsTrigger>
              <TabsTrigger
                value="id"
                className="flex items-center justify-center py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <FileText className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">ID Verification</span>
                <span className="ml-2">{getTabStatusIcon("id")}</span>
              </TabsTrigger>
              <TabsTrigger
                value="employment"
                className="flex items-center justify-center py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <Briefcase className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Employment</span>
                <span className="ml-2">{getTabStatusIcon("employment")}</span>
              </TabsTrigger>
              <TabsTrigger
                value="withdrawal"
                className="flex items-center justify-center py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Withdrawal</span>
                <span className="ml-2">{getTabStatusIcon("withdrawal")}</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <CardContent className="p-6">
            <form onSubmit={onSubmit} className="space-y-6">
              <TabsContent value="personal">
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row gap-6 items-start">
                    {/* Profile Picture */}
                    <div className="flex flex-col items-center mb-6 sm:mb-0 sm:w-1/3">
                      <div className="relative h-32 w-32 rounded-full overflow-hidden mb-2 border-2 border-blue-200 shadow-md">
                        {isUploading ? (
                          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                          </div>
                        ) : (
                          <>
                            <Image
                              src={previewUrl || "/placeholder.svg?height=128&width=128&query=user"}
                              alt="Profile"
                              fill
                              className="object-cover"
                            />
                            <label
                              htmlFor="profile-picture"
                              className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 flex items-center justify-center cursor-pointer transition-all duration-200"
                            >
                              <Camera className="h-8 w-8 text-white opacity-0 hover:opacity-100" />
                            </label>
                          </>
                        )}
                      </div>
                      <label
                        htmlFor="profile-picture"
                        className="text-sm text-blue-600 cursor-pointer hover:text-blue-800 font-medium"
                        aria-label="Change profile picture"
                      >
                        Change Profile Picture
                      </label>
                      <Input
                        id="profile-picture"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileChange}
                        disabled={isSubmitting}
                      />
                      <p className="text-xs text-gray-500 mt-1 text-center">
                        Supported formats: JPEG, PNG, GIF. Max size: 5MB
                      </p>
                    </div>

                    {/* Personal Information */}
                    <div className="space-y-4 sm:w-2/3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="firstName" className="text-sm font-medium">
                            First Name <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="firstName"
                            placeholder="First Name"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            className="border-gray-300 focus:border-blue-500"
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="lastName" className="text-sm font-medium">
                            Last Name <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="lastName"
                            placeholder="Last Name"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            className="border-gray-300 focus:border-blue-500"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="middleName" className="text-sm font-medium">
                          Middle Name (Optional)
                        </Label>
                        <Input
                          id="middleName"
                          placeholder="Middle Name"
                          value={middleName}
                          onChange={(e) => setMiddleName(e.target.value)}
                          className="border-gray-300 focus:border-blue-500"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phoneNumber" className="text-sm font-medium">
                          Phone Number <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                          <Input
                            id="phoneNumber"
                            placeholder="Phone Number"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            className="pl-10 border-gray-300 focus:border-blue-500"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator className="my-6" />

                  <h3 className="text-lg font-medium flex items-center mb-4">
                    <MapPin className="h-5 w-5 mr-2 text-blue-600" />
                    Address Information
                  </h3>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="address" className="text-sm font-medium">
                        Street Address <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="address"
                        placeholder="Street Address"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="border-gray-300 focus:border-blue-500"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="city" className="text-sm font-medium">
                          City <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="city"
                          placeholder="City"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className="border-gray-300 focus:border-blue-500"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="state" className="text-sm font-medium">
                          State <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="state"
                          placeholder="State"
                          value={state}
                          onChange={(e) => setState(e.target.value)}
                          className="border-gray-300 focus:border-blue-500"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="zipCode" className="text-sm font-medium">
                          Zip/Postal Code
                        </Label>
                        <Input
                          id="zipCode"
                          placeholder="Zip/Postal Code"
                          value={zipCode}
                          onChange={(e) => setZipCode(e.target.value)}
                          className="border-gray-300 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="id">
                <div className="space-y-6">
                  <div className="flex items-center mb-4">
                    <FileText className="h-5 w-5 mr-2 text-blue-600" />
                    <h3 className="text-lg font-medium">ID Verification</h3>
                  </div>

                  <p className="text-sm text-gray-600 mb-6">
                    Please provide a valid government-issued ID for verification purposes. This helps us confirm your
                    identity and improve your account security.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="idType" className="text-sm font-medium">
                          ID Type <span className="text-red-500">*</span>
                        </Label>
                        <Select onValueChange={setIdType} defaultValue={idType}>
                          <SelectTrigger className="border-gray-300 focus:border-blue-500">
                            <SelectValue placeholder="Select ID type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="drivers_license">Driver's License</SelectItem>
                            <SelectItem value="national_id">National ID Card</SelectItem>
                            <SelectItem value="nin_slip">NIN Slip</SelectItem>
                            <SelectItem value="international_passport">International Passport</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="idNumber" className="text-sm font-medium">
                          ID Number <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative">
                          <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                          <Input
                            id="idNumber"
                            placeholder="Enter your ID number"
                            value={idNumber}
                            onChange={(e) => setIdNumber(e.target.value)}
                            className="pl-10 border-gray-300 focus:border-blue-500"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="id-document" className="text-sm font-medium">
                        Upload ID Document <span className="text-red-500">*</span>
                      </Label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-gray-50 hover:bg-gray-100 transition-colors">
                        {isUploadingId ? (
                          <div className="flex flex-col items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-2" />
                            <p className="text-sm text-gray-500">Uploading document...</p>
                          </div>
                        ) : (
                          <>
                            {idDocumentName || profile?.id_document_url ? (
                              <div className="flex flex-col items-center">
                                <div className="bg-blue-50 p-3 rounded-full mb-2">
                                  <FileText className="h-6 w-6 text-blue-600" />
                                </div>
                                <p className="text-sm font-medium mb-1">{idDocumentName || "Document uploaded"}</p>
                                <p className="text-xs text-gray-500 mb-3">
                                  {profile?.id_document_url && !idDocumentName
                                    ? "You have already uploaded an ID document"
                                    : "Document ready to upload"}
                                </p>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => document.getElementById("id-document")?.click()}
                                  className="border-blue-300 text-blue-600 hover:bg-blue-50"
                                >
                                  Change Document
                                </Button>
                              </div>
                            ) : (
                              <div
                                className="flex flex-col items-center cursor-pointer"
                                onClick={() => document.getElementById("id-document")?.click()}
                              >
                                <div className="bg-blue-50 p-3 rounded-full mb-2">
                                  <Upload className="h-6 w-6 text-blue-600" />
                                </div>
                                <p className="text-sm font-medium mb-1">Click to upload</p>
                                <p className="text-xs text-gray-500">
                                  Upload a clear photo or scan of your ID document
                                </p>
                              </div>
                            )}
                            <input
                              id="id-document"
                              type="file"
                              accept="image/jpeg,image/png,application/pdf"
                              className="hidden"
                              onChange={handleIdDocumentChange}
                              disabled={isSubmitting}
                            />
                          </>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Supported formats: JPEG, PNG, PDF. Max size: 10MB</p>
                    </div>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800 mt-6">
                    <p className="font-medium mb-1">Important:</p>
                    <p>
                      Your ID document will be securely stored and used only for verification purposes. We take your
                      privacy seriously and follow strict security protocols.
                    </p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="employment">
                <div className="space-y-6">
                  <div className="flex items-center mb-4">
                    <Briefcase className="h-5 w-5 mr-2 text-blue-600" />
                    <h3 className="text-lg font-medium">Employment Information</h3>
                  </div>

                  <p className="text-sm text-gray-600 mb-6">
                    Please provide details about your current employment. This information helps us better understand
                    your financial profile.
                  </p>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="employmentStatus" className="text-sm font-medium">
                        Employment Status <span className="text-red-500">*</span>
                      </Label>
                      <Select onValueChange={setEmploymentStatus} defaultValue={employmentStatus}>
                        <SelectTrigger className="border-gray-300 focus:border-blue-500">
                          <SelectValue placeholder="Select employment status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="employed">Employed</SelectItem>
                          <SelectItem value="self_employed">Self-Employed</SelectItem>
                          <SelectItem value="business_owner">Business Owner</SelectItem>
                          <SelectItem value="unemployed">Unemployed</SelectItem>
                          <SelectItem value="student">Student</SelectItem>
                          <SelectItem value="retired">Retired</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {employmentStatus === "employed" ||
                    employmentStatus === "self_employed" ||
                    employmentStatus === "business_owner" ? (
                      <div className="space-y-6 border border-gray-200 rounded-lg p-4 bg-gray-50">
                        <div className="space-y-2">
                          <Label htmlFor="employerName" className="text-sm font-medium">
                            {employmentStatus === "business_owner" ? "Business Name" : "Employer Name"}{" "}
                            <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="employerName"
                            placeholder={
                              employmentStatus === "business_owner"
                                ? "Enter your business name"
                                : "Enter your employer name"
                            }
                            value={employerName}
                            onChange={(e) => setEmployerName(e.target.value)}
                            className="border-gray-300 focus:border-blue-500"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="jobTitle" className="text-sm font-medium">
                            {employmentStatus === "business_owner" ? "Position/Role" : "Job Title"}{" "}
                            <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="jobTitle"
                            placeholder={
                              employmentStatus === "business_owner"
                                ? "Enter your position/role"
                                : "Enter your job title"
                            }
                            value={jobTitle}
                            onChange={(e) => setJobTitle(e.target.value)}
                            className="border-gray-300 focus:border-blue-500"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="employerAddress" className="text-sm font-medium">
                            {employmentStatus === "business_owner" ? "Business Address" : "Employer Address"}
                          </Label>
                          <Textarea
                            id="employerAddress"
                            placeholder={
                              employmentStatus === "business_owner"
                                ? "Enter your business address"
                                : "Enter your employer address"
                            }
                            value={employerAddress}
                            onChange={(e) => setEmployerAddress(e.target.value)}
                            className="border-gray-300 focus:border-blue-500"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="workPhone" className="text-sm font-medium">
                            Work Phone Number
                          </Label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                            <Input
                              id="workPhone"
                              placeholder="Enter work phone number"
                              value={workPhone}
                              onChange={(e) => setWorkPhone(e.target.value)}
                              className="pl-10 border-gray-300 focus:border-blue-500"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="employmentStartDate" className="text-sm font-medium">
                              Start Date
                            </Label>
                            <div className="relative">
                              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                              <Input
                                id="employmentStartDate"
                                type="date"
                                value={employmentStartDate}
                                onChange={(e) => setEmploymentStartDate(e.target.value)}
                                className="pl-10 border-gray-300 focus:border-blue-500"
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="employmentEndDate" className="text-sm font-medium">
                              End Date (if applicable)
                            </Label>
                            <div className="relative">
                              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                              <Input
                                id="employmentEndDate"
                                type="date"
                                value={employmentEndDate}
                                onChange={(e) => setEmploymentEndDate(e.target.value)}
                                className="pl-10 border-gray-300 focus:border-blue-500"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : null}

                    <Separator className="my-6" />

                    <div className="space-y-2">
                      <Label htmlFor="monthlyIncome" className="text-sm font-medium">
                        Monthly Income (₦)
                      </Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₦</span>
                        <Input
                          id="monthlyIncome"
                          type="number"
                          placeholder="Enter your monthly income"
                          value={monthlyIncome === undefined ? "" : monthlyIncome.toString()}
                          onChange={(e) => setMonthlyIncome(e.target.value === "" ? undefined : Number(e.target.value))}
                          className="pl-8 border-gray-300 focus:border-blue-500"
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        This information helps us determine your loan eligibility and limits.
                      </p>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800 mt-4">
                      <p className="font-medium mb-1">Why we need this information:</p>
                      <p>
                        Your employment details help us assess your loan eligibility and provide you with appropriate
                        financial products. This information is kept confidential and secure.
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="withdrawal">
                <div className="space-y-6">
                  <div className="flex items-center mb-4">
                    <CreditCard className="h-5 w-5 mr-2 text-blue-600" />
                    <h3 className="text-lg font-medium">Withdrawal Account</h3>
                  </div>

                  <p className="text-sm text-gray-600 mb-6">
                    Please provide your withdrawal account details. This is where your funds will be sent when you make
                    a withdrawal.
                  </p>

                  <div className="space-y-6 border border-gray-200 rounded-lg p-6 bg-gray-50">
                    <div className="space-y-2">
                      <Label htmlFor="bankName" className="text-sm font-medium">
                        Bank Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="bankName"
                        placeholder="Enter your bank name"
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        className="border-gray-300 focus:border-blue-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="accountNumber" className="text-sm font-medium">
                        Account Number <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="accountNumber"
                        placeholder="Enter your account number"
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        className="border-gray-300 focus:border-blue-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="accountName" className="text-sm font-medium">
                        Account Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="accountName"
                        placeholder="Enter your account name"
                        value={accountName}
                        onChange={(e) => setAccountName(e.target.value)}
                        className="border-gray-300 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800 mt-4">
                    <p className="font-medium mb-1">Important:</p>
                    <p>
                      Please ensure that the account details you provide are accurate. Incorrect information may result
                      in failed withdrawals or delays in receiving your funds.
                    </p>
                  </div>
                </div>
              </TabsContent>

              <div className="flex justify-between pt-4 border-t mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={isSubmitting || isUploading || isUploadingId}
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </Button>

                <div className="flex gap-2">
                  {activeTab !== "personal" && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        if (activeTab === "id") setActiveTab("personal")
                        else if (activeTab === "employment") setActiveTab("id")
                        else if (activeTab === "withdrawal") setActiveTab("employment")
                      }}
                      disabled={isSubmitting || isUploading || isUploadingId}
                      className="border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                      <ChevronRight className="h-4 w-4 mr-1 rotate-180" />
                      Previous
                    </Button>
                  )}

                  {activeTab !== "withdrawal" ? (
                    <Button
                      type="button"
                      onClick={() => {
                        if (activeTab === "personal") setActiveTab("id")
                        else if (activeTab === "id") setActiveTab("employment")
                        else if (activeTab === "employment") setActiveTab("withdrawal")
                      }}
                      disabled={isSubmitting || isUploading || isUploadingId}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      disabled={isSubmitting || isUploading || isUploadingId}
                      className="relative bg-blue-600 hover:bg-blue-700"
                    >
                      {isSubmitting ? (
                        <>
                          <span className="opacity-0">Save Changes</span>
                          <Loader2 className="h-4 w-4 animate-spin absolute" />
                        </>
                      ) : (
                        "Save Changes"
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </form>
          </CardContent>
        </Tabs>
      </Card>
    </div>
  )
}
