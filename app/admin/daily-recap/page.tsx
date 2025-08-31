import { Suspense } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import DailyRecap from "@/components/admin/daily-recap"
import DailyRecapsTableMigration from "@/components/admin/daily-recaps-table-migration"
import { Calendar, FileText } from "lucide-react"

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-sm border border-white/20">
        <CardContent className="p-6">
          <Skeleton className="h-8 w-64 mb-2 bg-slate-700" />
          <Skeleton className="h-4 w-96 mb-4 bg-slate-700" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-32 bg-slate-700" />
            <Skeleton className="h-10 w-32 bg-slate-700" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function DailyRecapPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="container mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <Calendar className="h-8 w-8 text-blue-400" />
            Daily Recap Management
          </h1>
          <p className="text-white/70 text-lg">
            Generate and manage daily recaps for recent matches
          </p>
        </div>

        <div className="space-y-6">
          <DailyRecapsTableMigration />

          <Suspense fallback={<LoadingSkeleton />}>
            <DailyRecap />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
