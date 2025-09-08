import type { Metadata } from "next"
import FixDiscordConnectionsMigration from "@/components/admin/fix-discord-connections-migration"

export const metadata: Metadata = {
  title: "Fix Discord Connections Migration - SCS Admin",
  description: "Fix Discord connection issues in the database",
}

export default function FixDiscordConnectionsMigrationPage() {
  return <FixDiscordConnectionsMigration />
}
