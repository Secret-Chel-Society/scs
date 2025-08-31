import { SyncMissingUsers } from "@/components/admin/sync-missing-users"
import { Users, Search } from "lucide-react"

export default function SyncMissingUsersPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="container mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <Users className="h-8 w-8 text-green-400" />
            Sync Missing Users
          </h1>
          <p className="text-white/70 text-lg">
            Find and sync users who exist in Supabase Auth but are missing from the users table.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <SyncMissingUsers />
        </div>
      </div>
    </div>
  )
}
