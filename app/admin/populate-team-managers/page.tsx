import { PopulateTeamManagers } from "@/components/admin/populate-team-managers"
import { Database, Users } from "lucide-react"

export default function PopulateTeamManagersPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="container mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <Database className="h-8 w-8 text-green-400" />
            Populate Team Managers
          </h1>
          <p className="text-white/70 text-lg">
            Populate team managers data from existing team information
          </p>
        </div>
        <PopulateTeamManagers />
      </div>
    </div>
  )
}
