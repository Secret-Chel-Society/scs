import { EaPlayerStatsColumnsMigration } from "@/components/admin/ea-player-stats-columns-migration"

export default function EaPlayerStatsColumnsPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">EA Player Stats Columns Migration</h1>
      <EaPlayerStatsColumnsMigration />
    </div>
  )
}
