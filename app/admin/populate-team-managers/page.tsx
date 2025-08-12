import { PopulateTeamManagersMigration } from "@/components/admin/populate-team-managers-migration"

export default function PopulateTeamManagersPage() {
  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">Populate Team Managers</h1>
      <PopulateTeamManagersMigration />
    </div>
  )
}
