import { OrphanedUserFinder } from "@/components/admin/orphaned-user-finder"
import { Users, AlertTriangle } from "lucide-react"

export default function OrphanedUsersPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="container mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <Users className="h-8 w-8 text-red-400" />
            Orphaned User Management
          </h1>
          <p className="text-white/70 text-lg">
            Find and fix users that exist in Supabase Auth but not in your database, or vice versa
          </p>
        </div>

        <OrphanedUserFinder />
      </div>
    </div>
  )
}
