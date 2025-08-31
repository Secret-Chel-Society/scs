import { InjuryReservesMigration } from "@/components/admin/injury-reserves-migration"
import { Database, Activity } from "lucide-react"

export default function InjuryReservesMigrationPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="container mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <Database className="h-8 w-8 text-orange-400" />
            Injury Reserves Migration
          </h1>
          <p className="text-white/70 text-lg">
            Migrate injury reserves system and data
          </p>
        </div>
        <InjuryReservesMigration />
      </div>
    </div>
  )
}
