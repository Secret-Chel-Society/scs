import { Suspense } from "react"
import PlayerMappingManager from "@/components/admin/player-mapping-manager"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export const metadata = {
  title: "Player Mappings | MGHL Admin",
  description: "Manage EA Player to MGHL Player Mappings",
}

export default function PlayerMappingsPage() {
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Player Mappings</h1>

      <Suspense fallback={<LoadingSkeleton />}>
        <PlayerMappingManager />
      </Suspense>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-full" />
          <div className="grid grid-cols-3 gap-4 mt-8">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
          <Skeleton className="h-64 w-full mt-8" />
        </div>
      </CardContent>
    </Card>
  )
}
