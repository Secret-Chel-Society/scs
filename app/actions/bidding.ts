"use server"

import { createAdminClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function processBidWinner(bidId: string, winnerId: string, winningAmount: number) {
  try {
    const supabase = createAdminClient()

    console.log(`Processing bid winner: ${bidId}, winner: ${winnerId}, amount: ${winningAmount}`)

    // Get the bid details
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
      throw new Error(`Failed to get bid details: ${bidError?.message}`)
    }

    // Get the winning team details
    const { data: winningTeam, error: teamError } = await supabase.from("teams").select("*").eq("id", winnerId).single()

    if (teamError || !winningTeam) {
      throw new Error(`Failed to get winning team details: ${teamError?.message}`)
    }

    console.log(`Assigning player ${bid.players?.users?.gamer_tag_id} to team ${winningTeam.name}`)

    // Start a transaction to handle all the updates
    const { error: transactionError } = await supabase.rpc("exec_sql", {
      sql_query: `
        BEGIN;
        
        -- Update the player's team assignment
        UPDATE players 
        SET team_id = '${winnerId}', 
            salary = ${winningAmount},
            status = 'active',
            updated_at = NOW()
        WHERE user_id = '${bid.players.user_id}';
        
        -- Mark the bid as finalized
        UPDATE player_bidding 
        SET finalized = true,
            updated_at = NOW()
        WHERE id = '${bidId}';
        
        -- Remove any other active bids for this player
        UPDATE player_bidding 
        SET finalized = true,
            updated_at = NOW()
        WHERE player_id = '${bid.player_id}' 
        AND id != '${bidId}' 
        AND finalized = false;
        
        COMMIT;
      `,
    })

    if (transactionError) {
      throw new Error(`Transaction failed: ${transactionError.message}`)
    }

    console.log(`Successfully assigned player to team, now syncing Discord roles...`)

    // Sync Discord roles for the player
    if (bid.players?.users?.discord_id) {
      try {
        const discordResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/discord/assign-roles`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: bid.players.user_id,
          }),
        })

        const discordResult = await discordResponse.json()

        if (discordResponse.ok) {
          console.log(`✓ Discord roles synced for ${bid.players.users.gamer_tag_id}:`, discordResult.message)
        } else {
          console.error(`✗ Discord role sync failed for ${bid.players.users.gamer_tag_id}:`, discordResult.error)
        }
      } catch (discordError) {
        console.error(`Discord role sync error for ${bid.players?.users?.gamer_tag_id}:`, discordError)
      }
    } else {
      console.log(`No Discord connection found for ${bid.players?.users?.gamer_tag_id}, skipping role sync`)
    }

    // Revalidate relevant pages
    revalidatePath("/free-agency")
    revalidatePath("/management")
    revalidatePath("/teams")

    return {
      success: true,
      message: `Successfully assigned ${bid.players?.users?.gamer_tag_id} to ${winningTeam.name} for $${winningAmount.toLocaleString()}`,
      playerName: bid.players?.users?.gamer_tag_id,
      teamName: winningTeam.name,
      amount: winningAmount,
    }
  } catch (error: any) {
    console.error("Error processing bid winner:", error)
    return {
      success: false,
      error: error.message,
    }
  }
}

export async function extendBidExpiration(bidId: string, hoursToAdd = 24) {
  try {
    const supabase = createAdminClient()

    const { error } = await supabase
      .from("player_bidding")
      .update({
        bid_expires: new Date(Date.now() + hoursToAdd * 60 * 60 * 1000).toISOString(),
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
      error: error.message,
    }
  }
}

export async function cancelBid(bidId: string) {
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
      error: error.message,
    }
  }
}
