import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { syncTeamStats, syncAllTeamStats } from "@/lib/team-stats-calculator"

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { teamId, seasonId, syncAll = false } = await request.json()

    // Check if user is authenticated and is an admin
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is an admin
    const { data: userRoles, error: rolesError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)

    if (rolesError) {
      return NextResponse.json({ error: `Error checking user roles: ${rolesError.message}` }, { status: 500 })
    }

    const isAdmin = userRoles?.some((role) => role.role === "admin" || role.role === "Admin") || false

    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 })
    }

    if (!seasonId) {
      return NextResponse.json({ error: "Season ID is required" }, { status: 400 })
    }

    let success = false

    if (syncAll) {
      // Sync all teams in the season
      success = await syncAllTeamStats(seasonId)

      if (success) {
        return NextResponse.json({
          success: true,
          message: `Successfully synced all team statistics for season ${seasonId}`,
        })
      } else {
        return NextResponse.json(
          {
            success: false,
            message: `Failed to sync all team statistics for season ${seasonId}`,
          },
          { status: 500 },
        )
      }
    } else {
      // Sync a specific team
      if (!teamId) {
        return NextResponse.json({ error: "Team ID is required" }, { status: 400 })
      }

      success = await syncTeamStats(teamId, seasonId)

      if (success) {
        return NextResponse.json({
          success: true,
          message: `Successfully synced statistics for team ${teamId}`,
        })
      } else {
        return NextResponse.json(
          {
            success: false,
            message: `Failed to sync statistics for team ${teamId}`,
          },
          { status: 500 },
        )
      }
    }
  } catch (error: any) {
    console.error("Error syncing team stats:", error)
    return NextResponse.json({ error: error.message || "An error occurred" }, { status: 500 })
  }
}
