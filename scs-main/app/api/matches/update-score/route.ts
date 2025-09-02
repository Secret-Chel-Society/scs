import { createServerSupabaseClient } from "@/lib/supabase/server"
import { roleHasPermission, normalizeRole } from "@/lib/rbac"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    // Use createServerSupabaseClient with cookies to ensure proper auth
    const supabase = createServerSupabaseClient(cookies())

    // Check if user is authenticated
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      console.error("No session found")
      return NextResponse.json({ error: "Unauthorized - No session" }, { status: 401 })
    }

    console.log("User authenticated:", session.user.id)

    // Get request body
    const requestBody = await request.json()
    console.log("Received update request with data:", JSON.stringify(requestBody, null, 2))

    const { matchId, homeScore, awayScore, periodScores, hasOvertime, hasShootout, status } = requestBody

    if (!matchId) {
      return NextResponse.json({ error: "Match ID is required" }, { status: 400 })
    }

    // Validate period scores
    if (!Array.isArray(periodScores)) {
      return NextResponse.json({ error: "Period scores must be an array" }, { status: 400 })
    }

    // Get the match details to check team IDs
    const { data: match, error: matchError } = await supabase
      .from("matches")
      .select("home_team_id, away_team_id, status, season_id, ea_match_id")
      .eq("id", matchId)
      .single()

    if (matchError) {
      console.error("Error fetching match:", matchError)
      return NextResponse.json({ error: "Match not found" }, { status: 404 })
    }

    // Check if user is an admin
    const { data: userData, error: userError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)

    if (userError) {
      console.error("Error checking user roles:", userError)
      return NextResponse.json({ error: "Failed to verify permissions" }, { status: 500 })
    }

    // Check admin using the RBAC helper
    const isAdmin = userData?.some((role) => roleHasPermission(role.role, "Admin")) || false
    console.log("Is admin:", isAdmin, "User roles:", userData)

    // If not admin, check if user is a team manager
    let isTeamManager = false
    let managedTeamIds: string[] = []

    if (!isAdmin) {
      // Check if user is a manager of either team
      const { data: userTeams, error: teamsError } = await supabase
        .from("team_managers")
        .select("team_id, role")
        .eq("user_id", session.user.id)

      if (teamsError) {
        console.error("Error checking team management permissions:", teamsError)
        return NextResponse.json({ error: "Failed to verify team management permissions" }, { status: 500 })
      }

      // Debug log all team managers
      console.log("All team managers for user:", userTeams)

      // Filter for teams in this match with proper roles
      const matchTeamManagers =
        userTeams?.filter((tm) => {
          const isForThisMatch = tm.team_id === match.home_team_id || tm.team_id === match.away_team_id
          const hasManagerRole = roleHasPermission(tm.role, "TeamManager")

          console.log(
            `Team ${tm.team_id} - Role ${tm.role} - Is for this match: ${isForThisMatch} - Has manager role: ${hasManagerRole}`,
          )

          return isForThisMatch && hasManagerRole
        }) || []

      managedTeamIds = matchTeamManagers.map((tm) => tm.team_id)
      isTeamManager = matchTeamManagers.length > 0

      console.log("Is team manager:", isTeamManager, "Managed team IDs:", managedTeamIds)

      // Team managers can only edit when match is "In Progress" (removed this restriction)
      if (!isTeamManager) {
        return NextResponse.json(
          {
            error: "Permission denied. Only team managers of participating teams can update match scores.",
            debug: {
              userTeams: userTeams?.map((ut) => ({
                teamId: ut.team_id,
                role: ut.role,
                normalized: normalizeRole(ut.role),
                isTeamManager: roleHasPermission(ut.role, "TeamManager"),
                isForThisMatch: ut.team_id === match.home_team_id || ut.team_id === match.away_team_id,
              })),
              matchTeams: [match.home_team_id, match.away_team_id],
            },
          },
          { status: 403 },
        )
      }
    }

    // If we get here, the user has permission to update the match
    console.log("User has permission to update match")

    // Check if the match status is changing from non-completed to completed
    const isCompletingMatch = match.status !== "Completed" && status === "Completed"

    // Prepare the update data
    const updateData = {
      home_score: Number(homeScore),
      away_score: Number(awayScore),
      period_scores: periodScores,
      has_overtime: hasOvertime,
      overtime: hasOvertime, // Update both fields for consistency
      has_shootout: hasShootout || false,
      status: status,
      updated_at: new Date().toISOString(),
    }

    console.log("Updating match with data:", JSON.stringify(updateData, null, 2))

    try {
      // Update the match
      const { data: updateResult, error: updateError } = await supabase
        .from("matches")
        .update(updateData)
        .eq("id", matchId)
        .select()

      if (updateError) {
        console.error("Error updating match:", updateError)
        return NextResponse.json({ error: `Failed to update match: ${updateError.message}` }, { status: 500 })
      }

      console.log("Match updated successfully:", updateResult)

      // If match is being completed or updated while already completed, update team standings
      if (isCompletingMatch || status === "Completed") {
        try {
          // Update team statistics for the season
          // await updateTeamStatistics(match.season_id)

          // If the match has EA data, update player statistics
          if (match.ea_match_id) {
            // await updatePlayerStatistics(supabase, matchId, match.season_id)
          }
        } catch (statsError) {
          console.error("Error updating statistics:", statsError)
          // Continue with the response even if stats update fails
        }
      }

      return NextResponse.json({ success: true, data: updateResult })
    } catch (dbError) {
      console.error("Database error:", dbError)
      return NextResponse.json({ error: `Database error: ${dbError.message}` }, { status: 500 })
    }
  } catch (error: any) {
    console.error("Error updating match score:", error)
    return NextResponse.json({ error: error.message || "An error occurred" }, { status: 500 })
  }
}
