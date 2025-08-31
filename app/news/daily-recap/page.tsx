import { Suspense } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import DailyRecapDisplay from "@/components/shared/daily-recap-display"
import { createClient } from "@supabase/supabase-js"
import { TrendingUp, Calendar, Clock, BarChart3, Users, Trophy, Award, Medal } from "lucide-react"

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

function DailyRecapStats() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 animate-fade-in">
      <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm border border-blue-400/30 rounded-2xl p-6 text-center animate-slide-up" style={{ animationDelay: "100ms" }}>
        <div className="text-3xl font-bold text-blue-200 mb-2">24h</div>
        <div className="text-blue-300 flex items-center justify-center gap-2">
          <Clock className="h-5 w-5" />
          Time Window
        </div>
      </div>
      <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-sm border border-green-400/30 rounded-2xl p-6 text-center animate-slide-up" style={{ animationDelay: "200ms" }}>
        <div className="text-3xl font-bold text-green-200 mb-2">15+</div>
        <div className="text-green-300 flex items-center justify-center gap-2">
          <Users className="h-5 w-5" />
          Teams Analyzed
        </div>
      </div>
      <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-sm border border-purple-400/30 rounded-2xl p-6 text-center animate-slide-up" style={{ animationDelay: "300ms" }}>
        <div className="text-3xl font-bold text-purple-200 mb-2">AI</div>
        <div className="text-purple-300 flex items-center justify-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Powered Analysis
        </div>
      </div>
      <div className="bg-gradient-to-r from-yellow-500/20 to-amber-500/20 backdrop-blur-sm border border-yellow-400/30 rounded-2xl p-6 text-center animate-slide-up" style={{ animationDelay: "400ms" }}>
        <div className="text-3xl font-bold text-yellow-200 mb-2">Daily</div>
        <div className="text-yellow-300 flex items-center justify-center gap-2">
          <Calendar className="h-5 w-5" />
          Updates
        </div>
      </div>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20">
        <CardContent className="p-6">
          <Skeleton className="h-8 w-64 mb-2 bg-white/20" />
          <Skeleton className="h-4 w-96 mb-4 bg-white/20" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-24 w-full bg-white/20" />
            <Skeleton className="h-24 w-full bg-white/20" />
          </div>
        </CardContent>
      </Card>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20">
            <CardContent className="p-6">
              <Skeleton className="h-6 w-32 mb-2 bg-white/20" />
              <Skeleton className="h-4 w-48 mb-4 bg-white/20" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full bg-white/20" />
                <Skeleton className="h-4 w-full bg-white/20" />
                <Skeleton className="h-4 w-3/4 bg-white/20" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

async function DailyRecapContent() {
  const recapData = await getDailyRecap()

  if (!recapData) {
    return (
      <Card className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20">
        <CardContent className="text-center py-12">
          <BarChart3 className="w-16 h-16 mx-auto mb-4 text-blue-300" />
          <p className="text-white/60 mb-2">No daily recap available yet.</p>
          <p className="text-sm text-white/60">
            Daily recaps are generated by administrators and will appear here once available.
          </p>
          <div className="mt-4 p-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm border border-blue-400/30 rounded-lg">
            <p className="text-xs text-blue-300">
              <strong>For Admins:</strong> Generate a recap from the admin panel (/admin → Daily Recap) to see it here.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return <DailyRecapDisplay recapData={recapData} showFullRoster={true} />
}

export default function DailyRecapPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative container mx-auto px-4 py-8">
        <div className="relative z-10">
          {/* Header Section */}
          <div className="text-center mb-12 animate-fade-in">
            <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-white via-blue-200 to-cyan-200 bg-clip-text text-transparent">
              Daily Recap
            </h1>
            <p className="text-xl text-blue-200 mb-8">
              Comprehensive AI-powered analysis of recent matches and team performances
            </p>
          </div>

          {/* Daily Recap Statistics */}
          <DailyRecapStats />

          {/* Main Content */}
          <div className="animate-slide-up" style={{ animationDelay: "500ms" }}>
            <Suspense fallback={<LoadingSkeleton />}>
              <DailyRecapContent />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  )
}

// Force dynamic rendering to ensure fresh data
export const dynamic = "force-dynamic"
export const revalidate = 0
