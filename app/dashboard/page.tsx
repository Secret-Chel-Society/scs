"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/lib/supabase/client"
import { UserTokenDashboard } from "@/components/tokens/user-token-dashboard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { User, Trophy, Calendar, BarChart3, RefreshCw, Shield, Star, Medal, Crown, Target, Zap, Activity, TrendingUp, Award, BookOpen, FileText, Globe, Camera, Image as ImageIcon, Play, Pause, SkipForward, SkipBack, Clock, Settings, Database, Users } from "lucide-react"
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
      <div className="min-h-screen bg-gradient-to-br from-ice-blue-50 via-white to-rink-blue-50 dark:from-hockey-silver-900 dark:via-hockey-silver-800 dark:to-rink-blue-900/30">
        <div className="container mx-auto px-4 py-20">
          <div className="animate-pulse">
            <div className="h-8 bg-hockey-silver-200 dark:bg-hockey-silver-700 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-hockey-silver-200 dark:bg-hockey-silver-700 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-hockey-silver-200 dark:bg-hockey-silver-700 rounded"></div>
              ))}
            </div>
            <div className="h-64 bg-hockey-silver-200 dark:bg-hockey-silver-700 rounded"></div>
          </div>
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
      <div className="min-h-screen bg-gradient-to-br from-ice-blue-50 via-white to-rink-blue-50 dark:from-hockey-silver-900 dark:via-hockey-silver-800 dark:to-rink-blue-900/30">
        <div className="container mx-auto px-4 py-20 text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-goal-red-500 to-assist-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <RefreshCw className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200 mb-4">
            Error Loading Profile
          </h1>
          <p className="text-hockey-silver-600 dark:text-hockey-silver-400 mb-8 max-w-md mx-auto">
            {error}
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button onClick={loadUserData} className="hockey-button hover:scale-105 transition-all duration-200">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
            <Button onClick={handleRefreshSession} variant="outline" className="border-ice-blue-300 dark:border-ice-blue-600 hover:bg-ice-blue-100 dark:hover:bg-ice-blue-900/30 hover:scale-105 transition-all duration-200">
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
    <div className="min-h-screen bg-gradient-to-br from-ice-blue-50 via-white to-rink-blue-50 dark:from-hockey-silver-900 dark:via-hockey-silver-800 dark:to-rink-blue-900/30">
      {/* Enhanced Hero Header Section */}
      <div className="relative overflow-hidden py-20 px-4">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-hockey-pattern opacity-5"></div>
        
        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-ice-blue-200/30 to-rink-blue-200/30 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-gradient-to-br from-assist-green-200/30 to-goal-red-200/30 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
        
        <div className="container mx-auto text-center relative z-10">
          <div>
            <h1 className="hockey-title mb-6">
              Welcome back, {displayName}!
            </h1>
            <p className="hockey-subtitle mx-auto mb-12">
              Manage your SCS profile, track your progress, and stay connected with the league.
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-20">
        <div className="space-y-8">

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

          {/* Enhanced Quick Stats */}
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <div className="group">
              <Card className="hockey-card hover:scale-105 transition-all duration-300 cursor-pointer">
                <CardHeader className="bg-gradient-to-r from-ice-blue-50 to-rink-blue-50 dark:from-ice-blue-900/30 dark:to-rink-blue-900/30 border-b border-ice-blue-200 dark:border-ice-blue-700">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-lg flex items-center justify-center">
                      <User className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-hockey-silver-800 dark:text-hockey-silver-200">
                        Position
                      </CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="text-3xl font-bold text-ice-blue-700 dark:text-ice-blue-300 mb-2">
                    {dataLoading ? <Skeleton className="h-8 w-20" /> : primaryPosition}
                  </div>
                  <p className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400">
                    {secondaryPosition ? `Secondary: ${secondaryPosition}` : "Primary Position"}
                  </p>
                  <div className="w-16 h-1 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-full mt-3 group-hover:w-20 transition-all duration-300"></div>
                </CardContent>
              </Card>
            </div>

            <div className="group">
              <Card className="hockey-card hover:scale-105 transition-all duration-300 cursor-pointer">
                <CardHeader className="bg-gradient-to-r from-rink-blue-50 to-ice-blue-50 dark:from-rink-blue-900/30 dark:to-ice-blue-900/30 border-b border-ice-blue-200 dark:border-ice-blue-700">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-rink-blue-500 to-ice-blue-600 rounded-lg flex items-center justify-center">
                      <Trophy className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-hockey-silver-800 dark:text-hockey-silver-200">
                        Team
                      </CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-2">
                    {teamLogo && (
                      <div className="h-8 w-8 relative">
                        <Image src={teamLogo || "/placeholder.svg"} alt={teamName} fill className="object-contain" />
                      </div>
                    )}
                    <div className="text-3xl font-bold text-rink-blue-700 dark:text-rink-blue-300">
                      {dataLoading ? <Skeleton className="h-8 w-20" /> : teamName}
                    </div>
                  </div>
                  <p className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400">
                    {hasTeam ? "Current Team" : "Free Agent"}
                  </p>
                  <div className="w-16 h-1 bg-gradient-to-r from-rink-blue-500 to-ice-blue-600 rounded-full mt-3 group-hover:w-20 transition-all duration-300"></div>
                </CardContent>
              </Card>
            </div>

            <div className="group">
              <Card className="hockey-card hover:scale-105 transition-all duration-300 cursor-pointer">
                <CardHeader className="bg-gradient-to-r from-assist-green-50 to-goal-red-50 dark:from-assist-green-900/30 dark:to-goal-red-900/30 border-b border-ice-blue-200 dark:border-ice-blue-700">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-assist-green-500 to-goal-red-600 rounded-lg flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-hockey-silver-800 dark:text-hockey-silver-200">
                        Registration
                      </CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="text-3xl font-bold text-assist-green-700 dark:text-assist-green-300 mb-2">
                    {dataLoading ? <Skeleton className="h-8 w-20" /> : registrationStatus}
                  </div>
                  <p className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400">
                    {seasonNumber ? `Season ${seasonNumber}` : "Current Status"}
                  </p>
                  <div className="w-16 h-1 bg-gradient-to-r from-assist-green-500 to-goal-red-600 rounded-full mt-3 group-hover:w-20 transition-all duration-300"></div>
                </CardContent>
              </Card>
            </div>

            <div className="group">
              <Card className="hockey-card hover:scale-105 transition-all duration-300 cursor-pointer">
                <CardHeader className="bg-gradient-to-r from-goal-red-50 to-assist-green-50 dark:from-goal-red-900/30 dark:to-assist-green-900/30 border-b border-ice-blue-200 dark:border-ice-blue-700">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-goal-red-500 to-assist-green-600 rounded-lg flex items-center justify-center">
                      <BarChart3 className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-hockey-silver-800 dark:text-hockey-silver-200">
                        Salary
                      </CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="text-3xl font-bold text-goal-red-700 dark:text-goal-red-300 mb-2">
                    {dataLoading ? <Skeleton className="h-8 w-20" /> : `$${salary.toLocaleString()}`}
                  </div>
                  <p className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400">
                    {hasTeam ? "Current Contract" : "No Contract"}
                  </p>
                  <div className="w-16 h-1 bg-gradient-to-r from-goal-red-500 to-assist-green-600 rounded-full mt-3 group-hover:w-20 transition-all duration-300"></div>
                </CardContent>
              </Card>
            </div>
          </div>

        {/* Token Dashboard */}
        <UserTokenDashboard />
      </div>
    </div>
  )
}
