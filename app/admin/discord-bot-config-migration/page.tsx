import type { Metadata } from "next"
import DiscordBotConfigMigration from "@/components/admin/discord-bot-config-migration"

export const metadata: Metadata = {
  title: "Discord Bot Config Migration - SCS Admin",
  description: "Run Discord bot configuration table migration",
}

export default function DiscordBotConfigMigrationPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Discord Bot Config Migration</h1>
          <p className="text-muted-foreground mt-2">
            Set up the Discord bot configuration table with proper constraints and default settings.
          </p>
        </div>

        <DiscordBotConfigMigration />
      </div>
    </div>
  )
}
