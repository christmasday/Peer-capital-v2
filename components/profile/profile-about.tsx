"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Briefcase, GraduationCap, MapPin, Phone, Mail, Heart, Calendar, User, Info, Edit, Wallet, Plus, Wallet as WalletIcon } from "lucide-react"
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
import Script from "next/script"
// Fix for missing types for react-dojah
// @ts-ignore
// eslint-disable-next-line
declare module 'react-dojah';
import Dojah from 'react-dojah'
import { ErrorBoundary } from "@/components/ui/ErrorBoundary"

// Add Dojah to window type
declare global {
  interface Window {
    Dojah?: any;
  }
}

interface ProfileAboutProps {
  profile: any
  isCurrentUser?: boolean
  virtualAccount?: any
  initialSection?: string
}

export function ProfileAbout({ profile, isCurrentUser = false, virtualAccount: initialVirtualAccount, initialSection }: ProfileAboutProps) {
  const router = useRouter()
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
  const [virtualAccount, setVirtualAccount] = useState<any>(initialVirtualAccount || null)
  const [isLoadingVA, setIsLoadingVA] = useState(false)
  const [vaError, setVaError] = useState<string | null>(null)
  const [isCreatingVA, setIsCreatingVA] = useState(false)
  // Add state for BVN editing and verification
  const [isEditingBvn, setIsEditingBvn] = useState(false);
  const [bvnText, setBvnText] = useState(profile.bvn || "");
  const [isSavingBvn, setIsSavingBvn] = useState(false);
  const [bvnError, setBvnError] = useState<string | null>(null);
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
  // Add state for Paystack response
  const [paystackResponse, setPaystackResponse] = useState<any>(null);
  const { toast } = useToast();
  const [isVerifyingCustomer, setIsVerifyingCustomer] = useState(false);
  const [customerVerificationMsg, setCustomerVerificationMsg] = useState<string | null>(null);
  // Add state and handlers at the top of the component
  const [showPhoneVerify, setShowPhoneVerify] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [showDojah, setShowDojah] = useState(false);
  // Add state for beneficiaries (bank accounts)
  const [accounts, setAccounts] = useState<any[]>([])
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false)
  const [accountBank, setAccountBank] = useState("")
  const [accountBanks, setAccountBanks] = useState<{ name: string; code: string }[]>([])
  const [isResolvingAccount, setIsResolvingAccount] = useState(false)
  const [resolveAccountError, setResolveAccountError] = useState("")
  const [isAddingAccount, setIsAddingAccount] = useState(false)
  const [addAccountError, setAddAccountError] = useState("")
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false)
  const [accountsError, setAccountsError] = useState("")
  const [removingAccountId, setRemovingAccountId] = useState<string | null>(null)
  const [removeAccountError, setRemoveAccountError] = useState("")
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
      const res = await fetch("/api/phone/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: profile.phone_number, otp }),
      });
      const data = await res.json();
      if (res.ok && data.status === "success") {
        await updateProfile({ phoneVerified: true, phoneVerifiedAt: new Date().toISOString() }, profile.id);
        setShowPhoneVerify(false);
        setOtp("");
        // Optionally, trigger a profile refetch or reload
        window.location.reload();
      } else {
        setOtpError(data.message || "Invalid OTP");
      }
    } catch (err) {
      setOtpError("Verification failed. Please try again.");
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const sections = [
    { id: "overview", name: "Overview", icon: Info },
    { id: "work", name: "Work and education", icon: Briefcase },
    { id: "places", name: "Places lived", icon: MapPin },
    { id: "contact", name: "Contact and basic info", icon: Phone },
    { id: "details", name: "Details about you", icon: User },
    { id: "lending-licence", name: "Lending Licence", icon: Briefcase },
    { id: "bank", name: "Repayment Account", icon: Briefcase },
    { id: "loan-helper", name: "Loan helper settings", icon: Briefcase },
    // Wallet removed per request
  ]

  useEffect(() => {
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
  }, [profile])

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

  useEffect(() => {
    if (!isCurrentUser && profile.id) {
      fetch(`/api/blocked-users`)
        .then(res => res.json())
        .then(data => {
          setIsBlocked(!!data.blocked.find((u: any) => u.id === profile.id));
        });
    }
  }, [profile.id, isCurrentUser]);

  const handleBlock = async () => {
    setBlockLoading(true);
    await fetch(`/api/block-user`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: profile.id }),
    });
    setIsBlocked(true);
    setBlockLoading(false);
  };

  const handleUnblock = async () => {
    setBlockLoading(true);
    await fetch(`/api/unblock-user`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: profile.id }),
    });
    setIsBlocked(false);
    setBlockLoading(false);
  };

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
    // Call the server action to update all address fields
    const result = await updateProfile({
      buildingNumber,
      apartment,
      street,
      city,
      town,
      state: stateValue,
      lga,
      lcda,
      landmark,
      additionalInformation,
      country,
      fullAddress,
      postalCode,
    });
    if (result.success) {
      setIsEditingLocation(false);
    } else {
      console.error("Failed to update location:", result.error);
    }
  };

  const handleCancelEditLocation = () => {
    setIsEditingLocation(false);
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
    });

    if (result.success) {
      console.log("Phone number updated successfully!");
      setIsEditingPhone(false);
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

  const handleCreateVirtualAccount = async () => {
    setIsCreatingVA(true)
    setVaError(null)
    setPaystackResponse(null)
    const res = await createVirtualAccount()
    setPaystackResponse(res)
    if (res.virtualAccount) {
      setVirtualAccount(res.virtualAccount)
    } else if (res.error) {
      setVaError(res.error)
    }
    setIsCreatingVA(false)
  }

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
    const [savingMarital, setSavingMarital] = useState(false);
    const [messageMarital, setMessageMarital] = useState<string | null>(null);
    const [editMarital, setEditMarital] = useState(false);
    const isDirtyMarital =
      maritalStatus !== (profile.marital_status || "") ||
      (maritalStatus === "married" && dependants !== (profile.number_of_dependants !== undefined && profile.number_of_dependants !== null ? String(profile.number_of_dependants) : ""));

    // Valid Means of Identification state/handlers remain unchanged
    const [idDocUrl, setIdDocUrl] = useState(profile.id_document_url || "");
    const [idDocFile, setIdDocFile] = useState<File | null>(null);
    const [savingIdDoc, setSavingIdDoc] = useState(false);
    const [editIdDoc, setEditIdDoc] = useState(false);
    const [messageIdDoc, setMessageIdDoc] = useState<string | null>(null);
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

    // Remove all lending licence state, handlers, and UI from this section

    const handleLicenseFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
        {/* Valid Means of Identification */}
        <div>
          <div className="flex items-center justify-between">
            <label className="font-semibold block mb-2">Valid Means of Identification</label>
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
                onChange={handleLicenseFileChange}
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
          setIsVerifyingBvn(false)
          return
        }
      }

      const res = await fetch("/api/stablesrail/onboard-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ bvn: bvnText }),
      })
      const data = await res.json()
      if (res.ok && data?.success) {
        setBvnVerified(false)
        setBvnVerificationMsg("BVN verification initiated. We'll notify you once it's completed.")
      } else {
        setBvnVerified(false)
        setBvnVerificationMsg(data?.error || "Verification initiation failed")
      }
    } catch (err: any) {
      setBvnVerified(false)
      setBvnVerificationMsg("Verification initiation failed. Please try again.")
    } finally {
      setIsVerifyingBvn(false)
    }
  }

  async function handleSaveBvn() {
    setIsSavingBvn(true);
    setBvnError(null);
    try {
      const result = await updateProfile({ bvn: bvnText });
      if (result.success) {
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
      const result = await updateProfile({ firstName: firstNameText, middleName: middleNameText, lastName: lastNameText });
      if (result.success) {
        setIsEditingFullName(false);
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

  // Fetch banks on mount
  useEffect(() => {
    async function fetchBanks() {
      try {
        const res = await fetch("https://api.paystack.co/bank", {
          headers: { Authorization: `Bearer ${process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || ""}` },
        })
        const data = await res.json()
        if (data.status && Array.isArray(data.data)) {
          setAccountBanks(data.data.map((bank: any) => ({ name: bank.name, code: bank.code })))
        }
      } catch {}
    }
    fetchBanks()
  }, [])

  // Resolve account name
  useEffect(() => {
    async function resolveAccount() {
      if (accountBank && accountNumber.length === 10) {
        setIsResolvingAccount(true)
        setResolveAccountError("")
        try {
          const bankCode = accountBanks.find(b => b.name === accountBank)?.code
          const res = await fetch("/api/paystack/resolve-account", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ account_number: accountNumber, bank_code: bankCode }),
          })
          const data = await res.json()
          if (data.status && data.data && data.data.account_name) {
            setAccountName(data.data.account_name)
          } else {
            setResolveAccountError("Could not resolve account name")
            setAccountName("")
          }
        } catch {
          setResolveAccountError("Could not resolve account name")
          setAccountName("")
        } finally {
          setIsResolvingAccount(false)
        }
      } else {
        setAccountName("")
        setResolveAccountError("")
      }
    }
    resolveAccount()
  }, [accountBank, accountNumber])

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
      // Call Paystack transferrecipient API
      const bankCode = accountBanks.find(b => b.name === accountBank)?.code
      const res = await fetch("/api/paystack/transferrecipient", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "nuban",
          name: accountName,
          account_number: accountNumber,
          bank_code: bankCode,
          currency: "NGN",
        }),
      })
      const data = await res.json()
      if (!data.status || !data.data?.recipient_code) throw new Error(data.message || "Failed to add account")
      // Save account in DB
      const saveRes = await fetch("/api/beneficiaries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          account_name: accountName,
          account_number: accountNumber,
          bank_name: accountBank,
          bank_code: bankCode,
          recipient_code: data.data.recipient_code,
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
            {/* Dojah Verification Button */}
            {isCurrentUser && (
              <div className="mb-4">
                <Button color="primary" onClick={() => setShowDojah(true)}>
                  Complete Profile Verification
                </Button>
              </div>
            )}
            {/* Dojah Widget Modal */}
            {showDojah && (
              <ErrorBoundary>
                <div id="dojah-widget-container">
                  <Dojah
                    appID={process.env.DOJAH_APP_ID}
                    publicKey={process.env.DOJAH_PUBLIC_KEY}
                    type="custom"
                    config={{
                      widget_id: "684effd6cb141c071767fddc",
                    }}
                    userData={{
                      first_name: profile.first_name,
                      middle_name: profile.middle_name,
                      last_name: profile.last_name,
                      email: profile.email,
                      residence_country: profile.country || 'NG',
                    }}
                    metadata={{
                      user_id: profile.id,
                    }}
                    response={async (type: any, data: any) => {
                      if (type === 'success') {
                        const verified = data?.data || {};
                        // Build the update object, omitting full name fields
                        const updateFields: any = {
                          dateOfBirth: verified.user_data?.data?.dob,
                          bvn: verified.government_data?.data?.bvn?.entity?.bvn,
                          address: verified.government_data?.data?.nin?.entity?.residence_AddressLine1,
                          city: verified.government_data?.data?.nin?.entity?.residence_Town,
                          state: verified.government_data?.data?.nin?.entity?.residence_state,
                          country: verified.countries?.data?.country,
                          id_url: verified.id?.data?.id_url,
                          id_type: verified.id?.data?.id_data?.document_type,
                          id_number: verified.id?.data?.id_data?.document_number
                          // Add more fields as needed, but do NOT include firstName, lastName, middleName
                        };
                        Object.keys(updateFields).forEach(
                          (key) => updateFields[key] === undefined && delete updateFields[key]
                        );
                        const result = await updateProfile(updateFields, profile.id);
                        if (result.success) {
                          toast({
                            title: "Profile Verification Successful",
                            description: "Your profile has been updated with your verified information.",
                          });
                        } else {
                          toast({
                            title: "Profile Update Failed",
                            description: result.error || "An error occurred while updating your profile.",
                          });
                        }
                        setTimeout(() => setShowDojah(false), 300); // Delay unmount
                      } else if (type === 'close') {
                        setTimeout(() => setShowDojah(false), 300); // Delay unmount
                      }
                    }}
                  />
                </div>
              </ErrorBoundary>
            )}
            {/* Referral Code Display */}
            {profile.referral_code && (
              <div className="flex items-center gap-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div>
                  <span className="block text-sm text-blue-700 font-semibold">Your Referral Code</span>
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
                         value={buildingNumber}
                         onChange={e => setBuildingNumber(e.target.value)}
                         placeholder="Building Number"
                         className="border-b-3 border-solid border-b-blue-600 focus-visible:border-b-green-600 rounded-none px-3 py-2 w-full"
                       />
                       <input
                         type="text"
                         value={apartment}
                         onChange={e => setApartment(e.target.value)}
                         placeholder="Apartment"
                         className="border-b-3 border-solid border-b-blue-600 focus-visible:border-b-green-600 rounded-none px-3 py-2 w-full"
                       />
                       <input
                         type="text"
                         value={street}
                         onChange={e => setStreet(e.target.value)}
                         placeholder="Street"
                         className="border-b-3 border-solid border-b-blue-600 focus-visible:border-b-green-600 rounded-none px-3 py-2 w-full"
                       />
                       <input
                         type="text"
                         value={city}
                         onChange={e => setCity(e.target.value)}
                         placeholder="City"
                         className="border-b-3 border-solid border-b-blue-600 focus-visible:border-b-green-600 rounded-none px-3 py-2 w-full"
                       />
                       <input
                         type="text"
                         value={town}
                         onChange={e => setTown(e.target.value)}
                         placeholder="Town"
                         className="border-b-3 border-solid border-b-blue-600 focus-visible:border-b-green-600 rounded-none px-3 py-2 w-full"
                       />
                       <input
                         type="text"
                         value={stateValue}
                         onChange={e => setStateValue(e.target.value)}
                         placeholder="State"
                         className="border-b-3 border-solid border-b-blue-600 focus-visible:border-b-green-600 rounded-none px-3 py-2 w-full"
                       />
                       <input
                         type="text"
                         value={lga}
                         onChange={e => setLga(e.target.value)}
                         placeholder="LGA"
                         className="border-b-3 border-solid border-b-blue-600 focus-visible:border-b-green-600 rounded-none px-3 py-2 w-full"
                       />
                       <input
                         type="text"
                         value={lcda}
                         onChange={e => setLcda(e.target.value)}
                         placeholder="LCDA"
                         className="border-b-3 border-solid border-b-blue-600 focus-visible:border-b-green-600 rounded-none px-3 py-2 w-full"
                       />
                       <input
                         type="text"
                         value={landmark}
                         onChange={e => setLandmark(e.target.value)}
                         placeholder="Landmark"
                         className="border-b-3 border-solid border-b-blue-600 focus-visible:border-b-green-600 rounded-none px-3 py-2 w-full"
                       />
                       <input
                         type="text"
                         value={additionalInformation}
                         onChange={e => setAdditionalInformation(e.target.value)}
                         placeholder="Additional Information"
                         className="border-b-3 border-solid border-b-blue-600 focus-visible:border-b-green-600 rounded-none px-3 py-2 w-full"
                       />
                       <input
                         type="text"
                         value={country}
                         onChange={e => setCountry(e.target.value)}
                         placeholder="Country"
                         className="border-b-3 border-solid border-b-blue-600 focus-visible:border-b-green-600 rounded-none px-3 py-2 w-full"
                       />
                       <input
                         type="text"
                         value={fullAddress}
                         onChange={e => setFullAddress(e.target.value)}
                         placeholder="Full Address"
                         className="border-b-3 border-solid border-b-blue-600 focus-visible:border-b-green-600 rounded-none px-3 py-2 w-full"
                       />
                       <input
                         type="text"
                         value={postalCode}
                         onChange={e => setPostalCode(e.target.value)}
                         placeholder="Postal Code"
                         className="border-b-3 border-solid border-b-blue-600 focus-visible:border-b-green-600 rounded-none px-3 py-2 w-full"
                       />
                       <div className="flex justify-end gap-2 mt-2">
                         <Button variant="outline" onClick={handleCancelEditLocation}>Cancel</Button>
                         <Button onClick={handleSaveLocation}>Save</Button>
                       </div>
                     </div>
                   ) : (
                  <div>
                    <h3 className="text-lg font-medium">Address</h3>
                    <div className="text-gray-600">
                      {profile.fullAddress && <div>{profile.fullAddress}</div>}
                      <div>{[profile.buildingNumber, profile.apartment, profile.street, profile.city, profile.town, profile.state, profile.lga, profile.lcda, profile.landmark, profile.additionalInformation, profile.country, profile.postalCode].filter(Boolean).join(", ")}</div>
                    </div>
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
                        disabled={profile.phone_verified}
                       />
                       <div className="flex justify-end gap-2 mt-2">
                         <Button variant="outline" onClick={handleCancelEditPhone}>Cancel</Button>
                         <Button onClick={handleSavePhone} disabled={phoneText === (profile.phone_number || "")}>Save</Button>
                       </div>
                     </div>
                   ) : (
                    <div className="flex items-center w-full">
                      <h3 className="text-lg font-medium mr-2">{profile.phone_number || "No phone number added"}</h3>
                      {profile.phone_verified && (
                        <Badge className="bg-green-500 text-white ml-2">Verified</Badge>
                      )}
                      {isCurrentUser && !profile.phone_verified && profile.phone_number && null}
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
                    <h3 className="text-lg font-medium">{profile.email || "No email added"}</h3>
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

            {isCurrentUser && (
              <div className="mt-2 text-gray-700 font-medium">
                Monthly Income: {isEditingMonthlyIncome ? (
                  <>
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
                  </>
                ) : (
                  <>
                    ₦{Number(profile.monthly_income).toLocaleString()}
                    <Button variant="ghost" size="sm" className="ml-2 h-8 w-8 p-0" onClick={() => setIsEditingMonthlyIncome(true)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {activeSection === "places" && (
          <div className="space-y-6">
            <h2 className="text-xl font-medium">Current City</h2>
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
                         value={buildingNumber}
                         onChange={e => setBuildingNumber(e.target.value)}
                         placeholder="Building Number"
                         className="border-b-3 border-solid border-b-blue-600 focus-visible:border-b-green-600 rounded-none px-3 py-2 w-full"
                       />
                       <input
                         type="text"
                         value={apartment}
                         onChange={e => setApartment(e.target.value)}
                         placeholder="Apartment"
                         className="border-b-3 border-solid border-b-blue-600 focus-visible:border-b-green-600 rounded-none px-3 py-2 w-full"
                       />
                       <input
                         type="text"
                         value={street}
                         onChange={e => setStreet(e.target.value)}
                         placeholder="Street"
                         className="border-b-3 border-solid border-b-blue-600 focus-visible:border-b-green-600 rounded-none px-3 py-2 w-full"
                       />
                       <input
                         type="text"
                         value={city}
                         onChange={e => setCity(e.target.value)}
                         placeholder="City"
                         className="border-b-3 border-solid border-b-blue-600 focus-visible:border-b-green-600 rounded-none px-3 py-2 w-full"
                       />
                       <input
                         type="text"
                         value={town}
                         onChange={e => setTown(e.target.value)}
                         placeholder="Town"
                         className="border-b-3 border-solid border-b-blue-600 focus-visible:border-b-green-600 rounded-none px-3 py-2 w-full"
                       />
                       <input
                         type="text"
                         value={stateValue}
                         onChange={e => setStateValue(e.target.value)}
                         placeholder="State"
                         className="border-b-3 border-solid border-b-blue-600 focus-visible:border-b-green-600 rounded-none px-3 py-2 w-full"
                       />
                       <input
                         type="text"
                         value={lga}
                         onChange={e => setLga(e.target.value)}
                         placeholder="LGA"
                         className="border-b-3 border-solid border-b-blue-600 focus-visible:border-b-green-600 rounded-none px-3 py-2 w-full"
                       />
                       <input
                         type="text"
                         value={lcda}
                         onChange={e => setLcda(e.target.value)}
                         placeholder="LCDA"
                         className="border-b-3 border-solid border-b-blue-600 focus-visible:border-b-green-600 rounded-none px-3 py-2 w-full"
                       />
                       <input
                         type="text"
                         value={landmark}
                         onChange={e => setLandmark(e.target.value)}
                         placeholder="Landmark"
                         className="border-b-3 border-solid border-b-blue-600 focus-visible:border-b-green-600 rounded-none px-3 py-2 w-full"
                       />
                       <input
                         type="text"
                         value={additionalInformation}
                         onChange={e => setAdditionalInformation(e.target.value)}
                         placeholder="Additional Information"
                         className="border-b-3 border-solid border-b-blue-600 focus-visible:border-b-green-600 rounded-none px-3 py-2 w-full"
                       />
                       <input
                         type="text"
                         value={country}
                         onChange={e => setCountry(e.target.value)}
                         placeholder="Country"
                         className="border-b-3 border-solid border-b-blue-600 focus-visible:border-b-green-600 rounded-none px-3 py-2 w-full"
                       />
                       <input
                         type="text"
                         value={fullAddress}
                         onChange={e => setFullAddress(e.target.value)}
                         placeholder="Full Address"
                         className="border-b-3 border-solid border-b-blue-600 focus-visible:border-b-green-600 rounded-none px-3 py-2 w-full"
                       />
                       <input
                         type="text"
                         value={postalCode}
                         onChange={e => setPostalCode(e.target.value)}
                         placeholder="Postal Code"
                         className="border-b-3 border-solid border-b-blue-600 focus-visible:border-b-green-600 rounded-none px-3 py-2 w-full"
                       />
                       <div className="flex justify-end gap-2 mt-2">
                         <Button variant="outline" onClick={handleCancelEditLocation}>Cancel</Button>
                         <Button onClick={handleSaveLocation}>Save</Button>
                       </div>
                     </div>
                   ) : (
                  <div>
                    <h3 className="text-lg font-medium">Address</h3>
                    <div className="text-gray-600">
                      {profile.fullAddress && <div>{profile.fullAddress}</div>}
                      <div>{[profile.buildingNumber, profile.apartment, profile.street, profile.city, profile.town, profile.state, profile.lga, profile.lcda, profile.landmark, profile.additionalInformation, profile.country, profile.postalCode].filter(Boolean).join(", ")}</div>
                    </div>
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
                      disabled={profile.phone_verified || isSavingContact}
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
                      {profile.phone_verified && (
                        <Badge className="bg-green-500 text-white ml-2">Verified</Badge>
                      )}
                      {isCurrentUser && !profile.phone_verified && profile.phone_number && (
                        <Button size="sm" variant="outline" onClick={() => setShowPhoneVerify(true)}>Verify</Button>
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
                    <span>{profile.email || "No email added"}</span>
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
            <h2 className="text-xl font-medium">Repayment Account</h2>
            <div className="text-sm text-gray-600">BVN: {profile.bvn || "Not provided"}</div>
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
                        <select value={accountBank} onChange={e => setAccountBank(e.target.value)} className="w-full border p-2 rounded">
                          <option value="">Select Bank</option>
                          {accountBanks.map(bank => <option key={bank.code} value={bank.name}>{bank.name}</option>)}
                        </select>
                  </div>
                    <div>
                        <label>Account Name</label>
                        <input type="text" value={accountName} disabled className="w-full border p-2 rounded bg-gray-100" />
                        {isResolvingAccount && <div className="text-xs text-blue-500 mt-1">Resolving account name...</div>}
                        {resolveAccountError && <div className="text-xs text-red-500 mt-1">{resolveAccountError}</div>}
                      </div>
                      <Button onClick={handleAddAccount} disabled={isAddingAccount || !accountName || isResolvingAccount} className="w-full">
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

        {activeSection === "lending-licence" && (
          <LendingLicenceSection profile={profile} onUpdate={handleUpdate} uploadLendingLicense={uploadLendingLicense} />
        )}

        {activeSection === "loan-helper" && (
          <div className={`space-y-8 ${!profile.lending_license_url && loanAmount ? 'opacity-50 pointer-events-none select-none' : ''}`}>
            <h2 className="text-xl font-medium flex items-center justify-between">
              Loan Helper Settings
              {isCurrentUser && !isEditingLoanHelper && profile.lending_license_url && (
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setIsEditingLoanHelper(true)}>
                  <Edit className="h-4 w-4" />
                </Button>
              )}
            </h2>
            {isEditingLoanHelper ? (
              <LoanHelperSettingsForm
                userId={profile.id}
                lendingLicenseUrl={profile.lending_license_url}
                onSave={() => setIsEditingLoanHelper(false)}
                onCancel={() => setIsEditingLoanHelper(false)}
              />
            ) : (
              profile.lending_license_url ? (
                <LoanHelperSettingsDisplay userId={profile.id} lendingLicenseUrl={profile.lending_license_url} />
              ) : (
                <div className="text-center text-gray-500 py-12">
                  <p>You must upload a valid lending license to offer loans.</p>
                </div>
              )
            )}
          </div>
        )}

        {/* Wallet Section - Always visible if selected and isCurrentUser */}
        {activeSection === "wallet" && isCurrentUser && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">Wallet</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Paystack Virtual Account Details */}
              <div className="mb-6">
                <h3 className="text-md font-semibold mb-3">Virtual Account Details</h3>
                {virtualAccount ? (
                  <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Account Number:</span>
                      <span className="font-mono text-sm font-medium">{virtualAccount.account_number}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Account Name:</span>
                      <span className="text-sm font-medium">{virtualAccount.account_name}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Bank:</span>
                      <span className="text-sm font-medium">{virtualAccount.bank_name}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Currency:</span>
                      <span className="text-sm font-medium">{virtualAccount.currency}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Status:</span>
                      <Badge className={virtualAccount.assigned ? "bg-green-500" : "bg-yellow-500"}>
                        {virtualAccount.assigned ? "Active" : "Pending"}
                      </Badge>
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-6 bg-gray-50 rounded-lg">
                    <Wallet className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600 mb-3">No virtual account found</p>
                    <Button
                                             onClick={async () => {
                         try {
                           const res = await fetch("/api/paystack/virtual-account", {
                             method: "POST",
                             headers: { "Content-Type": "application/json" },
                           });
                           const data = await res.json();
                           if (data.success) {
                             toast({ title: "Success", description: "Virtual account created successfully!" });
                             // Refresh the page to show the new virtual account
                             window.location.reload();
                           } else {
                             toast({ title: "Error", description: data.error || "Failed to create virtual account", variant: "destructive" });
                           }
                         } catch (error) {
                           toast({ title: "Error", description: "Failed to create virtual account", variant: "destructive" });
                         }
                       }}
                      className="w-full"
                    >
                      Create Virtual Account
                    </Button>
                  </div>
                )}
              </div>

              {/* BVN Display and Inline Edit */}
              <div className="mb-4">
                <label className="block font-medium mb-1">BVN</label>
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
                  <div className="flex items-center gap-2">
                    <span className="text-gray-900 font-mono">{profile.bvn || "Not set"}</span>
                    {/* Only show Edit button if wallet account details are NOT present */}
                    {!(profile.account_number && profile.account_name) && !profile.bvn_verified && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => setIsEditingBvn(true)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                    {isCurrentUser && !profile.bvn_verified && profile.correlation_id && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setOtpModalOpen(true)}
                        className="ml-2"
                      >
                        Verify
                      </Button>
                    )}
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
        <Dialog open={showPhoneVerify} onOpenChange={setShowPhoneVerify}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Verify Your Phone Number</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p>Enter the OTP sent to your phone number ({profile.phone_number})</p>
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
