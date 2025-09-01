import { Suspense } from "react"
import FixBiddingAssignments from "@/components/admin/fix-bidding-assignments"
import { Skeleton } from "@/components/ui/skeleton"

export default function FixBiddingAssignmentsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Fix Bidding Assignments</h1>
        <p className="text-muted-foreground">Resolve issues with automatic player re-assignment from bidding system</p>
      </div>

      <Suspense fallback={<Skeleton className="w-full max-w-2xl mx-auto h-[400px]" />}>
        <FixBiddingAssignments />
      </Suspense>
    </div>
  )
}
