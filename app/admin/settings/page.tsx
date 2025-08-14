import type { Metadata } from "next"
import { AdminSettingsPageClient } from "./AdminSettingsPageClient"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Admin Settings | MGHL",
  description: "Manage system settings for the Major Gaming Hockey League",
}

export default function AdminSettingsPage() {
  return <AdminSettingsPageClient />
}
