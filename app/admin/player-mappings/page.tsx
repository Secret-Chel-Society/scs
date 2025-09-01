import { Suspense } from "react"
import PlayerMappingManager from "@/components/admin/player-mapping-manager"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Gamepad2, ArrowLeft } from "lucide-react"
import Link from "next/link"

export const metadata = {
  title: "Player Mappings | MGHL Admin",
  description: "Manage EA Player to SCS Player Mappings",
}

export default function PlayerMappingsPage() {
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
              <Gamepad2 className="h-8 w-8 text-blue-400" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Player Mappings
              </h1>
              <p className="text-white/70 mt-1">Manage EA Player to SCS Player Mappings</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 pb-8">
        <Suspense fallback={<LoadingSkeleton />}>
          <PlayerMappingManager />
        </Suspense>
      </div>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-sm border border-white/20">
      <CardContent className="p-6">
        <div className="space-y-4">
          <Skeleton className="h-8 w-64 bg-slate-700" />
          <Skeleton className="h-4 w-full bg-slate-700" />
          <div className="grid grid-cols-3 gap-4 mt-8">
            <Skeleton className="h-10 w-full bg-slate-700" />
            <Skeleton className="h-10 w-full bg-slate-700" />
            <Skeleton className="h-10 w-full bg-slate-700" />
          </div>
          <Skeleton className="h-64 w-full mt-8 bg-slate-700" />
        </div>
      </CardContent>
    </Card>
  )
}
