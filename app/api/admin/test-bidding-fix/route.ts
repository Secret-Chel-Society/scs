import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  {
    auth: {
      persistSession: false,
    },
  },
)

export async function GET() {
  try {
    console.log("Testing bidding system fix...")

    // Test 1: Check if user_id column exists
    const { data: columns, error: columnsError } = await supabaseAdmin.rpc("exec_sql", {
      sql_query: `
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'player_bidding' 
        AND column_name = 'user_id'
      `,
    })

    if (columnsError) {
      return NextResponse.json({ error: "Failed to check columns" }, { status: 500 })
    }

    // Test 2: Check for bids with missing user_id
    const { data: missingUserIds, error: missingError } = await supabaseAdmin
      .from("player_bidding")
      .select("id, player_id, user_id")
      .is("user_id", null)
      .limit(10)

    if (missingError) {
      return NextResponse.json({ error: "Failed to check missing user_ids" }, { status: 500 })
    }

    // Test 3: Check for unprocessed winning bids
    const { data: unprocessedBids, error: unprocessedError } = await supabaseAdmin
      .from("player_bidding")
      .select(`
        id,
        player_id,
        user_id,
        team_id,
        bid_amount,
        status,
        finalized,
        users!player_bidding_user_id_fkey(gamer_tag_id),
        teams!player_bidding_team_id_fkey(name)
      `)
      .eq("status", "won")
      .eq("finalized", false)
      .limit(10)

    if (unprocessedError) {
      return NextResponse.json({ error: "Failed to check unprocessed bids" }, { status: 500 })
    }

    // Test 4: Check players table for team assignments
    const { data: playersWithoutTeams, error: playersError } = await supabaseAdmin
      .from("players")
      .select(`
        id,
        user_id,
        team_id,
        status,
        salary,
        users!players_user_id_fkey(gamer_tag_id)
      `)
      .is("team_id", null)
      .eq("status", "active")
      .limit(10)

    if (playersError) {
      return NextResponse.json({ error: "Failed to check players" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      tests: {
        user_id_column_exists: columns && columns.length > 0,
        missing_user_ids_count: missingUserIds?.length || 0,
        unprocessed_winning_bids: unprocessedBids || [],
        players_without_teams: playersWithoutTeams || [],
      },
      summary: {
        user_id_column_added: columns && columns.length > 0,
        bids_with_missing_user_id: missingUserIds?.length || 0,
        unprocessed_winning_bids_count: unprocessedBids?.length || 0,
        active_players_without_teams: playersWithoutTeams?.length || 0,
      },
    })
  } catch (error) {
    console.error("Error testing bidding fix:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

