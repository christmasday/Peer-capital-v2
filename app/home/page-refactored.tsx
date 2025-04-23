import Image from "next/image"
import { Bell } from "lucide-react"
import { Input } from "@/components/ui/input"
import { AccountCard } from "@/components/account/account-card"
import { HelperCard } from "@/components/helpers/helper-card"
import { BottomNav } from "@/components/navigation/bottom-nav"
import { getUserProfile } from "@/lib/actions/auth"

export default async function HomePage() {
  // Get the user profile which includes account balance
  const userProfile = await getUserProfile()

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Status Bar - Mobile Only */}
      <div className="flex justify-between items-center p-4 bg-gray-50 text-black md:hidden">
        <div className="text-lg font-bold">9:41</div>
        <div className="flex items-center gap-1">
          <div className="h-4 w-4">
            <svg viewBox="0 0 24 24" className="h-full w-full">
              <path
                fill="currentColor"
                d="M12.33 4.67c1.98 0 3.95.8 5.38 2.23 1.41 1.41 2.24 3.3 2.29 5.32.04 1.31-.2 2.7-.86 3.93-.6 1.12-1.39 1.94-2.4 2.66-.4.29-.8.53-1.21.72-.21.09-.42.17-.63.24-.36.12-.71.22-1.08.29-.31.06-.62.1-.93.12-.2.01-.4.02-.6.02-.31 0-.61-.03-.91-.07-.5-.07-.98-.18-1.45-.34-.38-.13-.76-.29-1.12-.48-.9-.47-1.72-1.12-2.38-1.97-.66-.85-1.13-1.88-1.34-2.98-.08-.41-.12-.83-.12-1.25 0-.44.04-.87.13-1.29.14-.67.37-1.29.68-1.87.31-.57.7-1.1 1.17-1.55 1.43-1.37 3.39-2.15 5.38-2.15m0-2c-4.51 0-8.19 3.65-8.19 8.15 0 6.18 5.68 11.21 7.27 12.48.23.19.49.37.79.37.3 0 .56-.18.79-.37 1.59-1.27 7.27-6.3 7.27-12.48 0-4.5-3.68-8.15-8.19-8.15z"
              />
            </svg>
          </div>
          <div className="h-4 w-4">
            <svg viewBox="0 0 24 24" className="h-full w-full">
              <path
                fill="currentColor"
                d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z"
              />
            </svg>
          </div>
          <div className="h-4 w-6 relative">
            <div className="absolute inset-0 border-2 border-black rounded-sm"></div>
            <div className="absolute inset-y-0 left-0 right-1 bg-black rounded-sm m-0.5"></div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 max-w-md mx-auto w-full px-4 pb-20">
        {/* Header */}
        <div className="flex justify-between items-center py-6">
          <div className="flex items-center gap-4">
            <div className="relative h-16 w-16 rounded-full overflow-hidden">
              <Image
                src={userProfile.profile?.profile_picture_url || "/placeholder.svg?height=100&width=100"}
                alt="Profile"
                fill
                className="object-cover"
              />
            </div>
            <h1 className="text-2xl font-bold text-blue-700">Hi, {userProfile.profile?.first_name || "User"}</h1>
          </div>
          <button className="p-2 relative">
            <Bell className="h-6 w-6 text-gray-700" />
            <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
          </button>
        </div>

        {/* Account Card */}
        <AccountCard balance={userProfile.account?.balance || 0} loanBalance={userProfile.account?.loan_balance || 0} />

        {/* Search Input */}
        <div className="mb-8">
          <Input
            placeholder="How much do you want?"
            className="w-full py-6 px-6 text-lg border-2 rounded-full text-center text-gray-400"
          />
        </div>

        {/* Top Helpers */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-blue-700 mb-6">Top Helpers</h2>

          {/* Helper Cards */}
          <HelperCard
            id="1"
            name="Ada Ada"
            interestRate="0.2%"
            maxLoan="2,000,000"
            loanIssued="80"
            amountIssued="N50M"
            profileImage="/placeholder.svg?height=100&width=100"
          />

          <HelperCard
            id="2"
            name="Don Halbert"
            interestRate="0.4%"
            maxLoan="5,500,000"
            loanIssued="60"
            amountIssued="N35M"
            profileImage="/placeholder.svg?height=100&width=100"
          />
        </div>
      </main>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  )
}
