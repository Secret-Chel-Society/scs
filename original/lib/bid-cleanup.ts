import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

/**
 * Cancels all active bids for a specific player
 * @param playerId The ID of the player whose bids should be cancelled
 * @returns Promise<boolean> indicating success or failure
 */
export async function cancelPlayerBids(playerId: string): Promise<boolean> {
  try {
    console.log(`Cancelling all bids for player ${playerId}`)

    // Update all active bids for this player to cancelled status
    const { error } = await supabase
      .from("player_bidding")
      .update({
        status: "cancelled",
        updated_at: new Date().toISOString(),
      })
      .eq("player_id", playerId)
      .in("status", ["active", "pending"])

    if (error) {
      console.error("Error cancelling player bids:", error)
      return false
    }

    console.log(`Successfully cancelled all bids for player ${playerId}`)
    return true
  } catch (error) {
    console.error("Unexpected error cancelling player bids:", error)
    return false
  }
}

/**
 * Cleans up expired bids by setting them to expired status
 * @returns Promise<number> number of bids cleaned up
 */
export async function cleanupExpiredBids(): Promise<number> {
  try {
    console.log("Cleaning up expired bids...")

    const now = new Date().toISOString()

    // Update all bids that have expired
    const { data, error } = await supabase
      .from("player_bidding")
      .update({
        status: "expired",
        updated_at: now,
      })
      .eq("status", "active")
      .lt("bid_expires", now)
      .select("id")

    if (error) {
      console.error("Error cleaning up expired bids:", error)
      return 0
    }

    const cleanedCount = data?.length || 0
    console.log(`Cleaned up ${cleanedCount} expired bids`)
    return cleanedCount
  } catch (error) {
    console.error("Unexpected error cleaning up expired bids:", error)
    return 0
  }
}

/**
 * Gets all active bids for a specific player
 * @param playerId The ID of the player
 * @returns Promise<any[]> array of active bids
 */
export async function getActiveBidsForPlayer(playerId: string): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from("player_bidding")
      .select(`
        *,
        teams:team_id (
          id,
          name,
          logo_url
        ),
        users:user_id (
          id,
          username,
          email
        )
      `)
      .eq("player_id", playerId)
      .eq("status", "active")
      .order("current_bid", { ascending: false })

    if (error) {
      console.error("Error fetching active bids:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Unexpected error fetching active bids:", error)
    return []
  }
}

/**
 * Removes a player from their current team
 * @param playerId The ID of the player to remove
 * @returns Promise<boolean> indicating success or failure
 */
export async function removePlayerFromTeam(playerId: string): Promise<boolean> {
  try {
    console.log(`Removing player ${playerId} from their team`)

    // Update the player's team_id to null
    const { error } = await supabase
      .from("season_registrations")
      .update({
        team_id: null,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", playerId)

    if (error) {
      console.error("Error removing player from team:", error)
      return false
    }

    console.log(`Successfully removed player ${playerId} from their team`)
    return true
  } catch (error) {
    console.error("Unexpected error removing player from team:", error)
    return false
  }
}

/**
 * Processes expired bids and assigns players to winning teams
 * @returns Promise<number> number of bids processed
 */
export async function processExpiredBids(): Promise<number> {
  try {
    console.log("Processing expired bids...")

    const now = new Date().toISOString()

    // Get all expired bids that haven't been processed yet
    const { data: expiredBids, error: fetchError } = await supabase
      .from("player_bidding")
      .select(`
        *,
        teams:team_id (
          id,
          name
        )
      `)
      .eq("status", "active")
      .lt("bid_expires", now)
      .order("current_bid", { ascending: false })

    if (fetchError) {
      console.error("Error fetching expired bids:", fetchError)
      return 0
    }

    if (!expiredBids || expiredBids.length === 0) {
      console.log("No expired bids to process")
      return 0
    }

    let processedCount = 0

    // Group bids by player
    const bidsByPlayer = new Map<string, any[]>()
    expiredBids.forEach((bid) => {
      if (!bidsByPlayer.has(bid.player_id)) {
        bidsByPlayer.set(bid.player_id, [])
      }
      bidsByPlayer.get(bid.player_id)!.push(bid)
    })

    // Process each player's bids
    for (const [playerId, playerBids] of bidsByPlayer) {
      // Find the highest bid
      const winningBid = playerBids.reduce((highest, current) =>
        current.current_bid > highest.current_bid ? current : highest,
      )

      console.log(`Player ${playerId}: Winning bid of $${winningBid.current_bid} by team ${winningBid.teams?.name}`)

      // Assign player to winning team
      const { error: assignError } = await supabase
        .from("season_registrations")
        .update({
          team_id: winningBid.team_id,
          salary: winningBid.current_bid,
          updated_at: now,
        })
        .eq("user_id", playerId)

      if (assignError) {
        console.error(`Error assigning player ${playerId} to team:`, assignError)
        continue
      }

      // Mark winning bid as won
      const { error: winError } = await supabase
        .from("player_bidding")
        .update({
          status: "won",
          updated_at: now,
        })
        .eq("id", winningBid.id)

      if (winError) {
        console.error(`Error marking winning bid:`, winError)
      }

      // Mark all other bids for this player as lost
      const losingBidIds = playerBids.filter((bid) => bid.id !== winningBid.id).map((bid) => bid.id)

      if (losingBidIds.length > 0) {
        const { error: loseError } = await supabase
          .from("player_bidding")
          .update({
            status: "lost",
            updated_at: now,
          })
          .in("id", losingBidIds)

        if (loseError) {
          console.error(`Error marking losing bids:`, loseError)
        }
      }

      processedCount++
    }

    console.log(`Processed ${processedCount} expired bid groups`)
    return processedCount
  } catch (error) {
    console.error("Unexpected error processing expired bids:", error)
    return 0
  }
}
