import { TeamSeasonManager } from "@/components/admin/team-season-manager"

export default function TeamSeasonsPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Team Season Management</h1>
        <p className="text-muted-foreground mt-2">Manage which teams participate in each season</p>
      </div>

      <TeamSeasonManager />
    </div>
  )
}
