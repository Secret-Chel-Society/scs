import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const { adminKey } = await request.json()

    // Verify admin key
    if (!adminKey || adminKey !== process.env.ADMIN_VERIFICATION_KEY) {
      return NextResponse.json({ error: "Invalid admin key" }, { status: 401 })
    }

    const supabase = createAdminClient()

    // Get all players currently assigned to teams
    const { data: assignedPlayers, error: playersError } = await supabase
      .from("players")
      .select("id, user_id, team_id")
      .not("team_id", "is", null)

    if (playersError) {
      throw playersError
    }

    let updatedBids = 0
    const errors = []

    // For each assigned player, mark their bids as processed
    for (const player of assignedPlayers || []) {
      try {
        // Mark all bids for this player as processed
        const { error: bidUpdateError } = await supabase
          .from("player_bidding")
          .update({
            status: "completed",
            processed: true,
            processed_at: new Date().toISOString(),
          })
          .eq("player_id", player.id)
          .eq("processed", false)

        if (bidUpdateError) {
          errors.push(`Error updating bids for player ${player.id}: ${bidUpdateError.message}`)
        } else {
          // Mark the winning bid for the current team
          const { error: winningBidError } = await supabase
            .from("player_bidding")
            .update({
              won_bid: true,
            })
            .eq("player_id", player.id)
            .eq("team_id", player.team_id)

          if (winningBidError) {
            errors.push(`Error marking winning bid for player ${player.id}: ${winningBidError.message}`)
          }

          updatedBids++
        }
      } catch (error: any) {
        errors.push(`Error processing player ${player.id}: ${error.message}`)
      }
    }

    // Also mark any expired bids as processed
    const { error: expiredBidsError } = await supabase
      .from("player_bidding")
      .update({
        status: "expired",
        processed: true,
        processed_at: new Date().toISOString(),
      })
      .lt("bid_expires_at", new Date().toISOString())
      .eq("processed", false)

    if (expiredBidsError) {
      errors.push(`Error updating expired bids: ${expiredBidsError.message}`)
    }

    return NextResponse.json({
      success: true,
      message: `Fixed bidding assignments for ${updatedBids} players`,
      updatedBids,
      errors: errors.length > 0 ? errors : null,
    })
  } catch (error: any) {
    console.error("Error fixing bidding assignments:", error)
    return NextResponse.json(
      {
        error: "Failed to fix bidding assignments",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
