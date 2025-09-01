import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { userId, teamId, role = "Manager" } = await request.json()

    if (!userId || !teamId) {
      return NextResponse.json({ error: "User ID and Team ID are required" }, { status: 400 })
    }

    const supabase = createRouteHandlerClient({ cookies })

    // Check if the user exists
    const { data: userData, error: userError } = await supabase
      .from("auth.users")
      .select("id")
      .eq("id", userId)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: "User not found", details: userError }, { status: 404 })
    }

    // Check if the team exists
    const { data: teamData, error: teamError } = await supabase.from("teams").select("id").eq("id", teamId).single()

    if (teamError || !teamData) {
      return NextResponse.json({ error: "Team not found", details: teamError }, { status: 404 })
    }

    // Check if the entry already exists
    const { data: existingData, error: existingError } = await supabase
      .from("team_managers")
      .select("id")
      .eq("user_id", userId)
      .eq("team_id", teamId)
      .single()

    let result

    if (existingData) {
      // Update the existing entry
      const { data, error } = await supabase
        .from("team_managers")
        .update({ role, updated_at: new Date().toISOString() })
        .eq("id", existingData.id)
        .select()

      if (error) {
        return NextResponse.json({ error: "Failed to update team manager", details: error }, { status: 500 })
      }

      result = { message: "Updated existing team manager entry", data }
    } else {
      // Insert a new entry
      const { data, error } = await supabase
        .from("team_managers")
        .insert({ user_id: userId, team_id: teamId, role })
        .select()

      if (error) {
        return NextResponse.json({ error: "Failed to create team manager", details: error }, { status: 500 })
      }

      result = { message: "Created new team manager entry", data }
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error fixing team manager:", error)
    return NextResponse.json({ error: "Internal server error", details: error }, { status: 500 })
  }
}
