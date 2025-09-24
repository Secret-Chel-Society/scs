import type { Metadata } from "next"
import EnsureDiscordTablesMigration from "@/components/admin/ensure-discord-tables-migration"

export const metadata: Metadata = {
  title: "Ensure Discord Tables Migration - MGHL Admin",
  description: "Create and configure Discord integration tables",
}

export default function EnsureDiscordTablesMigrationPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Ensure Discord Tables Migration</h1>
          <p className="text-muted-foreground mt-2">
            Create all necessary Discord integration tables and configure them properly.
          </p>
        </div>

        <EnsureDiscordTablesMigration />
      </div>
    </div>
  )
}
