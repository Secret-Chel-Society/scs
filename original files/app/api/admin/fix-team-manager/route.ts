import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })

  try {
    // Check if the user is logged in
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Parse the request body
    const { userId, teamId, role } = await request.json()

    if (!userId || !teamId || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check if the current user is an admin
    const { data: adminCheck, error: adminError } = await supabase
      .from("user_roles")
      .select("*")
      .eq("user_id", session.user.id)
      .eq("role", "Admin")

    if (adminError || !adminCheck || adminCheck.length === 0) {
      return NextResponse.json({ error: "Only admins can fix team managers" }, { status: 403 })
    }

    // Insert or update the team manager entry
    const { data, error } = await supabase
      .from("team_managers")
      .upsert({
        user_id: userId,
        team_id: teamId,
        role: role,
      })
      .select()

    if (error) {
      console.error("Error fixing team manager:", error)
      return NextResponse.json({ error: "Failed to fix team manager" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Team manager fixed successfully",
      data,
    })
  } catch (error: any) {
    console.error("Error fixing team manager:", error)
    return NextResponse.json({ error: error.message || "An error occurred" }, { status: 500 })
  }
}
