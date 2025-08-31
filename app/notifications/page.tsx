import { Suspense } from "react"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { PageHeader } from "@/components/ui/page-header"
import { NotificationsList } from "@/components/notifications/notifications-list"
import { Skeleton } from "@/components/ui/skeleton"

export const dynamic = "force-dynamic"

export default async function NotificationsPage() {
  const supabase = createServerComponentClient({ cookies })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login")
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader title="Notifications" description="View and manage your notifications" />

      <div className="mt-8 max-w-4xl mx-auto">
        <Suspense
          fallback={
            <div className="space-y-4">
              {Array(5)
                .fill(0)
                .map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full rounded-lg" />
                ))}
            </div>
          }
        >
          <NotificationsList userId={session.user.id} />
        </Suspense>
      </div>
    </div>
  )
}
