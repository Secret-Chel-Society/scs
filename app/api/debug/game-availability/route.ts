import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const teamId = searchParams.get("teamId")

    const supabase = createAdminClient()

    console.log("=== GAME AVAILABILITY DEBUG ===")
    console.log("Team ID:", teamId)

    // Check if table exists
    const { data: tableCheck, error: tableError } = await supabase.from("game_availability").select("count(*)").limit(1)

    if (tableError) {
      console.log("Table error:", tableError)
      return NextResponse.json({
        tableExists: false,
        error: tableError.message,
        code: tableError.code,
      })
    }

    console.log("Table exists")

    // Get sample records
    const { data: sampleRecords, error: sampleError } = await supabase.from("game_availability").select("*").limit(5)

    if (sampleError) {
      console.error("Sample records error:", sampleError)
    }

    // Get team-specific records if teamId provided
    let teamRecords: any[] = []
    if (teamId) {
      const { data, error } = await supabase.from("game_availability").select("*").eq("team_id", teamId)

      if (!error) {
        teamRecords = data || []
      }
    }

    // Get team players
    let teamPlayers: any[] = []
    if (teamId) {
      const { data, error } = await supabase
        .from("players")
        .select(`
          id,
          user_id,
          team_id,
          users(id, gamer_tag_id)
        `)
        .eq("team_id", teamId)

      if (!error) {
        teamPlayers = data || []
      }
    }

    // Get team matches
    let teamMatches: any[] = []
    if (teamId) {
      const { data, error } = await supabase
        .from("matches")
        .select("id, match_date, home_team_id, away_team_id, status")
        .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
        .gte("match_date", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .limit(10)

      if (!error) {
        teamMatches = data || []
      }
    }

    return NextResponse.json({
      tableExists: true,
      totalRecords: tableCheck?.[0]?.count || 0,
      sampleRecords: sampleRecords || [],
      teamRecords: teamRecords.length,
      teamPlayers: teamPlayers.map((p) => ({
        player_id: p.id,
        user_id: p.user_id,
        name: p.users?.gamer_tag_id,
      })),
      teamMatches: teamMatches.map((m) => ({
        match_id: m.id,
        date: m.match_date,
        status: m.status,
      })),
      debug: {
        teamId,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error: any) {
    console.error("Debug error:", error)
    return NextResponse.json({
      error: error.message,
      tableExists: false,
    })
  }
}
