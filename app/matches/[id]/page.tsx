import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import MatchDetailPage from "./match-page-client"

export default function MatchPage() {
  return (
    <Suspense fallback={<MatchSkeleton />}>
      <MatchDetailPage />
    </Suspense>
  )
}

function MatchSkeleton() {
  return (
    <div className="container py-6">
      <Skeleton className="h-12 w-3/4 mb-6" />
      <div className="grid gap-6">
        <Skeleton className="h-[400px] w-full" />
      </div>
    </div>
  )
}
