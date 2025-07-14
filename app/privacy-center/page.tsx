import { MainLayout } from "@/components/layouts/main-layout";
import { getUserProfile } from "@/lib/actions/auth";
import { checkAuth } from "@/lib/auth-utils";
import PrivacyCenterClient from "./privacy-center-client";

export const dynamic = "force-dynamic";

export default async function PrivacyCenterPage() {
  await checkAuth();
  const userProfile = await getUserProfile();
  if (!userProfile) return null;
  const fullName = `${userProfile.profile?.first_name || ""} ${userProfile.profile?.last_name || ""}`.trim() || "User";
  const userImage = userProfile.profile?.profile_picture_url || "/vibrant-street-market.png";

  return (
    <MainLayout userName={fullName} userImage={userImage}>
      <PrivacyCenterClient fullName={fullName} userImage={userImage} />
    </MainLayout>
  );
} 