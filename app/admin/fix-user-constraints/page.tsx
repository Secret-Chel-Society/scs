import { Suspense } from "react"
import FixUserConstraints from "@/components/admin/fix-user-constraints"
import { Skeleton } from "@/components/ui/skeleton"
import { Database, Wrench } from "lucide-react"

export default function FixUserConstraintsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="container mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <Database className="h-8 w-8 text-red-400" />
            Fix User Constraints
          </h1>
          <p className="text-white/70 text-lg">
            Fix database constraint issues for user records
          </p>
        </div>
        <Suspense fallback={<Skeleton className="h-[600px] w-full bg-slate-700" />}>
          <FixUserConstraints />
        </Suspense>
      </div>
    </div>
  )
}
