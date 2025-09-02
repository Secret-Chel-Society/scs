import { PlayerAwardsMigration } from "@/components/admin/player-awards-migration"
import { PageHeader } from "@/components/ui/page-header"

export default function PlayerAwardsMigrationPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <PageHeader heading="Player Awards Migration" subheading="Create the player_awards table in the database" />
      <PlayerAwardsMigration />
    </div>
  )
}
