import { RbacDebugger } from "@/components/admin/rbac-debugger"
import { Shield, Bug } from "lucide-react"

export default function RbacDebugPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="container mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <Shield className="h-8 w-8 text-purple-400" />
            RBAC Permission Debugger
          </h1>
          <p className="text-white/70 text-lg">
            Test and debug role-based access control permissions for match management
          </p>
        </div>
        <RbacDebugger />
      </div>
    </div>
  )
}
