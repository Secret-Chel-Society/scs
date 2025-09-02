import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Skeleton className="h-12 w-1/3 mb-6" />
      <Skeleton className="h-[400px] w-full rounded-lg" />
    </div>
  )
}
