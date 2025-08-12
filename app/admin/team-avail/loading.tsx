import { Skeleton } from "@/components/ui/skeleton"

export default function TeamAvailabilityLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-9 w-32" />
      </div>

      <Skeleton className="h-32 w-full mb-6" />
      <Skeleton className="h-10 w-48 mb-6" />

      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="border rounded-lg p-6">
            <Skeleton className="h-6 w-40 mb-4" />
            <Skeleton className="h-64 w-full" />
          </div>
        ))}
      </div>
    </div>
  )
}
