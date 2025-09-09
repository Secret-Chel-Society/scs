// Midnight Studios INTl - All rights reserved
import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const supabase = createAdminClient()
    
    console.log("🧪 Testing bid processing database function...")

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

    // Check current player status before processing
    const { data: playerBefore, error: playerBeforeError } = await supabase
      .from("players")
      .select("*")
      .eq("id", testBid.player_id)
      .single()

    if (playerBeforeError) {
      console.error("❌ Error fetching player data before:", playerBeforeError)
    }

    console.log("👤 Player before processing:", {
      id: playerBefore?.id,
      teamId: playerBefore?.team_id,
      salary: playerBefore?.salary,
      status: playerBefore?.status
    })

    // Test the process_bid_transaction function
    let functionResult = null
    let functionError = null

    try {
      console.log("🔄 Testing process_bid_transaction function...")
      const { data: transactionResult, error: transactionError } = await supabase.rpc('process_bid_transaction', {
        p_winner_id: testBid.team_id,
        p_winning_amount: testBid.bid_amount,
        p_user_id: testBid.players.user_id,
        p_bid_id: testBid.id,
        p_player_id: testBid.player_id
      })

      if (transactionError) {
        console.error("❌ Function test failed:", transactionError)
        functionError = transactionError.message
      } else {
        console.log("✅ Function test successful:", transactionResult)
        functionResult = transactionResult
      }
    } catch (error: any) {
      console.error("❌ Function test exception:", error)
      functionError = error.message
    }

    // Check player status after processing
    const { data: playerAfter, error: playerAfterError } = await supabase
      .from("players")
      .select("*")
      .eq("id", testBid.player_id)
      .single()

    if (playerAfterError) {
      console.error("❌ Error fetching player data after:", playerAfterError)
    }

    console.log("👤 Player after processing:", {
      id: playerAfter?.id,
      teamId: playerAfter?.team_id,
      salary: playerAfter?.salary,
      status: playerAfter?.status
    })

    // Check if bid was finalized
    const { data: bidAfter, error: bidAfterError } = await supabase
      .from("player_bidding")
      .select("*")
      .eq("id", testBid.id)
      .single()

    if (bidAfterError) {
      console.error("❌ Error fetching bid data after:", bidAfterError)
    }

    console.log("💰 Bid after processing:", {
      id: bidAfter?.id,
      finalized: bidAfter?.finalized,
      status: bidAfter?.status
    })

    return NextResponse.json({
      success: true,
      message: "Bid processing test completed",
      testResults: {
        bidsFound: activeBids.length,
        functionExists: !functionError,
        functionError,
        functionResult,
        playerBefore: {
          id: playerBefore?.id,
          teamId: playerBefore?.team_id,
          salary: playerBefore?.salary,
          status: playerBefore?.status
        },
        playerAfter: {
          id: playerAfter?.id,
          teamId: playerAfter?.team_id,
          salary: playerAfter?.salary,
          status: playerAfter?.status
        },
        bidAfter: {
          id: bidAfter?.id,
          finalized: bidAfter?.finalized,
          status: bidAfter?.status
        },
        testBid: {
          id: testBid.id,
          playerId: testBid.player_id,
          teamId: testBid.team_id,
          amount: testBid.bid_amount,
          playerName: testBid.players?.users?.gamer_tag_id,
          teamName: testBid.teams?.name
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
