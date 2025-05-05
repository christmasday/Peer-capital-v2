import { CreateVirtualAccountsTableButton } from "@/components/admin/create-virtual-accounts-table-button"
import { UpdateVirtualAccountsTableButton } from "@/components/admin/update-virtual-accounts-table-button"
import { CreateWebhookEventsTableButton } from "@/components/admin/create-webhook-events-table-button"

export default function MigrationsPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Database Migrations</h1>

      <div className="space-y-8">
        <div className="p-4 border rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Virtual Accounts</h2>
          <div className="space-y-4">
            <CreateVirtualAccountsTableButton />
            <UpdateVirtualAccountsTableButton />
          </div>
        </div>

        <div className="p-4 border rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Webhook Events</h2>
          <div className="space-y-4">
            <CreateWebhookEventsTableButton />
          </div>
        </div>

        {/* Other migration sections */}
      </div>
    </div>
  )
}
