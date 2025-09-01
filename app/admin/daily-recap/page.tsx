import { Suspense } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import DailyRecap from "@/components/admin/daily-recap"
import DailyRecapsTableMigration from "@/components/admin/daily-recaps-table-migration"
import { ArrowLeft, Calendar } from "lucide-react"
import Link from "next/link"

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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10" />
        <div className="relative container mx-auto px-4 py-8">
          <div className="flex items-center gap-2 mb-6">
            <ArrowLeft className="h-5 w-5 text-white/70" />
            <Link href="/admin" className="text-white/70 hover:text-white transition-colors">
              Back to Admin Dashboard
            </Link>
          </div>

          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl">
              <Calendar className="h-8 w-8 text-blue-400" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Daily Recap Management
              </h1>
              <p className="text-white/70 mt-1">Generate and manage daily recaps for recent matches</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 pb-8">
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
