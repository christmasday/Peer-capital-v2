import { createServerClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { cookies } from "next/headers"
import { notFound } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import {
  UserRound,
  Globe,
  Edit,
  Camera,
  Video,
  Calendar,
  MoreHorizontal,
  Settings,
  Sliders,
  Home,
  Rss,
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

// Import the PostItem component and getUserPosts function
import { PostItem } from "@/components/profile/post-item"
import { getUserPosts } from "@/lib/actions/posts"

export const dynamic = "force-dynamic"

export default async function UserProfilePage({
  params,
  searchParams,
}: {
  params: { userId: string }
  searchParams: { preview?: string; tab?: string }
}) {
  const { userId } = params
  const isPreviewMode = searchParams.preview === "true"
  const activeTab = searchParams.tab || "overview"

  // Add validation to prevent undefined userId being passed to queries
  if (!userId || userId === "undefined") {
    console.error("Invalid user ID provided:", userId)
    notFound()
  }

  const cookieStore = cookies()
  const supabase = createServerClient(cookieStore)
  const adminClient = createAdminClient()

  // Get current user session to determine if viewing own profile
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Check if this is the user's own profile in preview mode
  const isOwnProfileInPreviewMode = isPreviewMode && session?.user?.id === userId

  // For normal viewing
  const isOwnProfile = session?.user?.id === userId && !isPreviewMode
  const currentUserId = session?.user?.id

  // Try to get user profile with admin client to bypass RLS
  const { data: profile, error } = await adminClient.from("profiles").select("*").eq("id", userId).single()

  if (error || !profile) {
    console.error("Error fetching user profile:", error)
    notFound()
  }

  // Get followers and following counts
  const { data: followersCount } = await adminClient
    .from("user_connections")
    .select("id", { count: "exact" })
    .eq("following_id", userId)

  const { data: followingCount } = await adminClient
    .from("user_connections")
    .select("id", { count: "exact" })
    .eq("follower_id", userId)

  // Format name
  const fullName = `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || "User"

  // Default banner image if user doesn't have one
  const defaultBannerImage = "/banners/abstract-blue.png"
  const bannerImageUrl = profile.banner_image_url || defaultBannerImage

  // Fetch user's posts
  const { data: posts, error: postsError } = await getUserPosts(params.userId, 10)

  if (postsError) {
    console.error("Error fetching posts:", postsError)
  }

  const user = session?.user

  return (
    <div className="-mt-6">
      {/* Full-width Banner Image */}
      <div className="w-[100vw] relative left-[50%] right-[50%] -ml-[50vw] -mr-[50vw]">
        <div className="w-full h-64 bg-cover bg-center relative" style={{ backgroundImage: `url(${bannerImageUrl})` }}>
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/5"></div>

          {/* Profile header content - positioned absolutely to overlay on the banner */}
          <div className="container max-w-6xl relative h-full">
            <div className="absolute -bottom-24 left-6 flex items-end">
              <div className="relative">
                <div className="h-40 w-40 rounded-full border-4 border-white bg-white overflow-hidden shadow-lg">
                  <Avatar className="h-full w-full">
                    {profile.profile_picture_url ? (
                      <AvatarImage
                        src={profile.profile_picture_url || "/placeholder.svg"}
                        alt={fullName}
                        className="object-cover"
                      />
                    ) : (
                      <AvatarFallback className="text-6xl bg-blue-100">
                        <UserRound className="h-20 w-20 text-blue-500" />
                      </AvatarFallback>
                    )}
                  </Avatar>
                  {isOwnProfile && (
                    <button className="absolute bottom-0 right-0 bg-blue-600 p-2 rounded-full text-white hover:bg-blue-700">
                      <Camera className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Profile information section */}
      <div className="container max-w-6xl pt-28 pb-4">
        <div className="flex justify-between items-end mb-4">
          <div>
            <h1 className="text-3xl font-bold">{fullName}</h1>
            {/* Removed follower count from here */}
          </div>
          <div className="flex items-center gap-2">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <span className="mr-1">+</span> Add to story
            </Button>
            <Button variant="outline" className="bg-gray-200 border-gray-300 hover:bg-gray-300 text-black">
              <Edit className="h-4 w-4 mr-2" /> Edit profile
            </Button>
            <Button variant="outline" size="icon" className="bg-gray-200 border-gray-300 hover:bg-gray-300 text-black">
              <MoreHorizontal className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Navigation tabs */}
        <div className="border-b border-gray-300">
          <div className="flex space-x-1 overflow-x-auto">
            {[
              { name: "Posts", href: `?tab=overview`, active: activeTab === "overview" },
              { name: "About", href: `?tab=about`, active: activeTab === "about" },
              { name: "Friends", href: `?tab=friends`, active: activeTab === "friends" },
              { name: "Photos", href: `?tab=photos`, active: activeTab === "photos" },
              { name: "Videos", href: `?tab=videos`, active: activeTab === "videos" },
              { name: "Reels", href: `?tab=reels`, active: activeTab === "reels" },
              { name: "More", href: `?tab=more`, active: activeTab === "more" },
            ].map((tab) => (
              <Link
                key={tab.name}
                href={`/profile/${userId}${tab.href}`}
                className={cn(
                  "px-4 py-3 text-sm font-medium transition-colors inline-block",
                  tab.active
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100",
                )}
              >
                {tab.name}
              </Link>
            ))}
            <div className="flex-grow"></div>
            <Button variant="ghost" size="icon" className="text-gray-600">
              <MoreHorizontal className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Main content area with 2-column layout */}
        <div className="grid grid-cols-12 gap-4 mt-4">
          {/* Left sidebar - About section (4/12) */}
          <div className="col-span-4">
            <Card className="mb-4 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl">Intro</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 mb-4">{profile.bio || "xxx"}</p>
                {isOwnProfile && (
                  <Button variant="outline" className="w-full mb-4">
                    Edit bio
                  </Button>
                )}

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-gray-700">
                    <Home className="h-5 w-5 text-gray-500" />
                    <span>
                      Lives in {profile.city || "Lagos"}, {profile.state || "Nigeria"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <Rss className="h-5 w-5 text-gray-500" />
                    {/* Updated to display accurate follower count */}
                    <span>Followed by {followersCount?.count || 0} people</span>
                  </div>
                  {profile.website && (
                    <div className="flex items-center gap-2 text-gray-700">
                      <Globe className="h-5 w-5 text-gray-500" />
                      <a href={profile.website} className="text-blue-600 hover:underline">
                        linktr.ee/mr.obi
                      </a>
                    </div>
                  )}
                </div>

                {isOwnProfile && (
                  <Button variant="outline" className="w-full mt-4">
                    Edit details
                  </Button>
                )}
              </CardContent>
              <CardFooter className="pt-0">
                <div className="grid grid-cols-3 gap-1 mt-2 w-full">
                  <div className="aspect-square bg-gray-200 rounded overflow-hidden">
                    {profile.profile_picture_url ? (
                      <img
                        src={profile.profile_picture_url || "/placeholder.svg"}
                        alt="Profile thumbnail"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-300"></div>
                    )}
                  </div>
                </div>
              </CardFooter>
            </Card>
          </div>

          {/* Right content area (8/12) */}
          <div className="col-span-8">
            {/* Create post card */}
            <Card className="mb-4 shadow-sm">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-4">
                  <Avatar className="h-10 w-10">
                    {profile.profile_picture_url ? (
                      <AvatarImage src={profile.profile_picture_url || "/placeholder.svg"} alt={fullName} />
                    ) : (
                      <AvatarFallback className="bg-blue-100">
                        <UserRound className="h-5 w-5 text-blue-500" />
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="flex-grow">
                    <Textarea
                      placeholder="What's on your mind?"
                      className="resize-none border-gray-300 rounded-full h-10 pt-2"
                    />
                  </div>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between pt-1">
                  <Button variant="ghost" className="text-gray-700 hover:bg-gray-100 flex-1">
                    <Video className="h-5 w-5 mr-2 text-red-500" />
                    Live video
                  </Button>
                  <Button variant="ghost" className="text-gray-700 hover:bg-gray-100 flex-1">
                    <Camera className="h-5 w-5 mr-2 text-green-500" />
                    Photo/video
                  </Button>
                  <Button variant="ghost" className="text-gray-700 hover:bg-gray-100 flex-1">
                    <Calendar className="h-5 w-5 mr-2 text-blue-500" />
                    Life event
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Posts header */}
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Posts</h2>
              <div className="flex items-center gap-2">
                <Button variant="outline" className="text-gray-700 flex items-center gap-1">
                  <Sliders className="h-4 w-4" />
                  Filters
                </Button>
                <Button variant="outline" className="text-gray-700 flex items-center gap-1">
                  <Settings className="h-4 w-4" />
                  Manage posts
                </Button>
              </div>
            </div>

            {/* View toggle */}
            <Card className="mb-4 shadow-sm">
              <CardContent className="py-2">
                <div className="flex items-center">
                  <Button variant="ghost" className="text-blue-600 border-b-2 border-blue-600 rounded-none flex-1 py-2">
                    <Rss className="h-4 w-4 mr-2" />
                    List view
                  </Button>
                  <Button variant="ghost" className="text-gray-600 hover:bg-gray-100 rounded-none flex-1 py-2">
                    <div className="grid grid-cols-2 gap-0.5 mr-2">
                      <div className="w-1.5 h-1.5 bg-gray-600"></div>
                      <div className="w-1.5 h-1.5 bg-gray-600"></div>
                      <div className="w-1.5 h-1.5 bg-gray-600"></div>
                      <div className="w-1.5 h-1.5 bg-gray-600"></div>
                    </div>
                    Grid view
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Posts list */}
            {posts && posts.length > 0 ? (
              <div className="space-y-4">
                {posts.map((post) => (
                  <PostItem key={post.id} post={post} profile={profile} currentUserId={user?.id} />
                ))}
              </div>
            ) : (
              <Card className="shadow-sm">
                <CardContent className="py-12 text-center">
                  <p className="text-gray-500 mb-2">No posts yet</p>
                  <p className="text-sm text-gray-400">Posts will appear here once created</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
