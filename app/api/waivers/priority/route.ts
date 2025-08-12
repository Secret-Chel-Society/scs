import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { calculateStandings, getCurrentSeasonId } from "@/lib/standings-calculator"

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Try to get the current user's session, but don't require it
    let currentTeamId = null
    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError) {
        console.log("Session error (non-blocking):", sessionError)
      }

      if (session?.user) {
        // Get the current user's team ID if they're logged in
        const { data: player, error: playerError } = await supabase
          .from("players")
          .select("team_id")
          .eq("user_id", session.user.id)
          .single()

        if (playerError) {
          console.log("Player lookup error (non-blocking):", playerError)
        } else if (player) {
          currentTeamId = player.team_id
        }
      }
    } catch (authError) {
      console.log("Auth error (non-blocking):", authError)
      // Continue without authentication
    }

    // Get current season ID
    let currentSeasonId
    try {
      currentSeasonId = await getCurrentSeasonId()
    } catch (seasonError) {
      console.error("Error getting current season:", seasonError)
      // Fallback to a default season or handle gracefully
      currentSeasonId = 1 // or whatever your default season ID is
    }

    // Calculate current standings
    let standings
    try {
      standings = await calculateStandings(currentSeasonId)
    } catch (standingsError) {
      console.error("Error calculating standings:", standingsError)

      // Fallback: Get teams directly from the database
      const { data: teams, error: teamsError } = await supabase
        .from("teams")
        .select("id, name, logo_url, wins, losses, otl, points, goal_differential")
        .eq("is_active", true)
        .order("points", { ascending: true })
        .order("wins", { ascending: true })
        .order("goal_differential", { ascending: true })

      if (teamsError) {
        throw new Error(`Failed to fetch teams: ${teamsError.message}`)
      }

      standings = teams || []
    }

    if (!standings || standings.length === 0) {
      return NextResponse.json({
        teams: [],
        currentTeamId,
        nextReset: getNextSaturdayAt8AM().toISOString(),
        message: "No teams found",
      })
    }

    // Create waiver priority based on standings (worst team gets priority 1)
    // Sort by points (ascending), then wins (ascending), then goal differential (ascending)
    const waiverPriority = [...standings]
      .sort((a, b) => {
        // First sort by points (lowest first)
        if (a.points !== b.points) {
          return a.points - b.points
        }
        // Then by wins (lowest first)
        if (a.wins !== b.wins) {
          return a.wins - b.wins
        }
        // Then by goal differential (lowest first)
        return (a.goal_differential || 0) - (b.goal_differential || 0)
      })
      .map((team, index) => ({
        id: team.id,
        name: team.name,
        logo_url: team.logo_url,
        wins: team.wins || 0,
        losses: team.losses || 0,
        otl: team.otl || 0,
        points: team.points || 0,
        goal_differential: team.goal_differential || 0,
        priority: index + 1,
      }))

    // Calculate next Saturday at 8 AM EST
    const nextReset = getNextSaturdayAt8AM()

    return NextResponse.json({
      teams: waiverPriority,
      currentTeamId,
      nextReset: nextReset.toISOString(),
    })
  } catch (error: any) {
    console.error("Error fetching waiver priority:", error)
    return NextResponse.json(
      {
        error: error.message,
        details: "Check server logs for more information",
      },
      { status: 500 },
    )
  }
}

// Helper function to get the next Saturday at 8 AM EST
function getNextSaturdayAt8AM() {
  const now = new Date()

  // Get days until next Saturday (0 = Sunday, 6 = Saturday)
  const daysUntilSaturday = (6 - now.getDay() + 7) % 7 || 7 // If today is Saturday, get next Saturday

  // Create date for next Saturday
  const nextSaturday = new Date(now)
  nextSaturday.setDate(now.getDate() + daysUntilSaturday)

  // Set time to 8:00 AM EST
  nextSaturday.setHours(13, 0, 0, 0) // 8 AM EST = 1 PM UTC (during standard time)

  return nextSaturday
}
