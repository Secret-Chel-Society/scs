import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    const { matchId, status } = await request.json()

    if (!matchId || !status) {
      return NextResponse.json({ error: "Match ID and status are required" }, { status: 400 })
    }

    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Get the match details
    const { data: match, error: matchError } = await supabase
      .from("matches")
      .select("home_team_id, away_team_id")
      .eq("id", matchId)
      .single()

    if (matchError || !match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 })
    }

    // Check if user has admin role
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (profileError) {
      return NextResponse.json({ error: "Failed to verify permissions" }, { status: 500 })
    }

    const isAdmin = profile?.role === "admin" || profile?.role === "superadmin"

    // If not admin, check if user is a team manager
    let isTeamManager = false
    if (!isAdmin) {
      // Check if user is associated with either team
      const { data: teams, error: teamsError } = await supabase
        .from("teams")
        .select("id")
        .in("id", [match.home_team_id, match.away_team_id])
        .eq("manager_id", user.id)

      isTeamManager = teams && teams.length > 0
    }

    if (!isAdmin && !isTeamManager) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    // Update the match status
    const { data: updatedMatch, error: updateError } = await supabase
      .from("matches")
      .update({ status })
      .eq("id", matchId)
      .select()
      .single()

    if (updateError) {
      console.error("Error updating match status:", updateError)
      return NextResponse.json({ error: "Failed to update match status" }, { status: 500 })
    }

    return NextResponse.json({ success: true, match: updatedMatch })
  } catch (error) {
    console.error("Error updating match status:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
