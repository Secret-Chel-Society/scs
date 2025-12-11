import { Suspense } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import DailyRecapDisplay from "@/components/shared/daily-recap-display"
import { createClient } from "@supabase/supabase-js"

// Server-side function to get the most recent AHL daily recap
async function getAHLDailyRecap() {
  try {
    console.log("🔍 [Server] Fetching most recent AHL daily recap from database...")

    // Use service role key for server-side access
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    const { data, error } = await supabase
      .from("ahl_daily_recaps")
      .select("id, date, recap_data, created_at, updated_at")
      .order("updated_at", { ascending: false })
      .limit(1)

    if (error) {
      console.error("❌ [Server] Database error:", error)
      // Return mock data if table doesn't exist yet
      return {
        date: new Date().toISOString().split("T")[0],
        team_recaps: [
          {
            team_name: "Sample AHL Team",
            team_id: "ahl_sample",
            record: { wins: 2, losses: 1, otl: 0 },
            matches: [
              {
                match_id: "1",
                opponent: "Rival Team",
                score: "4-2",
                result: "W",
                goal_differential: 2,
                overtime: false,
              },
            ],
            total_goal_differential: 2,
            top_players: {
              forward: {
                player_name: "John Doe",
                position: "C",
                team_id: "ahl_sample",
                goals: 2,
                assists: 1,
                shots: 5,
                hits: 3,
                pim: 0,
                plus_minus: 2,
                blocks: 1,
                giveaways: 1,
                takeaways: 2,
                games_played: 1,
              },
            },
            worst_players: {},
            callouts: {
              high_turnovers: [],
              strong_defense: [],
              underwhelming: [],
              great_offense: [],
              fourth_forward: [],
            },
            all_players: [],
            summary: "Sample AHL team analysis would appear here.",
          },
        ],
        best_team: null,
        worst_team: null,
        total_matches: 1,
        time_window_hours: 24,
      }
    }

    if (!data || data.length === 0) {
      console.log("📭 [Server] No saved AHL recap found in database")
      return null
    }

    const recap = data[0]
    console.log("✅ [Server] Found saved AHL recap:", {
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
      console.error("❌ [Server] Invalid AHL recap data structure:", recap.recap_data)
      return null
    }

    // Ensure time window is set
    if (!recap.recap_data.time_window_hours) {
      console.warn("⚠️ [Server] Setting default time window to 24 hours")
      recap.recap_data.time_window_hours = 24
    }

    console.log("✅ [Server] Returning valid AHL recap data with", recap.recap_data.team_recaps.length, "teams")
    return recap.recap_data
  } catch (error) {
    console.error("❌ [Server] Error fetching AHL daily recap:", error)
    return null
  }
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96 mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </CardContent>
      </Card>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-6 w-32 mb-2" />
              <Skeleton className="h-4 w-48 mb-4" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

async function AHLDailyRecapContent() {
  const recapData = await getAHLDailyRecap()

  if (!recapData) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground mb-2">No AHL daily recap available yet.</p>
          <p className="text-sm text-muted-foreground">
            AHL daily recaps are generated by administrators and will appear here once available.
          </p>
          <div className="mt-4 p-4 bg-red-50 dark:bg-red-950/20 rounded-lg">
            <p className="text-xs text-red-600 dark:text-red-400">
              <strong>For Admins:</strong> Generate an AHL recap from the admin panel to see it here.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return <DailyRecapDisplay recapData={recapData} showFullRoster={true} />
}

export default function AHLDailyRecapPage() {
  return (
    <div className="min-h-screen bg-background relative">
      <div
        className="fixed inset-0 opacity-5 bg-center bg-no-repeat bg-contain pointer-events-none"
        style={{
          backgroundImage:
            "url('https://kudmtqjzuxakngbrqxzp.supabase.co/storage/v1/object/public/media/scslogo25.png')",
        }}
      />

      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">AHL Daily Recap</h1>
          <p className="text-muted-foreground mt-2">
            Comprehensive AI-powered analysis of recent AHL matches and team performances
          </p>
        </div>

        <Suspense fallback={<LoadingSkeleton />}>
          <AHLDailyRecapContent />
        </Suspense>
      </div>
    </div>
  )
}

// Force dynamic rendering to ensure fresh data
export const dynamic = "force-dynamic"
export const revalidate = 0
