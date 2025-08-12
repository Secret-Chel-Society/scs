import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const teamId = url.searchParams.get("teamId")

    if (!teamId) {
      return NextResponse.json({ error: "Team ID is required" }, { status: 400 })
    }

    const supabase = createRouteHandlerClient({ cookies })

    // Check if user is authenticated
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the team's EA club ID
    const { data: team, error: teamError } = await supabase
      .from("teams")
      .select("id, name, ea_club_id")
      .eq("id", teamId)
      .single()

    if (teamError) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 })
    }

    return NextResponse.json({ eaClubId: team.ea_club_id })
  } catch (error: any) {
    console.error("Error fetching EA club ID:", error)
    return NextResponse.json({ error: error.message || "An error occurred" }, { status: 500 })
  }
}
