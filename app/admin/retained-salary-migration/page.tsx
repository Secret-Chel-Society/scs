import { RetainedSalaryMigration } from "@/components/admin/retained-salary-migration"
import { Database, DollarSign } from "lucide-react"

export default function RetainedSalaryMigrationPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="container mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <Database className="h-8 w-8 text-green-400" />
            Retained Salary Migration
          </h1>
          <p className="text-white/70 text-lg">
            Migrate retained salary data and configurations
          </p>
        </div>
        <RetainedSalaryMigration />
      </div>
    </div>
  )
}
