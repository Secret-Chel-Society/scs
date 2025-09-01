import { createAdminClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    const supabase = createAdminClient()

    console.log("Starting bid finalization fix...")

    // Fix all existing bids that should be finalized
    const migrationSQL = `
      -- Fix all existing bids that should be finalized
      -- Mark all bids created before 2025-06-25 as finalized
      UPDATE player_bidding 
      SET finalized = TRUE, processed = TRUE
      WHERE created_at < '2025-06-25 00:00:00'::timestamp;

      -- Fix won_bid status by checking actual player assignments
      -- First, reset all won_bid to false
      UPDATE player_bidding SET won_bid = FALSE;

      -- Then set won_bid = TRUE for bids where the player is actually on that team
      UPDATE player_bidding 
      SET won_bid = TRUE 
      FROM players 
      WHERE player_bidding.player_id = players.id 
        AND player_bidding.team_id = players.team_id 
        AND players.team_id IS NOT NULL
        AND player_bidding.status IN ('Won', 'completed');

      -- Mark any remaining processed bids as finalized if they're not already
      UPDATE player_bidding 
      SET finalized = TRUE 
      WHERE processed = TRUE AND finalized = FALSE;

      -- Update status for consistency
      UPDATE player_bidding 
      SET status = 'completed' 
      WHERE status = 'Won' AND processed = TRUE;
    `

    const { error } = await supabase.rpc("exec_sql", { sql_query: migrationSQL })

    if (error) {
      console.error("Migration error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get counts for reporting
    const { data: totalBids } = await supabase.from("player_bidding").select("id", { count: "exact" })

    const { data: finalizedBids } = await supabase
      .from("player_bidding")
      .select("id", { count: "exact" })
      .eq("finalized", true)

    const { data: wonBids } = await supabase.from("player_bidding").select("id", { count: "exact" }).eq("won_bid", true)

    console.log("Bid finalization fix completed")
    console.log(`Total bids: ${totalBids?.length || 0}`)
    console.log(`Finalized bids: ${finalizedBids?.length || 0}`)
    console.log(`Won bids: ${wonBids?.length || 0}`)

    return NextResponse.json({
      success: true,
      message: "Successfully fixed existing bids finalization and won_bid status",
      stats: {
        totalBids: totalBids?.length || 0,
        finalizedBids: finalizedBids?.length || 0,
        wonBids: wonBids?.length || 0,
      },
    })
  } catch (error: any) {
    console.error("Migration error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
