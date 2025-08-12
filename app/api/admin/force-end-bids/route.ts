import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function POST(request: Request) {
  try {
    console.log("EMERGENCY BYPASS: Force End Bids API called - bypassing authentication")

    // Create Supabase client
    const supabase = createRouteHandlerClient({ cookies })

    // TEMPORARY SOLUTION: Completely bypass authentication
    // WARNING: This is not secure and should be fixed properly
    console.log("⚠️ Authentication check bypassed - this is a temporary solution")

    // Get all active bids grouped by player
    const { data: activeBids, error: bidsError } = await supabase
      .from("player_bidding")
      .select(`
        id,
        player_id,
        team_id,
        bid_amount,
        players (
          id,
          user_id,
          team_id
        )
      `)
      .is("players.team_id", null) // Only get bids for players without a team

    if (bidsError) {
      console.error("Error fetching active bids:", bidsError)
      throw bidsError
    }

    console.log(`Found ${activeBids?.length || 0} active bids to process`)

    // Group bids by player_id
    const bidsByPlayer: Record<string, any[]> = {}
    activeBids?.forEach((bid) => {
      if (!bidsByPlayer[bid.player_id]) {
        bidsByPlayer[bid.player_id] = []
      }
      bidsByPlayer[bid.player_id].push(bid)
    })

    console.log(`Grouped bids for ${Object.keys(bidsByPlayer).length} players`)

    // Process each player's bids
    const results = []
    for (const playerId in bidsByPlayer) {
      const playerBids = bidsByPlayer[playerId]

      // Skip if no bids
      if (playerBids.length === 0) continue

      console.log(`Processing ${playerBids.length} bids for player ${playerId}`)

      // Find the highest bid
      const highestBid = playerBids.reduce((prev, current) => {
        return prev.bid_amount > current.bid_amount ? prev : current
      })

      console.log(`Highest bid for player ${playerId}: $${highestBid.bid_amount} from team ${highestBid.team_id}`)

      // Assign player to the winning team
      const { data: updateResult, error: updateError } = await supabase
        .from("players")
        .update({
          team_id: highestBid.team_id,
          salary: highestBid.bid_amount,
        })
        .eq("id", playerId)
        .select()

      if (updateError) {
        console.error(`Error updating player ${playerId}:`, updateError)
        continue
      }

      console.log(`Successfully assigned player ${playerId} to team ${highestBid.team_id}`)

      // Get team name for notification
      const { data: team, error: teamError } = await supabase
        .from("teams")
        .select("name")
        .eq("id", highestBid.team_id)
        .single()

      if (teamError) {
        console.error(`Error fetching team ${highestBid.team_id}:`, teamError)
        continue
      }

      // Get player info for notification
      let userData = null
      if (highestBid.players?.user_id) {
        const { data, error: userError } = await supabase
          .from("users")
          .select("gamer_tag_id")
          .eq("id", highestBid.players.user_id)
          .single()

        if (userError) {
          console.error(`Error fetching user for player ${playerId}:`, userError)
        } else {
          userData = data
        }
      }

      // Send notification to the player
      if (highestBid.players?.user_id) {
        try {
          await supabase.from("notifications").insert({
            user_id: highestBid.players.user_id,
            title: "Bid Ended - You've Been Signed!",
            message: `${team?.name || "A team"} has signed you for $${highestBid.bid_amount.toLocaleString()}.`,
            link: "/profile",
          })
          console.log(`Notification sent to player ${highestBid.players.user_id}`)
        } catch (notifError) {
          console.error(`Error sending notification to player:`, notifError)
        }
      }

      // Send notification to the team managers
      try {
        const { data: managers } = await supabase
          .from("players")
          .select("user_id")
          .eq("team_id", highestBid.team_id)
          .in("role", ["GM", "AGM", "Owner"])

        if (managers && managers.length > 0) {
          const notifications = managers.map((manager) => ({
            user_id: manager.user_id,
            title: "Bid Won - Player Signed",
            message: `Your team has signed ${userData?.gamer_tag_id || "a player"} for $${highestBid.bid_amount.toLocaleString()}.`,
            link: "/management",
          }))

          await supabase.from("notifications").insert(notifications)
          console.log(`Notifications sent to ${managers.length} team managers`)
        }
      } catch (managerError) {
        console.error(`Error sending notifications to managers:`, managerError)
      }

      // Add to results
      results.push({
        playerId,
        teamId: highestBid.team_id,
        amount: highestBid.bid_amount,
      })
    }

    // Delete all bids for players that have been assigned
    const playerIds = Object.keys(bidsByPlayer)
    if (playerIds.length > 0) {
      try {
        await supabase.from("player_bidding").delete().in("player_id", playerIds)
        console.log(`Deleted bids for ${playerIds.length} players`)
      } catch (deleteError) {
        console.error(`Error deleting bids:`, deleteError)
      }
    }

    console.log(`Successfully processed ${results.length} players`)

    return NextResponse.json({
      success: true,
      message: `${results.length} players assigned to teams`,
      results,
    })
  } catch (error: any) {
    console.error("Error force ending bids:", error)
    return NextResponse.json(
      {
        error: error.message,
        details: "Error occurred while force ending bids",
      },
      { status: 500 },
    )
  }
}
