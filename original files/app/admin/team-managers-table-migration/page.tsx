import { PageHeader } from "@/components/ui/page-header"
import { TeamManagersTableMigration } from "@/components/admin/team-managers-table-migration"

export default function TeamManagersTableMigrationPage() {
  return (
    <div className="container py-6">
      <PageHeader heading="Team Managers Table Migration" text="Create the team_managers table if it doesn't exist" />
      <div className="mt-6">
        <TeamManagersTableMigration />
      </div>
    </div>
  )
}
