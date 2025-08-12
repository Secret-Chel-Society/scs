import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Skeleton className="h-12 w-1/3 mb-6" />
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
        <Skeleton className="h-10 w-[200px]" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-[100px]" />
          <Skeleton className="h-10 w-[100px]" />
        </div>
      </div>
      <Skeleton className="h-10 w-full mb-8" />
      <Skeleton className="h-[600px] w-full rounded-lg" />
    </div>
  )
}
