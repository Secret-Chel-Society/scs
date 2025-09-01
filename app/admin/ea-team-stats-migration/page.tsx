import { EaTeamStatsMigration } from "@/components/admin/ea-team-stats-migration"
import { PageHeader } from "@/components/ui/page-header"

export default function EaTeamStatsMigrationPage() {
  return (
    <div className="container mx-auto py-6 space-y-8">
      <PageHeader
        heading="EA Team Stats Migration"
        subheading="Create a table to store team-level statistics from EA Sports NHL matches"
      />
      <EaTeamStatsMigration />
    </div>
  )
}
