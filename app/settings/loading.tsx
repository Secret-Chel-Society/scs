import { Skeleton } from "@/components/ui/skeleton"

export default function SettingsLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <Skeleton className="h-10 w-64 mb-6" />

        <div className="mb-6">
          <Skeleton className="h-[200px] w-full rounded-lg mb-4" />
        </div>

        <Skeleton className="h-[400px] w-full rounded-lg" />
      </div>
    </div>
  )
}
