import { ManualWaiverProcessor } from "@/components/admin/manual-waiver-processor"
import { Clock, Users } from "lucide-react"

export default function WaiverManagementPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="container mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <Clock className="h-8 w-8 text-orange-400" />
            Waiver Management
          </h1>
          <p className="text-white/70 text-lg">
            Manage player waivers and claims
          </p>
        </div>
        <div className="grid gap-6">
          <ManualWaiverProcessor />
          {/* Other existing components */}
        </div>
      </div>
    </div>
  )
}
