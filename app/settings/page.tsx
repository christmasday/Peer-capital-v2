import { MainLayout } from "@/components/layouts/main-layout";
import { ChangePasswordForm } from "@/components/profile/change-password-form";
import { getUserProfile } from "@/lib/actions/auth";
import { checkAuth } from "@/lib/auth-utils";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  await checkAuth();
  const userProfile = await getUserProfile();
  if (!userProfile) return null;
  const fullName = `${userProfile.profile?.first_name || ""} ${userProfile.profile?.last_name || ""}`.trim() || "User";
  const userImage = userProfile.profile?.profile_picture_url || "/vibrant-street-market.png";

  return (
    <MainLayout userName={fullName} userImage={userImage}>
      <div className="max-w-5xl mx-auto py-10 flex gap-8">
        {/* Sidebar */}
        <aside className="w-64 flex-shrink-0">
          <nav className="flex flex-col gap-2">
            <Link href="/settings" className="px-4 py-2 rounded-lg bg-blue-50 text-blue-700 font-medium">Change Password</Link>
            <Link href="/privacy-center" className="px-4 py-2 rounded-lg bg-gray-50 text-gray-700 font-medium">Privacy Center</Link>
          </nav>
        </aside>
        {/* Main Content */}
        <section className="flex-1">
          <h1 className="text-2xl font-bold mb-6">Settings</h1>
          <div className="max-w-lg">
            <ChangePasswordForm />
          </div>
        </section>
      </div>
    </MainLayout>
  );
} 