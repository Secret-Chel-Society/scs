import { FixEaPlayerStatsSeasonId } from "@/components/admin/fix-ea-player-stats-season-id"
import { Database, Gamepad2 } from "lucide-react"

export default function FixEaPlayerStatsSeasonIdPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="container mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <Database className="h-8 w-8 text-purple-400" />
            Fix EA Player Stats Season ID
          </h1>
          <p className="text-white/70 text-lg">
            Fix EA player stats season ID data and configurations
          </p>
        </div>
        <FixEaPlayerStatsSeasonId />
      </div>
    </div>
  )
}
