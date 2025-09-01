"use client"

import { useState } from "react"
import { useSupabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { RefreshCcw, LogIn, AlertCircle, CheckCircle } from "lucide-react"
import { useRouter } from "next/navigation"

export function SessionRefresh() {
  const { supabase, session, isLoading, refreshSession } = useSupabase()
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const handleRefresh = async () => {
    setRefreshing(true)
    setError(null)
    setSuccess(false)

    try {
      // Try to refresh the session
      await refreshSession()
      setSuccess(true)
      // Force a router refresh to update the UI
      router.refresh()
    } catch (err: any) {
      console.error("Error refreshing session:", err)
      setError(`Error: ${err.message || "Unknown error"}`)

      // On critical errors, try to sign out
      try {
        await supabase.auth.signOut()
        router.push("/login?message=Session+error")
      } catch (signOutErr) {
        console.error("Error signing out:", signOutErr)
      }
    } finally {
      setRefreshing(false)
    }
  }

  const redirectToLogin = () => {
    router.push("/login?redirect=" + encodeURIComponent(window.location.pathname))
  }

  if (isLoading) {
    return <div className="p-4">Checking authentication status...</div>
  }

  if (!session) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Not authenticated</AlertTitle>
        <AlertDescription className="flex flex-col gap-2">
          <p>You are not logged in or your session has expired.</p>
          <Button onClick={redirectToLogin} className="w-full sm:w-auto mt-2">
            <LogIn className="mr-2 h-4 w-4" /> Log In
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-4 mb-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Authentication Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-green-50 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800">
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>Success!</AlertTitle>
          <AlertDescription>Your session has been refreshed successfully.</AlertDescription>
        </Alert>
      )}

      <div className="flex items-center gap-2">
        <p className="text-sm">
          Logged in as: <span className="font-medium">{session.user.email}</span>
        </p>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
          <RefreshCcw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? "Refreshing..." : "Refresh Session"}
        </Button>
      </div>
    </div>
  )
}
