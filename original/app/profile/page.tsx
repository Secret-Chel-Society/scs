"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Skeleton } from "@/components/ui/skeleton"

export default function ProfilePage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function checkUserAndRedirect() {
      try {
        // Get the current session
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session) {
          // If no session, redirect to login
          router.push("/login")
          return
        }

        // Redirect to the settings page instead of player profile
        router.push("/settings")
      } catch (error) {
        console.error("Error checking user session:", error)
        router.push("/login")
      } finally {
        setIsLoading(false)
      }
    }

    checkUserAndRedirect()
  }, [router, supabase])

  // Show loading state while checking session and redirecting
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center min-h-[50vh]">
          <h1 className="text-2xl font-bold mb-4">Loading your profile...</h1>
          <div className="w-full max-w-md space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    )
  }

  // This should not be visible as we redirect before loading completes
  return null
}
