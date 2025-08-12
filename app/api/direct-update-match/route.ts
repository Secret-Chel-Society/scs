import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export async function POST(request: Request) {
  try {
    const cookieStore = cookies()
    const supabase = createServerSupabaseClient(cookieStore)

    // Check if user is authenticated
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      console.error("No session found")
      return NextResponse.json({ error: "Unauthorized - No session" }, { status: 401 })
    }

    console.log("User authenticated:", session.user.id)

    // Get request body
    const { matchId, homeScore, awayScore, periodScores, hasOvertime, status } = await request.json()

    if (!matchId) {
      return NextResponse.json({ error: "Match ID is required" }, { status: 400 })
    }

    // Check if user is an admin
    const { data: userData, error: userError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)

    if (userError) {
      console.error("Error checking user roles:", userError)
      return NextResponse.json({ error: "Failed to verify permissions" }, { status: 500 })
    }

    const isAdmin = userData?.some((role) => role.role === "admin" || role.role === "Admin") || false
    console.log("Is admin:", isAdmin, "User roles:", userData)

    if (!isAdmin) {
      return NextResponse.json({ error: "Only admins can use direct update" }, { status: 403 })
    }

    // Prepare the update data
    const updateData = {
      home_score: Number(homeScore),
      away_score: Number(awayScore),
      period_scores: periodScores,
      has_overtime: hasOvertime,
      overtime: hasOvertime,
      status: status,
      updated_at: new Date().toISOString(),
    }

    // Update the match
    const { data: updateResult, error: updateError } = await supabase
      .from("matches")
      .update(updateData)
      .eq("id", matchId)
      .select()

    if (updateError) {
      console.error("Error updating match:", updateError)
      return NextResponse.json({ error: `Failed to update match: ${updateError.message}` }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: updateResult })
  } catch (error: any) {
    console.error("Error in direct update:", error)
    return NextResponse.json({ error: error.message || "An error occurred" }, { status: 500 })
  }
}
