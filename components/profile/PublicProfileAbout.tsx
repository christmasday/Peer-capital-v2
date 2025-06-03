"use client"
import { useState, useEffect } from "react"
import { Briefcase, MapPin, Phone, User, Info, Mail, GraduationCap } from "lucide-react"

export default function PublicProfileAbout({ profile, initialSection }: { profile: any, initialSection?: string }) {
  const [activeSection, setActiveSection] = useState<string>(initialSection || "overview")
  useEffect(() => {
    if (initialSection === "about") {
      setActiveSection("overview");
    } else if (initialSection) {
      setActiveSection(initialSection);
    }
  }, [initialSection]);
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Left sidebar with About tab section links */}
      <div className="space-y-1">
        <h2 className="text-xl font-bold mb-4">About</h2>
        <button onClick={() => setActiveSection("overview")}
          className={`w-full text-left px-3 py-2 rounded-md flex items-center ${activeSection === "overview" ? "bg-blue-100 text-blue-600" : "hover:bg-gray-100 text-gray-700"}`}
        >
          <Info className="h-5 w-5 mr-3" /> Overview
        </button>
        <button onClick={() => setActiveSection("work")}
          className={`w-full text-left px-3 py-2 rounded-md flex items-center ${activeSection === "work" ? "bg-blue-100 text-blue-600" : "hover:bg-gray-100 text-gray-700"}`}
        >
          <Briefcase className="h-5 w-5 mr-3" /> Work and education
        </button>
        <button onClick={() => setActiveSection("places")}
          className={`w-full text-left px-3 py-2 rounded-md flex items-center ${activeSection === "places" ? "bg-blue-100 text-blue-600" : "hover:bg-gray-100 text-gray-700"}`}
        >
          <MapPin className="h-5 w-5 mr-3" /> Places lived
        </button>
        <button onClick={() => setActiveSection("contact")}
          className={`w-full text-left px-3 py-2 rounded-md flex items-center ${activeSection === "contact" ? "bg-blue-100 text-blue-600" : "hover:bg-gray-100 text-gray-700"}`}
        >
          <Phone className="h-5 w-5 mr-3" /> Contact and basic info
        </button>
        <button onClick={() => setActiveSection("details")}
          className={`w-full text-left px-3 py-2 rounded-md flex items-center ${activeSection === "details" ? "bg-blue-100 text-blue-600" : "hover:bg-gray-100 text-gray-700"}`}
        >
          <User className="h-5 w-5 mr-3" /> Details about you
        </button>
      </div>
      {/* Right content area */}
      <div className="md:col-span-2 space-y-8">
        {activeSection === "overview" && (
          <section>
            <h2 className="text-xl font-bold mb-4">About</h2>
            <div className="text-gray-700 text-base">
              {profile.bio ? profile.bio : <span className="text-gray-400">No bio provided.</span>}
            </div>
          </section>
        )}
        {activeSection === "work" && (
          <section>
            <h2 className="text-lg font-semibold mb-2 flex items-center gap-2"><Briefcase className="h-5 w-5" /> Work and Education</h2>
            <div className="text-gray-700 space-y-1">
              {profile.job_title && profile.employer_name ? (
                <div>{profile.job_title} at {profile.employer_name}</div>
              ) : profile.job_title ? (
                <div>{profile.job_title}</div>
              ) : profile.employer_name ? (
                <div>Works at {profile.employer_name}</div>
              ) : (
                <div>No work information provided</div>
              )}
              {profile.employer_address && <div className="text-gray-500">{profile.employer_address}</div>}
              {profile.employment_status && <div className="text-gray-500">{profile.employment_status}</div>}
              {(profile.school_name || profile.degree || profile.field_of_study || profile.graduation_year) && (
                <div className="mt-6 border-t border-gray-200 pt-4">
                  <div className="flex items-center gap-2"><GraduationCap className="h-5 w-5" /> Education</div>
                  <div className="ml-7">
                    {profile.degree && profile.field_of_study ? (
                      <div>{profile.degree} in {profile.field_of_study}</div>
                    ) : profile.degree ? (
                      <div>{profile.degree}</div>
                    ) : profile.field_of_study ? (
                      <div>{profile.field_of_study}</div>
                    ) : null}
                    {profile.school_name && <div className="text-gray-500">{profile.school_name}</div>}
                    {profile.graduation_year && <div className="text-gray-500">Graduated in {profile.graduation_year}</div>}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}
        {activeSection === "places" && (
          <section>
            <h2 className="text-lg font-semibold mb-2 flex items-center gap-2"><MapPin className="h-5 w-5" /> Places Lived</h2>
            <div className="text-gray-700">
              {(profile.city || profile.state) ? (
                <div>Lives in {profile.city || "-"}{profile.city && profile.state ? ", " : ""}{profile.state || "-"}</div>
              ) : (
                <div>No location information provided</div>
              )}
              {profile.address && <div className="text-gray-500">{profile.address}</div>}
            </div>
          </section>
        )}
        {activeSection === "contact" && (
          <section>
            <h2 className="text-lg font-semibold mb-2 flex items-center gap-2"><Phone className="h-5 w-5" /> Contact Info</h2>
            <div className="text-gray-700 space-y-1">
              {profile.email && <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-gray-500" /> <span>{profile.email}</span></div>}
              {profile.facebook_url && <div className="flex items-center gap-2"><Info className="h-4 w-4 text-gray-500" /><a href={profile.facebook_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{profile.facebook_url}</a></div>}
              {profile.linkedin_url && <div className="flex items-center gap-2"><Info className="h-4 w-4 text-gray-500" /><a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{profile.linkedin_url}</a></div>}
              {profile.twitter_url && <div className="flex items-center gap-2"><Info className="h-4 w-4 text-gray-500" /><a href={profile.twitter_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{profile.twitter_url}</a></div>}
              {profile.website && <div className="flex items-center gap-2"><Info className="h-4 w-4 text-gray-500" /><a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{profile.website}</a></div>}
              {!profile.email && !profile.facebook_url && !profile.linkedin_url && !profile.twitter_url && !profile.website && (
                <div className="text-gray-500">No contact information available.</div>
              )}
            </div>
          </section>
        )}
        {activeSection === "details" && (
          <section>
            <h2 className="text-lg font-semibold mb-2 flex items-center gap-2"><User className="h-5 w-5" /> Details About You</h2>
            <div className="text-gray-700">
              {profile.bio ? (
                <div>{profile.bio}</div>
              ) : (
                <div>No additional details provided</div>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  )
} 