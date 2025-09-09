// Midnight Studios INTl - All rights reserved
import { createClient } from "@supabase/supabase-js"
import { processBidWinner } from "@/app/actions/bidding"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  {
    auth: {
      persistSession: false,
    },
  },
)

export interface BidProcessingResult {
  success: boolean
  message: string
  processed: number
  errors: string[]
  details: {
    playerId: string
    playerName: string
    winningTeam: string
    winningAmount: number
  }[]
}

/**
 * Automatically processes expired bids and assigns players to winning teams
 */
export async function processExpiredBids(): Promise<BidProcessingResult> {
  const result: BidProcessingResult = {
    success: true,
    message: "",
    processed: 0,
    errors: [],
    details: []
  }

  try {
    console.log("🔄 Starting automatic bid processing...")

    // Get all expired bids that haven't been processed
    const { data: expiredBids, error: bidsError } = await supabaseAdmin
      .from("player_bidding")
      .select(`
        *,
        players!player_bidding_player_id_fkey(
          id,
          user_id,
          users!players_user_id_fkey(id, gamer_tag_id, discord_id)
        ),
        teams!player_bidding_team_id_fkey(id, name, discord_role_id)
      `)
      .lt("bid_expires_at", new Date().toISOString())
      .eq("status", "Active")
      .not("finalized", "eq", true)

    if (bidsError) {
      throw new Error(`Failed to fetch expired bids: ${bidsError.message}`)
    }

    if (!expiredBids || expiredBids.length === 0) {
      result.message = "No expired bids found to process"
      console.log("✅ No expired bids found")
      return result
    }

    console.log(`📊 Found ${expiredBids.length} expired bids to process`)

    // Group bids by player_id to find the highest bidder for each player
    const bidsByPlayer = expiredBids.reduce((acc, bid) => {
      if (!acc[bid.player_id]) {
        acc[bid.player_id] = []
      }
      acc[bid.player_id].push(bid)
      return acc
    }, {} as Record<string, typeof expiredBids>)

    console.log(`👥 Processing bids for ${Object.keys(bidsByPlayer).length} unique players`)

    // Process each player's bids
    for (const [playerId, playerBids] of Object.entries(bidsByPlayer)) {
      try {
        // Find the highest bid for this player
        const highestBid = playerBids.reduce((prev, current) => {
          return current.bid_amount > prev.bid_amount ? current : prev
        })

        const playerName = highestBid.players?.users?.gamer_tag_id || "Unknown Player"
        const teamName = highestBid.teams?.name || "Unknown Team"
        const bidAmount = highestBid.bid_amount

        console.log(`🏆 Processing ${playerName} - highest bid: $${bidAmount.toLocaleString()} from ${teamName}`)

        // Use the existing processBidWinner function for consistency
        const bidResult = await processBidWinner(
          highestBid.id,
          highestBid.team_id,
          highestBid.bid_amount
        )

        if (bidResult.success) {
          console.log(`✅ Successfully processed bid for ${playerName}: ${bidResult.message}`)
          
          // Mark all other bids for this player as "Outbid"
          const otherBids = playerBids.filter(bid => bid.id !== highestBid.id)
          for (const bid of otherBids) {
            const { error: outbidError } = await supabaseAdmin
              .from("player_bidding")
              .update({
                status: "Outbid",
                finalized: true,
                updated_at: new Date().toISOString(),
              })
              .eq("id", bid.id)

            if (outbidError) {
              console.error(`❌ Error marking bid ${bid.id} as outbid:`, outbidError)
              result.errors.push(`Failed to mark bid ${bid.id} as outbid: ${outbidError.message}`)
            }
          }

          result.processed++
          result.details.push({
            playerId,
            playerName,
            winningTeam: teamName,
            winningAmount: bidAmount
          })

          // Send notification to the player
          try {
            await supabaseAdmin.from("notifications").insert({
              user_id: highestBid.players.user_id,
              title: "🎉 Bid Successful - You've Been Signed!",
              message: `Congratulations! ${teamName} has successfully signed you for $${bidAmount.toLocaleString()}. Welcome to the team!`,
              link: "/profile",
            })
            console.log(`📧 Notification sent to ${playerName}`)
          } catch (notificationError) {
            console.error(`❌ Failed to send notification to ${playerName}:`, notificationError)
            result.errors.push(`Failed to send notification to ${playerName}: ${notificationError.message}`)
          }
        } else {
          console.error(`❌ Failed to process bid for ${playerName}: ${bidResult.message}`)
          result.errors.push(`Failed to process bid for ${playerName}: ${bidResult.message}`)
        }
      } catch (error) {
        console.error(`❌ Error processing bids for player ${playerId}:`, error)
        result.errors.push(`Error processing bids for player ${playerId}: ${error.message}`)
      }
    }

    result.message = `Successfully processed ${result.processed} expired bids`
    console.log(`🎯 Bid processing completed. Processed: ${result.processed}, Errors: ${result.errors.length}`)

    return result
  } catch (error) {
    console.error("❌ Error in automatic bid processing:", error)
    result.success = false
    result.message = `Error in automatic bid processing: ${error.message}`
    result.errors.push(error.message)
    return result
  }
}

/**
 * Process a single expired bid manually (for testing or manual intervention)
 */
export async function processSingleExpiredBid(bidId: string): Promise<BidProcessingResult> {
  const result: BidProcessingResult = {
    success: true,
    message: "",
    processed: 0,
    errors: [],
    details: []
  }

  try {
    console.log(`🔄 Processing single bid: ${bidId}`)

    // Get the specific bid
    const { data: bid, error: bidError } = await supabaseAdmin
      .from("player_bidding")
      .select(`
        *,
        players!player_bidding_player_id_fkey(
          id,
          user_id,
          users!players_user_id_fkey(id, gamer_tag_id, discord_id)
        ),
        teams!player_bidding_team_id_fkey(id, name, discord_role_id)
      `)
      .eq("id", bidId)
      .single()

    if (bidError || !bid) {
      throw new Error(`Failed to fetch bid: ${bidError?.message || 'Bid not found'}`)
    }

    const playerName = bid.players?.users?.gamer_tag_id || "Unknown Player"
    const teamName = bid.teams?.name || "Unknown Team"
    const bidAmount = bid.bid_amount

    console.log(`🏆 Processing ${playerName} - bid: $${bidAmount.toLocaleString()} from ${teamName}`)

    // Use the existing processBidWinner function
    const bidResult = await processBidWinner(
      bid.id,
      bid.team_id,
      bid.bid_amount
    )

    if (bidResult.success) {
      console.log(`✅ Successfully processed bid for ${playerName}: ${bidResult.message}`)
      
      result.processed = 1
      result.message = `Successfully processed bid for ${playerName}`
      result.details.push({
        playerId: bid.player_id,
        playerName,
        winningTeam: teamName,
        winningAmount: bidAmount
      })

      // Send notification to the player
      try {
        await supabaseAdmin.from("notifications").insert({
          user_id: bid.players.user_id,
          title: "🎉 Bid Successful - You've Been Signed!",
          message: `Congratulations! ${teamName} has successfully signed you for $${bidAmount.toLocaleString()}. Welcome to the team!`,
          link: "/profile",
        })
        console.log(`📧 Notification sent to ${playerName}`)
      } catch (notificationError) {
        console.error(`❌ Failed to send notification to ${playerName}:`, notificationError)
        result.errors.push(`Failed to send notification to ${playerName}: ${notificationError.message}`)
      }
    } else {
      console.error(`❌ Failed to process bid for ${playerName}: ${bidResult.message}`)
      result.errors.push(`Failed to process bid for ${playerName}: ${bidResult.message}`)
      result.success = false
    }

    return result
  } catch (error) {
    console.error("❌ Error in single bid processing:", error)
    result.success = false
    result.message = `Error processing bid: ${error.message}`
    result.errors.push(error.message)
    return result
  }
}

/**
 * Get statistics about current bidding activity
 */
export async function getBiddingStats() {
  try {
    const now = new Date().toISOString()
    
    // Get active bids
    const { data: activeBids, error: activeError } = await supabaseAdmin
      .from("player_bidding")
      .select(`
        *,
        players!player_bidding_player_id_fkey(
          users!players_user_id_fkey(gamer_tag_id)
        ),
        teams!player_bidding_team_id_fkey(name)
      `)
      .gt("bid_expires_at", now)
      .eq("status", "Active")
      .not("finalized", "eq", true)

    // Get expired bids waiting for processing
    const { data: expiredBids, error: expiredError } = await supabaseAdmin
      .from("player_bidding")
      .select(`
        *,
        players!player_bidding_player_id_fkey(
          users!players_user_id_fkey(gamer_tag_id)
        ),
        teams!player_bidding_team_id_fkey(name)
      `)
      .lt("bid_expires_at", now)
      .eq("status", "Active")
      .not("finalized", "eq", true)

    if (activeError || expiredError) {
      throw new Error(`Failed to fetch bidding stats: ${activeError?.message || expiredError?.message}`)
    }

    return {
      activeBids: activeBids?.length || 0,
      expiredBids: expiredBids?.length || 0,
      totalBids: (activeBids?.length || 0) + (expiredBids?.length || 0),
      activeBidsData: activeBids || [],
      expiredBidsData: expiredBids || []
    }
  } catch (error) {
    console.error("Error fetching bidding stats:", error)
    throw error
  }
}
