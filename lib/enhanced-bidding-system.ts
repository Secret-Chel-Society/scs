import { createAdminClient } from "./supabase/server"

export interface BidInfo {
  id: string
  player_id: string
  team_id: string
  bid_amount: number
  bid_expires_at: string
  status: string
  finalized: boolean
  time_remaining: string
  teams?: {
    id: string
    name: string
    logo_url?: string
  }
}

export interface PlayerBiddingStatus {
  player_id: string
  current_bid_amount: number
  time_remaining: string
  total_bids: number
  is_active: boolean
  // Note: winning_team information is intentionally excluded for privacy
}

/**
 * Places a bid on a player
 * @param playerId - The ID of the player being bid on
 * @param teamId - The ID of the team placing the bid
 * @param bidAmount - The bid amount
 * @returns Promise with bid result
 */
export async function placeBid(playerId: string, teamId: string, bidAmount: number): Promise<{ success: boolean; bid?: BidInfo; error?: string }> {
  try {
    const supabase = createAdminClient()

    // Check if bidding is enabled
    const { data: biddingSettings, error: settingsError } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", "bidding_enabled")
      .single()

    if (settingsError) {
      console.error("Error checking bidding status:", settingsError)
    }

    if (biddingSettings && biddingSettings.value !== true) {
      return { success: false, error: "Bidding is currently disabled by league administrators" }
    }

    // Get the current bidding duration from system settings
    const { data: durationSetting } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", "bidding_duration")
      .single()

    // Default to 14400 seconds (4 hours) if setting not found
    const bidDurationSeconds = durationSetting?.value ? Number.parseInt(durationSetting.value) : 14400
    const expirationTime = new Date(Date.now() + bidDurationSeconds * 1000).toISOString()

    // Check if there's already an active bid for this player
    const { data: existingBid, error: existingBidError } = await supabase
      .from("player_bidding")
      .select("*")
      .eq("player_id", playerId)
      .eq("status", "active")
      .eq("finalized", false)
      .maybeSingle()

    if (existingBidError) {
      console.error("Error checking existing bid:", existingBidError)
      return { success: false, error: "Failed to check existing bids" }
    }

    let bidData
    if (existingBid) {
      // Update existing bid if this team already has one
      const { data: updatedBid, error: updateError } = await supabase
        .from("player_bidding")
        .update({
          bid_amount: bidAmount,
          bid_expires_at: expirationTime,
          updated_at: new Date().toISOString()
        })
        .eq("id", existingBid.id)
        .eq("team_id", teamId)
        .select()
        .single()

      if (updateError) {
        console.error("Error updating bid:", updateError)
        return { success: false, error: "Failed to update bid" }
      }

      bidData = updatedBid
    } else {
      // Create new bid
      const { data: newBid, error: insertError } = await supabase
        .from("player_bidding")
        .insert({
          player_id: playerId,
          team_id: teamId,
          bid_amount: bidAmount,
          bid_expires_at: expirationTime,
          status: "active",
          finalized: false
        })
        .select()
        .single()

      if (insertError) {
        console.error("Error creating bid:", insertError)
        return { success: false, error: "Failed to create bid" }
      }

      bidData = newBid
    }

    // Add time remaining to the bid data
    const bidWithTimeRemaining = {
      ...bidData,
      time_remaining: formatTimeRemaining(bidData.bid_expires_at)
    }

    return { success: true, bid: bidWithTimeRemaining }
  } catch (error: any) {
    console.error("Error placing bid:", error)
    return { success: false, error: error.message || "An error occurred" }
  }
}

/**
 * Gets current bid information for a player (without revealing winning team)
 * @param playerId - The ID of the player
 * @returns Promise with bid information
 */
export async function getPlayerBidInfo(playerId: string): Promise<{ success: boolean; bidInfo?: PlayerBiddingStatus; error?: string }> {
  try {
    const supabase = createAdminClient()

    // Get current active bid for the player
    const { data: currentBid, error: bidError } = await supabase
      .from("player_bidding")
      .select(`
        *,
        teams:team_id (
          id,
          name,
          logo_url
        )
      `)
      .eq("player_id", playerId)
      .eq("status", "active")
      .eq("finalized", false)
      .maybeSingle()

    if (bidError) {
      console.error("Error fetching current bid:", bidError)
      return { success: false, error: "Failed to fetch bid information" }
    }

    if (!currentBid) {
      return { 
        success: true, 
        bidInfo: {
          player_id: playerId,
          current_bid_amount: 0,
          time_remaining: "No active bid",
          total_bids: 0,
          is_active: false
        }
      }
    }

    // Get total number of bids for this player
    const { data: allBids, error: allBidsError } = await supabase
      .from("player_bidding")
      .select("id")
      .eq("player_id", playerId)
      .eq("status", "active")
      .eq("finalized", false)

    if (allBidsError) {
      console.error("Error fetching all bids:", allBidsError)
    }

    const bidInfo: PlayerBiddingStatus = {
      player_id: playerId,
      current_bid_amount: currentBid.bid_amount,
      time_remaining: formatTimeRemaining(currentBid.bid_expires_at),
      total_bids: allBids?.length || 1,
      is_active: true
    }

    return { success: true, bidInfo }
  } catch (error: any) {
    console.error("Error getting player bid info:", error)
    return { success: false, error: error.message || "An error occurred" }
  }
}

/**
 * Gets all active bids for a team (without revealing other teams' information)
 * @param teamId - The ID of the team
 * @returns Promise with team's bids
 */
export async function getTeamBids(teamId: string): Promise<{ success: boolean; bids?: BidInfo[]; error?: string }> {
  try {
    const supabase = createAdminClient()

    const { data: bids, error } = await supabase
      .from("player_bidding")
      .select(`
        *,
        teams:team_id (
          id,
          name,
          logo_url
        )
      `)
      .eq("team_id", teamId)
      .eq("status", "active")
      .eq("finalized", false)
      .order("bid_expires_at", { ascending: true })

    if (error) {
      console.error("Error fetching team bids:", error)
      return { success: false, error: "Failed to fetch team bids" }
    }

    // Add time remaining to each bid
    const bidsWithTimeRemaining = bids?.map(bid => ({
      ...bid,
      time_remaining: formatTimeRemaining(bid.bid_expires_at)
    })) || []

    return { success: true, bids: bidsWithTimeRemaining }
  } catch (error: any) {
    console.error("Error getting team bids:", error)
    return { success: false, error: error.message || "An error occurred" }
  }
}

/**
 * Processes expired bids and assigns players to winning teams
 * @returns Promise with processing result
 */
export async function processExpiredBids(): Promise<{ success: boolean; processedCount: number; error?: string }> {
  try {
    const supabase = createAdminClient()
    const now = new Date()

    // Get all expired bids that haven't been processed
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
      .lt("bid_expires_at", now.toISOString())
      .order("bid_amount", { ascending: false })

    if (fetchError) {
      console.error("Error fetching expired bids:", fetchError)
      return { success: false, processedCount: 0, error: "Failed to fetch expired bids" }
    }

    if (!expiredBids || expiredBids.length === 0) {
      return { success: true, processedCount: 0 }
    }

    // Group bids by player
    const bidsByPlayer = new Map<string, any[]>()
    expiredBids.forEach((bid) => {
      if (!bidsByPlayer.has(bid.player_id)) {
        bidsByPlayer.set(bid.player_id, [])
      }
      bidsByPlayer.get(bid.player_id)!.push(bid)
    })

    let processedCount = 0

    // Process each player's bids
    for (const [playerId, playerBids] of bidsByPlayer) {
      try {
        // Find the highest bid
        const winningBid = playerBids.reduce((highest, current) =>
          current.bid_amount > highest.bid_amount ? current : highest
        )

        console.log(`Player ${playerId}: Winning bid of $${winningBid.bid_amount} by team ${winningBid.teams?.name}`)

        // Assign player to winning team
        const { error: assignError } = await supabase
          .from("players")
          .update({
            team_id: winningBid.team_id,
            salary: winningBid.bid_amount,
            updated_at: now.toISOString()
          })
          .eq("id", playerId)

        if (assignError) {
          console.error(`Error assigning player ${playerId} to team:`, assignError)
          continue
        }

        // Mark winning bid as won
        const { error: winError } = await supabase
          .from("player_bidding")
          .update({
            status: "won",
            finalized: true,
            updated_at: now.toISOString()
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
              finalized: true,
              updated_at: now.toISOString()
            })
            .in("id", losingBidIds)

          if (loseError) {
            console.error(`Error marking losing bids:`, loseError)
          }
        }

        processedCount++
      } catch (error) {
        console.error(`Error processing bids for player ${playerId}:`, error)
      }
    }

    console.log(`Processed ${processedCount} expired bid groups`)
    return { success: true, processedCount }
  } catch (error: any) {
    console.error("Error processing expired bids:", error)
    return { success: false, processedCount: 0, error: error.message || "An error occurred" }
  }
}

/**
 * Cancels a bid for a team
 * @param bidId - The ID of the bid to cancel
 * @param teamId - The ID of the team canceling the bid
 * @returns Promise with cancellation result
 */
export async function cancelBid(bidId: string, teamId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminClient()

    // Verify the bid belongs to the team
    const { data: bid, error: bidError } = await supabase
      .from("player_bidding")
      .select("*")
      .eq("id", bidId)
      .eq("team_id", teamId)
      .eq("status", "active")
      .eq("finalized", false)
      .single()

    if (bidError || !bid) {
      return { success: false, error: "Bid not found or not authorized to cancel" }
    }

    // Cancel the bid
    const { error: cancelError } = await supabase
      .from("player_bidding")
      .update({
        status: "cancelled",
        finalized: true,
        updated_at: new Date().toISOString()
      })
      .eq("id", bidId)

    if (cancelError) {
      console.error("Error canceling bid:", cancelError)
      return { success: false, error: "Failed to cancel bid" }
    }

    return { success: true }
  } catch (error: any) {
    console.error("Error canceling bid:", error)
    return { success: false, error: error.message || "An error occurred" }
  }
}

/**
 * Formats time remaining until deadline
 * @param deadline - ISO string of the deadline
 * @returns Formatted time string
 */
function formatTimeRemaining(deadline: string): string {
  const now = new Date()
  const deadlineDate = new Date(deadline)
  const diff = deadlineDate.getTime() - now.getTime()

  if (diff <= 0) {
    return "Expired"
  }

  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

  if (hours > 0) {
    return `${hours}h ${minutes}m`
  } else {
    return `${minutes}m`
  }
}

/**
 * Gets bidding statistics for admin purposes
 * @returns Promise with bidding statistics
 */
export async function getBiddingStats(): Promise<{ success: boolean; stats?: any; error?: string }> {
  try {
    const supabase = createAdminClient()

    // Get active bids count
    const { data: activeBids, error: activeError } = await supabase
      .from("player_bidding")
      .select("id")
      .eq("status", "active")
      .eq("finalized", false)

    // Get total bids today
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const { data: todayBids, error: todayError } = await supabase
      .from("player_bidding")
      .select("id")
      .gte("created_at", today.toISOString())

    // Get total value of active bids
    const { data: totalValue, error: valueError } = await supabase
      .from("player_bidding")
      .select("bid_amount")
      .eq("status", "active")
      .eq("finalized", false)

    const stats = {
      activeBids: activeBids?.length || 0,
      todayBids: todayBids?.length || 0,
      totalValue: totalValue?.reduce((sum, bid) => sum + bid.bid_amount, 0) || 0
    }

    return { success: true, stats }
  } catch (error: any) {
    console.error("Error getting bidding stats:", error)
    return { success: false, error: error.message || "An error occurred" }
  }
}
