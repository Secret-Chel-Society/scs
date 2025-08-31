import { FixWaiverTablesMigration } from "@/components/admin/fix-waiver-tables-migration"
import { Database, Wrench } from "lucide-react"

export default function FixWaiverTablesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="container mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <Database className="h-8 w-8 text-orange-400" />
            Fix Waiver Tables
          </h1>
          <p className="text-white/70 text-lg">
            Fix and migrate waiver table structures
          </p>
        </div>
        <div className="max-w-3xl mx-auto">
          <FixWaiverTablesMigration />
        </div>
      </div>
    </div>
  )
}
