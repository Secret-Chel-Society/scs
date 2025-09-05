"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/lib/supabase/client"
import { UserTokenDashboard } from "@/components/tokens/user-token-dashboard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { User, Trophy, Calendar, BarChart3, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { authGet } from "@/lib/auth-fetch"

export default function DashboardPage() {
  const { session, isLoading: authLoading, supabase } = useSupabase()
  const router = useRouter()
  const [userData, setUserData] = useState<any>(null)
  const [dataLoading, setDataLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !session) {
      console.log("No session, redirecting to login")
      router.push("/login")
    }
  }, [session, authLoading, router])

  useEffect(() => {
    if (session?.user && !authLoading) {
      console.log("Session found, loading user data")
      loadUserData()
    }
  }, [session, authLoading])

  const loadUserData = async () => {
    try {
      setDataLoading(true)
      setError(null)

      console.log("=== Client Side Debug ===")
      console.log("Session exists:", !!session)
      console.log("User ID:", session?.user?.id)
      console.log("Access token exists:", !!session?.access_token)

      // Use authFetch instead of regular fetch
      const { response, data } = await authGet("/api/user/profile")

      console.log("API Response status:", response.status)
      console.log("API Response headers:", Object.fromEntries(response.headers.entries()))

      if (response.ok) {
        console.log("API Response data:", data)
        setUserData(data)
      } else {
        console.error("API Error:", data)
        setError(`Failed to fetch profile: ${data.error}`)
      }
    } catch (error) {
      console.error("Error loading user data:", error)
      setError("Network error occurred")
    } finally {
      setDataLoading(false)
    }
  }

  const handleRefreshSession = async () => {
    try {
      console.log("Refreshing session...")
      const { data, error } = await supabase.auth.refreshSession()
      if (error) {
        console.error("Session refresh error:", error)
        setError("Failed to refresh session")
      } else {
        console.log("Session refreshed successfully")
        loadUserData()
      }
    } catch (error) {
      console.error("Refresh session error:", error)
      setError("Failed to refresh session")
    }
  }

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
          <Skeleton className="h-96" />
        </div>
      </div>
    )
  }

  // Redirect if no session
  if (!session) {
    return null
  }

  // Show error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-red-600">Error Loading Profile</h1>
          <p className="text-muted-foreground">{error}</p>
          <div className="flex gap-2 justify-center">
            <Button onClick={loadUserData} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
            <Button onClick={handleRefreshSession} variant="outline">
              Refresh Session
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Get user display name
  const displayName = userData?.user?.gamer_tag_id || session.user.email?.split("@")[0] || "Player"

  // Get position data from season_registrations
  const primaryPosition = userData?.registration?.primary_position || "N/A"
  const secondaryPosition = userData?.registration?.secondary_position

  // Get team data from players -> teams relationship
  const hasTeam = userData?.player?.team_id && userData?.team
  const teamName = hasTeam ? userData.team.name : "Free Agent"
  const teamLogo = hasTeam ? userData.team.logo_url : null

  // Get registration status
  const registrationStatus = userData?.registration?.status || "Not Registered"
  const seasonNumber = userData?.registration?.season_number

  // Get salary from players table
  const salary = userData?.player?.salary || 0

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        {/* Welcome Header */}
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {displayName}!</h1>
          <p className="text-muted-foreground">Manage your MGHL profile and tokens</p>
        </div>

        {/* Debug Info (Development Only) */}
        {process.env.NODE_ENV === "development" && (
          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded text-sm space-y-1">
            <p>
              <strong>Debug Info:</strong>
            </p>
            <p>Session: {session ? "✓ Active" : "✗ None"}</p>
            <p>User Data: {userData ? "✓ Loaded" : "✗ Not loaded"}</p>
            <p>Loading: {dataLoading ? "✓ Loading" : "✗ Complete"}</p>
            <p>User ID: {session?.user?.id}</p>
            <p>Email: {session?.user?.email}</p>
            <p>Access Token: {session?.access_token ? "✓ Present" : "✗ Missing"}</p>
            <p>Has Registration: {userData?.registration ? "✓" : "✗"}</p>
            <p>Has Player: {userData?.player ? "✓" : "✗"}</p>
            <p>Has Team: {userData?.team ? "✓" : "✗"}</p>
            <p>Team ID: {userData?.player?.team_id || "None"}</p>
            <p>Salary: ${userData?.player?.salary || 0}</p>
            <Button onClick={handleRefreshSession} size="sm" variant="outline" className="mt-2">
              Refresh Session
            </Button>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Position</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {dataLoading ? <Skeleton className="h-6 w-16" /> : primaryPosition}
              </div>
              <p className="text-xs text-muted-foreground">
                {secondaryPosition ? `Secondary: ${secondaryPosition}` : "Primary Position"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Team</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                {teamLogo && (
                  <div className="h-6 w-6 relative">
                    <Image src={teamLogo || "/placeholder.svg"} alt={teamName} fill className="object-contain" />
                  </div>
                )}
                <div className="text-2xl font-bold">{dataLoading ? <Skeleton className="h-6 w-16" /> : teamName}</div>
              </div>
              <p className="text-xs text-muted-foreground">{hasTeam ? "Current Team" : "Free Agent"}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Registration</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {dataLoading ? <Skeleton className="h-6 w-16" /> : registrationStatus}
              </div>
              <p className="text-xs text-muted-foreground">
                {seasonNumber ? `Season ${seasonNumber}` : "Current Status"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Salary</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {dataLoading ? <Skeleton className="h-6 w-16" /> : `$${salary.toLocaleString()}`}
              </div>
              <p className="text-xs text-muted-foreground">{hasTeam ? "Current Contract" : "No Contract"}</p>
            </CardContent>
          </Card>
        </div>

        {/* Token Dashboard */}
        <UserTokenDashboard />
      </div>
    </div>
  )
}
