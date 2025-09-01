import { FixEaPlayerStatsSeasonIdMigration } from "@/components/admin/fix-ea-player-stats-season-id-migration"

export default function FixEaPlayerStatsSeasonIdPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fix EA Player Stats Season ID</h1>
          <p className="text-muted-foreground">Update all ea_player_stats records to have the correct season_id = 1</p>
        </div>

        <FixEaPlayerStatsSeasonIdMigration />
      </div>
    </div>
  )
}
