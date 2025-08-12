import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { syncTeamsFromMatch } from "@/lib/team-stats-calculator"

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { matchId } = await request.json()

    if (!matchId) {
      return NextResponse.json({ error: "Match ID is required" }, { status: 400 })
    }

    // Check if user is authenticated
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is an admin or a team manager for one of the teams in the match
    const { data: userRoles, error: rolesError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)

    if (rolesError) {
      return NextResponse.json({ error: `Error checking user roles: ${rolesError.message}` }, { status: 500 })
    }

    const isAdmin = userRoles?.some((role) => role.role === "admin" || role.role === "Admin") || false

    // If not admin, check if user is a team manager
    let isTeamManager = false
    if (!isAdmin) {
      // Get the match details
      const { data: match, error: matchError } = await supabase
        .from("matches")
        .select("home_team_id, away_team_id")
        .eq("id", matchId)
        .single()

      if (matchError) {
        return NextResponse.json({ error: `Error fetching match: ${matchError.message}` }, { status: 500 })
      }

      // Check if user is a manager of either team
      const { data: teamManagers, error: managersError } = await supabase
        .from("team_managers")
        .select("team_id")
        .eq("user_id", session.user.id)

      if (managersError) {
        return NextResponse.json({ error: `Error checking team managers: ${managersError.message}` }, { status: 500 })
      }

      isTeamManager =
        teamManagers?.some(
          (manager) => manager.team_id === match.home_team_id || manager.team_id === match.away_team_id,
        ) || false
    }

    if (!isAdmin && !isTeamManager) {
      return NextResponse.json({ error: "Forbidden - Admin or team manager access required" }, { status: 403 })
    }

    // Sync team statistics for the match
    const success = await syncTeamsFromMatch(matchId)

    if (success) {
      return NextResponse.json({
        success: true,
        message: `Successfully synced team statistics for match ${matchId}`,
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          message: `Failed to sync team statistics for match ${matchId}`,
        },
        { status: 500 },
      )
    }
  } catch (error: any) {
    console.error("Error syncing match stats:", error)
    return NextResponse.json({ error: error.message || "An error occurred" }, { status: 500 })
  }
}
