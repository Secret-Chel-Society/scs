import { Suspense } from "react"
import ManualRemovalTrackingMigration from "@/components/admin/manual-removal-tracking-migration"
import { Skeleton } from "@/components/ui/skeleton"

export default function ManualRemovalTrackingMigrationPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Manual Removal Tracking Migration</h1>
        <p className="text-muted-foreground">
          Set up tracking to prevent automatic re-assignment of manually removed players
        </p>
      </div>

      <Suspense fallback={<Skeleton className="w-full max-w-2xl mx-auto h-[400px]" />}>
        <ManualRemovalTrackingMigration />
      </Suspense>
    </div>
  )
}
