
import { ActivityTimeline } from "@/components/profile/activity-timeline";
import { checkAuth } from "@/lib/auth-utils";
import { getUserProfile } from "@/lib/actions/auth";

export const dynamic = "force-dynamic";

export default async function ActivityLogPage() {
  await checkAuth();
  const userProfile = await getUserProfile();
  if (!userProfile) return null;
  const userId = userProfile.user?.id;
  // Don't render MainLayout here—layout wraps this component
  return (
    <div className="max-w-3xl mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Activity Log</h1>
      <ActivityTimeline userId={userId} />
    </div>
  );
} 
