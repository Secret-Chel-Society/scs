import { EnsureDiscordTablesMigration } from "@/components/admin/ensure-discord-tables-migration"
import { Database, MessageSquare } from "lucide-react"

export default function EnsureDiscordTablesMigrationPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="container mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <Database className="h-8 w-8 text-indigo-400" />
            Ensure Discord Tables Migration
          </h1>
          <p className="text-white/70 text-lg">
            Ensure Discord tables are properly configured
          </p>
        </div>
        <EnsureDiscordTablesMigration />
      </div>
    </div>
  )
}
