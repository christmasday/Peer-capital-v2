"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Briefcase, GraduationCap, MapPin, Phone, Mail, Heart, Calendar, User, Info, Edit, Wallet, Plus, Wallet as WalletIcon, Loader2 } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { updateSocialMedia } from "@/lib/actions/profile"
import { updateBio } from "@/lib/actions/profile"
import { updateProfile, uploadIdDocument, uploadLendingLicenseServer } from "@/lib/actions/profile"
import { getLoanHelperSettings, updateLoanHelperSettings } from "@/lib/actions/loan-helper-settings"
// Removed Paystack virtual account integration
import { getAccountBalance } from "@/lib/actions/account"
import { Textarea } from "@/components/ui/textarea"
import { createAdminClient } from "@/lib/supabase/admin"
import imageCompression from 'browser-image-compression'
import { SlateEditor } from "@/components/profile/useSlateEditor"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { LoanHelperSettingsForm } from "@/components/profile/loan-helper-settings-form"
import { LoanHelperSettingsDisplay } from "@/components/profile/loan-helper-settings-display"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"

interface ProfileAboutProps {
  profile: any
  isCurrentUser?: boolean
  initialSection?: string
}

export function ProfileAbout({ profile, isCurrentUser = false, initialSection }: ProfileAboutProps) {
  const [activeSection, setActiveSection] = useState(initialSection || "overview")
  const [isEditingContact, setIsEditingContact] = useState(false)
  const [isEditingBio, setIsEditingBio] = useState(false)
  const [isEditingLocation, setIsEditingLocation] = useState(false)
  const [isEditingWorkOverview, setIsEditingWorkOverview] = useState(false)
  const [isEditingPhone, setIsEditingPhone] = useState(false)
  const [isEditingEmail, setIsEditingEmail] = useState(false)
  const [isEditingRelationship, setIsEditingRelationship] = useState(false)
  const [isEditingEducation, setIsEditingEducation] = useState(false)
  const [isEditingMonthlyIncome, setIsEditingMonthlyIncome] = useState(false)
  const [isEditingBank, setIsEditingBank] = useState(false)
  const [phoneText, setPhoneText] = useState(profile.phone_number || "")
  const [emailText, setEmailText] = useState(profile.email || "")
  const [relationshipStatusText, setRelationshipStatusText] = useState(profile.relationship_status || "")
  const [bioText, setBioText] = useState(profile.bio || "")
  const [locationAddress, setLocationAddress] = useState(profile.address || "")
  const [locationCity, setLocationCity] = useState(profile.city || "")
  const [locationState, setLocationState] = useState(profile.state || "")
  const [locationStreet, setLocationStreet] = useState(profile.street || profile.address || "")
  const [locationLga, setLocationLga] = useState(profile.lga || profile.city || "")
  const [locationLandmark, setLocationLandmark] = useState(profile.landmark || "")
  const [workOverviewJobTitle, setWorkOverviewJobTitle] = useState(profile.job_title || "")
  const [workOverviewEmployerName, setWorkOverviewEmployerName] = useState(profile.employer_name || "")
  const [workOverviewEmployerAddress, setWorkOverviewEmployerAddress] = useState(profile.employer_address || "")
  const [workOverviewEmploymentStatus, setWorkOverviewEmploymentStatus] = useState(profile.employment_status || "")
  const [schoolName, setSchoolName] = useState(profile.school_name || "")
  const [degree, setDegree] = useState(profile.degree || "")
  const [fieldOfStudy, setFieldOfStudy] = useState(profile.field_of_study || "")
  const [graduationYear, setGraduationYear] = useState(profile.graduation_year || "")
  const [socialMediaData, setSocialMediaData] = useState({
    facebook_url: profile.facebook_url || "",
    linkedin_url: profile.linkedin_url || "",
    twitter_url: profile.twitter_url || "",
    website: profile.website || "",
  })
  const [isSavingContact, setIsSavingContact] = useState(false)
  const [monthlyIncomeValue, setMonthlyIncomeValue] = useState<string>(
    profile.monthly_income !== undefined && profile.monthly_income !== null ? String(profile.monthly_income) : ""
  )
  const [isSavingMonthlyIncome, setIsSavingMonthlyIncome] = useState(false)
  const [monthlyIncomeError, setMonthlyIncomeError] = useState<string | null>(null)
  const [bankName, setBankName] = useState(profile.bank_name || "")
  const [accountNumber, setAccountNumber] = useState(profile.account_number || "")
  const [accountName, setAccountName] = useState(profile.account_name || "")
  const [isSavingBank, setIsSavingBank] = useState(false)
  const [bankError, setBankError] = useState<string | null>(null)
  const [isEditingLoanHelper, setIsEditingLoanHelper] = useState(false)
  const [loanAmount, setLoanAmount] = useState("")
  const [interestRate, setInterestRate] = useState("")
  const [paybackPeriod, setPaybackPeriod] = useState("")
  const [loanTerms, setLoanTerms] = useState("")
  const [isSavingLoanHelper, setIsSavingLoanHelper] = useState(false)
  const [loanHelperError, setLoanHelperError] = useState<string | null>(null)
  const [loanHelperLoaded, setLoanHelperLoaded] = useState(false)
  // Add state for BVN editing and verification
  const [isEditingBvn, setIsEditingBvn] = useState(false);
  const [bvnText, setBvnText] = useState(profile.bvn || "");
  const [isSavingBvn, setIsSavingBvn] = useState(false);
  const [bvnError, setBvnError] = useState<string | null>(null);
  const [bvnOnboardRequestId, setBvnOnboardRequestId] = useState<string | null>(null);
  const [resolvedSrUserId, setResolvedSrUserId] = useState<string | null>(profile.sr_user_id || null);
  const [isEditingNin, setIsEditingNin] = useState(false);
  const [ninText, setNinText] = useState(profile.id_number || profile.idNumber || "");
  const [isSavingNin, setIsSavingNin] = useState(false);
  const [ninError, setNinError] = useState<string | null>(null);
  const [isVerifyingBvn, setIsVerifyingBvn] = useState(false);
  const [bvnVerified, setBvnVerified] = useState<boolean | null>(profile.bvn_verified ?? null);
  const [bvnVerificationMsg, setBvnVerificationMsg] = useState<string | null>(null);
  // Add state for country and banks
  const [country, setCountry] = useState(profile.country || "Nigeria");
  const [countries, setCountries] = useState<{name: string, iso_code: string}[]>([]);
  const [bankCode, setBankCode] = useState(profile.bank_code || "");
  const [banks, setBanks] = useState<{name: string, code: string}[]>([]);
  const [isLoadingBanks, setIsLoadingBanks] = useState(false);
  const [isLoadingCountries, setIsLoadingCountries] = useState(false);
  // Add state for account type
  const [accountType, setAccountType] = useState(profile.account_type || "personal");
  const [isEditingFullName, setIsEditingFullName] = useState(false);
  const [firstNameText, setFirstNameText] = useState(profile.first_name || "");
  const [middleNameText, setMiddleNameText] = useState(profile.middle_name || "");
  const [lastNameText, setLastNameText] = useState(profile.last_name || "");
  const [isSavingFullName, setIsSavingFullName] = useState(false);
  const [fullNameError, setFullNameError] = useState<string | null>(null);
  const { toast } = useToast();
  const [isVerifyingCustomer, setIsVerifyingCustomer] = useState(false);
  const [customerVerificationMsg, setCustomerVerificationMsg] = useState<string | null>(null);
  // Add state and handlers at the top of the component
  const [showPhoneVerify, setShowPhoneVerify] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [phoneOtpReferenceId, setPhoneOtpReferenceId] = useState<string | null>(null);
  const [isSendingPhoneOtp, setIsSendingPhoneOtp] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(profile.phone_verified ?? false)
  const [showEmailVerify, setShowEmailVerify] = useState(false)
  const [emailOtp, setEmailOtp] = useState("")
  const [emailOtpError, setEmailOtpError] = useState("")
  const [isSendingEmailOtp, setIsSendingEmailOtp] = useState(false)
  const [isVerifyingEmailOtp, setIsVerifyingEmailOtp] = useState(false)
  const [emailVerified, setEmailVerified] = useState(Boolean(profile.email_confirmed_at || profile.email_verified))
  const [addressVerified, setAddressVerified] = useState(Boolean(profile.address_verified || profile.address_verified_at || profile.address_verification_status === "completed"))
  const [addressVerificationStatus, setAddressVerificationStatus] = useState<string | null>(profile.address_verification_status || null)
  const [addressVerificationReferenceId, setAddressVerificationReferenceId] = useState<string | null>(profile.address_verification_reference_id || null)
  const [isVerifyingAddress, setIsVerifyingAddress] = useState(false)
  const [addressVerificationError, setAddressVerificationError] = useState<string | null>(null)
  // Add state for beneficiaries (bank accounts)
  const [accounts, setAccounts] = useState<any[]>([])
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false)
  const [accountBank, setAccountBank] = useState("")
  const [accountBanks, setAccountBanks] = useState<{ name: string; code: string }[]>([])
  const [isLoadingAccountBanks, setIsLoadingAccountBanks] = useState(false)
  const [isAddingAccount, setIsAddingAccount] = useState(false)
  const [addAccountError, setAddAccountError] = useState("")
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false)
  const [accountsError, setAccountsError] = useState("")
  const [removingAccountId, setRemovingAccountId] = useState<string | null>(null)
  const [removeAccountError, setRemoveAccountError] = useState("")
  // Wallets state
  const [wallets, setWallets] = useState<any[]>([])
  const [isLoadingWallets, setIsLoadingWallets] = useState(false)
  const [walletsError, setWalletsError] = useState<string | null>(null)
  // Add state for all address fields
  const [buildingNumber, setBuildingNumber] = useState(profile.buildingNumber || "");
  const [apartment, setApartment] = useState(profile.apartment || "");
  const [street, setStreet] = useState(profile.street || "");
  const [city, setCity] = useState(profile.city || "");
  const [town, setTown] = useState(profile.town || "");
  const [stateValue, setStateValue] = useState(profile.state || "");
  const [lga, setLga] = useState(profile.lga || "");
  const [lcda, setLcda] = useState(profile.lcda || "");
  const [landmark, setLandmark] = useState(profile.landmark || "");
  const [additionalInformation, setAdditionalInformation] = useState(profile.additionalInformation || "");
  const [fullAddress, setFullAddress] = useState(profile.fullAddress || "");
  const [postalCode, setPostalCode] = useState(profile.postalCode || "");
  const [walletCreated, setWalletCreated] = useState(false);
  const [trackingId, setTrackingId] = useState<string | null>(null);
  const [walletPhoneNumber, setWalletPhoneNumber] = useState<string | null>(null);
  const [showOtpDialog, setShowOtpDialog] = useState(false);
  const [isVerifyingWalletOtp, setIsVerifyingWalletOtp] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockLoading, setBlockLoading] = useState(false);
  // Add to component state:
  const [correlationId, setCorrelationId] = useState<string | null>(null);
  const [walletApiResponse, setWalletApiResponse] = useState<any>(null);
  const [isCreatingWallet, setIsCreatingWallet] = useState(false);
  // (1) Add new state hooks inside your main component (below other hooks):
  const [isOtpModalOpen, setOtpModalOpen] = useState(false);
  const [otpInput, setOtpInput] = useState("");
  const [otpErrorMsg, setOtpErrorMsg] = useState("");

  const searchParams = useSearchParams();
  const correlationIdFromUrl = searchParams.get("c_id") || searchParams.get("correlationID");
  const success = searchParams.get("success");
  const id = searchParams.get("id");
  const idType = searchParams.get("id_type");

  const handleVerifyPhoneOtp = async () => {
    setIsVerifyingOtp(true);
    setOtpError("");
    try {
      if (!phoneOtpReferenceId) {
        throw new Error("Please request a new OTP first.");
      }

      const res = await fetch("/api/dojah/validate-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: otp, referenceId: phoneOtpReferenceId }),
      });
      const data = await res.json();
      if (res.ok && data?.entity?.valid === true) {
        await updateProfile({ phoneVerified: true, phoneVerifiedAt: new Date().toISOString() }, profile.id);
        setPhoneVerified(true);
        setShowPhoneVerify(false);
        setPhoneOtpReferenceId(null);
        setOtp("");
        // Optionally, trigger a profile refetch or reload
        window.location.reload();
      } else {
        setOtpError(data?.message || data?.error || "Invalid OTP");
      }
    } catch (err) {
      setOtpError("Verification failed. Please try again.");
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleSendPhoneOtp = async () => {
    if (!profile.phone_number) {
      toast({ title: "Missing phone number", description: "Add a phone number before requesting a verification code.", variant: "destructive" });
      return;
    }

    setIsSendingPhoneOtp(true);
    setOtpError("");
    try {
      const res = await fetch("/api/dojah/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: profile.phone_number }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data?.success) {
        throw new Error(data?.error || data?.message || "Failed to send OTP");
      }

      setPhoneOtpReferenceId(data.referenceId || null);
      setShowPhoneVerify(true);
      toast({
        title: "OTP sent",
        description: `A verification code was sent to ${profile.phone_number}`,
      });
    } catch (error: any) {
      toast({
        title: "Unable to send OTP",
        description: error?.message || "Failed to request a Dojah OTP",
        variant: "destructive",
      });
    } finally {
      setIsSendingPhoneOtp(false);
    }
  };

  const handleSendEmailOtp = async () => {
    if (!profile.email) {
      toast({
        title: "Missing email",
        description: "Add an email before requesting a verification code.",
        variant: "destructive",
      });
      return;
    }

    setIsSendingEmailOtp(true)
    setEmailOtpError("")

    try {
      const response = await fetch("/api/auth/send-confirmation-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: profile.email,
          firstName: profile.first_name || "",
        }),
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok || !data?.success) {
        throw new Error(data?.error || data?.message || "Failed to send email verification code")
      }

      setShowEmailVerify(true)
      toast({
        title: "Code sent",
        description: `A verification code was sent to ${profile.email}.`,
      })
    } catch (error: any) {
      toast({
        title: "Unable to send code",
        description: error?.message || "Failed to request email verification code",
        variant: "destructive",
      })
    } finally {
      setIsSendingEmailOtp(false)
    }
  }

  const handleVerifyEmailOtp = async () => {
    setIsVerifyingEmailOtp(true)
    setEmailOtpError("")

    try {
      const response = await fetch("/api/auth/verify-confirmation-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: profile.email, code: emailOtp }),
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok || !data?.success) {
        throw new Error(data?.error || data?.message || "Invalid verification code")
      }

      setEmailVerified(true)
      setShowEmailVerify(false)
      setEmailOtp("")
      toast({ title: "Email verified", description: "Your email has been verified successfully." })
    } catch (error: any) {
      setEmailOtpError(error?.message || "Verification failed")
    } finally {
      setIsVerifyingEmailOtp(false)
    }
  }

  useEffect(() => {
    return undefined;
  }, []);

  const sections = [
    { id: "overview", name: "Overview", icon: Info },
    { id: "loan-helper", name: "Lending goals", icon: Briefcase },
    { id: "bank", name: "Linked Account", icon: Briefcase },
    { id: "contact", name: "Contact and basic info", icon: Phone },
    { id: "work", name: "Work and education", icon: Briefcase },
    { id: "places", name: "Places lived", icon: MapPin },
    { id: "details", name: "Details about you", icon: User },
    { id: "wallets", name: "Wallets", icon: Wallet },
  ]

  useEffect(() => {
    setPhoneVerified(profile.phone_verified ?? false)
    setEmailVerified(Boolean(profile.email_confirmed_at || profile.email_verified))
    setSocialMediaData({
      facebook_url: profile.facebook_url || "",
      linkedin_url: profile.linkedin_url || "",
      twitter_url: profile.twitter_url || "",
      website: profile.website || "",
    })
    setBioText(profile.bio || "")
    setLocationAddress(profile.address || "")
    setLocationCity(profile.city || "")
    setLocationState(profile.state || "")
    setLocationStreet(profile.street || profile.address || "")
    setLocationLga(profile.lga || profile.city || "")
    setLocationLandmark(profile.landmark || "")
    setWorkOverviewJobTitle(profile.job_title || "")
    setWorkOverviewEmployerName(profile.employer_name || "")
    setWorkOverviewEmployerAddress(profile.employer_address || "")
    setWorkOverviewEmploymentStatus(profile.employment_status || "")
    setPhoneText(profile.phone_number || "")
    setEmailText(profile.email || "")
    setRelationshipStatusText(profile.relationship_status || "")
    setSchoolName(profile.school_name || "")
    setDegree(profile.degree || "")
    setFieldOfStudy(profile.field_of_study || "")
    setGraduationYear(profile.graduation_year || "")
    setMonthlyIncomeValue(
      profile.monthly_income !== undefined && profile.monthly_income !== null ? String(profile.monthly_income) : ""
    )
    setBankName(profile.bank_name || "")
    setAccountNumber(profile.account_number || "")
    setAccountName(profile.account_name || "")
    setBvnVerified(profile.bvn_verified ?? null)
    setNinText(profile.id_number || profile.idNumber || "")
    setLoanHelperLoaded(false);
    // Add state for all address fields
    setBuildingNumber(profile.buildingNumber || "");
    setApartment(profile.apartment || "");
    setStreet(profile.street || "");
    setCity(profile.city || "");
    setTown(profile.town || "");
    setStateValue(profile.state || "");
    setLga(profile.lga || "");
    setLcda(profile.lcda || "");
    setLandmark(profile.landmark || "");
    setAdditionalInformation(profile.additionalInformation || "");
    setCountry(profile.country || "Nigeria");
    setFullAddress(profile.fullAddress || "");
    setPostalCode(profile.postalCode || "");
    setResolvedSrUserId(profile.sr_user_id || null);
    setAddressVerified(Boolean(profile.address_verified || profile.address_verified_at || profile.address_verification_status === "completed"))
    setAddressVerificationStatus(profile.address_verification_status || null)
    setAddressVerificationReferenceId(profile.address_verification_reference_id || null)
  }, [profile])

  useEffect(() => {
    try {
      const storedRequestId = window.sessionStorage.getItem("stablesrail_bvn_request_id");
      if (storedRequestId) {
        setBvnOnboardRequestId(storedRequestId);
      }
    } catch (error) {
      // Session storage is optional.
    }
  }, []);

  // Fetch loan helper settings when section is active and not loaded
  useEffect(() => {
    const fetchLoanHelper = async () => {
      if (activeSection === "loan-helper" && !loanHelperLoaded && profile.id) {
        // First get the account balance
        const { data: balanceData } = await getAccountBalance(profile.id);
        
        if (balanceData?.balance === 0) {
          // Only update settings if balance is 0
          const { success, error } = await updateLoanHelperSettings(
            profile.id,
            0, // loan amounT
            0, // interest ratE
            0, // repayment timE
            "months", // repayment unit
            "", // terms and conditions
          );

          if (success) {
            // Turn off the loan helper
            await fetch(`/api/loan-helper-status?userId=${profile.id}`, { method: "DELETE" });
            
            // Update local state
            setLoanAmount("0");
            setInterestRate("0");
            setPaybackPeriod("0");
            setLoanTerms("");
          }
        } else {
          // If balance is not 0, just fetch the current settings
        const { data, error } = await getLoanHelperSettings(profile.id);
        if (data) {
          setLoanAmount(data.loan_amount?.toString() || "");
          setInterestRate(data.interest_rate?.toString() || "");
          setPaybackPeriod(data.repayment_time?.toString() || "");
          setLoanTerms(data.terms_and_conditions || "");
        }
        }

        setLoanHelperLoaded(true);
      }
    };
    fetchLoanHelper();
  }, [activeSection, loanHelperLoaded, profile.id]);

  // Virtual account removed

  // Paystack countries fetch removed

  // Paystack banks fetch removed

  useEffect(() => {
    // If initialSection is 'about', default to 'overview'
    if (initialSection === 'about') {
      setActiveSection('overview');
    } else if (initialSection) {
      setActiveSection(initialSection);
    }
  }, [initialSection]);

  // Paystack polling removed

  const handleSocialMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSocialMediaData({
      ...socialMediaData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSaveContact = async () => {
    setIsSavingContact(true)
    console.log("Saving social media data:", socialMediaData)

    // Call the server action to update social media links
    const result = await updateSocialMedia(profile.id, socialMediaData)

    if (result.success) {
      console.log("Social media updated successfully")
      setIsEditingContact(false)
      // Optionally, refresh profile data or update state directly
      // Since the profile prop is likely fetched from the server, revalidating the path
      // on the server action side is handled, which should cause a re-render with updated data.
    } else {
      console.error("Failed to update social media:", result.error)
      // Display an error message to the user (you might need state for this)
      // setContactError(result.error)
    }

    setIsSavingContact(false)
  }

  const handleCancelEditContact = () => {
    setSocialMediaData({
      facebook_url: profile.facebook_url || "",
      linkedin_url: profile.linkedin_url || "",
      twitter_url: profile.twitter_url || "",
      website: profile.website || "",
    })
    setIsEditingContact(false)
  }

  const handleSaveBio = async () => {
    // Assuming profile.id is available and is the user ID
    const userId = profile.id;
    if (!userId) {
      console.error("User ID not available for saving bio.");
      // TODO: Show an error message to the user
      return;
    }

    // Call the server action to update the bio
    const result = await updateBio(userId, bioText);

    if (result.success) {
      console.log("Bio updated successfully!");
      setIsEditingBio(false);
      // Revalidation of path should handle UI update
    } else {
      console.error("Failed to update bio:", result.error);
      // TODO: Show an error message to the user
    }
  }

  const handleCancelEditBio = () => {
    setBioText(profile.bio || ""); // Revert to original bio
    setIsEditingBio(false);
  }

  const handleSaveLocation = async () => {
    const userId = profile.id;
    if (!userId) {
      console.error("User ID not available for saving location.");
      return;
    }

    // Call the server action to update location fields
    const result = await updateProfile({
      firstName: profile.first_name || "",
      lastName: profile.last_name || "",
      phoneNumber: profile.phone_number || "",
      address: locationAddress,
      city: locationCity,
      state: locationState,
      street: locationStreet || locationAddress,
      lga: locationLga || locationCity,
      landmark: locationLandmark,
      zipCode: profile.zip_code,
      profilePictureUrl: profile.profile_picture_url,
      bvn: profile.bvn,
      dateOfBirth: profile.date_of_birth,
      idType: profile.id_type,
      idNumber: profile.id_number,
      idDocumentUrl: profile.id_document_url,
      employmentStatus: profile.employment_status,
      employerName: profile.employer_name,
      employerAddress: profile.employer_address,
      workPhone: profile.work_phone,
      jobTitle: profile.job_title,
      monthlyIncome: profile.monthly_income,
      employmentStartDate: profile.employment_start_date,
      employmentEndDate: profile.employment_end_date,
      bankName: profile.bank_name,
      accountNumber: profile.account_number,
      accountName: profile.account_name,
      addressVerified: false,
      addressVerifiedAt: null,
      addressVerificationStatus: null,
      addressVerificationReferenceId: null,
    });

    if (result.success) {
      console.log("Location updated successfully!");
      setIsEditingLocation(false);
      setAddressVerified(false)
      setAddressVerificationStatus(null)
      setAddressVerificationReferenceId(null)
      // Revalidation should handle UI update
    } else {
      console.error("Failed to update location:", result.error);
      // TODO: Show error message
    }
  };

  const handleCancelEditLocation = () => {
    // Revert location fields to original values if you add state for them later
    setIsEditingLocation(false);
    setLocationAddress(profile.address || "");
    setLocationCity(profile.city || "");
    setLocationState(profile.state || "");
    setLocationStreet(profile.street || profile.address || "");
    setLocationLga(profile.lga || profile.city || "");
    setLocationLandmark(profile.landmark || "");
  };

  const handleVerifyAddress = async () => {
    setIsVerifyingAddress(true)
    setAddressVerificationError(null)

    try {
      const response = await fetch("/api/dojah/address-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok || !data?.success) {
        throw new Error(data?.error || data?.message || "Failed to verify address")
      }

      const nextStatus = String(data?.status || (data?.verified ? "completed" : "pending"))
      const nextVerified = Boolean(data?.verified || nextStatus === "completed")

      setAddressVerificationStatus(nextStatus)
      setAddressVerificationReferenceId(data?.referenceId || null)
      setAddressVerified(nextVerified)

      if (nextVerified) {
        toast({ title: "Address verified", description: "Your address has been verified successfully." })
      } else {
        toast({ title: "Verification submitted", description: "Address verification is in progress." })
      }
    } catch (error: any) {
      const message = error?.message || "Address verification failed"
      setAddressVerificationError(message)
      toast({ title: "Unable to verify address", description: message, variant: "destructive" })
    } finally {
      setIsVerifyingAddress(false)
    }
  };

  const handleSaveWorkOverview = async () => {
    const userId = profile.id;
    if (!userId) {
      console.error("User ID not available for saving work details.");
      return;
    }

    const result = await updateProfile({
      firstName: profile.first_name,
      lastName: profile.last_name,
      phoneNumber: profile.phone_number,
      address: profile.address,
      city: profile.city,
      state: profile.state,
      zipCode: profile.zip_code,
      profilePictureUrl: profile.profile_picture_url,
      bvn: profile.bvn,
      dateOfBirth: profile.date_of_birth,
      idType: profile.id_type,
      idNumber: profile.id_number,
      idDocumentUrl: profile.id_document_url,
      bankName: profile.bank_name,
      accountNumber: profile.account_number,
      accountName: profile.account_name,
      // Pass updated work data
      employmentStatus: workOverviewEmploymentStatus,
      employerName: workOverviewEmployerName,
      employerAddress: workOverviewEmployerAddress,
      jobTitle: workOverviewJobTitle,
      // Include other required employment fields if they exist in updateProfile signature
      workPhone: profile.work_phone,
      monthlyIncome: profile.monthly_income,
      employmentStartDate: profile.employment_start_date,
      employmentEndDate: profile.employment_end_date,
    });

    if (result.success) {
      console.log("Work details updated successfully!");
      setIsEditingWorkOverview(false);
      // Revalidation should handle UI update
    } else {
      console.error("Failed to update work details:", result.error);
      // TODO: Show error message
    }
  };

  const handleCancelEditWorkOverview = () => {
    setWorkOverviewJobTitle(profile.job_title || "");
    setWorkOverviewEmployerName(profile.employer_name || "");
    setWorkOverviewEmployerAddress(profile.employer_address || "");
    setWorkOverviewEmploymentStatus(profile.employment_status || "");
    setIsEditingWorkOverview(false);
  };

  const handleSavePhone = async () => {
    const userId = profile.id;
    if (!userId) {
      console.error("User ID not available for saving phone.");
      return;
    }
    const result = await updateProfile({
      firstName: profile.first_name || "",
      lastName: profile.last_name || "",
      phoneNumber: phoneText,
      address: profile.address || "",
      city: profile.city || "",
      state: profile.state || "",
      zipCode: profile.zip_code,
      profilePictureUrl: profile.profile_picture_url,
      bvn: profile.bvn,
      dateOfBirth: profile.date_of_birth,
      idType: profile.id_type,
      idNumber: profile.id_number,
      idDocumentUrl: profile.id_document_url,
      employmentStatus: profile.employment_status,
      employerName: profile.employer_name,
      employerAddress: profile.employer_address,
      workPhone: profile.work_phone,
      jobTitle: profile.job_title,
      monthlyIncome: profile.monthly_income,
      employmentStartDate: profile.employment_start_date,
      employmentEndDate: profile.employment_end_date,
      bankName: profile.bank_name,
      accountNumber: profile.account_number,
      accountName: profile.account_name,
      addressVerified: false,
      addressVerifiedAt: null,
      addressVerificationStatus: null,
      addressVerificationReferenceId: null,
    });

    if (result.success) {
      console.log("Phone number updated successfully!");
      setIsEditingPhone(false);
      setPhoneVerified(false);
      setAddressVerified(false)
      setAddressVerificationStatus(null)
      setAddressVerificationReferenceId(null)
    } else {
      console.error("Failed to update phone number:", result.error);
      // TODO: Show error message
    }
  };

  const handleCancelEditPhone = () => {
    setPhoneText(profile.phone_number || "");
    setIsEditingPhone(false);
  };

  const handleSaveEmail = async () => {
    const userId = profile.id;
    if (!userId) {
      console.error("User ID not available for saving email.");
      return;
    }

    // Email cannot be updated via updateProfile. It likely requires a separate auth/email update function.
    console.warn("Email update is not yet implemented via inline editing due to backend limitations.");
    // TODO: Implement actual update logic for email if possible (may require a new server action or using auth functions)

    // For now, just exit editing mode.
    setIsEditingEmail(false); // Exit editing mode even if not saved
  };

  const handleCancelEditEmail = () => {
    setEmailText(profile.email || "");
    setIsEditingEmail(false);
  };

  const handleSaveRelationship = async () => {
    console.warn("Relationship status update is not yet implemented via inline editing due to backend limitations.");
    setIsEditingRelationship(false);
  };

  const handleCancelEditRelationship = () => {
    setRelationshipStatusText(profile.relationship_status || "");
    setIsEditingRelationship(false);
  };

  const handleSaveEducation = async () => {
    const userId = profile.id;
    if (!userId) {
      console.error("User ID not available for saving education.");
      return;
    }

    // TODO: Backend update needed - updateProfile or a new action must accept education fields
    // For now, this will not actually save to the backend.
    console.warn("Education update is not yet implemented via inline editing due to backend limitations.");

    // Assuming updateProfile will be modified to accept these fields:
     const result = await updateProfile({
       ...profile, // Include existing profile data
       schoolName: schoolName,
       degree: degree,
       fieldOfStudy: fieldOfStudy,
       graduationYear: parseInt(graduationYear, 10) || null, // Convert to number
     });

     if (result.success) {
       console.log("Education updated successfully!");
       setIsEditingEducation(false);
       // Revalidation should handle UI update
     } else {
       console.error("Failed to update education:", result.error);
    //   // TODO: Show error message
     }
  };

  const handleCancelEditEducation = () => {
    setSchoolName(profile.school_name || "");
    setDegree(profile.degree || "");
    setFieldOfStudy(profile.field_of_study || "");
    setGraduationYear(profile.graduation_year || "");
    setIsEditingEducation(false);
  };

  const handleSaveMonthlyIncome = async () => {
    setIsSavingMonthlyIncome(true);
    setMonthlyIncomeError(null);
    try {
      const result = await updateProfile({ monthlyIncome: Number(monthlyIncomeValue) });
      if (result.success) {
        setIsEditingMonthlyIncome(false);
      } else {
        setMonthlyIncomeError(result.error || "Failed to update monthly income");
      }
    } catch (err: any) {
      setMonthlyIncomeError(err?.message || "Failed to update monthly income");
    } finally {
      setIsSavingMonthlyIncome(false);
    }
  };

  const handleCancelMonthlyIncome = () => {
    setMonthlyIncomeValue(
      profile.monthly_income !== undefined && profile.monthly_income !== null ? String(profile.monthly_income) : ""
    );
    setIsEditingMonthlyIncome(false);
    setMonthlyIncomeError(null);
  };

  const handleSaveBank = async () => {
    setIsSavingBank(true);
    setBankError(null);
    try {
      const result = await updateProfile({
        bankName,
        accountNumber,
        accountName,
        bankCode,
        accountType,
      }, profile.id); // Pass the user ID here
      if (result.success) {
        // Update local state or refetch profile
        setBankName(result.data.bank_name || bankName);
        setAccountNumber(result.data.account_number || accountNumber);
        setAccountName(result.data.account_name || accountName);
        setIsEditingBank(false);
        // Optionally, trigger a profile refetch here if needed
      } else {
        setBankError(result.error || "Failed to update bank details.");
      }
    } catch (err) {
      setBankError("An unexpected error occurred.");
    } finally {
      setIsSavingBank(false);
    }
  };

  const handleCancelBank = () => {
    setBankName(profile.bank_name || "");
    setAccountNumber(profile.account_number || "");
    setAccountName(profile.account_name || "");
    setIsEditingBank(false);
    setBankError(null);
  };

  const handleSaveLoanHelper = async () => {
    setIsSavingLoanHelper(true);
    setLoanHelperError(null);
    try {
      const result = await updateLoanHelperSettings(
        profile.id,
        Number(loanAmount),
        Number(interestRate),
        Number(paybackPeriod),
        'months', // Default repayment unit
        loanTerms
      );
      if (result.success) {
        setIsEditingLoanHelper(false);
      } else {
        setLoanHelperError(result.error || "Failed to update loan helper details");
      }
    } catch (err: any) {
      setLoanHelperError(err?.message || "Failed to update loan helper details");
    } finally {
      setIsSavingLoanHelper(false);
    }
  };

  const handleCancelLoanHelper = () => {
    setLoanHelperLoaded(false); // will refetch on next open
    setIsEditingLoanHelper(false);
    setLoanHelperError(null);
  };

  // Add these implementations at the top level of the component (not inside another function)
  async function uploadLendingLicense(file: File): Promise<string> {
    // Call the server action to upload the file
    const result = await uploadLendingLicenseServer(file);
    if (result.error) throw new Error(result.error);
    if (!result.url) throw new Error("No URL returned from server action");
    return result.url;
  }

  async function handleUpdate(fields: any) {
    const result = await updateProfile(fields);
    if (!result.success) {
      throw new Error(result.error || "Failed to update profile");
    }
  }

  // Place DetailsAboutYouSection implementation here so it is defined before use
  const maritalOptions = [
    { value: "single", label: "Single" },
    { value: "married", label: "Married" },
    { value: "divorced", label: "Divorced" },
    { value: "widow", label: "Widow" },
    { value: "widower", label: "Widower" },
  ];

  type DetailsAboutYouProfile = {
    marital_status?: string;
    number_of_dependants?: number | null;
    lending_license_url?: string | null;
    id_document_url?: string | null;
    id_type?: string;
    id_number?: string;
    // Add camelCase keys for updateProfile compatibility
    maritalStatus?: string;
    numberOfDependants?: number | null;
    lendingLicenseUrl?: string | null;
    idDocumentUrl?: string | null;
    idType?: string;
    idNumber?: string;
    idExpirationDate?: string | null; // new
    idDateIssued?: string | null; // new
    id_verified?: boolean | null;
    idVerificationDate?: string | null;
  };

  type DetailsAboutYouProps = {
    profile: DetailsAboutYouProfile;
    onUpdate: (fields: Partial<DetailsAboutYouProfile>) => Promise<void>;
    uploadLendingLicense: (file: File) => Promise<string>;
  };

  function DetailsAboutYouSection({ profile, onUpdate, uploadLendingLicense }: DetailsAboutYouProps) {
    const [maritalStatus, setMaritalStatus] = useState(profile.marital_status || "");
    const [dependants, setDependants] = useState(
      profile.number_of_dependants !== undefined && profile.number_of_dependants !== null
        ? String(profile.number_of_dependants)
        : ""
    );
    const [licenseUrl, setLicenseUrl] = useState(profile.lending_license_url || "");
    const [licenseFile, setLicenseFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [savingMarital, setSavingMarital] = useState(false);
    const [savingLicense, setSavingLicense] = useState(false);
    const [messageMarital, setMessageMarital] = useState<string | null>(null);
    const [messageLicense, setMessageLicense] = useState<string | null>(null);
    const [editMarital, setEditMarital] = useState(false);
    const [editLicense, setEditLicense] = useState(false);
    const [idDocUrl, setIdDocUrl] = useState(profile.id_document_url || "");
    const [idDocFile, setIdDocFile] = useState<File | null>(null);
    const [savingIdDoc, setSavingIdDoc] = useState(false);
    const [editIdDoc, setEditIdDoc] = useState(false);
    const [messageIdDoc, setMessageIdDoc] = useState<string | null>(null);
    const [isVerifyingIdDoc, setIsVerifyingIdDoc] = useState(false);
    const [idVerificationMsg, setIdVerificationMsg] = useState<string | null>(null);
    const [idVerified, setIdVerified] = useState(profile.id_verified ?? false);
    const [idType, setIdType] = useState(profile.idType || profile.id_type || "");
    const [idNumber, setIdNumber] = useState(profile.idNumber || profile.id_number || "");
    const [idExpirationDate, setIdExpirationDate] = useState(profile.idExpirationDate || "");
    const [idDateIssued, setIdDateIssued] = useState(profile.idDateIssued || "");
    const ID_TYPE_OPTIONS = [
      { value: "National ID", label: "National ID" },
      { value: "Driver's License", label: "Driver's License" },
      { value: "Passport", label: "Passport" },
      { value: "Voter's Card", label: "Voter's Card" },
      { value: "Other", label: "Other" },
    ];
    const [idDocFileError, setIdDocFileError] = useState<string | null>(null);
    const MAX_ID_DOC_SIZE_MB = 5;
    const [licenseFileError, setLicenseFileError] = useState<string | null>(null);

    const isDirtyMarital =
      maritalStatus !== (profile.marital_status || "") ||
      (maritalStatus === "married" && dependants !== (profile.number_of_dependants !== undefined && profile.number_of_dependants !== null ? String(profile.number_of_dependants) : ""));
    const isDirtyLicense = editLicense && licenseFile !== null;

    const handleLicenseFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        if (file.size > MAX_ID_DOC_SIZE_MB * 1024 * 1024) {
          setLicenseFileError(`File size exceeds ${MAX_ID_DOC_SIZE_MB}MB. Please upload a smaller file.`);
          setLicenseFile(null);
          setLicenseUrl("");
          return;
        }
        setLicenseFileError(null);
        if (file.type.startsWith('image/')) {
          try {
            const compressedFile = await imageCompression(file, {
              maxSizeMB: 1, // Target max size in MB
              maxWidthOrHeight: 1920, // Optional: resize large images
              useWebWorker: true,
            });
            setLicenseFile(compressedFile);
          } catch (err) {
            setLicenseFileError('Image compression failed. Please try another image.');
            setLicenseFile(null);
            return;
          }
        } else {
          setLicenseFile(file); // For PDFs, no compression
        }
        setLicenseUrl("");
      }
    };

    const handleSaveMarital = async () => {
      setSavingMarital(true);
      setMessageMarital(null);
      try {
        const updateFields: any = {
          maritalStatus: maritalStatus,
        };
        if (maritalStatus === "married") {
          updateFields.numberOfDependants = dependants ? Number(dependants) : null;
        } else {
          updateFields.numberOfDependants = null;
        }
        await onUpdate(updateFields);
        setMessageMarital("Saved!");
        setEditMarital(false);
      } catch (err: any) {
        setMessageMarital(err?.message || "Save failed");
      } finally {
        setSavingMarital(false);
      }
    };
    const handleCancelMarital = () => {
      setMaritalStatus(profile.marital_status || "");
      setDependants(
        profile.number_of_dependants !== undefined && profile.number_of_dependants !== null
          ? String(profile.number_of_dependants)
          : ""
      );
      setEditMarital(false);
      setMessageMarital(null);
    };

    const handleSaveLicense = async () => {
      setSavingLicense(true);
      setMessageLicense(null);
      let url = licenseUrl;
      try {
        if (licenseFile) {
          setUploading(true);
          setMessageLicense("Uploading license...");
          url = await uploadLendingLicense(licenseFile);
          setLicenseUrl(url);
          setUploading(false);
        }
        await onUpdate({ lendingLicenseUrl: url });
        setMessageLicense("Saved!");
        setLicenseFile(null);
        setEditLicense(false);
      } catch (err: any) {
        setMessageLicense(err?.message || "Save failed");
      } finally {
        setSavingLicense(false);
        setUploading(false);
      }
    };
    const handleCancelLicense = () => {
      setLicenseUrl(profile.lending_license_url || "");
      setLicenseFile(null);
      setEditLicense(false);
      setMessageLicense(null);
    };

    const handleIdDocFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        if (file.size > MAX_ID_DOC_SIZE_MB * 1024 * 1024) {
          setIdDocFileError(`File size exceeds ${MAX_ID_DOC_SIZE_MB}MB. Please upload a smaller file.`);
          setIdDocFile(null);
          setIdDocUrl("");
          return;
        }
        setIdDocFileError(null);
        if (file.type.startsWith('image/')) {
          try {
            const compressedFile = await imageCompression(file, {
              maxSizeMB: 1, // Target max size in MB
              maxWidthOrHeight: 1920, // Optional: resize large images
              useWebWorker: true,
            });
            setIdDocFile(compressedFile);
          } catch (err) {
            setIdDocFileError('Image compression failed. Please try another image.');
            setIdDocFile(null);
            return;
          }
        } else {
          setIdDocFile(file); // For PDFs, no compression
        }
        setIdDocUrl("");
      }
    };
    const handleSaveIdDoc = async () => {
      setSavingIdDoc(true);
      setMessageIdDoc(null);
      let url = idDocUrl;
      try {
        if (idDocFile) {
          setMessageIdDoc("Uploading ID document...");
          const result = await uploadIdDocument(idDocFile);
          if (result.error) throw new Error(result.error);
          url = result.url ?? "";
          setIdDocUrl(url);
        }
        await onUpdate({ idDocumentUrl: url, idType, idNumber, idExpirationDate, idDateIssued });
        setMessageIdDoc("Saved!");
        setIdDocFile(null);
        setEditIdDoc(false);
        setIdVerified(false);
        setIdVerificationMsg(null);
      } catch (err: any) {
        setMessageIdDoc(err?.message || "Save failed");
      } finally {
        setSavingIdDoc(false);
      }
    };
    const handleCancelIdDoc = () => {
      setIdDocUrl(profile.id_document_url || "");
      setIdDocFile(null);
      setIdType(profile.idType || profile.id_type || "");
      setIdNumber(profile.idNumber || profile.id_number || "");
      setEditIdDoc(false);
      setMessageIdDoc(null);
    };

    const handleVerifyIdDoc = async () => {
      const documentUrl = (idDocUrl || profile.id_document_url || "").trim();

      if (!documentUrl) {
        setIdVerificationMsg("Upload an ID document first.");
        return;
      }

      setIsVerifyingIdDoc(true);
      setIdVerificationMsg(null);

      try {
        const response = await fetch("/api/dojah/document-analysis", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ documentUrl }),
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok || !data?.success || data?.overallStatus !== 1) {
          setIdVerified(false);
          setIdVerificationMsg(data?.error || data?.message || "ID verification failed.");
          return;
        }

        await onUpdate({ id_verified: true, idVerificationDate: new Date().toISOString() });

        setIdVerified(true);
        setIdVerificationMsg("ID verified successfully.");
      } catch (error: any) {
        setIdVerified(false);
        setIdVerificationMsg(error?.message || "ID verification failed.");
      } finally {
        setIsVerifyingIdDoc(false);
      }
    };

    return (
      <div className="space-y-6 w-full">
        {/* Marital Status */}
        <div>
          <div className="flex items-center justify-between">
            <label className="font-semibold">Marital Status</label>
            {!editMarital && (
              <button
                className="text-blue-600 flex items-center gap-1 text-sm"
                onClick={() => setEditMarital(true)}
                type="button"
              >
                <Edit className="h-4 w-4"/>
              </button>
            )}
          </div>
          {!editMarital ? (
            <div className="mt-1">
              <span className="text-gray-800 capitalize">{profile.marital_status || "Not specified"}</span>
              {profile.marital_status === "married" && (
                <span className="ml-4 text-gray-600">Dependants: {profile.number_of_dependants ?? "-"}</span>
              )}
            </div>
          ) : (
            <div className="space-y-2 mt-2">
              <select
                className="border-b-2 border-blue-600 focus:border-green-600 outline-none px-3 py-2 w-full"
                value={maritalStatus}
                onChange={e => setMaritalStatus(e.target.value)}
                disabled={savingMarital}
              >
                <option value="">Select...</option>
                {maritalOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              {maritalStatus === "married" && (
                <input
                  type="number"
                  placeholder="Number of dependants (optional)"
                  min={0}
                  className="border-b-2 border-blue-600 focus:border-green-600 outline-none px-3 py-2 w-full"
                  value={dependants}
                  onChange={e => setDependants(e.target.value)}
                  disabled={savingMarital}
                />
              )}
              <div className="flex gap-2 mt-2 w-full">
                <Button variant="outline" className="w-1/2" onClick={handleCancelMarital} type="button" disabled={savingMarital}>Cancel</Button>
                <Button
                  className="w-1/2"
                  onClick={handleSaveMarital}
                  disabled={savingMarital || !isDirtyMarital}
                  type="button"
                >
                  {savingMarital ? "Saving..." : "Save"}
                </Button>
              </div>
              {messageMarital && <div className="text-sm text-gray-500 mt-2">{messageMarital}</div>}
            </div>
          )}
        </div>
        {/* Lending License */}
        <div>
          <div className="flex items-center justify-between">
            <label className="font-semibold block mb-2">Lending License</label>
            {!editLicense && (
              <button
                className="text-blue-600 flex items-center gap-1 text-sm"
                onClick={() => setEditLicense(true)}
                type="button"
              >
                <Edit className="h-4 w-4"/>
              </button>
            )}
          </div>
          {!editLicense ? (
            <div>
              {profile.lending_license_url ? (
                <img
                  src={profile.lending_license_url}
                  alt="Lending License"
                  className="w-40 h-40 object-cover mb-2 rounded border"
                />
              ) : (
                <span className="text-gray-800">No license uploaded</span>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {licenseUrl && (
                <img
                  src={licenseUrl}
                  alt="Lending License Preview"
                  className="w-40 h-40 object-cover mb-2 rounded border"
                />
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleLicenseFileChange}
                disabled={uploading || savingLicense}
                className="w-full"
              />
              {licenseFileError && <div className="text-sm text-red-500 mt-1">{licenseFileError}</div>}
              <div className="flex gap-2 mt-2 w-full">
                <Button variant="outline" className="w-1/2" onClick={handleCancelLicense} type="button" disabled={savingLicense}>Cancel</Button>
                <Button
                  className="w-1/2"
                  onClick={handleSaveLicense}
                  disabled={savingLicense || uploading || !isDirtyLicense}
                  type="button"
                >
                  {savingLicense || uploading ? "Saving..." : "Save"}
                </Button>
              </div>
              {messageLicense && <div className="text-sm text-gray-500 mt-2">{messageLicense}</div>}
            </div>
          )}
        </div>
        {/* Valid Means of Identification */}
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 mb-2">
              <label className="font-semibold block">Valid Means of Identification</label>
              {idVerified && <Badge className="bg-green-500 text-white">Verified</Badge>}
              {!idVerified && isCurrentUser && profile.id_document_url && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 px-2 text-xs"
                  onClick={handleVerifyIdDoc}
                  disabled={isVerifyingIdDoc}
                  type="button"
                >
                  {isVerifyingIdDoc ? "Verifying..." : "Verify"}
                </Button>
              )}
            </div>
            {!editIdDoc && (
              <button
                className="text-blue-600 flex items-center gap-1 text-sm"
                onClick={() => setEditIdDoc(true)}
                type="button"
              >
                <Edit className="h-4 w-4"/>
              </button>
            )}
          </div>
          {!editIdDoc ? (
            <div>
              {profile.id_document_url ? (
                <img
                  src={profile.id_document_url}
                  alt="ID Document"
                  className="w-40 h-40 object-cover mb-2 rounded border"
                />
              ) : (
                <span className="text-gray-800">No ID document uploaded</span>
              )}
              {/* Show ID expiration and date issued */}
              <div className="mt-2 text-gray-700 text-sm">
                <div>ID Expiration Date: {profile.idExpirationDate ? new Date(profile.idExpirationDate).toLocaleDateString() : '-'}</div>
                <div>ID Date Issued: {profile.idDateIssued ? new Date(profile.idDateIssued).toLocaleDateString() : '-'}</div>
              </div>
              {idVerificationMsg && <div className="text-sm text-gray-500 mt-2">{idVerificationMsg}</div>}
            </div>
          ) : (
            <div className="space-y-2">
              {idDocUrl && (
                <img
                  src={idDocUrl}
                  alt="ID Document Preview"
                  className="w-40 h-40 object-cover mb-2 rounded border"
                />
              )}
              <select
                className="border-b-2 border-blue-600 focus:border-green-600 outline-none px-3 py-2 w-full"
                value={idType}
                onChange={e => setIdType(e.target.value)}
                disabled={savingIdDoc}
              >
                <option value="">Select ID Type...</option>
                {ID_TYPE_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <input
                type="text"
                className="border-b-2 border-blue-600 focus:border-green-600 outline-none px-3 py-2 w-full"
                placeholder="ID Card Number"
                value={idNumber}
                onChange={e => setIdNumber(e.target.value)}
                disabled={savingIdDoc}
              />
              {/* New fields for expiration and date issued */}
              <input
                type="date"
                className="border-b-2 border-blue-600 focus:border-green-600 outline-none px-3 py-2 w-full"
                placeholder="Expiration Date"
                value={idExpirationDate}
                onChange={e => setIdExpirationDate(e.target.value)}
                disabled={savingIdDoc}
              />
              <input
                type="date"
                className="border-b-2 border-blue-600 focus:border-green-600 outline-none px-3 py-2 w-full"
                placeholder="Date Issued"
                value={idDateIssued}
                onChange={e => setIdDateIssued(e.target.value)}
                disabled={savingIdDoc}
              />
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={handleIdDocFileChange}
                disabled={savingIdDoc}
                className="w-full"
              />
              {idDocFileError && <div className="text-sm text-red-500 mt-1">{idDocFileError}</div>}
              <div className="flex gap-2 mt-2 w-full">
                <Button variant="outline" className="w-1/2" onClick={handleCancelIdDoc} type="button" disabled={savingIdDoc}>Cancel</Button>
                <Button
                  className="w-1/2"
                  onClick={handleSaveIdDoc}
                  disabled={savingIdDoc || (!idDocFile && !idDocUrl) || !idType || !idNumber}
                  type="button"
                >
                  {savingIdDoc ? "Saving..." : "Save"}
                </Button>
              </div>
              {messageIdDoc && <div className="text-sm text-gray-500 mt-2">{messageIdDoc}</div>}
            </div>
          )}
        </div>
      </div>
    );
  }

  const NIGERIAN_STATES = [
    "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT", "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara"
  ];

  const quillModules = {
    toolbar: [
      ['bold', 'italic', 'underline'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['link'],
    ],
  };
  const quillFormats = [
    'bold', 'italic', 'underline', 'list', 'bullet', 'link',
  ];

  async function submitBvnForOnboarding(bvnValue: string) {
    const res = await fetch("/api/stablesrail/onboard-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ bvn: bvnValue }),
    })
    const data = await res.json()

    if (data?.existingUser) {
      setBvnVerified(false)
      setBvnVerificationMsg("This BVN is already linked to an existing account. Please sign in to continue.")
      return { success: false as const }
    }

    if (res.ok && data?.success) {
      setBvnVerified(false)
      if (data?.requestId) {
        setBvnOnboardRequestId(data.requestId)
        try {
          window.sessionStorage.setItem("stablesrail_bvn_request_id", data.requestId)
        } catch (error) {
          // Ignore storage failures.
        }
      }
      setBvnVerificationMsg("BVN verification initiated. We'll notify you once it's completed.")
      return { success: true as const, requestId: data?.requestId || null }
    }

    setBvnVerified(false)
    setBvnVerificationMsg(data?.error || "Verification initiation failed")
    return { success: false as const }
  }

  // Add BVN verification handler (Stablesrail onboard-user)
  async function handleVerifyBvn() {
    setIsVerifyingBvn(true);
    setBvnVerificationMsg(null);
    setBvnError(null);
    try {
      // Persist BVN first
      if (bvnText && bvnText.length === 11 && bvnText !== (profile.bvn || "")) {
        const saved = await updateProfile({ bvn: bvnText })
        if (!saved?.success) {
          setBvnError(saved?.error || "Failed to save BVN before verification")
          return
        }
      }

      await submitBvnForOnboarding(bvnText)
    } catch (err: any) {
      setBvnVerified(false)
      setBvnVerificationMsg("Verification initiation failed. Please try again.")
    } finally {
      setIsVerifyingBvn(false);
    }
  }

  async function handleSaveBvn() {
    setIsSavingBvn(true);
    setBvnError(null);
    try {
      const result = await updateProfile({ bvn: bvnText });
      if (result.success) {
        await submitBvnForOnboarding(bvnText)
        setIsEditingBvn(false);
      } else {
        setBvnError(result.error || "Failed to update BVN");
      }
    } catch (err: any) {
      setBvnError(err?.message || "Failed to update BVN");
    } finally {
      setIsSavingBvn(false);
    }
  }

  function handleCancelBvn() {
    setBvnText(profile.bvn || "");
    setIsEditingBvn(false);
    setBvnError(null);
  }

  async function handleSaveNin() {
    setIsSavingNin(true);
    setNinError(null);
    try {
      const result = await updateProfile({ idNumber: ninText });
      if (result.success) {
        setIsEditingNin(false);
      } else {
        setNinError(result.error || "Failed to update NIN");
      }
    } catch (err: any) {
      setNinError(err?.message || "Failed to update NIN");
    } finally {
      setIsSavingNin(false);
    }
  }

  function handleCancelNin() {
    setNinText(profile.id_number || profile.idNumber || "");
    setIsEditingNin(false);
    setNinError(null);
  }

  // Compute if bank details are dirty
  const isBankDirty = (
    bankName !== (profile.bank_name || "") ||
    accountNumber !== (profile.account_number || "") ||
    accountName !== (profile.account_name || "") ||
    country !== (profile.country || "Nigeria") ||
    bankCode !== (profile.bank_code || "") ||
    accountType !== (profile.account_type || "personal")
  );

  const handleSaveFullName = async () => {
    setIsSavingFullName(true);
    setFullNameError(null);
    try {
      const result = await updateProfile({
        firstName: firstNameText,
        middleName: middleNameText,
        lastName: lastNameText,
        addressVerified: false,
        addressVerifiedAt: null,
        addressVerificationStatus: null,
        addressVerificationReferenceId: null,
      });
      if (result.success) {
        setIsEditingFullName(false);
        setAddressVerified(false)
        setAddressVerificationStatus(null)
        setAddressVerificationReferenceId(null)
      } else {
        setFullNameError(result.error || "Failed to update name");
      }
    } catch (err: any) {
      setFullNameError(err?.message || "Failed to update name");
    } finally {
      setIsSavingFullName(false);
    }
  };

  const handleCancelEditFullName = () => {
    setFirstNameText(profile.first_name || "");
    setMiddleNameText(profile.middle_name || "");
    setLastNameText(profile.last_name || "");
    setIsEditingFullName(false);
    setFullNameError(null);
  };

  // Fetch banks on mount from Stablesrail
  useEffect(() => {
    async function fetchBanks() {
      setIsLoadingAccountBanks(true)
      try {
        const res = await fetch("/api/stablesrail/get-bank-codes", {
          credentials: 'include'
        })
        const data = await res.json()
        console.log('🔵 [Profile] Bank codes response:', JSON.stringify(data, null, 2))
        
        if (data.success && data.data?.banks && Array.isArray(data.data.banks)) {
          // API now normalizes the data structure, so we can use it directly
          const banks = data.data.banks.map((bank: any) => ({ 
            name: bank.name || '', 
            code: bank.code || ''
          })).filter((bank: { name: string; code: string }) => bank.name && bank.code)
          
          // Sort banks alphabetically by name (case-insensitive)
          banks.sort((a: { name: string; code: string }, b: { name: string; code: string }) => 
            a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
          )
          
          console.log('🔵 [Profile] Processed banks:', banks.length, 'banks')
          if (banks.length > 0) {
            setAccountBanks(banks)
          } else {
            console.error('🔴 [Profile] No valid banks found after processing')
          }
        } else {
          console.error('🔴 [Profile] Invalid bank data structure:', data)
        }
      } catch (error) {
        console.error("🔴 [Profile] Failed to fetch banks from Stablesrail:", error)
      } finally {
        setIsLoadingAccountBanks(false)
      }
    }
    fetchBanks()
  }, [])

  // Note: Stablesrail doesn't provide account resolution, so account name must be entered manually
  // The account name field is now editable and users can enter it manually

  // Fetch wallets from DB or Stablesrail
  useEffect(() => {
    if (activeSection !== "wallets") return

    function isBenignWalletOnboardingFailure(message?: string) {
      return !!message && /insufficient wallet balance|identity verification failed/i.test(message)
    }
    
    async function fetchWallets() {
      setIsLoadingWallets(true)
      setWalletsError(null)
      
      try {
        const effectiveSrUserId = resolvedSrUserId || profile.sr_user_id || null

        if (bvnOnboardRequestId && !effectiveSrUserId) {
          const onboardStatusRes = await fetch("/api/stablesrail/onboard-status", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ requestId: bvnOnboardRequestId }),
          })
          const onboardStatusData = await onboardStatusRes.json()
          const onboardUserId = onboardStatusData?.data?.userId || onboardStatusData?.data?.data?.userId

          if (onboardStatusRes.ok && onboardUserId) {
            setResolvedSrUserId(onboardUserId)
            try {
              await updateProfile({ srUserId: onboardUserId })
            } catch (error) {
              console.error("Failed to persist Stablesrail userId:", error)
            }
          } else if (onboardStatusData?.data?.status === "failed") {
            const onboardFailureMessage =
              onboardStatusData?.data?.error?.message ||
              onboardStatusData?.data?.message ||
              "Wallet onboarding failed"

            if (isBenignWalletOnboardingFailure(onboardFailureMessage)) {
              console.warn("[Profile] Ignoring wallet onboarding balance failure:", onboardFailureMessage)
            } else {
              setWalletsError(onboardFailureMessage)
            }
          }
        }

        const srUserIdForWallets = resolvedSrUserId || profile.sr_user_id || null

        // First, try to fetch from database
        const dbRes = await fetch("/api/stablesrail/wallet-address", {
          credentials: 'include'
        })
        
        if (dbRes.ok) {
          const dbData = await dbRes.json()
          if (dbData.success && dbData.walletAddresses) {
            // Convert wallet_address record to display format
            const walletAddresses = []
            if (dbData.walletAddresses.base_address) {
              walletAddresses.push({
                walletAddress: dbData.walletAddresses.base_address,
                chain: "Base",
                status: "active"
              })
            }
            if (dbData.walletAddresses.ethereum_address) {
              walletAddresses.push({
                walletAddress: dbData.walletAddresses.ethereum_address,
                chain: "Ethereum",
                status: "active"
              })
            }
            if (dbData.walletAddresses.polygon_address) {
              walletAddresses.push({
                walletAddress: dbData.walletAddresses.polygon_address,
                chain: "Polygon",
                status: "active"
              })
            }
            if (dbData.walletAddresses.bnb_address) {
              walletAddresses.push({
                walletAddress: dbData.walletAddresses.bnb_address,
                chain: "BNB Chain",
                status: "active"
              })
            }
            
            if (walletAddresses.length > 0) {
              setWallets(walletAddresses)
              return
            }
          }
        }
        
        // If no wallets in DB, check if user has Stablesrail ID
        if (srUserIdForWallets) {
          // Call Stablesrail to get wallets
          const stablesrailRes = await fetch("/api/stablesrail/list-user-wallets", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: srUserIdForWallets }),
            credentials: 'include'
          })
          
          if (stablesrailRes.ok) {
            const stablesrailData = await stablesrailRes.json()
            
            if (stablesrailData.success && stablesrailData.data?.wallets && Array.isArray(stablesrailData.data.wallets) && stablesrailData.data.wallets.length > 0) {
              // Save wallets to database
              const saveRes = await fetch("/api/stablesrail/save-wallets", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ wallets: stablesrailData.data.wallets }),
                credentials: 'include'
              })
              
              if (saveRes.ok) {
                // Convert Stablesrail wallets to display format
                const formattedWallets = stablesrailData.data.wallets.map((w: any) => ({
                  walletAddress: w.walletAddress,
                  status: w.status,
                  createdAt: w.createdAt,
                  chain: "Base" // Default to Base since addresses are 0x format
                }))
                setWallets(formattedWallets)
              } else {
                // Even if save fails, display the wallets we got from Stablesrail
                const formattedWallets = stablesrailData.data.wallets.map((w: any) => ({
                  walletAddress: w.walletAddress,
                  status: w.status,
                  createdAt: w.createdAt,
                  chain: "Base"
                }))
                setWallets(formattedWallets)
              }
            } else {
              setWallets([])
            }
          } else {
            setWallets([])
          }
        } else {
          setWallets([])
        }
      } catch (error) {
        console.error("Error fetching wallets:", error)
        setWalletsError("Failed to fetch wallets")
        setWallets([])
      } finally {
        setIsLoadingWallets(false)
      }
    }
    
    fetchWallets()
  }, [activeSection, bvnOnboardRequestId, profile.sr_user_id, resolvedSrUserId])

  // Fetch accounts (beneficiaries) on mount and when modal closes
  useEffect(() => {
    setIsLoadingAccounts(true)
    setAccountsError("")
    fetch("/api/beneficiaries", { credentials: "include" })
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to fetch accounts")
        const data = await res.json()
        setAccounts(data.beneficiaries || [])
      })
      .catch((err) => {
        setAccountsError(err.message || "Failed to fetch accounts")
      })
      .finally(() => setIsLoadingAccounts(false))
  }, [isAccountModalOpen])

  const handleAddAccount = async () => {
    setIsAddingAccount(true)
    setAddAccountError("")
    try {
      // Get bank code from selected bank
      const bankCode = accountBanks.find(b => b.name === accountBank)?.code
      
      if (!bankCode) {
        throw new Error("Please select a valid bank")
      }

      // Validate required fields
      if (!accountName || !accountNumber || !accountBank) {
        throw new Error("Please fill in all required fields")
      }

      // Save account directly to DB (no Paystack call needed)
      const saveRes = await fetch("/api/beneficiaries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          account_name: accountName,
          account_number: accountNumber,
          bank_name: accountBank,
          bank_code: bankCode,
        }),
        credentials: "include",
      })
      
      if (!saveRes.ok) {
        const errData = await saveRes.json()
        throw new Error(errData.error || "Failed to save account")
      }
      
      setIsAccountModalOpen(false)
      setAccountNumber("")
      setAccountBank("")
      setAccountName("")
      
      // Refresh accounts list
      setIsLoadingAccounts(true)
      fetch("/api/beneficiaries", { credentials: "include" })
        .then(async (res) => {
          if (!res.ok) throw new Error("Failed to fetch accounts")
          const data = await res.json()
          setAccounts(data.beneficiaries || [])
        })
        .catch((err) => {
          setAccountsError(err.message || "Failed to fetch accounts")
        })
        .finally(() => setIsLoadingAccounts(false))
    } catch (err: any) {
      setAddAccountError(err.message || "Failed to add account")
    } finally {
      setIsAddingAccount(false)
    }
  }

  const handleRemoveAccount = async (id: string) => {
    setRemovingAccountId(id)
    setRemoveAccountError("")
    try {
      const res = await fetch("/api/beneficiaries", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
        credentials: "include",
      })
      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || "Failed to remove account")
      }
      // Refresh accounts list
      setIsLoadingAccounts(true)
      fetch("/api/beneficiaries", { credentials: "include" })
        .then(async (res) => {
          if (!res.ok) throw new Error("Failed to fetch accounts")
          const data = await res.json()
          setAccounts(data.beneficiaries || [])
        })
        .catch((err) => {
          setAccountsError(err.message || "Failed to fetch accounts")
        })
        .finally(() => setIsLoadingAccounts(false))
    } catch (err: any) {
      setRemoveAccountError(err.message || "Failed to remove account")
    } finally {
      setRemovingAccountId(null)
    }
  }

  // Add LendingLicenceSection component
  function LendingLicenceSection({ profile, onUpdate, uploadLendingLicense }: { profile: any, onUpdate: (fields: any) => Promise<void>, uploadLendingLicense: (file: File) => Promise<string> }) {
    const [licenseUrl, setLicenseUrl] = useState(profile.lending_license_url || "");
    const [licenseFile, setLicenseFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [savingLicense, setSavingLicense] = useState(false);
    const [messageLicense, setMessageLicense] = useState<string | null>(null);
    const [editLicense, setEditLicense] = useState(false);
    const [licenseFileError, setLicenseFileError] = useState<string | null>(null);
    const MAX_ID_DOC_SIZE_MB = 5;
    const isDirtyLicense = editLicense && licenseFile !== null;

    const handleLicenseFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        if (file.size > MAX_ID_DOC_SIZE_MB * 1024 * 1024) {
          setLicenseFileError(`File size exceeds ${MAX_ID_DOC_SIZE_MB}MB. Please upload a smaller file.`);
          setLicenseFile(null);
          setLicenseUrl("");
          return;
        }
        setLicenseFileError(null);
        if (file.type.startsWith('image/')) {
          try {
            const compressedFile = await imageCompression(file, {
              maxSizeMB: 1, // Target max size in MB
              maxWidthOrHeight: 1920, // Optional: resize large images
              useWebWorker: true,
            });
            setLicenseFile(compressedFile);
          } catch (err) {
            setLicenseFileError('Image compression failed. Please try another image.');
            setLicenseFile(null);
            return;
          }
        } else {
          setLicenseFile(file); // For PDFs, no compression
        }
        setLicenseUrl("");
      }
    };

    const handleSaveLicense = async () => {
      setSavingLicense(true);
      setMessageLicense(null);
      let url = licenseUrl;
      try {
        if (licenseFile) {
          setUploading(true);
          setMessageLicense("Uploading license...");
          url = await uploadLendingLicense(licenseFile);
          setLicenseUrl(url);
          setUploading(false);
        }
        await onUpdate({ lendingLicenseUrl: url });
        setMessageLicense("Saved!");
        setLicenseFile(null);
        setEditLicense(false);
      } catch (err: any) {
        setMessageLicense(err?.message || "Save failed");
      } finally {
        setSavingLicense(false);
        setUploading(false);
      }
    };
    const handleCancelLicense = () => {
      setLicenseUrl(profile.lending_license_url || "");
      setLicenseFile(null);
      setEditLicense(false);
      setMessageLicense(null);
    };

    return (
      <div className="space-y-6 w-full">
        <div>
          <div className="flex items-center justify-between">
            <label className="font-semibold block mb-2">Lending License</label>
            {!editLicense && (
              <button
                className="text-blue-600 flex items-center gap-1 text-sm"
                onClick={() => setEditLicense(true)}
                type="button"
              >
                <Edit className="h-4 w-4"/>
              </button>
            )}
          </div>
          {!editLicense ? (
            <div>
              {profile.lending_license_url ? (
                <img
                  src={profile.lending_license_url}
                  alt="Lending License"
                  className="w-40 h-40 object-cover mb-2 rounded border"
                />
              ) : (
                <span className="text-gray-800">No license uploaded</span>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {licenseUrl && (
                <img
                  src={licenseUrl}
                  alt="Lending License Preview"
                  className="w-40 h-40 object-cover mb-2 rounded border"
                />
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleLicenseFileChange}
                disabled={uploading || savingLicense}
                className="w-full"
              />
              {licenseFileError && <div className="text-sm text-red-500 mt-1">{licenseFileError}</div>}
              <div className="flex gap-2 mt-2 w-full">
                <Button variant="outline" className="w-1/2" onClick={handleCancelLicense} type="button" disabled={savingLicense}>Cancel</Button>
                <Button
                  className="w-1/2"
                  onClick={handleSaveLicense}
                  disabled={savingLicense || uploading || !isDirtyLicense}
                  type="button"
                >
                  {savingLicense || uploading ? "Saving..." : "Save"}
                </Button>
              </div>
              {messageLicense && <div className="text-sm text-gray-500 mt-2">{messageLicense}</div>}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Listen for postMessage from iframe
  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      // Optionally check event.origin for security
      if (event.data && event.data.correlationId) {
        setCorrelationId(event.data.correlationId);
        // setShowFaceIframe(false); // Removed: not defined
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // When correlationId is set, save to DB and call wallet API
  useEffect(() => {
    console.log("[Wallet] useEffect triggered", { correlationId, profileId: profile.id });
    async function processCorrelationId() {
      if (correlationId && profile.id) {
        setIsCreatingWallet(true);
        try {
          // Debug log
          console.log("[Wallet] Saving correlationId to DB", { correlationId, profileId: profile.id });
          // Save correlationId to DB (update profile)
          if (typeof correlationId === 'string') {
            const result = await updateProfile({ correlationId }, profile.id);
            console.log("[Wallet] updateProfile result", result);
            if (!result.success) {
              toast({ title: "Error", description: result.error || "Failed to update profile" });
            }
          }
          // Call wallet API
          const res = await fetch("/api/alat/wallet", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              phoneNumber: profile.phone_number,
              email: profile.email,
              bvn: profile.bvn,
              correlationId,
            }),
          });
          const data = await res.json();
          setWalletApiResponse(data);
          if (data.error || data.status === "error") {
            // If error, delete correlationId from DB
            const result = await updateProfile({ correlationId: undefined }, profile.id);
            console.log("[Wallet] Deleted correlationId after error:", result);
            // Optionally, refresh the profile or reload the page
            // window.location.reload();
          }
        } catch (err) {
          setWalletApiResponse({ error: err instanceof Error ? err.message : String(err) });
        } finally {
          setIsCreatingWallet(false);
        }
      }
    }
    processCorrelationId();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [correlationId]);

  useEffect(() => {
    if (success === "true" && correlationId && !walletApiResponse) {
      (async () => {
        setIsCreatingWallet(true);
        try {
          // Debug log
          console.log("[Wallet Redirect] Saving correlationId to DB", { correlationId, profileId: profile.id });
          // Save correlationId to DB (update profile)
          const result = await updateProfile({ correlationId }, profile.id);
          console.log("[Wallet Redirect] updateProfile result", result);
          if (!result.success) {
            toast({ title: "Error", description: result.error || "Failed to update profile" });
          }
          // Call wallet API
          const reqBody: any = {
            phoneNumber: profile.phone_number,
            email: profile.email,
            bvn: profile.bvn,
            correlationId,
          };
          if (idType === "bvn") reqBody.bvn = id;
          if (idType === "nin") reqBody.nin = id;
          const res = await fetch("/api/alat/wallet/create-wallet", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(reqBody),
          });
          const data = await res.json();
          setWalletApiResponse(data);
          if (data.error || data.status === "error") {
            // If error, delete correlationId from DB
            const result = await updateProfile({ correlationId: undefined }, profile.id);
            console.log("[Wallet] Deleted correlationId after error:", result);
            // Optionally, refresh the profile or reload the page
            // window.location.reload();
          }
        } catch (err) {
          setWalletApiResponse({ error: err instanceof Error ? err.message : String(err) });
        } finally {
          setIsCreatingWallet(false);
        }
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [success, correlationId, id, idType]);

  // Set correlationId from URL if present
  useEffect(() => {
    if (correlationIdFromUrl) {
      console.log("[Wallet] Setting correlationId from URL", correlationIdFromUrl);
      setCorrelationId(correlationIdFromUrl);
    }
  }, [correlationIdFromUrl]);

  useEffect(() => {
    if (
      correlationIdFromUrl &&
      profile.id
    ) {
      console.log("[Wallet] Saving correlationId from URL to DB", correlationIdFromUrl);
      setCorrelationId(correlationIdFromUrl);
      updateProfile({ correlationId: correlationIdFromUrl }, profile.id);
    }
  }, [correlationIdFromUrl, profile.id, profile.correlationId]);

  // (2) Add callback for OTP verify
  async function handleVerifyOtp() {
    setIsVerifyingOtp(true);
    setOtpErrorMsg("");
    try {
      const res = await fetch("/api/stablesrail/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ code: otpInput, sessionId: profile.correlation_id || profile.correlationId }),
      });
      const data = await res.json();
      if (res.ok && data?.success) {
        setBvnVerified(true);
        toast({title:"BVN Verified", description:"Your BVN has been successfully verified."});
        setOtpModalOpen(false);
        setOtpInput("");
      } else {
        setOtpErrorMsg(data?.error || "Verification failed. Please try again.");
      }
    } catch (err) {
      setOtpErrorMsg("Verification failed. Please try again.");
    } finally {
      setIsVerifyingOtp(false);
    }
  }

  // Minimal block/unblock handlers to avoid missing identifier compile errors
  async function handleBlock() {
    setBlockLoading(true);
    try {
      // Attempt to persist block status; updateProfile may accept camelCase keys
      const result = await updateProfile({ isBlocked: true } as any, profile.id);
      if (result?.success) {
        setIsBlocked(true);
        toast({ title: "User blocked", description: "This user has been blocked." });
      } else {
        toast({ title: "Error", description: result?.error || "Failed to block user" });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Failed to block user" });
    } finally {
      setBlockLoading(false);
    }
  }

  async function handleUnblock() {
    setBlockLoading(true);
    try {
      const result = await updateProfile({ isBlocked: false } as any, profile.id);
      if (result?.success) {
        setIsBlocked(false);
        toast({ title: "User unblocked", description: "This user has been unblocked." });
      } else {
        toast({ title: "Error", description: result?.error || "Failed to unblock user" });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Failed to unblock user" });
    } finally {
      setBlockLoading(false);
    }
  }

  if (isBlocked && !isCurrentUser) {
    return (
      <div className="text-center text-gray-500 py-12">
        <p>You have blocked this user. Their profile, posts, and requests are hidden.</p>
        <Button onClick={handleUnblock} disabled={blockLoading} className="mt-4">{blockLoading ? "Unblocking..." : "Unblock User"}</Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Left sidebar with sections */}
      <div className="space-y-1">
        <h2 className="text-xl font-bold mb-4">About</h2>
        {sections.map((section) => (
          <button
            key={section.id}
            className={`w-full text-left px-3 py-2 rounded-md flex items-center ${
              activeSection === section.id ? "bg-blue-100 text-blue-600" : "hover:bg-gray-100 text-gray-700"
            }`}
            onClick={() => setActiveSection(section.id)}
          >
            <section.icon className="h-5 w-5 mr-3" />
            {section.name}
          </button>
        ))}
      </div>
      {/* Right content area */}
      <div className="md:col-span-2">
        {activeSection === "overview" && (
          <div className="space-y-6">
            {/* Dojah Widget is rendered into a persistent portal outside the route tree */}
            {/* Referral Code Display */}
            {profile.referral_code && (
              <div className="flex items-center gap-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div>
                  <span className="text-lg font-mono font-bold text-blue-900">{profile.referral_code}</span>
                </div>
                <button
                  type="button"
                  className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                  onClick={() => navigator.clipboard.writeText(profile.referral_code)}
                  title="Copy referral code"
                >
                  Copy
                </button>
              </div>
            )}

            {/* Work */}
            <div className="flex items-start gap-4">
              <div className="mt-1">
                <Briefcase className="h-10 w-10 p-2 bg-gray-100 text-gray-500 rounded-full" />
              </div>
              <div className="flex-grow">
                <div className="flex justify-between items-start">
                   {isEditingWorkOverview ? (
                     <div className="space-y-2 w-full">
                       <input
                         type="text"
                         value={workOverviewJobTitle}
                         onChange={(e) => setWorkOverviewJobTitle(e.target.value)}
                         placeholder="Job Title"
                         className="border-b-3 border-solid !important border-b-blue-600 !important focus-visible:border-b-green-600 !important rounded-none px-3 py-2 w-full"
                       />
                       <input
                         type="text"
                         value={workOverviewEmployerName}
                         onChange={(e) => setWorkOverviewEmployerName(e.target.value)}
                         placeholder="Employer Name"
                         className="border-b-3 border-solid !important border-b-blue-600 !important focus-visible:border-b-green-600 !important rounded-none px-3 py-2 w-full"
                       />
                        <input
                         type="text"
                         value={workOverviewEmployerAddress}
                         onChange={(e) => setWorkOverviewEmployerAddress(e.target.value)}
                         placeholder="Employer Address"
                         className="border-b-3 border-solid !important border-b-blue-600 !important focus-visible:border-b-green-600 !important rounded-none px-3 py-2 w-full"
                       />
                        <select
                         value={workOverviewEmploymentStatus}
                         onChange={(e) => setWorkOverviewEmploymentStatus(e.target.value)}
                         className="border-b-3 border-solid !important border-b-blue-600 !important focus-visible:border-b-green-600 !important rounded-none px-3 py-2 w-full"
                        >
                         <option value="">Select Employment Status</option>
                         <option value="Employed">Employed</option>
                         <option value="Self-Employed">Self-Employed</option>
                         <option value="Unemployed">Unemployed</option>
                         <option value="Student">Student</option>
                       </select>
                       <div className="flex justify-end gap-2 mt-2">
                         <Button variant="outline" onClick={handleCancelEditWorkOverview}>Cancel</Button>
                         <Button onClick={handleSaveWorkOverview} disabled={workOverviewJobTitle === (profile.job_title || "") && workOverviewEmployerName === (profile.employer_name || "") && workOverviewEmployerAddress === (profile.employer_address || "") && workOverviewEmploymentStatus === (profile.employment_status || "")}>Save</Button>
                       </div>
                     </div>
                   ) : (
                  <div>
                    <h3 className="text-lg font-medium">
                      {profile.job_title && profile.employer_name
                        ? `${profile.job_title} at ${profile.employer_name}`
                        : profile.job_title
                          ? profile.job_title
                          : profile.employer_name
                            ? `Works at ${profile.employer_name}`
                            : "Work"}
                    </h3>
                    {profile.employer_address && <p className="text-gray-600">{profile.employer_address}</p>}
                    {profile.employment_status && <p className="text-gray-600">{profile.employment_status}</p>}
                  </div>
                   )}
                  {isCurrentUser && (
                     <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setIsEditingWorkOverview(true)}>
                        <Edit className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="flex items-start gap-4">
              <div className="mt-1">
                <MapPin className="h-10 w-10 p-2 bg-gray-100 text-gray-500 rounded-full" />
              </div>
              <div className="flex-grow">
                <div className="flex justify-between items-start">
                   {isEditingLocation ? (
                     <div className="space-y-2 w-full">
                       <input
                         type="text"
                         value={locationAddress}
                         onChange={(e) => setLocationAddress(e.target.value)}
                         placeholder="Address"
                         className="border-b-3 border-solid !important border-b-blue-600 !important focus-visible:border-b-green-600 !important rounded-none px-3 py-2 w-full"
                       />
                       <input
                         type="text"
                         value={locationStreet}
                         onChange={(e) => setLocationStreet(e.target.value)}
                         placeholder="Street"
                         className="border-b-3 border-solid !important border-b-blue-600 !important focus-visible:border-b-green-600 !important rounded-none px-3 py-2 w-full"
                       />
                       <input
                         type="text"
                         value={locationLga}
                         onChange={(e) => setLocationLga(e.target.value)}
                         placeholder="LGA"
                         className="border-b-3 border-solid !important border-b-blue-600 !important focus-visible:border-b-green-600 !important rounded-none px-3 py-2 w-full"
                       />
                       <input
                         type="text"
                         value={locationCity}
                         onChange={(e) => setLocationCity(e.target.value)}
                         placeholder="City"
                         className="border-b-3 border-solid !important border-b-blue-600 !important focus-visible:border-b-green-600 !important rounded-none px-3 py-2 w-full"
                       />
                       <select
                         value={(locationState ?? '') + ''}
                         onChange={(e) => setLocationState(e.target.value)}
                         className="border-b-3 border-solid !important border-b-blue-600 !important focus-visible:border-b-green-600 !important rounded-none px-3 py-2 w-full"
                       >
                         <option value="">Select State</option>
                         {NIGERIAN_STATES.map(state => <option key={state} value={state}>{state}</option>)}
                       </select>
                       <input
                         type="text"
                         value={locationLandmark}
                         onChange={(e) => setLocationLandmark(e.target.value)}
                         placeholder="Landmark (optional)"
                         className="border-b-3 border-solid !important border-b-blue-600 !important focus-visible:border-b-green-600 !important rounded-none px-3 py-2 w-full"
                       />
                       <div className="flex justify-end gap-2 mt-2">
                         <Button variant="outline" onClick={handleCancelEditLocation}>Cancel</Button>
                         <Button onClick={handleSaveLocation} disabled={locationAddress === (profile.address || "") && locationStreet === (profile.street || profile.address || "") && locationLga === (profile.lga || profile.city || "") && locationCity === (profile.city || "") && locationState === (profile.state || "") && locationLandmark === (profile.landmark || "")}>Save</Button>
                       </div>
                     </div>
                   ) : (
                  <div>
                    <h3 className="text-lg font-medium">
                      Lives in {profile.city || "Not specified"}, {profile.state || "Not specified"}
                    </h3>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-gray-600">{profile.street || profile.address}</p>
                      {addressVerified && <Badge className="bg-green-500 text-white">Verified</Badge>}
                      {!addressVerified && addressVerificationStatus === "pending" && <Badge className="bg-amber-500 text-white">Pending</Badge>}
                      {!addressVerified && addressVerificationStatus !== "pending" && isCurrentUser && (
                        <Button size="sm" variant="outline" onClick={handleVerifyAddress} disabled={isVerifyingAddress}>
                          {isVerifyingAddress ? "Verifying..." : "Verify"}
                        </Button>
                      )}
                    </div>
                    {addressVerificationError && <p className="text-sm text-red-500 mt-1">{addressVerificationError}</p>}
                  </div>
                   )}
                  {isCurrentUser && (
                     <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setIsEditingLocation(true)}>
                        <Edit className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Phone */}
            <div className="flex items-start gap-4">
              <div className="mt-1">
                <Phone className="h-10 w-10 p-2 bg-gray-100 text-gray-500 rounded-full" />
              </div>
              <div className="flex-grow">
                <div className="flex flex-col">
                   {isEditingPhone ? (
                     <div className="space-y-2 w-full">
                       <input
                         type="text"
                         value={phoneText}
                         onChange={(e) => setPhoneText(e.target.value)}
                         placeholder="Phone Number"
                         className="border-b-3 border-solid !important border-b-blue-600 !important focus-visible:border-b-green-600 !important rounded-none px-3 py-2 w-full"
                        disabled={phoneVerified}
                       />
                       <div className="flex justify-end gap-2 mt-2">
                         <Button variant="outline" onClick={handleCancelEditPhone}>Cancel</Button>
                         <Button onClick={handleSavePhone} disabled={phoneText === (profile.phone_number || "")}>Save</Button>
                       </div>
                     </div>
                   ) : (
                    <div className="flex items-center w-full">
                      <h3 className="text-lg font-medium mr-2">{profile.phone_number || "No phone number added"}</h3>
                      {phoneVerified && (
                        <Badge className="bg-green-500 text-white ml-2">Verified</Badge>
                      )}
                      {!phoneVerified && isCurrentUser && profile.phone_number && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="ml-2"
                          onClick={handleSendPhoneOtp}
                          disabled={isSendingPhoneOtp}
                        >
                          {isSendingPhoneOtp ? "Sending..." : "Verify"}
                        </Button>
                      )}
                    </div>
                  )}
                  <p className="text-gray-600 mt-1">Mobile</p>
                  </div>
              </div>
            </div>

            {/* Email */}
            <div className="flex items-start gap-4">
              <div className="mt-1">
                <Mail className="h-10 w-10 p-2 bg-gray-100 text-gray-500 rounded-full" />
              </div>
              <div className="flex-grow">
                <div className="flex justify-between items-start">
                   {isEditingEmail ? (
                     <div className="space-y-2 w-full">
                       <input
                         type="email"
                         value={emailText}
                         onChange={(e) => setEmailText(e.target.value)}
                         placeholder="Email Address"
                         className="border-b-3 border-solid !important border-b-blue-600 !important focus-visible:border-b-green-600 !important rounded-none px-3 py-2 w-full"
                       />
                       <div className="flex justify-end gap-2 mt-2">
                         <Button variant="outline" onClick={handleCancelEditEmail}>Cancel</Button>
                         <Button onClick={handleSaveEmail} disabled={emailText === (profile.email || "")}>Save</Button>
                       </div>
                     </div>
                   ) : (
                     <div className="flex justify-between items-start w-full">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-medium">{profile.email || "No email added"}</h3>
                      {emailVerified && <Badge className="bg-green-500 text-white">Verified</Badge>}
                      {!emailVerified && isCurrentUser && profile.email && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleSendEmailOtp}
                          disabled={isSendingEmailOtp}
                        >
                          {isSendingEmailOtp ? "Sending..." : "Verify"}
                        </Button>
                      )}
                    </div>
                    <p className="text-gray-600">Email</p>
                  </div>
                </div>
                     )}
                  </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === "work" && (
          <div className="space-y-6">
            <h2 className="text-xl font-medium">Work</h2>
            <div className="flex items-start gap-4">
              <div className="mt-1">
                <Briefcase className="h-10 w-10 p-2 bg-gray-100 text-gray-500 rounded-full" />
              </div>
              <div className="flex-grow">
                <div className="flex justify-between items-start">
                   {isEditingWorkOverview ? (
                     <div className="space-y-2 w-full">
                       <input
                         type="text"
                         value={workOverviewJobTitle}
                         onChange={(e) => setWorkOverviewJobTitle(e.target.value)}
                         placeholder="Job Title"
                         className="border-b-3 border-solid !important border-b-blue-600 !important focus-visible:border-b-green-600 !important rounded-none px-3 py-2 w-full"
                       />
                       <input
                         type="text"
                         value={workOverviewEmployerName}
                         onChange={(e) => setWorkOverviewEmployerName(e.target.value)}
                         placeholder="Employer Name"
                         className="border-b-3 border-solid !important border-b-blue-600 !important focus-visible:border-b-green-600 !important rounded-none px-3 py-2 w-full"
                       />
                        <input
                         type="text"
                         value={workOverviewEmployerAddress}
                         onChange={(e) => setWorkOverviewEmployerAddress(e.target.value)}
                         placeholder="Employer Address"
                         className="border-b-3 border-solid !important border-b-blue-600 !important focus-visible:border-b-green-600 !important rounded-none px-3 py-2 w-full"
                       />
                        <select
                         value={workOverviewEmploymentStatus}
                         onChange={(e) => setWorkOverviewEmploymentStatus(e.target.value)}
                         className="border-b-3 border-solid !important border-b-blue-600 !important focus-visible:border-b-green-600 !important rounded-none px-3 py-2 w-full"
                        >
                         <option value="">Select Employment Status</option>
                         <option value="Employed">Employed</option>
                         <option value="Self-Employed">Self-Employed</option>
                         <option value="Unemployed">Unemployed</option>
                         <option value="Student">Student</option>
                       </select>
                       <div className="flex justify-end gap-2 mt-2">
                         <Button variant="outline" onClick={handleCancelEditWorkOverview}>Cancel</Button>
                         <Button onClick={handleSaveWorkOverview} disabled={workOverviewJobTitle === (profile.job_title || "") && workOverviewEmployerName === (profile.employer_name || "") && workOverviewEmployerAddress === (profile.employer_address || "") && workOverviewEmploymentStatus === (profile.employment_status || "")}>Save</Button>
                       </div>
                     </div>
                   ) : (
                  <div>
                    <h3 className="text-lg font-medium">
                      {profile.job_title && profile.employer_name
                        ? `${profile.job_title} at ${profile.employer_name}`
                        : profile.job_title
                          ? profile.job_title
                          : profile.employer_name
                            ? `Works at ${profile.employer_name}`
                               : "Work"}
                    </h3>
                    {profile.employer_address && <p className="text-gray-600">{profile.employer_address}</p>}
                    {profile.employment_status && <p className="text-gray-600">{profile.employment_status}</p>}
                  </div>
                   )}
                  {isCurrentUser && (
                     <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setIsEditingWorkOverview(true)}>
                        <Edit className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <h2 className="text-xl font-medium mt-8">Education</h2>
             <div className="flex items-start gap-4">
               <div className="mt-1">
                 <GraduationCap className="h-10 w-10 p-2 bg-gray-100 text-gray-500 rounded-full" />
               </div>
               <div className="flex-grow">
                 <div className="flex justify-between items-start">
                   {isEditingEducation ? (
                     <div className="space-y-2 w-full">
                       <input
                         type="text"
                         value={schoolName}
                         onChange={(e) => setSchoolName(e.target.value)}
                         placeholder="School Name"
                         className="border-b-3 border-solid !important border-b-blue-600 !important focus-visible:border-b-green-600 !important rounded-none px-3 py-2 w-full"
                       />
                       <input
                         type="text"
                         value={degree}
                         onChange={(e) => setDegree(e.target.value)}
                         placeholder="Degree"
                         className="border-b-3 border-solid !important border-b-blue-600 !important focus-visible:border-b-green-600 !important rounded-none px-3 py-2 w-full"
                       />
                       <input
                         type="text"
                         value={fieldOfStudy}
                         onChange={(e) => setFieldOfStudy(e.target.value)}
                         placeholder="Field of Study"
                         className="border-b-3 border-solid !important border-b-blue-600 !important focus-visible:border-b-green-600 !important rounded-none px-3 py-2 w-full"
                       />
                       <input
                         type="number"
                         value={graduationYear}
                         onChange={(e) => setGraduationYear(e.target.value)}
                         placeholder="Graduation Year"
                         className="border-b-3 border-solid !important border-b-blue-600 !important focus-visible:border-b-green-600 !important rounded-none px-3 py-2 w-full"
                       />
                       <div className="flex justify-end gap-2 mt-2">
                         <Button variant="outline" onClick={handleCancelEditEducation}>Cancel</Button>
                         <Button onClick={handleSaveEducation} disabled={schoolName === (profile.school_name || "") && degree === (profile.degree || "") && fieldOfStudy === (profile.field_of_study || "") && graduationYear === (profile.graduation_year || "")}>Save</Button>
                       </div>
                     </div>
                   ) : (
                     <div>
                       <h3 className="text-lg font-medium">
                         {profile.degree && profile.field_of_study
                           ? `${profile.degree} in ${profile.field_of_study}`
                           : profile.degree
                             ? profile.degree
                             : profile.field_of_study
                               ? profile.field_of_study
                               : "No education information added"}
                       </h3>
                       {profile.school_name && <p className="text-gray-600">{profile.school_name}</p>}
                       {profile.graduation_year && <p className="text-gray-600">Graduated in {profile.graduation_year}</p>}
                     </div>
                   )}
              {isCurrentUser && (
                     <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setIsEditingEducation(true)}>
                       <Edit className="h-4 w-4" />
                </Button>
              )}
                 </div>
               </div>
            </div>

            <h2 className="text-xl font-medium mt-8">Monthly Income</h2>
            <div className="flex items-start gap-4">
              <div className="mt-1">
                <Wallet className="h-10 w-10 p-2 bg-gray-100 text-gray-500 rounded-full" />
              </div>
              <div className="flex-grow">
                <div className="flex justify-between items-start">
                  {isCurrentUser && isEditingMonthlyIncome ? (
                    <div className="space-y-2 w-full">
                      <input
                        type="number"
                        min={0}
                        className="border-b-2 border-blue-600 focus:border-green-600 outline-none px-3 py-2 w-full"
                        value={monthlyIncomeValue}
                        onChange={e => setMonthlyIncomeValue(e.target.value)}
                        disabled={isSavingMonthlyIncome}
                      />
                      <div className="flex gap-2 mt-2 w-full">
                        <Button variant="outline" className="w-1/2" onClick={handleCancelMonthlyIncome} type="button" disabled={isSavingMonthlyIncome}>Cancel</Button>
                        <Button className="w-1/2" onClick={handleSaveMonthlyIncome} disabled={isSavingMonthlyIncome || Number(monthlyIncomeValue) === profile.monthly_income} type="button">
                          {isSavingMonthlyIncome ? "Saving..." : "Save"}
                        </Button>
                      </div>
                      {monthlyIncomeError && <div className="text-sm text-red-500 mt-2">{monthlyIncomeError}</div>}
                    </div>
                  ) : (
                    <div>
                      <h3 className="text-lg font-medium">
                        ₦{Number(profile.monthly_income).toLocaleString()}
                      </h3>
                      <p className="text-gray-600">Monthly Income</p>
                    </div>
                  )}
                  {isCurrentUser && !isEditingMonthlyIncome && (
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setIsEditingMonthlyIncome(true)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === "places" && (
          <div className="space-y-6">
            <h2 className="text-xl font-medium">Current Address</h2>
            <div className="flex items-start gap-4">
              <div className="mt-1">
                <MapPin className="h-10 w-10 p-2 bg-gray-100 text-gray-500 rounded-full" />
              </div>
              <div className="flex-grow">
                <div className="flex justify-between items-start">
                   {isEditingLocation ? (
                     <div className="space-y-2 w-full">
                       <input
                         type="text"
                         value={locationAddress}
                         onChange={(e) => setLocationAddress(e.target.value)}
                         placeholder="Address"
                         className="border-b-3 border-solid !important border-b-blue-600 !important focus-visible:border-b-green-600 !important rounded-none px-3 py-2 w-full"
                       />
                       <input
                         type="text"
                         value={locationStreet}
                         onChange={(e) => setLocationStreet(e.target.value)}
                         placeholder="Street"
                         className="border-b-3 border-solid !important border-b-blue-600 !important focus-visible:border-b-green-600 !important rounded-none px-3 py-2 w-full"
                       />
                       <input
                         type="text"
                         value={locationLga}
                         onChange={(e) => setLocationLga(e.target.value)}
                         placeholder="LGA"
                         className="border-b-3 border-solid !important border-b-blue-600 !important focus-visible:border-b-green-600 !important rounded-none px-3 py-2 w-full"
                       />
                       <input
                         type="text"
                         value={locationCity}
                         onChange={(e) => setLocationCity(e.target.value)}
                         placeholder="City"
                         className="border-b-3 border-solid !important border-b-blue-600 !important focus-visible:border-b-green-600 !important rounded-none px-3 py-2 w-full"
                       />
                       <select
                         value={(locationState ?? '') + ''}
                         onChange={(e) => setLocationState(e.target.value)}
                         className="border-b-3 border-solid !important border-b-blue-600 !important focus-visible:border-b-green-600 !important rounded-none px-3 py-2 w-full"
                       >
                         <option value="">Select State</option>
                         {NIGERIAN_STATES.map(state => <option key={state} value={state}>{state}</option>)}
                       </select>
                       <input
                         type="text"
                         value={locationLandmark}
                         onChange={(e) => setLocationLandmark(e.target.value)}
                         placeholder="Landmark (optional)"
                         className="border-b-3 border-solid !important border-b-blue-600 !important focus-visible:border-b-green-600 !important rounded-none px-3 py-2 w-full"
                       />
                       <div className="flex justify-end gap-2 mt-2">
                         <Button variant="outline" onClick={handleCancelEditLocation}>Cancel</Button>
                         <Button onClick={handleSaveLocation} disabled={locationAddress === (profile.address || "") && locationStreet === (profile.street || profile.address || "") && locationLga === (profile.lga || profile.city || "") && locationCity === (profile.city || "") && locationState === (profile.state || "") && locationLandmark === (profile.landmark || "")}>Save</Button>
                       </div>
                     </div>
                   ) : (
                  <div>
                    <h3 className="text-lg font-medium">
                      Lives in {profile.city || "Not specified"}, {profile.state || "Not specified"}
                    </h3>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-gray-600">{profile.street || profile.address}</p>
                      {addressVerified && <Badge className="bg-green-500 text-white">Verified</Badge>}
                      {!addressVerified && addressVerificationStatus === "pending" && <Badge className="bg-amber-500 text-white">Pending</Badge>}
                      {!addressVerified && addressVerificationStatus !== "pending" && isCurrentUser && (
                        <Button size="sm" variant="outline" onClick={handleVerifyAddress} disabled={isVerifyingAddress}>
                          {isVerifyingAddress ? "Verifying..." : "Verify"}
                        </Button>
                      )}
                    </div>
                    {addressVerificationError && <p className="text-sm text-red-500 mt-1">{addressVerificationError}</p>}
                  </div>
                   )}
                  {isCurrentUser && (
                     <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setIsEditingLocation(true)}>
                        <Edit className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === "contact" && (
          <div className="space-y-6">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Full Name</label>
              <div className="flex items-center gap-2 mt-1 justify-between">
                {isEditingFullName ? (
                  <div className="flex flex-col gap-2 w-full">
                    <input
                      type="text"
                      value={firstNameText}
                      onChange={e => setFirstNameText(e.target.value)}
                      placeholder="First Name"
                      className="border-b-2 border-blue-600 focus:border-green-600 outline-none px-3 py-2 w-full"
                      disabled={isSavingFullName || profile.bvn_verified}
                    />
                    <input
                      type="text"
                      value={middleNameText}
                      onChange={e => setMiddleNameText(e.target.value)}
                      placeholder="Middle Name"
                      className="border-b-2 border-blue-600 focus:border-green-600 outline-none px-3 py-2 w-full"
                      disabled={isSavingFullName || profile.bvn_verified}
                    />
                    <input
                      type="text"
                      value={lastNameText}
                      onChange={e => setLastNameText(e.target.value)}
                      placeholder="Last Name"
                      className="border-b-2 border-blue-600 focus:border-green-600 outline-none px-3 py-2 w-full"
                      disabled={isSavingFullName || profile.bvn_verified}
                    />
                    <div className="flex gap-2 mt-2 w-full">
                      <Button variant="outline" className="w-1/2" onClick={handleCancelEditFullName} type="button" disabled={isSavingFullName || profile.bvn_verified}>Cancel</Button>
                      <Button className="w-1/2" onClick={handleSaveFullName} disabled={isSavingFullName || (firstNameText === (profile.first_name || "") && middleNameText === (profile.middle_name || "") && lastNameText === (profile.last_name || "")) || profile.bvn_verified} type="button">
                        {isSavingFullName ? "Saving..." : "Save"}
                      </Button>
                    </div>
                    {fullNameError && <div className="text-sm text-red-500 mt-2">{fullNameError}</div>}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mt-1 justify-between w-full">
                    <span className="text-lg font-semibold">{profile.first_name} {profile.middle_name} {profile.last_name}</span>
                    <div className="flex items-center gap-2">
                      {profile.bvn_verified && <Badge className="bg-green-500 text-white ml-2">Verified</Badge>}
                      {isCurrentUser && !profile.bvn_verified && (
                        <Button size="sm" variant="ghost" onClick={() => setIsEditingFullName(true)}><Edit className="h-4 w-4" /></Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            {/* Phone */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Phone Number</label>
              <div className="flex items-center gap-2 mt-1 justify-between">
                {isEditingPhone ? (
                  <div className="flex flex-col gap-2 w-full">
                    <input
                      type="text"
                      value={phoneText}
                      onChange={e => setPhoneText(e.target.value)}
                      placeholder="Phone Number"
                      className="border-b-2 border-blue-600 focus:border-green-600 outline-none px-3 py-2 w-full"
                      disabled={phoneVerified || isSavingContact}
                    />
                    <div className="flex gap-2 mt-2 w-full">
                      <Button variant="outline" className="w-1/2" onClick={handleCancelEditPhone} type="button" disabled={isSavingContact}>Cancel</Button>
                      <Button className="w-1/2" onClick={handleSavePhone} disabled={isSavingContact || phoneText === (profile.phone_number || "")} type="button">
                        {isSavingContact ? "Saving..." : "Save"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-medium">{profile.phone_number || "No phone number added"}</h3>
                      {phoneVerified && (
                        <Badge className="bg-green-500 text-white ml-2">Verified</Badge>
                      )}
                      {!phoneVerified && isCurrentUser && profile.phone_number && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="ml-2"
                          onClick={handleSendPhoneOtp}
                          disabled={isSendingPhoneOtp}
                        >
                          {isSendingPhoneOtp ? "Sending..." : "Verify"}
                        </Button>
                      )}
                    </div>
                    {isCurrentUser && (
                      <Button size="sm" variant="ghost" className="ml-auto" onClick={() => { setIsEditingPhone(true); setIsEditingFullName(false); setIsEditingEmail(false); setIsEditingContact(false); }}><Edit className="h-4 w-4" /></Button>
                    )}
                  </>
                )}
              </div>
            </div>
            {/* Email */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <div className="flex items-center gap-2 mt-1 justify-between">
                {isEditingEmail ? (
                  <div className="flex flex-col gap-2 w-full">
                    <input
                      type="email"
                      value={emailText}
                      onChange={e => setEmailText(e.target.value)}
                      placeholder="Email Address"
                      className="border-b-2 border-blue-600 focus:border-green-600 outline-none px-3 py-2 w-full"
                      disabled={isSavingContact}
                    />
                    <div className="flex gap-2 mt-2 w-full">
                      <Button variant="outline" className="w-1/2" onClick={handleCancelEditEmail} type="button" disabled={isSavingContact}>Cancel</Button>
                      <Button className="w-1/2" onClick={handleSaveEmail} disabled={isSavingContact || emailText === (profile.email || "")} type="button">
                        {isSavingContact ? "Saving..." : "Save"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <span>{profile.email || "No email added"}</span>
                      {emailVerified && <Badge className="bg-green-500 text-white">Verified</Badge>}
                      {!emailVerified && isCurrentUser && profile.email && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleSendEmailOtp}
                          disabled={isSendingEmailOtp}
                        >
                          {isSendingEmailOtp ? "Sending..." : "Verify"}
                        </Button>
                      )}
                    </div>
                    {isCurrentUser && (
                      <Button size="sm" variant="ghost" className="ml-auto" onClick={() => { setIsEditingEmail(true); setIsEditingFullName(false); setIsEditingPhone(false); setIsEditingContact(false); }}><Edit className="h-4 w-4" /></Button>
                    )}
                  </>
                )}
              </div>
            </div>
            {/* Social Media and Website */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Facebook Profile URL</label>
              <div className="flex items-center gap-2 mt-1 justify-between">
                {isEditingContact ? (
                  <input
                    type="url"
                    id="facebook_url"
                    name="facebook_url"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    value={socialMediaData.facebook_url}
                    onChange={handleSocialMediaChange}
                  />
                ) : (
                  <>
                    <span>{profile.facebook_url || "-"}</span>
                    {isCurrentUser && (
                      <Button size="sm" variant="ghost" className="ml-auto" onClick={() => { setIsEditingContact(true); setIsEditingFullName(false); setIsEditingPhone(false); setIsEditingEmail(false); }}><Edit className="h-4 w-4" /></Button>
                    )}
                  </>
                )}
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">LinkedIn Profile URL</label>
              <div className="flex items-center gap-2 mt-1 justify-between">
                {isEditingContact ? (
                  <input
                    type="url"
                    id="linkedin_url"
                    name="linkedin_url"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    value={socialMediaData.linkedin_url}
                    onChange={handleSocialMediaChange}
                  />
                ) : (
                  <>
                    <span>{profile.linkedin_url || "-"}</span>
                    {isCurrentUser && (
                      <Button size="sm" variant="ghost" className="ml-auto" onClick={() => { setIsEditingContact(true); setIsEditingFullName(false); setIsEditingPhone(false); setIsEditingEmail(false); }}><Edit className="h-4 w-4" /></Button>
                    )}
                  </>
                )}
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Username</label>
              <div className="flex items-center gap-2 mt-1 justify-between">
                <span>{profile.username ? `@${profile.username}` : "Generating username..."}</span>
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Twitter Profile URL</label>
              <div className="flex items-center gap-2 mt-1 justify-between">
                {isEditingContact ? (
                  <input
                    type="url"
                    id="twitter_url"
                    name="twitter_url"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    value={socialMediaData.twitter_url}
                    onChange={handleSocialMediaChange}
                  />
                ) : (
                  <>
                    <span>{profile.twitter_url || "-"}</span>
                    {isCurrentUser && (
                      <Button size="sm" variant="ghost" className="ml-auto" onClick={() => { setIsEditingContact(true); setIsEditingFullName(false); setIsEditingPhone(false); setIsEditingEmail(false); }}><Edit className="h-4 w-4" /></Button>
                    )}
                  </>
                )}
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Website URL</label>
              <div className="flex items-center gap-2 mt-1 justify-between">
                {isEditingContact ? (
                  <input
                    type="url"
                    id="website"
                    name="website"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    value={socialMediaData.website}
                    onChange={handleSocialMediaChange}
                  />
                ) : (
                  <>
                    <span>{profile.website || "-"}</span>
                    {isCurrentUser && (
                      <Button size="sm" variant="ghost" className="ml-auto" onClick={() => { setIsEditingContact(true); setIsEditingFullName(false); setIsEditingPhone(false); setIsEditingEmail(false); }}><Edit className="h-4 w-4" /></Button>
                    )}
                  </>
                )}
              </div>
            </div>
            {/* Save/Cancel for social media fields */}
            {isEditingContact && (
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={handleCancelEditContact} disabled={isSavingContact}>Cancel</Button>
                <Button onClick={handleSaveContact} disabled={isSavingContact}>
                  {isSavingContact ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            )}
          </div>
        )}

        {activeSection === "details" && (
          <div className="space-y-6">
            <h2 className="text-xl font-medium">About You</h2>
            <div className="flex items-start gap-4">
              <div className="flex-grow">
                 {isEditingBio ? (
                   <div className="space-y-4">
                     <Textarea
                       placeholder="Tell us about yourself..."
                       value={bioText}
                       onChange={(e) => setBioText(e.target.value)}
                       rows={4}
                     />
                     <div className="flex justify-end gap-2">
                       <Button variant="outline" onClick={handleCancelEditBio}>Cancel</Button>
                       <Button onClick={handleSaveBio} disabled={bioText === (profile.bio || "")}>Save</Button>
                     </div>
                   </div>
                 ) : (
                   <div className="flex justify-between items-start">
                <p className="text-gray-700">{profile.bio || "No details to show"}</p>
                     {isCurrentUser && (
                       <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setIsEditingBio(true)}>
                         <Edit className="h-4 w-4" />
                  </Button>
                     )}
                   </div>
                )}
              </div>
            </div>

            <DetailsAboutYouSection
              profile={profile}
              onUpdate={handleUpdate}
              uploadLendingLicense={uploadLendingLicense}
              />
          </div>
        )}

        {activeSection === "bank" && (
          <div className="space-y-6">
            <h2 className="text-xl font-medium">Linked Account</h2>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">BVN</span>
                  {(profile.bvn_verified || bvnVerified) && (
                    <Badge className="bg-green-500 text-white">Verified</Badge>
                  )}
                </div>
                {isCurrentUser && !isEditingBvn && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => setIsEditingBvn(true)}
                      aria-label="Edit BVN"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              {isEditingBvn ? (
                <div className="flex flex-col gap-2">
                  <input
                    type="text"
                    value={bvnText}
                    onChange={e => setBvnText(e.target.value.replace(/[^0-9]/g, "").slice(0, 11))}
                    placeholder="Enter your BVN"
                    className="border px-3 py-2 rounded w-full"
                    maxLength={11}
                    disabled={isSavingBvn}
                  />
                  {bvnError && <div className="text-red-500 text-sm">{bvnError}</div>}
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={handleCancelBvn} disabled={isSavingBvn}>Cancel</Button>
                    <Button onClick={handleSaveBvn} disabled={isSavingBvn || bvnText === (profile.bvn || "") || bvnText.length !== 11}>
                      {isSavingBvn ? "Saving..." : "Save"}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-600">{profile.bvn ? `BVN: ${profile.bvn}` : "BVN: Not provided"}</div>
              )}
              {bvnVerificationMsg && <div className="text-xs text-gray-500">{bvnVerificationMsg}</div>}
            </div>
            <div className="flex justify-between items-center mb-4">
              <span className="font-medium">Your Accounts</span>
              {isCurrentUser && (
                <Dialog open={isAccountModalOpen} onOpenChange={setIsAccountModalOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="icon" className="rounded-full h-10 w-10 flex items-center justify-center text-2xl" onClick={() => setIsAccountModalOpen(true)}>
                      <Plus className="h-6 w-6" />
                      </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Account</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <label>Account Number</label>
                        <input type="text" value={accountNumber} onChange={e => setAccountNumber(e.target.value)} maxLength={10} className="w-full border p-2 rounded" />
                    </div>
                      <div>
                        <label>Bank</label>
                        <select value={accountBank} onChange={e => setAccountBank(e.target.value)} disabled={isLoadingAccountBanks} className="w-full border p-2 rounded disabled:bg-gray-100 disabled:cursor-not-allowed">
                          <option value="">{isLoadingAccountBanks ? "Loading banks..." : "Select Bank"}</option>
                          {accountBanks.map(bank => <option key={bank.code} value={bank.name}>{bank.name}</option>)}
                        </select>
                  </div>
                    <div>
                        <label>Account Name</label>
                        <input type="text" value={accountName} onChange={e => setAccountName(e.target.value)} placeholder="Enter account name" className="w-full border p-2 rounded" />
                      </div>
                      <Button onClick={handleAddAccount} disabled={isAddingAccount || !accountName || !accountNumber || accountNumber.length !== 10 || !accountBank} className="w-full">
                        {isAddingAccount ? "Adding..." : "Add Account"}
                      </Button>
                      {addAccountError && <div className="text-xs text-red-500 mt-1 text-red-600">{addAccountError}</div>}
                  </div>
                  </DialogContent>
                </Dialog>
                )}
              </div>
            <div className="space-y-2">
              {isLoadingAccounts ? (
                <div className="text-gray-500">Loading accounts...</div>
              ) : accountsError ? (
                <div className="text-red-500">{accountsError}</div>
              ) : accounts.length === 0 ? (
                <div className="text-gray-500">No accounts added yet.</div>
              ) : accounts.map(a => (
                <div key={a.id} className="border p-3 rounded flex items-center justify-between">
                  <div>
                    <div className="font-medium">{a.account_name}</div>
                    <div className="text-sm text-gray-500">{a.account_number} - {a.bank_name}</div>
            </div>
                  {isCurrentUser && (
                <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRemoveAccount(a.id)}
                      disabled={removingAccountId === a.id}
                >
                      {removingAccountId === a.id ? "Removing..." : "Remove"}
                </Button>
            )}
                </div>
              ))}
              {removeAccountError && <div className="text-xs text-red-500 mt-1">{removeAccountError}</div>}
            </div>
          </div>
        )}

        {activeSection === "wallets" && (
          <div className="space-y-6">
            <h2 className="text-xl font-medium">Your Wallets</h2>
            
            {isLoadingWallets ? (
              <div className="text-center py-8">
                <div className="inline-flex items-center gap-2 text-gray-500">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Loading wallets...</span>
                </div>
              </div>
            ) : walletsError ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-600 text-sm">{walletsError}</p>
              </div>
            ) : wallets.length === 0 ? (
              <div className="text-center py-12">
                <WalletIcon className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <p className="text-lg font-medium text-gray-700 mb-2">No wallets yet</p>
                <p className="text-sm text-gray-500">Your digital pockets are empty! 💼✨</p>
              </div>
            ) : (
              <div className="space-y-4">
                {wallets.map((wallet, index) => (
                  <Card key={index} className="border border-gray-200">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <WalletIcon className="h-5 w-5 text-blue-600" />
                            <span className="font-semibold text-gray-900">{wallet.chain || "Base"}</span>
                            {wallet.status && (
                              <Badge 
                                variant={wallet.status === "funded" ? "default" : "secondary"}
                                className="text-xs"
                              >
                                {wallet.status}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm font-mono text-gray-700 break-all">
                            {wallet.walletAddress}
                          </p>
                          {wallet.createdAt && (
                            <p className="text-xs text-gray-500 mt-2">
                              Created: {new Date(wallet.createdAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {activeSection === "loan-helper" && (
          <div className="space-y-8">
            <h2 className="text-xl font-medium flex items-center justify-between">
              Lending goals
              {isCurrentUser && !isEditingLoanHelper && (
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setIsEditingLoanHelper(true)}>
                  <Edit className="h-4 w-4" />
                </Button>
              )}
            </h2>
            {isEditingLoanHelper ? (
              <LoanHelperSettingsForm
                userId={profile.id}
                onSave={() => setIsEditingLoanHelper(false)}
                onCancel={() => setIsEditingLoanHelper(false)}
                isVerified={Boolean(profile.bvn_verified)}
              />
            ) : (
              <LoanHelperSettingsDisplay userId={profile.id} />
            )}
          </div>
        )}

        {/* Virtual Account Section - Only show if selected and isCurrentUser */}
        {activeSection === "virtual-account" && isCurrentUser && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">Virtual Account</CardTitle>
            </CardHeader>
            <CardContent>

              {/* BVN Display and Inline Edit */}
              <div className="mb-6">
                <div className="flex items-center justify-between gap-3 mb-1">
                  <label className="block font-medium">BVN</label>
                  {isCurrentUser && !isEditingBvn && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => setIsEditingBvn(true)}
                      aria-label="Edit BVN"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {isEditingBvn ? (
                  <div className="flex flex-col gap-2">
                    <input
                      type="text"
                      value={bvnText}
                      onChange={e => setBvnText(e.target.value.replace(/[^0-9]/g, "").slice(0, 11))}
                      placeholder="Enter your BVN"
                      className="border px-3 py-2 rounded w-full"
                      maxLength={11}
                      disabled={isSavingBvn}
                    />
                    {bvnError && <div className="text-red-500 text-sm">{bvnError}</div>}
                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" onClick={handleCancelBvn} disabled={isSavingBvn}>Cancel</Button>
                      <Button onClick={handleSaveBvn} disabled={isSavingBvn || bvnText === (profile.bvn || "") || bvnText.length !== 11}>
                        {isSavingBvn ? "Saving..." : "Save"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-gray-900 font-mono">{profile.bvn || "Not set"}</span>
                    {isCurrentUser && !profile.bvn_verified && profile.correlation_id && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setOtpModalOpen(true)}
                      >
                        Verify
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {/* NIN Display and Inline Edit */}
              <div className="mb-4">
                <div className="flex items-center justify-between gap-3 mb-1">
                  <label className="block font-medium">NIN</label>
                  {isCurrentUser && !isEditingNin && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => setIsEditingNin(true)}
                      aria-label="Edit NIN"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {isEditingNin ? (
                  <div className="flex flex-col gap-2">
                    <input
                      type="text"
                      value={ninText}
                      onChange={e => setNinText(e.target.value.replace(/[^0-9]/g, "").slice(0, 11))}
                      placeholder="Enter your NIN"
                      className="border px-3 py-2 rounded w-full"
                      maxLength={11}
                      disabled={isSavingNin}
                    />
                    {ninError && <div className="text-red-500 text-sm">{ninError}</div>}
                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" onClick={handleCancelNin} disabled={isSavingNin}>Cancel</Button>
                      <Button onClick={handleSaveNin} disabled={isSavingNin || ninText === (profile.id_number || profile.idNumber || "") || ninText.length !== 11}>
                        {isSavingNin ? "Saving..." : "Save"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-900 font-mono">{profile.id_number || profile.idNumber || "Not set"}</span>
                  </div>
                )}
              </div>

              
            </CardContent>
          </Card>
        )}
        {/* OTP Dialog for Wallet Creation */}
        <Dialog open={showOtpDialog} onOpenChange={setShowOtpDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Enter OTP to Complete Wallet Creation</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p>Enter the OTP sent to your phone number ({walletPhoneNumber || profile.phone_number})</p>
              <input
                type="text"
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
                placeholder="Enter OTP"
                className="border px-3 py-2 w-full rounded"
                maxLength={6}
                disabled={isVerifyingWalletOtp}
              />
              {otpError && <div className="text-red-500 text-sm">{otpError}</div>}
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowOtpDialog(false)} disabled={isVerifyingWalletOtp}>
                  Cancel
                </Button>
                <Button
                  onClick={async () => {
                    setIsVerifyingWalletOtp(true);
                    setOtpError("");
                    try {
                      const phoneToUse = walletPhoneNumber || profile.phone_number;
                      const res = await fetch("/api/stablesrail/verify-otp", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          code: otp,
                          sessionId: profile.correlation_id || profile.correlationId,
                        }),
                      });
                      const data = await res.json();
                      if (res.ok && !data.error) {
                        // 1. Update user's phone number in profile
                        await updateProfile({ phoneNumber: phoneToUse }, profile.id);
                        // 2. Fetch wallet details
                        const walletDetailsRes = await fetch(`/api/alat/wallet/get-wallet-details?phoneNumber=${encodeURIComponent(phoneToUse)}`);
                        const walletDetails = await walletDetailsRes.json();
                        if (walletDetails?.accountNumber || walletDetails?.account_number) {
                          // 3. Update user's account number and full name
                          await updateProfile({
                            accountNumber: walletDetails.accountNumber || walletDetails.account_number,
                            accountName: walletDetails.accountName || walletDetails.account_name,
                            firstName: walletDetails.firstName || walletDetails.first_name || walletDetails.fullName || walletDetails.full_name,
                          }, profile.id);
                        }
                        setShowOtpDialog(false);
                        toast({ title: "OTP Verified!", description: "Your wallet has been created successfully." });
                      } else {
                        setOtpError(data.message || data.error || "Failed to verify OTP");
                      }
                    } catch (err) {
                      setOtpError("Failed to verify OTP");
                    } finally {
                      setIsVerifyingWalletOtp(false);
                    }
                  }}
                  disabled={otp.length !== 6 || isVerifyingWalletOtp}
                >
                  {isVerifyingWalletOtp ? "Verifying..." : "Verify OTP"}
                </Button>
              </DialogFooter>
              <div className="flex justify-end mt-2">
                <button
                  type="button"
                  className="text-xs text-blue-600 hover:underline disabled:opacity-50"
                  disabled={isVerifyingWalletOtp}
                  onClick={async () => {
                    if (!trackingId || !(walletPhoneNumber || profile.phone_number)) return;
                    try {
                      const res = await fetch("/api/alat/wallet/resend-otp", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          trackingId,
                          phoneNumber: walletPhoneNumber || profile.phone_number,
                        }),
                      });
                      const data = await res.json();
                      if (res.ok && !data.error) {
                        toast({ title: "OTP Resent", description: "A new OTP has been sent to your phone." });
                      } else {
                        toast({ title: "Error", description: data.message || data.error || "Failed to resend OTP", variant: "destructive" });
                      }
                    } catch (err) {
                      toast({ title: "Error", description: "Failed to resend OTP", variant: "destructive" });
                    }
                  }}
                >
                  Resend OTP
                </button>
      </div>
    </div>
          </DialogContent>
        </Dialog>
        {/* Phone Verification Dialog */}
        <Dialog open={showPhoneVerify} onOpenChange={(open) => {
          setShowPhoneVerify(open);
          if (!open) {
            setPhoneOtpReferenceId(null);
            setOtp("");
            setOtpError("");
          }
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Verify Your Phone Number</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p>Enter the OTP sent to your phone number ({profile.phone_number}) via Dojah.</p>
              <input
                type="text"
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
                placeholder="Enter OTP"
                className="border px-3 py-2 w-full rounded"
                maxLength={6}
                disabled={isVerifyingOtp}
              />
              {otpError && <div className="text-red-500 text-sm">{otpError}</div>}
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowPhoneVerify(false)} disabled={isVerifyingOtp}>
                  Cancel
                </Button>
                <Button onClick={handleVerifyPhoneOtp} disabled={otp.length !== 6 || isVerifyingOtp}>
                  {isVerifyingOtp ? "Verifying..." : "Verify"}
                </Button>
              </DialogFooter>
      </div>
          </DialogContent>
        </Dialog>
        {/* Email Verification Dialog */}
        <Dialog open={showEmailVerify} onOpenChange={(open) => {
          setShowEmailVerify(open)
          if (!open) {
            setEmailOtp("")
            setEmailOtpError("")
          }
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Verify Your Email</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p>Enter the confirmation code sent to {profile.email}.</p>
              <input
                type="text"
                value={emailOtp}
                onChange={e => setEmailOtp(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
                placeholder="Enter 6-digit code"
                className="border px-3 py-2 w-full rounded"
                maxLength={6}
                disabled={isVerifyingEmailOtp}
              />
              {emailOtpError && <div className="text-red-500 text-sm">{emailOtpError}</div>}
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowEmailVerify(false)} disabled={isVerifyingEmailOtp}>
                  Cancel
                </Button>
                <Button onClick={handleVerifyEmailOtp} disabled={emailOtp.length !== 6 || isVerifyingEmailOtp}>
                  {isVerifyingEmailOtp ? "Verifying..." : "Verify"}
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
        {/* OTP Dialog for BVN Verification */}
        <Dialog open={isOtpModalOpen} onOpenChange={setOtpModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Verify BVN with OTP</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Enter OTP"
                value={otpInput}
                onChange={e => setOtpInput(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
                maxLength={6}
                className="border px-3 py-2 w-full rounded"
                disabled={isVerifyingOtp}
              />
              {otpErrorMsg && <div className="text-red-600 text-sm">{otpErrorMsg}</div>}
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={()=>setOtpModalOpen(false)} disabled={isVerifyingOtp}>Cancel</Button>
                <Button onClick={handleVerifyOtp} disabled={otpInput.length!==6 || isVerifyingOtp}>
                  {isVerifyingOtp? "Verifying..." : "Submit"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        {!isCurrentUser && (
          <Button onClick={isBlocked ? handleUnblock : handleBlock} disabled={blockLoading} variant={isBlocked ? "outline" : "destructive"} className="ml-2">
            {blockLoading ? (isBlocked ? "Unblocking..." : "Blocking...") : isBlocked ? "Unblock" : "Block"}
          </Button>
        )}
      </div>
    </div>
  );
}

export default ProfileAbout
