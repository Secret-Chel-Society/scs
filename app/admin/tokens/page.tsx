import { TokenManagement } from "@/components/admin/token-management"
import { Key, Coins } from "lucide-react"

export default function AdminTokensPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="container mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <Key className="h-8 w-8 text-yellow-400" />
            Token Management
          </h1>
          <p className="text-white/70 text-lg">
            Manage verification tokens and system access keys
          </p>
        </div>

        <TokenManagement />
      </div>
    </div>
  )
}
