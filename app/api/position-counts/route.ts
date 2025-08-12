import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Initialize position counts
    const positionCounts: Record<string, number> = {
      Center: 0,
      "Right Wing": 0,
      "Left Wing": 0,
      "Left Defense": 0,
      "Right Defense": 0,
      Goalie: 0,
      Other: 0,
    }

    // First, get the active season
    const { data: activeSeasons, error: seasonError } = await supabase
      .from("seasons")
      .select("id")
      .eq("is_active", true)

    if (seasonError) {
      console.error("Error fetching active season:", seasonError)
      return NextResponse.json({ positionCounts }, { status: 200 }) // Return empty counts instead of error
    }

    // If no active season, return empty counts
    if (!activeSeasons || activeSeasons.length === 0) {
      console.log("No active season found")
      return NextResponse.json({ positionCounts }, { status: 200 })
    }

    const activeSeasonId = activeSeasons[0].id

    // Get all approved registrations for the active season
    const { data: registrations, error: regError } = await supabase
      .from("season_registrations")
      .select("id, user_id, primary_position")
      .eq("status", "Approved")
      .eq("season_id", activeSeasonId)

    if (regError) {
      console.error("Error fetching registrations:", regError)
      return NextResponse.json({ positionCounts }, { status: 200 }) // Return empty counts instead of error
    }

    if (!registrations || registrations.length === 0) {
      console.log("No approved registrations found")
      return NextResponse.json({ positionCounts }, { status: 200 })
    }

    // Get all user_ids from registrations
    const userIds = registrations.map((reg) => reg.user_id)

    // Get active users
    const { data: activeUsers, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("is_active", true)
      .in("id", userIds)

    if (userError) {
      console.error("Error fetching active users:", userError)
      return NextResponse.json({ positionCounts }, { status: 200 })
    }

    // Get users with teams
    const { data: playersWithTeams, error: playerError } = await supabase
      .from("players")
      .select("user_id")
      .not("team_id", "is", null)
      .in("user_id", userIds)

    if (playerError) {
      console.error("Error fetching players with teams:", playerError)
      return NextResponse.json({ positionCounts }, { status: 200 })
    }

    // Create sets for faster lookups
    const activeUserIds = new Set(activeUsers?.map((user) => user.id) || [])
    const userIdsWithTeams = new Set(playersWithTeams?.map((player) => player.user_id) || [])

    // Filter to only include active users who don't have a team (free agents)
    const freeAgents = registrations.filter(
      (reg) => activeUserIds.has(reg.user_id) && !userIdsWithTeams.has(reg.user_id),
    )

    // Normalize position names
    const normalizePosition = (pos: string | null): string => {
      if (!pos) return "Other"

      const posLower = pos.toLowerCase()

      if (posLower.includes("center") || posLower === "c") return "Center"
      if (posLower.includes("right wing") || posLower === "rw") return "Right Wing"
      if (posLower.includes("left wing") || posLower === "lw") return "Left Wing"
      if (posLower.includes("left defense") || posLower === "ld") return "Left Defense"
      if (posLower.includes("right defense") || posLower === "rd") return "Right Defense"
      if (posLower.includes("goalie") || posLower === "g") return "Goalie"

      return "Other"
    }

    // Count positions of free agents
    freeAgents.forEach((reg) => {
      const normalizedPosition = normalizePosition(reg.primary_position)
      positionCounts[normalizedPosition]++
    })

    return NextResponse.json({ positionCounts })
  } catch (error) {
    console.error("Error in position counts API:", error)
    // Return empty counts instead of error
    return NextResponse.json(
      {
        positionCounts: {
          Center: 0,
          "Right Wing": 0,
          "Left Wing": 0,
          "Left Defense": 0,
          "Right Defense": 0,
          Goalie: 0,
          Other: 0,
        },
      },
      { status: 200 },
    )
  }
}
