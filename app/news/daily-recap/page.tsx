import { Suspense } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import DailyRecapDisplay from "@/components/shared/daily-recap-display"
import { DailyRecapRealtime } from "@/components/shared/daily-recap-realtime"
import { createClient } from "@supabase/supabase-js"
import { Clock, TrendingUp, BarChart3, Activity, Star, Trophy, Target, Users, Zap } from "lucide-react"

// Server-side function to get the most recent daily recap
async function getDailyRecap() {
  try {
    console.log("🔍 [Server] Fetching most recent daily recap from database...")

    // Use service role key for server-side access
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    // Get the most recent recap
    const { data, error } = await supabase
      .from("daily_recaps")
      .select("id, date, recap_data, created_at, updated_at")
      .order("updated_at", { ascending: false })
      .limit(1)

    if (error) {
      console.error("❌ [Server] Database error:", error)
      return null
    }

    if (!data || data.length === 0) {
      console.log("📭 [Server] No saved recap found in database")
      return null
    }

    const recap = data[0]
    console.log("✅ [Server] Found saved recap:", {
      id: recap.id,
      date: recap.date,
      updated_at: recap.updated_at,
      hasRecapData: !!recap.recap_data,
      teamCount: recap.recap_data?.team_recaps?.length || 0,
      timeWindow: recap.recap_data?.time_window_hours || "unknown",
      totalMatches: recap.recap_data?.total_matches || 0,
    })

    // Validate recap data structure
    if (!recap.recap_data || !recap.recap_data.team_recaps) {
      console.error("❌ [Server] Invalid recap data structure:", recap.recap_data)
      return null
    }

    // Ensure time window is set
    if (!recap.recap_data.time_window_hours) {
      console.warn("⚠️ [Server] Setting default time window to 24 hours")
      recap.recap_data.time_window_hours = 24
    }

    console.log("✅ [Server] Returning valid recap data with", recap.recap_data.team_recaps.length, "teams")
    return recap.recap_data
  } catch (error) {
    console.error("❌ [Server] Error fetching daily recap:", error)
    return null
  }
}

function LoadingSkeleton() {
  return (
    <div className="space-y-8">
      {/* Loading Header */}
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ice-blue-600 mx-auto mb-4"></div>
        <h1 className="text-3xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200 mb-2">Loading Daily Recap</h1>
        <p className="text-hockey-silver-600 dark:text-hockey-silver-400">Analyzing recent matches and team performances...</p>
      </div>

      {/* Loading Summary Card */}
      <Card className="hockey-card border-ice-blue-200/50 dark:border-rink-blue-700/50 bg-gradient-to-br from-white to-ice-blue-50/50 dark:from-hockey-silver-900 dark:to-rink-blue-900/20">
        <CardContent className="p-6">
          <Skeleton className="h-8 w-64 mb-2 bg-gradient-to-br from-ice-blue-100 to-rink-blue-100 dark:from-ice-blue-900/30 dark:to-rink-blue-900/30" />
          <Skeleton className="h-4 w-96 mb-4 bg-gradient-to-br from-ice-blue-100 to-rink-blue-100 dark:from-ice-blue-900/30 dark:to-rink-blue-900/30" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-24 w-full rounded-lg bg-gradient-to-br from-ice-blue-100 to-rink-blue-100 dark:from-ice-blue-900/30 dark:to-rink-blue-900/30" />
            <Skeleton className="h-24 w-full rounded-lg bg-gradient-to-br from-ice-blue-100 to-rink-blue-100 dark:from-ice-blue-900/30 dark:to-rink-blue-900/30" />
          </div>
        </CardContent>
      </Card>

      {/* Loading Team Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="hockey-card border-ice-blue-200/50 dark:border-rink-blue-700/50 bg-gradient-to-br from-white to-ice-blue-50/50 dark:from-hockey-silver-900 dark:to-rink-blue-900/20">
            <CardContent className="p-6">
              <Skeleton className="h-6 w-32 mb-2 bg-gradient-to-br from-ice-blue-100 to-rink-blue-100 dark:from-ice-blue-900/30 dark:to-rink-blue-900/30" />
              <Skeleton className="h-4 w-48 mb-4 bg-gradient-to-br from-ice-blue-100 to-rink-blue-100 dark:from-ice-blue-900/30 dark:to-rink-blue-900/30" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full rounded bg-gradient-to-br from-ice-blue-100 to-rink-blue-100 dark:from-ice-blue-900/30 dark:to-rink-blue-900/30" />
                <Skeleton className="h-4 w-full rounded bg-gradient-to-br from-ice-blue-100 to-rink-blue-100 dark:from-ice-blue-900/30 dark:to-rink-blue-900/30" />
                <Skeleton className="h-4 w-3/4 rounded bg-gradient-to-br from-ice-blue-100 to-rink-blue-100 dark:from-ice-blue-900/30 dark:to-rink-blue-900/30" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

async function DailyRecapContent() {
  // Use the real-time component for better sync
  return <DailyRecapRealtime />
}

export default function DailyRecapPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-ice-blue-50 via-white to-rink-blue-50 dark:from-hockey-silver-900 dark:via-hockey-silver-800 dark:to-rink-blue-900/30">
      {/* Hero Header Section */}
      <div className="hockey-header relative py-16 px-4">
        <div className="container mx-auto text-center">
          <div>
            <h1 className="hockey-title mb-6">
              Daily Recap
            </h1>
            <p className="hockey-subtitle mb-8">
              Comprehensive AI-powered analysis of recent matches and team performances
            </p>
            
            {/* Daily Recap Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-8">
              <div className="hockey-stat-item bg-gradient-to-br from-ice-blue-100 to-ice-blue-200 dark:from-ice-blue-900/30 dark:to-ice-blue-800/20">
                <div className="p-2 bg-gradient-to-r from-ice-blue-500 to-ice-blue-600 rounded-lg mb-3 mx-auto w-fit">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <div className="text-2xl font-bold text-ice-blue-700 dark:text-ice-blue-300">
                  24h
                </div>
                <div className="text-xs text-ice-blue-600 dark:text-ice-blue-400 font-medium uppercase tracking-wide">
                  Time Window
                </div>
              </div>
              
              <div className="hockey-stat-item bg-gradient-to-br from-assist-green-100 to-assist-green-200 dark:from-assist-green-900/30 dark:to-assist-green-800/20">
                <div className="p-2 bg-gradient-to-r from-assist-green-500 to-assist-green-600 rounded-lg mb-3 mx-auto w-fit">
                  <Trophy className="h-6 w-6 text-white" />
                </div>
                <div className="text-2xl font-bold text-assist-green-700 dark:text-assist-green-300">
                  Top
                </div>
                <div className="text-xs text-assist-green-600 dark:text-assist-green-400 font-medium uppercase tracking-wide">
                  Performers
                </div>
              </div>
              
              <div className="hockey-stat-item bg-gradient-to-br from-rink-blue-100 to-rink-blue-200 dark:from-rink-blue-900/30 dark:to-rink-blue-800/20">
                <div className="p-2 bg-gradient-to-r from-rink-blue-500 to-rink-blue-600 rounded-lg mb-3 mx-auto w-fit">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <div className="text-2xl font-bold text-rink-blue-700 dark:text-rink-blue-300">
                  AI
                </div>
                <div className="text-xs text-rink-blue-600 dark:text-rink-blue-400 font-medium uppercase tracking-wide">
                  Analysis
                </div>
              </div>
              
              <div className="hockey-stat-item bg-gradient-to-br from-goal-red-100 to-goal-red-200 dark:from-goal-red-900/30 dark:to-goal-red-800/20">
                <div className="p-2 bg-gradient-to-r from-goal-red-500 to-goal-red-600 rounded-lg mb-3 mx-auto w-fit">
                  <Activity className="h-6 w-6 text-white" />
                </div>
                <div className="text-2xl font-bold text-goal-red-700 dark:text-goal-red-300">
                  Real-time
                </div>
                <div className="text-xs text-goal-red-600 dark:text-goal-red-400 font-medium uppercase tracking-wide">
                  Insights
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <Suspense fallback={<LoadingSkeleton />}>
          <DailyRecapContent />
        </Suspense>
      </div>
    </div>
  )
}

// Force dynamic rendering to ensure fresh data
export const dynamic = "force-dynamic"
export const revalidate = 0
