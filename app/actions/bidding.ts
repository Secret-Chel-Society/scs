// Midnight Studios INTl - All rights reserved
"use server"

import { createAdminClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { 
  ProcessBidWinnerResult
} from "@/lib/types/bidding"

const BIDDING_PATHS = [
  "/free-agency",
  "/management",
  "/teams"
];

export async function processBidWinner(
  bidId: string, 
  winnerId: string, 
  winningAmount: number
): Promise<ProcessBidWinnerResult> {
  try {
    const supabase = createAdminClient()

    console.log(`Processing bid winner: ${bidId}, winner: ${winnerId}, amount: ${winningAmount}`)

    // Input validation
    if (!bidId || !winnerId || !winningAmount || winningAmount <= 0) {
      throw new Error("Invalid input parameters");
    }

    // Get the bid details with proper typing
    const { data: bid, error: bidError } = await supabase
      .from("player_bidding")
      .select(`
        *,
        players!player_bidding_player_id_fkey(
          id, 
          user_id,
          users!players_user_id_fkey(gamer_tag_id, discord_id)
        )
      `)
      .eq("id", bidId)
      .single()

    if (bidError || !bid) {
      const errorMessage = `Failed to get bid details: ${bidError?.message || 'Bid not found'}`;
      console.error(errorMessage);
      throw new Error(errorMessage);
    }

    // Type guard for the player data
    if (!bid.players || !bid.players.user_id) {
      const errorMessage = 'Invalid player data in bid';
      console.error(errorMessage);
      throw new Error(errorMessage);
    }

    // Get the winning team details with error handling
    const { data: winningTeam, error: teamError } = await supabase
      .from("teams")
      .select("*")
      .eq("id", winnerId)
      .single()

    if (teamError || !winningTeam) {
      const errorMessage = `Failed to get winning team details: ${teamError?.message || 'Team not found'}`;
      console.error(errorMessage);
      throw new Error(errorMessage);
    }

    console.log(`Assigning player ${bid.players?.users?.gamer_tag_id} to team ${winningTeam.name}`)

    // Start a transaction to handle all the updates
    const { data: transactionResult, error: transactionError } = await supabase.rpc('process_bid_transaction', {
      p_winner_id: winnerId,
      p_winning_amount: winningAmount,
      p_user_id: bid.players.user_id,
      p_bid_id: bidId,
      p_player_id: bid.player_id
    });

    if (transactionError) {
      console.error('Transaction error details:', transactionError);
      throw new Error(`Transaction failed: ${transactionError.message}`);
    }

    console.log(`Successfully assigned player to team, now syncing Discord roles...`)

    // Sync Discord roles for the player (non-blocking)
    if (bid.players?.users?.discord_id) {
      syncDiscordRoles(bid.players.user_id, bid.players.users.gamer_tag_id)
        .catch(error => {
          console.error(`Discord role sync error for ${bid.players?.users?.gamer_tag_id}:`, error);
        });
    } else {
      console.log(`No Discord connection found for ${bid.players?.users?.gamer_tag_id}, skipping role sync`);
    }

    // Revalidate relevant pages in parallel
    await Promise.all(
      BIDDING_PATHS.map(path => revalidatePath(path))
    ).catch(error => {
      console.error('Error during revalidation:', error);
    });

    return {
      success: true,
      message: `Successfully assigned ${bid.players?.users?.gamer_tag_id} to ${winningTeam.name} for $${winningAmount.toLocaleString()}`,
      playerName: bid.players?.users?.gamer_tag_id || '',
      teamName: winningTeam.name,
      amount: winningAmount,
    }
  } catch (error: any) {
    console.error("Error processing bid winner:", error)
    return {
      success: false,
      message: error.message || 'Failed to process bid winner',
      error: error.message,
      playerName: '',
      teamName: '',
      amount: 0
    }
  }
}

// Helper function to sync Discord roles
async function syncDiscordRoles(userId: string, gamerTagId: string): Promise<void> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/discord/assign-roles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });

    const result = await response.json();

    if (response.ok) {
      console.log(`✓ Discord roles synced for ${gamerTagId}:`, result.message);
    } else {
      throw new Error(result.error || 'Unknown error syncing Discord roles');
    }
  } catch (error) {
    console.error(`Discord role sync error for ${gamerTagId}:`, error);
    throw error; // Re-throw to allow caller to handle
  }
}

export async function extendBidExpiration(
  bidId: string, 
  hoursToAdd = 24
): Promise<{ success: boolean; message: string; error?: string }> {
  try {
    const supabase = createAdminClient()

    const { error } = await supabase
      .from("player_bidding")
      .update({
        bid_expires_at: new Date(Date.now() + hoursToAdd * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", bidId)

    if (error) {
      throw new Error(`Failed to extend bid: ${error.message}`)
    }

    revalidatePath("/free-agency")
    revalidatePath("/management")

    return {
      success: true,
      message: `Bid extended by ${hoursToAdd} hours`,
    }
  } catch (error: any) {
    console.error("Error extending bid:", error)
    return {
      success: false,
      message: error.message || 'Failed to extend bid expiration',
      error: error.message
    }
  }
}

export async function cancelBid(
  bidId: string
): Promise<{ success: boolean; message: string; error?: string }> {
  try {
    const supabase = createAdminClient()

    const { error } = await supabase
      .from("player_bidding")
      .update({
        finalized: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", bidId)

    if (error) {
      throw new Error(`Failed to cancel bid: ${error.message}`)
    }

    revalidatePath("/free-agency")
    revalidatePath("/management")

    return {
      success: true,
      message: "Bid cancelled successfully",
    }
  } catch (error: any) {
    console.error("Error cancelling bid:", error)
    return {
      success: false,
      message: error.message || 'Failed to cancel bid',
      error: error.message
    }
  }
}
