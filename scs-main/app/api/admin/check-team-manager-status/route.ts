import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export async function GET(request: Request) {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)

    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ isTeamManager: false, error: "Not authenticated" }, { status: 401 })
    }

    // Get query parameters
    const url = new URL(request.url)
    const teamId = url.searchParams.get("teamId")

    if (!teamId) {
      return NextResponse.json({ isTeamManager: false, error: "Team ID is required" }, { status: 400 })
    }

    // Check if user is a team manager with the required role
    const { data: teamManagerData, error: teamManagerError } = await supabase
      .from("team_managers")
      .select("role")
      .eq("user_id", user.id)
      .eq("team_id", teamId)
      .in("role", ["Owner", "GM", "AGM"])
      .single()

    if (teamManagerError && teamManagerError.code !== "PGRST116") {
      // PGRST116 is "no rows returned" error, which means the user is not a manager
      console.error("Error checking team manager status:", teamManagerError)
      return NextResponse.json({ isTeamManager: false, error: "Error checking team manager status" }, { status: 500 })
    }

    const isTeamManager = !!teamManagerData
    const role = teamManagerData?.role || null

    return NextResponse.json({ isTeamManager, role })
  } catch (error: any) {
    console.error("Error checking team manager status:", error)
    return NextResponse.json({ isTeamManager: false, error: "Error checking team manager status" }, { status: 500 })
  }
}
