import { AdminProtected } from "@/components/auth/admin-protected"
import { UserAccountManager } from "@/components/admin/user-account-manager"
import { Users } from "lucide-react"

export default function UserAccountManagerPage() {
  return (
    <AdminProtected>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        {/* Header */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10" />
          <div className="relative container mx-auto px-4 py-8">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl">
                <Users className="h-8 w-8 text-blue-400" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  User Account Manager
                </h1>
                <p className="text-white/70 mt-1">Search, view, and manage user accounts across all systems</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 pb-8">
          <UserAccountManager />
        </div>
      </div>
    </AdminProtected>
  )
}
