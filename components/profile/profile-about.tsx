"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Briefcase, GraduationCap, MapPin, Phone, Mail, Heart, Calendar, User, Info, Edit } from "lucide-react"
import Link from "next/link"

interface ProfileAboutProps {
  profile: any
  isCurrentUser?: boolean
}

export function ProfileAbout({ profile, isCurrentUser = false }: ProfileAboutProps) {
  const [activeSection, setActiveSection] = useState("overview")

  const sections = [
    { id: "overview", name: "Overview", icon: Info },
    { id: "work", name: "Work and education", icon: Briefcase },
    { id: "places", name: "Places lived", icon: MapPin },
    { id: "contact", name: "Contact and basic info", icon: Phone },
    { id: "relationships", name: "Family and relationships", icon: Heart },
    { id: "details", name: "Details about you", icon: User },
    { id: "events", name: "Life events", icon: Calendar },
  ]

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
            <h2 className="text-xl font-medium">Contact Info</h2>

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

            <h2 className="text-xl font-medium mt-8">Websites and Social Links</h2>
            <div className="flex items-center gap-4">
              {profile.website ? (
                <div className="flex-grow">
                  <a href={profile.website} className="text-blue-600 hover:underline">
                    {profile.website}
                  </a>
                </div>
              ) : (
                <div className="flex items-center gap-4 text-gray-500">
                  <span>No websites added</span>
                  {isCurrentUser && (
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-2" /> Add website
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {activeSection === "relationships" && (
          <div className="space-y-6">
            <h2 className="text-xl font-medium">Relationship</h2>
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

            <h2 className="text-xl font-medium mt-8">Family Members</h2>
            <div className="flex items-center gap-4 text-gray-500">
              <span>No family members to show</span>
              {isCurrentUser && (
                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4 mr-2" /> Add family member
                </Button>
              )}
            </div>
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

        {activeSection === "events" && (
          <div className="space-y-6">
            <h2 className="text-xl font-medium">Life Events</h2>

            <div className="p-4 text-center text-gray-500 border border-dashed rounded-lg">
              <p>No life events to show</p>
              {isCurrentUser && (
                <Button variant="outline" className="mt-4">
                  <Edit className="h-4 w-4 mr-2" /> Add life event
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
