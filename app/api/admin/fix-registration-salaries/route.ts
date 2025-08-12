import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export async function POST(request: Request) {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)

    // Get the authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const { data: playerData, error: playerError } = await supabase
      .from("players")
      .select("role")
      .eq("user_id", user.id)
      .single()

    if (playerError || !["Owner", "GM", "AGM"].includes(playerData?.role)) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    // Update all players without a team to have $0 salary
    const { data: updatedPlayers, error: updateError } = await supabase
      .from("players")
      .update({ salary: 0 })
      .is("team_id", null)
      .neq("salary", 0)
      .select("id, salary")

    if (updateError) {
      console.error("Error updating player salaries:", updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Updated ${updatedPlayers?.length || 0} players to have $0 salary`,
      updatedCount: updatedPlayers?.length || 0,
    })
  } catch (error: any) {
    console.error("Error fixing registration salaries:", error)
    return NextResponse.json({ error: error.message || "An error occurred" }, { status: 500 })
  }
}
