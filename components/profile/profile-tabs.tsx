"use client"

import { useCallback, useEffect, useState, useTransition } from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import dynamic from "next/dynamic"
import { MoreHorizontal, Info, Users, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type TabId = "about" | "contacts" | "loan-requests"

interface ProfileTabsProps {
  initialTab?: TabId
  aboutContent: React.ReactNode
  currentUserId: string
  highlight?: string
}

const TAB_DEFS: { id: TabId; name: string; href: string; icon: React.ElementType }[] = [
  { id: "about", name: "About", href: "/profile?tab=about", icon: Info },
  { id: "contacts", name: "Contacts", href: "/profile?tab=contacts", icon: Users },
  { id: "loan-requests", name: "Loan Requests", href: "/profile?tab=loan-requests", icon: FileText },
]

// Lightweight skeleton shown instantly while a tab's content is being prepared.
function TabSkeleton({ label }: { label: string }) {
  return (
    <div className="space-y-3 animate-pulse" aria-busy="true" aria-live="polite">
      <div className="h-4 w-32 bg-gray-200 rounded" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="p-4 border rounded-lg space-y-3">
            <div className="h-12 w-12 rounded-full bg-gray-200" />
            <div className="h-4 w-3/4 bg-gray-200 rounded" />
            <div className="h-3 w-1/2 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
      <p className="text-sm text-gray-400 text-center pt-2">{label}…</p>
    </div>
  )
}

// Lazy load heavy lists. ssr:false keeps them out of the initial bundle so the
// first render is fast and they only load when the user actually visits a tab.
const ContactsList = dynamic(
  () => import("@/components/profile/contacts-list").then((m) => m.ContactsList),
  {
    ssr: false,
    loading: () => <TabSkeleton label="Loading contacts" />,
  },
)

const LoanRequestsList = dynamic(
  () => import("@/components/loans/LoanRequestsList").then((m) => m.LoanRequestsList),
  {
    ssr: false,
    loading: () => <TabSkeleton label="Loading loan requests" />,
  },
)

export function ProfileTabs({ initialTab = "about", aboutContent, currentUserId, highlight }: ProfileTabsProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()
  const [activeTab, setActiveTab] = useState<TabId>(initialTab)
  // Track which tabs have been mounted so we can keep their rendered content
  // (and any internal state) cached when the user switches between tabs.
  const [mountedTabs, setMountedTabs] = useState<Record<TabId, boolean>>({
    "about": true,
    "contacts": initialTab === "contacts",
    "loan-requests": initialTab === "loan-requests",
  })

  // When the user navigates back/forward or shares a deep link, sync state.
  useEffect(() => {
    const tab = (searchParams?.get("tab") as TabId | null) || "about"
    if (tab !== activeTab) {
      setActiveTab(tab)
      setMountedTabs((prev) => ({ ...prev, [tab]: true }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const handleTabChange = useCallback(
    (tab: TabId) => {
      if (tab === activeTab) return
      setActiveTab(tab)
      setMountedTabs((prev) => (prev[tab] ? prev : { ...prev, [tab]: true }))

      // Update the URL in place without triggering a server round-trip.
      // router.replace + scroll:false keeps tab switches instant while
      // still letting the page be shareable via its URL.
      const params = new URLSearchParams(searchParams?.toString() || "")
      if (tab === "about") {
        params.delete("tab")
      } else {
        params.set("tab", tab)
      }
      const qs = params.toString()
      const url = qs ? `${pathname}?${qs}` : pathname
      startTransition(() => {
        router.replace(url, { scroll: false })
      })
    },
    [activeTab, pathname, router, searchParams],
  )

  // Prefetch the tab content when the user hovers/focuses a tab. This warms
  // up the dynamic import chunk so the switch feels instant.
  const prefetchTab = useCallback((tab: TabId) => {
    if (tab === "contacts") {
      void import("@/components/profile/contacts-list")
    } else if (tab === "loan-requests") {
      void import("@/components/loans/LoanRequestsList")
    }
  }, [])

  return (
    <div>
      {/* Tabs */}
      <div className="border-b border-gray-300 mb-6">
        <div
          className="flex space-x-1 overflow-x-auto justify-center"
          role="tablist"
          aria-label="Profile sections"
        >
          {TAB_DEFS.map((tab) => (
            <Link
              key={tab.id}
              href={tab.href}
              role="tab"
              aria-selected={activeTab === tab.id}
              prefetch={true}
              onMouseEnter={() => prefetchTab(tab.id)}
              onFocus={() => prefetchTab(tab.id)}
              onClick={(e) => {
                e.preventDefault()
                handleTabChange(tab.id)
              }}
              className={cn(
                "px-4 py-3 text-sm font-medium transition-colors inline-block select-none",
                activeTab === tab.id
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100",
              )}
            >
              {tab.name}
            </Link>
          ))}
          <div className="flex-grow"></div>
          <Button variant="ghost" size="icon" className="text-gray-600" aria-label="More options">
            <MoreHorizontal className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Tab panels - all panels stay mounted once visited to preserve
          component state and feel snappy when switching back. */}
      <div role="tabpanel" hidden={activeTab !== "about"}>
        {mountedTabs["about"] ? aboutContent : null}
      </div>

      {mountedTabs["contacts"] && (
        <div role="tabpanel" hidden={activeTab !== "contacts"}>
          <ContactsList currentUserId={currentUserId} />
        </div>
      )}

      {mountedTabs["loan-requests"] && (
        <div role="tabpanel" hidden={activeTab !== "loan-requests"}>
          <div className="lg:col-span-12">
            <h2 className="text-xl font-bold mb-4">All Loan Requests</h2>
            <LoanRequestsList
              loanRequests={[]}
              currentUserId={currentUserId}
              showAdminActions
              highlight={highlight}
            />
          </div>
        </div>
      )}
    </div>
  )
}
