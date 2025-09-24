import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const { matchId } = await request.json()

    // Check if the user is authenticated
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id

    // First check if user is an admin
    const { data: adminRoles, error: adminError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "Admin")

    if (!adminError && adminRoles && adminRoles.length > 0) {
      // User is an admin, they have permission
      return NextResponse.json({ hasPermission: true, isAdmin: true })
    }

    // Get the match details to find the teams involved
    const { data: match, error: matchError } = await supabase
      .from("matches")
      .select("home_team_id, away_team_id")
      .eq("id", matchId)
      .single()

    if (matchError) {
      console.error("Error fetching match:", matchError)
      return NextResponse.json({ error: "Failed to fetch match details" }, { status: 500 })
    }

    // Check if the user is a manager of either team
    const { data: teamManagers, error: teamError } = await supabase
      .from("team_managers")
      .select("team_id")
      .eq("user_id", userId)
      .or(`team_id.eq.${match.home_team_id},team_id.eq.${match.away_team_id}`)

    if (teamError) {
      console.error("Error checking team managers:", teamError)
      return NextResponse.json({ error: "Failed to check team manager status" }, { status: 500 })
    }

    const hasPermission = teamManagers && teamManagers.length > 0

    return NextResponse.json({
      hasPermission,
      isAdmin: false,
      isManager: hasPermission,
      teams: hasPermission ? teamManagers.map((tm) => tm.team_id) : [],
    })
  } catch (error: any) {
    console.error("Error checking permissions:", error)
    return NextResponse.json({ error: error.message || "An error occurred" }, { status: 500 })
  }
}
