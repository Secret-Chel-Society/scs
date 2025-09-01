import type { Metadata } from "next"
import NotificationColumnsMigration from "@/components/admin/notification-columns-migration"

export const metadata: Metadata = {
  title: "Add Notification Columns Migration",
  description: "Add avatar_url and notification preference columns to the users table",
}

export default function NotificationColumnsMigrationPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Add Notification Columns Migration</h1>
      <NotificationColumnsMigration />
    </div>
  )
}
