import { UpdateEaPlayerStatsSeasonMigration } from "@/components/admin/update-ea-player-stats-season-migration"
import { Gamepad2, RefreshCw } from "lucide-react"

export default function UpdateEaPlayerStatsSeasonPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="container mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <Gamepad2 className="h-8 w-8 text-purple-400" />
            Update EA Player Stats Season ID
          </h1>
          <p className="text-white/70 text-lg">
            Update season IDs for EA player statistics
          </p>
        </div>
        <UpdateEaPlayerStatsSeasonMigration />
      </div>
    </div>
  )
}
