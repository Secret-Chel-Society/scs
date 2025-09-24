import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="container py-10">
      <Skeleton className="h-10 w-64 mb-6" />
      <Skeleton className="h-4 w-full max-w-2xl mb-8" />
      <div className="w-full max-w-md mx-auto">
        <Skeleton className="h-[400px] w-full rounded-lg" />
      </div>
    </div>
  )
}
