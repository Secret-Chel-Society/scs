import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Get available players count using the existing position-counts logic
    let availablePlayers = 0
    try {
      // Get the active season
      const { data: activeSeasons, error: seasonError } = await supabase
        .from("seasons")
        .select("id")
        .eq("is_active", true)

      if (!seasonError && activeSeasons && activeSeasons.length > 0) {
        const activeSeasonId = activeSeasons[0].id

        // Get all approved registrations for the active season
        const { data: registrations, error: regError } = await supabase
          .from("season_registrations")
          .select("id, user_id")
          .eq("status", "Approved")
          .eq("season_id", activeSeasonId)

        if (!regError && registrations) {
          const userIds = registrations.map((reg) => reg.user_id)

          // Get active users
          const { data: activeUsers, error: userError } = await supabase
            .from("users")
            .select("id")
            .eq("is_active", true)
            .in("id", userIds)

          // Get users with teams
          const { data: playersWithTeams, error: playerError } = await supabase
            .from("players")
            .select("user_id")
            .not("team_id", "is", null)
            .in("user_id", userIds)

          if (!userError && !playerError) {
            const activeUserIds = new Set(activeUsers?.map((user) => user.id) || [])
            const userIdsWithTeams = new Set(playersWithTeams?.map((player) => player.user_id) || [])

            // Filter to only include active users who don't have a team (free agents)
            const freeAgents = registrations.filter(
              (reg) => activeUserIds.has(reg.user_id) && !userIdsWithTeams.has(reg.user_id),
            )

            availablePlayers = freeAgents.length
          }
        }
      }
    } catch (error) {
      console.error("Error fetching available players:", error)
    }

    // Get total bids count
    let totalBids = 0
    try {
      const { data: bids, error: bidsError } = await supabase
        .from("player_bidding")
        .select("id")

      if (!bidsError) {
        totalBids = bids?.length || 0
      }
    } catch (error) {
      console.error("Error fetching total bids:", error)
    }

    // Get active teams count
    let activeTeams = 0
    try {
      const { data: teams, error: teamsError } = await supabase
        .from("teams")
        .select("id")
        .eq("is_active", true)

      if (!teamsError) {
        activeTeams = teams?.length || 0
      }
    } catch (error) {
      console.error("Error fetching active teams:", error)
    }

    return NextResponse.json({
      availablePlayers,
      totalBids,
      activeTeams,
    })
  } catch (error) {
    console.error("Error in free agency stats API:", error)
    return NextResponse.json(
      {
        availablePlayers: 0,
        totalBids: 0,
        activeTeams: 0,
      },
      { status: 200 }
    )
  }
}
