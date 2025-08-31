import { Suspense } from "react"
import { SimpleForumManagement } from "@/components/admin/simple-forum-management"
import { ErrorBoundary } from "@/components/error-boundary"
import { MessageSquare, Users } from "lucide-react"

export default function AdminForumPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="container mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <MessageSquare className="h-8 w-8 text-blue-400" />
            Forum Management
          </h1>
          <p className="text-white/70 text-lg">
            Manage forum categories, posts, and moderation
          </p>
        </div>

        <ErrorBoundary
          fallback={
            <div className="p-4 border border-red-500/20 rounded bg-red-500/10 text-red-400">
              There was an error loading the forum management interface. Please try again later.
            </div>
          }
        >
          <Suspense
            fallback={
              <div className="flex justify-center p-12">
                <div className="flex items-center gap-3">
                  <div className="animate-spin h-8 w-8 border-4 border-white border-t-transparent rounded-full"></div>
                  <span className="text-white">Loading...</span>
                </div>
              </div>
            }
          >
            <SimpleForumManagement />
          </Suspense>
        </ErrorBoundary>
      </div>
    </div>
  )
}
