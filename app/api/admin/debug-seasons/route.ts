import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Check authentication
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check admin role
    const { data: adminRoleData, error: adminRoleError } = await supabase
      .from("user_roles")
      .select("*")
      .eq("user_id", session.user.id)
      .eq("role", "Admin")

    if (adminRoleError || !adminRoleData || adminRoleData.length === 0) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Get seasons data
    const { data: seasons, error: seasonsError } = await supabase.from("seasons").select("*").order("id")

    if (seasonsError) {
      return NextResponse.json({ error: seasonsError.message }, { status: 500 })
    }

    // Get team awards data for comparison
    const { data: teamAwards, error: teamAwardsError } = await supabase
      .from("team_awards")
      .select("id, season_number")
      .limit(10)

    if (teamAwardsError) {
      return NextResponse.json({ error: teamAwardsError.message }, { status: 500 })
    }

    return NextResponse.json({
      seasons,
      teamAwards,
      message: "Debug data retrieved successfully",
    })
  } catch (error: any) {
    console.error("Error retrieving debug data:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
