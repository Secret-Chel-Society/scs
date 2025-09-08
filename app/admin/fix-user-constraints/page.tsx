import { Suspense } from "react"
import FixUserConstraints from "@/components/admin/fix-user-constraints"
import { Skeleton } from "@/components/ui/skeleton"

export default function FixUserConstraintsPage() {
  return (
    <Suspense fallback={<Skeleton className="h-[600px] w-full" />}>
      <FixUserConstraints />
    </Suspense>
  )
}
