import { Suspense } from "react"
import PlayerMappingManager from "@/components/admin/player-mapping-manager"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Users, Link } from "lucide-react"

export const metadata = {
  title: "Player Mappings | MGHL Admin",
  description: "Manage EA Player to SCS Player Mappings",
}

export default function PlayerMappingsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="container mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <Link className="h-8 w-8 text-blue-400" />
            Player Mappings
          </h1>
          <p className="text-white/70 text-lg">
            Manage EA Player to SCS Player Mappings
          </p>
        </div>

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
