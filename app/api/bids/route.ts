import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function POST(request: Request) {
  try {
    // Get Supabase client
    const supabase = createRouteHandlerClient({ cookies })

    // Parse request body
    const { playerId, teamId, bidAmount } = await request.json()

    // Validate input
    if (!playerId || !teamId || !bidAmount) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (bidAmount <= 0) {
      return NextResponse.json({ error: "Bid amount must be positive" }, { status: 400 })
    }

    if (bidAmount < 500000) {
      return NextResponse.json({ error: "Minimum bid amount is $500,000" }, { status: 400 })
    }

    // Check if team already has a bid for this player
    const { data: existingBid, error: existingBidError } = await supabase
      .from("player_bidding")
      .select("id, bid_amount")
      .eq("player_id", playerId)
      .eq("team_id", teamId)
      .in("status", ["Active", null])
      .single()

    // If team has existing bid, they must bid higher
    if (existingBid && bidAmount <= existingBid.bid_amount) {
      return NextResponse.json({ 
        error: `You must bid higher than your current bid of $${existingBid.bid_amount.toLocaleString()}` 
      }, { status: 400 })
    }

    // Set bid expiration (4 hours from now)
    const expirationTime = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString()

    let result

    if (existingBid) {
      // Update existing bid
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
        return NextResponse.json({ error: "Failed to update bid" }, { status: 500 })
      }

      result = { data, updated: true }
    } else {
      // Create new bid
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
        return NextResponse.json({ error: "Failed to create bid" }, { status: 500 })
      }

      result = { data, updated: false }
    }

    return NextResponse.json({ 
      success: true, 
      ...result 
    })

  } catch (error: any) {
    return NextResponse.json({ 
      error: "Internal server error",
      message: error.message 
    }, { status: 500 })
  }
}