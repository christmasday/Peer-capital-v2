import { CreateVirtualAccountsTableButton } from "@/components/admin/create-virtual-accounts-table-button"
import { UpdateVirtualAccountsTableButton } from "@/components/admin/update-virtual-accounts-table-button"
import { CreateWebhookEventsTableButton } from "@/components/admin/create-webhook-events-table-button"
import CreateCheckTableExistsFunctionButton from "@/components/admin/create-check-table-exists-function-button"
import { CreateExecuteSqlFunctionButton } from "@/components/admin/create-execute-sql-function-button"
import { CreatePasswordResetTokensTableButton } from "@/components/admin/create-password-reset-tokens-table-button"

export default function MigrationsPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Database Migrations</h1>

      <div className="space-y-8">
        <div className="p-4 border rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Database Functions</h2>
          <div className="space-y-4">
            <p className="text-sm text-gray-500 mb-4">
              These functions are required for other migrations to work properly. Please create them in order.
            </p>
            <CreateExecuteSqlFunctionButton />
            <CreateCheckTableExistsFunctionButton />
          </div>
        </div>

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

        <div className="p-4 border rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Password Reset Tokens</h2>
          <div className="space-y-4">
            <CreatePasswordResetTokensTableButton />
          </div>
        </div>

        {/* Other migration sections */}
      </div>
    </div>
  )
}
