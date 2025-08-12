import { Suspense } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import DailyRecap from "@/components/admin/daily-recap"
import DailyRecapsTableMigration from "@/components/admin/daily-recaps-table-migration"

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96 mb-4" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function DailyRecapPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Daily Recap Management</h1>
        <p className="text-muted-foreground mt-2">Generate and manage daily recaps for recent matches</p>
      </div>

      <div className="space-y-6">
        <DailyRecapsTableMigration />

        <Suspense fallback={<LoadingSkeleton />}>
          <DailyRecap />
        </Suspense>
      </div>
    </div>
  )
}
