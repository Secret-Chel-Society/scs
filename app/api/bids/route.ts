import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Check if user is authenticated
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { playerId, teamId, bidAmount } = await request.json()
    console.log("Bid request received:", { playerId, teamId, bidAmount })

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
    console.log("Checking for existing bid...")
    const { data: existingBid, error: existingBidError } = await supabase
      .from("player_bidding")
      .select("id, bid_amount, status")
      .eq("player_id", playerId)
      .eq("team_id", teamId)
      .in("status", ["Active", null])
      .single()

    if (existingBidError && existingBidError.code !== "PGRST116") {
      console.error("Error checking existing bid:", existingBidError)
      throw existingBidError
    }

    console.log("Existing bid check result:", { existingBid, existingBidError })

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
      console.log("Updating existing bid...")
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
        console.error("Error updating bid:", error)
        throw error
      }

      // Skip notifications for now to avoid database errors
      console.log("Bid updated successfully:", data)

      return NextResponse.json({ success: true, data, updated: true })
    } else {
      // Create new bid
      console.log("Creating new bid...")
      const { data, error } = await supabase
        .from("player_bidding")
        .insert({
          player_id: playerId,
          team_id: teamId,
          bid_amount: bidAmount,
          bid_expires_at: expirationTime,
          status: "Active",
        })
        .select()

      if (error) {
        console.error("Error creating bid:", error)
        throw error
      }

      // Skip notifications for now to avoid database errors
      console.log("Bid created successfully:", data)

      return NextResponse.json({ success: true, data, updated: false })
    }
  } catch (error: any) {
    console.error("API /bids error:", error)
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint
    })
    return NextResponse.json({ 
      error: error.message || "Internal server error",
      details: process.env.NODE_ENV === 'development' ? error : undefined
    }, { status: 500 })
  }
}
