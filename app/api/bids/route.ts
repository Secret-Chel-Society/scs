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
      .in("status", ["Active", null])
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

      // Get player details for notification (simplified query)
      const { data: playerData } = await supabase
        .from("players")
        .select("user_id")
        .eq("id", playerId)
        .single()

      // Send notification to the player about the updated bid
      if (playerData?.user_id) {
        try {
          await supabase.from("notifications").insert({
            user_id: playerData.user_id,
            title: "Bid Updated",
            message: `Your bid has been updated to $${bidAmount.toLocaleString()}.`,
            link: "/free-agency",
          })
        } catch (notificationError) {
          console.error("Notification error:", notificationError)
          // Don't fail the bid if notification fails
        }
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
          status: "Active",
        })
        .select()

      if (error) {
        throw error
      }

      // Get player and team details for notifications (simplified queries)
      const { data: playerData } = await supabase
        .from("players")
        .select("user_id")
        .eq("id", playerId)
        .single()

      const { data: teamData } = await supabase
        .from("teams")
        .select("name")
        .eq("id", teamId)
        .single()

      // Send notification to the player
      if (playerData?.user_id) {
        try {
          await supabase.from("notifications").insert({
            user_id: playerData.user_id,
            title: "New Bid Received",
            message: `${teamData?.name || "A team"} has placed a bid of $${bidAmount.toLocaleString()} for you.`,
            link: "/free-agency",
          })
        } catch (notificationError) {
          console.error("Player notification error:", notificationError)
          // Don't fail the bid if notification fails
        }
      }

      // Check if there are other teams with bids on this player and notify them they're outbid
      try {
        const { data: otherBids } = await supabase
          .from("player_bidding")
          .select("id, team_id, bid_amount")
          .eq("player_id", playerId)
          .neq("team_id", teamId)
          .in("status", ["Active", null])
          .lt("bid_amount", bidAmount)

        // Notify outbid teams (simplified approach)
        if (otherBids && otherBids.length > 0) {
          // Get team managers for outbid teams
          const teamIds = otherBids.map(bid => bid.team_id)
          const { data: teamManagers } = await supabase
            .from("players")
            .select("user_id, team_id")
            .in("team_id", teamIds)
            .in("role", ["GM", "AGM", "Owner"])

          if (teamManagers && teamManagers.length > 0) {
            const outbidNotifications = teamManagers.map(manager => ({
              user_id: manager.user_id,
              title: "You've Been Outbid",
              message: `Your bid has been outbid by ${teamData?.name || "another team"} with $${bidAmount.toLocaleString()}.`,
              link: "/management",
            }))

            await supabase.from("notifications").insert(outbidNotifications)
          }
        }
      } catch (outbidError) {
        console.error("Outbid notification error:", outbidError)
        // Don't fail the bid if outbid notifications fail
      }

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
