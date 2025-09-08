"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/lib/supabase/client"
import { UserTokenDashboard } from "@/components/tokens/user-token-dashboard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  User, 
  Trophy, 
  Calendar, 
  BarChart3, 
  RefreshCw, 
  Star, 
  Shield, 
  Target, 
  Zap, 
  Activity,
  TrendingUp,
  Award,
  Crown,
  Users,
  Clock,
  DollarSign,
  LayoutDashboard
} from "lucide-react"
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-blue-900/20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header Section */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="p-3 sm:p-4 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-xl shadow-lg">
              <LayoutDashboard className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-ice-blue-600 to-rink-blue-700 dark:from-ice-blue-400 dark:to-rink-blue-500 bg-clip-text text-transparent">
              Welcome back, {displayName}!
            </h1>
          </div>
          <div className="h-1 w-24 sm:w-32 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-full mx-auto mb-6 sm:mb-8" />
          <p className="text-base sm:text-lg lg:text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto leading-relaxed px-4">
            Manage your MGHL profile, tokens, and track your performance
          </p>
        </div>

        {/* Debug Info (Development Only) */}
        {process.env.NODE_ENV === "development" && (
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700 shadow-lg mb-8">
            <CardHeader>
              <CardTitle className="text-slate-800 dark:text-slate-200">Debug Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>Session: {session ? "✓ Active" : "✗ None"}</div>
                <div>User Data: {userData ? "✓ Loaded" : "✗ Not loaded"}</div>
                <div>Loading: {dataLoading ? "✓ Loading" : "✗ Complete"}</div>
                <div>User ID: {session?.user?.id}</div>
                <div>Email: {session?.user?.email}</div>
                <div>Access Token: {session?.access_token ? "✓ Present" : "✗ Missing"}</div>
                <div>Has Registration: {userData?.registration ? "✓" : "✗"}</div>
                <div>Has Player: {userData?.player ? "✓" : "✗"}</div>
                <div>Has Team: {userData?.team ? "✓" : "✗"}</div>
                <div>Team ID: {userData?.player?.team_id || "None"}</div>
                <div>Salary: ${userData?.player?.salary || 0}</div>
              </div>
              <Button onClick={handleRefreshSession} size="sm" variant="outline" className="mt-4">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Session
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Quick Stats Grid */}
        <div className="grid gap-4 sm:gap-6 grid-cols-2 md:grid-cols-2 lg:grid-cols-4 mb-6 sm:mb-8">
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <CardContent className="p-4 sm:p-6 text-center">
              <div className="p-2 sm:p-3 bg-gradient-to-r from-ice-blue-500 to-ice-blue-600 rounded-lg w-fit mx-auto mb-3 sm:mb-4">
                <User className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-800 dark:text-slate-200 mb-1">
                {dataLoading ? <Skeleton className="h-5 sm:h-6 w-12 sm:w-16 mx-auto" /> : primaryPosition}
              </div>
              <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                {secondaryPosition ? `Secondary: ${secondaryPosition}` : "Primary Position"}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <CardContent className="p-4 sm:p-6 text-center">
              <div className="p-2 sm:p-3 bg-gradient-to-r from-rink-blue-500 to-rink-blue-600 rounded-lg w-fit mx-auto mb-3 sm:mb-4">
                <Trophy className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div className="flex items-center justify-center gap-1 sm:gap-2 mb-1">
                {teamLogo && (
                  <div className="h-5 w-5 sm:h-6 sm:w-6 relative">
                    <Image src={teamLogo || "/placeholder.svg"} alt={teamName} fill className="object-contain" />
                  </div>
                )}
                <div className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-800 dark:text-slate-200">
                  {dataLoading ? <Skeleton className="h-5 sm:h-6 w-12 sm:w-16" /> : teamName}
                </div>
              </div>
              <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                {hasTeam ? "Current Team" : "Free Agent"}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <CardContent className="p-4 sm:p-6 text-center">
              <div className="p-2 sm:p-3 bg-gradient-to-r from-assist-green-500 to-assist-green-600 rounded-lg w-fit mx-auto mb-3 sm:mb-4">
                <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-800 dark:text-slate-200 mb-1">
                {dataLoading ? <Skeleton className="h-5 sm:h-6 w-12 sm:w-16 mx-auto" /> : registrationStatus}
              </div>
              <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                {seasonNumber ? `Season ${seasonNumber}` : "Current Status"}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <CardContent className="p-4 sm:p-6 text-center">
              <div className="p-2 sm:p-3 bg-gradient-to-r from-goal-red-500 to-goal-red-600 rounded-lg w-fit mx-auto mb-3 sm:mb-4">
                <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-800 dark:text-slate-200 mb-1">
                {dataLoading ? <Skeleton className="h-5 sm:h-6 w-12 sm:w-16 mx-auto" /> : `$${salary.toLocaleString()}`}
              </div>
              <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                {hasTeam ? "Current Contract" : "No Contract"}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Token Dashboard */}
        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-ice-blue-50 to-rink-blue-50 dark:from-ice-blue-900/30 dark:to-rink-blue-900/30 border-b border-slate-200 dark:border-slate-700">
            <CardTitle className="text-2xl text-slate-800 dark:text-slate-200 flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-lg">
                <Star className="h-5 w-5 text-white" />
              </div>
              Token Dashboard
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <UserTokenDashboard />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
