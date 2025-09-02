import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })

  // Check if user is authenticated
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { playerId, teamId, bidAmount } = await request.json()

    if (!playerId || !teamId || !bidAmount) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Get the current bidding duration from system settings
    const { data: durationSetting, error: durationError } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", "bidding_duration")
      .single()

    // Default to 14400 seconds (4 hours) if setting not found
    const bidDurationSeconds = durationSetting?.value || 14400

    // Set expiration time based on system setting
    const expirationTime = new Date(Date.now() + bidDurationSeconds * 1000).toISOString()

    const { data, error } = await supabase
      .from("player_bidding")
      .insert({
        player_id: playerId,
        team_id: teamId,
        bid_amount: bidAmount,
        bid_expires_at: expirationTime,
      })
      .select()

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
