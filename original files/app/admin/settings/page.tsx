import type { Metadata } from "next"
import { AdminSettingsPageClient } from "./AdminSettingsPageClient"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Admin Settings | SCS",
  description: "Manage system settings for the Secret Chel Society",
}

export default function AdminSettingsPage() {
  return <AdminSettingsPageClient />
}
