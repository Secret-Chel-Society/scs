// Midnight Studios INTl - All rights reserved
import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const supabase = createAdminClient()
    
    console.log("🧪 Testing bid processing system...")

    // Get a sample active bid
    const { data: activeBids, error: bidsError } = await supabase
      .from("player_bidding")
      .select(`
        *,
        players!player_bidding_player_id_fkey(
          id,
          user_id,
          users!players_user_id_fkey(gamer_tag_id, discord_id)
        ),
        teams!player_bidding_team_id_fkey(id, name, discord_role_id)
      `)
      .eq("status", "Active")
      .not("finalized", "eq", true)
      .limit(1)

    if (bidsError) {
      console.error("❌ Error fetching active bids:", bidsError)
      return NextResponse.json({
        success: false,
        error: `Failed to fetch active bids: ${bidsError.message}`
      }, { status: 500 })
    }

    if (!activeBids || activeBids.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No active bids found to test with",
        testResults: {
          bidsFound: 0,
          functionExists: false,
          canProcess: false
        }
      })
    }

    const testBid = activeBids[0]
    console.log("📋 Testing with bid:", {
      bidId: testBid.id,
      playerId: testBid.player_id,
      teamId: testBid.team_id,
      amount: testBid.bid_amount,
      playerName: testBid.players?.users?.gamer_tag_id,
      teamName: testBid.teams?.name
    })

    // Test if the process_bid_transaction function exists
    let functionExists = false
    try {
      const { data: functionTest, error: functionError } = await supabase.rpc('process_bid_transaction', {
        p_winner_id: testBid.team_id,
        p_winning_amount: testBid.bid_amount,
        p_user_id: testBid.players.user_id,
        p_bid_id: testBid.id,
        p_player_id: testBid.player_id
      })

      if (functionError) {
        console.error("❌ Function test failed:", functionError)
        functionExists = false
      } else {
        console.log("✅ Function test successful:", functionTest)
        functionExists = true
      }
    } catch (error: any) {
      console.error("❌ Function test exception:", error)
      functionExists = false
    }

    // Check current player status
    const { data: playerData, error: playerError } = await supabase
      .from("players")
      .select("*")
      .eq("id", testBid.player_id)
      .single()

    if (playerError) {
      console.error("❌ Error fetching player data:", playerError)
    }

    // Check if player is already on a team
    const { data: currentTeam, error: teamError } = await supabase
      .from("teams")
      .select("name")
      .eq("id", playerData?.team_id)
      .single()

    return NextResponse.json({
      success: true,
      message: "Bid processing test completed",
      testResults: {
        bidsFound: activeBids.length,
        functionExists,
        canProcess: functionExists && testBid.players?.user_id,
        testBid: {
          id: testBid.id,
          playerId: testBid.player_id,
          teamId: testBid.team_id,
          amount: testBid.bid_amount,
          playerName: testBid.players?.users?.gamer_tag_id,
          teamName: testBid.teams?.name,
          currentTeam: currentTeam?.name || "No team",
          currentStatus: playerData?.status || "Unknown"
        }
      }
    })

  } catch (error: any) {
    console.error("❌ Error testing bid processing:", error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
