import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function POST(request: Request) {
  try {
    // Get Supabase client
    const supabase = createRouteHandlerClient({ cookies })

    // Check authentication
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    console.log("Session check:", { session: !!session, sessionError, userId: session?.user?.id })
    
    if (sessionError) {
      console.error("Session error:", sessionError)
      return NextResponse.json({ error: "Session error", details: sessionError.message }, { status: 401 })
    }
    
    if (!session) {
      console.log("No session found")
      return NextResponse.json({ error: "No active session" }, { status: 401 })
    }

    // Parse request body
    const { playerId, teamId, bidAmount } = await request.json()
    console.log("Bid request:", { playerId, teamId, bidAmount, userId: session.user.id })

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

    // Get current active season
    console.log("Getting current season...")
    const { data: seasonSetting, error: seasonError } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", "current_season")
      .single()

    let currentSeasonId = 1 // Default fallback
    if (!seasonError && seasonSetting?.value) {
      currentSeasonId = Number.parseInt(seasonSetting.value.toString(), 10)
      if (isNaN(currentSeasonId)) currentSeasonId = 1
    }
    console.log("Current season ID:", currentSeasonId)

    // Verify user owns this team
    const { data: team, error: teamError } = await supabase
      .from("teams")
      .select("id, owner_id")
      .eq("id", teamId)
      .eq("owner_id", session.user.id)
      .single()

    if (teamError || !team) {
      return NextResponse.json({ error: "You can only bid for your own team" }, { status: 403 })
    }

    // Verify the player exists and is available for bidding
    console.log("Checking player availability...")
    const { data: player, error: playerError } = await supabase
      .from("players")
      .select("id, user_id, gamer_tag_id")
      .eq("id", playerId)
      .single()

    if (playerError || !player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 })
    }
    console.log("Player found:", player.gamer_tag_id)

    // Check if team already has a bid for this player
    const { data: existingBid, error: existingBidError } = await supabase
      .from("player_bidding")
      .select("id, bid_amount")
      .eq("player_id", playerId)
      .eq("team_id", teamId)
      .in("status", ["Active", null])
      .single()

    // Handle the case where no existing bid is found (this is normal)
    if (existingBidError && existingBidError.code !== "PGRST116") {
      console.error("Error checking existing bid:", existingBidError)
      return NextResponse.json({ error: "Failed to check existing bids" }, { status: 500 })
    }

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
      console.log("Updating existing bid:", existingBid.id)
      const { data, error } = await supabase
        .from("player_bidding")
        .update({
          bid_amount: bidAmount,
          bid_expires_at: expirationTime,
          updated_at: new Date().toISOString(),
          status: "Active",
        })
        .eq("id", existingBid.id)
        .select()

      if (error) {
        console.error("Error updating bid:", error)
        return NextResponse.json({ 
          error: "Failed to update bid",
          details: error.message 
        }, { status: 500 })
      }

      result = { data, updated: true }
    } else {
      // Create new bid
      console.log("Creating new bid")
      const { data, error } = await supabase
        .from("player_bidding")
        .insert({
          player_id: playerId,
          team_id: teamId,
          bid_amount: bidAmount,
          bid_expires_at: expirationTime,
          status: "Active",
          user_id: session.user.id, // Add user_id for proper tracking
        })
        .select()

      if (error) {
        console.error("Error creating bid:", error)
        return NextResponse.json({ 
          error: "Failed to create bid",
          details: error.message 
        }, { status: 500 })
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