import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function GET(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  const url = new URL(request.url)
  const matchId = url.searchParams.get("matchId")

  try {
    // Check if the user is logged in
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the match data
    let matchData
    if (matchId) {
      const { data, error } = await supabase
        .from("matches")
        .select(`
          id, home_team_id, away_team_id,
          home_team:teams!home_team_id(id, name),
          away_team:teams!away_team_id(id, name)
        `)
        .eq("id", matchId)
        .single()

      if (error) {
        return NextResponse.json({ error: "Match not found" }, { status: 404 })
      }

      matchData = data
    }

    // Get the player data
    const { data: playerData, error: playerError } = await supabase
      .from("players")
      .select("id, team_id, role")
      .eq("user_id", session.user.id)

    if (playerError) {
      return NextResponse.json({ error: "Failed to fetch player data" }, { status: 500 })
    }

    // Check if the user is a manager of any team
    const managerRoles = playerData
      ?.filter((player) => ["GM", "AGM", "Owner"].includes(player.role))
      .map((player) => ({
        role: player.role,
        team_id: player.team_id,
      }))

    const isManager = managerRoles && managerRoles.length > 0

    // If we have a match ID, check if the user is a manager of either team
    let canManageMatch = false
    let managedTeamId = null

    if (matchData && isManager) {
      const isHomeTeamManager = managerRoles?.some((manager) => manager.team_id === matchData.home_team_id)
      const isAwayTeamManager = managerRoles?.some((manager) => manager.team_id === matchData.away_team_id)

      canManageMatch = isHomeTeamManager || isAwayTeamManager
      managedTeamId = isHomeTeamManager ? matchData.home_team_id : isAwayTeamManager ? matchData.away_team_id : null
    }

    return NextResponse.json({
      isManager,
      managerRoles,
      canManageMatch,
      managedTeamId,
      matchData: matchId ? matchData : null,
      playerData,
    })
  } catch (error: any) {
    console.error("Error checking manager status:", error)
    return NextResponse.json({ error: "Error checking manager status" }, { status: 500 })
  }
}
