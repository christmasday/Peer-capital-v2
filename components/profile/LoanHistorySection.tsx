import { createAdminClient } from "@/lib/supabase/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export async function LoanHistorySection({ userId }: { userId: string }) {
  const adminClient = createAdminClient();
  const { data: loans, error } = await adminClient
    .from("loan_requests")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    return <div className="text-red-500">Error loading loan history.</div>;
  }

  if (!loans || loans.length === 0) {
    return <div className="text-gray-500">No loan history found.</div>;
  }

  return (
    <div className="space-y-4">
      {loans.map((loan: any) => (
        <Card key={loan.id}>
          <CardHeader>
            <CardTitle>
              ₦{loan.amount?.toLocaleString()} - {loan.status}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div>Duration: {loan.duration_months} months</div>
            <div>Interest: {loan.interest_rate}%</div>
            <div>Purpose: {loan.purpose}</div>
            <div>Requested: {new Date(loan.created_at).toLocaleDateString()}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
} 