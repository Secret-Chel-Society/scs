import { Suspense } from "react"
import { SimpleForumManagement } from "@/components/admin/simple-forum-management"
import { ErrorBoundary } from "@/components/error-boundary"

export default function AdminForumPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Forum Management</h1>
        <p className="text-muted-foreground">Manage forum categories, posts, and moderation</p>
      </div>

      <ErrorBoundary
        fallback={
          <div className="p-4 border border-red-200 rounded bg-red-50 text-red-800">
            There was an error loading the forum management interface. Please try again later.
          </div>
        }
      >
        <Suspense
          fallback={
            <div className="flex justify-center p-12">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          }
        >
          <SimpleForumManagement />
        </Suspense>
      </ErrorBoundary>
    </div>
  )
}
