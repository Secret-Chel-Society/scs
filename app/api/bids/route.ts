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

    // Validate bid amount
    if (bidAmount <= 0) {
      return NextResponse.json({ error: "Bid amount must be positive" }, { status: 400 })
    }

    if (bidAmount < 500000) {
      return NextResponse.json({ error: "Minimum bid amount is $500,000" }, { status: 400 })
    }

    // Check if this team already has an active bid for this player
    const { data: existingBid, error: existingBidError } = await supabase
      .from("player_bidding")
      .select("id, bid_amount, status")
      .eq("player_id", playerId)
      .eq("team_id", teamId)
      .in("status", ["active", null])
      .single()

    if (existingBidError && existingBidError.code !== "PGRST116") {
      throw existingBidError
    }

    // If team already has an active bid, they must bid higher
    if (existingBid && bidAmount <= existingBid.bid_amount) {
      return NextResponse.json({ 
        error: `You must bid higher than your current bid of $${existingBid.bid_amount.toLocaleString()}` 
      }, { status: 400 })
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

    // If team already has a bid, update it instead of creating a new one
    if (existingBid) {
      const { data, error } = await supabase
        .from("player_bidding")
        .update({
          bid_amount: bidAmount,
          bid_expires_at: expirationTime,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingBid.id)
        .select()

      if (error) {
        throw error
      }

      return NextResponse.json({ success: true, data, updated: true })
    } else {
      // Create new bid
      const { data, error } = await supabase
        .from("player_bidding")
        .insert({
          player_id: playerId,
          team_id: teamId,
          bid_amount: bidAmount,
          bid_expires_at: expirationTime,
          status: "active",
        })
        .select()

      if (error) {
        throw error
      }

      return NextResponse.json({ success: true, data, updated: false })
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
