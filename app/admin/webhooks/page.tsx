import { WebhookEventsLog } from "@/components/admin/webhook-events-log"

export default function WebhooksPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Webhook Events</h1>
      <WebhookEventsLog />
    </div>
  )
}
