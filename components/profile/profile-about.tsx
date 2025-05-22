"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Briefcase, GraduationCap, MapPin, Phone, Mail, Heart, Calendar, User, Info, Edit } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { updateSocialMedia } from "@/lib/actions/profile"

interface ProfileAboutProps {
  profile: any
  isCurrentUser?: boolean
}

export function ProfileAbout({ profile, isCurrentUser = false }: ProfileAboutProps) {
  const router = useRouter()
  const [activeSection, setActiveSection] = useState("overview")
  const [isEditingContact, setIsEditingContact] = useState(false)
  const [socialMediaData, setSocialMediaData] = useState({
    facebook_url: profile.facebook_url || "",
    linkedin_url: profile.linkedin_url || "",
    twitter_url: profile.twitter_url || "",
    website: profile.website || "",
  })
  const [isSavingContact, setIsSavingContact] = useState(false)

  const sections = [
    { id: "overview", name: "Overview", icon: Info },
    { id: "work", name: "Work and education", icon: Briefcase },
    { id: "places", name: "Places lived", icon: MapPin },
    { id: "contact", name: "Contact and basic info", icon: Phone },
    { id: "details", name: "Details about you", icon: User },
  ]

  useEffect(() => {
    setSocialMediaData({
      facebook_url: profile.facebook_url || "",
      linkedin_url: profile.linkedin_url || "",
      twitter_url: profile.twitter_url || "",
      website: profile.website || "",
    })
  }, [profile])

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
                  {isCurrentUser && (
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" asChild>
                      <Link href="/profile/edit?tab=employment">
                        <Edit className="h-4 w-4" />
                      </Link>
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
                  <div>
                    <h3 className="text-lg font-medium">
                      Lives in {profile.city || "Not specified"}, {profile.state || "Not specified"}
                    </h3>
                    <p className="text-gray-600">{profile.address}</p>
                  </div>
                  {isCurrentUser && (
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" asChild>
                      <Link href="/profile/edit?tab=personal">
                        <Edit className="h-4 w-4" />
                      </Link>
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
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-medium">{profile.phone_number || "No phone number added"}</h3>
                    <p className="text-gray-600">Mobile</p>
                  </div>
                  {isCurrentUser && (
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" asChild>
                      <Link href="/profile/edit?tab=personal">
                        <Edit className="h-4 w-4" />
                      </Link>
                    </Button>
                  )}
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
                  <div>
                    <h3 className="text-lg font-medium">{profile.email || "No email added"}</h3>
                    <p className="text-gray-600">Email</p>
                  </div>
                  {isCurrentUser && (
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" asChild>
                      <Link href="/profile/edit?tab=personal">
                        <Edit className="h-4 w-4" />
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Relationship Status */}
            <div className="flex items-start gap-4">
              <div className="mt-1">
                <Heart className="h-10 w-10 p-2 bg-gray-100 text-gray-500 rounded-full" />
              </div>
              <div className="flex-grow">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-medium">{profile.relationship_status || "Single"}</h3>
                  </div>
                  {isCurrentUser && (
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" asChild>
                      <Link href="/profile/edit?tab=personal">
                        <Edit className="h-4 w-4" />
                      </Link>
                    </Button>
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
                  <div>
                    <h3 className="text-lg font-medium">
                      {profile.job_title && profile.employer_name
                        ? `${profile.job_title} at ${profile.employer_name}`
                        : profile.job_title
                          ? profile.job_title
                          : profile.employer_name
                            ? `Works at ${profile.employer_name}`
                            : "No work information added"}
                    </h3>
                    {profile.employer_address && <p className="text-gray-600">{profile.employer_address}</p>}
                    {profile.employment_status && <p className="text-gray-600">{profile.employment_status}</p>}
                    {profile.employment_start_date && (
                      <p className="text-gray-600">
                        Since {new Date(profile.employment_start_date).getFullYear()}
                        {profile.employment_end_date && ` to ${new Date(profile.employment_end_date).getFullYear()}`}
                      </p>
                    )}
                  </div>
                  {isCurrentUser && (
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" asChild>
                      <Link href="/profile/edit?tab=employment">
                        <Edit className="h-4 w-4" />
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <h2 className="text-xl font-medium mt-8">Education</h2>
            <div className="flex items-center gap-4 text-gray-500">
              <GraduationCap className="h-5 w-5" />
              <span>No education information added</span>
              {isCurrentUser && (
                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4 mr-2" /> Add education
                </Button>
              )}
            </div>
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
                  <div>
                    <h3 className="text-lg font-medium">
                      Lives in {profile.city || "Not specified"}, {profile.state || "Not specified"}
                    </h3>
                    <p className="text-gray-600">{profile.address}</p>
                    {profile.country && <p className="text-gray-600">{profile.country}</p>}
                  </div>
                  {isCurrentUser && (
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" asChild>
                      <Link href="/profile/edit?tab=personal">
                        <Edit className="h-4 w-4" />
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <h2 className="text-xl font-medium mt-8">Hometown</h2>
            <div className="flex items-center gap-4">
              {isCurrentUser && (
                <Button variant="outline">
                  <Edit className="h-4 w-4 mr-2" /> Add hometown
                </Button>
              )}
              {!isCurrentUser && <p className="text-gray-600">No hometown added</p>}
            </div>
          </div>
        )}

        {activeSection === "contact" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-medium">Contact and Basic Info</h2>
              {isCurrentUser && !isEditingContact && (
                <Button variant="ghost" size="sm" onClick={() => setIsEditingContact(true)}>
                  <Edit className="h-4 w-4 mr-2" /> Edit
                </Button>
              )}
            </div>

            {isEditingContact ? (
              <div className="space-y-4">
                <div>
                  <label htmlFor="facebook_url" className="block text-sm font-medium text-gray-700">Facebook Profile URL</label>
                  <input
                    type="url"
                    id="facebook_url"
                    name="facebook_url"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    value={socialMediaData.facebook_url}
                    onChange={handleSocialMediaChange}
                  />
                </div>
                <div>
                  <label htmlFor="linkedin_url" className="block text-sm font-medium text-gray-700">LinkedIn Profile URL</label>
                  <input
                    type="url"
                    id="linkedin_url"
                    name="linkedin_url"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    value={socialMediaData.linkedin_url}
                    onChange={handleSocialMediaChange}
                  />
                </div>
                <div>
                  <label htmlFor="twitter_url" className="block text-sm font-medium text-gray-700">Twitter Profile URL</label>
                  <input
                    type="url"
                    id="twitter_url"
                    name="twitter_url"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    value={socialMediaData.twitter_url}
                    onChange={handleSocialMediaChange}
                  />
                </div>
                <div>
                  <label htmlFor="website" className="block text-sm font-medium text-gray-700">Website URL</label>
                  <input
                    type="url"
                    id="website"
                    name="website"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    value={socialMediaData.website}
                    onChange={handleSocialMediaChange}
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={handleCancelEditContact} disabled={isSavingContact}>Cancel</Button>
                  <Button onClick={handleSaveContact} disabled={isSavingContact}>
                    {isSavingContact ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {profile.phone_number && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-gray-500" />
                    <span>{profile.phone_number}</span>
                  </div>
                )}
                {profile.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-gray-500" />
                    <span>{profile.email}</span>
                  </div>
                )}
                {profile.facebook_url && (
                  <div className="flex items-center gap-3">
                    <Info className="h-5 w-5 text-gray-500" />
                    <Link href={profile.facebook_url} target="_blank" className="text-blue-600 hover:underline">{profile.facebook_url}</Link>
                  </div>
                )}
                {profile.linkedin_url && (
                  <div className="flex items-center gap-3">
                    <Info className="h-5 w-5 text-gray-500" />
                    <Link href={profile.linkedin_url} target="_blank" className="text-blue-600 hover:underline">{profile.linkedin_url}</Link>
                  </div>
                )}
                {profile.twitter_url && (
                  <div className="flex items-center gap-3">
                    <Info className="h-5 w-5 text-gray-500" />
                    <Link href={profile.twitter_url} target="_blank" className="text-blue-600 hover:underline">{profile.twitter_url}</Link>
                  </div>
                )}
                {profile.website && (
                  <div className="flex items-center gap-3">
                    <Info className="h-5 w-5 text-gray-500" />
                    <Link href={profile.website} target="_blank" className="text-blue-600 hover:underline">{profile.website}</Link>
                  </div>
                )}

                {!profile.phone_number && !profile.email && !profile.facebook_url && !profile.linkedin_url && !profile.twitter_url && !profile.website && (
                  <div className="text-gray-500">No contact information available.</div>
                )}
              </div>
            )}
          </div>
        )}

        {activeSection === "details" && (
          <div className="space-y-6">
            <h2 className="text-xl font-medium">About You</h2>
            <div className="flex items-start gap-4">
              <div className="flex-grow">
                <p className="text-gray-700">{profile.bio || "No details to show"}</p>
                {isCurrentUser && !profile.bio && (
                  <Button variant="outline" className="mt-4">
                    <Edit className="h-4 w-4 mr-2" /> Add bio
                  </Button>
                )}
              </div>
            </div>

            <h2 className="text-xl font-medium mt-8">Name Pronunciation</h2>
            <div className="flex items-center gap-4 text-gray-500">
              <span>No name pronunciation added</span>
              {isCurrentUser && (
                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4 mr-2" /> Add pronunciation
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProfileAbout
