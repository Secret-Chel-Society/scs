import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import type { NextRequest } from "next/server"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Check authentication
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      console.error("No session found")
      return NextResponse.json({ error: "Unauthorized - No session" }, { status: 401 })
    }

    // Log the user ID for debugging
    console.log("User ID:", session.user.id)

    // Check for Admin role
    const { data: adminRoleData, error: adminRoleError } = await supabase
      .from("user_roles")
      .select("*")
      .eq("user_id", session.user.id)
      .eq("role", "Admin")

    if (adminRoleError) {
      console.error("Error checking admin role:", adminRoleError)
      return NextResponse.json({ error: "Error checking admin role" }, { status: 500 })
    }

    if (!adminRoleData || adminRoleData.length === 0) {
      console.error("User is not an admin")
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    // Get the team ID from the URL
    const teamId = params.id

    // Get the updated stats from the request body
    const stats = await request.json()

    // Validate required fields
    if (
      typeof stats.wins !== "number" ||
      typeof stats.losses !== "number" ||
      typeof stats.otl !== "number" ||
      typeof stats.goals_for !== "number" ||
      typeof stats.goals_against !== "number"
    ) {
      return NextResponse.json({ error: "Invalid statistics provided" }, { status: 400 })
    }

    // Update the team statistics using the same supabase client
    const { data, error } = await supabase
      .from("teams")
      .update({
        wins: stats.wins,
        losses: stats.losses,
        otl: stats.otl,
        goals_for: stats.goals_for,
        goals_against: stats.goals_against,
        powerplay_goals: stats.powerplay_goals,
        powerplay_opportunities: stats.powerplay_opportunities,
        penalty_kill_goals_against: stats.penalty_kill_goals_against,
        penalty_kill_opportunities: stats.penalty_kill_opportunities,
        manual_override: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", teamId)
      .select()
      .single()

    if (error) {
      console.error("Error updating team statistics:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Team statistics updated successfully",
      team: data,
    })
  } catch (error: any) {
    console.error("Error in update-stats route:", error)
    return NextResponse.json(
      { error: error.message || "An error occurred while updating team statistics" },
      { status: 500 },
    )
  }
}
