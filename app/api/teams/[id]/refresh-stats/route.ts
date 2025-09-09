import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { calculateStandings, getCurrentSeasonId } from "@/lib/standings-calculator"

// Create a Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const teamId = params.id

    // Check if team exists
    const { data: team, error: teamError } = await supabase.from("teams").select("id").eq("id", teamId).single()

    if (teamError) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 })
    }

    // Get current season ID
    const seasonId = await getCurrentSeasonId()

    // Calculate standings
    const standings = await calculateStandings(seasonId)

    // Find the team in the standings
    const teamStats = standings.find((t) => t.id === teamId)

    if (!teamStats) {
      return NextResponse.json({ error: "Team not found in standings" }, { status: 404 })
    }

    // Update team statistics
    const { error: updateError } = await supabase
      .from("teams")
      .update({
        wins: teamStats.wins,
        losses: teamStats.losses,
        otl: teamStats.otl,
        goals_for: teamStats.goals_for,
        goals_against: teamStats.goals_against,
        points: teamStats.points,
        games_played: teamStats.games_played,
        updated_at: new Date().toISOString(),
      })
      .eq("id", teamId)

    if (updateError) {
      return NextResponse.json({ error: `Error updating team stats: ${updateError.message}` }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Team statistics refreshed successfully" })
  } catch (error: any) {
    console.error("Error refreshing team stats:", error)
    return NextResponse.json({ error: error.message || "Failed to refresh team stats" }, { status: 500 })
  }
}
