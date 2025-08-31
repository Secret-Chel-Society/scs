import { OrphanedAuthUsersManager } from "@/components/admin/orphaned-auth-users-manager"
import { Users, AlertTriangle } from "lucide-react"

export default function OrphanedAuthUsersPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="container mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <Users className="h-8 w-8 text-orange-400" />
            Orphaned Auth Users
          </h1>
          <p className="text-white/70 text-lg">
            Manage users who exist in Auth but not in the database
          </p>
        </div>
        <OrphanedAuthUsersManager />
      </div>
    </div>
  )
}
