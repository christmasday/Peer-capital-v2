"use client"

import { Label } from "@/components/ui/label"
import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Camera, Loader2, Upload, FileText, Briefcase } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { updateProfile, uploadProfilePicture, uploadIdDocument } from "@/lib/actions/profile"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "@/components/ui/use-toast"

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

  // Profile picture state
  const [profilePicture, setProfilePicture] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(profile?.profile_picture_url || null)
  const [isUploading, setIsUploading] = useState(false)

  // ID document state
  const [idDocument, setIdDocument] = useState<File | null>(null)
  const [idDocumentName, setIdDocumentName] = useState<string | null>(null)
  const [isUploadingId, setIsUploadingId] = useState(false)

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

  return (
    <Card>
      <CardContent className="pt-6">
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-4">
            <AlertDescription>
              Your profile has been updated successfully! You will be redirected to your profile page.
            </AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 mb-6">
            <TabsTrigger value="personal">Personal Info</TabsTrigger>
            <TabsTrigger value="id">ID Verification</TabsTrigger>
            <TabsTrigger value="employment">Employment</TabsTrigger>
          </TabsList>

          <form onSubmit={onSubmit} className="space-y-6">
            <TabsContent value="personal">
              {/* Profile Picture */}
              <div className="flex flex-col items-center mb-6">
                <div className="relative h-24 w-24 rounded-full overflow-hidden mb-2 border-2 border-blue-200">
                  {isUploading ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    </div>
                  ) : (
                    <>
                      <Image
                        src={previewUrl || "/placeholder.svg?height=100&width=100"}
                        alt="Profile"
                        fill
                        className="object-cover"
                      />
                      <label
                        htmlFor="profile-picture"
                        className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 flex items-center justify-center cursor-pointer transition-all duration-200"
                      >
                        <Camera className="h-8 w-8 text-white opacity-0 group-hover:opacity-100" />
                      </label>
                    </>
                  )}
                </div>
                <label
                  htmlFor="profile-picture"
                  className="text-sm text-blue-600 cursor-pointer hover:text-blue-800"
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
                <p className="text-xs text-gray-500 mt-1">Supported formats: JPEG, PNG, GIF. Max size: 5MB</p>
              </div>

              <div className="grid gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      placeholder="First Name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      placeholder="Last Name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="middleName">Middle Name (Optional)</Label>
                  <Input
                    id="middleName"
                    placeholder="Middle Name"
                    value={middleName}
                    onChange={(e) => setMiddleName(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <Input
                    id="phoneNumber"
                    placeholder="Phone Number"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    placeholder="Street Address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input id="city" placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} />
                  </div>

                  <div>
                    <Label htmlFor="state">State</Label>
                    <Input id="state" placeholder="State" value={state} onChange={(e) => setState(e.target.value)} />
                  </div>
                </div>

                <div>
                  <Label htmlFor="zipCode">Zip/Postal Code (Optional)</Label>
                  <Input
                    id="zipCode"
                    placeholder="Zip/Postal Code"
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="id">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  ID Verification
                </CardTitle>
                <p className="text-sm text-gray-500 mt-1">
                  Please provide a valid government-issued ID for verification purposes. This helps us confirm your
                  identity and improve your account security.
                </p>
              </CardHeader>

              <div className="space-y-6">
                <div>
                  <Label htmlFor="idType">ID Type</Label>
                  <Select onValueChange={setIdType} defaultValue={idType}>
                    <SelectTrigger>
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

                <div>
                  <Label htmlFor="idNumber">ID Number</Label>
                  <Input
                    id="idNumber"
                    placeholder="Enter your ID number"
                    value={idNumber}
                    onChange={(e) => setIdNumber(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="id-document">Upload ID Document</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
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
                            >
                              Change Document
                            </Button>
                          </div>
                        ) : (
                          <div
                            className="flex flex-col items-center cursor-pointer"
                            onClick={() => document.getElementById("id-document")?.click()}
                          >
                            <div className="bg-gray-100 p-3 rounded-full mb-2">
                              <Upload className="h-6 w-6 text-gray-500" />
                            </div>
                            <p className="text-sm font-medium mb-1">Click to upload</p>
                            <p className="text-xs text-gray-500">Upload a clear photo or scan of your ID document</p>
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
                  <p className="text-xs text-gray-500">Supported formats: JPEG, PNG, PDF. Max size: 10MB</p>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
                  <p className="font-medium mb-1">Important:</p>
                  <p>
                    Your ID document will be securely stored and used only for verification purposes. We take your
                    privacy seriously and follow strict security protocols.
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="employment">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-blue-600" />
                  Employment Information
                </CardTitle>
                <p className="text-sm text-gray-500 mt-1">
                  Please provide details about your current employment. This information helps us better understand your
                  financial profile.
                </p>
              </CardHeader>

              <div className="space-y-6">
                <div>
                  <Label htmlFor="employmentStatus">Employment Status</Label>
                  <Select onValueChange={setEmploymentStatus} defaultValue={employmentStatus}>
                    <SelectTrigger>
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
                  <>
                    <div>
                      <Label htmlFor="employerName">
                        {employmentStatus === "business_owner" ? "Business Name" : "Employer Name"}
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
                      />
                    </div>

                    <div>
                      <Label htmlFor="jobTitle">
                        {employmentStatus === "business_owner" ? "Position/Role" : "Job Title"}
                      </Label>
                      <Input
                        id="jobTitle"
                        placeholder={
                          employmentStatus === "business_owner" ? "Enter your position/role" : "Enter your job title"
                        }
                        value={jobTitle}
                        onChange={(e) => setJobTitle(e.target.value)}
                      />
                    </div>

                    <div>
                      <Label htmlFor="employerAddress">
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
                      />
                    </div>

                    <div>
                      <Label htmlFor="workPhone">Work Phone Number</Label>
                      <Input
                        id="workPhone"
                        placeholder="Enter work phone number"
                        value={workPhone}
                        onChange={(e) => setWorkPhone(e.target.value)}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="employmentStartDate">Start Date</Label>
                        <Input
                          id="employmentStartDate"
                          type="date"
                          value={employmentStartDate}
                          onChange={(e) => setEmploymentStartDate(e.target.value)}
                        />
                      </div>

                      <div>
                        <Label htmlFor="employmentEndDate">End Date (if applicable)</Label>
                        <Input
                          id="employmentEndDate"
                          type="date"
                          value={employmentEndDate}
                          onChange={(e) => setEmploymentEndDate(e.target.value)}
                        />
                      </div>
                    </div>
                  </>
                ) : null}

                <Separator />

                <div>
                  <Label htmlFor="monthlyIncome">Monthly Income (₦)</Label>
                  <Input
                    id="monthlyIncome"
                    type="number"
                    placeholder="Enter your monthly income"
                    value={monthlyIncome === undefined ? "" : monthlyIncome.toString()}
                    onChange={(e) => setMonthlyIncome(e.target.value === "" ? undefined : Number(e.target.value))}
                  />
                  <p className="text-sm text-gray-500">
                    This information helps us determine your loan eligibility and limits.
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                  <p className="font-medium mb-1">Why we need this information:</p>
                  <p>
                    Your employment details help us assess your loan eligibility and provide you with appropriate
                    financial products. This information is kept confidential and secure.
                  </p>
                </div>
              </div>
            </TabsContent>

            <div className="flex justify-between pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isSubmitting || isUploading || isUploadingId}
              >
                Cancel
              </Button>

              <div className="flex gap-2">
                {activeTab !== "personal" && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setActiveTab(activeTab === "id" ? "personal" : "id")}
                    disabled={isSubmitting || isUploading || isUploadingId}
                  >
                    Previous
                  </Button>
                )}

                {activeTab !== "employment" ? (
                  <Button
                    type="button"
                    onClick={() => setActiveTab(activeTab === "personal" ? "id" : "employment")}
                    disabled={isSubmitting || isUploading || isUploadingId}
                  >
                    Next
                  </Button>
                ) : (
                  <Button type="submit" disabled={isSubmitting || isUploading || isUploadingId} className="relative">
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
        </Tabs>
      </CardContent>
    </Card>
  )
}
