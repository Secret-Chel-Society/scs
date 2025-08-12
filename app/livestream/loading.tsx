import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/ui/page-header"

export default function LiveStreamLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader heading="LiveStream" text="Watch live and past streams of SCS matches and events" />

      {/* Featured Streams Section */}
      <section className="mb-12">
        <h2 className="mb-6 text-3xl font-bold">Featured Streams</h2>
        <div className="grid gap-6 md:grid-cols-2">
          {[1, 2].map((i) => (
            <div key={i} className="overflow-hidden rounded-lg border bg-card shadow">
              <Skeleton className="aspect-video w-full" />
              <div className="p-4">
                <Skeleton className="mb-2 h-6 w-3/4" />
                <div className="flex flex-wrap gap-3">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
              <div className="p-4 pt-0">
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Past Streams Section */}
      <section>
        <h2 className="mb-6 text-3xl font-bold">Stream Archive</h2>
        <div className="mb-6">
          <Skeleton className="h-10 w-64" />
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array(8)
            .fill(0)
            .map((_, i) => (
              <div key={i} className="overflow-hidden rounded-lg border bg-card shadow">
                <Skeleton className="aspect-video w-full" />
                <div className="p-4">
                  <Skeleton className="mb-2 h-6 w-3/4" />
                  <div className="flex flex-wrap gap-3">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
                <div className="p-4 pt-0">
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
            ))}
        </div>
      </section>

      {/* Upcoming Schedule Section */}
      <section className="mt-12">
        <div className="rounded-lg border bg-card p-6 shadow">
          <Skeleton className="mb-4 h-8 w-48" />
          <Skeleton className="mb-4 h-4 w-full" />
          <Skeleton className="mb-2 h-4 w-full" />
          <div className="flex flex-wrap gap-4">
            <Skeleton className="h-10 w-36" />
            <Skeleton className="h-10 w-36" />
          </div>
        </div>
      </section>
    </div>
  )
}
