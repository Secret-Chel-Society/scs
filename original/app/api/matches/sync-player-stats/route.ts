import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { syncEaStatsToPlayerStatistics } from "@/lib/sync-ea-stats-to-player-statistics"

// Create a Supabase client with admin privileges
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  try {
    // Check authorization
    const authHeader = request.headers.get("Authorization")

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing or invalid Authorization header" }, { status: 401 })
    }

    const token = authHeader.split(" ")[1]
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    // Check permissions (must be admin or manager)
    const { data: userRoles } = await supabase.from("users").select("role").eq("id", user.id).single()

    const isAdmin = userRoles?.role === "admin"

    if (!isAdmin) {
      // Check if user is a team manager
      const { data: managerData } = await supabase.from("team_managers").select("id").eq("user_id", user.id)

      if (!managerData || managerData.length === 0) {
        return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
      }
    }

    // Parse the request body
    const body = await request.json()
    const { matchId } = body

    if (!matchId) {
      return NextResponse.json({ error: "Match ID is required" }, { status: 400 })
    }

    // Check if the match exists and has EA data
    const { data: match, error: matchError } = await supabase
      .from("matches")
      .select("id, ea_match_id, status")
      .eq("id", matchId)
      .single()

    if (matchError || !match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 })
    }

    if (!match.ea_match_id) {
      return NextResponse.json({ error: "Match does not have EA data" }, { status: 400 })
    }

    // Make sure the match is completed
    if (match.status !== "Completed") {
      // Update the match status to Completed
      const { error: updateError } = await supabase.from("matches").update({ status: "Completed" }).eq("id", matchId)

      if (updateError) {
        console.error("Error updating match status:", updateError)
        return NextResponse.json({ error: "Failed to update match status" }, { status: 500 })
      }
    }

    // Use the utility function to sync stats
    const syncResult = await syncEaStatsToPlayerStatistics(matchId)

    if (!syncResult.success) {
      return NextResponse.json(
        {
          error: syncResult.message || "Failed to sync player statistics",
          details: syncResult,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: syncResult.message || "Successfully synced player statistics",
      details: syncResult,
    })
  } catch (error: any) {
    console.error("Error syncing player statistics:", error)
    return NextResponse.json({ error: `Failed to sync player statistics: ${error.message}` }, { status: 500 })
  }
}
