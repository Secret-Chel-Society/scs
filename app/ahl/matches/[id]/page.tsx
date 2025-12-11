import { Suspense } from "react"
import AHLMatchDetailPage from "./match-page-client"
import { Skeleton } from "@/components/ui/skeleton"

export default function AHLMatchPage() {
  return (
    <Suspense
      fallback={
        <div className="container py-6">
          <Skeleton className="h-12 w-3/4 mb-6" />
          <div className="grid gap-6">
            <Skeleton className="h-[400px] w-full" />
          </div>
        </div>
      }
    >
      <AHLMatchDetailPage />
    </Suspense>
  )
}
