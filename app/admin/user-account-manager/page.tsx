import { AdminProtected } from "@/components/auth/admin-protected"
import { UserAccountManager } from "@/components/admin/user-account-manager"
import { Users, Settings } from "lucide-react"

export default function UserAccountManagerPage() {
  return (
    <AdminProtected>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
        <div className="container mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
              <Users className="h-8 w-8 text-blue-400" />
              User Account Manager
            </h1>
            <p className="text-white/70 text-lg">
              Search, view, and manage user accounts across all systems
            </p>
          </div>
          <UserAccountManager />
        </div>
      </div>
    </AdminProtected>
  )
}
